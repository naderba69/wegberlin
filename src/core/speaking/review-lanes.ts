/**
 * `speaking-review-lanes-v1` — three separated review channels for a speaking
 * attempt, plus the transcript-confirmation gate that must pass before any
 * remote review of what the learner said.
 *
 * Why the gate exists: the browser model turns audio into text, and that text
 * contains recognition errors. Reviewing the raw transcript would punish the
 * learner for the model's mistake. So an ASR-derived draft is only a draft: the
 * learner reads it, edits it, and explicitly confirms it. Until then nothing is
 * sent, and the linguistic lane stays empty.
 *
 * Why three lanes: an acoustic observation, a language judgement and a
 * task-completion self-report are different facts. Adding them into one number
 * would hide which one actually failed, so this module keeps them apart and
 * refuses to produce a composite value.
 */

import { localWordMatchPhonemeProvider, phonemeEngineGate } from "@/core/german/phoneme-policy";

export const SPEAKING_REVIEW_LANES_POLICY = "speaking-review-lanes-v1" as const;
export const TRANSCRIPT_CONFIRMATION_POLICY = "speaking-confirmed-transcript-v1" as const;
export const SPEAKING_REVIEW_LANES_BOUNDARY =
  "three-separated-lanes-no-composite-number-no-fluency-or-pronunciation-score" as const;
export const TRANSCRIPT_CONFIRMATION_BOUNDARY =
  "no-review-sent-before-learner-confirmation-no-audio-transmitted" as const;

export type SpeakingTranscriptDraft = {
  policyVersion: typeof TRANSCRIPT_CONFIRMATION_POLICY;
  source: "local-asr-draft" | "typed-by-learner";
  draftText: string;
  confirmedText: string;
  editedFromDraft: boolean;
  confirmation: "learner-confirmed" | "unconfirmed";
  confirmedAt: string | null;
  evidenceBoundary: typeof TRANSCRIPT_CONFIRMATION_BOUNDARY;
};

export type AcousticLane = {
  key: "acoustic";
  status: "technical-unverifiable" | "word-match-only";
  providerId: string;
  wordsConfirmed: number;
  wordsUnconfirmed: number;
  unconfirmedWords: string[];
  phonemeGateOpen: boolean;
  detailAr: string;
  canClaimScore: false;
  canClaimPhonemeAccuracy: false;
  boundary: "local-signal-and-word-match-only-no-phoneme-acoustic-fluency-or-pronunciation-score";
};

export type LinguisticLane = {
  key: "linguistic";
  status: "local-signals" | "remote-advisory" | "not-reviewed";
  provider: "local" | "disabled" | "gemini";
  groundedExcerpts: string[];
  findingsAr: string[];
  unresolvedAr: string[];
  needsHumanReview: boolean;
  transcriptConfirmed: boolean;
  canClaimScore: false;
  boundary: "confirmed-text-only-no-audio-analysis-no-official-language-grade";
};

export type TaskLane = {
  key: "task";
  status: "self-reported";
  criteriaMet: string[];
  criteriaUnmet: string[];
  targetSeconds: number | null;
  spokeForSeconds: number | null;
  detailAr: string;
  canClaimScore: false;
  boundary: "learner-checklist-self-report-no-assessor-verdict";
};

export type SpeakingReviewLanes = {
  policyVersion: typeof SPEAKING_REVIEW_LANES_POLICY;
  transcript: Pick<SpeakingTranscriptDraft, "source" | "confirmation" | "editedFromDraft" | "confirmedAt">;
  acoustic: AcousticLane;
  linguistic: LinguisticLane;
  task: TaskLane;
  /** Structural refusal: there is deliberately no aggregate. */
  compositeScore: null;
  compositeFluencyScore: null;
  boundary: typeof SPEAKING_REVIEW_LANES_BOUNDARY;
};

function clean(value: string): string {
  return value.normalize("NFC").replace(/[\u202A-\u202E\u2066-\u2069]/gu, "").replace(/\s+/gu, " ").trim();
}

function germanWordCount(value: string): number {
  return (clean(value).match(/\p{L}[\p{L}'’-]*/gu) ?? []).length;
}

/** Creates an unconfirmed draft. A draft can never be sent anywhere. */
export function createTranscriptDraft(input: { asrTranscript?: string; typedText?: string; now?: Date }): SpeakingTranscriptDraft {
  const asr = clean(input.asrTranscript ?? "");
  const typed = clean(input.typedText ?? "");
  const source: SpeakingTranscriptDraft["source"] = asr && !typed ? "local-asr-draft" : "typed-by-learner";
  return {
    policyVersion: TRANSCRIPT_CONFIRMATION_POLICY,
    source,
    draftText: asr || typed,
    confirmedText: "",
    editedFromDraft: false,
    confirmation: "unconfirmed",
    confirmedAt: null,
    evidenceBoundary: TRANSCRIPT_CONFIRMATION_BOUNDARY,
  };
}

/**
 * The learner's own confirmation, with the edit preserved. A confirmation is
 * refused when it is empty or when the learner confirmed an ASR draft they never
 * read (fewer than three German words) — such text cannot support a review.
 */
export function confirmTranscript(
  draft: SpeakingTranscriptDraft,
  confirmedText: string,
  now: Date = new Date(),
): SpeakingTranscriptDraft {
  const text = clean(confirmedText).slice(0, 1200);
  if (!text) throw new Error("لا يمكن التأكيد على نسخة فارغة. اكتب ما قلته أو انسخه من المسودة ثم أكّده.");
  if (germanWordCount(text) < 3) throw new Error("النسخة أقصر من أن تعبّر عن إجابتك؛ أضف ثلاث كلمات ألمانية على الأقل قبل التأكيد.");
  // No further length rule: the three-word floor above is what separates an
  // unread draft from a real answer, and a learner who deliberately confirms
  // two short sentences must not be refused by an unreachable extra check.
  return {
    ...draft,
    confirmedText: text,
    editedFromDraft: draft.draftText.length > 0 && clean(draft.draftText).toLocaleLowerCase("de-DE") !== text.toLocaleLowerCase("de-DE"),
    confirmation: "learner-confirmed",
    confirmedAt: now.toISOString(),
    evidenceBoundary: TRANSCRIPT_CONFIRMATION_BOUNDARY,
  };
}

/** Fail-closed check used by every remote send in the speaking lane. */
export function assertTranscriptConfirmedForSend(draft: SpeakingTranscriptDraft, text: string): void {
  if (draft.source === "local-asr-draft" && draft.confirmation !== "learner-confirmed") {
    throw new Error("لا يُرسل أي نص للمراجعة قبل أن تؤكد النسخة المطابقة لما قلته؛ أخطاء تعرّف النموذج لا تُحسب عليك.");
  }
  if (!clean(text)) throw new Error("لا يوجد نص مؤكد للمراجعة.");
  if (clean(draft.confirmedText) && clean(draft.confirmedText) !== clean(text)) {
    throw new Error("تغيّرت النص بعد التأكيد؛ أعد التأكيد قبل الإرسال حتى تُراجع النسخة نفسها.");
  }
}

/**
 * True when the learner edited the field after confirming, so the text that
 * would be sent is no longer the copy they approved. `assertTranscriptConfirmedForSend`
 * refuses this at send time; surfaces use it to stop offering the send earlier.
 */
export function isTranscriptStale(draft: SpeakingTranscriptDraft, text: string): boolean {
  if (draft.confirmation !== "learner-confirmed") return false;
  return Boolean(clean(draft.confirmedText)) && clean(draft.confirmedText) !== clean(text);
}

export type LaneInput = {
  transcript: SpeakingTranscriptDraft;
  wordMatch: {
    heardCount: number;
    expectedCount: number;
    words: Array<{ word: string; status: "heard" | "unconfirmed" }>;
    feedbackAr: string[];
  } | null;
  localSignals: { findingsAr: string[]; unresolvedAr: string[] } | null;
  aiFindings: { findingsAr: string[]; unresolvedAr: string[]; groundedExcerpts: string[] } | null;
  task: { criteriaMet: string[]; criteriaUnmet: string[]; targetSeconds: number | null; spokeForSeconds: number | null };
};

/** Builds the three lanes. No field of the result is a score. */
export function buildSpeakingReviewLanes(input: LaneInput): SpeakingReviewLanes {
  const gate = phonemeEngineGate();
  const words = input.wordMatch?.words ?? [];
  const unconfirmedWords = words.filter((word) => word.status !== "heard").map((word) => word.word);

  const acoustic: AcousticLane = {
    key: "acoustic",
    status: input.wordMatch ? "word-match-only" : "technical-unverifiable",
    providerId: localWordMatchPhonemeProvider.id,
    wordsConfirmed: input.wordMatch?.heardCount ?? 0,
    wordsUnconfirmed: unconfirmedWords.length,
    unconfirmedWords,
    phonemeGateOpen: gate.open,
    detailAr: input.wordMatch
      ? "القناة الصوتية: طابقت الكلمات المنطوقة مع كلمات المهمة بعد فحص الإشارة. لا قياس للفونيمات ولا للطلاقة ولا للهجة؛ كلمات لم تُؤكد قد تكون خطأ تعرّف لا خطأ نطق."
      : "القناة الصوتية: لا نتيجة — لم يُفحص التسجيل أو تعذّر الفحص التقني. هذا لا يُعدّ خطأ نطق.",
    canClaimScore: false,
    canClaimPhonemeAccuracy: false,
    boundary: "local-signal-and-word-match-only-no-phoneme-acoustic-fluency-or-pronunciation-score",
  };

  const confirmed = input.transcript.confirmation === "learner-confirmed";
  const linguistic: LinguisticLane = {
    key: "linguistic",
    status: input.aiFindings ? "remote-advisory" : input.localSignals ? "local-signals" : "not-reviewed",
    provider: input.aiFindings ? "gemini" : "local",
    groundedExcerpts: input.aiFindings?.groundedExcerpts ?? [],
    findingsAr: [...(input.localSignals?.findingsAr ?? []), ...(input.aiFindings?.findingsAr ?? [])],
    unresolvedAr: [...(input.localSignals?.unresolvedAr ?? []), ...(input.aiFindings?.unresolvedAr ?? [])],
    needsHumanReview: (input.localSignals?.unresolvedAr.length ?? 0) > 0 || (input.aiFindings?.unresolvedAr.length ?? 0) > 0 || Boolean(input.aiFindings),
    transcriptConfirmed: confirmed,
    canClaimScore: false,
    boundary: "confirmed-text-only-no-audio-analysis-no-official-language-grade",
  };

  const task: TaskLane = {
    key: "task",
    status: "self-reported",
    criteriaMet: input.task.criteriaMet,
    criteriaUnmet: input.task.criteriaUnmet,
    targetSeconds: input.task.targetSeconds,
    spokeForSeconds: input.task.spokeForSeconds,
    detailAr: "قناة إنجاز المهمة: ما أكدته أنت من معايير المهمة. لا يقيّمها أحد غيرك في هذا التطبيق.",
    canClaimScore: false,
    boundary: "learner-checklist-self-report-no-assessor-verdict",
  };

  return {
    policyVersion: SPEAKING_REVIEW_LANES_POLICY,
    transcript: {
      source: input.transcript.source,
      confirmation: input.transcript.confirmation,
      editedFromDraft: input.transcript.editedFromDraft,
      confirmedAt: input.transcript.confirmedAt,
    },
    acoustic,
    linguistic,
    task,
    compositeScore: null,
    compositeFluencyScore: null,
    boundary: SPEAKING_REVIEW_LANES_BOUNDARY,
  };
}

/** Three labelled blocks for the UI; kept as data so no number can leak in. */
export function laneSections(lanes: SpeakingReviewLanes): Array<{ titleAr: string; statusAr: string; bodyAr: string; excerpts: string[] }> {
  return [
    {
      titleAr: "القناة الصوتية",
      statusAr: lanes.acoustic.status === "word-match-only" ? `مطابقة كلمات: ${lanes.acoustic.wordsConfirmed}/${lanes.acoustic.wordsConfirmed + lanes.acoustic.wordsUnconfirmed}` : "غير قابلة للتحقق تقنيًا",
      bodyAr: lanes.acoustic.detailAr,
      excerpts: lanes.acoustic.unconfirmedWords,
    },
    {
      titleAr: "القناة اللغوية",
      statusAr: lanes.linguistic.status === "not-reviewed"
        ? (lanes.linguistic.transcriptConfirmed ? "لم تُرسل مراجعة" : "بانتظار تأكيد النسخة")
        : lanes.linguistic.provider === "gemini" ? "استشارة نصية مؤكَّدة" : "رصد محلي",
      bodyAr: lanes.linguistic.findingsAr.join(" ") || "لا توجد ملاحظات لغوية. غياب الملاحظة لا يعني أن النص سليم.",
      excerpts: lanes.linguistic.groundedExcerpts,
    },
    {
      titleAr: "قناة إنجاز المهمة",
      statusAr: `${lanes.task.criteriaMet.length} معيار مؤكد من ${lanes.task.criteriaMet.length + lanes.task.criteriaUnmet.length}`,
      bodyAr: lanes.task.detailAr,
      excerpts: lanes.task.criteriaUnmet,
    },
  ];
}

export function speakingLanesHaveComposite(lanes: SpeakingReviewLanes): boolean {
  return lanes.compositeScore !== null || lanes.compositeFluencyScore !== null;
}
