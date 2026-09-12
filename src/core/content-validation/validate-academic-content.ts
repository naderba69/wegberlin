import type { z } from "zod";
import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import { allDiagnosticQuestions } from "@/data/diagnostic";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { examProfiles, examSources } from "@/data/exam-profiles";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { tunisianSupportNotes } from "@/data/tunisian-support-registry";
import { reviewCards } from "@/data/review-cards";
import { buildPartialCanonical, dictationBank } from "@/data/dictation-bank";
import { branchingConversationScenarios } from "@/data/branching-conversations";
import { collocationNetworks } from "@/data/collocation-networks";
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
  tunisianSupportNoteSchema,
  dictationItemSchema,
  branchingConversationScenarioSchema,
  collocationNetworkSchema,
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
  tunisianSupportNotes: number;
  dictationItems: number;
  branchingConversationScenarios: number;
  collocationNetworks: number;
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
  validateCollection("tunisianSupportNotes", tunisianSupportNoteSchema, tunisianSupportNotes, issues);
  validateCollection("dictationItems", dictationItemSchema, dictationBank, issues);
  validateCollection("branchingConversationScenarios", branchingConversationScenarioSchema, branchingConversationScenarios, issues);
  validateCollection("collocationNetworks", collocationNetworkSchema, collocationNetworks, issues);

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
  checkUnique("Tunisian support notes", tunisianSupportNotes.map((entry) => entry.id), issues);
  checkUnique("dictation items", dictationBank.map((entry) => entry.id), issues);
  checkUnique("branching scenarios", branchingConversationScenarios.map((entry) => entry.id), issues);
  checkUnique("collocation networks", collocationNetworks.map((entry) => entry.id), issues);
  checkUnique("branching nodes", branchingConversationScenarios.flatMap((scenario) => scenario.nodes.map((node) => node.id)), issues);
  checkUnique("branching choices", branchingConversationScenarios.flatMap((scenario) => scenario.nodes.flatMap((node) => node.choices?.map((choice) => choice.id) ?? [])), issues);
  checkUnique("collocation nodes", collocationNetworks.flatMap((network) => network.nodes.map((node) => node.id)), issues);

  for (const item of dictationBank) {
    if (item.mode === "partial" && buildPartialCanonical(item) !== item.canonicalText) issues.push(`dictationItems.${item.id}: template and slots do not reconstruct canonical text`);
  }
  for (const scenario of branchingConversationScenarios) {
    const nodeIds = new Set(scenario.nodes.map((node) => node.id));
    if (!nodeIds.has(scenario.openingNodeId)) issues.push(`branchingConversationScenarios.${scenario.id}: opening node is missing`);
    for (const node of scenario.nodes) for (const choice of node.choices ?? []) if (!nodeIds.has(choice.nextNodeId)) issues.push(`branchingConversationScenarios.${scenario.id}.${choice.id}: next node is missing`);
    const outcomes = new Set(scenario.nodes.flatMap((node) => node.outcome ? [node.outcome] : []));
    for (const outcome of ["goal-reached", "partial", "restart-recommended"]) if (!outcomes.has(outcome as "goal-reached" | "partial" | "restart-recommended")) issues.push(`branchingConversationScenarios.${scenario.id}: missing ${outcome} terminal`);
  }
  for (const network of collocationNetworks) {
    if (network.nodes.some((node) => !node.id.startsWith(`${network.id}-c`))) issues.push(`collocationNetworks.${network.id}: node ID is not anchored to its network`);
  }

  const structuredLessonIds = academicLessonList.map((lesson) => lesson.id);
  const genderArticle = { masculine: "der", feminine: "die", neuter: "das", "plural-only": "die" } as const;
  for (const lessonId of structuredLessonIds) {
    const nouns = nounGrammarEntries.filter((entry) => entry.lessonId === lessonId);
    const frames = verbPrepositionFrames.filter((entry) => entry.lessonId === lessonId);
    if (nouns.length < 4) issues.push(`nounGrammarEntries.${lessonId}: expected at least 4 A1–B2 anchor nouns, received ${nouns.length}`);
    const nounKeys = nouns.map((noun) => noun.lemma.toLocaleLowerCase("de-DE"));
    if (new Set(nounKeys).size !== nounKeys.length) issues.push(`nounGrammarEntries.${lessonId}: duplicate noun lemma`);
    if (frames.length < 1) issues.push(`verbPrepositionFrames.${lessonId}: expected at least 1 A1–B2 frame, received ${frames.length}`);
    const frameKeys = frames.map((frame) => `${frame.infinitive.toLocaleLowerCase("de-DE")}|${frame.preposition.toLocaleLowerCase("de-DE")}`);
    if (new Set(frameKeys).size !== frameKeys.length) issues.push(`verbPrepositionFrames.${lessonId}: duplicate infinitive/preposition pair`);
  }
  for (const noun of nounGrammarEntries) {
    if (!structuredLessonIds.includes(noun.lessonId)) issues.push(`nounGrammarEntries.${noun.id}: lesson is not published A1–B2`);
    const expectedVersion = noun.lessonId.startsWith("a1-") ? "a1-lexical-grammar-v1" : noun.lessonId.startsWith("a2-") ? "a2-lexical-grammar-v1" : noun.lessonId.startsWith("b1-") ? "b1-lexical-grammar-v1" : "b2-lexical-grammar-v1";
    if (noun.sourceVersion !== expectedVersion) issues.push(`nounGrammarEntries.${noun.id}: source version does not match level`);
    if (noun.article !== genderArticle[noun.gender]) issues.push(`nounGrammarEntries.${noun.id}: article/gender mismatch`);
    if (!noun.caseForms.nominative.startsWith(`${noun.article} `)) issues.push(`nounGrammarEntries.${noun.id}: invalid nominative form`);
    if (!noun.plural.noteAr.trim()) issues.push(`nounGrammarEntries.${noun.id}: plural note missing`);
    if (noun.plural.dativeForm && !noun.plural.form) issues.push(`nounGrammarEntries.${noun.id}: dative plural cannot exist without a plural form`);
    if (noun.gender === "plural-only") {
      if (!noun.plural.form) issues.push(`nounGrammarEntries.${noun.id}: plural-only entry needs an authored plural surface`);
      if (!noun.caseForms.nominative.startsWith("die ") || !noun.caseForms.accusative.startsWith("die ") || !noun.caseForms.dative.startsWith("den ")) issues.push(`nounGrammarEntries.${noun.id}: invalid plural-only case forms`);
      if (!noun.plural.noteAr.includes("الجمع فقط")) issues.push(`nounGrammarEntries.${noun.id}: plural-only policy is not explicit`);
    }
  }
  for (const frame of verbPrepositionFrames) {
    if (!structuredLessonIds.includes(frame.lessonId)) issues.push(`verbPrepositionFrames.${frame.id}: lesson is not published A1–B2`);
    const expectedVersion = frame.lessonId.startsWith("a1-") ? "a1-lexical-grammar-v1" : frame.lessonId.startsWith("a2-") ? "a2-lexical-grammar-v1" : frame.lessonId.startsWith("b1-") ? "b1-lexical-grammar-v1" : "b2-lexical-grammar-v1";
    if (frame.sourceVersion !== expectedVersion) issues.push(`verbPrepositionFrames.${frame.id}: source version does not match level`);
    if (!frame.chunkDe.toLocaleLowerCase("de-DE").includes(frame.preposition.toLocaleLowerCase("de-DE"))) issues.push(`verbPrepositionFrames.${frame.id}: chunk omits preposition`);
    if (!frame.exampleDe.toLocaleLowerCase("de-DE").includes(frame.preposition.toLocaleLowerCase("de-DE"))) issues.push(`verbPrepositionFrames.${frame.id}: example omits preposition`);
  }

  for (const meta of curriculum) {
    if (meta.status === "published" && !lessonIds.has(meta.id)) issues.push(`lessonMetadata.${meta.id}: published lesson has no academic object`);
  }
  for (const note of tunisianSupportNotes) {
    const lesson = academicLessonList.find((item) => item.id === note.lessonId);
    if (!lesson) {
      issues.push(`tunisianSupportNotes.${note.id}: lesson is not published`);
      continue;
    }
    if (lesson.level !== note.level) issues.push(`tunisianSupportNotes.${note.id}: level does not match lesson`);
    for (const theoryId of note.theoryIds) if (!lesson.theory.some((theory) => theory.id === theoryId)) issues.push(`tunisianSupportNotes.${note.id}: unknown theory ${theoryId}`);
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
    tunisianSupportNotes: tunisianSupportNotes.length,
    dictationItems: dictationBank.length,
    branchingConversationScenarios: branchingConversationScenarios.length,
    collocationNetworks: collocationNetworks.length,
  };
  const counts: AcademicSchemaCounts = {
    ...countsWithoutTotal,
    totalRootObjects: Object.values(countsWithoutTotal).reduce((sum, count) => sum + count, 0),
  };

  return { ok: issues.length === 0, issues, counts, schemaFamilies: 16 };
}

export function assertAcademicContentValid() {
  const result = validateAcademicContent();
  if (!result.ok) throw new Error(`Academic Zod validation failed:\n${result.issues.slice(0, 100).join("\n")}`);
  return result;
}
