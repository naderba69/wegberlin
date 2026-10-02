import { describe, expect, it } from "vitest";
import { DIAGNOSTIC_LEVEL_PASS_SCORE, alternateDiagnosticForm, nextDiagnosticLevel, questionsForDiagnosticLevel } from "@/core/diagnostic/adaptive";
import { evaluateDiagnostic } from "@/core/diagnostic/evaluate";
import { allDiagnosticQuestions, diagnosticForms, diagnosticLevels, diagnosticSkills } from "@/data/diagnostic";
import { libraryAudioAssetByItemId } from "@/data/library-audio-assets";

const correctAnswers = (questions: typeof allDiagnosticQuestions): Record<string, number> => Object.fromEntries(questions.map((question) => [question.id, question.correctIndex]));

describe("P0 adaptive diagnostic", () => {
  it("publishes two independent 16-item forms with four skills at every level", () => {
    expect(diagnosticForms.A).toHaveLength(16);
    expect(diagnosticForms.B).toHaveLength(16);
    expect(new Set(allDiagnosticQuestions.map((question) => question.id)).size).toBe(32);
    for (const formId of ["A", "B"] as const) {
      for (const level of diagnosticLevels) {
        const questions = questionsForDiagnosticLevel(formId, level);
        expect(questions).toHaveLength(4);
        expect(new Set(questions.map((question) => question.skill))).toEqual(new Set(diagnosticSkills));
      }
    }
  });

  it("maps every listening item to a committed generated MP3", () => {
    const listening = allDiagnosticQuestions.filter((question) => question.skill === "listening");
    expect(listening).toHaveLength(8);
    for (const question of listening) expect(libraryAudioAssetByItemId[question.audioItemId ?? ""]).toBeDefined();
  });

  it("stops at a failed level and advances only at three of four", () => {
    expect(DIAGNOSTIC_LEVEL_PASS_SCORE).toBe(3);
    expect(nextDiagnosticLevel("A1", 2)).toBeNull();
    expect(nextDiagnosticLevel("A1", 3)).toBe("A2");
    expect(nextDiagnosticLevel("B2", 4)).toBeNull();
  });

  it("evaluates an early A1 stop from four skill-separated answers", () => {
    const questions = questionsForDiagnosticLevel("A", "A1");
    const answers = correctAnswers(questions);
    answers[questions[0].id] = (questions[0].correctIndex + 1) % 4;
    answers[questions[1].id] = (questions[1].correctIndex + 1) % 4;
    const { result } = evaluateDiagnostic(answers, "A", new Date("2026-08-31T12:00:00Z"));
    expect(result.estimatedLevel).toBe("A1");
    expect(result.questionsAnswered).toBe(4);
    expect(result.maxScore).toBe(4);
    expect(result.stoppedEarly).toBe(true);
    expect(result.confidence).toBe("low");
    expect(Object.values(result.skillScores ?? {}).every((skill) => skill.attempted === 1)).toBe(true);
  });

  it("estimates the highest sequentially passed level without counting unasked items", () => {
    const a1 = questionsForDiagnosticLevel("B", "A1");
    const a2 = questionsForDiagnosticLevel("B", "A2");
    const b1 = questionsForDiagnosticLevel("B", "B1");
    const answers = correctAnswers([...a1, ...a2, ...b1]);
    answers[b1[0].id] = (b1[0].correctIndex + 1) % 4;
    answers[b1[1].id] = (b1[1].correctIndex + 1) % 4;
    const { result } = evaluateDiagnostic(answers, "B");
    expect(result.estimatedLevel).toBe("A2");
    expect(result.questionsAnswered).toBe(12);
    expect(result.levelAttempted).toEqual({ A1: 4, A2: 4, B1: 4, B2: 0 });
    expect(result.levelScores.B2).toBe(0);
  });

  it("alternates forms on retest to reduce answer memorization", () => {
    expect(alternateDiagnosticForm()).toBe("A");
    expect(alternateDiagnosticForm("A")).toBe("B");
    expect(alternateDiagnosticForm("B")).toBe("A");
  });
});
