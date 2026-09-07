import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import {
  authoredReadingEvidence,
  readingEvidenceByQuestionId,
  readingEvidenceSummary,
  readingQuestionTargets,
  readingQuestionsWithoutEvidence,
  orphanReadingEvidence,
  unresolvedReadingEvidence,
} from "@/data/reading-evidence-index";
import { readingEvidenceMap, selectReadingEvidence, words } from "@/core/lesson/support";
import { splitGermanSentences } from "@/core/lesson/sentences";

const questionById = new Map(
  academicLessonList.flatMap((lesson) => lesson.reading.questions.map((question) => [question.id, question] as const)),
);

describe("P0-124: authored reading evidence across A1-B2", () => {
  it("gives every published reading question an authored evidence position", () => {
    expect(readingQuestionTargets).toHaveLength(252);
    expect(readingEvidenceSummary.readingQuestions).toBe(252);
    expect(readingEvidenceSummary.authoredEvidence).toBe(252);
    expect(readingEvidenceSummary.questionsWithoutEvidence).toBe(0);
    expect(readingEvidenceSummary.orphanEvidence).toBe(0);
    expect(readingEvidenceSummary.unresolvedEvidence).toBe(0);
    expect(readingQuestionsWithoutEvidence).toEqual([]);
    expect(orphanReadingEvidence).toEqual([]);
    expect(unresolvedReadingEvidence).toEqual([]);
    expect(readingEvidenceSummary.byLevel).toEqual({
      A1: { lessons: 24, questions: 72, evidence: 72 },
      A2: { lessons: 24, questions: 72, evidence: 72 },
      B1: { lessons: 24, questions: 72, evidence: 72 },
      B2: { lessons: 12, questions: 36, evidence: 36 },
    });
  });

  it("quotes a verbatim sentence of the lesson's own reading text", () => {
    for (const evidence of authoredReadingEvidence) {
      const lesson = academicLessonList.find((item) => item.id === evidence.lessonId);
      expect(lesson, evidence.questionId).toBeDefined();
      expect(evidence.quote.length, evidence.questionId).toBeGreaterThan(10);
      expect(lesson!.reading.textDe, evidence.questionId).toContain(evidence.quote);
      expect(splitGermanSentences(lesson!.reading.textDe), evidence.questionId).toContain(evidence.quote);
      expect(evidence.whyAr.trim().length, evidence.questionId).toBeGreaterThan(10);
    }
  });

  it("shares a content word with the question or its answer unless the row declares an inference", () => {
    let declared = 0;
    for (const evidence of authoredReadingEvidence) {
      const prompt = questionById.get(evidence.questionId);
      expect(prompt?.id, evidence.questionId).toBe(evidence.questionId);
      if (evidence.relation === "inference") {
        declared += 1;
        continue;
      }
      const expected = new Set([...words(prompt!.promptDe), ...words(prompt!.options[prompt!.correctIndex])]);
      const quoted = new Set(words(evidence.quote));
      expect([...expected].some((word) => quoted.has(word)), `${evidence.questionId} -> ${evidence.quote}`).toBe(true);
    }
    // 23 موضعًا صُرِّح فيها بأن الجواب يعيد صياغة الجملة أو يستنتجها (الأرقام بالحروف نموذجًا).
    expect(declared).toBe(23);
    expect(readingEvidenceSummary.inferenceEvidence).toBe(23);
  });

  it("renders the authored position instead of the lexical fallback", () => {
    let changed = 0;
    for (const lesson of academicLessonList) {
      const evidence = readingEvidenceMap(lesson.reading.textDe, lesson.reading.questions);
      for (const question of lesson.reading.questions) {
        const view = evidence[question.id];
        expect(view.origin, question.id).toBe("authored");
        expect(view.quote, question.id).toBe(readingEvidenceByQuestionId[question.id].quote);
        expect(view.whyAr.trim().length, question.id).toBeGreaterThan(10);
        // الموضع المؤلف يصحّح المطابقة اللفظية في 46 سؤالًا كانت تختار جملة صحيحة شكليًا وضعيفة دلاليًا.
        if (view.quote !== selectReadingEvidence(lesson.reading.textDe, question)) changed += 1;
      }
    }
    expect(changed).toBe(46);
  });

  it("keeps a lexical fallback only for a question the inventory never authored", () => {
    const lesson = academicLessonList[0];
    const unknown = {
      ...lesson.reading.questions[0],
      id: "synthetic-question-without-evidence",
      promptDe: "Wer ist die Lehrerin?",
      options: ["Omar", "Frau Keller", "Nora", "Sami"] as [string, string, string, string],
      correctIndex: 1 as const,
    };
    const evidence = readingEvidenceMap(lesson.reading.textDe, [unknown]);
    expect(evidence[unknown.id].origin).toBe("auto");
    expect(evidence[unknown.id].quote.length).toBeGreaterThan(0);
  });
});
