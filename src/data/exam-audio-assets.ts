import manifestJson from "../../public/audio/exams/manifest.json";

export type ExamAudioAsset = {
  fileId: string;
  clipId: string;
  taskId: string;
  provider: "goethe-b2" | "telc-deutsch-b2";
  segmentIndex: number;
  segmentCount: number;
  path: string;
  format: "audio/mpeg";
  language: "de-DE";
  durationMs: number;
  bytes: number;
  sha256: string;
  speakerCount: number;
  voiceProfile: string;
  synthesisProvider: string;
  generatedAt: string;
  sourceContent: "original-exam-practice-transcript";
  rightsStatus: "generated-for-project-review-required";
  examGrade: false;
};

export type ExamAudioTaskCoverage = {
  taskId: string;
  provider: "goethe-b2" | "telc-deutsch-b2";
  scope: "targeted" | "full-simulation";
  requiredClipCount: number;
  coveredClipCount: number;
  partialClipCount: number;
  missingClipIds: string[];
  status: "complete" | "partial" | "missing";
};

type ExamAudioManifest = {
  format: "dwnb-exam-audio";
  version: 2;
  generatedAssetCount: number;
  coveredClipCount: number;
  partiallyCoveredClipCount: number;
  totalLogicalClipCount: number;
  fullyCoveredTaskCount: number;
  completeTargetedTaskCount: number;
  completeFullSimulationTaskCount: number;
  partiallyCoveredTaskCount: number;
  totalListeningTaskCount: number;
  totalTargetedListeningTaskCount: number;
  totalFullSimulationListeningTaskCount: number;
  humanRecordedAssetCount: number;
  usageNoteAr: string;
  taskCoverage: ExamAudioTaskCoverage[];
  assets: ExamAudioAsset[];
};

export const examAudioManifest = manifestJson as ExamAudioManifest;

export const examAudioAssetsByClipId = Object.fromEntries(
  [...new Set(examAudioManifest.assets.map((asset) => asset.clipId))].map((clipId) => [
    clipId,
    examAudioManifest.assets
      .filter((asset) => asset.clipId === clipId)
      .sort((left, right) => left.segmentIndex - right.segmentIndex),
  ]),
) as Record<string, ExamAudioAsset[]>;

export const examAudioTaskCoverageById = Object.fromEntries(
  examAudioManifest.taskCoverage.map((coverage) => [coverage.taskId, coverage]),
) as Record<string, ExamAudioTaskCoverage>;
