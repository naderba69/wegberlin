import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { WEEKLY_WRITING_BOUNDARY, WEEKLY_WRITING_POLICY, WEEKLY_WRITING_WINDOW_WEEKS, weeklyWritingCycle } from "../src/core/writing/weekly-cycle";
import { defaultState } from "../src/core/portability/db";

/**
 * بوابة دورة الكتابة الأسبوعية (P1-14): تقيس الإيقاع من السجلّ المحلي وتفتح الطريق لملف
 * `docs/generated/WEEKLY_WRITING_CYCLE.md`. على حالة البداية يكون الرقم **صفرًا صريحًا**،
 * ولا تجمّل البوابة ذلك: الدورة إلزامية في التخطيط، وغيابها يُعرض كما هو.
 */
const writeMode = process.argv.includes("--write");
const now = new Date("2026-10-04T00:00:00.000Z");
const cycle = weeklyWritingCycle(defaultState, now, WEEKLY_WRITING_WINDOW_WEEKS);
const payload = {
  format: "dwnb-weekly-writing-cycle",
  version: "weekly-writing-cycle-audit-v1",
  generatedAt: "2026-10-04",
  ok: cycle.policyVersion === WEEKLY_WRITING_POLICY && cycle.weeks.length === WEEKLY_WRITING_WINDOW_WEEKS,
  policyVersion: cycle.policyVersion,
  boundary: cycle.boundary,
  weeksMeasured: cycle.weeksMeasured,
  completedWeeks: cycle.completedWeeks,
  currentStatus: cycle.current.status,
  currentWeekStart: cycle.current.weekStart,
};
const content = `${JSON.stringify(payload, null, 1)}\n`;
const contentSha256 = createHash("sha256").update(content).digest("hex");
const rows = cycle.weeks.map((week) => `| ${week.weekStart} → ${week.weekEnd} | ${week.status} | ${week.drafts} | ${week.submitted} | ${week.revised} |`).join("\n");
const report = `# Weekly Writing Cycle Audit

Policy \`${payload.policyVersion}\` · Content SHA-256: \`${contentSha256}\`

Boundary: ${WEEKLY_WRITING_BOUNDARY}

Measured on the shipped empty state: **${cycle.completedWeeks}/${cycle.weeksMeasured}** weeks cycle-complete,
current week status \`${cycle.current.status}\`. The cycle is draft → feedback → **mandatory rewrite** → diff;
a submission without a changed rewrite never completes the week, and nothing here is a writing grade.

| Week | Status | Drafts | Submitted | Revised |
|---|---|---:|---:|---:|
${rows}

${cycle.completedWeeks === 0 ? "The zero is honest: on a fresh profile no rewrite exists yet, and the plan's Wednesday writing slot plus this gate are what make the cycle visible instead of optional.\n" : ""}
`;
const outputs: Array<[string, string]> = [["reports/weekly-writing-cycle.json", content], ["docs/generated/WEEKLY_WRITING_CYCLE.md", `${report.trimEnd()}\n`]];
if (writeMode) {
  for (const [file, text] of outputs) { await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true }); await writeFile(file, text); }
  console.log(`Weekly writing cycle written: ${cycle.completedWeeks}/${cycle.weeksMeasured} complete · current ${cycle.current.status}`);
} else {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Weekly writing cycle artifacts are not current:\n${stale.join("\n")}\nRun: npm run writing:cycle:write`);
  console.log(`Weekly writing cycle verified: ${cycle.completedWeeks}/${cycle.weeksMeasured} complete · current ${cycle.current.status}`);
}
