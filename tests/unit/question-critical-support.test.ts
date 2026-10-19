import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { createLexicalLoadContext, measureQuestionCriticalSupport } from "@/core/content-validation/lexical-load";
import { CURRICULUM_STOP_WORDS, curriculumStem } from "@/core/german/curriculum-lexical-context";
import { vocabularyStageVisibleTexts } from "@/core/lesson/vocabulary-stage";
import { germanLemmaDictionary } from "@/data/german-lemma-dictionary";
import { curriculumPersonNames, curriculumPlaceNames } from "@/data/curriculum-proper-names";
import { nounGrammarEntries, nounsByLesson, verbFramesByLesson } from "@/data/lexical-grammar-registry";
import type { FullLesson } from "@/types/lesson-content";

// ADR-135: no reading question may depend on a word that nothing in the course ever explained.
const context = createLexicalLoadContext({ dictionary: germanLemmaDictionary, stopWords: CURRICULUM_STOP_WORDS, properNames: [...curriculumPersonNames, ...curriculumPlaceNames], stem: curriculumStem });
const readingText = new Map(academicLessonList.map((lesson) => [lesson.id, lesson.reading.textDe]));
const stage = (id: string) => vocabularyStageVisibleTexts(nounsByLesson[id] ?? [], verbFramesByLesson[id] ?? [], readingText.get(id) ?? "");

function withReading(lesson: FullLesson, reading: Partial<FullLesson["reading"]>): FullLesson {
  return { ...lesson, reading: { ...lesson.reading, ...reading } };
}

describe("question-critical reading support (ADR-135)", () => {
  it("leaves no reading question or keyed answer depending on a never-explained word, at any level", () => {
    const rows = measureQuestionCriticalSupport(academicLessonList, context, stage);
    expect(rows).toHaveLength(96);
    expect(rows.filter((row) => row.words.length).map((row) => `${row.id}: ${row.words.join(",")}`)).toEqual([]);
  });

  it("flags a text word that a question needs when neither the sequence nor the glossary explains it", () => {
    const base = academicLessonList[0]!;
    const probe = withReading(base, {
      textDe: "Heute sieht Lina einen Quokkabaum im Garten.",
      glossary: [{ lemma: "heute", surfaceForm: "Heute", ar: "اليوم" }],
      questions: [{ id: "probe-rq1", promptDe: "Was sieht Lina?", promptAr: "ماذا ترى لينا؟", options: ["Einen Quokkabaum", "Ein Auto", "Eine Katze", "Ein Haus"], correctIndex: 0, explanationAr: "تجريبي." }],
    });
    expect(measureQuestionCriticalSupport([probe], context)[0]!.words).toContain("quokkabaum");
    const glossed = withReading(probe, { glossary: [...probe.reading.glossary, { lemma: "Quokkabaum", surfaceForm: "Quokkabaum", ar: "شجرة تجريبية" }] });
    expect(measureQuestionCriticalSupport([glossed], context)[0]!.words).not.toContain("quokkabaum");
  });

  it("ignores unknown words that only the text uses and no question needs", () => {
    const base = academicLessonList[0]!;
    const probe = withReading(base, {
      textDe: "Heute sieht Lina einen Quokkabaum im Garten.",
      questions: [{ id: "probe-rq1", promptDe: "Wer ist im Text?", promptAr: "من في النص؟", options: ["Lina", "Omar", "Mila", "Sami"], correctIndex: 0, explanationAr: "تجريبي." }],
    });
    expect(measureQuestionCriticalSupport([probe], context)[0]!.words).not.toContain("quokkabaum");
  });

  it("keeps every noun ID unique after the question-support anchors were appended", () => {
    const ids = nounGrammarEntries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [lessonId, nouns] of Object.entries(nounsByLesson)) {
      const lemmas = nouns.map((noun) => noun.lemma);
      expect(new Set(lemmas).size, lessonId).toBe(lemmas.length);
    }
  });

  it("enforces the zero ceiling in the lesson-quality audit", () => {
    const script = readFileSync("scripts/generate-lesson-quality-audit.ts", "utf8");
    expect(script).toContain("readingQuestionCriticalUnsupportedMax: 0");
    expect(script).toContain("measureQuestionCriticalSupport(lessons, lexicalContext, vocabularyStage)");
    const report = JSON.parse(readFileSync("reports/lesson-quality-audit.json", "utf8"));
    expect(report.reading.lemmatized.questionCritical.unsupported).toBe(0);
    expect(report.reading.lemmatized.questionCritical.byLevel).toEqual({ A1: 0, A2: 0, B1: 0, B2: 0 });
  });
});
