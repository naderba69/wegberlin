import { describe, expect, it } from "vitest";
import {
  ACCEPTED_ANSWER_HYGIENE_VERSION,
  analyzeAcceptedAnswerHygiene,
  acceptedAnswerRow,
  distinctAcceptedForms,
  noOpAcceptedVariants,
} from "@/core/content-validation/accepted-answer-hygiene";
import { academicLessonList as lessons } from "@/data/academic-lessons";
import { evaluateExercise } from "@/core/lesson/evaluate";
import type { PracticeExercise } from "@/types/lesson-content";

const fillBlank = (id: string, acceptedAnswers: string[]): PracticeExercise => ({ id, type: "fill-blank", promptAr: "أكمل", template: "___", acceptedAnswers, explanationAr: "شرح" });

describe("accepted-answer hygiene", () => {
  it("treats capitalisation and a trailing full stop as the same answer, not as breadth", () => {
    // "WIE HEISST DU!" is deliberately absent: upper-casing ß yields SS, and ß/ss are never folded (ADR-078).
    expect(distinctAcceptedForms(["wie heißt du", "Wie heißt du?", "wie heißt du!"])).toHaveLength(1);
    expect(distinctAcceptedForms(["Wie heißt du", "Wie heißt du?"])).toHaveLength(1);
    expect(distinctAcceptedForms(["Ich heiße Ali", "ich heiße ali."])).toHaveLength(1);
    expect(noOpAcceptedVariants(["Langsamer bitte", "Langsamer, bitte"])).toEqual(["Langsamer, bitte"]);
  });

  it("keeps genuinely different forms apart, umlauts included", () => {
    expect(distinctAcceptedForms(["wohingegen", "während"])).toHaveLength(2);
    expect(distinctAcceptedForms(["Du könntest zuerst mit der Lehrkraft sprechen", "An deiner Stelle würde ich zuerst mit der Lehrkraft sprechen"])).toHaveLength(2);
    // ADR-078 plus content-integrity: ß and ss are never folded into each other.
    expect(distinctAcceptedForms(["heißt", "heisst"])).toHaveLength(2);
    expect(noOpAcceptedVariants(["heißt", "heisst"])).toEqual([]);
  });

  it("marks an exercise that only looks multi-variant as exactly one string", () => {
    const row = acceptedAnswerRow(fillBlank("x-e1", ["Das ist mein Vater", "Das ist mein Vater."]));
    expect(row?.acceptsExactlyOneString).toBe(true);
    expect(row?.noOpVariants).toEqual(["Das ist mein Vater."]);
    expect(row?.distinctNormalized).toBe(1);
    expect(acceptedAnswerRow(fillBlank("x-e2", ["wohingegen", "während"]))?.acceptsExactlyOneString).toBe(false);
    expect(acceptedAnswerRow({ id: "x-e3", type: "matching", promptAr: "طابق", pairs: [], explanationAr: "شرح" })).toBeNull();
  });

  it("keeps the documented removal grade-neutral", () => {
    // The purge is only safe as long as the grader itself ignores case and punctuation: a dropped
    // variant must still pass, and must pass identically for every dropped duplicate.
    const exercise = fillBlank("x-e4", ["Wie heißt du"]);
    for (const typed of ["Wie heißt du", "wie heißt du?", "Wie heißt du!"]) expect(evaluateExercise(exercise, typed)).toBe(true);
    expect(evaluateExercise(exercise, "Wie heißen Sie?")).toBe(false);
    expect(evaluateExercise(exercise, "Wie heisst du")).toBe(false);
  });

  it("reports the whole tree with no unreachable variant left", () => {
    const summary = analyzeAcceptedAnswerHygiene(lessons.map((lesson) => ({ id: lesson.id, level: lesson.level, exercises: lesson.exercises })));
    expect(summary.version).toBe(ACCEPTED_ANSWER_HYGIENE_VERSION);
    expect(summary.productiveExercises).toBe(387);
    expect(summary.noOpVariantCount).toBe(0);
    expect(summary.offenders).toEqual([]);
    expect(summary.acceptsExactlyOneString).toBe(338);
    expect(summary.broadenedExercises).toBe(49);
    expect(summary.acceptsExactlyOneString + summary.broadenedExercises).toBe(summary.productiveExercises);
    for (const level of ["A1", "A2", "B1", "B2"]) expect(summary.byLevel[level]?.productiveExercises).toBeGreaterThan(0);
  });

  it("keeps the published guard honest: every listed variant is reachable", () => {
    for (const lesson of lessons) {
      for (const exercise of lesson.exercises) {
        const row = acceptedAnswerRow(exercise);
        if (!row) continue;
        expect(row.variants.length, row.exerciseId).toBeGreaterThan(0);
        expect(row.distinctNormalized, row.exerciseId).toBe(row.variants.length);
      }
    }
  });
});
