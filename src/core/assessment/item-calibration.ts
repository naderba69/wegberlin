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
