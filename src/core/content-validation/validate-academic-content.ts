import type { z } from "zod";
import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import { allDiagnosticQuestions } from "@/data/diagnostic";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { examProfiles, examSources } from "@/data/exam-profiles";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";
import { LEXICAL_GRAMMAR_LEVELS, lexicalLevelOf, nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { reviewCards } from "@/data/review-cards";
import {
  diagnosticQuestionSchema,
  examProfileSchema,
  examSourceSchema,
  fullExamSimulationSchema,
  fullLessonSchema,
  lessonMetaSchema,
  listeningLibraryItemSchema,
  nounGrammarEntrySchema,
  publishedExamTaskSchema,
  readingLibraryItemSchema,
  reviewCardSchema,
  verbPrepositionFrameSchema,
} from "./schemas";

export type AcademicSchemaCounts = {
  lessons: number;
  lessonMetadata: number;
  readingLibrary: number;
  listeningLibrary: number;
  diagnosticQuestions: number;
  examTasks: number;
  fullExamDashboards: number;
  examProfiles: number;
  examSources: number;
  reviewCards: number;
  nounGrammarEntries: number;
  verbPrepositionFrames: number;
  totalRootObjects: number;
};

function validateCollection(name: string, schema: z.ZodType, values: readonly unknown[], issues: string[]) {
  values.forEach((value, index) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) issues.push(`${name}[${index}].${issue.path.join(".")}: ${issue.message}`);
    }
  });
}

function checkUnique(name: string, ids: string[], issues: string[]) {
  const seen = new Set<string>();
  for (const value of ids) {
    if (seen.has(value)) issues.push(`${name}: duplicate ID ${value}`);
    seen.add(value);
  }
}

export function validateAcademicContent() {
  const issues: string[] = [];
  validateCollection("lessons", fullLessonSchema, academicLessonList, issues);
  validateCollection("lessonMetadata", lessonMetaSchema, curriculum, issues);
  validateCollection("readingLibrary", readingLibraryItemSchema, readingLibrary, issues);
  validateCollection("listeningLibrary", listeningLibraryItemSchema, listeningLibrary, issues);
  validateCollection("diagnosticQuestions", diagnosticQuestionSchema, allDiagnosticQuestions, issues);
  validateCollection("examTasks", publishedExamTaskSchema, allPublishedExamTasks, issues);
  validateCollection("fullExamDashboards", fullExamSimulationSchema, fullExamSimulations, issues);
  validateCollection("examProfiles", examProfileSchema, Object.values(examProfiles), issues);
  validateCollection("examSources", examSourceSchema, examSources, issues);
  validateCollection("reviewCards", reviewCardSchema, reviewCards, issues);
  validateCollection("nounGrammarEntries", nounGrammarEntrySchema, nounGrammarEntries, issues);
  validateCollection("verbPrepositionFrames", verbPrepositionFrameSchema, verbPrepositionFrames, issues);

  const sourceIds = new Set(examSources.map((source) => source.id));
  const taskIds = new Set(allPublishedExamTasks.map((task) => task.id));
  const listeningLibraryIds = new Set(listeningLibrary.map((item) => item.id));
  const lessonIds = new Set(academicLessonList.map((lesson) => lesson.id));

  checkUnique("lessons", [...lessonIds], issues);
  checkUnique("lesson metadata", curriculum.map((lesson) => lesson.id), issues);
  checkUnique("library", [...readingLibrary, ...listeningLibrary].map((item) => item.id), issues);
  checkUnique("diagnostic questions", allDiagnosticQuestions.map((question) => question.id), issues);
  checkUnique("exam tasks", [...taskIds], issues);
  checkUnique("full exam dashboards", fullExamSimulations.map((simulation) => simulation.id), issues);
  checkUnique("review cards", reviewCards.map((card) => card.id), issues);
  checkUnique("noun grammar entries", nounGrammarEntries.map((entry) => entry.id), issues);
  checkUnique("verb-preposition frames", verbPrepositionFrames.map((entry) => entry.id), issues);

  const lessonsByLevel = Object.fromEntries(
    (["A1", "A2", "B1", "B2"] as const).map((level) => [level, academicLessonList.filter((lesson) => lesson.level === level).map((lesson) => lesson.id)]),
  );
  const genderArticle = { masculine: "der", feminine: "die", neuter: "das" } as const;
  const lower = (value: string) => value.toLocaleLowerCase("de-DE");
  /** يتجاهل ضمير الانعكاس «sich» لأنه يظهر في أول الجملة لا داخل الفعل في الاستعمال الحقيقي. */
  const infinitiveTokens = (infinitive: string) => infinitive.split(/\s+/).filter((token) => token !== "sich");

  for (const [level, rule] of Object.entries(LEXICAL_GRAMMAR_LEVELS)) {
    const levelLessonIds = lessonsByLevel[level as keyof typeof lessonsByLevel] ?? [];
    for (const lessonId of levelLessonIds) {
      const nouns = nounGrammarEntries.filter((entry) => entry.lessonId === lessonId);
      const frames = verbPrepositionFrames.filter((entry) => entry.lessonId === lessonId);
      if (nouns.length !== rule.nounsPerLesson) issues.push(`nounGrammarEntries.${lessonId}: expected ${rule.nounsPerLesson} ${level} anchor nouns, received ${nouns.length}`);
      if (frames.length !== rule.framesPerLesson) issues.push(`verbPrepositionFrames.${lessonId}: expected ${rule.framesPerLesson} ${level} frames, received ${frames.length}`);
    }
  }
  for (const noun of nounGrammarEntries) {
    const level = lexicalLevelOf(noun.lessonId);
    if (!level || !(lessonsByLevel[level] ?? []).includes(noun.lessonId)) issues.push(`nounGrammarEntries.${noun.id}: lesson is not a published ${level ?? "authored"} lesson`);
    if (level && noun.sourceVersion !== `${level.toLowerCase()}-lexical-grammar-v1`) issues.push(`nounGrammarEntries.${noun.id}: source version does not match ${level}`);
    if (noun.article !== genderArticle[noun.gender]) issues.push(`nounGrammarEntries.${noun.id}: article/gender mismatch`);
    if (!noun.caseForms.nominative.startsWith(`${noun.article} `)) issues.push(`nounGrammarEntries.${noun.id}: invalid nominative form`);
    if (!noun.caseForms.accusative.trim() || !noun.caseForms.dative.trim()) issues.push(`nounGrammarEntries.${noun.id}: oblique case form missing`);
    if (!noun.plural.noteAr.trim()) issues.push(`nounGrammarEntries.${noun.id}: plural note missing`);
  }
  for (const frame of verbPrepositionFrames) {
    const level = lexicalLevelOf(frame.lessonId);
    if (!level || !(lessonsByLevel[level] ?? []).includes(frame.lessonId)) issues.push(`verbPrepositionFrames.${frame.id}: lesson is not a published ${level ?? "authored"} lesson`);
    if (level && frame.sourceVersion !== `${level.toLowerCase()}-lexical-grammar-v1`) issues.push(`verbPrepositionFrames.${frame.id}: source version does not match ${level}`);
    if (!lower(frame.chunkDe).includes(lower(frame.preposition))) issues.push(`verbPrepositionFrames.${frame.id}: chunk omits preposition`);
    if (!lower(frame.exampleDe).includes(lower(frame.preposition))) issues.push(`verbPrepositionFrames.${frame.id}: example omits preposition`);
    for (const token of infinitiveTokens(frame.infinitive)) {
      if (!lower(frame.chunkDe).includes(lower(token))) issues.push(`verbPrepositionFrames.${frame.id}: chunk omits the framed infinitive token ${token}`);
    }
    if (frame.contrastAr.trim().length < 12) issues.push(`verbPrepositionFrames.${frame.id}: Arabic contrast note is too thin`);
  }
  // يمنع نسخ الإطار نفسه داخل المستوى. تكرار الفعل مع حرف الجر نفسه مسموح فقط بـchunk مختلف،
  // كما في مراسي A1 حيث يتكرر fragen + nach بأسماء مختلفة داخل دروس مختلفة.
  const levelChunkKeys = new Set<string>();
  for (const frame of verbPrepositionFrames) {
    const level = lexicalLevelOf(frame.lessonId);
    const key = `${level}|${lower(frame.chunkDe)}`;
    if (levelChunkKeys.has(key)) issues.push(`verbPrepositionFrames.${frame.id}: ${level} repeats the chunk "${frame.chunkDe}"`);
    levelChunkKeys.add(key);
  }

  for (const meta of curriculum) {
    if (meta.status === "published" && !lessonIds.has(meta.id)) issues.push(`lessonMetadata.${meta.id}: published lesson has no academic object`);
  }
  for (const question of allDiagnosticQuestions) {
    if (question.skill === "reading" && !question.contextDe) issues.push(`diagnosticQuestions.${question.id}: reading item has no contextDe`);
    if (question.skill === "listening" && (!question.audioItemId || !listeningLibraryIds.has(question.audioItemId))) issues.push(`diagnosticQuestions.${question.id}: listening audio item is missing`);
  }
  for (const task of allPublishedExamTasks) {
    for (const sourceId of task.sourceRefs) if (!sourceIds.has(sourceId)) issues.push(`examTasks.${task.id}: unknown source ${sourceId}`);
    if (task.kind === "matching") {
      const optionIds = new Set(task.options.map((option) => option.id));
      for (const item of task.items) if (!optionIds.has(item.correctOptionId)) issues.push(`examTasks.${task.id}.${item.id}: unknown correct option ${item.correctOptionId}`);
    }
    if (task.kind === "choice") {
      for (const item of task.items) if (item.correctIndex >= item.options.length) issues.push(`examTasks.${task.id}.${item.id}: correctIndex out of range`);
    }
    if (task.kind === "listening") {
      const clipIds = new Set(task.clips.map((clip) => clip.id));
      for (const item of task.items) {
        if (!clipIds.has(item.clipId)) issues.push(`examTasks.${task.id}.${item.id}: unknown clip ${item.clipId}`);
        if (item.correctIndex >= item.options.length) issues.push(`examTasks.${task.id}.${item.id}: correctIndex out of range`);
      }
    }
  }
  for (const simulation of fullExamSimulations) {
    for (const sourceId of simulation.sourceRefs) if (!sourceIds.has(sourceId)) issues.push(`fullExamDashboards.${simulation.id}: unknown source ${sourceId}`);
    for (const taskId of simulation.modules.flatMap((module) => module.taskIds)) if (!taskIds.has(taskId)) issues.push(`fullExamDashboards.${simulation.id}: unknown task ${taskId}`);
  }
  for (const profile of Object.values(examProfiles)) {
    for (const sourceId of profile.sourceRefs) if (!sourceIds.has(sourceId)) issues.push(`examProfiles.${profile.id}: unknown source ${sourceId}`);
  }

  const countsWithoutTotal = {
    lessons: academicLessonList.length,
    lessonMetadata: curriculum.length,
    readingLibrary: readingLibrary.length,
    listeningLibrary: listeningLibrary.length,
    diagnosticQuestions: allDiagnosticQuestions.length,
    examTasks: allPublishedExamTasks.length,
    fullExamDashboards: fullExamSimulations.length,
    examProfiles: Object.keys(examProfiles).length,
    examSources: examSources.length,
    reviewCards: reviewCards.length,
    nounGrammarEntries: nounGrammarEntries.length,
    verbPrepositionFrames: verbPrepositionFrames.length,
  };
  const counts: AcademicSchemaCounts = {
    ...countsWithoutTotal,
    totalRootObjects: Object.values(countsWithoutTotal).reduce((sum, count) => sum + count, 0),
  };

  return { ok: issues.length === 0, issues, counts, schemaFamilies: 12 };
}

export function assertAcademicContentValid() {
  const result = validateAcademicContent();
  if (!result.ok) throw new Error(`Academic Zod validation failed:\n${result.issues.slice(0, 100).join("\n")}`);
  return result;
}
