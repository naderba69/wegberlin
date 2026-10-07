import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";
import type { buildLexicalTargetGapAudit } from "./lexical-target-gap";
import { parseCsv, serializeCsv } from "./safe-csv";

type LexicalTargetAudit = ReturnType<typeof buildLexicalTargetGapAudit>;
type ReviewArtifact = { path: string; content: string };
type EvidenceSource = { path: string; stage: string; surface: string; strength: "target" | "context" | "registry" };

const REVIEW_COLUMNS = ["reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"] as const;
export const P099_EXCLUSION_EVIDENCE_NAME_COLUMN = "reviewEvidenceName";
export const P099_EXCLUSION_REVIEW_DOSSIER_PATH = "docs/generated/P099_EXCLUSION_REVIEW_DOSSIER.md";
export const P099_QUALITY_TARGET_REVIEW_SCOPE = "P0-99-original-126-quality-target";
export const P099_ORIGINAL_QUALITY_TARGET_COUNT = 126;
const P099_REASON_LABELS_AR: Record<string, string> = {
  "locative-adjunct": "ظرف مكان لا يحكمه الفعل",
  "separable-particle": "بادئة فعل منفصل",
  "condition-adjunct": "ظرف شرط",
  "purpose-clause": "جملة غاية (um … zu)",
};
export const P099_STRUCTURAL_EXCLUSION_COUNT = 8;

export type P099ExclusionEvidenceReferenceInventory = {
  exclusionCount: number;
  namedReferenceCount: number;
  missingDecisionIds: string[];
  evidenceContentsInspected: false;
  reviewDecisionCellsInspected: false;
  p099ClosureAsserted: false;
};

/** Counts named references only; it never verifies evidence or records a human review. */
export function summarizeP099ExclusionEvidenceReferences(
  content: string,
  expectedDecisionIds: readonly string[],
): P099ExclusionEvidenceReferenceInventory {
  if (expectedDecisionIds.length !== P099_STRUCTURAL_EXCLUSION_COUNT || new Set(expectedDecisionIds).size !== expectedDecisionIds.length) {
    throw new Error(`P0-99 evidence inventory requires exactly ${P099_STRUCTURAL_EXCLUSION_COUNT} unique authored exclusion IDs.`);
  }

  const rows = parseCsv(content);
  if (rows.length === 0) throw new Error("P0-99 evidence inventory CSV has no header row.");
  const [header, ...dataRows] = rows;
  const requiredColumnIndex = (columnName: string) => {
    const indexes = header.flatMap((column, index) => column === columnName ? [index] : []);
    if (indexes.length !== 1) throw new Error(`P0-99 evidence inventory requires exactly one ${columnName} column.`);
    return indexes[0];
  };
  const decisionIdIndex = requiredColumnIndex("decisionId");
  const evidenceNameIndex = requiredColumnIndex(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);
  if (dataRows.length !== expectedDecisionIds.length) {
    throw new Error(`P0-99 evidence inventory expected ${expectedDecisionIds.length} exclusion rows; found ${dataRows.length}.`);
  }
  if (dataRows.some((row) => row.length !== header.length)) throw new Error("P0-99 evidence inventory contains a row with the wrong width.");

  const referencesByDecision = new Map<string, string>();
  for (const row of dataRows) {
    const decisionId = row[decisionIdIndex].trim();
    if (!decisionId || referencesByDecision.has(decisionId)) throw new Error("P0-99 evidence inventory contains a blank or duplicate exclusion ID.");
    referencesByDecision.set(decisionId, row[evidenceNameIndex].trim());
  }
  const expectedIds = new Set(expectedDecisionIds);
  if ([...referencesByDecision.keys()].some((decisionId) => !expectedIds.has(decisionId))
    || expectedDecisionIds.some((decisionId) => !referencesByDecision.has(decisionId))) {
    throw new Error("P0-99 evidence inventory IDs do not match the authored structural exclusions.");
  }

  const missingDecisionIds = expectedDecisionIds.filter((decisionId) => !referencesByDecision.get(decisionId));
  return {
    exclusionCount: expectedDecisionIds.length,
    namedReferenceCount: expectedDecisionIds.length - missingDecisionIds.length,
    missingDecisionIds,
    evidenceContentsInspected: false,
    reviewDecisionCellsInspected: false,
    p099ClosureAsserted: false,
  };
}

/** Values that look like a filed reference but carry no evidence name; they never count as named. */
export const P099_EXCLUSION_PLACEHOLDER_REFERENCES = [
  "-", "--", "?", "tba", "tbd", "to be decided", "to be added", "todo", "none", "unknown", "pending",
  "n/a", "na", "x", "xx", "غير محدد", "لا يوجد", "قيد الانتظار",
] as const;

const P099_PLACEHOLDER_VALUES = new Set<string>(P099_EXCLUSION_PLACEHOLDER_REFERENCES);
const P099_PLACEHOLDER_SYMBOLS = /^(?:x+|[-—?]+)$/u;

/** True only for a non-blank filler value; a blank cell is reported as missing, not as a placeholder. */
export function isP099PlaceholderEvidenceReference(value: string) {
  const normalized = value.trim().replace(/\s+/gu, " ").toLowerCase();
  if (!normalized) return false;
  // A fully wrapped cell is an unfilled template marker such as <evidence> or [دليل], not an evidence name.
  if (/^[<[{].*[>\]}]$/u.test(normalized)) return true;
  const unwrapped = normalized.replace(/^[<[{("'«]+/u, "").replace(/[>\]})"'»]+$/u, "").trim();
  return P099_PLACEHOLDER_VALUES.has(normalized) || P099_PLACEHOLDER_VALUES.has(unwrapped) || P099_PLACEHOLDER_SYMBOLS.test(unwrapped);
}

export type P099ExclusionReviewSlot = {
  decisionId: string;
  evidenceReferenceState: "missing" | "placeholder" | "named";
  reviewStatus: string;
  signatureCellsFilled: number;
  signatureCellsExpected: number;
  readyForIndependentReview: boolean;
};

export type P099ExclusionReviewSlotReport = {
  exclusionCount: number;
  namedReferenceCount: number;
  missingReferenceCount: number;
  placeholderReferenceCount: number;
  missingReferenceDecisionIds: string[];
  placeholderDecisionIds: string[];
  signatureCellsExpected: number;
  signatureCellsFilled: number;
  readyForIndependentReviewCount: number;
  slots: P099ExclusionReviewSlot[];
  evidenceContentsInspected: false;
  reviewDecisionContentsInterpreted: false;
  p099ClosureAsserted: false;
};

/**
 * Presence-only inventory of the eight P0-99 exclusion slots.
 * It never opens evidence, never interprets a decision/reviewer identity, and never asserts closure:
 * a filled name or signature cell is a filing step that still requires independent human review.
 */
export function auditP099ExclusionReviewSlots(
  content: string,
  expectedDecisionIds: readonly string[],
): P099ExclusionReviewSlotReport {
  if (expectedDecisionIds.length !== P099_STRUCTURAL_EXCLUSION_COUNT || new Set(expectedDecisionIds).size !== expectedDecisionIds.length) {
    throw new Error(`P0-99 exclusion slots require exactly ${P099_STRUCTURAL_EXCLUSION_COUNT} unique authored exclusion IDs.`);
  }

  const rows = parseCsv(content);
  if (rows.length === 0) throw new Error("P0-99 exclusion slots CSV has no header row.");
  const [header, ...dataRows] = rows;
  const requiredColumnIndex = (columnName: string) => {
    const indexes = header.flatMap((column, index) => column === columnName ? [index] : []);
    if (indexes.length !== 1) throw new Error(`P0-99 exclusion slots require exactly one ${columnName} column.`);
    return indexes[0];
  };
  const decisionIdIndex = requiredColumnIndex("decisionId");
  const evidenceNameIndex = requiredColumnIndex(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);
  const reviewStatusIndex = requiredColumnIndex("reviewStatus");
  const signatureIndexes = REVIEW_COLUMNS.map((column) => requiredColumnIndex(column));
  if (dataRows.length !== expectedDecisionIds.length) {
    throw new Error(`P0-99 exclusion slots expected ${expectedDecisionIds.length} rows; found ${dataRows.length}.`);
  }
  if (dataRows.some((row) => row.length !== header.length)) throw new Error("P0-99 exclusion slots contain a row with the wrong width.");

  const slots: P099ExclusionReviewSlot[] = [];
  const seen = new Set<string>();
  for (const row of dataRows) {
    const decisionId = row[decisionIdIndex].trim();
    if (!decisionId || seen.has(decisionId)) throw new Error("P0-99 exclusion slots contain a blank or duplicate exclusion ID.");
    if (!expectedDecisionIds.includes(decisionId)) throw new Error("P0-99 exclusion slot IDs do not match the authored structural exclusions.");
    seen.add(decisionId);

    const reference = row[evidenceNameIndex].trim();
    const evidenceReferenceState = !reference ? "missing" : isP099PlaceholderEvidenceReference(reference) ? "placeholder" : "named";
    const reviewStatus = row[reviewStatusIndex].trim();
    const signatureCellsFilled = signatureIndexes.filter((index) => row[index].trim()).length;
    if (signatureCellsFilled > 0 && evidenceReferenceState !== "named") {
      throw new Error(`P0-99 exclusion ${decisionId} carries signature cells without a named evidence reference.`);
    }
    if (signatureCellsFilled > 0 && reviewStatus === "authored-review-pending") {
      throw new Error(`P0-99 exclusion ${decisionId} carries signature cells while still marked ${reviewStatus}; the reviewer record and its status must be updated together.`);
    }
    slots.push({
      decisionId,
      evidenceReferenceState,
      reviewStatus,
      signatureCellsFilled,
      signatureCellsExpected: REVIEW_COLUMNS.length,
      readyForIndependentReview: evidenceReferenceState === "named" && reviewStatus === "authored-review-pending",
    });
  }
  if (expectedDecisionIds.some((decisionId) => !seen.has(decisionId))) {
    throw new Error("P0-99 exclusion slots omitted an authored structural exclusion.");
  }

  const missingReferenceDecisionIds = slots.filter((slot) => slot.evidenceReferenceState === "missing").map((slot) => slot.decisionId);
  const placeholderDecisionIds = slots.filter((slot) => slot.evidenceReferenceState === "placeholder").map((slot) => slot.decisionId);
  return {
    exclusionCount: slots.length,
    namedReferenceCount: slots.filter((slot) => slot.evidenceReferenceState === "named").length,
    missingReferenceCount: missingReferenceDecisionIds.length,
    placeholderReferenceCount: placeholderDecisionIds.length,
    missingReferenceDecisionIds,
    placeholderDecisionIds,
    signatureCellsExpected: slots.length * REVIEW_COLUMNS.length,
    signatureCellsFilled: slots.reduce((total, slot) => total + slot.signatureCellsFilled, 0),
    readyForIndependentReviewCount: slots.filter((slot) => slot.readyForIndependentReview).length,
    slots,
    evidenceContentsInspected: false,
    reviewDecisionContentsInterpreted: false,
    p099ClosureAsserted: false,
  };
}

export function protectedLexicalReviewFields(artifactPath: string): readonly string[] {
  if (artifactPath === "reports/lexical-review-packet/structural-exclusions.csv") {
    return [P099_EXCLUSION_EVIDENCE_NAME_COLUMN, ...REVIEW_COLUMNS];
  }
  return REVIEW_COLUMNS;
}

function shortText(value: string, max = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function reviewEvidence(sources: EvidenceSource[], strengths: EvidenceSource["strength"][], limit: number) {
  const seen = new Set<string>();
  return sources
    .filter((source) => strengths.includes(source.strength))
    .sort((left, right) => {
      const rank = { target: 0, registry: 1, context: 2 };
      return rank[left.strength] - rank[right.strength] || left.path.localeCompare(right.path);
    })
    .filter((source) => {
      const key = `${source.strength}\u0000${source.path}\u0000${source.surface}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((source) => `[${source.strength}/${source.stage}] ${source.path}: ${shortText(source.surface)}`)
    .join(" || ");
}

function sourcesForAnchor<T extends { anchorIds: string[]; sources: EvidenceSource[] }>(rows: T[], anchorId: string) {
  return rows.filter((row) => row.anchorIds.includes(anchorId)).flatMap((row) => row.sources);
}

function levelFromLessonId(lessonId: string) {
  return lessonId.slice(0, 2).toLocaleUpperCase("en-US");
}

export const ORIGINAL_P098_NOUN_TARGET_COUNT = 1297;
export const ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT = 89;
const ORIGINAL_P098_NOUN_SCOPE = "P0-98-original-1297-noun-target";

export function assertOriginalP098NounReviewScope(nounEntries: readonly NounGrammarEntry[], pendingCandidateCount: number) {
  if (nounEntries.length !== ORIGINAL_P098_NOUN_TARGET_COUNT || pendingCandidateCount !== ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT) {
    throw new Error(`Original P0-98 noun scope drifted (expected ${ORIGINAL_P098_NOUN_TARGET_COUNT} anchors / ${ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT} pending candidates; found ${nounEntries.length} / ${pendingCandidateCount}). Review the historical scope before regenerating the packet.`);
  }
}

export const ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL = { A1: 25, A2: 30, B1: 31, B2: 40 } as const;
const ORIGINAL_P099_QUALITY_SCOPE = "P0-99-original-126-quality-target";

function isOriginalP099QualityTarget(entry: VerbPrepositionFrame) {
  const level = levelFromLessonId(entry.lessonId);
  if (level !== "B2") return Object.hasOwn(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL, level);
  const lessonNumber = Number(entry.lessonId.split("-")[1]);
  return Number.isInteger(lessonNumber) && lessonNumber >= 1 && lessonNumber <= 20;
}

export function frameTargetsByLevel(entries: readonly VerbPrepositionFrame[]) {
  const counts: Record<keyof typeof ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
  for (const entry of entries) {
    if (!isOriginalP099QualityTarget(entry)) continue;
    const level = levelFromLessonId(entry.lessonId) as keyof typeof ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL;
    counts[level] += 1;
  }
  return counts;
}

export function assertOriginalP099QualityTargetDistribution(entries: readonly VerbPrepositionFrame[]) {
  const actual = frameTargetsByLevel(entries);
  const levels = Object.keys(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL) as (keyof typeof ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL)[];
  const expectedTotal = levels.reduce((total, level) => total + ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL[level], 0);
  const actualTotal = levels.reduce((total, level) => total + actual[level], 0);
  const expectedDistribution = levels.map((level) => ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL[level]).join("/");
  const actualDistribution = levels.map((level) => actual[level]).join("/");
  if (expectedTotal !== 126 || actualTotal !== 126 || levels.some((level) => actual[level] !== ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL[level])) {
    throw new Error(`Original P0-99 quality scope drifted (expected 126 / ${expectedDistribution}; found ${actualTotal} / ${actualDistribution}). Review the historical scope before regenerating the packet.`);
  }
  return actual;
}

function appendBlankReviewColumns(row: unknown[]) {
  return [...row, ...REVIEW_COLUMNS.map(() => "")];
}

/**
 * Builds a deterministic, unsigned packet for an independent German reviewer.
 * Nothing in this output records a review decision or changes audit status.
 */
/**
 * جرد حضور خانات التوقيع في ورقة الأهداف الـ126 (المرحلة الثانية) — قراءة فقط.
 * لا يفتح محتوى قرار ولا يفسّره ولا يعلن إغلاقًا. يوقف الفحصَ أي توقيع مسجَّل قبل
 * تسمية أدلة الاستبعادات الثمانية: الترتيب جزء من المتطلب، لا تفضيل.
 */
export type P099QualityTargetSlotReport = {
  targetCount: number;
  signedRowCount: number;
  signatureCellsFilled: number;
  signatureCellsExpected: number;
  signedTargetIds: string[];
  byLevel: Record<string, { total: number; signed: number }>;
  stageOneNamedReferenceCount: number;
  blockedByStageOne: boolean;
  evidenceContentsInspected: false;
  reviewDecisionContentsInterpreted: false;
  p099ClosureAsserted: false;
};

export function auditP099QualityTargetReviewSlots(
  content: string,
  stageOneNamedReferenceCount: number,
): P099QualityTargetSlotReport {
  if (!Number.isInteger(stageOneNamedReferenceCount) || stageOneNamedReferenceCount < 0 || stageOneNamedReferenceCount > P099_STRUCTURAL_EXCLUSION_COUNT) {
    throw new Error(`P0-99 quality-target slots require a stage-1 named-reference count between 0 and ${P099_STRUCTURAL_EXCLUSION_COUNT}.`);
  }

  const rows = parseCsv(content);
  if (rows.length === 0) throw new Error("P0-99 quality-target slots CSV has no header row.");
  const [header, ...dataRows] = rows;
  const requiredColumnIndex = (columnName: string) => {
    const indexes = header.flatMap((column, index) => column === columnName ? [index] : []);
    if (indexes.length !== 1) throw new Error(`P0-99 quality-target slots require exactly one ${columnName} column.`);
    return indexes[0];
  };
  const scopeIndex = requiredColumnIndex("reviewScope");
  const targetIdIndex = requiredColumnIndex("anchorId");
  const levelIndex = requiredColumnIndex("level");
  const signatureIndexes = REVIEW_COLUMNS.map((column) => requiredColumnIndex(column));
  if (dataRows.length !== P099_ORIGINAL_QUALITY_TARGET_COUNT) {
    throw new Error(`P0-99 quality-target slots expected ${P099_ORIGINAL_QUALITY_TARGET_COUNT} rows; found ${dataRows.length}.`);
  }
  if (dataRows.some((row) => row.length !== header.length)) throw new Error("P0-99 quality-target slots contain a row with the wrong width.");

  const byLevel: Record<string, { total: number; signed: number }> = {};
  const signedTargetIds: string[] = [];
  const seen = new Set<string>();
  let signatureCellsFilled = 0;
  for (const row of dataRows) {
    const scope = row[scopeIndex].trim();
    if (scope !== ORIGINAL_P099_QUALITY_SCOPE) throw new Error(`P0-99 quality-target slots contain a row outside the original scope (${scope || "empty"}).`);
    const targetId = row[targetIdIndex].trim();
    if (!targetId || seen.has(targetId)) throw new Error("P0-99 quality-target slots contain a blank or duplicate anchor ID.");
    seen.add(targetId);
    const level = row[levelIndex].trim();
    if (!Object.hasOwn(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL, level)) throw new Error(`P0-99 quality-target slots contain an unknown level (${level || "empty"}).`);
    const cellsFilled = signatureIndexes.filter((index) => row[index].trim()).length;
    byLevel[level] = { total: (byLevel[level]?.total ?? 0) + 1, signed: (byLevel[level]?.signed ?? 0) + (cellsFilled > 0 ? 1 : 0) };
    signatureCellsFilled += cellsFilled;
    if (cellsFilled > 0) signedTargetIds.push(targetId);
  }
  for (const [level, expected] of Object.entries(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL)) {
    if (byLevel[level]?.total !== expected) throw new Error(`P0-99 quality-target slots disagree with the original distribution for ${level}: expected ${expected}, found ${byLevel[level]?.total ?? 0}.`);
  }

  const blockedByStageOne = signedTargetIds.length > 0 && stageOneNamedReferenceCount < P099_STRUCTURAL_EXCLUSION_COUNT;
  if (blockedByStageOne) {
    throw new Error(`P0-99 quality-target signatures are recorded (${signedTargetIds.length} row(s)) before the eight exclusion evidence references are named (${stageOneNamedReferenceCount}/${P099_STRUCTURAL_EXCLUSION_COUNT}). The exclusion evidence comes first.`);
  }

  return {
    targetCount: dataRows.length,
    signedRowCount: signedTargetIds.length,
    signatureCellsFilled,
    signatureCellsExpected: dataRows.length * REVIEW_COLUMNS.length,
    signedTargetIds,
    byLevel,
    stageOneNamedReferenceCount,
    blockedByStageOne,
    evidenceContentsInspected: false,
    reviewDecisionContentsInterpreted: false,
    p099ClosureAsserted: false,
  };
}

/**
 * يبني ملف قراءة للاستبعادات الثمانية من صفوف CSV نفسها (لا نسخة ثانية من الحقيقة).
 * حضور فقط: لا يفتح دليلًا، ولا يطبع محتوى خلايا التوقيع، ولا يعلن إغلاقًا.
 */
export function buildP099ExclusionReviewDossier(input: {
  headers: readonly string[];
  rows: readonly (readonly string[])[];
  contentHash: string;
}): string {
  const { headers, rows, contentHash } = input;
  if (rows.length !== P099_STRUCTURAL_EXCLUSION_COUNT) {
    throw new Error(`P0-99 dossier requires exactly ${P099_STRUCTURAL_EXCLUSION_COUNT} exclusion rows; found ${rows.length}.`);
  }
  const column = (name: string) => {
    const indexes = headers.flatMap((header, index) => header === name ? [index] : []);
    if (indexes.length !== 1) throw new Error(`P0-99 dossier requires exactly one ${name} column.`);
    return indexes[0];
  };
  const decisionIdIndex = column("decisionId");
  const lessonIndex = column("lessonId");
  const verbIndex = column("detectedInfinitive");
  const prepositionIndex = column("detectedPreposition");
  const reasonIndex = column("authoredReason");
  const explanationIndex = column("authoredExplanationAr");
  const statusIndex = column("reviewStatus");
  const evidenceIndex = column("detectorEvidence");
  const referenceIndex = column(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);

  const decisionIds = rows.map((row) => row[decisionIdIndex].trim());
  const slots = auditP099ExclusionReviewSlots(serializeCsv(headers, rows), decisionIds);
  const slotByDecision = new Map(slots.slots.map((slot) => [slot.decisionId, slot]));
  const allNamed = slots.namedReferenceCount === slots.exclusionCount;

  const lines: string[] = [
    "# ملف قراءة الاستبعادات البنيوية الثمانية — P0-99",
    "",
    `قراءة فقط: هذا الملف ليس دليلًا، وليس مراجعة، ولا يمنح اعتمادًا ولا يغلق P0-99. بُني من صفوف \`reports/lexical-review-packet/structural-exclusions.csv\` نفسها، وبصمة المحتوى المؤلَّف التي بُني عليها: \`${contentHash}\`.`,
    "",
    `- عدد الاستبعادات: **${slots.exclusionCount}** · أسماء أدلة مسمّاة: **${slots.namedReferenceCount}/${slots.exclusionCount}** · أسماء نائبة: **${slots.placeholderReferenceCount}** · خلايا توقيع ممتلئة (حضور فقط): **${slots.signatureCellsFilled}/${slots.signatureCellsExpected}** · خانات جاهزة لمراجعة مستقلة: **${slots.readyForIndependentReviewCount}**.`,
    "- يُطبع هنا حضور الخلايا فقط: لا يُفتح دليل، ولا يُطبع محتوى قرار مراجع، ولا يُفسَّر حكم. اسم دليل مسجّل لا يثبت وجود الدليل ولا كفايته.",
    allNamed
      ? `- بوابة المرحلة الثانية: تُفتح بعد تسجيل الأسماء الثمانية، ومراجعة صفوف الأهداف الـ${P099_ORIGINAL_QUALITY_TARGET_COUNT} تبقى بشرية مستقلة.`
      : `- بوابة المرحلة الثانية: مغلقة حتى تُسمّى أدلة الاستبعادات الثمانية كلها (المسجَّل الآن ${slots.namedReferenceCount}/${slots.exclusionCount}).`,
    "",
  ];

  rows.forEach((row, index) => {
    const decisionId = row[decisionIdIndex].trim();
    const slot = slotByDecision.get(decisionId);
    if (!slot) throw new Error(`P0-99 dossier slot state missing for ${decisionId}.`);
    const reference = row[referenceIndex].trim();
    const reason = row[reasonIndex].trim();
    const referenceStateAr = slot.evidenceReferenceState === "named"
      ? `مسمّى: ${reference}`
      : slot.evidenceReferenceState === "placeholder"
        ? "اسم نائب لا يُحتسب تسمية"
        : "لم يُسمَّ بعد";
    lines.push(
      `## ${index + 1}. \`${decisionId}\``,
      "",
      `- الدرس: \`${row[lessonIndex].trim()}\` · الفعل/الحرف الملتقط: \`${row[verbIndex].trim()} + ${row[prepositionIndex].trim()}\` · نوع الاستبعاد: ${P099_REASON_LABELS_AR[reason] ?? reason} (\`${reason}\`)`,
      `- سبب التأليف بالعربية: ${row[explanationIndex].trim()}`,
      `- حالة الخانة: ${referenceStateAr} · حالة المراجعة: \`${row[statusIndex].trim()}\` · خلايا توقيع ممتلئة: ${slot.signatureCellsFilled}/${slot.signatureCellsExpected} (المحتوى غير مطبوع وغير مفسَّر)`,
      `- دليل الكشف الآلي (يُفتح كاملًا أثناء المراجعة، وليس حكمًا): ${row[evidenceIndex].trim() || "—"}`,
      "",
      `### ما يلزم لإغلاق خانة \`${decisionId}\``,
      "",
      "1. يتأكد مراجع ألماني مستقل ومؤهل من أن الاستبعاد البنيوي صحيح فعلًا (ليس إطارًا محكومًا بحرف جر).",
      "2. يسجّل اسم دليل المراجعة في عمود `reviewEvidenceName` للصف نفسه (اسم ملف/رابط يمكن التحقق منه).",
      "3. يكتب اسمه وصفته/مؤهله وتاريخ المراجعة، ويشرح في الملاحظة أي تعديل أو استبعاد — في السجل المعتمد لا في ملف مولَّد.",
      "4. لا يُعدّ تسجيل الاسم إغلاقًا: يبقى P0-99 جزئيًا حتى تُراجَع الأهداف الـ126 مراجعة بشرية مستقلة.",
      "",
    );
  });

  lines.push(
    "## بروتوكول الوصول إلى المرحلة الثانية",
    "",
    `- ترتيب العمل ثابت: الاستبعادات الثمانية أولًا، ثم مراجعة جودة صفوف \`frame-quality-targets.csv\` وعددها ${P099_ORIGINAL_QUALITY_TARGET_COUNT} (A1 25 + A2 30 + B1 31 + B2 دروس 01–20 = 40).`,
    "- هذا الملف مولَّد: لا يُعدَّل يدويًا، ولا يُقبل فيه اسم دليل أو توقيع. التعديل يكون في ورقة المراجع ثم في السجل المعتمد، والحارس `npm run content:audit:write` يرفض الكتابة فوق أي اسم أو قرار محفوظ.",
    "- لا يغلق وجود هذا الملف P0-98 أو P0-99، ولا يستبدل المراجعة المستقلة التي يوقّعها إنسان باسمه ومؤهله وتاريخه.",
    "",
    "## حدود صريحة",
    "",
    "لا يوجد في هذا الملف قرار بشري مُسبق، ولا نتيجة قياس لغوي، ولا ضمان أن كل إشارة سياقية فُسرت آليًا على نحو صحيح. غياب اسم الدليل يعني أن الخانة ما زالت فارغة، لا أن الاستبعاد مرفوض.",
    "",
  );
  return lines.join("\n");
}

export function buildLexicalReviewPacketArtifacts(input: {
  audit: LexicalTargetAudit;
  nounEntries: readonly NounGrammarEntry[];
  verbFrames: readonly VerbPrepositionFrame[];
  contentHash: string;
}): ReviewArtifact[] {
  const { audit, nounEntries, verbFrames, contentHash } = input;

  const nounHeaders = [
    "reviewScope", "anchorId", "level", "lessonId", "lemma", "article", "gender", "nominative", "accusative", "dative", "genitive",
    "plural", "dativePlural", "sourceVersion", "targetOrRegistryReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];
  const nounRows = nounEntries.map((entry) => {
    const sources = sourcesForAnchor(audit.nounRows, entry.id);
    return appendBlankReviewColumns([
      ORIGINAL_P098_NOUN_SCOPE,
      entry.id,
      levelFromLessonId(entry.lessonId),
      entry.lessonId,
      entry.lemma,
      entry.article,
      entry.gender,
      entry.caseForms.nominative,
      entry.caseForms.accusative,
      entry.caseForms.dative,
      entry.caseForms.genitive ?? "",
      entry.plural.form ?? "",
      entry.plural.dativeForm ?? "",
      entry.sourceVersion,
      reviewEvidence(sources, ["target", "registry"], 6),
      reviewEvidence(sources, ["context"], 3),
    ]);
  });

  const frameHeaders = [
    "anchorId", "level", "lessonId", "infinitive", "preposition", "authoredGovernedCase", "chunkDe", "exampleDe",
    "sourceVersion", "machineObservedCaseSignalsNotValidation", "targetOrRegistryReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];
  const frameRows = verbFrames.map((entry) => {
    const matchingAuditRows = audit.verbFrameRows.filter((row) => row.anchorIds.includes(entry.id));
    const sources = matchingAuditRows.flatMap((row) => row.sources);
    const observedCases = [...new Set(matchingAuditRows.flatMap((row) => row.observedCases))].sort().join("; ");
    return appendBlankReviewColumns([
      entry.id,
      levelFromLessonId(entry.lessonId),
      entry.lessonId,
      entry.infinitive,
      entry.preposition,
      entry.governedCase,
      entry.chunkDe,
      entry.exampleDe,
      entry.sourceVersion,
      observedCases,
      reviewEvidence(sources, ["target", "registry"], 6),
      reviewEvidence(sources, ["context"], 3),
    ]);
  });
  const originalQualityTargetIds = new Set(verbFrames.filter(isOriginalP099QualityTarget).map((entry) => entry.id));
  const qualityTargetCountsByLevel = frameTargetsByLevel(verbFrames);
  const qualityTargetDistribution = [
    qualityTargetCountsByLevel.A1,
    qualityTargetCountsByLevel.A2,
    qualityTargetCountsByLevel.B1,
    qualityTargetCountsByLevel.B2,
  ].join("/");
  const originalQualityTargetDistribution = [
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.A1,
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.A2,
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.B1,
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.B2,
  ].join("/");
  const qualityFrameHeaders = ["reviewScope", ...frameHeaders];
  const qualityLevelOrder = new Map(["A1", "A2", "B1", "B2"].map((level, index) => [level, index]));
  const qualityFrameRows = frameRows
    .filter((row) => originalQualityTargetIds.has(String(row[0])))
    .sort((left, right) => {
      const levelDifference = (qualityLevelOrder.get(String(left[1])) ?? Number.MAX_SAFE_INTEGER)
        - (qualityLevelOrder.get(String(right[1])) ?? Number.MAX_SAFE_INTEGER);
      const lessonDifference = Number(String(left[2]).split("-")[1]) - Number(String(right[2]).split("-")[1]);
      return levelDifference || lessonDifference || String(left[0]).localeCompare(String(right[0]), "en-US");
    })
    .map((row) => [ORIGINAL_P099_QUALITY_SCOPE, ...row]);

  const nounCandidates = audit.nounRows
    .filter((row) => row.status === "pending-human")
    .map((row) => appendBlankReviewColumns([
      row.id,
      "noun",
      row.level,
      row.lessonId,
      row.lemmaCandidate,
      row.status,
      row.role,
      "",
      reviewEvidence(row.sources, ["target"], 8),
      reviewEvidence(row.sources, ["context"], 3),
    ]));
  const frameCandidates = audit.verbFrameRows
    .filter((row) => row.status === "pending-human")
    .map((row) => appendBlankReviewColumns([
      row.id,
      "verb-preposition-frame",
      row.level,
      row.lessonId,
      `${row.infinitiveCandidate} + ${row.preposition}`,
      row.status,
      row.role,
      row.observedCases.join("; "),
      reviewEvidence(row.sources, ["target"], 8),
      reviewEvidence(row.sources, ["context"], 3),
    ]));
  const candidateHeaders = [
    "candidateId", "candidateType", "level", "lessonId", "candidate", "automatedInventoryStatus", "automatedRole",
    "machineObservedCaseSignalsNotValidation", "targetReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];

  const exclusionHeaders = [
    "decisionId", "lessonId", "detectedInfinitive", "detectedPreposition", "authoredReason", "authoredExplanationAr",
    "reviewStatus", "policyVersion", "detectorEvidence", P099_EXCLUSION_EVIDENCE_NAME_COLUMN, ...REVIEW_COLUMNS,
  ];
  const exclusionRows = audit.exclusionDecisions.map((decision) => {
    const evidence = audit.verbFrameRows.find((row) => row.exclusionDecision?.id === decision.id)?.sources ?? [];
    return [
      decision.id,
      decision.lessonId,
      decision.normalizedVerb,
      decision.preposition,
      decision.reason,
      decision.explanationAr,
      decision.reviewStatus,
      decision.policyVersion,
      reviewEvidence(evidence, ["target", "context"], 5),
      "",
      ...REVIEW_COLUMNS.map(() => ""),
    ];
  });

  const readme = `# حزمة تجهيز المراجعة الألمانية المستقلة — P0-98 / P0-99

هذه حزمة مُولَّدة من السجلات المؤلفة الحالية لتسهيل مراجعة بشرية ألمانية مستقلة. **ليست مراجعة، ولا توقيعًا، ولا دليل اعتماد.** بصمة المحتوى التي بُنيت عليها: \`${contentHash}\`.

## نطاق الصفوف

| الملف | الصفوف (من دون الرأس) | الغرض |
|---|---:|---|
| \`noun-anchors.csv\` | ${nounRows.length} | ورقة عمل P0-98 للنطاق الأصلي: سجلات الاسم المؤلفة الـ1,297؛ راجع أداة التعريف/الجنس، التصريف، الجمع، والسياق الظاهر. |
| \`verb-frames.csv\` | ${frameRows.length} | جرد مرجعي كامل للإطارات المؤلفة الحالية؛ لا يعني أن كل صف هدف مراجعة أو أنه روجع. |
| \`frame-quality-targets.csv\` | ${qualityFrameRows.length} | ورقة العمل الحصرية لنطاق P0-99 الأصلي: التوزيع المتوقع A1/A2/B1/B2 = ${originalQualityTargetDistribution}، والتوزيع الموجود في هذه الورقة = ${qualityTargetDistribution}. |
| \`unresolved-candidates.csv\` | ${nounCandidates.length + frameCandidates.length} (${nounCandidates.length} اسم + ${frameCandidates.length} إطار) | فرز المرشحات آليًا كإشارات غير محسومة؛ أسماء P0-98 الـ89 منفصلة عن سجلات النطاق الـ1,297، ولا تمثل حالة القرار الآلي نتيجة بشرية. |
| \`structural-exclusions.csv\` | ${exclusionRows.length} | المرحلة الأولى لـP0-99: مراجعة الاستبعادات البنيوية المؤلفة وأسبابها وسياق الإشارة. عمود \`reviewEvidenceName\` فارغ لتسمية دليل المراجع لكل استبعاد؛ تبقى جميعها pending حتى يوقّع مراجع مستقل. |

افتح الدرس/المصدر كاملًا عند المراجعة؛ مقتطفات السياق آلية ولا تحل محل الحكم اللغوي. في P0-98، راجع سجلات الاسم الـ1,297 في \`noun-anchors.csv\` وفرز مرشحات الاسم الـ89 المنفصلة في \`unresolved-candidates.csv\`؛ حالة الفرز الآلية ليست قرارًا بشريًا. ترتيب P0-99 ثابت: دليل مراجعة مسمّى للاستبعادات الثمانية أولًا، ثم مراجعة جودة صفوف \`frame-quality-targets.csv\` وعددها 126. يتبع هذا النطاق الأصلي (A1 25 + A2 30 + B1 31 + B2 دروس 01–20 عددها 40). ملف \`verb-frames.csv\` يسرد جميع المراجع المؤلفة الـ134؛ الإطارات الثمانية في B2-21…B2-24 مراجع سياقية خارج هدف الجودة الأصلي، ولا تجعل 134 عددًا للإطارات المطلوب مراجعتها. لا تسجل قرارًا قبل مراجعة بشرية فعلية وفق P0_AUDIT.md. يحرس \`content:audit\` نطاق P0-98 (1,297 سجلًا و89 مرشح اسم) وتوزيع P0-99، ويوقف إعادة التوليد عند الانحراف؛ هذا فحص نطاق آلي لا مراجعة بشرية.

## بروتوكول التوقيع

- أعمدة \`reviewDecision\`, \`reviewerName\`, \`reviewerQualification\`, \`reviewDate\`, و\`reviewerNote\` فارغة عمدًا ومحمية باختبارات؛ لا يملؤها مولّد أو نموذج.
- في \`structural-exclusions.csv\`، عمود \`reviewEvidenceName\` فارغ لتسجيل اسم دليل المراجعة لكل استبعاد من الثمانية؛ يجب تسمية الدليل والتحقق منه قبل الانتقال إلى مراجعة جودة الأهداف الـ126. لا تعدّ المراجع الآلية أو وجود هذا الحقل دليلًا بشريًا.
- يعرض \`npm run p099:evidence:status\` عدد أسماء المراجع الناقصة فقط، ولا يفتح دليلًا أو يتحقق من محتواه؛ تبقى المراجعة المستقلة مطلوبة حتى لو امتلأت الأسماء الثمانية.\n- لكل استبعاد صفحة قراءة في \`docs/generated/P099_EXCLUSION_REVIEW_DOSSIER.md\` مولَّدة من الصفوف نفسها: تعرض السبب ودليل الكشف وحالة الخانة، ولا تطبع محتوى قرار ولا تمنح اعتمادًا.\n- تُقرأ ورقة الأهداف الـ126 حضورًا فقط: أي خلية توقيع مسجَّلة فيها قبل تسمية أدلة الاستبعادات الثمانية توقف الفاحص (ترتيب إلزامي)، ولا يُفسَّر محتوى أي قرار ولا يُعلن إغلاق.
- يفصل الفاحص نفسه بين غياب الاسم واسم نائب (TODO / n/a / <دليل>) وبين خلايا التوقيع: الاسم النائب لا يُعدّ تسمية، ووجود أي خلية توقيع في صف ما زال \`authored-review-pending\` يوقف الفاحص بدل أن يُقرأ كإغلاق. لا يُفتح محتوى الدليل ولا يُفسَّر محتوى القرار.
- لا تعدّل الملفات المولدة في هذا المجلد بوصفها توقيعًا. انسخ ورقة العمل لاستقبال ملاحظات المراجع، ثم تُنقل القرارات المسمّاة والمؤرخة إلى سجل المراجعة المعتمد بعد مراجعة المالك.
- يرفض \`npm run content:audit:write\` إعادة كتابة CSV إذا امتلأ أي حقل قرار/هوية/صفة/اسم دليل/تاريخ/ملاحظة أو تعذّر فحصه بأمان (اقتباس غير سليم، صف بعرض مختلف، أو عمود توقيع مطلوب مفقود أو مكرر)؛ انسخ المدخلات الموقعة واحفظها في السجل المعتمد. هذا الحارس يمنع فقد البيانات فقط ولا يثبت مراجعة.
- يجب أن يراجع شخص مستقل مؤهل في الألمانية البيانات والسياق، ويسجل اسمه وصفته/مؤهله وتاريخ المراجعة. فسّر أي تعديل أو استبعاد في الملاحظة.
- لا يغلق وجود هذه الحزمة P0-98 أو P0-99. يظلان جزئيين حتى تُستكمل المراجعة المستقلة وتُسجّل قراراتها صراحةً في السجل الحاكم.

## حدود البيانات

الملفات تشمل حقولًا آلية ومرشحات لتوجيه المراجع فقط. لا يوجد فيها قرار مراجعة بشري مُسبق، ولا نتيجة صفية/لغوية مُقاسة، ولا ضمان أن كل إشارة سياقية فُسرت تلقائيًا على نحو صحيح.
`;

  const dossier = buildP099ExclusionReviewDossier({ headers: exclusionHeaders, rows: exclusionRows, contentHash });

  return [
    { path: "reports/lexical-review-packet/README.md", content: readme },
    { path: P099_EXCLUSION_REVIEW_DOSSIER_PATH, content: dossier },
    { path: "reports/lexical-review-packet/noun-anchors.csv", content: serializeCsv(nounHeaders, nounRows) },
    { path: "reports/lexical-review-packet/verb-frames.csv", content: serializeCsv(frameHeaders, frameRows) },
    { path: "reports/lexical-review-packet/frame-quality-targets.csv", content: serializeCsv(qualityFrameHeaders, qualityFrameRows) },
    { path: "reports/lexical-review-packet/unresolved-candidates.csv", content: serializeCsv(candidateHeaders, [...nounCandidates, ...frameCandidates]) },
    { path: "reports/lexical-review-packet/structural-exclusions.csv", content: serializeCsv(exclusionHeaders, exclusionRows) },
  ];
}
