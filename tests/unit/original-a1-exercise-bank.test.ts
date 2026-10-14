import { describe, expect, it } from "vitest";
import {
  A1_ORIGINAL_EXERCISE_POLICY_VERSION,
  A1_ORIGINAL_EXERCISE_REVIEW_STATUS,
  a1OriginalExerciseItems,
} from "../../src/data/a1-original-exercise-bank";

describe("A1 original exercise bank (structural check only)", () => {
  it("holds exactly 50 A1 items with a unique id each", () => {
    expect(a1OriginalExerciseItems).toHaveLength(50);
    const ids = a1OriginalExerciseItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(50);
    for (const item of a1OriginalExerciseItems) expect(item.level, item.id).toBe("A1");
  });

  it("gives every item three distinct options and a valid correct index", () => {
    for (const item of a1OriginalExerciseItems) {
      expect(item.options, item.id).toHaveLength(3);
      expect(new Set(item.options).size, item.id).toBe(3);
      expect(item.options.every((o) => o.trim().length > 0), item.id).toBe(true);
      expect(item.correctIndex, item.id).toBeGreaterThanOrEqual(0);
      expect(item.correctIndex, item.id).toBeLessThan(3);
    }
  });

  it("requires a non-empty Arabic explanation and a German prompt", () => {
    for (const item of a1OriginalExerciseItems) {
      expect(item.explanationAr.trim().length, item.id).toBeGreaterThan(0);
      expect(item.promptDe.trim().length, item.id).toBeGreaterThan(0);
    }
  });

  it("spreads correct answers across all three positions", () => {
    const positions = new Set(a1OriginalExerciseItems.map((item) => item.correctIndex));
    expect(positions).toEqual(new Set([0, 1, 2]));
  });

  it("records that the bank is not human-reviewed", () => {
    expect(A1_ORIGINAL_EXERCISE_POLICY_VERSION).toBe("a1-original-gap-bank-v1");
    expect(A1_ORIGINAL_EXERCISE_REVIEW_STATUS).toBe("automated-structural-only");
  });
});
