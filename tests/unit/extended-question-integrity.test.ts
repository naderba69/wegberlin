import { describe, expect, it } from "vitest";
import { extendedComprehensionTasks, extendedTaskText } from "@/data/extended-comprehension";

// Automated checks only. They verify structure and text-grounding of the endurance-lab questions.
// They do NOT verify pedagogical quality, correctness of German, or the explanations' accuracy;
// that requires independent human review (review status stays "authored-independent-review-pending").

const STOPWORDS = new Set(
  "und die der das den dem des ein eine einen einem einer nicht sind wird ist hat haben mit von zum zur bei nach über auf für oder noch schon nur dass dann".split(" "),
);

function contentWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-zäöüß]{3,}/gu) ?? []).filter((word) => !STOPWORDS.has(word));
}

function appearsInText(word: string, text: string): boolean {
  return text.includes(word) || text.includes(word.slice(0, Math.max(4, word.length - 3)));
}

describe("endurance-lab question integrity (automated, not human review)", () => {
  it.each(extendedComprehensionTasks.map((task) => [task.id, task] as const))(
    "%s: four distinct options, one correct index, no duplicate prompts",
    (_id, task) => {
      const prompts = new Set<string>();
      for (const question of task.questions) {
        expect(question.options, question.id).toHaveLength(4);
        expect(new Set(question.options).size, question.id).toBe(4);
        expect(question.options[question.correctIndex], question.id).toBeTruthy();
        expect(question.explanationAr.trim().length, question.id).toBeGreaterThan(20);
        prompts.add(question.promptDe);
      }
      expect(prompts.size, task.id).toBe(task.questions.length);
    },
  );

  it.each(extendedComprehensionTasks.map((task) => [task.id, task] as const))(
    "%s: each correct answer shares a content word with its lesson text",
    (_id, task) => {
      const text = extendedTaskText(task).toLowerCase();
      for (const question of task.questions) {
        const answer = question.options[question.correctIndex];
        const words = contentWords(answer);
        expect(
          words.some((word) => appearsInText(word, text)),
          `${question.id}: "${answer}" has no content word in the text`,
        ).toBe(true);
      }
    },
  );

  it("does not place the correct answer verbatim among the wrong options", () => {
    for (const task of extendedComprehensionTasks) {
      for (const question of task.questions) {
        const answer = question.options[question.correctIndex];
        const wrongs = question.options.filter((_, index) => index !== question.correctIndex);
        expect(wrongs.includes(answer), question.id).toBe(false);
      }
    }
  });
});
