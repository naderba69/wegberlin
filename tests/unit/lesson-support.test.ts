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
    const evidence = selectReadingEvidence(text, question);
    expect(evidence.quote).toBe("Jeden Morgen fährt sie mit dem Bus zur Arbeit.");
    expect(evidence.kind).toBe("verbatim");
    expect(evidence.labelAr.length).toBeGreaterThan(0);
  });

  it("keeps short numeric answers anchored to the sentence that carries the number", () => {
    // Regression: "27" was dropped by a length filter, so the highlight landed on the name sentence.
    const numeric: Question = { id: "n", promptDe: "Wie alt ist Paul?", promptAr: "كم عمره؟", options: ["19", "22", "27", "32"], correctIndex: 2, explanationAr: "سبعة وعشرون." };
    const text = "Im Sportverein füllt Mariam drei Kontaktkarten aus. Ihre eigene Karte hat nur Übungsdaten: Mariam, 22 Jahre, Geburtstag im Mai. Neben ihr sitzt Paul. Er ist 27 Jahre alt und hat am zwölften Oktober Geburtstag.";
    const evidence = selectReadingEvidence(text, numeric);
    expect(evidence.quote).toBe("Er ist 27 Jahre alt und hat am zwölften Oktober Geburtstag.");
    expect(evidence.kind).toBe("verbatim");
  });

  it("reports a computed location instead of a false quote when the text spells numbers in words", () => {
    const clock: Question = { id: "c", promptDe: "Wann beginnt der Kurs?", promptAr: "متى؟", options: ["Um 8:00", "Um 7:45", "Um 10:30", "Um 11:10"], correctIndex: 0, explanationAr: "الثامنة." };
    const text = "Am Dienstag hat Salma drei Termine. Um acht Uhr beginnt ihr Deutschkurs. Der Kurs dauert von acht bis halb elf.";
    const evidence = selectReadingEvidence(text, clock);
    expect(evidence.quote).toBe("Um acht Uhr beginnt ihr Deutschkurs.");
    expect(evidence.kind).toBe("computed");
  });

  it("never invents an evidence sentence for an inferential question", () => {
    const why: Question = { id: "w", promptDe: "Was folgt daraus?", promptAr: "ماذا نستنتج؟", options: ["Ein Umdenken ist nötig", "Alles bleibt gleich", "Niemand liest", "Die Stadt wächst"], correctIndex: 0, explanationAr: "استنتاج." };
    const evidence = selectReadingEvidence("Er kauft Brot. Sie trinkt Kaffee. Das Kind spielt draußen.", why);
    expect(evidence.quote).toBeNull();
    expect(evidence.kind).toBe("ungrounded");
  });

  it("publishes an evidence record per reading question and grounds it whenever a quote exists", () => {
    for (const lesson of academicLessonList) {
      const evidence = readingEvidenceMap(lesson.reading.textDe, lesson.reading.questions);
      for (const questionItem of lesson.reading.questions) {
        const record = evidence[questionItem.id];
        expect(record, `${lesson.id}/${questionItem.id} has no evidence record`).toBeDefined();
        expect(record.policyVersion).toBe("reading-evidence-grounded-v1");
        if (record.quote === null) {
          expect(record.kind).toBe("ungrounded");
          // Ungrounded must be the honest residual: no sentence may contain an answer word or digit.
          const answer = `${questionItem.options[questionItem.correctIndex]}`.normalize("NFKC").toLocaleLowerCase("de-DE");
          const keys = answer.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 4 || /^\d{1,4}$/u.test(token));
          for (const sentence of lesson.reading.textDe.split(/(?<=[.!?])\s+|\n+/u)) {
            const normalized = sentence.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}]+/gu, " ");
            expect(keys.some((key) => normalized.includes(key)), `${lesson.id}/${questionItem.id} missed an available quote`).toBe(false);
          }
          continue;
        }
        expect(lesson.reading.textDe).toContain(record.quote);
        expect(record.labelAr.length).toBeGreaterThan(0);
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
