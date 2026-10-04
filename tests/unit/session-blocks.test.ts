// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SESSION_BLOCK_BOUNDARY, SESSION_BLOCKS_POLICY, SESSION_BREAK_MINUTES, blockForMinute, buildSessionBlocks } from "@/core/coach/session-blocks";

describe("session attention engineering", () => {
  it("splits the chosen daily time into four blocks with three-minute breaks", () => {
    const plan = buildSessionBlocks(45);
    expect(plan.blocks).toHaveLength(4);
    expect(plan.breakTotalMinutes).toBe(3 * SESSION_BREAK_MINUTES);
    expect(plan.focusMinutes + plan.breakTotalMinutes).toBe(45);
    expect(plan.blocks.map((block) => block.minutes).reduce((sum, value) => sum + value, 0)).toBe(plan.focusMinutes);
    expect(plan.blocks.at(-1)!.breakAfterMinutes).toBeUndefined();
    expect(plan.policyVersion).toBe(SESSION_BLOCKS_POLICY);
    expect(plan.boundary).toBe(SESSION_BLOCK_BOUNDARY);
  });

  it("keeps a short day short instead of pretending it is a long session", () => {
    const short = buildSessionBlocks(10);
    expect(short.noteAr).toContain("كتلتان قصيرتان بلا راحة");
    expect(short.focusMinutes).toBeGreaterThanOrEqual(20);
    const long = buildSessionBlocks(90);
    expect(long.blocks.map((block) => block.minutes).reduce((sum, value) => sum + value, 0) + long.breakTotalMinutes).toBe(90);
    expect(long.noteAr).toContain("الراحة جزء من الخطة");
  });

  it("tells the learner which block they are in, including breaks", () => {
    const plan = buildSessionBlocks(45);
    const first = blockForMinute(plan, 5);
    expect(first.block.index).toBe(1);
    expect(first.inBreak).toBe(false);
    const breakAt = plan.blocks[0].minutes + 1;
    const duringBreak = blockForMinute(plan, breakAt);
    expect(duringBreak.inBreak).toBe(true);
    expect(duringBreak.block.index).toBe(1);
    const last = blockForMinute(plan, plan.dailyMinutes - 1);
    expect(last.block.index).toBe(4);
  });

  it("is shown on the coach dashboard with the policy attribute", () => {
    const strip = readFileSync("src/components/session-blocks-strip.tsx", "utf8");
    const dashboard = readFileSync("src/components/coach-dashboard.tsx", "utf8");
    expect(strip).toContain("data-session-blocks={SESSION_BLOCKS_POLICY}");
    expect(strip).toContain("blockForMinute");
    expect(dashboard).toContain("<SessionBlocksStrip />");
  });
});
