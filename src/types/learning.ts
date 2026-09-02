export type CEFRLevel = "A1" | "A2" | "B1" | "B2";
export type ExamProvider = "goethe-b2" | "telc-deutsch-b2";
export type ArabicSupportMode = "modern-standard-arabic" | "tunisian-supported" | "minimal-arabic";
export type LessonStatus = "published" | "planned";
export type AIProvider = "disabled" | "gemini" | "openrouter" | "local";
export type LearnerGoal = "exam" | "work" | "study" | "daily-life" | "settlement";
export type DeviceCapabilityStatus = "unchecked" | "ready" | "unavailable" | "permission-denied" | "skipped";
export type DiagnosticSkill = "grammar" | "vocabulary" | "reading" | "listening";

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

export interface MissionBlock {
  id: string;
  kind: "diagnostic" | "check-in" | "review" | "lesson" | "practice" | "production" | "reflection";
  titleAr: string;
  titleDe: string;
  minutes: number;
  objective: string;
}

export interface ErrorRecord {
  id: string;
  type: "article" | "case" | "word-order" | "vocabulary" | "spelling" | "tense" | "grammar";
  wrong: string;
  correct: string;
  explanationAr: string;
  occurrences: number;
  lastSeenAt: string;
  resolved?: boolean;
  repairCount?: number;
  lastRepairedAt?: string;
  nextReviewAt?: string;
  confirmedAt?: string;
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

export type SessionNextFocus = "continue" | "review" | "lighter" | "production";

export interface DailySessionRecord {
  date: string;
  availableMinutes: 10 | 20 | 30 | 45 | 60 | 90;
  energyBefore: 1 | 2 | 3 | 4 | 5;
  checkedInAt: string;
  difficultyAfter?: 1 | 2 | 3 | 4 | 5;
  confidenceAfter?: 1 | 2 | 3 | 4 | 5;
  reflection?: string;
  nextFocus?: SessionNextFocus;
  reflectedAt?: string;
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
  algorithmVersion: "sm2-v1";
}

export interface ReviewEvent {
  id: string;
  cardId: string;
  lessonId: string;
  grade: number;
  evidenceKind: "initial" | "delayed";
  scheduledFor: string;
  reviewedAt: string;
  masteryDelta: number;
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
}

export interface SpeakingAttempt {
  id: string;
  taskId: string;
  mediaId?: string;
  durationSeconds: number;
  selfScore: number;
  reflection: string;
  selfReview?: SpeakingSelfReview;
  targetSeconds?: number;
  preparationSeconds?: number;
  retryOf?: string;
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

export interface TutorInteraction {
  id: string;
  question: string;
  answer: TutorAnswerEvidence;
  provider: AIProvider;
  model: string;
  promptVersion: "tutor-v2";
  lessonId?: string;
  errorIds: string[];
  consent: "not-required" | "explicit";
  createdAt: string;
}

export interface ExerciseAttempt {
  id: string;
  lessonId: string;
  exerciseId: string;
  answer: string;
  correct: boolean;
  answerIndex?: number;
  shuffleSeed?: string;
  shuffleVersion?: "lesson-shuffle-v1";
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
  profile: LearnerProfile | null;
  diagnosticResult: DiagnosticResult | null;
  completedBlockIds: string[];
  completedLessonIds: string[];
  currentLessonId: string;
  currentStage: number;
  lessonProgress: Record<string, number>;
  exerciseAttempts: ExerciseAttempt[];
  dueReviews: number;
  mastery: Record<string, number>;
  errors: ErrorRecord[];
  errorClinicAttempts: ErrorClinicAttempt[];
  reviewItems: ReviewItem[];
  reviewEvents: ReviewEvent[];
  writingSubmissions: WritingSubmission[];
  mediationSubmissions: MediationSubmission[];
  speakingAttempts: SpeakingAttempt[];
  examSessions: Record<string, FullExamSession>;
  aiSettings: AISettings;
  tutorInteractions: TutorInteraction[];
  studyHistory: StudyDay[];
  dailySessions: Record<string, DailySessionRecord>;
  lastBackupAt?: string;
  updatedAt: string;
}
