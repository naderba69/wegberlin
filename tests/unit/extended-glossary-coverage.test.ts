import { describe, expect, it } from "vitest";
import { extendedComprehensionTasks, extendedTaskText } from "@/data/extended-comprehension";

// Glossary headwords in the endurance-lab long inputs must be findable in the lesson text
// they support. Verb forms that are separable (abholen → holt … ab) or irregular (verschieben →
// verschoben) cannot match by plain stem; they are listed explicitly with the reason, so a new
// unmatched headword fails the test instead of silently passing.
const KNOWN_INFLECTED_HEADWORDS: Record<string, string> = {
  abholen: "trennbares Verb: holt … ab",
  verschieben: "Partizip: verschoben",
  bereitstellen: "Partizip: bereitgestellt",
  abgrenzen: "trennbares Verb: grenzt … ab",
};

function headwordStem(headword: string): string {
  const words = headword.trim().split(/\s+/).filter((word) => !["der", "die", "das"].includes(word));
  const lemma = (words[0] ?? "").toLowerCase();
  return lemma.slice(0, Math.max(4, lemma.length - 3));
}

describe("endurance-lab long input glossary coverage", () => {
  it.each(extendedComprehensionTasks.map((task) => [task.id, task] as const))(
    "%s: every glossary headword occurs in its lesson text",
    (_id, task) => {
      const text = extendedTaskText(task).toLowerCase();
      const missing = task.glossary
        .map((entry) => entry.de)
        .filter((headword) => !(headword in KNOWN_INFLECTED_HEADWORDS))
        .filter((headword) => !text.includes(headwordStem(headword)));
      expect(missing).toEqual([]);
    },
  );

  it("keeps the allowlist limited to headwords that really are in the texts by inflected form", () => {
    for (const headword of Object.keys(KNOWN_INFLECTED_HEADWORDS)) {
      const found = extendedComprehensionTasks.some((task) =>
        task.glossary.some((entry) => entry.de === headword),
      );
      expect(found, headword).toBe(true);
    }
  });

  it("has no duplicate glossary headwords within one long input", () => {
    for (const task of extendedComprehensionTasks) {
      const headwords = task.glossary.map((entry) => entry.de);
      expect(new Set(headwords).size, task.id).toBe(headwords.length);
    }
  });
});
