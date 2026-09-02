import { academicLessons } from "@/data/academic-lessons";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";
import type { CEFRLevel } from "@/types/learning";

export type SearchSource = "lesson" | "library" | "exam";
export type SearchSubtype = "lesson" | "phrase" | "grammar" | "glossary" | "error" | "reading" | "listening" | "exam-task";

export type BilingualSearchEntry = {
  id: string;
  source: SearchSource;
  subtype: SearchSubtype;
  level: CEFRLevel;
  titleDe: string;
  titleAr: string;
  contextDe: string;
  contextAr: string;
  href: string;
  provider?: "goethe-b2" | "telc-deutsch-b2";
};

export type SearchFilters = {
  source?: SearchSource | "all";
  level?: CEFRLevel | "all";
  limit?: number;
};

function foldGerman(value: string) {
  return value
    .toLocaleLowerCase("de")
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function foldArabic(value: string) {
  return value
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[^\u0621-\u063A\u0641-\u064A0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.startsWith("ال") && word.length > 4 ? word.slice(2) : word)
    .join(" ");
}

function excerpt(value: string, max = 190) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function buildEntries(): BilingualSearchEntry[] {
  const entries: BilingualSearchEntry[] = [];

  for (const lesson of Object.values(academicLessons)) {
    const href = `/lernen/${lesson.id}`;
    entries.push({
      id: `lesson:${lesson.id}`,
      source: "lesson",
      subtype: "lesson",
      level: lesson.level,
      titleDe: lesson.titleDe,
      titleAr: lesson.titleAr,
      contextDe: lesson.objectives.map((objective) => objective.de).join(" · "),
      contextAr: lesson.descriptionAr,
      href,
    });
    lesson.phrases.forEach((phrase, index) => entries.push({
      id: `lesson:${lesson.id}:phrase:${index}`,
      source: "lesson",
      subtype: "phrase",
      level: lesson.level,
      titleDe: phrase.de,
      titleAr: phrase.ar,
      contextDe: lesson.titleDe,
      contextAr: phrase.noteAr ?? lesson.titleAr,
      href,
    }));
    lesson.theory.forEach((block, index) => entries.push({
      id: `lesson:${lesson.id}:grammar:${index}`,
      source: "lesson",
      subtype: "grammar",
      level: lesson.level,
      titleDe: block.titleDe,
      titleAr: block.titleAr,
      contextDe: block.formula ?? block.examples.map((example) => example.de).join(" · "),
      contextAr: excerpt(`${block.explanationAr} ${block.contrastAr} ${block.trickAr}`),
      href,
    }));
    lesson.reading.glossary.forEach((item, index) => entries.push({
      id: `lesson:${lesson.id}:glossary:${index}`,
      source: "lesson",
      subtype: "glossary",
      level: lesson.level,
      titleDe: item.surfaceForm,
      titleAr: item.ar,
      contextDe: item.lemma,
      contextAr: `من نص: ${lesson.reading.titleAr}`,
      href,
    }));
    lesson.mistakes.forEach((mistake, index) => entries.push({
      id: `lesson:${lesson.id}:error:${index}`,
      source: "lesson",
      subtype: "error",
      level: lesson.level,
      titleDe: `${mistake.wrong} → ${mistake.correct}`,
      titleAr: mistake.whyAr,
      contextDe: lesson.titleDe,
      contextAr: `تريك: ${mistake.trickAr}`,
      href,
    }));
  }

  for (const item of [...readingLibrary, ...listeningLibrary]) {
    const body = item.kind === "reading" ? item.textDe : item.transcriptDe;
    entries.push({
      id: `library:${item.id}`,
      source: "library",
      subtype: item.kind,
      level: item.level,
      titleDe: item.titleDe,
      titleAr: item.titleAr,
      contextDe: excerpt(body),
      contextAr: `${item.categoryAr} · ${item.summaryAr}`,
      href: `/library#${item.id}`,
    });
  }

  for (const task of allPublishedExamTasks) {
    entries.push({
      id: `exam:${task.id}`,
      source: "exam",
      subtype: "exam-task",
      level: "B2",
      titleDe: task.titleDe,
      titleAr: task.titleAr,
      contextDe: `${task.officialPartLabel} · ${task.instructionsDe}`,
      contextAr: excerpt(`${task.descriptionAr} ${task.instructionsAr}`),
      href: `/exams/${task.provider}/${task.id}`,
      provider: task.provider,
    });
  }

  return entries;
}

export const bilingualSearchEntries = buildEntries();

function relevance(entry: BilingualSearchEntry, query: string) {
  const arabicQuery = /[\u0600-\u06FF]/.test(query);
  const fold = arabicQuery ? foldArabic : foldGerman;
  const normalizedQuery = fold(query);
  if (!normalizedQuery) return 0;
  const title = fold(arabicQuery ? entry.titleAr : entry.titleDe);
  const context = fold(arabicQuery ? entry.contextAr : entry.contextDe);
  const secondary = fold(arabicQuery ? `${entry.titleDe} ${entry.contextDe}` : `${entry.titleAr} ${entry.contextAr}`);
  const combined = `${title} ${context} ${secondary}`.trim();
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (!tokens.every((token) => combined.includes(token))) return 0;

  let score = 20;
  if (title === normalizedQuery) score += 120;
  else if (title.startsWith(normalizedQuery)) score += 85;
  else if (title.includes(normalizedQuery)) score += 65;
  if (context.includes(normalizedQuery)) score += 35;
  if (secondary.includes(normalizedQuery)) score += 12;
  score += tokens.filter((token) => title.split(" ").some((word) => word.startsWith(token))).length * 8;
  if (entry.subtype === "phrase" || entry.subtype === "glossary") score += 4;
  return score;
}

export function searchBilingual(query: string, filters: SearchFilters = {}) {
  const source = filters.source ?? "all";
  const level = filters.level ?? "all";
  const limit = filters.limit ?? 80;
  return bilingualSearchEntries
    .filter((entry) => source === "all" || entry.source === source)
    .filter((entry) => level === "all" || entry.level === level)
    .map((entry) => ({ entry, score: relevance(entry, query) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit);
}
