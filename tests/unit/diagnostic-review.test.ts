import { describe, expect, it } from "vitest";
import { diagnosticForms } from "@/data/diagnostic";
import { diagnosticReviewItems, diagnosticReviewItemsFromStored, diagnosticWrongAnswers } from "@/core/diagnostic/review";
import { diagnosticSchema } from "@/core/portability/schema";

describe("diagnostic after-test review", () => {
  const [first, second, third] = diagnosticForms.A;

  it("lists only answered-wrong questions, with the chosen and correct options", () => {
    const wrong = (first.correctIndex + 1) % 4;
    const items = diagnosticReviewItems([first, second, third], {
      [first.id]: wrong,
      [second.id]: second.correctIndex,
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: first.id,
      promptAr: first.prompt,
      chosenDe: first.options[wrong],
      correctDe: first.options[first.correctIndex],
      explanationDe: first.explanation,
    });
  });

  it("does not expose unanswered questions", () => {
    expect(diagnosticReviewItems([first, second, third], {})).toEqual([]);
  });

  it("does not expose correct answers", () => {
    const items = diagnosticReviewItems([first], { [first.id]: first.correctIndex });
    expect(items).toEqual([]);
  });

  it("stores only wrong answers and rebuilds the same review after a reload", () => {
    const wrong = (first.correctIndex + 1) % 4;
    const answers = { [first.id]: wrong, [second.id]: second.correctIndex, [third.id]: (third.correctIndex + 2) % 4 };
    const stored = diagnosticWrongAnswers([first, second, third], answers);
    expect(stored).toEqual({ [first.id]: wrong, [third.id]: (third.correctIndex + 2) % 4 });
    const rebuilt = diagnosticReviewItemsFromStored("A", stored);
    expect(rebuilt.map((item) => item.id)).toEqual(diagnosticReviewItems(diagnosticForms.A, stored).map((item) => item.id));
    expect(rebuilt.every((item) => item.chosenDe !== item.correctDe)).toBe(true);
    expect(rebuilt.map((item) => item.id)).toEqual(expect.arrayContaining([first.id, third.id]));
  });

  it("ignores unanswered questions when storing wrong answers", () => {
    expect(diagnosticWrongAnswers([first, second], {})).toEqual({});
  });

  it("keeps stored review answers when the saved diagnostic result is parsed back after a reload", () => {
    const base = { estimatedLevel: "A1", score: 5, maxScore: 8, levelScores: { A1: 3, A2: 0, B1: 0, B2: 0 }, completedAt: "2026-10-10T10:00:00.000Z" };
    const parsed = diagnosticSchema.parse({ ...base, reviewAnswers: { formId: "A", wrong: { [first.id]: 1 } } });
    expect(parsed.reviewAnswers).toEqual({ formId: "A", wrong: { [first.id]: 1 } });
    expect(diagnosticSchema.parse(base).reviewAnswers).toBeUndefined();
  });
});
