export type CEFRLevel = "A1" | "A2" | "B1" | "B2";
export type ExamProvider = "goethe-b2" | "telc-deutsch-b2";
export type ArabicSupportMode = "modern-standard-arabic" | "tunisian-supported" | "minimal-arabic";
export type LessonStatus = "published" | "planned";
export type AIProvider = "disabled" | "gemini" | "openrouter" | "local";
export type LearnerGoal = "exam" | "work" | "study" | "daily-life" | "settlement";
export type DeviceCapabilityStatus = "unchecked" | "ready" | "unavailable" | "permission-denied" | "skipped";
export type PriorGermanExperience = "none" | "some" | "unsure";
export type PriorLearningSource = "school" | "course" | "book" | "app" | "self-study" | "other";
export type LearningConcern = "speaking" | "listening" | "writing" | "grammar" | "pronunciation" | "exam" | "time" | "technology";
export type DiagnosticSkill = "grammar" | "vocabulary" | "reading" | "listening";

export interface OnboardingLearningContext {
  policyVersion: "prior-experience-context-v1";
  priorLearningSources: PriorLearningSource[];
  priorCourseOrBookNote?: string;
  concerns: LearningConcern[];
  evidenceBoundary: "learner-stated-planning-context-no-level-or-mastery";
}

export interface DeviceReadiness {
  audio: DeviceCapabilityStatus;
  microphone: DeviceCapabilityStatus;
  checkedAt?: string;
}

export interface LearnerProfile {
  name: string;
  targetExam: ExamProvider;
  targetDate?: string;
  dailyMinutes: 10 | 20 | 30 | 45 | 60 | 90;
  arabicSupport: ArabicSupportMode;
  currentLevel: CEFRLevel;
  goals?: LearnerGoal[];
  deviceReadiness?: DeviceReadiness;
  priorExperience?: PriorGermanExperience;
  onboardingContext?: OnboardingLearningContext;
  createdAt: string;
}

export interface LessonMeta {
  id: string;
  level: CEFRLevel;
  module: number;
  order: number;
  titleDe: string;
  titleAr: string;
  objectiveAr: string;
  estimatedMinutes: number;
  status: LessonStatus;
}

export type MissionBlockKind = "diagnostic" | "check-in" | "review" | "warmup" | "lesson" | "reading" | "writing" | "practice" | "production" | "reflection";
export type MissionEvidenceKind = "diagnostic-sample" | "planning-check-in" | "retrieval-process" | "lesson-evidence" | "reading-comprehension" | "writing-production" | "controlled-practice" | "productive-practice" | "planning-reflection";

export interface MissionBlock {
  id: string;
  kind: MissionBlockKind;
  titleAr: string;
  titleDe: string;
  minutes: number;
  objective: string;
  evidenceKind: MissionEvidenceKind;
  href?: string;
  alternativeForId?: string;
}

export interface MissionAlternativeRecord {
  id: string;
  policyVersion: "equivalent-mission-alternative-v1";
  date: string;
  originalBlockId: string;
  alternativeBlockId: string;
  originalKind: MissionBlockKind;
  alternativeTitleAr: string;
  alternativeTitleDe: string;
  objectiveSnapshot: string;
  evidenceKind: MissionEvidenceKind;
  minutes: number;
  href: string;
  reason: "learner-declined-now";
  originalCompletedAtSelection: false;
  evidenceBoundary: "planning-substitution-no-completion-mastery-or-correctness";
  createdAt: string;
}

export type AnswerConfidence = "low" | "medium" | "high";
export type AttemptUncertaintyKind="knowledge-recall"|"guess"|"instruction-unclear";
export type ErrorPatternClassification = "possible-slip" | "emerging-pattern" | "misconception-risk";
export type LearnerErrorContextTag = "knows-rule-under-time-pressure";

export interface ErrorRecord {
  id: string;
  type: "article" | "case" | "word-order" | "vocabulary" | "spelling" | "tense" | "grammar";
  wrong: string;
  correct: string;
  explanationAr: string;
  occurrences: number;
  lastSeenAt: string;
  sourceLessonId?: string;
  sourceExerciseId?: string;
  lastConfidence?: AnswerConfidence;
  highConfidenceWrongCount?: number;
  patternClassification?: ErrorPatternClassification;
  classificationPolicyVersion?: "error-pattern-classification-v1";
  failedRepairCount?: number;
  lastFailedRepairAt?: string;
  resolved?: boolean;
  repairCount?: number;
  lastRepairedAt?: string;
  nextReviewAt?: string;
  confirmedAt?: string;
  learnerContextTags?: LearnerErrorContextTag[];
  sensitiveInPrint?: boolean;
  learnerMetadataUpdatedAt?: string;
}

export interface ErrorClinicAttempt {
  id: string;
  clinicType: ErrorRecord["type"];
  sourceErrorIds: string[];
  answer: string;
  correct: boolean;
  createdAt: string;
}

export interface StudyDay {
  date: string;
  minutes: number;
  evidenceCount: number;
}

export type MasteryEvidenceSource="diagnostic-assessment"|"lesson-evidence"|"module-assessment"|"level-assessment"|"targeted-exam"|"full-exam-workflow"|"other-learning-evidence";
export interface MasteryEvidenceEvent {
  id:string;
  policyVersion:"event-derived-mastery-v1";
  key:string;
  operation:"set"|"increment"|"delete";
  value?:number;
  previousValue?:number;
  resultingValue?:number;
  source:MasteryEvidenceSource;
  evidenceRefs:string[];
  evidenceBoundary:"event-log-authoritative-for-new-mutations-legacy-snapshot-fallback-explicit";
  createdAt:string;
}

export interface TrainingInteractionEvent {
  id:string;
  policyVersion:"training-interaction-log-v1";
  surface:"writing-draft"|"library-question";
  contentId:string;
  event:"pause"|"resume"|"answer-change";
  sequence:number;
  evidenceBoundary:"process-metadata-only-no-answer-text-correctness-mastery-or-keystrokes";
  createdAt:string;
}

export interface DictationAttempt {
  id:string;
  policyVersion:"adaptive-partial-full-dictation-v1";
  itemId:string;
  level:CEFRLevel;
  mode:"partial"|"full";
  exact:boolean;
  wordAccuracyPercent:number;
  errorCount:number;
  playbackCount:number;
  retryOf?:string;
  evidenceBoundary:"local-form-summary-no-answer-text-cefr-mastery-or-exam-score";
  createdAt:string;
}

export interface BranchingConversationAttempt {
  id:string;
  policyVersion:"offline-branching-conversation-v1";
  scenarioId:string;
  level:CEFRLevel;
  mode:"guided"|"challenge";
  choiceIds:string[];
  outcome:"goal-reached"|"partial"|"restart-recommended";
  completedTurns:number;
  supportOpenCount:number;
  engine:"deterministic-local-tree";
  evidenceBoundary:"structured-local-simulation-no-free-text-ai-live-partner-mastery-or-cefr";
  createdAt:string;
}

export interface CollocationNetworkAttempt {
  id:string;
  policyVersion:"contextual-collocation-network-v1";
  networkId:string;
  level:CEFRLevel;
  mode:"guided"|"challenge";
  visitedNodeIds:string[];
  targetNodeIds:string[];
  selectedNodeIds:string[];
  correctCount:number;
  total:3;
  engine:"deterministic-context-match";
  evidenceBoundary:"structured-context-practice-no-free-text-ai-mastery-or-cefr";
  createdAt:string;
}

export type SupportUsageKind = "hint" | "reading-translation" | "listening-transcript" | "writing-model" | "mediation-model" | "library-transcript" | "shadowing-transcript";
export type SupportUsageSurface = "lesson" | "writing-lab" | "mediation-lab" | "library" | "shadowing";

export type ListeningFocusId = "people-roles" | "place-time" | "message-result";
export type ListeningProcessEventKind = "focus-committed" | "playback-started" | "gist-committed" | "detail-committed";

export type ListeningUsageSurface = "onboarding" | "diagnostic" | "lesson" | "library" | "shadowing" | "exam-guided" | "exam-continuous";
export interface ListeningUsageEvent {
  id:string;
  policyVersion:"unified-listening-usage-evidence-v1";
  surface:ListeningUsageSurface;
  contentId:string;
  event:"playback"|"transcript-revealed";
  playbackSource?:"mp3"|"browser-tts";
  playOrdinal:number;
  secondsSinceFirstPlayback?:number;
  revealAfterAnswerCommit?:boolean;
  evidenceBoundary:"process-evidence-no-comprehension-pronunciation-or-mastery-score";
  createdAt:string;
}

export interface ListeningProcessEvent {
  id: string;
  policyVersion: "three-pass-listening-sequence-v1";
  lessonId: string;
  phase: "before" | "during" | "after";
  event: ListeningProcessEventKind;
  focusId?: ListeningFocusId;
  questionId?: string;
  evidenceBoundary: "listening-process-only-no-score-or-mastery";
  createdAt: string;
}

export interface PracticalDayAttempt {
  id:string;
  policyVersion:"multi-step-practical-day-mode-v1";
  scenario:"housing"|"work"|"administration";
  stepIds:string[];
  responseLengths:number[];
  learnerConfirmedCompletion:true;
  evidenceBoundary:"multi-step-practical-process-no-legal-validity-language-score-mastery-or-official-submission";
  createdAt:string;
}

export interface ProsodyRhythmAttempt {
  id:string;
  policyVersion:"local-rhythm-tap-attempt-v1";
  level:CEFRLevel;
  itemId:string;
  tapCount:4;
  intervalsMs:number[];
  input:"pointer-or-keyboard-taps";
  evidenceBoundary:"rhythm-process-only-no-pronunciation-fluency-mastery-or-medical-inference";
  createdAt:string;
}

export interface PronunciationContrastAttempt {
  id: string;
  policyVersion: "articulation-contrast-practice-v1";
  lessonId: string;
  pairId: string;
  targetSide: "left" | "right";
  selectedSide: "left" | "right";
  correct: boolean;
  stimulusSource: "browser-tts-synthetic";
  evidenceBoundary: "synthetic-discrimination-only-no-pronunciation-or-mastery-score";
  createdAt: string;
}

export interface SupportUsageEvent {
  id: string;
  policyVersion: "support-usage-v1";
  kind: SupportUsageKind;
  surface: SupportUsageSurface;
  contentId: string;
  lessonId?: string;
  supportLevel?: 1 | 2;
  afterCommit: boolean;
  evidenceBoundary: "support-context-no-correctness-or-mastery";
  createdAt: string;
}

export interface ReadingBenchmarkAttempt {
  id: string;
  policyVersion: "reading-comprehension-benchmark-v1";
  itemId: string;
  level: CEFRLevel;
  wordCount: number;
  durationSeconds: number;
  comprehensionCorrect: number;
  comprehensionTotal: 2;
  qualified: boolean;
  wordsPerMinute?: number;
  recommendedReadingMinutes?: 5 | 6 | 8 | 10;
  timingSource: "visible-performance-timer";
  evidenceBoundary: "planning-only-no-cefr-or-mastery";
  createdAt: string;
}

export interface WritingBenchmarkAttempt {
  id: string;
  policyVersion: "writing-device-benchmark-v1";
  promptId: string;
  level: CEFRLevel;
  targetCharacterCount: number;
  typedCharacterCount: number;
  durationSeconds: number;
  copyAccuracyPercent: number;
  qualified: boolean;
  charactersPerMinute?: number;
  wordsPerMinute?: number;
  recommendedWritingMinutes?: 5 | 8 | 10 | 12;
  timingSource: "visible-performance-timer";
  evidenceBoundary: "device-input-planning-only-no-language-score";
  createdAt: string;
}

export interface LearningContract {
  id: string;
  policyVersion: "fourteen-day-learning-contract-v1";
  revision: number;
  previousContractId?: string;
  startsOn: string;
  endsOn: string;
  goal: LearnerGoal;
  dailyMinutes: 10 | 20 | 30 | 45 | 60 | 90;
  studyWeekdays: Array<1 | 2 | 3 | 4 | 5 | 6 | 7>;
  evidenceBoundary: "planning-commitment-no-mastery-or-gate";
  createdAt: string;
}

export type PlanningIntensityPreset="light"|"balanced"|"intensive";
export interface PlanningIntensitySettings {policyVersion:"learner-selected-intensity-presets-v1";preset:PlanningIntensityPreset;selectedAt?:string;evidenceBoundary:"learner-selected-session-budget-no-automatic-increase-mastery-or-penalty";}

export interface LibraryInterestPreferences {
  policyVersion:"local-library-interest-profile-v1";
  categoriesAr:string[];
  evidenceBoundary:"learner-selected-library-filter-no-cefr-mastery-tracking-or-content-removal";
}

export interface SpeechPreferences {
  policyVersion:"local-synthetic-voice-preferences-v1";
  voiceURI:string;
  pitch:0.8|1|1.2;
  evidenceBoundary:"local-synthetic-voice-and-pitch-no-tracking-exam-grade-or-pronunciation-score";
}

export interface DataUsagePreferences {
  policyVersion:"persisted-low-data-mode-v1";
  lowDataMode:boolean;
  evidenceBoundary:"local-download-preference-no-autoplay-tracking-mastery-or-automatic-deletion";
}

export interface PinnedLearningTask {
  policyVersion:"learner-pinned-task-v1";
  blockId:string;
  titleAr:string;
  titleDe:string;
  objective:string;
  href:string;
  pinnedAt:string;
  evidenceBoundary:"learner-pin-preserves-coach-recommendation-no-completion-mastery-or-priority-override";
}

export interface StudyRoutineModeSettings {
  policyVersion:"learner-selected-morning-evening-mode-v1";
  mode:"auto"|"morning-quick"|"evening-calm-review";
  selectedAt?:string;
  evidenceBoundary:"learner-selected-entry-mode-no-automatic-completion-mastery-or-time-debt";
}

export interface SessionRitualPreferences {
  policyVersion:"optional-session-rituals-v1";
  startEnabled:boolean;
  endEnabled:boolean;
  evidenceBoundary:"learner-selected-ritual-visibility-no-completion-mastery-or-penalty";
}

export type WeeklyReflectionSuccess="consistency"|"review"|"lesson"|"listening"|"writing"|"speaking";
export type WeeklyReflectionObstacle="time"|"energy"|"difficulty"|"instructions"|"technology"|"none";
export type WeeklyReflectionAdjustment="keep-plan"|"lighter-plan"|"more-review"|"more-production"|"change-study-time";
export interface WeeklyReflectionRecord {
  id:string;
  policyVersion:"independent-weekly-reflection-v1";
  weekStart:string;
  weekEnd:string;
  whatWorked:WeeklyReflectionSuccess[];
  obstacles:WeeklyReflectionObstacle[];
  oneAdjustment:WeeklyReflectionAdjustment;
  note:string;
  source:"weekly-form-only";
  dailyReflectionReuseConsent:false;
  evidenceBoundary:"weekly-learner-planning-only-no-daily-reflection-reuse-mastery-gate-or-psychological-inference";
  createdAt:string;
  updatedAt:string;
}

export interface QuietHoursSettings {
  policyVersion: "quiet-hours-local-v1";
  enabled: boolean;
  startLocal: string;
  endLocal: string;
  timeZone: string;
  notificationBoundary: "no-push-no-notification-api-in-app-nudges-only";
}

export type SessionNextFocus = "continue" | "review" | "lighter" | "production";
export type SessionAdaptationReason = "less-time" | "too-easy" | "too-hard" | "load-suggestion";
export type LoadReductionTrigger = "consecutive-errors" | "active-time-overrun";

export interface LoadReductionOfferRecord {
  id: string;
  policyVersion: "automatic-load-reduction-offer-v1";
  trigger: LoadReductionTrigger;
  consecutiveErrorCount: number;
  activeSeconds: number;
  plannedSeconds: number;
  status: "pending" | "accepted" | "declined";
  offeredOnce: true;
  evidenceBoundary: "learner-controlled-planning-offer-no-penalty-mastery-or-deletion";
  offeredAt: string;
  decidedAt?: string;
}

export interface SessionAdaptationRecord {
  id: string;
  policyVersion: "session-adaptation-v1";
  reason: SessionAdaptationReason;
  beforeMinutes: number;
  afterMinutes: number;
  completedBlockIdsBefore: string[];
  evidenceBoundary: "planning-signal-no-mastery-or-correctness";
  createdAt: string;
}

export interface DailySessionRecord {
  date: string;
  availableMinutes: 10 | 20 | 30 | 45 | 60 | 90;
  energyBefore: 1 | 2 | 3 | 4 | 5;
  checkedInAt: string;
  difficultyAfter?: 1 | 2 | 3 | 4 | 5;
  confidenceAfter?: 1 | 2 | 3 | 4 | 5;
  reflection?: string;
  nextFocus?: SessionNextFocus;
  planningSignal?: "too-easy" | "too-hard";
  adaptations?: SessionAdaptationRecord[];
  missionAlternatives?: MissionAlternativeRecord[];
  activeSeconds?: number;
  activeTimeUpdatedAt?: string;
  loadReductionOffer?: LoadReductionOfferRecord;
  rescueMode?:{
    policyVersion:"save-my-day-ten-minute-v1";
    selectedAt:string;
    evidenceBoundary:"learner-selected-ten-minute-plan-no-completion-mastery-or-penalty";
  };
  reflectedAt?: string;
}

export type DiagnosticProductiveSelfAssessment = "independent" | "with-help" | "not-yet";

export interface DiagnosticProductiveSample {
  policyVersion: "diagnostic-productive-sample-v1";
  promptId: "diagnostic-self-introduction-v1";
  mode: "writing" | "speaking" | "writing-and-speaking" | "not-yet";
  writingText?: string;
  writingWordCount: number;
  speakingMediaId?: string;
  speakingDurationSeconds?: number;
  selfAssessment: DiagnosticProductiveSelfAssessment;
  evaluationBoundary: "self-evidence-no-automated-language-score";
  submittedAt: string;
}

export interface SkillDiagnosticAttempt {
  id: string;
  policyVersion: "single-skill-diagnostic-v1";
  skill: DiagnosticSkill;
  formId: "A" | "B";
  questionIds: string[];
  correctByLevel: Record<CEFRLevel, boolean>;
  correctCount: number;
  attemptedCount: 4;
  recommendedFocusLevel: CEFRLevel;
  priorDiagnosticCompletedAt: string;
  evidenceBoundary: "skill-sample-planning-only-no-level-change";
  createdAt: string;
}

export interface DiagnosticSessionDraft {
  policyVersion:"fatigue-pause-resume-diagnostic-v1";
  formId:"A"|"B";
  questionIds:string[];
  index:number;
  answers:Record<string,number>;
  status:"paused"|"active";
  pauseReason:"learner-fatigue";
  evidenceBoundary:"resume-process-only-no-score-mastery-or-fatigue-diagnosis";
  updatedAt:string;
}

export interface DiagnosticResult {
  estimatedLevel: CEFRLevel;
  score: number;
  maxScore: number;
  levelScores: Record<CEFRLevel, number>;
  levelAttempted?: Record<CEFRLevel, number>;
  skillScores?: Record<DiagnosticSkill, { correct: number; attempted: number }>;
  formId?: "A" | "B";
  questionsAnswered?: number;
  stoppedEarly?: boolean;
  confidence?: "low" | "medium" | "high";
  productiveSample?: DiagnosticProductiveSample;
  completedAt: string;
}

export interface ReviewItem {
  id: string;
  cardId: string;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  lastGrade?: number;
  algorithmVersion: "sm2-v1" | "sm2-v2-calendar";
  calendarPolicyVersion?: "review-calendar-v1";
  calendarTimeZone?: string;
  reviewHourLocal?: number;
}

export interface ReviewEvent {
  id: string;
  cardId: string;
  lessonId: string;
  grade: number;
  evidenceKind: "initial" | "delayed";
  evidenceScope?: "lesson-card" | "personal-error-remediation";
  scheduledFor: string;
  reviewedAt: string;
  masteryDelta: number;
  calendarPolicyVersion?: "review-calendar-v1";
  calendarTimeZone?: string;
}

export type WritingDimensionKey = "task-achievement" | "coherence" | "vocabulary" | "grammar" | "register";

export interface WritingDimensionEvidence {
  key: WritingDimensionKey;
  labelAr: string;
  passed: boolean;
  detailAr: string;
  evidenceQuote?: string;
}

export interface WritingPlan {
  audience: string;
  purpose: string;
  points: string[];
}

export interface WritingSubmission {
  id: string;
  taskId: string;
  text: string;
  wordCount: number;
  version: number;
  status: "draft" | "submitted" | "revised";
  feedback: string[];
  plan?: WritingPlan;
  selfChecklist?: string[];
  dimensions?: WritingDimensionEvidence[];
  sourceVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export type WritingErrorPatternId = "sentence-capitalization" | "ich-infinitive" | "du-infinitive" | "third-person-infinitive" | "bin-heissen" | "weil-copula-order" | "movement-perfect-auxiliary";

export interface WritingRepairAttempt {
  id: string;
  policyVersion: "writing-error-micro-practice-v1";
  exerciseId: string;
  sourceSubmissionId: string;
  taskId: string;
  sourceVersion: number;
  patternId: WritingErrorPatternId;
  answer: string;
  correct: boolean;
  evidenceBoundary: "personal-writing-repair-no-mastery-or-gate";
  createdAt: string;
}

export type WritingReviewIssueCategory = "grammar" | "word-order" | "vocabulary" | "coherence" | "register" | "task-fulfillment" | "uncertain";

export interface WritingAIReviewIssue {
  category: WritingReviewIssueCategory;
  excerpt: string;
  explanationAr: string;
  suggestionDe: string;
  confidence: "medium" | "high";
}

export interface WritingAIReviewEvidence {
  id: string;
  policyVersion: "hybrid-writing-review-v1";
  sourceSubmissionId: string;
  sourceTextSha256: string;
  taskId: string;
  sourceVersion: number;
  provider: "gemini";
  model: string;
  promptVersion: "writing-review-v1";
  consent: "explicit";
  summaryAr: string;
  issues: WritingAIReviewIssue[];
  unresolvedAr: string[];
  evaluationBoundary: "advisory-writing-review-no-official-score-or-mastery";
  createdAt: string;
}

export type MediationDimensionKey = "intent" | "completeness" | "audience" | "constraints" | "response";

export interface MediationDimensionEvidence {
  key: MediationDimensionKey;
  labelAr: string;
  passed: boolean;
  detailAr: string;
  evidenceQuote?: string;
}

export interface MediationSubmission {
  id: string;
  taskId: string;
  audience: string;
  purpose: string;
  keyFacts: string[];
  transferAr: string;
  responseDe: string;
  version: number;
  status: "draft" | "submitted" | "revised";
  selfChecklist: string[];
  dimensions?: MediationDimensionEvidence[];
  feedback: string[];
  sourceVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakingSelfReview {
  listenedBack: boolean;
  achievedCriteria: string[];
  clarityScore: 1 | 2 | 3 | 4 | 5;
  turnTaking: boolean;
  repairUsed: boolean;
  preparationNotes: string[];
  supportVisibleDuringRecording?: boolean;
}

export type SpeakingFollowUpCueCategory = "location" | "work-study" | "preference" | "plan-time" | "reason-opinion" | "keyword" | "ai-grounded";
export type SpeakingFollowUpProvider = AIProvider | "browser-webgpu";

export type AIRequestFailureKind = "rate-limit" | "timeout" | "network" | "http" | "malformed";
export interface AIFallbackEvidence {
  policyVersion: "ai-resilient-fallback-v1";
  attemptedProvider: Exclude<AIProvider, "disabled">;
  attemptedModel: string;
  failureKind: AIRequestFailureKind;
  httpStatus?: number;
  networkAttemptCount: 1;
  fallbackProvider: "disabled";
  fallbackModel: string;
  retryRequiresNewConsent: true;
  failedAt: string;
}

export interface SpeakingContentFollowUpEvidence {
  policyVersion: "content-grounded-follow-up-v1";
  source: "typed-transcript";
  sourceExcerpt?: string;
  sourceTextSha256: string;
  sourceCue: string;
  cueCategory: SpeakingFollowUpCueCategory;
  questionDe: string;
  supportAr: string;
  provider: SpeakingFollowUpProvider;
  model: string;
  consent: "not-required" | "explicit";
  evaluationBoundary: "text-grounded-question-no-stt-no-language-score";
  fallbackEvidence?: AIFallbackEvidence;
  generatedAt: string;
}

export interface SpeakingPauseMetrics {
  policyVersion:"local-rms-pause-estimate-v1";
  sampleIntervalMs:100;
  thresholdRms:0.02;
  estimatedVoicedSeconds:number;
  estimatedSilenceSeconds:number;
  pauseCount:number;
  longestPauseMs:number;
  evidenceBoundary:"energy-only-no-word-phoneme-pronunciation-or-fluency-score";
}
export interface SpeakingConditionAttribution {
  policyVersion:"learner-attributed-language-vs-device-v1";
  category:"language"|"audio-device"|"both"|"unclear";
  factors:Array<"vocabulary"|"grammar"|"planning"|"speed"|"noise"|"microphone"|"playback"|"permission">;
  attribution:"learner-reported-not-automatically-diagnosed";
  evidenceBoundary:"planning-context-no-score-mastery-or-device-diagnosis";
}
export interface SpeakingAttempt {
  id: string;
  taskId: string;
  mediaId?: string;
  durationSeconds: number;
  selfScore: number;
  reflection: string;
  selfReview?: SpeakingSelfReview;
  contentFollowUp?: SpeakingContentFollowUpEvidence;
  targetSeconds?: number;
  preparationSeconds?: number;
  pauseMetrics?: SpeakingPauseMetrics;
  conditionAttribution?: SpeakingConditionAttribution;
  bestForTask?:true;
  bestSelectedAt?:string;
  retryOf?: string;
  createdAt: string;
}

export type AccessibilityFontScale = "compact" | "default" | "large";

export interface AccessibilityPreferences {
  policyVersion: "accessibility-preferences-v1";
  fontScale: AccessibilityFontScale;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface MotivationPreferences {
  policyVersion: "gamification-visibility-v1";
  gamificationVisible: boolean;
}

export type ContentNoteKind = "lesson" | "library" | "exam-task";

export interface ContentNote {
  id: string;
  policyVersion: "local-content-note-v1";
  kind: ContentNoteKind;
  contentId: string;
  bookmarked: boolean;
  note: string;
  evidenceBoundary: "personal-note-no-answer-key-mastery-or-ai";
  createdAt: string;
  updatedAt: string;
}

export interface PersonalVocabularyItem {
  id: string;
  policyVersion: "personal-vocabulary-import-v1"|"writing-derived-vocabulary-preview-v1";
  german: string;
  arabic: string;
  exampleDe?: string;
  tags: string[];
  source: "user-tsv"|"writing-extraction";
  sourceSubmissionId?:string;
  importBatchId: string;
  importedAt: string;
  evidenceBoundary: "personal-vocabulary-no-srs-mastery-or-cefr";
}

export type ContentErrorCategory = "german" | "arabic" | "answer" | "audio" | "accessibility" | "other";

export interface ContentErrorReport {
  id: string;
  policyVersion: "local-content-error-report-v1";
  kind: ContentNoteKind;
  contentId: string;
  route: string;
  titleDe: string;
  titleAr: string;
  category: ContentErrorCategory;
  description: string;
  suggestedCorrection?: string;
  appVersion: "0.1.0";
  status: "local-draft-not-submitted";
  evidenceBoundary: "report-metadata-only-no-answer-key-progress-or-network";
  createdAt: string;
}

export interface AISettings {
  provider: AIProvider;
  model: string;
  enabledFeatures: Array<"tutor" | "writing" | "speaking">;
}

export interface TutorAnswerEvidence {
  hintAr: string;
  explanationAr: string;
  examplesDe: string[];
  microExerciseAr: string;
}

export type TutorFollowUpCommand = "simpler" | "another-example" | "arabic";
export type TutorPromptVersion = "tutor-v2" | "tutor-follow-up-command-v1";

export interface TutorInteraction {
  id: string;
  question: string;
  answer: TutorAnswerEvidence;
  provider: AIProvider;
  model: string;
  promptVersion: TutorPromptVersion;
  lessonId?: string;
  errorIds: string[];
  consent: "not-required" | "explicit";
  command?: TutorFollowUpCommand;
  parentInteractionId?: string;
  commandPolicyVersion?: "tutor-follow-up-command-v1";
  evidenceBoundary?: "support-only-no-answer-key-no-mastery-or-correctness";
  fallbackEvidence?: AIFallbackEvidence;
  createdAt: string;
}

export interface ExerciseAttempt {
  id: string;
  lessonId: string;
  exerciseId: string;
  answer: string;
  correct: boolean;
  confidence?: AnswerConfidence;
  answerIndex?: number;
  shuffleSeed?: string;
  shuffleVersion?: "lesson-shuffle-v1";
  responseTimeMs?:number;
  answerChangeCount?:number;
  uncertaintyKind?:AttemptUncertaintyKind;
  processPolicyVersion?:"bounded-attempt-process-v1";
  createdAt: string;
}

export interface FullExamTaskDraft {
  taskId: string;
  kind: "matching" | "choice" | "listening" | "writing" | "speaking";
  payload: Record<string, unknown>;
  savedAt: string;
}

export interface FullExamSession {
  simulationId: string;
  provider: ExamProvider;
  mode: "continuous-timed";
  status: "active" | "completed" | "expired" | "abandoned";
  startedAt: string;
  deadlineAt: string;
  taskIds: string[];
  completedTaskIds: string[];
  currentTaskId: string | null;
  taskDrafts: Record<string, FullExamTaskDraft>;
  completedAt?: string;
  abandonedAt?: string;
}

export interface LearningState {
  schemaVersion: 3;
  curriculumVersion: "dwnb-a1-b2-2026.09-v1";
  profile: LearnerProfile | null;
  diagnosticResult: DiagnosticResult | null;
  diagnosticSessionDraft:DiagnosticSessionDraft|null;
  skillDiagnosticAttempts: SkillDiagnosticAttempt[];
  learningContracts: LearningContract[];
  planningIntensity:PlanningIntensitySettings;
  pinnedLearningTask:PinnedLearningTask|null;
  studyRoutineMode:StudyRoutineModeSettings;
  libraryInterestPreferences:LibraryInterestPreferences;
  speechPreferences:SpeechPreferences;
  dataUsagePreferences:DataUsagePreferences;
  sessionRitualPreferences:SessionRitualPreferences;
  weeklyReflections:WeeklyReflectionRecord[];
  quietHours: QuietHoursSettings;
  completedBlockIds: string[];
  completedLessonIds: string[];
  currentLessonId: string;
  currentStage: number;
  lessonProgress: Record<string, number>;
  exerciseAttempts: ExerciseAttempt[];
  dueReviews: number;
  mastery: Record<string, number>;
  masteryEvidenceEvents: MasteryEvidenceEvent[];
  errors: ErrorRecord[];
  errorClinicAttempts: ErrorClinicAttempt[];
  reviewItems: ReviewItem[];
  reviewEvents: ReviewEvent[];
  writingSubmissions: WritingSubmission[];
  writingRepairAttempts: WritingRepairAttempt[];
  writingAIReviews: WritingAIReviewEvidence[];
  mediationSubmissions: MediationSubmission[];
  speakingAttempts: SpeakingAttempt[];
  examSessions: Record<string, FullExamSession>;
  accessibilityPreferences: AccessibilityPreferences;
  motivationPreferences: MotivationPreferences;
  contentNotes: ContentNote[];
  personalVocabulary: PersonalVocabularyItem[];
  contentErrorReports: ContentErrorReport[];
  aiSettings: AISettings;
  tutorInteractions: TutorInteraction[];
  studyHistory: StudyDay[];
  trainingInteractionEvents: TrainingInteractionEvent[];
  dictationAttempts: DictationAttempt[];
  branchingConversationAttempts: BranchingConversationAttempt[];
  collocationNetworkAttempts: CollocationNetworkAttempt[];
  supportUsageEvents: SupportUsageEvent[];
  listeningProcessEvents: ListeningProcessEvent[];
  listeningUsageEvents: ListeningUsageEvent[];
  pronunciationContrastAttempts: PronunciationContrastAttempt[];
  prosodyRhythmAttempts:ProsodyRhythmAttempt[];
  practicalDayAttempts:PracticalDayAttempt[];
  dailySessions: Record<string, DailySessionRecord>;
  readingBenchmarkAttempts: ReadingBenchmarkAttempt[];
  writingBenchmarkAttempts: WritingBenchmarkAttempt[];
  lastBackupAt?: string;
  updatedAt: string;
}
