// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RELEASE_CANDIDATE_POLICY, createReleaseCandidateAttestation } from "../../scripts/create-release-candidate-attestation.mjs";

const sha = "a".repeat(40);

describe("P2 pre-production release candidate", () => {
  it("creates a commit-bound non-production attestation", () => {
    expect(RELEASE_CANDIDATE_POLICY).toBe("pre-production-release-candidate-v1");
    const candidate = createReleaseCandidateAttestation({ label: "rc-2026.09.12-1", commit: sha, runId: "7", createdAt: "2026-09-12T10:00:00Z" });
    expect(candidate).toMatchObject({
      policyVersion: RELEASE_CANDIDATE_POLICY,
      commit: sha,
      status: "candidate-tests-passed-not-promoted",
      offlineRouteCount: 318,
      evidenceBoundary: "ci-attestation-only-no-production-promotion-without-separate-human-action",
    });
    expect(candidate.packageLockSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects invalid labels and commit identifiers", () => {
    expect(() => createReleaseCandidateAttestation({ label: "latest", commit: sha, runId: "1" })).toThrow("label");
    expect(() => createReleaseCandidateAttestation({ label: "rc-2026.09.12-1", commit: "abc", runId: "1" })).toThrow("full commit");
  });

  it("accepts an explicit label and uploads the generated attestation path", () => {
    const workflow = readFileSync("deployment/release-candidate.yml", "utf8");
    for (const token of [
      "candidate_label:",
      "required: true",
      "RC_LABEL: ${{ inputs.candidate_label }}",
      "RC_OUTPUT: release-candidate-attestation.json",
      "npm run secret:audit:history",
      "npm run check",
      "npm run test:e2e",
      "actions/upload-artifact@v4",
      "path: release-candidate-attestation.json",
      "if-no-files-found: error",
    ]) expect(workflow).toContain(token);
  });

  it("contains no deployment step and requires separate promotion", () => {
    const workflow = readFileSync("deployment/release-candidate.yml", "utf8");
    expect(workflow).toContain("no deployment or production-promotion step");
    expect(workflow).not.toMatch(/vercel deploy|production-deploy|--prod/i);
  });
});
