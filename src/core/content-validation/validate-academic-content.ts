import type { z } from "zod";
import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import { allDiagnosticQuestions } from "@/data/diagnostic";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { examProfiles, examSources } from "@/data/exam-profiles";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";
import { LEXICAL_GRAMMAR_LEVELS, framesByLesson, lexicalLevelOf, nounGrammarEntries, nounsByLesson, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { reviewCards } from "@/data/review-cards";
import { inventoryNouns, lessonNounTargets, targetNounsWithoutSeed } from "@/data/noun-inventory";
import { frameKeyOf, valencyEntriesById } from "@/data/verb-preposition-dictionary";
import { measuredTargetsByLesson } from "@/data/verb-preposition-coverage";
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

const anchoredByLessonId: Record<string, Set<string>> = {};
for (const noun of nounGrammarEntries) {
  if (noun.origin !== "anchor") continue;
  anchoredByLessonId[noun.lessonId] ??= new Set<string>();
  anchoredByLessonId[noun.lessonId].add(noun.lemma);
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
      const anchors = nouns.filter((entry) => entry.origin === "anchor");
      const frames = verbPrepositionFrames.filter((entry) => entry.lessonId === lessonId);
      const authored = frames.filter((frame) => frame.origin === "authored");
      if (anchors.length !== rule.nounsPerLesson) issues.push(`nounGrammarEntries.${lessonId}: expected ${rule.nounsPerLesson} ${level} anchor nouns, received ${anchors.length}`);
      if (nouns.length < rule.nounsPerLesson) issues.push(`nounGrammarEntries.${lessonId}: lesson has fewer than ${rule.nounsPerLesson} ${level} noun records`);
      if (authored.length < rule.framesPerLesson) issues.push(`verbPrepositionFrames.${lessonId}: expected at least ${rule.framesPerLesson} authored ${level} frames, received ${authored.length}`);
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
    const genitiveArticle = noun.gender === "feminine" ? "der" : "des";
    if (!noun.caseForms.genitive.startsWith(`${genitiveArticle} `) || noun.caseForms.genitive.trim() === genitiveArticle) {
      issues.push(`nounGrammarEntries.${noun.id}: invalid genitive form ${noun.caseForms.genitive}`);
    }
    const weakOblique = noun.caseForms.dative.split(" ").slice(1).join(" ");
    if (noun.gender !== "feminine" && weakOblique !== noun.lemma && !noun.caseForms.genitive.endsWith(weakOblique) && !noun.caseForms.genitive.endsWith(`${weakOblique}s`)) {
      issues.push(`nounGrammarEntries.${noun.id}: genitive ${noun.caseForms.genitive} ignores the weak oblique stem ${weakOblique}`);
    }
    if (noun.plural.form === null ? noun.dativePlural.form !== null : noun.dativePlural.form === null) {
      issues.push(`nounGrammarEntries.${noun.id}: dative plural policy does not match the plural policy`);
    }
    if (noun.dativePlural.form !== null) {
      const stem = noun.dativePlural.form.replace(/^den /, "");
      if (!stem.endsWith("n") && !stem.endsWith("s")) issues.push(`nounGrammarEntries.${noun.id}: dative plural ${noun.dativePlural.form} does not end in n or s`);
      if (!stem.startsWith(noun.plural.form ?? "")) issues.push(`nounGrammarEntries.${noun.id}: dative plural ${noun.dativePlural.form} does not start from the plural ${noun.plural.form}`);
    }
    if (!noun.dativePlural.noteAr.trim()) issues.push(`nounGrammarEntries.${noun.id}: dative plural note missing`);
  }
  for (const frame of verbPrepositionFrames) {
    const level = lexicalLevelOf(frame.lessonId);
    if (!level || !(lessonsByLevel[level] ?? []).includes(frame.lessonId)) issues.push(`verbPrepositionFrames.${frame.id}: lesson is not a published ${level ?? "authored"} lesson`);
    if (level && frame.sourceVersion !== `${level.toLowerCase()}-lexical-grammar-v1`) issues.push(`verbPrepositionFrames.${frame.id}: source version does not match ${level}`);
    if (!lower(frame.chunkDe).includes(lower(frame.preposition))) issues.push(`verbPrepositionFrames.${frame.id}: chunk omits preposition`);
    if (!lower(frame.exampleDe).includes(lower(frame.preposition))) issues.push(`verbPrepositionFrames.${frame.id}: example omits preposition`);
    // يجب أن يحمل الـchunk الفعل: بالمصدر، أو بأحد الأشكال التصريفية المصرَّحة في القاموس
    // (بعض التراكيب ثابتة على صيغة واحدة مثل «es geht um die Frist»).
    const entry = valencyEntriesById[frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase)];
    for (const token of infinitiveTokens(frame.infinitive)) {
      const inInfinitive = lower(frame.chunkDe).includes(lower(token));
      const inflected = entry?.searchForms.some((form) => lower(frame.chunkDe).includes(lower(form))) ?? false;
      if (!inInfinitive && !inflected) issues.push(`verbPrepositionFrames.${frame.id}: chunk omits the framed infinitive token ${token}`);
    }
    if (frame.contrastAr.trim().length < 12) issues.push(`verbPrepositionFrames.${frame.id}: Arabic contrast note is too thin`);
  }
  // يمنع تكرار الإطار داخل الدرس نفسه. أما تكرار الفعل مع حرف الجر نفسه عبر دروس مختلفة
  // فمسموح ومقصود: الفعل هدف في أكثر من درس، ولكل درس إطاره الخاص.
  const lessonChunkKeys = new Set<string>();
  for (const frame of verbPrepositionFrames) {
    const key = `${frame.lessonId}|${lower(frame.chunkDe)}`;
    if (lessonChunkKeys.has(key)) issues.push(`verbPrepositionFrames.${frame.id}: lesson ${frame.lessonId} repeats the chunk "${frame.chunkDe}"`);
    lessonChunkKeys.add(key);
    const frameKey = frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase);
    if (!valencyEntriesById[frameKey]) issues.push(`verbPrepositionFrames.${frame.id}: ${frameKey} is not a declared valency entry`);
  }

  // P0-99: كل فعل ذي متمم جرّي قاسه الجرد داخل نص الدرس يجب أن يكون له إطار في ذلك الدرس،
  // وكل إطار مشتق يجب أن يكون مسوَّغًا بوقوع مدخله المقاس في نص الدرس نفسه.
  let measuredTargets = 0;
  let unmeasuredDerived = 0;
  for (const [lessonId, targets] of Object.entries(measuredTargetsByLesson)) {
    const keys = new Set(
      (framesByLesson[lessonId] ?? []).map((frame) => frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase)),
    );
    measuredTargets += targets.length;
    for (const entryId of targets) {
      if (!keys.has(entryId)) issues.push(`verbCoverage.${lessonId}: measured valency target ${entryId} has no frame in the lesson`);
    }
  }
  for (const frame of verbPrepositionFrames.filter((item) => item.origin === "derived")) {
    const key = frameKeyOf(frame.infinitive, frame.preposition, frame.governedCase);
    if (!(measuredTargetsByLesson[frame.lessonId] ?? []).includes(key)) {
      unmeasuredDerived += 1;
      issues.push(`verbPrepositionFrames.${frame.id}: derived frame ${key} is not a measured target of ${frame.lessonId}`);
    }
  }

  // P0-98: كل اسم هدف في مسرد قراءة الدرس يجب أن يملك سجلًا في درسه نفسه،
  // وكل سجل جرد يجب أن يكون مسوَّغًا باسم في مسرد درسه، ولا اسم هدف بلا صرف في المشروع.
  let measuredNounTargets = 0;
  let unjustifiedInventoryNouns = 0;
  for (const [lessonId, targets] of Object.entries(lessonNounTargets)) {
    const owned = new Set((nounsByLesson[lessonId] ?? []).map((noun) => noun.lemma));
    measuredNounTargets += targets.length;
    for (const target of targets) {
      if (!owned.has(target.lemma)) issues.push(`nounInventory.${lessonId}: glossary target noun ${target.lemma} has no record in this lesson`);
    }
  }
  for (const noun of inventoryNouns) {
    const targets = lessonNounTargets[noun.lessonId] ?? [];
    if (!targets.some((target) => target.lemma === noun.lemma)) {
      unjustifiedInventoryNouns += 1;
      issues.push(`nounGrammarEntries.${noun.id}: inventory noun ${noun.lemma} is not a glossary target of ${noun.lessonId}`);
    }
    if ((anchoredByLessonId[noun.lessonId] ?? new Set<string>()).has(noun.lemma)) {
      issues.push(`nounGrammarEntries.${noun.id}: inventory noun ${noun.lemma} duplicates an anchor of ${noun.lessonId}`);
    }
  }
  for (const lemma of targetNounsWithoutSeed) issues.push(`nounInventory: target noun ${lemma} has neither an authored seed nor an anchor in the course`);

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
    anchorNouns: nounGrammarEntries.filter((entry) => entry.origin === "anchor").length,
    inventoryNouns: nounGrammarEntries.filter((entry) => entry.origin === "inventory").length,
    measuredNounTargets,
    unjustifiedInventoryNouns,
    nounTargetsWithoutMorphology: targetNounsWithoutSeed.length,
    verbPrepositionFrames: verbPrepositionFrames.length,
    derivedVerbFrames: verbPrepositionFrames.filter((frame) => frame.origin === "derived").length,
    measuredValencyTargets: measuredTargets,
    unjustifiedDerivedFrames: unmeasuredDerived,
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
