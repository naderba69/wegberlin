import { describe, expect, it } from "vitest";
import { diagnosticForms } from "@/data/diagnostic";
import { diagnosticReviewItems } from "@/core/diagnostic/review";

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
});
