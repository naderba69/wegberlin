import{readFileSync}from"node:fs";import{describe,expect,it}from"vitest";

// ADR-049 enforces a 15% reserve below the hard JS chunk limits. The curriculum
// barrel used to be emitted as one shared chunk; when authored explanations grew
// it crossed the safety ceiling (642,417 gzip vs 637,500). The fix is to split the
// data per level in next.config.ts, not to relax the budget. This test pins that
// structural decision so a future edit cannot silently re-merge the curriculum.
const config = readFileSync("next.config.ts", "utf8");

describe("P2 curriculum chunk split (ADR-049 reserve)", () => {
  it("emits one cache group per level with the curriculum path pattern", () => {
    expect(config).toContain('CURRICULUM_LEVELS = ["a1", "a2", "b1", "b2"]');
    expect(config).toContain("cacheGroups[`curriculum-${level}`]");
    expect(config).toContain("name: `curriculum-${level}`");
    for (const level of ["a1", "a2", "b1", "b2"]) {
      expect(config, level).toContain(`"${level}"`);
    }
    expect(config).toContain("lessons-${level}-module");
  });

  it("keeps the groups forced and wired into the webpack hook", () => {
    expect(config).toContain("enforce: true");
    expect(config).toContain('chunks: "all"');
    expect(config).toMatch(/webpack:\s*\(config\)\s*=>\s*splitCurriculumByLevel\(config\)/);
  });

  it("does not soften the JS budget policy itself", () => {
    const script = readFileSync("scripts/audit-js-budgets.mjs", "utf8");
    expect(script).toContain("maxSingleChunkGzipBytes:750000");
    expect(script).toContain("safetyMarginPercent=15");
  });
});
