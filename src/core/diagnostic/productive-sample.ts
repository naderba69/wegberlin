import type { DiagnosticProductiveSample, DiagnosticProductiveSelfAssessment } from "@/types/learning";

export const DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION = "diagnostic-productive-sample-v1" as const;
export const DIAGNOSTIC_PRODUCTIVE_PROMPT_ID = "diagnostic-self-introduction-v1" as const;
export const DIAGNOSTIC_PRODUCTIVE_BOUNDARY = "self-evidence-no-automated-language-score" as const;
export const DIAGNOSTIC_SPEAKING_TARGET_SECONDS = 20;

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
