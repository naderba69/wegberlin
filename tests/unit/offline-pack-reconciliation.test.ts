import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packInstallFinished, packStatusHasCompletionEvidence } from "@/core/offline/pack-reconciliation";

/**
 * `public/sw.js` replies to a pack download through a `MessagePort` and swallows a failed
 * postMessage on purpose, because the page may close while the install continues. The card
 * therefore has to reconcile from the metadata the worker wrote into the live cache, but it
 * may only ever claim success when the status snapshot really describes what was requested.
 */
const expectation = {
  packId: "full",
  includeAudio: true,
  before: { packId: "a1", completedAt: "2026-09-19T09:00:00.000Z", entryCount: 135, routeCount: 58 },
};

describe("offline pack install reconciliation", () => {
  it("settles a finished install that the worker never reported", () => {
    expect(
      packInstallFinished(
        { installed: true, packId: "full", includesAudio: true, routeCount: 318, entryCount: 699, completedAt: "2026-09-19T10:00:00.000Z" },
        expectation,
      ),
    ).toBe(true);
  });

  it("refuses to reconcile while the cache still holds the previous pack", () => {
    expect(
      packInstallFinished(
        { installed: true, packId: "a1", includesAudio: false, routeCount: 58, entryCount: 135, completedAt: expectation.before.completedAt },
        expectation,
      ),
    ).toBe(false);
  });

  it("refuses to reconcile when the audio choice does not match the request", () => {
    expect(
      packInstallFinished(
        { installed: true, packId: "full", includesAudio: false, routeCount: 318, entryCount: 699, completedAt: "2026-09-19T10:00:00.000Z" },
        expectation,
      ),
    ).toBe(false);
  });

  it("refuses to reconcile an empty or missing snapshot", () => {
    expect(packInstallFinished(null, expectation)).toBe(false);
    expect(packInstallFinished(undefined, expectation)).toBe(false);
    expect(packInstallFinished({ installed: false }, expectation)).toBe(false);
  });

  it("refuses to reconcile a snapshot without a usable route count", () => {
    expect(
      packInstallFinished({ installed: true, packId: "full", includesAudio: true, routeCount: 0, entryCount: 4, completedAt: "x" }, expectation),
    ).toBe(false);
    expect(
      packInstallFinished({ installed: true, packId: "full", includesAudio: true, entryCount: 699, completedAt: "x" }, expectation),
    ).toBe(false);
  });

  it("does not treat an untouched identical pack as a completed download", () => {
    const sameBefore = { packId: "full", completedAt: "2026-09-19T10:00:00.000Z", entryCount: 699, routeCount: 318 };
    expect(
      packInstallFinished(
        { installed: true, packId: "full", includesAudio: true, routeCount: 318, entryCount: 699, completedAt: sameBefore.completedAt },
        { packId: "full", includeAudio: true, before: sameBefore },
      ),
    ).toBe(false);
  });

  it("requires completion evidence before restoring an installed summary", () => {
    expect(packStatusHasCompletionEvidence({ installed: true, completedAt: "2026-09-19T10:00:00.000Z" })).toBe(true);
    expect(packStatusHasCompletionEvidence({ installed: true })).toBe(false);
    expect(packStatusHasCompletionEvidence({ installed: true, completedAt: "" })).toBe(false);
    expect(packStatusHasCompletionEvidence({ installed: false, completedAt: "2026-09-19T10:00:00.000Z" })).toBe(false);
  });

  it("wires the reconciliation into the busy download and never overwrites a settled install", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/offline-pack-control.tsx"), "utf8");
    expect(source).toContain('if (!busy) return;');
    expect(source).toContain('window.setInterval(');
    expect(source).toContain('"DWNB_OFFLINE_PACK_STATUS"');
    expect(source).toContain('packInstallFinished(status, watch.expectation)');
    expect(source).toContain('if (!watch || watch.applied) return;');
    expect(source).toContain('if (watch.applied) return;');
    expect(source).toContain('if (!watch.applied) {');
    expect(source).toContain('window.clearInterval(timer)');
    expect(source).toContain('installWatch.current = null;');
  });
});
