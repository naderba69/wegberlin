// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ERROR_RELEARN_LADDER_MINUTES,
  FEEDBACK_GUIDANCE,
  FEEDBACK_TAXONOMY_POLICY,
  SPACED_MASTERY_POLICY,
  SPACED_MASTERY_MIN_GAP_HOURS,
  feedbackGuidanceFor,
  feedbackKindForExercise,
  masterySpacingDecision,
  relearnStepAt,
  validateTransferSentence,
} from "@/core/errors/feedback-guidance";
import type { ErrorRecord } from "@/types/learning";

/**
 * حزمة الأسبوع 1+2 من تدقيق الطريقة (2026-10-04):
 * نوع الخطأ يظهر عند التغذية الراجعة، وخطوة التعميم إلزامية، والإتقان لا يُمنح
 * إلا بنجاحين متباعدين 72 ساعة.
 */
const ERROR_KINDS: ErrorRecord["type"][] = ["article", "case", "word-order", "vocabulary", "spelling", "tense", "grammar"];

describe("feedback error taxonomy", () => {
  it("labels every stored error kind in Arabic with a generalisable rule and a transfer step", () => {
    for (const kind of ERROR_KINDS) {
      const guidance = feedbackGuidanceFor(kind);
      expect(guidance.labelAr.length, kind).toBeGreaterThan(3);
      expect(guidance.rulePromptAr, kind).toContain("قاعدة عامة");
      expect(guidance.transferPromptAr, kind).toContain("جملة جديدة");
      expect(guidance.contrastAr.length, kind).toBeGreaterThan(5);
    }
    expect(Object.keys(FEEDBACK_GUIDANCE).sort()).toEqual([...ERROR_KINDS].sort());
  });

  it("shows the Arabic label at feedback time instead of the raw storage token", () => {
    const card = readFileSync("src/components/exercise-card.tsx", "utf8");
    const notebook = readFileSync("src/components/error-notebook.tsx", "utf8");
    expect(card).toContain("data-feedback-taxonomy={FEEDBACK_TAXONOMY_POLICY}");
    expect(card).toContain("نوع الخطأ: {feedbackGuidanceFor(feedbackKindForExercise(exercise)).labelAr}");
    expect(notebook).toContain("data-error-kind-ar={error.type}>{feedbackGuidanceFor(error.type).labelAr}");
    expect(notebook).not.toContain("خطة><AlertTriangle size={16}/>{error.type}<b");
  });

  it("maps exercise types to the same kinds the error records use", () => {
    expect(feedbackKindForExercise({ id: "x", type: "word-ordering", promptAr: "", words: [], acceptedAnswers: [], explanationAr: "" })).toBe("word-order");
    expect(feedbackKindForExercise({ id: "y", type: "error-correction", promptAr: "", sentence: "", acceptedAnswers: [], explanationAr: "" })).toBe("grammar");
    expect(feedbackKindForExercise({ id: "z", type: "fill-blank", promptAr: "", template: "", acceptedAnswers: [], explanationAr: "" })).toBe("vocabulary");
  });

  it("requires a real new sentence before the error can be closed", () => {
    expect(validateTransferSentence("weil", "weil ich krank bin")).toMatchObject({ accepted: false });
    expect(validateTransferSentence("weil ich heute krank bin", "weil ich krank bin").accepted).toBe(true);
    expect(validateTransferSentence("ماذا", "weil ich krank bin").accepted).toBe(false);
    const notebook = readFileSync("src/components/error-notebook.tsx", "utf8");
    expect(notebook).toContain("data-error-transfer={error.id}");
    expect(notebook).toContain("!due && !validateTransferSentence(transfers[error.id] ?? \"\", error.correct).accepted");
  });

  it("refuses in-session mastery and grants it only after two successes 72 hours apart", () => {
    const sameSession = masterySpacingDecision(["2026-10-04T09:00:00.000Z", "2026-10-04T09:30:00.000Z"], new Date("2026-10-04T10:00:00.000Z"));
    expect(sameSession.granted).toBe(false);
    expect(sameSession.nextEligibleAt).toBe("2026-10-07T09:30:00.000Z");
    const spaced = masterySpacingDecision(["2026-10-01T09:00:00.000Z", "2026-10-05T09:00:00.000Z"], new Date("2026-10-05T09:01:00.000Z"));
    expect(spaced.granted).toBe(true);
    expect(spaced.spacedSuccessCount).toBe(1);
    expect(SPACED_MASTERY_POLICY).toBe("spaced-mastery-two-spaced-successes-v1");
    expect(FEEDBACK_TAXONOMY_POLICY).toBe("feedback-error-taxonomy-v1");
    expect(SPACED_MASTERY_MIN_GAP_HOURS).toBe(72);
  });

  it("returns the learner through 10 minutes, one day and three days after repeated failure", () => {
    const from = new Date("2026-10-04T08:00:00.000Z");
    expect(relearnStepAt(1, from)).toMatchObject({ minutes: 10, at: "2026-10-04T08:10:00.000Z" });
    expect(relearnStepAt(2, from)).toMatchObject({ minutes: 1440, at: "2026-10-05T08:00:00.000Z" });
    expect(relearnStepAt(3, from)).toMatchObject({ minutes: 4320, at: "2026-10-07T08:00:00.000Z" });
    expect(relearnStepAt(9, from).minutes).toBe(ERROR_RELEARN_LADDER_MINUTES.at(-1));
  });
});
