import { readdirSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useDeviceDay, useDeviceMinute } from "@/components/device-value";

/**
 * Off-build hydration fence (2026-10-19).
 *
 * The pages are prerendered once and opened days later in other time zones. Three pages computed
 * visible text from the device clock or zone during the first render:
 * - /exams: the format-profile freshness status.
 * - /errors: the eight weekly trend labels.
 * - /settings: the quiet-hours zone, the quiet-active flag and the AI capability rows that follow
 *   source freshness.
 * The built HTML then differed from the first client render, React threw #418 and rebuilt the whole
 * tree on the client. The browser audit never saw it because it ran on the build day in the build
 * zone. The mobile audit pass now runs off-build; these checks pin the fixes and the audit setting.
 */
const read = (path: string) => readFileSync(path, "utf8");

function DayProbe() {
  return createElement("span", null, `day:${useDeviceDay()}|minute:${useDeviceMinute()}`);
}

describe("off-build hydration fence", () => {
  it("device day and minute are empty on the server render", () => {
    expect(renderToString(createElement(DayProbe))).toContain("day:|minute:0");
  });

  it("the exam hub shows the freshness status only after hydration", () => {
    const source = read("src/components/exam-hub.tsx");
    expect(source).toContain("const deviceDay = useDeviceDay();");
    expect(source).toContain('const freshnessStatus = deviceDay ? sourceFreshness.status : "pending";');
    expect(source).not.toMatch(/\{sourceFreshness\.status ===/);
  });

  it("the weekly error trend is built from the device day, not the build clock", () => {
    const source = read("src/components/error-insights-panel.tsx");
    expect(source).not.toContain("buildWeeklyErrorTrend(state)");
    expect(source).toContain("buildWeeklyErrorTrend(state,deviceDay?");
    expect(source).toContain('{deviceDay?week.labelAr:"—"}');
  });

  it("quiet hours read the zone and the clock after hydration", () => {
    const source = read("src/components/planning-preferences-control.tsx");
    expect(source).not.toMatch(/useMemo\(\(\)=>Intl\.DateTimeFormat/);
    expect(source).not.toContain("isQuietHoursActive(state.quietHours,new Date())");
    expect(source).toContain('useDeviceValue(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC","UTC")');
  });

  it("AI capability rows that follow source freshness are built after hydration", () => {
    const source = read("src/components/ai-provider-capability-matrix.tsx");
    expect(source).toContain("const rows = deviceDay ? getAIProviderCapabilityMatrix(");
  });

  it("no client file reads the device zone in an inline memo anywhere on a line", () => {
    const offenders: string[] = [];
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : /\.tsx?$/.test(entry.name) ? [`${dir}/${entry.name}`] : []);
    for (const file of walk("src")) {
      const source = read(file);
      if (!source.includes('"use client"')) continue;
      if (/useMemo\(\s*\(\)\s*=>\s*Intl\.DateTimeFormat\(\)\.resolvedOptions/.test(source)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("the browser audit opens every page off-build on the mobile pass", () => {
    const source = read("scripts/audit-browser-accessibility.mjs");
    expect(source).toContain('const OFF_BUILD_DEVICE = { timezoneId: "Pacific/Kiritimati", clockOffsetDays: 400 };');
    expect(source).toContain('const OFF_BUILD_VIEWPORTS = new Set(["mobile"]);');
    expect(source).toContain("await page.clock.setFixedTime(new Date(Date.now() + OFF_BUILD_DEVICE.clockOffsetDays * 86_400_000));");
  });
});
