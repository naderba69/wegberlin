// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { errorRepairPhase, recordFailedErrorRepair, scheduleRetryAfterFailure } from "@/core/errors/remediation";
import type { ErrorRecord } from "@/types/learning";

const base: ErrorRecord = {
  id: "lesson-error:a1-01:e1",
  type: "word-order",
  wrong: "weil ich bin krank",
  correct: "weil ich krank bin",
  explanationAr: "بعد weil يأتي الفعل المصرف في النهاية.",
  occurrences: 2,
  lastSeenAt: "2026-10-04T09:00:00.000Z",
  repairCount: 0,
  resolved: false,
};

describe("error relearn ladder", () => {
  it("brings a failed repair back inside ten minutes instead of leaving it to the normal queue", () => {
    const now = new Date("2026-10-04T09:00:00.000Z");
    const failed = scheduleRetryAfterFailure(recordFailedErrorRepair(base, now), now);
    expect(failed.failedRepairCount).toBe(1);
    expect(failed.nextReviewAt).toBe("2026-10-04T09:10:00.000Z");
    expect(errorRepairPhase(failed, now)).toBe("retry-soon");
    expect(errorRepairPhase(failed, new Date("2026-10-04T09:11:00.000Z"))).toBe("due");
  });

  it("widens the retry to one day and then three days as failures repeat", () => {
    const first = new Date("2026-10-04T09:00:00.000Z");
    const once = scheduleRetryAfterFailure(recordFailedErrorRepair(base, first), first);
    const twice = scheduleRetryAfterFailure(recordFailedErrorRepair(once, first), first);
    const thrice = scheduleRetryAfterFailure(recordFailedErrorRepair(twice, first), first);
    expect(once.nextReviewAt).toBe("2026-10-04T09:10:00.000Z");
    expect(twice.nextReviewAt).toBe("2026-10-05T09:00:00.000Z");
    expect(thrice.nextReviewAt).toBe("2026-10-07T09:00:00.000Z");
    expect(thrice.failedRepairCount).toBe(3);
  });

  it("never calls a failed repair 'waiting for confirmation'", () => {
    const now = new Date("2026-10-04T09:00:00.000Z");
    const failed = scheduleRetryAfterFailure(recordFailedErrorRepair(base, now), now);
    expect(errorRepairPhase(failed, now)).not.toBe("waiting");
    const succeeded = { ...base, repairCount: 1, lastRepairedAt: now.toISOString(), nextReviewAt: "2026-10-05T00:00:00.000Z" };
    expect(errorRepairPhase(succeeded, now)).toBe("waiting");
  });

  it("keeps the original repair contract untouched and additive", () => {
    const failed = recordFailedErrorRepair(base, new Date("2026-10-04T09:00:00.000Z"));
    expect(failed.nextReviewAt).toBeUndefined();
    expect(failed.repairCount).toBe(0);
    expect(failed.failedRepairCount).toBe(1);
    const notebook = readFileSync("src/components/error-notebook.tsx", "utf8");
    expect(notebook).toContain("scheduleRetryAfterFailure(recordFailedErrorRepair(item,now),now)");
    expect(notebook).toContain('data-relearn-ladder="spaced-mastery-two-spaced-successes-v1"');
  });
});
