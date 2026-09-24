/**
 * Reconciliation of a pack install that finished in Cache Storage but whose completion
 * reply never reached the page.
 *
 * `public/sw.js` answers `DWNB_OFFLINE_PACK_DOWNLOAD` through `replyTo()`, which swallows
 * a `postMessage` failure on purpose («The page may close while the install continues»).
 * When that happens the learner keeps «بدأ تنزيل الحزمة» on screen although the pack is
 * already promoted, and the only truthful source left is the pack metadata the worker wrote
 * into the live cache. `DWNB_OFFLINE_PACK_STATUS` reads exactly that, so the UI can ask it
 * instead of waiting forever for a message that will not come.
 *
 * The rule is deliberately conservative: it never claims success unless the snapshot
 * describes the pack that was asked for, with the audio choice that was asked for, and
 * differs from what was on screen before the click.
 */

export type PackInstallSnapshot = {
  packId?: string;
  completedAt?: string;
  entryCount?: number;
  routeCount?: number;
  includesAudio?: boolean;
};

export type PackInstallExpectation = {
  packId: string;
  includeAudio: boolean;
  before: PackInstallSnapshot;
};

export type PackStatusSnapshot = PackInstallSnapshot & { installed: boolean };

export function packInstallFinished(
  status: PackStatusSnapshot | null | undefined,
  expectation: PackInstallExpectation,
): boolean {
  if (!status || !status.installed) return false;
  if (status.packId !== expectation.packId) return false;
  if (typeof status.routeCount !== "number" || status.routeCount <= 0) return false;
  if (Boolean(status.includesAudio) !== expectation.includeAudio) return false;
  const before = expectation.before;
  const unchanged =
    before.packId === status.packId &&
    before.completedAt === status.completedAt &&
    before.entryCount === status.entryCount;
  return !unchanged;
}

/**
 * The worker also writes the metadata on a successful install, so a page that reloaded or
 * came back from a hidden state can restore the same truthful summary. `completedAt` is the
 * only field that proves an install finished rather than merely existing, hence its own gate.
 */
export function packStatusHasCompletionEvidence(status: PackStatusSnapshot | null | undefined): boolean {
  return Boolean(status && status.installed && typeof status.completedAt === "string" && status.completedAt.length > 0);
}
