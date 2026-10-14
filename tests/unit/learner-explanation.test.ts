import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FEEDBACK_DISCLOSURE_MARKER } from "@/core/lesson/disclosure-marker";
import { learnerExplanation } from "@/core/lesson/learner-explanation";

const COMPONENTS_DIR = join(process.cwd(), "src", "components");

describe("learnerExplanation", () => {
  it("removes the internal disclosure marker from the learner text", () => {
    const stored = `يشرح الجملة الفعلية. ${FEEDBACK_DISCLOSURE_MARKER}`;
    expect(learnerExplanation(stored)).toBe("يشرح الجملة الفعلية.");
    expect(learnerExplanation(stored)).not.toContain(FEEDBACK_DISCLOSURE_MARKER);
  });

  it("returns empty text for missing input and leaves clean text unchanged", () => {
    expect(learnerExplanation(undefined)).toBe("");
    expect(learnerExplanation(null)).toBe("");
    expect(learnerExplanation("شرح نظيف.")).toBe("شرح نظيف.");
  });

  it("is the only way components render explanationAr", () => {
    const offenders: string[] = [];
    for (const file of readdirSync(COMPONENTS_DIR)) {
      if (!file.endsWith(".tsx")) continue;
      const source = readFileSync(join(COMPONENTS_DIR, file), "utf8");
      for (const match of source.matchAll(/\{([^{}]*explanationAr)\}/g)) {
        if (!match[1].startsWith("learnerExplanation(")) offenders.push(`${file}: {${match[1]}}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
