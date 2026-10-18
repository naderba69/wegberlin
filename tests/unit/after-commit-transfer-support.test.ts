// @vitest-environment node
import { describe, it, expect } from "vitest";
import { independentProductionTasks } from "@/data/independent-production-tasks";
import { independentTransferSupport, speakingTransferPhrases, transferSupportForTask, AFTER_COMMIT_TRANSFER_SUPPORT_POLICY } from "@/data/independent-transfer-support";
import { uniqueRecentWritingTasks, uniqueRecentSpeakingTasks, afterCommitSpeakingSupportSeen } from "@/core/evidence/independence";
import { createSupportUsageEvent } from "@/core/evidence/support-usage";
import { analyzeWriting } from "@/core/writing/analyze";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { evidenceTestNow as now, independentSpeaking, independentWriting } from "../helpers/verified-learning-state";
import type { LearningState } from "@/types/learning";

const base: LearningState = { ...defaultState, profile: { name: "Learner", targetExam: "telc-deutsch-b2", dailyMinutes: 60, arabicSupport: "modern-standard-arabic", currentLevel: "A1", priorExperience: "none", createdAt: "2026-10-01T10:00:00Z" } };
const at = (offsetMs: number) => new Date(now.getTime() + offsetMs);

describe("ADR-130 after-commit support for independent transfer tasks", () => {
  it("covers every one of the 96 tasks with five distinct phrases", () => {
    expect(AFTER_COMMIT_TRANSFER_SUPPORT_POLICY).toBe("after-commit-transfer-support-v1");
    expect(new Set(Object.keys(independentTransferSupport))).toEqual(new Set(independentProductionTasks.map((task) => task.sourceLessonId)));
    for (const task of independentProductionTasks) {
      const support = transferSupportForTask(task.sourceLessonId)!;
      expect(support.phrases, task.id).toHaveLength(5);
      expect(new Set(support.phrases).size, task.id).toBe(5);
      for (const phrase of support.phrases) expect(phrase.trim().length, task.id).toBeGreaterThan(3);
    }
  });
  it("gives A1 and A2 a full model inside the task's own word range; B1/B2 models stay honestly deferred", () => {
    for (const task of independentProductionTasks) {
      const support = transferSupportForTask(task.sourceLessonId)!;
      if (task.level === "A1" || task.level === "A2") {
        const [, min, max] = task.writing.promptDe.match(/(\d{2,3})[–-](\d{2,3})\s+Wörter/u)!.map(Number);
        const words = analyzeWriting(support.model!).wordCount;
        expect(words, task.id).toBeGreaterThanOrEqual(min);
        expect(words, task.id).toBeLessThanOrEqual(max);
        expect(support.model, task.id).not.toMatch(/schwein|speck|schinken|salami|wurst/iu);
      } else expect(support.model, task.id).toBeUndefined();
    }
  });
  it("offers speaking phrases only where the speaking scenario parallels the written one", () => {
    const aligned = independentProductionTasks.filter((task) => speakingTransferPhrases(task.id, task.sourceLessonId).length > 0);
    expect(aligned).toHaveLength(32);
    for (const level of ["A1", "A2", "B1", "B2"] as const) expect(aligned.filter((task) => task.level === level)).toHaveLength(8);
  });
  it("closes the cross-round loophole: a model opened after a weak attempt taints a later new round", () => {
    const weak = { ...independentWriting("A1", 0, at(-2 * 3_600_000)), id: "weak", text: "Hallo ich heiße Sami", wordCount: 4 };
    const reveal = createSupportUsageEvent({ kind: "writing-model", surface: "writing-lab", contentId: `${weak.taskId}:writing-model`, afterCommit: true }, at(-3_600_000), "reveal");
    const round = independentWriting("A1", 0, now);
    const fresh = { ...round, id: "fresh", evidenceContext: { ...round.evidenceContext!, draftStartedAt: at(-1_800_000).toISOString() } };
    expect(uniqueRecentWritingTasks({ ...base, writingSubmissions: [weak, fresh] }, "A1", now).size).toBe(1);
    expect(uniqueRecentWritingTasks({ ...base, writingSubmissions: [weak, fresh], supportUsageEvents: [reveal] }, "A1", now).size).toBe(0);
  });
  it("marks a speaking attempt recorded after the phrase list was opened as supported", () => {
    const attempt = independentSpeaking("A1", 0, now);
    const seenBefore = createSupportUsageEvent({ kind: "hint", surface: "speaking-lab", contentId: `${attempt.taskId}:after-attempt-phrases`, afterCommit: true }, at(-3_600_000), "phr-1");
    const seenAfter = { ...seenBefore, id: "phr-2", createdAt: at(60_000).toISOString() };
    expect(uniqueRecentSpeakingTasks({ ...base, speakingAttempts: [attempt] }, "A1", now).size).toBe(1);
    expect(uniqueRecentSpeakingTasks({ ...base, speakingAttempts: [attempt], supportUsageEvents: [seenAfter] }, "A1", now).size).toBe(1);
    expect(afterCommitSpeakingSupportSeen({ supportUsageEvents: [seenBefore] }, attempt)).toBe(true);
    expect(uniqueRecentSpeakingTasks({ ...base, speakingAttempts: [attempt], supportUsageEvents: [seenBefore] }, "A1", now).size).toBe(0);
    expect(learningStateSchema.safeParse({ ...base, supportUsageEvents: [seenBefore] }).success).toBe(true);
  });
});
