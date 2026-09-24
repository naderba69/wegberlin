// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import type { ExternalEvaluatorEvidence, LearningState } from "@/types/learning";

const row: ExternalEvaluatorEvidence = {
  id: "external-evaluator:sub-1:1",
  policyVersion: "external-evaluator-packet-v1",
  submissionId: "sub-1",
  taskId: "b2-writing-04",
  level: "B2",
  reviewerLabel: "أ. هدى",
  receivedAt: "2026-09-14T11:00:00.000Z",
  notes: [{ excerpt: "den Schlüssel vergessen hatte", comment: "طبيعية، لا تغيير مطلوب." }],
  unconfirmableExcerpts: [],
  refusedPhrases: [],
  boundary: {
    source: "external-human-arranged-by-learner",
    appVerifiedTheFeedback: false,
    canCertifyExamReadiness: false,
    canCountTowardLevelGate: false,
    officialResultClaimedAr: "لا يمنح هذا التطبيق قرار امتحان ولا يُثبِت جاهزيته.",
  },
  createdAt: "2026-09-14T11:05:00.000Z",
};

describe("imported human review is persisted as advice, never as a verdict", () => {
  it("leaves every record written before the bridge valid", () => {
    expect(defaultState.externalEvaluatorNotes).toBeUndefined();
    expect(learningStateSchema.parse({ ...defaultState }).externalEvaluatorNotes).toBeUndefined();
  });

  it("round-trips a stored reply through the export schema", () => {
    const state = { ...defaultState, externalEvaluatorNotes: [row] } as LearningState;
    const parsed = learningStateSchema.parse(state);
    expect(parsed.externalEvaluatorNotes?.[0]?.reviewerLabel).toBe("أ. هدى");
    expect(parsed.externalEvaluatorNotes?.[0]?.notes[0]?.excerpt).toBe("den Schlüssel vergessen hatte");
    expect(parsed.externalEvaluatorNotes?.[0]?.boundary.canCountTowardLevelGate).toBe(false);
  });

  it("cannot store a claim that the app verified it or certified readiness", () => {
    for (const patch of [
      { appVerifiedTheFeedback: true },
      { canCertifyExamReadiness: true },
      { canCountTowardLevelGate: true },
      { source: "app-internal-grading" },
    ]) {
      const tampered = { ...defaultState, externalEvaluatorNotes: [{ ...row, boundary: { ...row.boundary, ...patch } }] } as unknown as LearningState;
      expect(() => learningStateSchema.parse(tampered)).toThrow();
    }
  });

  it("refuses an empty reviewer name and notes beyond the bounded size", () => {
    expect(() => learningStateSchema.parse({ ...defaultState, externalEvaluatorNotes: [{ ...row, reviewerLabel: "" }] })).toThrow();
    expect(() =>
      learningStateSchema.parse({
        ...defaultState,
        externalEvaluatorNotes: [{ ...row, notes: Array.from({ length: 25 }, (_, index) => ({ excerpt: "", comment: `ملاحظة ${index}` })) }],
      }),
    ).toThrow();
  });

  it("is read by exactly the surfaces that display or merge it, never by a gate", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(`src/${dir}`, { withFileTypes: true })) {
        const path = `src/${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path.slice(4));
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
      }
    };
    walk("");
    const readers = files.filter((path) => readFileSync(path, "utf8").includes("externalEvaluatorNotes"));
    for (const path of readers) {
      expect(path, path).toMatch(/types\/learning\.ts|core\/portability\/schema\.ts|core\/portability\/merge\.ts|components\/external-evaluator-bridge\.tsx|components\/writing-lab\.tsx/);
    }
    // types + schema + the merge layer + the view that writes and lists them.
    expect(readers.length).toBeGreaterThanOrEqual(3);
    expect(readers.some((path) => path.includes("level"))).toBe(false);
  });
});
