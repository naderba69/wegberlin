import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import {
  authoredListeningEvidence,
  listeningEvidenceByQuestionId,
  listeningEvidenceSummary,
  listeningQuestionTargets,
  listeningQuestionsWithoutEvidence,
  orphanListeningEvidence,
  unresolvedListeningEvidence,
} from "@/data/listening-evidence-index";
import { listeningEvidenceMap, selectListeningEvidence, words } from "@/core/lesson/support";
import { splitListeningUnits } from "@/core/lesson/sentences";

const questionById = new Map(
  academicLessonList.flatMap((lesson) => (lesson.listening?.questions ?? []).map((question) => [question.id, question] as const)),
);

describe("P0-124: authored listening evidence across A1-B2", () => {
  it("gives every published listening question an authored evidence position", () => {
    expect(listeningQuestionTargets).toHaveLength(252);
    expect(listeningEvidenceSummary.listeningQuestions).toBe(252);
    expect(listeningEvidenceSummary.authoredEvidence).toBe(252);
    expect(listeningEvidenceSummary.questionsWithoutEvidence).toBe(0);
    expect(listeningEvidenceSummary.orphanEvidence).toBe(0);
    expect(listeningEvidenceSummary.unresolvedEvidence).toBe(0);
    expect(listeningQuestionsWithoutEvidence).toEqual([]);
    expect(orphanListeningEvidence).toEqual([]);
    expect(unresolvedListeningEvidence).toEqual([]);
    expect(listeningEvidenceSummary.byLevel).toEqual({
      A1: { lessons: 24, questions: 72, evidence: 72 },
      A2: { lessons: 24, questions: 72, evidence: 72 },
      B1: { lessons: 24, questions: 72, evidence: 72 },
      B2: { lessons: 12, questions: 36, evidence: 36 },
    });
  });

  it("quotes a verbatim unit of the lesson's own listening transcript", () => {
    for (const evidence of authoredListeningEvidence) {
      const lesson = academicLessonList.find((item) => item.id === evidence.lessonId);
      expect(lesson?.listening, evidence.questionId).toBeDefined();
      expect(evidence.quote.length, evidence.questionId).toBeGreaterThan(10);
      expect(lesson!.listening!.transcriptDe, evidence.questionId).toContain(evidence.quote);
      expect(splitListeningUnits(lesson!.listening!.transcriptDe), evidence.questionId).toContain(evidence.quote);
      expect(evidence.whyAr.trim().length, evidence.questionId).toBeGreaterThan(10);
    }
  });

  it("shares a content word with the question or its answer unless the row declares an inference", () => {
    let declared = 0;
    for (const evidence of authoredListeningEvidence) {
      const question = questionById.get(evidence.questionId);
      expect(question?.id, evidence.questionId).toBe(evidence.questionId);
      if (evidence.relation === "inference") {
        declared += 1;
        continue;
      }
      const expected = new Set([...words(question!.promptDe), ...words(question!.options[question!.correctIndex])]);
      const quoted = new Set(words(evidence.quote));
      expect([...expected].some((word) => quoted.has(word)), `${evidence.questionId} -> ${evidence.quote}`).toBe(true);
    }
    // 27 موضعًا صُرِّح فيها أن الجواب يعيد صياغة المقطع أو يستنتجه: الأرقام والساعات
    // والأعمار تُنطق بالحروف (`vierundzwanzig` ← الخيار `24`)، وبعض الخيارات تعيد
    // صياغة المقطع المسموع بصيغة اسمية.
    expect(declared).toBe(27);
    expect(listeningEvidenceSummary.inferenceEvidence).toBe(27);
  });

  it("renders the authored position instead of the lexical fallback", () => {
    let changed = 0;
    for (const lesson of academicLessonList) {
      if (!lesson.listening) continue;
      const evidence = listeningEvidenceMap(lesson.listening.transcriptDe, lesson.listening.questions);
      for (const question of lesson.listening.questions) {
        const view = evidence[question.id];
        expect(view.origin, question.id).toBe("authored");
        expect(view.quote, question.id).toBe(listeningEvidenceByQuestionId[question.id].quote);
        expect(view.whyAr.trim().length, question.id).toBeGreaterThan(10);
        // الموضع المؤلف يصحّح المطابقة اللفظية في 47 سؤالًا كانت تختار مقطعًا
        // يكرر كلمة السؤال دون أن يحمل الجواب (سؤال المتكلم بدل جوابه).
        if (view.quote !== selectListeningEvidence(lesson.listening.transcriptDe, question)) changed += 1;
      }
    }
    expect(changed).toBe(47);
  });

  it("keeps a lexical fallback only for a question the inventory never authored", () => {
    const lesson = academicLessonList[0];
    const unknown = {
      ...lesson.listening!.questions[0],
      id: "synthetic-listening-question-without-evidence",
      promptDe: "Wo wohnt Nora?",
      options: ["In Berlin", "In Bonn", "In Köln", "In Bremen"] as [string, string, string, string],
      correctIndex: 0 as const,
    };
    const evidence = listeningEvidenceMap(lesson.listening!.transcriptDe, [unknown]);
    expect(evidence[unknown.id].origin).toBe("auto");
    expect(evidence[unknown.id].quote.length).toBeGreaterThan(0);
  });
});
