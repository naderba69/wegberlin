/**
 * `writing-review-grounding-gate-v1` — the refusal rules for an optional
 * remote writing review.
 *
 * The local checker is the teacher; the remote model is a consultant asked only
 * about what the local engine could not settle. That role is worthless unless
 * an unusable answer is actually rejected, so every rejection below is enforced
 * in code and covered by tests:
 *
 * - every issue must quote a fragment that really exists in the sent text;
 * - a suggestion that rewrites the whole text is refused (it is a replacement,
 *   not feedback, and the learner loses their own wording);
 * - official score, grade, CEFR rating, pass/fail and 100%-correct wording is
 *   refused because this product cannot issue any of those;
 * - naming more than one exam format is refused, since Goethe and telc tasks
 *   are not interchangeable and the app does not certify either;
 * - anything the model itself marks uncertain, or any unresolved item, forces
 *   `needsHumanReview`, so a learner is never left with an auto-trusted answer.
 */

export const WRITING_REVIEW_GATE_POLICY = "writing-review-grounding-gate-v1" as const;
export const WRITING_REVIEW_GATE_BOUNDARY =
  "grounding-and-scope-refusals-no-official-score-no-exam-format-claim-no-error-free-claim" as const;

/** Share of the learner text a single suggestion may not exceed. */
export const WHOLE_TEXT_REWRITE_RATIO = 0.85;

export type ReviewIssueCandidate = {
  category: string;
  excerpt: string;
  explanationAr: string;
  suggestionDe: string | null;
  confidence: "medium" | "high";
  ruleDe?: string;
  remediationAr?: string;
  needsHumanReview?: boolean;
};

export type ReviewPayloadCandidate = {
  summaryAr: string;
  issues: readonly ReviewIssueCandidate[];
  unresolvedAr: string[];
};

const OFFICIAL_CLAIM_PATTERNS: { pattern: RegExp; labelAr: string }[] = [
  { pattern: /(?:درجة|نتيجة|تقدير)\s*(?:رسمية|الامتحان|نهائية)/u, labelAr: "درجة أو نتيجة رسمية" },
  { pattern: /(?:شهادة|اعتماد|تصديق)\s*(?:رسمي|رسمية|رسميًا)|يعادل[\s\S]{0,20}شهادة/u, labelAr: "ادعاء يعادل شهادة" },
  { pattern: /(?:مستواك|مستوى نصك|تصنيفك)[\s\S]{0,20}\b[A-C][1-3]\b/u, labelAr: "تصنيف مستوى مؤكَّد" },
  { pattern: /(?:نجاح|رسوب|ناجح|راسب)\s*(في|بـ)?\s*(الامتحان|الاختبار)/u, labelAr: "حكم نجاح أو رسوب" },
  { pattern: /\b(?:bestanden|nicht bestanden|Prüfungsergebnis|offizielle (?:Note|Bewertung)|amtliche Bewertung|Zertifikat (?:erhalten|bestanden))\b/iu, labelAr: "حكم امتحان رسمي بالألمانية" },
  { pattern: /\b(?:CEFR|GER)\b[\s\S]{0,40}\b(?:Level|Stufe|Niveau)\b\s*[A-C][1-3]\b/iu, labelAr: "تصنيف إطار مرجعي" },
  { pattern: /\b[A-C][1-3]\b[\s\S]{0,30}\b(?:bestätigt|erreicht|nachgewiesen|bescheinigt)\b/iu, labelAr: "إعلان بلوغ مستوى" },
  { pattern: /(?:100\s*%|تمامًا|بشكل مثالي)[\s\S]{0,24}(?:صحيح|سليم|بدون أخطاء|fehlerfrei)/iu, labelAr: "ادعاء الخلو من الأخطاء" },
  { pattern: /\bfehlerfrei\b|\bohne Fehler\b|\bperfect German\b|\bcertified level\b/iu, labelAr: "ادعاء الخلو من الأخطاء" },
  { pattern: /(?:\d{1,3}\s*(?:\/\s*100|من\s*100|von\s*100|Punkte|punkten))/iu, labelAr: "درجة عددية" },
  { pattern: /(?:Note|Grade|Band)\s*(?:[1-5]|eins|one|واحد)(?![\p{L}\p{N}])/iu, labelAr: "تقدير رقمي" },
  { pattern: /\b(?:you\s+(?:have\s+)?passed|passed\s+the\s+(?:goethe|telc|exam)|exam\s+result)\b|نجحت\s*(?:في|بـ)?\s*(?:الامتحان|الاختبار|بهذا)/iu, labelAr: "حكم نجاح" },
  { pattern: /(?:خالٍ|خالي|خالية)\s+من\s+الأخطاء|لا\s+(?:يوجد|توجد|هناك)\s+أخطاء/u, labelAr: "ادعاء الخلو من الأخطاء" },
];

const EXAM_BRANDS: { name: string; pattern: RegExp }[] = [
  { name: "Goethe", pattern: /\bgoethe\b/iu },
  { name: "telc", pattern: /\btelc\b/iu },
  { name: "ÖSD", pattern: /\bösd\b/iu },
  { name: "TestDaF", pattern: /\btestdaf\b/iu },
  { name: "DSH", pattern: /\bDSH\b/u },
  { name: "OWL", pattern: /\b(?:OWL|OnSet)\b/u },
];

function normalizeForCompare(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("de-DE");
}

function words(value: string): string[] {
  return normalizeForCompare(value).split(/[^\p{L}]+/u).filter(Boolean);
}

function tokenOverlapRatio(a: string, b: string): number {
  const left = new Set(words(a));
  const right = words(b);
  if (!right.length || !left.size) return 0;
  let shared = 0;
  for (const token of right) if (left.has(token)) shared += 1;
  return shared / right.length;
}

export type ReviewGateRejection = {
  code:
    | "excerpt-not-grounded"
    | "whole-text-rewrite"
    | "official-claim"
    | "exam-format-mixing"
    | "confidence-contradiction"
    | "rule-or-remediation-missing-for-high-confidence";
  messageAr: string;
  index: number | null;
};

export type ReviewGateResult = {
  policyVersion: typeof WRITING_REVIEW_GATE_POLICY;
  accepted: boolean;
  rejections: ReviewGateRejection[];
  needsHumanReview: boolean;
  reasonsAr: string[];
  groundedIssueCount: number;
  /** Local rules remain the primary channel; the remote lane can never certify. */
  canClaimErrorFree: false;
  canReplaceOfficialAssessment: false;
  boundary: typeof WRITING_REVIEW_GATE_BOUNDARY;
};

/**
 * Runs every refusal. It never throws, so a caller can show the learner what
 * was rejected instead of losing the review silently.
 */
export function evaluateWritingReviewGate(payload: ReviewPayloadCandidate, sourceText: string): ReviewGateResult {
  const source = normalizeForCompare(sourceText);
  const rejections: ReviewGateRejection[] = [];
  const reasonsAr: string[] = [];
  let grounded = 0;

  payload.issues.forEach((issue, index) => {
    const excerpt = normalizeForCompare(issue.excerpt);
    if (!excerpt || !source.includes(excerpt)) {
      rejections.push({
        code: "excerpt-not-grounded",
        messageAr: "الملاحظة لا تقتبس جزءًا موجودًا حرفيًا في النص المُرسَل، لذا رُفضت.",
        index,
      });
      return;
    }
    grounded += 1;

    // A withheld fix (null) cannot rewrite anything, so it is never a whole-text
    // rejection; the string fallback keeps the detector reading one value.
    const suggestion = issue.suggestionDe ?? "";
    const suggestionIsWholeText =
      suggestion.length > 0 &&
      words(suggestion).length >= 6 &&
      tokenOverlapRatio(source, suggestion) >= WHOLE_TEXT_REWRITE_RATIO &&
      words(suggestion).length >= words(source).length * 0.85;
    if (suggestionIsWholeText) {
      rejections.push({
        code: "whole-text-rewrite",
        messageAr: "اقتراح واحد يعيد كتابة النص كاملًا؛ نرفض الاستبدال لأنك تحتاج ملاحظة على جملتك لا نسخة بديلة.",
        index,
      });
    }

    const claimable = `${issue.explanationAr} ${issue.suggestionDe} ${issue.ruleDe ?? ""}`;
    const claims = OFFICIAL_CLAIM_PATTERNS.filter((entry) => entry.pattern.test(claimable));
    if (claims.length) {
      rejections.push({
        code: "official-claim",
        messageAr: `الملاحظة تتضمن ${claims.map((entry) => entry.labelAr).join("، ")}؛ هذا المنتج لا يصدر أحكامًا رسمية.`,
        index,
      });
    }

    if (issue.confidence === "high" && issue.category === "uncertain") {
      rejections.push({
        code: "confidence-contradiction",
        messageAr: "الملاحظة وُسِمَت بأنها غير مؤكدة مع ثقة عالية؛ لا نعرض تعارضًا كهذا للمتعلم.",
        index,
      });
    }

    if (issue.confidence === "high" && !issue.ruleDe?.trim()) {
      reasonsAr.push("ملاحظة بثقة عالية بلا قاعدة ألمانية مرفقة: تحتاج مراجعة بشرية.");
    }
  });

  // The summary is the most visible line a learner reads, so it is scanned with
  // the same claim patterns as the individual issues. Without this, a review
  // could say "no mistakes here" in the summary while every issue stayed clean.
  const summaryClaims = OFFICIAL_CLAIM_PATTERNS.filter((entry) => entry.pattern.test(payload.summaryAr));
  if (summaryClaims.length) {
    rejections.push({
      code: "official-claim",
      messageAr: `ملخّص المراجعة يتضمن ${summaryClaims.map((entry) => entry.labelAr).join("، ")}؛ هذا المنتج لا يصدر أحكامًا رسمية ولا يقرّر الخلو من الأخطاء.`,
      index: null,
    });
  }

  const brands = EXAM_BRANDS.filter((brand) => {
    const haystack = `${payload.summaryAr} ${payload.issues.map((issue) => `${issue.explanationAr} ${issue.suggestionDe ?? ""}`).join(" ")}`;
    return brand.pattern.test(haystack);
  });
  if (brands.length > 1) {
    rejections.push({
      code: "exam-format-mixing",
      messageAr: `المراجعة خلطت أكثر من صيغة امتحان (${brands.map((brand) => brand.name).join("، ")}). لا ندمج معايير صيغ مختلفة، ولا نُدّعي تحققنا من أي صيغة.`,
      index: null,
    });
  } else if (brands.length === 1) {
    reasonsAr.push(`المراجعة ذكرت صيغة ${brands[0].name}؛ تُعرض كمعلومة عامة فقط، فهذه التهيئة لا تتحقق من متطلبات أي جهة ولا تحتفظ ببيانات format رسمية.`);
  }

  const needsHumanReview =
    rejections.length > 0 ||
    payload.unresolvedAr.length > 0 ||
    payload.issues.some((issue) => issue.confidence !== "high" || issue.category === "uncertain" || issue.needsHumanReview === true) ||
    reasonsAr.length > 0;

  if (payload.unresolvedAr.length) {
    reasonsAr.push("المزود البعيد ترك نقاطًا مفتوحة؛ راجعها مع معلم أو مراجع بشري.");
  }

  return {
    policyVersion: WRITING_REVIEW_GATE_POLICY,
    accepted: rejections.length === 0,
    rejections,
    needsHumanReview,
    reasonsAr,
    groundedIssueCount: grounded,
    canClaimErrorFree: false,
    canReplaceOfficialAssessment: false,
    boundary: WRITING_REVIEW_GATE_BOUNDARY,
  };
}

/** Only grounded, non-rewriting, non-claiming issues may be shown or stored. */
export function acceptedIssues(payload: ReviewPayloadCandidate, sourceText: string): ReviewIssueCandidate[] {
  const result = evaluateWritingReviewGate(payload, sourceText);
  const rejected = new Set(result.rejections.filter((rejection) => rejection.index !== null).map((rejection) => rejection.index));
  return payload.issues.filter((_issue, index) => !rejected.has(index));
}

/** Exact-phrase refusal used by callers that must fail closed instead of filtering. */
export function assertWritingReviewGrounded(payload: ReviewPayloadCandidate, sourceText: string): ReviewGateResult {
  const result = evaluateWritingReviewGate(payload, sourceText);
  const first = result.rejections[0];
  if (first) throw new Error(`رفضنا مراجعة Gemini: ${first.messageAr}`);
  return result;
}
