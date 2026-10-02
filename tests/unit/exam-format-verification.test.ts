import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { examProfiles, examSources } from "../../src/data/exam-profiles";
import {
  buildExamFormatReport,
  renderExamFormatDoc,
  type FormatEvidence,
  type ProfileLike,
  type SourceLike,
} from "../../scripts/verify-official-exam-formats";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "src/config/exam-format-evidence.json");
const REPORT_PATH = path.join(ROOT, "reports/official-exam-formats-audit.json");
const DOC_PATH = path.join(ROOT, "docs/generated/OFFICIAL-EXAM-FORMAT-VERIFICATION.md");

const profiles = Object.values(examProfiles) as unknown as ProfileLike[];
const registry = examSources as unknown as SourceLike[];

async function evidence(): Promise<FormatEvidence> {
  return JSON.parse(await readFile(CONFIG_PATH, "utf8")) as FormatEvidence;
}

async function current() {
  const config = await evidence();
  return { config, report: buildExamFormatReport(config, profiles, registry) };
}

describe("official exam-format verification", () => {
  it("cross-checks every structural number the app teaches against a pinned official snapshot", async () => {
    const { report } = await current();
    expect(report.evidenceIssues).toEqual([]);
    expect(report.mismatches).toEqual([]);
    expect(report.crossCheckedFactCount).toBeGreaterThanOrEqual(21);
    expect(report.profileCount).toBe(2);
    expect(report.ok).toBe(true);
  });

  it("stores each snapshot as a verbatim excerpt whose hash is pinned in the config", async () => {
    const config = await evidence();
    expect(config.sources.length).toBeGreaterThanOrEqual(2);
    for (const source of config.sources) {
      expect(source.evidenceExcerpt.length).toBeGreaterThanOrEqual(400);
      expect(createHash("sha256").update(source.evidenceExcerpt, "utf8").digest("hex")).toBe(source.excerptSha256);
      expect(source.url.startsWith("https://")).toBe(true);
    }
    const tampered = structuredClone(config);
    tampered.sources[0].evidenceExcerpt = `${tampered.sources[0].evidenceExcerpt.slice(0, 500)} (edited)`;
    const tamperedReport = buildExamFormatReport(tampered, profiles, registry);
    expect(tamperedReport.evidenceIssueCount).toBeGreaterThan(0);
    expect(tamperedReport.evidenceIssues.some((issue) => issue.message.includes("sha256"))).toBe(true);
  });

  it("rejects an invented module structure in the app data", async () => {
    const config = await evidence();
    const mutated = structuredClone(profiles);
    const goethe = mutated.find((profile) => profile.id === "goethe-b2");
    if (!goethe) throw new Error("goethe-b2 profile disappeared");
    goethe.modules[0].parts = 6;
    const report = buildExamFormatReport(config, mutated, registry);
    expect(report.mismatchCount).toBe(1);
    expect(report.mismatches[0].factId).toBe("goethe-b2-lesen-parts");
    expect(report.ok).toBe(false);
  });

  it("keeps a verified profile field visible as a gap when no excerpt backs it", async () => {
    const config = await evidence();
    const withoutGap = structuredClone(config);
    withoutGap.openFacts = withoutGap.openFacts.filter((open) => open.id !== "telc-b2-sprachbausteine-minutes");
    const report = buildExamFormatReport(withoutGap, profiles, registry);
    expect(report.uncoveredFieldCount).toBe(1);
    expect(report.mismatches[0].message).toContain("neither a pinned fact nor a declared open gap");
    expect((await current()).report.openFactCount).toBe(2);
  });

  it("requires the app description to state the officially documented listening item count", async () => {
    const config = await evidence();
    const stripped = structuredClone(profiles);
    const goethe = stripped.find((profile) => profile.id === "goethe-b2");
    if (!goethe) throw new Error("goethe-b2 profile disappeared");
    goethe.modules[1].noteAr = "المدة تقريبية.";
    const report = buildExamFormatReport(config, stripped, registry);
    expect(report.mismatches.map((entry) => entry.factId)).toContain("goethe-b2-hoeren-items");
    expect(report.crossCheckedFactCount).toBe(24);
  });

  it("refuses an off-domain or older-than-recorded snapshot", async () => {
    const config = await evidence();
    const offDomain = structuredClone(config);
    offDomain.sources[1].url = "https://example.org/telc-b2";
    expect(buildExamFormatReport(offDomain, profiles, registry).evidenceIssues.length).toBeGreaterThan(0);
    const stale = structuredClone(config);
    stale.sources[0].fetchedAt = "2024-01-01";
    const staleReport = buildExamFormatReport(stale, profiles, registry);
    expect(staleReport.evidenceIssues.some((issue) => issue.message.includes("before the date the registered source cites"))).toBe(true);
  });

  it("never turns a matching snapshot into an official or unchanged-format claim", async () => {
    const { config, report } = await current();
    expect(report.claimsFormatUnchanged).toBe(false);
    expect(report.claimsOfficialApproval).toBe(false);
    expect(config.boundaryAr).toContain("لا تُثبت أن التنسيق الرسمي لم يتغير");
    expect(config.sources.some((source) => source.excerptNoteAr.includes("لم تُعد صياغتها"))).toBe(true);
  });

  it("keeps the generated report and page in sync with the checked-in data", async () => {
    const { config, report } = await current();
    expect(await readFile(REPORT_PATH, "utf8")).toBe(`${JSON.stringify(report, null, 2)}\n`);
    expect(await readFile(DOC_PATH, "utf8")).toBe(renderExamFormatDoc(report, config));
    const doc = await readFile(DOC_PATH, "utf8");
    expect(doc).toContain("never means an exam format is unchanged");
    expect(doc).toContain("telc-b2-point-distribution");
  });
});
