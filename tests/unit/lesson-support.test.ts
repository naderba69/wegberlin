import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { exerciseHintSteps, questionHintSteps, readingEvidenceMap, selectReadingEvidence } from "@/core/lesson/support";
import type { PracticeExercise, Question } from "@/types/lesson-content";

const question: Question = {
  id: "q",
  promptDe: "Wie fährt Mara zur Arbeit?",
  promptAr: "كيف؟",
  options: ["Mit dem Bus", "Mit dem Zug", "Zu Fuß", "Mit dem Fahrrad"],
  correctIndex: 0,
  explanationAr: "الحافلة.",
};

describe("delayed lesson support", () => {
  it("selects a verbatim sentence from the reading with answer-weighted overlap", () => {
    const text = "Mara wohnt in Bonn. Jeden Morgen fährt sie mit dem Bus zur Arbeit. Am Abend geht sie zu Fuß nach Hause.";
    expect(selectReadingEvidence(text, question)).toBe("Jeden Morgen fährt sie mit dem Bus zur Arbeit.");
  });

  it("produces a nonempty in-text evidence quote for every published reading question", () => {
    for (const lesson of academicLessonList) {
      const evidence = readingEvidenceMap(lesson.reading.textDe, lesson.reading.questions);
      for (const questionItem of lesson.reading.questions) {
        expect(evidence[questionItem.id].quote.trim().length).toBeGreaterThan(0);
        expect(lesson.reading.textDe).toContain(evidence[questionItem.id].quote);
        // كل سؤال قراءة منشور يعرض موضعًا مؤلفًا لا مطابقة آلية.
        expect(evidence[questionItem.id].origin, questionItem.id).toBe("authored");
      }
    }
  });

  it("provides two question hints without exposing the complete correct option", () => {
    const hints = questionHintSteps(question);
    expect(hints).toHaveLength(2);
    expect(hints.join(" ")).not.toContain(question.options[question.correctIndex]);
  });

  it("provides two non-answer hints for every controlled exercise type", () => {
    const exercises: PracticeExercise[] = [
      { id:"m",type:"multiple-choice",promptAr:"اختر",options:["a","b","c","d"],correctIndex:1,explanationAr:"x" },
      { id:"f",type:"fill-blank",promptAr:"أكمل",template:"Ich ___ hier.",acceptedAnswers:["wohne"],explanationAr:"x" },
      { id:"o",type:"word-ordering",promptAr:"رتب",words:["Ich","wohne","hier"],acceptedAnswers:["Ich wohne hier"],explanationAr:"x" },
      { id:"e",type:"error-correction",promptAr:"صحح",sentence:"Ich hier wohne.",acceptedAnswers:["Ich wohne hier"],explanationAr:"x" },
      { id:"p",type:"matching",promptAr:"طابق",pairs:[{left:"wohnen",right:"يسكن"}],explanationAr:"x" },
    ];
    for (const exercise of exercises) {
      const hints = exerciseHintSteps(exercise);
      expect(hints).toHaveLength(2);
      expect(hints.every((hint) => hint.trim().length >= 20)).toBe(true);
      if ("acceptedAnswers" in exercise) expect(hints.join(" ")).not.toContain(exercise.acceptedAnswers[0]);
      if (exercise.type === "multiple-choice") expect(hints.join(" ")).not.toContain(exercise.options[exercise.correctIndex]);
    }
  });
});
