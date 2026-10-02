import type { ExternalEvaluationVerificationRow } from "@/types/learning";

/**
 * التحقّق من تقييم خارجي ملصوق (P2-216 نصفه الثاني، ADR-089).
 *
 * الحزمة (`external-evaluator-packet-v1`) تعطي المراجع الخارجي نصًّا ليصوغ ردّه. هنا نتحقّق
 * من الردّ الملصوق قبل أن يتحوّل ملاحظة. الفرق بين الدرجتين مقصود:
 *  - **مانع**: لصق فارغ أو غير قابل للقراءة أو نصّ المتعلّم نفسه ⇒ لا يُحفظ شيء.
 *  - **غير مانع**: دعوى نتيجة/درجة/شهادة · صدى حزمة الطلب · بلا اسم مراجع · قِدَم > 180 يومًا
 *    ⇒ يُحفظ النصّ **كملاحظة** ويُرفض **الادعاء**: إهدار ملاحظة صحيحة أسوأ من وسم صفّ.
 *
 * ولماذا لا يُرفض اللصق كلّه عند أي عبارة رسمية (تصحيح داخل البند): الرفض الكلّي كان يُسقط
 * تعليقًا حقيقيًا من مراجع حقيقي، وكان يناقض العقد الذي يبنيه نصف الحزمة أصلًا.
 */
export const EXTERNAL_EVALUATION_VERIFICATION_POLICY = "external-evaluation-unverified-evidence-v1" as const;
export const EXTERNAL_EVALUATION_TRUST = "self-reported-unverified-evidence" as const;
export const APP_CAN_AUTHENTICATE_REVIEWER = false as const;
export const EXTERNAL_EVALUATION_MAX_AGE_DAYS = 180;
export const EXTERNAL_EVALUATION_SELF_TEXT_OVERLAP = 0.8;
export const EXTERNAL_EVALUATION_SELF_OVERLAP_RATIO = EXTERNAL_EVALUATION_SELF_TEXT_OVERLAP;
export const EXTERNAL_EVALUATION_SELF_OVERLAP_MIN_TOKENS = 6;
export const EXTERNAL_EVALUATION_PACKET_ECHO_RATIO = 0.8;

export type ExternalEvaluationCheckId =
  | "empty-paste"
  | "unreadable-paste"
  | "learner-self-overlap"
  | "official-result-claim"
  | "certificate-or-level-claim"
  | "packet-echo"
  | "unnamed-reviewer"
  | "stale-over-180-days";

export type ExternalEvaluationCheckTier = "blocking" | "rejects-claim";

export type ExternalEvaluationCheck = {
  id: ExternalEvaluationCheckId;
  tier: ExternalEvaluationCheckTier;
  labelAr: string;
};

/** الفحوص الثمانية: ثلاثة مانعة وخمسة تُبطل الادعاء وتُبقي الملاحظة. */
export const EXTERNAL_EVALUATION_CHECKS: readonly ExternalEvaluationCheck[] = [
  { id: "empty-paste", tier: "blocking", labelAr: "لصق فارغ" },
  { id: "unreadable-paste", tier: "blocking", labelAr: "نصّ غير قابل للقراءة" },
  { id: "learner-self-overlap", tier: "blocking", labelAr: "نصّ المتعلّم نفسه (تطابق ≥ 80%)" },
  { id: "official-result-claim", tier: "rejects-claim", labelAr: "دعوى نتيجة أو درجة" },
  { id: "certificate-or-level-claim", tier: "rejects-claim", labelAr: "دعوى شهادة أو مستوى" },
  { id: "packet-echo", tier: "rejects-claim", labelAr: "صدى حزمة الطلب" },
  { id: "unnamed-reviewer", tier: "rejects-claim", labelAr: "بلا اسم مراجع" },
  { id: "stale-over-180-days", tier: "rejects-claim", labelAr: "قِدَم أكبر من 180 يومًا" },
] as const;

export type ExternalEvaluationVerdict = "blocked" | "stored-with-rejected-claim" | "usable";

export type ExternalEvaluationVerification = {
  policyVersion: typeof EXTERNAL_EVALUATION_VERIFICATION_POLICY;
  verdict: ExternalEvaluationVerdict;
  trust: typeof EXTERNAL_EVALUATION_TRUST;
  appCanAuthenticateReviewer: typeof APP_CAN_AUTHENTICATE_REVIEWER;
  usableAsUnverifiedEvidence: boolean;
  /** لا بوابة مستوى ولا درجة امتحان تقرأ هذه الصفوف: العَلمان مكتوبان في الحكم نفسه. */
  countsTowardLevelGate: false;
  countsAsExamScore: false;
  blockingChecks: ExternalEvaluationCheckId[];
  rejectedClaimChecks: ExternalEvaluationCheckId[];
  reasonsAr: string[];
};

export type ExternalEvaluationVerificationInput = {
  raw: string;
  learnerText: string;
  reviewerLabel: string;
  receivedAt: string;
  packetText?: string;
  now?: Date;
};

const RESULT_CLAIM_PATTERNS = [
  /note\s*\d/i,
  /punkt(?:e|zahl)/i,
  /ergebnis/i,
  /bestanden/i,
  /nicht\s+bestanden/i,
  /bewertung\s*:/i,
  /\b(?:درجة|نتيجة|معدّل|معدل|نجح|رسب)\b/,
  /\b\d{1,3}\s*(?:%|von\s*100)\b/,
];

const CERTIFICATE_CLAIM_PATTERNS = [
  /zertifikat/i,
  /bescheinigung/i,
  /sprachnachweis/i,
  /niveau\s*(?:a1|a2|b1|b2)/i,
  /\b(?:شهادة|إفادة|مستوى\s*(?:a1|a2|b1|b2))\b/i,
];

function tokens(text: string) {
  return text
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function overlapRatio(text: string, reference: string) {
  const own = new Set(tokens(text));
  if (own.size === 0) return 0;
  const others = new Set(tokens(reference));
  let shared = 0;
  for (const token of own) if (others.has(token)) shared += 1;
  return shared / own.size;
}

function hasReadableLetters(text: string) {
  return /\p{L}/u.test(text);
}

function ageInDays(receivedAt: string, now: Date) {
  const parsed = Date.parse(receivedAt);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - parsed) / 86_400_000;
}

/** المانع لا يُحفظ معه شيء؛ غير المانع يُبقي الملاحظة ويُبطل الادعاء. */
export function verifyExternalEvaluation(input: ExternalEvaluationVerificationInput): ExternalEvaluationVerification {
  const raw = input.raw.trim();
  const now = input.now ?? new Date();
  const blocking: ExternalEvaluationCheckId[] = [];
  const rejected: ExternalEvaluationCheckId[] = [];
  const reasons: string[] = [];

  if (raw.length === 0) {
    blocking.push("empty-paste");
    reasons.push("لا نصّ في اللصق: لا يوجد ما يُحفظ.");
  } else {
    if (!hasReadableLetters(raw) || tokens(raw).length < 3) {
      blocking.push("unreadable-paste");
      reasons.push("النصّ الملصوق غير قابل للقراءة (حروف قليلة أو رموز فقط).");
    }
    const own = new Set(tokens(raw));
    const ratio = overlapRatio(raw, input.learnerText);
    if (own.size >= EXTERNAL_EVALUATION_SELF_OVERLAP_MIN_TOKENS && ratio >= EXTERNAL_EVALUATION_SELF_OVERLAP_RATIO) {
      blocking.push("learner-self-overlap");
      reasons.push("النصّ الملصوق هو نصّك أنت لا كلام مراجع خارجي، فلا يُحتسب رأيًا خارجيًا.");
    }
    if (blocking.length === 0) {
      if (RESULT_CLAIM_PATTERNS.some((pattern) => pattern.test(raw))) {
        rejected.push("official-result-claim");
        reasons.push("عبارة نتيجة أو درجة: تُرفض الدعوى وتُحفظ الملاحظة.");
      }
      if (CERTIFICATE_CLAIM_PATTERNS.some((pattern) => pattern.test(raw))) {
        rejected.push("certificate-or-level-claim");
        reasons.push("عبارة شهادة أو مستوى: التطبيق لا يصادق على شهادة ولا يمنح مستوى.");
      }
      if (
        input.packetText &&
        tokens(raw).length >= EXTERNAL_EVALUATION_SELF_OVERLAP_MIN_TOKENS &&
        overlapRatio(raw, input.packetText) >= EXTERNAL_EVALUATION_PACKET_ECHO_RATIO
      ) {
        rejected.push("packet-echo");
        reasons.push("النصّ يردّد حزمة الطلب بدل أن يحمل كلام المراجع.");
      }
      if (input.reviewerLabel.trim().length === 0) {
        rejected.push("unnamed-reviewer");
        reasons.push("بلا اسم مراجع: يُحفظ النصّ موسومًا بأن مصدره غير مسمّى.");
      }
      if (ageInDays(input.receivedAt, now) > EXTERNAL_EVALUATION_MAX_AGE_DAYS) {
        rejected.push("stale-over-180-days");
        reasons.push("قِدَم الردّ أكبر من 180 يومًا: يبقى ملاحظة ولا يُقدَّم كتقييم حالٍ.");
      }
    }
  }

  const verdict: ExternalEvaluationVerdict =
    blocking.length > 0 ? "blocked" : rejected.length > 0 ? "stored-with-rejected-claim" : "usable";

  return {
    policyVersion: EXTERNAL_EVALUATION_VERIFICATION_POLICY,
    verdict,
    trust: EXTERNAL_EVALUATION_TRUST,
    appCanAuthenticateReviewer: APP_CAN_AUTHENTICATE_REVIEWER,
    usableAsUnverifiedEvidence: verdict !== "blocked",
    countsTowardLevelGate: false,
    countsAsExamScore: false,
    blockingChecks: blocking,
    rejectedClaimChecks: rejected,
    reasonsAr: reasons,
  };
}

export function buildExternalEvaluationVerificationRow(input: {
  verification: ExternalEvaluationVerification;
  id: string;
  submissionId: string;
  taskId: string;
  level: "A1" | "A2" | "B1" | "B2";
  noteId?: string;
  createdAt: string;
}): ExternalEvaluationVerificationRow {
  return {
    id: input.id,
    policyVersion: EXTERNAL_EVALUATION_VERIFICATION_POLICY,
    submissionId: input.submissionId,
    taskId: input.taskId,
    level: input.level,
    verdict: input.verification.verdict,
    trust: input.verification.trust,
    appCanAuthenticateReviewer: input.verification.appCanAuthenticateReviewer,
    blockingChecks: [...input.verification.blockingChecks],
    rejectedClaimChecks: [...input.verification.rejectedClaimChecks],
    usableAsUnverifiedEvidence: input.verification.usableAsUnverifiedEvidence,
    noteId: input.noteId,
    createdAt: input.createdAt,
  };
}

/** ملخّص عربي يظهر للمتعلّم: لا درجات، لا وعود، فقط الحكم على اللصق. */
export function describeExternalEvaluationVerdict(verification: ExternalEvaluationVerification): string {
  if (verification.verdict === "blocked") {
    const labels = verification.blockingChecks
      .map((id) => EXTERNAL_EVALUATION_CHECKS.find((check) => check.id === id)?.labelAr ?? id)
      .join(" · ");
    return `لم يُحفظ شيء: ${labels}.`;
  }
  if (verification.verdict === "stored-with-rejected-claim") {
    return `حُفظت الملاحظة كدليل غير موثوق، ورُفض الادعاء (${verification.rejectedClaimChecks.length} فحصًا).`;
  }
  return "حُفظت الملاحظة كدليل غير موثوق: لا تحتسب على بوابة مستوى ولا تثبت جاهزية.";
}

export function externalEvaluationAudit(input: {
  notes?: { verification?: { verdict: ExternalEvaluationVerdict } }[];
  verifications?: ExternalEvaluationVerificationRow[];
}) {
  const rows = input.verifications ?? [];
  return {
    policyVersion: EXTERNAL_EVALUATION_VERIFICATION_POLICY,
    checks: EXTERNAL_EVALUATION_CHECKS.length,
    blockingChecks: EXTERNAL_EVALUATION_CHECKS.filter((check) => check.tier === "blocking").length,
    claimChecks: EXTERNAL_EVALUATION_CHECKS.filter((check) => check.tier === "rejects-claim").length,
    blockedPastes: rows.filter((row) => row.verdict === "blocked").length,
    storedWithRejectedClaim: rows.filter((row) => row.verdict === "stored-with-rejected-claim").length,
    usablePastes: rows.filter((row) => row.verdict === "usable").length,
    storedNotes: (input.notes ?? []).length,
  };
}
