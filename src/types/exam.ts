import type { ExamProvider } from "./learning";

export interface ExamSourceReference {
  id: string;
  organization: "Goethe-Institut" | "telc gGmbH";
  title: string;
  url: string;
  accessedAt: string;
  publishedOrUpdatedAt?: string;
  usageNoteAr: string;
}

export interface ExamModuleProfile {
  id: string;
  titleDe: string;
  titleAr: string;
  parts: number;
  minutes: number;
  maxPoints?: number;
  noteAr: string;
}

export interface ExamProfile {
  id: ExamProvider;
  displayName: string;
  specificationVersion: string;
  verifiedAt: string;
  status: "verified" | "outdated";
  modules: ExamModuleProfile[];
  structureAr: string;
  passingRuleAr: string;
  separationWarningAr: string;
  sourceRefs: string[];
}

interface TargetedExamBase {
  id: string;
  provider: ExamProvider;
  skill: "reading" | "listening" | "writing" | "speaking" | "language-elements";
  officialPartLabel: string;
  titleDe: string;
  titleAr: string;
  descriptionAr: string;
  practiceMinutes: number;
  timingNoteAr: string;
  instructionsDe: string;
  instructionsAr: string;
  sourceRefs: string[];
  contentStatus: "published";
  originalContent: true;
  countTowardTargeted?: boolean;
}

export interface TargetedExamText {
  id: string;
  labelDe: string;
  textDe: string;
}

export interface TargetedExamOption {
  id: string;
  labelDe: string;
}

export interface TargetedExamItem {
  id: string;
  promptDe: string;
  promptAr: string;
  correctOptionId: string;
  explanationAr: string;
}

export interface TargetedExamSimulation extends TargetedExamBase {
  kind: "matching";
  skill: "reading" | "language-elements";
  texts: TargetedExamText[];
  options: TargetedExamOption[];
  allowOptionReuse: boolean;
  items: TargetedExamItem[];
}

export interface ExamListeningClip {
  id: string;
  labelDe: string;
  transcriptDe: string;
  playLimit: 1 | 2;
}

export interface ExamListeningItem {
  id: string;
  clipId: string;
  promptDe: string;
  promptAr: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
}

export interface TargetedListeningSimulation extends TargetedExamBase {
  kind: "listening";
  skill: "listening";
  clips: ExamListeningClip[];
  items: ExamListeningItem[];
  audioStatus: "browser-tts-only" | "generated-file-with-browser-tts-fallback";
}

export interface ExamWritingChoice {
  id: string;
  titleDe: string;
  situationDe: string;
  situationAr: string;
  guidingPointsDe: string[];
  checklistAr: string[];
}

export interface TargetedWritingSimulation extends TargetedExamBase {
  kind: "writing";
  skill: "writing";
  choices: ExamWritingChoice[];
  minimumWordsForPractice: number;
  wordTargetNoteAr: string;
  deterministicOnly: true;
}

export interface ExamChoiceItem {
  id: string;
  promptDe: string;
  promptAr: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
}

export interface TargetedChoiceSimulation extends TargetedExamBase {
  kind: "choice";
  skill: "language-elements" | "reading";
  textDe: string;
  items: ExamChoiceItem[];
}

export interface ExamSpeakingChoice {
  id: string;
  titleDe: string;
  situationDe: string;
  bulletPointsDe: string[];
}

export interface TargetedSpeakingSimulation extends TargetedExamBase {
  kind: "speaking";
  skill: "speaking";
  preparationMinutes: number;
  responseSeconds: number;
  choices: ExamSpeakingChoice[];
  followUpPromptsDe: string[];
  selfCriteriaAr: string[];
  recordingRequired: true;
}

export type PublishedTargetedExamSimulation =
  | TargetedExamSimulation
  | TargetedListeningSimulation
  | TargetedWritingSimulation
  | TargetedChoiceSimulation
  | TargetedSpeakingSimulation;

export interface FullExamModule {
  id: string;
  titleDe: string;
  titleAr: string;
  officialMinutes: number;
  taskIds: string[];
  resultRuleAr: string;
}

export interface FullExamSimulation {
  id: string;
  provider: ExamProvider;
  titleDe: string;
  titleAr: string;
  descriptionAr: string;
  modules: FullExamModule[];
  sourceRefs: string[];
  contentStatus: "published";
  originalContent: true;
  sessionMode: "guided-module-timers";
  limitationsAr: string[];
}
