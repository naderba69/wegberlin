/**
 * `phoneme-observation-policy-v1` — the gate between the phoneme layer and any
 * claim shown to a learner.
 *
 * The engine is built in two halves. The alignment half is deterministic and
 * tested. The acoustic half needs a real browser phoneme model, and that model
 * is NOT part of this repository, so the only provider shipped here confirms
 * words, not phonemes. This module makes that boundary executable rather than
 * a comment: any attempt to present graded per-phoneme feedback through the
 * shipped provider is rejected by `phonemeAssessmentClaim`, and the readiness
 * ledger records which of the owner's eight evidence steps still have no
 * evidence.
 */

import { PHONEME_ALIGNMENT_POLICY, PHONEME_ALIGNMENT_BOUNDARY } from "./phoneme-alignment";

export const PHONEME_POLICY_VERSION = "phoneme-observation-policy-v1" as const;
export const PHONEME_POLICY_BOUNDARY =
  "word-match-provider-cannot-grade-phonemes-readiness-closed-until-acoustic-evidence-exists" as const;

export type PhonemeObservationProvider = {
  id: string;
  labelDe: string;
  labelAr: string;
  /** Only a provider with this flag may supply per-phoneme rows. */
  phonemeGradeable: boolean;
  kind: "acoustic-phoneme-model" | "asr-word-match" | "typed-input";
  /** Runtime the provider needs; `not-installed` is the honest default. */
  runtimeStatus: "installed" | "not-installed" | "blocked-by-policy";
  boundary: string;
};

/** The only provider this project ships today. */
export const localWordMatchPhonemeProvider: PhonemeObservationProvider = {
  id: "local-whisper-word-match",
  labelDe: "Wortabgleich aus lokaler Transkription",
  labelAr: "مطابقة الكلمات من النسخ المحلي",
  phonemeGradeable: false,
  kind: "asr-word-match",
  runtimeStatus: "installed",
  boundary: "asr-expected-word-match-no-phoneme-accent-fluency-or-official-pronunciation-score",
};

/**
 * Candidate acoustic provider, recorded as research only. The model is not
 * vendored, not converted, not measured, so it cannot supply rows. Keeping the
 * entry visible prevents anyone from claiming it is wired up.
 */
export const wav2vec2PhonemeCandidate: PhonemeObservationProvider = {
  id: "wav2vec2-commonphone-candidate",
  labelDe: "Wav2Vec2 CommonPhone (Kandidat, nicht integriert)",
  labelAr: "مرشّح بحثي غير مُدمج",
  phonemeGradeable: false,
  kind: "acoustic-phoneme-model",
  runtimeStatus: "not-installed",
  boundary: "research-candidate-not-vendored-not-onnx-not-measured-cannot-grade-anything",
};

export const phonemeObservationProviders: PhonemeObservationProvider[] = [
  localWordMatchPhonemeProvider,
  wav2vec2PhonemeCandidate,
];

export function gradeablePhonemeProviders(): PhonemeObservationProvider[] {
  return phonemeObservationProviders.filter((provider) => provider.phonemeGradeable);
}

export type PhonemeEvidenceStepId =
  | "acoustic-model-installed"
  | "revision-and-license-pinned"
  | "onnx-q8-export"
  | "worker-run-measured"
  | "device-size-heat-speed-measured"
  | "forced-alignment-implemented"
  | "thresholds-calibrated"
  | "german-native-and-arabic-learner-trials"
  | "independent-phonetic-review";

export type PhonemeEvidenceStep = {
  id: PhonemeEvidenceStepId;
  requirementAr: string;
  status: "satisfied" | "pending";
  evidence: string | null;
};

/**
 * Statuses are hard-coded from the actual repository state on the day this was
 * written, and `tests/unit/german-phoneme-policy.test.ts` fails if anyone marks
 * a step satisfied without naming a real artefact path.
 */
export const phonemeEngineEvidenceSteps: PhonemeEvidenceStep[] = [
  {
    id: "acoustic-model-installed",
    requirementAr: "تشغيل نموذج فونيمات محلي فعلي داخل المتصفح على تسجيل حقيقي",
    status: "pending",
    evidence: null,
  },
  {
    id: "revision-and-license-pinned",
    requirementAr: "تثبيت نسخة النموذج ومراجعة رخصته وبيانات تدريبه",
    status: "pending",
    evidence: null,
  },
  {
    id: "onnx-q8-export",
    requirementAr: "تصدير ONNX وتكميم q8 مع قياس الحجم",
    status: "pending",
    evidence: null,
  },
  {
    id: "worker-run-measured",
    requirementAr: "التشغيل في Web Worker منفصل مع قياس زمن البداية",
    status: "pending",
    evidence: null,
  },
  {
    id: "device-size-heat-speed-measured",
    requirementAr: "قياس الذاكرة والحرارة والسرعة على هاتف فعلي",
    status: "pending",
    evidence: null,
  },
  {
    id: "forced-alignment-implemented",
    requirementAr: "محاذاة قسرية تربط كل فونيم بزمنه في التسجيل",
    status: "pending",
    evidence: null,
  },
  {
    id: "thresholds-calibrated",
    requirementAr: "معايرة حدود القبول وقياس القبول الخطأ والرفض الخطأ",
    status: "pending",
    evidence: null,
  },
  {
    id: "german-native-and-arabic-learner-trials",
    requirementAr: "اختبار ناطقين بالألمانية ومتعلمين عرب على التسجيلات نفسها",
    status: "pending",
    evidence: null,
  },
  {
    id: "independent-phonetic-review",
    requirementAr: "مراجعة صوتية مستقلة لجدول الفونيمات والتلميحات",
    status: "pending",
    evidence: null,
  },
];

export type PhonemeReadinessFlags = {
  phonemeAssessment: boolean;
  perPhonemeFeedback: boolean;
  accentScore: boolean;
  fluencyScore: boolean;
  officialExamPronunciationScore: boolean;
};

/** Never flip these by hand: they open only with the evidence above. */
export const phonemeReadinessFlags: PhonemeReadinessFlags = {
  phonemeAssessment: false,
  perPhonemeFeedback: false,
  accentScore: false,
  fluencyScore: false,
  officialExamPronunciationScore: false,
};

export function phonemeEngineGate(): {
  open: boolean;
  pendingSteps: PhonemeEvidenceStepId[];
  satisfiedSteps: PhonemeEvidenceStepId[];
  blockerAr: string;
} {
  const pending = phonemeEngineEvidenceSteps.filter((step) => step.status !== "satisfied");
  const satisfied = phonemeEngineEvidenceSteps.filter((step) => step.status === "satisfied");
  return {
    open: pending.length === 0 && gradeablePhonemeProviders().length > 0,
    pendingSteps: pending.map((step) => step.id),
    satisfiedSteps: satisfied.map((step) => step.id),
    blockerAr: pending.length
      ? `بوابة التقييم الفونيمي مغلقة: ${pending.length} من ${phonemeEngineEvidenceSteps.length} خطوات دليل لم تُنفّذ بعد.`
      : "لم يُفعَّل التقييم الفونيمي: لا يوجد مزوّد يستطيع إمداد الفونيمات.",
  };
}

/** Wording that must never appear while the gate is closed. */
export const FORBIDDEN_PHONEME_CLAIM_FRAGMENTS = [
  "لهجتك",
  "لهجتكم",
  "لهجة مثالية",
  "طلاقتك",
  "طلاقتكم",
  "درجة نطق",
  "درجة طلاقة",
  "نطق سليم",
  "نطقك سليم",
  "نطقك مثالي",
  "نتيجة النطق الرسمية",
  "نطق سليم 100%",
  "لهجة ألمانية مثالية",
  "Pronunciation score",
  "accent score",
  "fehlerfrei ausgesprochen",
  "official pronunciation grade",
  "CEFR pronunciation rating",
] as const;

export type PhonemeClaimRequest = {
  provider: PhonemeObservationProvider;
  /** Rows the engine produced; only gradeable providers may supply them. */
  rowCount: number;
  /** Learner-facing strings the UI is about to render. */
  plannedText: string[];
};

export function phonemeAssessmentClaim(request: PhonemeClaimRequest): {
  allowed: boolean;
  verdict: "gradeable" | "cannot-verify" | "forbidden-wording";
  reasonAr: string;
  violations: string[];
  policyVersion: typeof PHONEME_POLICY_VERSION;
  alignmentPolicy: typeof PHONEME_ALIGNMENT_POLICY;
  boundary: typeof PHONEME_POLICY_BOUNDARY;
} {
  const violations = request.plannedText
    .join(" ")
    .split(/(?<=[.!?])\s+/u)
    .filter((sentence) =>
      FORBIDDEN_PHONEME_CLAIM_FRAGMENTS.some((fragment) => sentence.toLocaleLowerCase("de-DE").includes(fragment.toLocaleLowerCase("de-DE"))),
    );
  if (violations.length) {
    return {
      allowed: false,
      verdict: "forbidden-wording",
      reasonAr: "الصياغة المطلوبة تعد بما لا يستطيع المحرك تقديمه، وقد حُذفت قبل العرض.",
      violations,
      policyVersion: PHONEME_POLICY_VERSION,
      alignmentPolicy: PHONEME_ALIGNMENT_POLICY,
      boundary: PHONEME_POLICY_BOUNDARY,
    };
  }
  if (!request.provider.phonemeGradeable || request.rowCount > 0) {
    return {
      allowed: request.provider.phonemeGradeable && request.rowCount === 0,
      verdict: "cannot-verify",
      reasonAr: request.provider.phonemeGradeable
        ? "المزوّد يعلن القدرة على الفونيمات لكنه لا يرسل صفوفًا؛ لا يُصدر حكم."
        : "المزوّد المؤكد للكلمات فقط لا يستطيع إصدار أحكام على الفونيمات المفردة؛ الصفوف تُعرض cannot-verify.",
      violations: [],
      policyVersion: PHONEME_POLICY_VERSION,
      alignmentPolicy: PHONEME_ALIGNMENT_POLICY,
      boundary: PHONEME_POLICY_BOUNDARY,
    };
  }
  return {
    allowed: true,
    verdict: "gradeable",
    reasonAr: "مزوّد فونيمات مُثبَّت يرسل صفوفًا حقيقية؛ تُعرض النتيجة كتقدير داخل حدود المحرك لا كدرجة رسمية.",
    violations: [],
    policyVersion: PHONEME_POLICY_VERSION,
    alignmentPolicy: PHONEME_ALIGNMENT_POLICY,
    boundary: PHONEME_POLICY_BOUNDARY,
  };
}

/** Learner-facing copy, one entry per surface that touches this layer. */
export const PHONEME_ENGINE_STATUS_TEXT_AR = {
  heading: "المرجع الصوتي المكتوب — ليس قياسًا لنطقك",
  unavailable: "طبقة الفونيمات هنا تُظهر المرجع المكتوب وتشرح الكتابة الصوتية، ولا تقيس نطقك. التقييم الفونيمي التلقائي غير مُفعَّل لعدم توفر دليل النموذج الصوتي. كما لا يقارن النبر الصوتي للكلمة، بل يعرض القراءات المؤلَّفة عند اختلافها فقط.",
  noGrading: "لا تُعرض درجة فونيمات هنا: المزوّد المحلي الحالي يؤكد الكلمات فقط.",
  wordRepairIntro: [
    "هذا المسار يقرأ الكتابة الصوتية المؤكدة يدويًا للمعلم ويطابقها بالكلمات المؤكدة من Whisper.",
    "طابقة الفونيمات هنا غير مُفعَّلة؛ لا تُعرض نسبة مئوية ولا ادعاء لهجة أو طلاقة.",
  ],
  // Worded so it does not contain any fragment of FORBIDDEN_PHONEME_CLAIM_FRAGMENTS:
  // a strict substring filter cannot distinguish our negation from a claim, and a
  // filter that trips on honest disclaimers gets switched off.
  boundary: "لا نتيجة فونيمية هنا، ولا رقم للنطق، ولا وصف للهجة، ولا نتيجة امتحان رسمية.",
} as const;

/** The same copy as one line, for footers. */
export const PHONEME_ENGINE_STATUS_LINE_AR = PHONEME_ENGINE_STATUS_TEXT_AR.unavailable;

export const PHONEME_ENGINE_STATUS_DATA = {
  policyVersion: PHONEME_POLICY_VERSION,
  providerId: localWordMatchPhonemeProvider.id,
  phonemeGradeable: localWordMatchPhonemeProvider.phonemeGradeable,
  gateOpen: phonemeEngineGate().open,
  flags: phonemeReadinessFlags,
  alignmentBoundary: PHONEME_ALIGNMENT_BOUNDARY,
  boundary: PHONEME_POLICY_BOUNDARY,
} as const;
