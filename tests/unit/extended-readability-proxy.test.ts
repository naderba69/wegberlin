import { describe, expect, it } from "vitest";
import { extendedComprehensionTasks, extendedTaskText } from "@/data/extended-comprehension";

// PROXY, NOT A CEFR JUDGEMENT. Amstad's German reading-ease formula with a vowel-group syllable
// estimate. It measures sentence length and word length only; it cannot judge grammar, vocabulary
// familiarity, or pedagogy. Its job here is to catch an inversion of the level order in averages.

function syllables(word: string): number {
  return Math.max(1, (word.toLowerCase().match(/[aeiouyäöü]+/gu) ?? []).length);
}

function amstadEase(text: string): number {
  const sentences = text.split(/[.!?]+/u).filter((part) => part.trim().length > 0);
  const words = text.match(/[A-Za-zÄÖÜäöüß]+/gu) ?? [];
  const avgSentence = words.length / sentences.length;
  const avgSyllables = words.reduce((sum, word) => sum + syllables(word), 0) / words.length;
  return 180 - avgSentence - 58.5 * avgSyllables;
}

const levels = ["A1", "A2", "B1", "B2"] as const;

function levelAverage(level: (typeof levels)[number]): number {
  const scores = extendedComprehensionTasks
    .filter((task) => task.level === level)
    .map((task) => amstadEase(extendedTaskText(task)));
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

describe("endurance-lab level order (readability proxy, not a CEFR judgement)", () => {
  it("keeps average reading ease strictly easier at A1 than A2 than B1 than B2", () => {
    const averages = levels.map(levelAverage);
    for (let index = 1; index < averages.length; index += 1) {
      expect(averages[index - 1], `${levels[index - 1]} vs ${levels[index]}`).toBeGreaterThan(averages[index]);
    }
  });

  it("keeps every A1 text easier than the average B2 text", () => {
    const b2Average = levelAverage("B2");
    for (const task of extendedComprehensionTasks.filter((item) => item.level === "A1")) {
      expect(amstadEase(extendedTaskText(task)), task.id).toBeGreaterThan(b2Average);
    }
  });
});
