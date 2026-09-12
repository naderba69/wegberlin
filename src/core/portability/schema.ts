import { z } from "zod";
import { DEFAULT_ACCESSIBILITY_PREFERENCES } from "@/core/accessibility/preferences";
import { DEFAULT_MOTIVATION_PREFERENCES } from "@/core/coach/motivation-preferences";
import { CURRENT_CURRICULUM_VERSION } from "@/config/curriculum-version";

const onboardingLearningContextSchema=z.object({
  policyVersion:z.literal("prior-experience-context-v1"),
  priorLearningSources:z.array(z.enum(["school","course","book","app","self-study","other"])).max(6),
  priorCourseOrBookNote:z.string().max(160).optional(),
  concerns:z.array(z.enum(["speaking","listening","writing","grammar","pronunciation","exam","time","technology"])).max(8),
  evidenceBoundary:z.literal("learner-stated-planning-context-no-level-or-mastery"),
}).strict().superRefine((context,refinement)=>{
  if(new Set(context.priorLearningSources).size!==context.priorLearningSources.length)refinement.addIssue({code:"custom",message:"Prior learning sources must be unique."});
  if(new Set(context.concerns).size!==context.concerns.length)refinement.addIssue({code:"custom",message:"Learning concerns must be unique."});
});

const profileSchema = z.object({
  name: z.string().min(1),
  targetExam: z.enum(["goethe-b2", "telc-deutsch-b2"]),
  targetDate: z.string().optional(),
  dailyMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  arabicSupport: z.enum(["modern-standard-arabic", "tunisian-supported", "minimal-arabic"]),
  currentLevel: z.enum(["A1", "A2", "B1", "B2"]),
  goals: z.array(z.enum(["exam", "work", "study", "daily-life", "settlement"])).min(1).max(5).optional(),
  deviceReadiness: z.object({
    audio: z.enum(["unchecked", "ready", "unavailable", "permission-denied", "skipped"]),
    microphone: z.enum(["unchecked", "ready", "unavailable", "permission-denied", "skipped"]),
    checkedAt: z.string().optional(),
  }).optional(),
  priorExperience: z.enum(["none", "some", "unsure"]).optional(),
  onboardingContext:onboardingLearningContextSchema.optional(),
  createdAt: z.string(),
});

const diagnosticSchema = z.object({
  estimatedLevel: z.enum(["A1", "A2", "B1", "B2"]),
  score: z.number().int().nonnegative(),
  maxScore: z.number().int().positive(),
  levelScores: z.object({ A1: z.number(), A2: z.number(), B1: z.number(), B2: z.number() }),
  levelAttempted: z.object({ A1: z.number(), A2: z.number(), B1: z.number(), B2: z.number() }).optional(),
  skillScores: z.object({
    grammar: z.object({ correct: z.number().int().nonnegative(), attempted: z.number().int().nonnegative() }),
    vocabulary: z.object({ correct: z.number().int().nonnegative(), attempted: z.number().int().nonnegative() }),
    reading: z.object({ correct: z.number().int().nonnegative(), attempted: z.number().int().nonnegative() }),
    listening: z.object({ correct: z.number().int().nonnegative(), attempted: z.number().int().nonnegative() }),
  }).optional(),
  formId: z.enum(["A", "B"]).optional(),
  questionsAnswered: z.number().int().positive().optional(),
  stoppedEarly: z.boolean().optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
  productiveSample: z.object({
    policyVersion: z.literal("diagnostic-productive-sample-v1"),
    promptId: z.literal("diagnostic-self-introduction-v1"),
    mode: z.enum(["writing", "speaking", "writing-and-speaking", "not-yet"]),
    writingText: z.string().optional(),
    writingWordCount: z.number().int().nonnegative(),
    speakingMediaId: z.string().optional(),
    speakingDurationSeconds: z.number().int().positive().optional(),
    selfAssessment: z.enum(["independent", "with-help", "not-yet"]),
    evaluationBoundary: z.literal("self-evidence-no-automated-language-score"),
    submittedAt: z.string(),
  }).optional(),
  completedAt: z.string(),
});

const aiFallbackSchema = z.object({policyVersion:z.literal("ai-resilient-fallback-v1"),attemptedProvider:z.enum(["gemini","openrouter","local"]),attemptedModel:z.string(),failureKind:z.enum(["rate-limit","timeout","network","http","malformed"]),httpStatus:z.number().int().optional(),networkAttemptCount:z.literal(1),fallbackProvider:z.literal("disabled"),fallbackModel:z.string(),retryRequiresNewConsent:z.literal(true),failedAt:z.string()});

const listeningProcessEventSchema = z.object({
  id:z.string(),policyVersion:z.literal("three-pass-listening-sequence-v1"),lessonId:z.string(),phase:z.enum(["before","during","after"]),event:z.enum(["focus-committed","playback-started","gist-committed","detail-committed"]),focusId:z.enum(["people-roles","place-time","message-result"]).optional(),questionId:z.string().optional(),evidenceBoundary:z.literal("listening-process-only-no-score-or-mastery"),createdAt:z.string(),
}).superRefine((event,context)=>{
  const expectedPhase=event.event==="focus-committed"?"before":event.event==="detail-committed"?"after":"during";
  if(event.phase!==expectedPhase)context.addIssue({code:"custom",message:"Listening event phase does not match its event."});
  if((event.event==="focus-committed")!==Boolean(event.focusId))context.addIssue({code:"custom",message:"Only a focus event must carry focusId."});
  if((["gist-committed","detail-committed"].includes(event.event))!==Boolean(event.questionId))context.addIssue({code:"custom",message:"Only committed answer events must carry questionId."});
});

const pronunciationContrastAttemptSchema = z.object({
  id:z.string(),policyVersion:z.literal("articulation-contrast-practice-v1"),lessonId:z.string(),pairId:z.string(),targetSide:z.enum(["left","right"]),selectedSide:z.enum(["left","right"]),correct:z.boolean(),stimulusSource:z.literal("browser-tts-synthetic"),evidenceBoundary:z.literal("synthetic-discrimination-only-no-pronunciation-or-mastery-score"),createdAt:z.string(),
}).superRefine((attempt,context)=>{if(attempt.correct!==(attempt.targetSide===attempt.selectedSide))context.addIssue({code:"custom",message:"Pronunciation contrast correctness must describe only the synthetic target match."});});

const tutorInteractionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.object({
    hintAr: z.string(),
    explanationAr: z.string(),
    examplesDe: z.array(z.string()),
    microExerciseAr: z.string(),
  }),
  provider: z.enum(["disabled", "gemini", "openrouter", "local"]),
  model: z.string(),
  promptVersion: z.enum(["tutor-v2", "tutor-follow-up-command-v1"]),
  lessonId: z.string().optional(),
  errorIds: z.array(z.string()),
  consent: z.enum(["not-required", "explicit"]),
  command: z.enum(["simpler", "another-example", "arabic"]).optional(),
  parentInteractionId: z.string().optional(),
  commandPolicyVersion: z.literal("tutor-follow-up-command-v1").optional(),
  evidenceBoundary: z.literal("support-only-no-answer-key-no-mastery-or-correctness").optional(),
  fallbackEvidence: aiFallbackSchema.optional(),
  createdAt: z.string(),
}).superRefine((interaction, context) => {
  const isCommand = interaction.promptVersion === "tutor-follow-up-command-v1";
  const hasAllCommandFields = Boolean(interaction.command && interaction.parentInteractionId && interaction.commandPolicyVersion && interaction.evidenceBoundary);
  if (isCommand !== hasAllCommandFields) context.addIssue({ code: "custom", message: "Tutor command provenance must be complete and command-only." });
});

const missionAlternativeSchema=z.object({
  id:z.string().min(1),policyVersion:z.literal("equivalent-mission-alternative-v1"),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),originalBlockId:z.string().min(1),alternativeBlockId:z.string().min(1),originalKind:z.enum(["diagnostic","check-in","review","warmup","lesson","reading","writing","practice","production","reflection"]),alternativeTitleAr:z.string().min(1).max(180),alternativeTitleDe:z.string().min(1).max(180),objectiveSnapshot:z.string().min(1).max(700),evidenceKind:z.enum(["diagnostic-sample","planning-check-in","retrieval-process","lesson-evidence","reading-comprehension","writing-production","controlled-practice","productive-practice","planning-reflection"]),minutes:z.number().int().positive().max(90),href:z.string().regex(/^\/(?!\/)/),reason:z.literal("learner-declined-now"),originalCompletedAtSelection:z.literal(false),evidenceBoundary:z.literal("planning-substitution-no-completion-mastery-or-correctness"),createdAt:z.string(),
}).strict().superRefine((record,context)=>{if(record.alternativeBlockId!==`alternative-${record.originalBlockId}`)context.addIssue({code:"custom",message:"Alternative block id must be derived from its original block."});});

const sessionAdaptationSchema=z.object({
  id:z.string().min(1),policyVersion:z.literal("session-adaptation-v1"),reason:z.enum(["less-time","too-easy","too-hard","load-suggestion"]),beforeMinutes:z.number().int().positive(),afterMinutes:z.number().int().positive(),completedBlockIdsBefore:z.array(z.string()),evidenceBoundary:z.literal("planning-signal-no-mastery-or-correctness"),createdAt:z.string(),
}).strict();

const loadReductionOfferSchema=z.object({
  id:z.string().min(1),policyVersion:z.literal("automatic-load-reduction-offer-v1"),trigger:z.enum(["consecutive-errors","active-time-overrun"]),consecutiveErrorCount:z.number().int().nonnegative(),activeSeconds:z.number().int().nonnegative(),plannedSeconds:z.number().int().positive(),status:z.enum(["pending","accepted","declined"]),offeredOnce:z.literal(true),evidenceBoundary:z.literal("learner-controlled-planning-offer-no-penalty-mastery-or-deletion"),offeredAt:z.string(),decidedAt:z.string().optional(),
}).strict().superRefine((offer,context)=>{if((offer.status==="pending")===Boolean(offer.decidedAt))context.addIssue({code:"custom",message:"Only a decided load offer must carry decidedAt."});});

const errorSchema = z.object({
  id: z.string(),
  type: z.enum(["article", "case", "word-order", "vocabulary", "spelling", "tense", "grammar"]),
  wrong: z.string(),
  correct: z.string(),
  explanationAr: z.string(),
  occurrences: z.number().int().positive(),
  lastSeenAt: z.string(),
  sourceLessonId: z.string().optional(),
  sourceExerciseId: z.string().optional(),
  lastConfidence: z.enum(["low", "medium", "high"]).optional(),
  highConfidenceWrongCount: z.number().int().nonnegative().optional(),
  patternClassification: z.enum(["possible-slip", "emerging-pattern", "misconception-risk"]).optional(),
  classificationPolicyVersion: z.literal("error-pattern-classification-v1").optional(),
  failedRepairCount: z.number().int().nonnegative().optional(),
  lastFailedRepairAt: z.string().optional(),
  resolved: z.boolean().optional(),
  repairCount: z.number().int().nonnegative().optional(),
  lastRepairedAt: z.string().optional(),
  nextReviewAt: z.string().optional(),
  confirmedAt: z.string().optional(),
  learnerContextTags: z.array(z.literal("knows-rule-under-time-pressure")).max(1).optional(),
  sensitiveInPrint: z.boolean().optional(),
  learnerMetadataUpdatedAt: z.string().optional(),
}).superRefine((error,context)=>{const hasMetadata=Boolean(error.learnerContextTags?.length||error.sensitiveInPrint);if(hasMetadata&&!error.learnerMetadataUpdatedAt)context.addIssue({code:"custom",message:"Learner error metadata requires an update timestamp."});});

export const learningStateSchema = z.object({
  schemaVersion: z.literal(3),
  curriculumVersion: z.literal(CURRENT_CURRICULUM_VERSION).default(CURRENT_CURRICULUM_VERSION),
  profile: profileSchema.nullable(),
  diagnosticResult: diagnosticSchema.nullable(),
  diagnosticSessionDraft:z.object({policyVersion:z.literal("fatigue-pause-resume-diagnostic-v1"),formId:z.enum(["A","B"]),questionIds:z.array(z.string()).min(1).max(16),index:z.number().int().min(0).max(15),answers:z.record(z.string(),z.number().int().min(0).max(3)),status:z.enum(["paused","active"]),pauseReason:z.literal("learner-fatigue"),evidenceBoundary:z.literal("resume-process-only-no-score-mastery-or-fatigue-diagnosis"),updatedAt:z.string()}).strict().nullable().default(null),
  skillDiagnosticAttempts: z.array(z.object({id:z.string(),policyVersion:z.literal("single-skill-diagnostic-v1"),skill:z.enum(["grammar","vocabulary","reading","listening"]),formId:z.enum(["A","B"]),questionIds:z.array(z.string()).length(4),correctByLevel:z.object({A1:z.boolean(),A2:z.boolean(),B1:z.boolean(),B2:z.boolean()}),correctCount:z.number().int().min(0).max(4),attemptedCount:z.literal(4),recommendedFocusLevel:z.enum(["A1","A2","B1","B2"]),priorDiagnosticCompletedAt:z.string(),evidenceBoundary:z.literal("skill-sample-planning-only-no-level-change"),createdAt:z.string()})).default([]),
  learningContracts: z.array(z.object({id:z.string(),policyVersion:z.literal("fourteen-day-learning-contract-v1"),revision:z.number().int().positive(),previousContractId:z.string().optional(),startsOn:z.string(),endsOn:z.string(),goal:z.enum(["exam","work","study","daily-life","settlement"]),dailyMinutes:z.union([z.literal(10),z.literal(20),z.literal(30),z.literal(45),z.literal(60),z.literal(90)]),studyWeekdays:z.array(z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6),z.literal(7)])).min(1),evidenceBoundary:z.literal("planning-commitment-no-mastery-or-gate"),createdAt:z.string()})).default([]),
  planningIntensity:z.object({policyVersion:z.literal("learner-selected-intensity-presets-v1"),preset:z.enum(["light","balanced","intensive"]),selectedAt:z.string().optional(),evidenceBoundary:z.literal("learner-selected-session-budget-no-automatic-increase-mastery-or-penalty")}).strict().default({policyVersion:"learner-selected-intensity-presets-v1",preset:"balanced",evidenceBoundary:"learner-selected-session-budget-no-automatic-increase-mastery-or-penalty"}),
  pinnedLearningTask:z.object({policyVersion:z.literal("learner-pinned-task-v1"),blockId:z.string().min(1).max(200),titleAr:z.string().min(1).max(180),titleDe:z.string().min(1).max(180),objective:z.string().min(1).max(700),href:z.string().regex(/^\/(?!\/)/),pinnedAt:z.string(),evidenceBoundary:z.literal("learner-pin-preserves-coach-recommendation-no-completion-mastery-or-priority-override")}).strict().nullable().default(null),
  studyRoutineMode:z.object({policyVersion:z.literal("learner-selected-morning-evening-mode-v1"),mode:z.enum(["auto","morning-quick","evening-calm-review"]),selectedAt:z.string().optional(),evidenceBoundary:z.literal("learner-selected-entry-mode-no-automatic-completion-mastery-or-time-debt")}).strict().default({policyVersion:"learner-selected-morning-evening-mode-v1",mode:"auto",evidenceBoundary:"learner-selected-entry-mode-no-automatic-completion-mastery-or-time-debt"}),
  libraryInterestPreferences:z.object({policyVersion:z.literal("local-library-interest-profile-v1"),categoriesAr:z.array(z.string().min(1).max(40)).max(12),evidenceBoundary:z.literal("learner-selected-library-filter-no-cefr-mastery-tracking-or-content-removal")}).strict().default({policyVersion:"local-library-interest-profile-v1",categoriesAr:[],evidenceBoundary:"learner-selected-library-filter-no-cefr-mastery-tracking-or-content-removal"}),
  speechPreferences:z.object({policyVersion:z.literal("local-synthetic-voice-preferences-v1"),voiceURI:z.string().min(1).max(300),pitch:z.union([z.literal(0.8),z.literal(1),z.literal(1.2)]),evidenceBoundary:z.literal("local-synthetic-voice-and-pitch-no-tracking-exam-grade-or-pronunciation-score")}).strict().default({policyVersion:"local-synthetic-voice-preferences-v1",voiceURI:"system-default-de",pitch:1,evidenceBoundary:"local-synthetic-voice-and-pitch-no-tracking-exam-grade-or-pronunciation-score"}),
  dataUsagePreferences:z.object({policyVersion:z.literal("persisted-low-data-mode-v1"),lowDataMode:z.boolean(),evidenceBoundary:z.literal("local-download-preference-no-autoplay-tracking-mastery-or-automatic-deletion")}).strict().default({policyVersion:"persisted-low-data-mode-v1",lowDataMode:false,evidenceBoundary:"local-download-preference-no-autoplay-tracking-mastery-or-automatic-deletion"}),
  sessionRitualPreferences:z.object({policyVersion:z.literal("optional-session-rituals-v1"),startEnabled:z.boolean(),endEnabled:z.boolean(),evidenceBoundary:z.literal("learner-selected-ritual-visibility-no-completion-mastery-or-penalty")}).strict().default({policyVersion:"optional-session-rituals-v1",startEnabled:true,endEnabled:true,evidenceBoundary:"learner-selected-ritual-visibility-no-completion-mastery-or-penalty"}),
  weeklyReflections:z.array(z.object({id:z.string(),policyVersion:z.literal("independent-weekly-reflection-v1"),weekStart:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),weekEnd:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),whatWorked:z.array(z.enum(["consistency","review","lesson","listening","writing","speaking"])).max(6),obstacles:z.array(z.enum(["time","energy","difficulty","instructions","technology","none"])).max(6),oneAdjustment:z.enum(["keep-plan","lighter-plan","more-review","more-production","change-study-time"]),note:z.string().max(400),source:z.literal("weekly-form-only"),dailyReflectionReuseConsent:z.literal(false),evidenceBoundary:z.literal("weekly-learner-planning-only-no-daily-reflection-reuse-mastery-gate-or-psychological-inference"),createdAt:z.string(),updatedAt:z.string()}).strict()).default([]),
  quietHours: z.object({policyVersion:z.literal("quiet-hours-local-v1"),enabled:z.boolean(),startLocal:z.string().regex(/^\d{2}:\d{2}$/),endLocal:z.string().regex(/^\d{2}:\d{2}$/),timeZone:z.string(),notificationBoundary:z.literal("no-push-no-notification-api-in-app-nudges-only")}).default({policyVersion:"quiet-hours-local-v1",enabled:false,startLocal:"22:00",endLocal:"07:00",timeZone:"UTC",notificationBoundary:"no-push-no-notification-api-in-app-nudges-only"}),
  completedBlockIds: z.array(z.string()),
  completedLessonIds: z.array(z.string()),
  currentLessonId: z.string(),
  currentStage: z.number().int().min(0).max(13),
  lessonProgress: z.record(z.string(), z.number().int().min(0).max(13)),
  exerciseAttempts: z.array(z.object({ id:z.string(), lessonId:z.string(), exerciseId:z.string(), answer:z.string(), correct:z.boolean(), confidence:z.enum(["low","medium","high"]).optional(), answerIndex:z.number().int().nonnegative().optional(), shuffleSeed:z.string().optional(), shuffleVersion:z.literal("lesson-shuffle-v1").optional(), responseTimeMs:z.number().int().min(0).max(1_800_000).optional(), answerChangeCount:z.number().int().min(0).max(100).optional(), uncertaintyKind:z.enum(["knowledge-recall","guess","instruction-unclear"]).optional(), processPolicyVersion:z.literal("bounded-attempt-process-v1").optional(), createdAt:z.string() }).strict().superRefine((attempt,context)=>{const hasProcess=attempt.responseTimeMs!==undefined||attempt.answerChangeCount!==undefined||attempt.uncertaintyKind!==undefined;if(hasProcess&&!attempt.processPolicyVersion)context.addIssue({code:"custom",message:"Attempt process metadata requires its policy version."});})), 
  dueReviews: z.number().int().nonnegative(),
  mastery: z.record(z.string(), z.number().min(0).max(100)),
  masteryEvidenceEvents:z.array(z.object({id:z.string().min(1).max(500),policyVersion:z.literal("event-derived-mastery-v1"),key:z.string().min(1).max(240),operation:z.enum(["set","increment","delete"]),value:z.number().min(-100).max(100).optional(),previousValue:z.number().min(0).max(100).optional(),resultingValue:z.number().min(0).max(100).optional(),source:z.enum(["diagnostic-assessment","lesson-evidence","module-assessment","level-assessment","targeted-exam","full-exam-workflow","other-learning-evidence"]),evidenceRefs:z.array(z.string().min(1).max(500)).max(64),evidenceBoundary:z.literal("event-log-authoritative-for-new-mutations-legacy-snapshot-fallback-explicit"),createdAt:z.string()}).strict().superRefine((event,context)=>{if(event.operation==="delete"&&event.value!==undefined)context.addIssue({code:"custom",message:"Delete mastery event must omit value."});if(event.operation!=="delete"&&event.value===undefined)context.addIssue({code:"custom",message:"Set/increment mastery event requires value."});if(event.operation==="delete"&&event.resultingValue!==undefined)context.addIssue({code:"custom",message:"Delete mastery event must omit resultingValue."});})).default([]),
  errors: z.array(errorSchema),
  errorClinicAttempts: z.array(z.object({
    id: z.string(),
    clinicType: z.enum(["article", "case", "word-order", "vocabulary", "spelling", "tense", "grammar"]),
    sourceErrorIds: z.array(z.string()),
    answer: z.string(),
    correct: z.boolean(),
    createdAt: z.string(),
  })).default([]),
  reviewItems: z.array(z.object({
    id: z.string(), cardId: z.string(), repetitions: z.number().int().nonnegative(), interval: z.number().int().nonnegative(),
    easeFactor: z.number().min(1.3), nextReviewDate: z.string(), lastGrade: z.number().int().min(0).max(5).optional(), algorithmVersion: z.enum(["sm2-v1", "sm2-v2-calendar"]),
    calendarPolicyVersion: z.literal("review-calendar-v1").optional(), calendarTimeZone: z.string().optional(), reviewHourLocal: z.number().int().min(0).max(23).optional(),
  })),
  reviewEvents: z.array(z.object({
    id: z.string(), cardId: z.string(), lessonId: z.string(), grade: z.number().int().min(0).max(5),
    evidenceKind: z.enum(["initial", "delayed"]), evidenceScope: z.enum(["lesson-card", "personal-error-remediation"]).optional(), scheduledFor: z.string(), reviewedAt: z.string(), masteryDelta: z.number().int().nonnegative(),
    calendarPolicyVersion: z.literal("review-calendar-v1").optional(), calendarTimeZone: z.string().optional(),
  })).default([]),
  writingSubmissions: z.array(z.object({
    id: z.string(), taskId: z.string(), text: z.string(), wordCount: z.number().int().nonnegative(), version: z.number().int().positive(),
    status: z.enum(["draft", "submitted", "revised"]), feedback: z.array(z.string()),
    plan: z.object({ audience:z.string(),purpose:z.string(),points:z.array(z.string()) }).optional(),
    selfChecklist: z.array(z.string()).optional(),
    dimensions: z.array(z.object({ key:z.enum(["task-achievement","coherence","vocabulary","grammar","register"]),labelAr:z.string(),passed:z.boolean(),detailAr:z.string(),evidenceQuote:z.string().optional() })).optional(),
    sourceVersion: z.number().int().positive().optional(),
    createdAt: z.string(), updatedAt: z.string(),
  })),
  writingRepairAttempts: z.array(z.object({
    id:z.string(),policyVersion:z.literal("writing-error-micro-practice-v1"),exerciseId:z.string(),sourceSubmissionId:z.string(),taskId:z.string(),sourceVersion:z.number().int().positive(),patternId:z.enum(["sentence-capitalization","ich-infinitive","du-infinitive","third-person-infinitive","bin-heissen","weil-copula-order","movement-perfect-auxiliary"]),answer:z.string().max(220),correct:z.boolean(),evidenceBoundary:z.literal("personal-writing-repair-no-mastery-or-gate"),createdAt:z.string(),
  })).default([]),
  writingAIReviews: z.array(z.object({
    id:z.string(),policyVersion:z.literal("hybrid-writing-review-v1"),sourceSubmissionId:z.string(),sourceTextSha256:z.string().regex(/^[a-f0-9]{64}$/),taskId:z.string(),sourceVersion:z.number().int().positive(),provider:z.literal("gemini"),model:z.string(),promptVersion:z.literal("writing-review-v1"),consent:z.literal("explicit"),summaryAr:z.string().max(1200),issues:z.array(z.object({category:z.enum(["grammar","word-order","vocabulary","coherence","register","task-fulfillment","uncertain"]),excerpt:z.string().max(180),explanationAr:z.string().max(600),suggestionDe:z.string().max(300),confidence:z.enum(["medium","high"])})).max(8),unresolvedAr:z.array(z.string().max(300)).max(5),evaluationBoundary:z.literal("advisory-writing-review-no-official-score-or-mastery"),createdAt:z.string(),
  })).default([]),
  mediationSubmissions: z.array(z.object({
    id:z.string(),taskId:z.string(),audience:z.string(),purpose:z.string(),keyFacts:z.array(z.string()),transferAr:z.string(),responseDe:z.string(),version:z.number().int().positive(),status:z.enum(["draft","submitted","revised"]),selfChecklist:z.array(z.string()),
    dimensions:z.array(z.object({key:z.enum(["intent","completeness","audience","constraints","response"]),labelAr:z.string(),passed:z.boolean(),detailAr:z.string(),evidenceQuote:z.string().optional()})).optional(),
    feedback:z.array(z.string()),sourceVersion:z.number().int().positive().optional(),createdAt:z.string(),updatedAt:z.string(),
  })).default([]),
  speakingAttempts: z.array(z.object({
    id: z.string(), taskId: z.string(), mediaId: z.string().optional(), durationSeconds: z.number().nonnegative(), selfScore: z.number().min(0).max(5), reflection: z.string(),
    selfReview: z.object({ listenedBack:z.boolean(),achievedCriteria:z.array(z.string()),clarityScore:z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5)]),turnTaking:z.boolean(),repairUsed:z.boolean(),preparationNotes:z.array(z.string()),supportVisibleDuringRecording:z.boolean().optional() }).optional(),
    contentFollowUp: z.object({
      policyVersion:z.literal("content-grounded-follow-up-v1"),source:z.literal("typed-transcript"),sourceExcerpt:z.string().max(180).optional(),sourceTextSha256:z.string().regex(/^[a-f0-9]{64}$/),sourceCue:z.string().min(1).max(80),cueCategory:z.enum(["location","work-study","preference","plan-time","reason-opinion","keyword","ai-grounded"]),questionDe:z.string().min(3).max(240),supportAr:z.string().min(3).max(500),provider:z.enum(["disabled","gemini","openrouter","local","browser-webgpu"]),model:z.string().min(1),consent:z.enum(["not-required","explicit"]),evaluationBoundary:z.literal("text-grounded-question-no-stt-no-language-score"),fallbackEvidence:aiFallbackSchema.optional(),generatedAt:z.string(),
    }).optional(),
    targetSeconds: z.number().int().positive().optional(), preparationSeconds: z.number().int().nonnegative().optional(),
    pauseMetrics:z.object({policyVersion:z.literal("local-rms-pause-estimate-v1"),sampleIntervalMs:z.literal(100),thresholdRms:z.literal(0.02),estimatedVoicedSeconds:z.number().nonnegative(),estimatedSilenceSeconds:z.number().nonnegative(),pauseCount:z.number().int().nonnegative(),longestPauseMs:z.number().int().nonnegative(),evidenceBoundary:z.literal("energy-only-no-word-phoneme-pronunciation-or-fluency-score")}).strict().optional(),
    conditionAttribution:z.object({policyVersion:z.literal("learner-attributed-language-vs-device-v1"),category:z.enum(["language","audio-device","both","unclear"]),factors:z.array(z.enum(["vocabulary","grammar","planning","speed","noise","microphone","playback","permission"])).max(8),attribution:z.literal("learner-reported-not-automatically-diagnosed"),evidenceBoundary:z.literal("planning-context-no-score-mastery-or-device-diagnosis")}).strict().optional(),
    bestForTask:z.literal(true).optional(),bestSelectedAt:z.string().optional(),
    retryOf: z.string().optional(), createdAt: z.string(),
  })),
  examSessions: z.record(z.string(), z.object({
    simulationId: z.string(),
    provider: z.enum(["goethe-b2", "telc-deutsch-b2"]),
    mode: z.literal("continuous-timed"),
    status: z.enum(["active", "completed", "expired", "abandoned"]),
    startedAt: z.string(),
    deadlineAt: z.string(),
    taskIds: z.array(z.string()),
    completedTaskIds: z.array(z.string()),
    currentTaskId: z.string().nullable(),
    taskDrafts: z.record(z.string(), z.object({
      taskId: z.string(),
      kind: z.enum(["matching", "choice", "listening", "writing", "speaking"]),
      payload: z.record(z.string(), z.unknown()),
      savedAt: z.string(),
    })).default({}),
    completedAt: z.string().optional(),
    abandonedAt: z.string().optional(),
  })).default({}),
  accessibilityPreferences: z.object({
    policyVersion: z.literal("accessibility-preferences-v1"),
    fontScale: z.enum(["compact", "default", "large"]),
    highContrast: z.boolean(),
    reducedMotion: z.boolean(),
  }).default(DEFAULT_ACCESSIBILITY_PREFERENCES),
  motivationPreferences: z.object({
    policyVersion: z.literal("gamification-visibility-v1"),
    gamificationVisible: z.boolean(),
  }).default(DEFAULT_MOTIVATION_PREFERENCES),
  contentNotes: z.array(z.object({
    id:z.string(),policyVersion:z.literal("local-content-note-v1"),kind:z.enum(["lesson","library","exam-task"]),contentId:z.string(),bookmarked:z.boolean(),note:z.string().max(600),evidenceBoundary:z.literal("personal-note-no-answer-key-mastery-or-ai"),createdAt:z.string(),updatedAt:z.string(),
  })).default([]),
  personalVocabulary: z.array(z.object({
    id:z.string(),policyVersion:z.union([z.literal("personal-vocabulary-import-v1"),z.literal("writing-derived-vocabulary-preview-v1")]),german:z.string().min(1).max(80),arabic:z.string().min(1).max(120),exampleDe:z.string().max(240).optional(),tags:z.array(z.string().max(24)).max(6),source:z.union([z.literal("user-tsv"),z.literal("writing-extraction")]),sourceSubmissionId:z.string().optional(),importBatchId:z.string(),importedAt:z.string(),evidenceBoundary:z.literal("personal-vocabulary-no-srs-mastery-or-cefr"),
  })).default([]),
  contentErrorReports: z.array(z.object({
    id:z.string(),policyVersion:z.literal("local-content-error-report-v1"),kind:z.enum(["lesson","library","exam-task"]),contentId:z.string(),route:z.string(),titleDe:z.string(),titleAr:z.string(),category:z.enum(["german","arabic","answer","audio","accessibility","other"]),description:z.string().min(10).max(1000),suggestedCorrection:z.string().max(600).optional(),appVersion:z.literal("0.1.0"),status:z.literal("local-draft-not-submitted"),evidenceBoundary:z.literal("report-metadata-only-no-answer-key-progress-or-network"),createdAt:z.string(),
  })).default([]),
  aiSettings: z.object({
    provider: z.enum(["disabled", "gemini", "openrouter", "local"]), model: z.string(), enabledFeatures: z.array(z.enum(["tutor", "writing", "speaking"])),
  }),
  tutorInteractions: z.array(tutorInteractionSchema).default([]),
  studyHistory: z.array(z.object({ date: z.string(), minutes: z.number().nonnegative(), evidenceCount: z.number().int().nonnegative() })),
  trainingInteractionEvents:z.array(z.object({id:z.string(),policyVersion:z.literal("training-interaction-log-v1"),surface:z.enum(["writing-draft","library-question"]),contentId:z.string().min(1).max(240),event:z.enum(["pause","resume","answer-change"]),sequence:z.number().int().positive(),evidenceBoundary:z.literal("process-metadata-only-no-answer-text-correctness-mastery-or-keystrokes"),createdAt:z.string()}).strict()).default([]),
  dictationAttempts:z.array(z.object({id:z.string(),policyVersion:z.literal("adaptive-partial-full-dictation-v1"),itemId:z.string().min(1).max(120),level:z.enum(["A1","A2","B1","B2"]),mode:z.enum(["partial","full"]),exact:z.boolean(),wordAccuracyPercent:z.number().int().min(0).max(100),errorCount:z.number().int().nonnegative(),playbackCount:z.number().int().positive(),retryOf:z.string().optional(),evidenceBoundary:z.literal("local-form-summary-no-answer-text-cefr-mastery-or-exam-score"),createdAt:z.string()}).strict().superRefine((attempt,context)=>{if(attempt.exact!==(attempt.errorCount===0&&attempt.wordAccuracyPercent===100))context.addIssue({code:"custom",message:"Dictation exactness must match its bounded summary."});})).default([]),
  branchingConversationAttempts:z.array(z.object({id:z.string(),policyVersion:z.literal("offline-branching-conversation-v1"),scenarioId:z.string().min(1).max(120),level:z.enum(["A1","A2","B1","B2"]),mode:z.enum(["guided","challenge"]),choiceIds:z.array(z.string().min(1).max(160)).min(1).max(3),outcome:z.enum(["goal-reached","partial","restart-recommended"]),completedTurns:z.number().int().min(1).max(3),supportOpenCount:z.number().int().min(0).max(12),engine:z.literal("deterministic-local-tree"),evidenceBoundary:z.literal("structured-local-simulation-no-free-text-ai-live-partner-mastery-or-cefr"),createdAt:z.string()}).strict().superRefine((attempt,context)=>{if(attempt.completedTurns!==attempt.choiceIds.length)context.addIssue({code:"custom",message:"Conversation turn count must match choice provenance."});})).default([]),
  collocationNetworkAttempts:z.array(z.object({id:z.string(),policyVersion:z.literal("contextual-collocation-network-v1"),networkId:z.string().min(1).max(120),level:z.enum(["A1","A2","B1","B2"]),mode:z.enum(["guided","challenge"]),visitedNodeIds:z.array(z.string().min(1).max(160)).length(3),targetNodeIds:z.array(z.string().min(1).max(160)).length(3),selectedNodeIds:z.array(z.string().min(1).max(160)).length(3),correctCount:z.number().int().min(0).max(3),total:z.literal(3),engine:z.literal("deterministic-context-match"),evidenceBoundary:z.literal("structured-context-practice-no-free-text-ai-mastery-or-cefr"),createdAt:z.string()}).strict().superRefine((attempt,context)=>{if(new Set(attempt.visitedNodeIds).size!==3||new Set(attempt.targetNodeIds).size!==3)context.addIssue({code:"custom",message:"Collocation attempt requires three unique explored targets."});if(attempt.correctCount!==attempt.targetNodeIds.filter((id,index)=>id===attempt.selectedNodeIds[index]).length)context.addIssue({code:"custom",message:"Collocation correctness must match selected target IDs."});})).default([]),
  supportUsageEvents: z.array(z.object({
    id:z.string(),policyVersion:z.literal("support-usage-v1"),kind:z.enum(["hint","reading-translation","listening-transcript","writing-model","mediation-model","library-transcript","shadowing-transcript"]),surface:z.enum(["lesson","writing-lab","mediation-lab","library","shadowing"]),contentId:z.string().min(1),lessonId:z.string().optional(),supportLevel:z.union([z.literal(1),z.literal(2)]).optional(),afterCommit:z.boolean(),evidenceBoundary:z.literal("support-context-no-correctness-or-mastery"),createdAt:z.string(),
  })).default([]),
  listeningProcessEvents: z.array(listeningProcessEventSchema).default([]),
  listeningUsageEvents:z.array(z.object({id:z.string(),policyVersion:z.literal("unified-listening-usage-evidence-v1"),surface:z.enum(["onboarding","diagnostic","lesson","library","shadowing","exam-guided","exam-continuous"]),contentId:z.string().min(1).max(240),event:z.enum(["playback","transcript-revealed"]),playbackSource:z.enum(["mp3","browser-tts"]).optional(),playOrdinal:z.number().int().nonnegative(),secondsSinceFirstPlayback:z.number().int().nonnegative().optional(),revealAfterAnswerCommit:z.boolean().optional(),evidenceBoundary:z.literal("process-evidence-no-comprehension-pronunciation-or-mastery-score"),createdAt:z.string()}).strict().superRefine((event,context)=>{if((event.event==="playback")!==Boolean(event.playbackSource))context.addIssue({code:"custom",message:"Only playback events carry playbackSource."});if((event.event==="transcript-revealed")!==Boolean(event.revealAfterAnswerCommit!==undefined))context.addIssue({code:"custom",message:"Transcript evidence must declare answer-commit timing."});})).default([]),
  pronunciationContrastAttempts: z.array(pronunciationContrastAttemptSchema).default([]),
  prosodyRhythmAttempts:z.array(z.object({id:z.string(),policyVersion:z.literal("local-rhythm-tap-attempt-v1"),level:z.enum(["A1","A2","B1","B2"]),itemId:z.string(),tapCount:z.literal(4),intervalsMs:z.array(z.number().int().min(50).max(5000)).length(3),input:z.literal("pointer-or-keyboard-taps"),evidenceBoundary:z.literal("rhythm-process-only-no-pronunciation-fluency-mastery-or-medical-inference"),createdAt:z.string()}).strict()).default([]),
  practicalDayAttempts:z.array(z.object({id:z.string(),policyVersion:z.literal("multi-step-practical-day-mode-v1"),scenario:z.enum(["housing","work","administration"]),stepIds:z.array(z.string()).length(4),responseLengths:z.array(z.number().int().min(3).max(1000)).length(4),learnerConfirmedCompletion:z.literal(true),evidenceBoundary:z.literal("multi-step-practical-process-no-legal-validity-language-score-mastery-or-official-submission"),createdAt:z.string()}).strict()).default([]),
  dailySessions: z.record(z.string(), z.object({
    date: z.string(),
    availableMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
    energyBefore: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    checkedInAt: z.string(),
    difficultyAfter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
    confidenceAfter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
    reflection: z.string().max(1000).optional(),
    nextFocus: z.enum(["continue", "review", "lighter", "production"]).optional(),
    planningSignal: z.enum(["too-easy", "too-hard"]).optional(),
    adaptations:z.array(sessionAdaptationSchema).optional(),
    missionAlternatives:z.array(missionAlternativeSchema).optional(),
    activeSeconds:z.number().int().nonnegative().optional(),
    activeTimeUpdatedAt:z.string().optional(),
    loadReductionOffer:loadReductionOfferSchema.optional(),
    rescueMode:z.object({policyVersion:z.literal("save-my-day-ten-minute-v1"),selectedAt:z.string(),evidenceBoundary:z.literal("learner-selected-ten-minute-plan-no-completion-mastery-or-penalty")}).strict().optional(),
    reflectedAt: z.string().optional(),
  }).strict()).default({}),
  readingBenchmarkAttempts: z.array(z.object({
    id:z.string(),policyVersion:z.literal("reading-comprehension-benchmark-v1"),itemId:z.string(),level:z.enum(["A1","A2","B1","B2"]),wordCount:z.number().int().positive(),durationSeconds:z.number().positive(),comprehensionCorrect:z.number().int().min(0).max(2),comprehensionTotal:z.literal(2),qualified:z.boolean(),wordsPerMinute:z.number().int().min(20).max(400).optional(),recommendedReadingMinutes:z.union([z.literal(5),z.literal(6),z.literal(8),z.literal(10)]).optional(),timingSource:z.literal("visible-performance-timer"),evidenceBoundary:z.literal("planning-only-no-cefr-or-mastery"),createdAt:z.string(),
  })).default([]),
  writingBenchmarkAttempts: z.array(z.object({
    id:z.string(),policyVersion:z.literal("writing-device-benchmark-v1"),promptId:z.string(),level:z.enum(["A1","A2","B1","B2"]),targetCharacterCount:z.number().int().positive(),typedCharacterCount:z.number().int().nonnegative(),durationSeconds:z.number().positive(),copyAccuracyPercent:z.number().min(0).max(100),qualified:z.boolean(),charactersPerMinute:z.number().int().min(20).max(600).optional(),wordsPerMinute:z.number().int().min(5).max(100).optional(),recommendedWritingMinutes:z.union([z.literal(5),z.literal(8),z.literal(10),z.literal(12)]).optional(),timingSource:z.literal("visible-performance-timer"),evidenceBoundary:z.literal("device-input-planning-only-no-language-score"),createdAt:z.string(),
  })).default([]),
  lastBackupAt: z.string().optional(),
  updatedAt: z.string(),
});
