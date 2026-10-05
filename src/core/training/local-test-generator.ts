import type { CEFRLevel, LessonMeta } from "@/types/learning";
import type { FullLesson, Question } from "@/types/lesson-content";

export const LOCAL_TEST_GENERATOR_POLICY = "local-test-generator-v1" as const;
export const LOCAL_TEST_GENERATOR_BOUNDARY = "published-lesson-mini-tests-only-local-session-no-persistence-no-cefr-or-mastery" as const;
export const LOCAL_TEST_SIZES = [5, 10, 15] as const;
export type LocalTestSize = (typeof LOCAL_TEST_SIZES)[number];
export type LocalTestLevel = CEFRLevel;

export type LocalTestSourceLesson = Pick<FullLesson, "id" | "level" | "module" | "titleDe" | "titleAr" | "miniTest">;
export type LocalTestQuestionTemplate = Pick<Question, "id" | "promptDe" | "promptAr" | "options" | "correctIndex" | "explanationAr">;
export type LocalTestTemplateLesson = Omit<LocalTestSourceLesson, "miniTest"> & { questions: LocalTestQuestionTemplate[] };

export type LocalTestCatalog = {
  policyVersion: typeof LOCAL_TEST_GENERATOR_POLICY;
  ok: boolean;
  issues: string[];
  publishedLessonCount: number;
  totalQuestionTemplates: number;
  byLevel: Record<CEFRLevel, { publishedLessons: number; questionTemplates: number }>;
  banks: Record<CEFRLevel, LocalTestTemplateLesson[]>;
  boundary: "compiled-published-lesson-data-no-external-or-ai-content";
};

export type GeneratedLocalTestItem = {
  templateId: string;
  sourceLessonId: string;
  sourceLessonTitleDe: string;
  sourceLessonTitleAr: string;
  sourceModule: number;
  promptDe: string;
  promptAr: string;
  options: string[];
  correctIndex: number;
  explanationAr: string;
};

export type GeneratedLocalTest = {
  policyVersion: typeof LOCAL_TEST_GENERATOR_POLICY;
  boundary: typeof LOCAL_TEST_GENERATOR_BOUNDARY;
  level: CEFRLevel;
  itemCount: LocalTestSize;
  items: GeneratedLocalTestItem[];
};

const levels: readonly CEFRLevel[] = ["A1", "A2", "B1", "B2"];

function normalizeOption(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("de-DE");
}

function templateIssues(question: LocalTestQuestionTemplate, lessonId: string): string[] {
  const issues: string[] = [];
  const label = `${lessonId}:${question.id || "<missing-id>"}`;
  if (!question.id?.trim()) issues.push(`${label}: missing question id`);
  if (!question.promptDe?.trim()) issues.push(`${label}: missing German prompt`);
  if (!question.promptAr?.trim()) issues.push(`${label}: missing Arabic prompt`);
  if (!question.explanationAr?.trim()) issues.push(`${label}: missing post-commit explanation`);
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    issues.push(`${label}: requires exactly four authored options`);
  } else {
    if (question.options.some((option) => typeof option !== "string" || !option.trim())) {
      issues.push(`${label}: every option must contain visible text`);
    }
    if (question.options.every((option) => typeof option === "string" && option.trim()) && new Set(question.options.map(normalizeOption)).size !== 4) {
      issues.push(`${label}: options are duplicates after Unicode, whitespace, and case normalization`);
    }
  }
  if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex > 3) {
    issues.push(`${label}: correct answer index must point to one of four options`);
  }
  return issues;
}

/**
 * Builds a compact catalogue only from published lesson mini-tests. The caller supplies
 * the lesson metadata so a planned/unpublished lesson can never enter the learner pool.
 */
export function buildLocalTestCatalog(
  lessons: readonly LocalTestSourceLesson[],
  lessonMetadata: readonly Pick<LessonMeta, "id" | "level" | "status">[],
): LocalTestCatalog {
  const issues: string[] = [];
  const banks: Record<CEFRLevel, LocalTestTemplateLesson[]> = { A1: [], A2: [], B1: [], B2: [] };
  const metadataById = new Map<string, Pick<LessonMeta, "id" | "level" | "status">>();
  for (const row of lessonMetadata) {
    if (metadataById.has(row.id)) issues.push(`${row.id}: duplicate curriculum metadata`);
    else metadataById.set(row.id, row);
  }

  const lessonById = new Map<string, LocalTestSourceLesson>();
  for (const lesson of lessons) {
    if (lessonById.has(lesson.id)) issues.push(`${lesson.id}: duplicate lesson id`);
    else lessonById.set(lesson.id, lesson);
  }

  const publishedRows = lessonMetadata.filter((row) => row.status === "published");
  for (const row of publishedRows) {
    if (!lessonById.has(row.id)) issues.push(`${row.id}: published lesson has no authored lesson data`);
  }

  const publishedLessons = lessons.filter((lesson) => metadataById.get(lesson.id)?.status === "published");
  for (const lesson of publishedLessons) {
    const metadata = metadataById.get(lesson.id);
    if (!metadata) continue;
    if (metadata.level !== lesson.level) issues.push(`${lesson.id}: curriculum level differs from lesson data`);
    if (!levels.includes(lesson.level)) {
      issues.push(`${lesson.id}: unsupported CEFR level ${String(lesson.level)}`);
      continue;
    }
    if (!lesson.titleDe.trim() || !lesson.titleAr.trim()) issues.push(`${lesson.id}: missing authored source title`);
    if (lesson.miniTest.length === 0) issues.push(`${lesson.id}: published lesson has no mini-test templates`);

    const seenQuestionIds = new Set<string>();
    const questions: LocalTestQuestionTemplate[] = [];
    for (const question of lesson.miniTest) {
      const key = question.id;
      if (seenQuestionIds.has(key)) issues.push(`${lesson.id}:${key}: duplicate mini-test id within a lesson`);
      else seenQuestionIds.add(key);
      const questionErrors = templateIssues(question, lesson.id);
      issues.push(...questionErrors);
      if (questionErrors.length === 0) questions.push({ ...question, options: [...question.options] as Question["options"] });
    }
    if (questions.length > 0) {
      banks[lesson.level].push({
        id: lesson.id,
        level: lesson.level,
        module: lesson.module,
        titleDe: lesson.titleDe,
        titleAr: lesson.titleAr,
        questions,
      });
    }
  }

  for (const level of levels) {
    banks[level].sort((left, right) => left.id.localeCompare(right.id, "en"));
    const row = banks[level];
    if (row.length < Math.max(...LOCAL_TEST_SIZES)) issues.push(`${level}: only ${row.length} published lesson groups; at least ${Math.max(...LOCAL_TEST_SIZES)} are required`);
  }

  const totalQuestionTemplates = Object.values(banks).reduce((sum, bank) => sum + bank.reduce((count, lesson) => count + lesson.questions.length, 0), 0);
  const byLevel = Object.fromEntries(levels.map((level) => [level, {
    publishedLessons: banks[level].length,
    questionTemplates: banks[level].reduce((sum, lesson) => sum + lesson.questions.length, 0),
  }])) as LocalTestCatalog["byLevel"];

  return {
    policyVersion: LOCAL_TEST_GENERATOR_POLICY,
    ok: issues.length === 0,
    issues,
    publishedLessonCount: publishedLessons.length,
    totalQuestionTemplates,
    byLevel,
    banks,
    boundary: "compiled-published-lesson-data-no-external-or-ai-content",
  };
}

function seedHash(seed: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0 || 0x9e3779b9;
}

function seededRandom(seed: string): () => number {
  let state = seedHash(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function buildLocalPracticeTest(
  level: CEFRLevel,
  itemCount: LocalTestSize,
  seed: string,
  bank: readonly LocalTestTemplateLesson[],
): GeneratedLocalTest {
  if (!levels.includes(level)) throw new Error(`Unsupported CEFR level: ${String(level)}`);
  if (!LOCAL_TEST_SIZES.includes(itemCount)) throw new Error(`Unsupported local test length: ${String(itemCount)}`);
  if (typeof seed !== "string" || seed.trim().length === 0 || seed.length > 128) throw new Error("A non-empty bounded local seed is required.");

  const levelBank = bank.filter((lesson) => lesson.level === level).sort((left, right) => left.id.localeCompare(right.id, "en"));
  const sourceLessonIds = new Set(levelBank.map((lesson) => lesson.id));
  if (sourceLessonIds.size !== levelBank.length) throw new Error("The selected level bank contains duplicate source lesson ids.");
  if (sourceLessonIds.size < itemCount) throw new Error(`${level}: not enough distinct published lesson templates for this test length.`);
  const issues = levelBank.flatMap((lesson) => {
    const lessonIssues: string[] = [];
    if (!lesson.id.trim() || !lesson.titleDe.trim() || !lesson.titleAr.trim()) lessonIssues.push(`${lesson.id}: missing source identity`);
    for (const question of lesson.questions) lessonIssues.push(...templateIssues(question, lesson.id));
    return lessonIssues;
  });
  if (issues.length > 0) throw new Error(`Unsafe local test template: ${issues.join("; ")}`);

  const random = seededRandom(seed);
  const chosenLessons = shuffle(levelBank, random).slice(0, itemCount);
  const items = chosenLessons.map((lesson) => {
    const question = shuffle(lesson.questions, random)[0];
    const shuffledOptions = shuffle(question.options.map((text, originalIndex) => ({ text, originalIndex })), random);
    return {
      templateId: `${lesson.id}:${question.id}`,
      sourceLessonId: lesson.id,
      sourceLessonTitleDe: lesson.titleDe,
      sourceLessonTitleAr: lesson.titleAr,
      sourceModule: lesson.module,
      promptDe: question.promptDe,
      promptAr: question.promptAr,
      options: shuffledOptions.map((option) => option.text),
      correctIndex: shuffledOptions.findIndex((option) => option.originalIndex === question.correctIndex),
      explanationAr: question.explanationAr,
    };
  });

  return {
    policyVersion: LOCAL_TEST_GENERATOR_POLICY,
    boundary: LOCAL_TEST_GENERATOR_BOUNDARY,
    level,
    itemCount,
    items,
  };
}

export function createLocalTestSeed(): string {
  const cryptoProvider = globalThis.crypto;
  if (cryptoProvider?.getRandomValues) {
    const values = new Uint32Array(4);
    cryptoProvider.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
