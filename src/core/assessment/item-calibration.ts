// P2-350: difficulty check from OPTIONAL anonymous response files, run locally.
// The input is a CSV with exactly two columns: itemId,correct. No learner identifiers, names,
// timestamps or device data are accepted. Nothing is sent, stored, or used to change an item,
// a score, a level, or a gate. Output is a teacher's statistical hint for review, not an IRT calibration.

export const ITEM_CALIBRATION_POLICY_VERSION = "anonymous-item-calibration-v1" as const;
export const MIN_RESPONSES_PER_ITEM = 30;
export const MAX_CALIBRATION_ROWS = 50_000;
const HIGH_CUT = 0.9;
const LOW_CUT = 0.2;
const ITEM_ID = /^[A-Za-z0-9._-]{1,80}$/;

export type CalibrationRow = { itemId: string; correct: boolean };

export type CalibrationParseResult = { rows: CalibrationRow[]; errors: string[] };

export function parseAnonymousResponseCsv(text: string): CalibrationParseResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) return { rows: [], errors: ["file-empty"] };
  if (lines[0] !== "itemId,correct") return { rows: [], errors: ["header-must-be-exactly-itemId,correct"] };
  const body = lines.slice(1);
  if (body.length > MAX_CALIBRATION_ROWS) return { rows: [], errors: ["too-many-rows"] };
  const rows: CalibrationRow[] = [];
  body.forEach((line, index) => {
    const parts = line.split(",");
    if (parts.length !== 2) {
      errors.push(`line-${index + 2}-expected-two-columns`);
      return;
    }
    const [itemId, value] = parts.map((part) => part.trim());
    if (!ITEM_ID.test(itemId)) {
      errors.push(`line-${index + 2}-invalid-item-id`);
      return;
    }
    if (value !== "0" && value !== "1") {
      errors.push(`line-${index + 2}-correct-must-be-0-or-1`);
      return;
    }
    rows.push({ itemId, correct: value === "1" });
  });
  return { rows, errors };
}

export type ItemCalibrationBand = "insufficient-data" | "review-very-easy" | "review-very-hard" | "no-flag";

export type ItemCalibration = {
  itemId: string;
  responses: number;
  /** Share of correct answers, two decimals. Null when there are too few responses. */
  pCorrect: number | null;
  band: ItemCalibrationBand;
};

export function calibrateItems(rows: readonly CalibrationRow[]): ItemCalibration[] {
  const tally = new Map<string, { n: number; correct: number }>();
  for (const row of rows) {
    const entry = tally.get(row.itemId) ?? { n: 0, correct: 0 };
    entry.n += 1;
    if (row.correct) entry.correct += 1;
    tally.set(row.itemId, entry);
  }
  return [...tally.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([itemId, { n, correct }]) => {
      if (n < MIN_RESPONSES_PER_ITEM) return { itemId, responses: n, pCorrect: null, band: "insufficient-data" as const };
      const p = Math.round((correct / n) * 100) / 100;
      const band: ItemCalibrationBand = p >= HIGH_CUT ? "review-very-easy" : p <= LOW_CUT ? "review-very-hard" : "no-flag";
      return { itemId, responses: n, pCorrect: p, band };
    });
}

/** نص الحدود المعروض مع كل نتيجة؛ يبقى ثابتًا ليُقرأ كما هو. */
export const ITEM_CALIBRATION_BOUNDARY_AR =
  "تحليل إحصائي أولي على ملف إجابات مجهولة تختاره أنت محليًا. لا يغيّر السؤال ولا الدرجة ولا المستوى، ولا يُرسل إلى أي جهة، ولا يساوي معايرة رسمية.";

// ── Opt-in contribution (P2-350 completion, ADR-120) ────────────────────────────────────────────
// There is no server: "collection" means the learner deliberately downloads a file and hands it to a
// teacher, who pools many such files in the panel above. The file is built by data minimisation:
//  - only `itemId,correct` (no answer text, time, confidence, device, profile or lesson progress);
//  - only the FIRST attempt per item, so one learner contributes at most one row per item and the
//    30-response floor means ≥30 distinct learners per reported item (aggregation / k-anonymity,
//    Art. 29 WP Opinion 05/2014 §3.2.1);
//  - rows shuffled, so the order does not reveal the study sequence.
// Limits, stated rather than hidden: the teacher who receives a file directly knows who sent it, so a
// single file is minimised, not anonymous; anonymity in the sense of GDPR Recital 26 arises only after
// pooling with the sender association discarded, and an item that ALL pooled learners got right or
// wrong still reveals each of their answers (the inference risk k-anonymity does not remove).

export const ANONYMOUS_RESPONSE_EXPORT_POLICY_VERSION = "anonymous-response-export-v1" as const;

export type ExportableAttempt = { exerciseId: string; correct: boolean; createdAt: string };

export function buildAnonymousResponseExport(attempts: readonly ExportableAttempt[], random: () => number = Math.random): { csv: string; rows: number } {
  const first = new Map<string, ExportableAttempt>();
  for (const attempt of [...attempts].sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))) {
    if (!ITEM_ID.test(attempt.exerciseId) || typeof attempt.correct !== "boolean" || first.has(attempt.exerciseId)) continue;
    first.set(attempt.exerciseId, attempt);
  }
  const lines = [...first.values()].map((attempt) => `${attempt.exerciseId},${attempt.correct ? 1 : 0}`);
  for (let index = lines.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [lines[index], lines[swap]] = [lines[swap], lines[index]];
  }
  return { csv: ["itemId,correct", ...lines].join("\n") + "\n", rows: lines.length };
}

/** Pools several contributed files; every file must pass the two-column parser on its own. */
export function parseAnonymousResponseFiles(texts: readonly string[]): CalibrationParseResult {
  const rows: CalibrationRow[] = [];
  const errors: string[] = [];
  texts.forEach((text, index) => {
    const parsed = parseAnonymousResponseCsv(text);
    rows.push(...parsed.rows);
    errors.push(...parsed.errors.map((error) => (texts.length > 1 ? `file-${index + 1}-${error}` : error)));
  });
  if (rows.length > MAX_CALIBRATION_ROWS) return { rows: [], errors: ["too-many-rows"] };
  return { rows, errors };
}

export const ANONYMOUS_RESPONSE_EXPORT_CONSENT_AR =
  "أوافق على تنزيل ملف يحوي لكل سؤال أجبت عنه: رمز السؤال، وهل كانت محاولتي الأولى صحيحة. لا يحوي اسمي ولا نص إجاباتي ولا أوقاتها ولا جهازي، وترتيب أسطره عشوائي. لا يُرسل شيء تلقائيًا؛ أنا من يقرر لمن أعطيه.";
export const ANONYMOUS_RESPONSE_EXPORT_LIMIT_AR =
  "من يستلم ملفك مباشرة يعرف أنه منك؛ لا يصير مجهولًا إلا بعد دمجه مع ملفات ثلاثين متعلمًا على الأقل ونسيان مصدر كل ملف. وإذا أخطأ الجميع أو أصابوا في سؤال، فالنتيجة تكشف إجابة كل واحد فيه.";
