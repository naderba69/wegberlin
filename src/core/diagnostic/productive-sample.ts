import type {
  DiagnosticProductiveSample,
  DiagnosticProductiveSelfAssessment,
  DiagnosticResult,
  ProductiveSampleComparison,
} from "@/types/learning";

export const DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION = "diagnostic-productive-sample-v1" as const;
export const DIAGNOSTIC_PRODUCTIVE_PROMPT_ID = "diagnostic-self-introduction-v1" as const;
export const DIAGNOSTIC_PRODUCTIVE_PROMPT_DE = "Stellen Sie sich in ein bis drei Sätzen vor. Sagen Sie auch, warum Sie Deutsch lernen.";
export const DIAGNOSTIC_PRODUCTIVE_PROMPT_AR = "قدّم نفسك في جملة إلى ثلاث، واذكر لماذا تتعلم الألمانية. اكتب أو سجّل، ولا تحتاج إلى فعل الاثنين.";
export const DIAGNOSTIC_PRODUCTIVE_BOUNDARY = "self-evidence-no-automated-language-score" as const;
export const DIAGNOSTIC_SPEAKING_TARGET_SECONDS = 20;
export const PRODUCTIVE_SAMPLE_COMPARISON_POLICY = "four-week-productive-sample-comparison-v1" as const;
export const PRODUCTIVE_SAMPLE_COMPARISON_BOUNDARY = "paired-sample-comparison-only-no-language-quality-cefr-or-mastery" as const;
export const PRODUCTIVE_SAMPLE_FOLLOW_UP_DAYS = 28;
export const PRODUCTIVE_SAMPLE_FOLLOW_UP_MS = PRODUCTIVE_SAMPLE_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000;

export function diagnosticWritingWordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

export function canSubmitDiagnosticProductiveSample(input: {
  writingText: string;
  speakingDurationSeconds?: number;
  selfAssessment: DiagnosticProductiveSelfAssessment;
}) {
  const writingWordCount = diagnosticWritingWordCount(input.writingText);
  const hasSpeaking = (input.speakingDurationSeconds ?? 0) >= 3;
  if (input.selfAssessment === "not-yet") return writingWordCount === 0 && !hasSpeaking;
  return writingWordCount >= 3 || hasSpeaking;
}

export function buildDiagnosticProductiveSample(input: {
  writingText: string;
  speakingMediaId?: string;
  speakingDurationSeconds?: number;
  selfAssessment: DiagnosticProductiveSelfAssessment;
  submittedAt?: string;
}): DiagnosticProductiveSample {
  if (!canSubmitDiagnosticProductiveSample(input)) throw new Error("أضف ثلاث كلمات ألمانية على الأقل أو تسجيلًا قصيرًا، أو اختر «لا أستطيع بعد» دون عينة.");
  const writingText = input.writingText.trim();
  const writingWordCount = diagnosticWritingWordCount(writingText);
  const hasWriting = writingWordCount > 0;
  const hasSpeaking = Boolean(input.speakingMediaId && (input.speakingDurationSeconds ?? 0) >= 3);
  const mode = input.selfAssessment === "not-yet" ? "not-yet" : hasWriting && hasSpeaking ? "writing-and-speaking" : hasSpeaking ? "speaking" : "writing";
  return {
    policyVersion: DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION,
    promptId: DIAGNOSTIC_PRODUCTIVE_PROMPT_ID,
    mode,
    ...(hasWriting ? { writingText } : {}),
    writingWordCount,
    ...(hasSpeaking ? { speakingMediaId: input.speakingMediaId, speakingDurationSeconds: Math.round(input.speakingDurationSeconds!) } : {}),
    selfAssessment: input.selfAssessment,
    evaluationBoundary: DIAGNOSTIC_PRODUCTIVE_BOUNDARY,
    submittedAt: input.submittedAt ?? new Date().toISOString(),
  };
}

export function productiveSampleFollowUpDueAt(baseline: DiagnosticProductiveSample) {
  const submittedAt = Date.parse(baseline.submittedAt);
  if (baseline.policyVersion !== DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION || baseline.promptId !== DIAGNOSTIC_PRODUCTIVE_PROMPT_ID || !Number.isFinite(submittedAt)) {
    throw new Error("تعذر إنشاء موعد مقارنة من عينة بداية غير صالحة.");
  }
  return new Date(submittedAt + PRODUCTIVE_SAMPLE_FOLLOW_UP_MS).toISOString();
}

export function buildProductiveSampleComparison(baseline: DiagnosticProductiveSample): ProductiveSampleComparison {
  return {
    policyVersion: PRODUCTIVE_SAMPLE_COMPARISON_POLICY,
    baseline,
    followUpDueAt: productiveSampleFollowUpDueAt(baseline),
    evidenceBoundary: PRODUCTIVE_SAMPLE_COMPARISON_BOUNDARY,
  };
}

/** Older schema-v3 profiles may have the original sample but not the later comparison record. */
export function productiveSampleComparisonFor(result: Pick<DiagnosticResult, "productiveSample"> | null | undefined) {
  if (!result?.productiveSample) return null;
  try {
    return buildProductiveSampleComparison(result.productiveSample);
  } catch {
    return null;
  }
}

export function isProductiveSampleFollowUpAvailable(comparison: ProductiveSampleComparison, now: Date | string | number) {
  const dueAt = Date.parse(comparison.followUpDueAt);
  const currentTime = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  return !comparison.followUp && Number.isFinite(dueAt) && Number.isFinite(currentTime) && currentTime >= dueAt;
}

export function recordProductiveSampleFollowUp(comparison: ProductiveSampleComparison, sample: DiagnosticProductiveSample): ProductiveSampleComparison {
  if (comparison.followUp) throw new Error("سُجّلت عينة الأسبوع الرابع مسبقًا.");
  if (comparison.policyVersion !== PRODUCTIVE_SAMPLE_COMPARISON_POLICY || sample.policyVersion !== DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION || sample.promptId !== comparison.baseline.promptId) {
    throw new Error("يجب استخدام المهمة نفسها وسياسة العينة نفسها للمقارنة.");
  }
  const dueAt = Date.parse(comparison.followUpDueAt);
  const submittedAt = Date.parse(sample.submittedAt);
  if (!Number.isFinite(dueAt) || !Number.isFinite(submittedAt) || submittedAt < dueAt) {
    throw new Error("لا تُسجَّل عينة المتابعة قبل مرور أربعة أسابيع كاملة على خط البداية.");
  }
  return { ...comparison, followUp: sample };
}

export function mergeProductiveSampleComparisons(left?: ProductiveSampleComparison, right?: ProductiveSampleComparison) {
  if (!left) return right;
  if (!right) return left;
  const baseline = [left.baseline, right.baseline]
    .filter((sample) => Number.isFinite(Date.parse(sample.submittedAt)))
    .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt))[0];
  if (!baseline) return left;
  const merged = buildProductiveSampleComparison(baseline);
  const followUp = [left.followUp, right.followUp]
    .filter((sample): sample is DiagnosticProductiveSample => Boolean(sample))
    .filter((sample) => Date.parse(sample.submittedAt) >= Date.parse(merged.followUpDueAt))
    .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt))[0];
  return followUp ? { ...merged, followUp } : merged;
}
