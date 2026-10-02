import manifestJson from "../../public/audio/lessons/manifest.json";

export type LessonAudioAsset = {
  lessonId: string;
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
  sourceContent: "original-lesson-listening-transcript";
  rightsStatus: "generated-for-project-review-required";
  examGrade: false;
  opusPath:string;
  opusFormat:"audio/ogg; codecs=opus";
  opusBytes:number;
  opusSha256:string;
};

type LessonAudioManifest = {
  format: "dwnb-lesson-audio";
  version: 1;
  generatedAssetCount: number;
  totalLessonCount: number;
  humanRecordedAssetCount: number;
  opusAssetCount:number;
  opusPolicyVersion:"optional-opus-with-mp3-fallback-v1";
  usageNoteAr: string;
  assets: LessonAudioAsset[];
};

export const lessonAudioManifest = manifestJson as LessonAudioManifest;
export const lessonAudioAssetByLessonId = Object.fromEntries(
  lessonAudioManifest.assets.map((asset) => [asset.lessonId, asset]),
) as Record<string, LessonAudioAsset>;
