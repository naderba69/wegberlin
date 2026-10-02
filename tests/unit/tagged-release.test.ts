// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RELEASE_CHANGELOG_POLICY, renderChangelog } from "../../scripts/generate-release-changelog.mjs";

describe("P2 tagged release changelog rollback", () => {
  it("renders immutable release notes with previous tag", () => {
    const changelog = renderChangelog("v1.2.3", "v1.2.2", ["Add guided mode"]);
    expect(RELEASE_CHANGELOG_POLICY).toBe("tagged-release-changelog-rollback-v1");
    expect(changelog).toContain("Previous: v1.2.2");
    expect(changelog).toContain("Add guided mode");
    expect(changelog).toContain("never rewrite or force-push");
  });

  it("rejects non-semantic tags", () => {
    expect(() => renderChangelog("latest", "", [])).toThrow("semantic");
  });

  it("passes the pushed and previous tags plus output path to changelog generation", () => {
    const workflow = readFileSync("deployment/release.yml", "utf8");
    for (const token of [
      "npm run secret:audit:history",
      "npm run check",
      "RELEASE_TAG: ${{ github.ref_name }}",
      "PREVIOUS_TAG: ${{ steps.previous.outputs.tag }}",
      "CHANGELOG_OUTPUT: release-changelog.md",
      "softprops/action-gh-release@v2",
      "body_path: release-changelog.md",
    ]) expect(workflow).toContain(token);
  });

  it("documents host and Offline rollback without rewriting learner data", () => {
    const documentation = readFileSync("docs/RELEASE_ROLLBACK.md", "utf8");
    for (const token of ["previous immutable tag", "Deployment Smoke", "Never move/delete", "DWNB", "atomic pack rollback"]) expect(documentation).toContain(token);
  });
});
