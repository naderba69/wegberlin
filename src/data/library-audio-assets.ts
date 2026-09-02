import manifestJson from "../../public/audio/library/manifest.json";

export type LibraryAudioAsset = {
  itemId: string;
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
  sourceContent: "original-project-transcript";
  rightsStatus: "generated-for-project-review-required";
  examGrade: false;
};

export type LibraryAudioManifest = {
  format: "dwnb-library-audio";
  version: 1;
  generatedAssetCount: number;
  humanRecordedAssetCount: number;
  spokenNormalizationNoteAr: string;
  usageNoteAr: string;
  assets: LibraryAudioAsset[];
};

export const libraryAudioManifest = manifestJson as LibraryAudioManifest;
export const libraryAudioAssetByItemId = Object.fromEntries(
  libraryAudioManifest.assets.map((asset) => [asset.itemId, asset]),
) as Record<string, LibraryAudioAsset>;

export function audioDurationLabel(durationMs: number) {
  const seconds = Math.round(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
