import type { CEFRLevel } from "./learning";

export interface LibraryQuestion {
  id: string;
  promptDe: string;
  promptAr: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationAr: string;
}

interface LibraryBase {
  id: string;
  level: CEFRLevel;
  titleDe: string;
  titleAr: string;
  categoryAr: string;
  estimatedMinutes: number;
  questions: LibraryQuestion[];
  originalContent: true;
  contentStatus: "published";
}

export interface ReadingLibraryItem extends LibraryBase {
  kind: "reading";
  textDe: string;
  summaryAr: string;
}

export interface ListeningLibraryItem extends LibraryBase {
  kind: "listening";
  transcriptDe: string;
  summaryAr: string;
  strategyAr: string;
  audioStatus: "browser-tts-only" | "generated-file-with-browser-tts-fallback";
}
