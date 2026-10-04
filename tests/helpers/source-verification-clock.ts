import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Instants for tests that touch the 30-day source-verification gate, derived from the registry itself.
 *
 * A calendar date written next to `lastVerifiedAt` breaks twice: when its window expires on the real clock
 * (2026-10-04 turned `check` and `e2e` red on an unchanged tree) and again when a maintainer re-verifies the
 * sources, because a pinned date older than the new `lastVerifiedAt` is a `clock-error` that blocks remote AI.
 * Tests that are not about the window itself pin their clock with these helpers, so re-verifying a source never
 * means editing them. The window rules stay covered by explicit boundary assertions in
 * `tests/unit/source-freshness.test.ts`, which also checks these helpers against the production functions.
 *
 * The registry is read as plain JSON on purpose: Playwright's ESM loader cannot import the production module
 * (`src/core/governance/source-freshness.ts` imports the JSON file without an import attribute), and a helper that
 * recomputed expectations through that module would only prove the module agrees with itself.
 */

interface RegistryRecord {
  id: string;
  category: string;
  lastVerifiedAt: string;
  maxAgeDays: number;
}

const registry = JSON.parse(
  readFileSync(path.join(process.cwd(), "src/config/source-verification-registry.json"), "utf8"),
) as { records: RegistryRecord[] };

const DAY_MS = 86_400_000;

/** IDs of the remote-AI records (Gemini + OpenRouter): a stale or clock-invalid one blocks every optional AI request. */
export const aiSourceIds: readonly string[] = registry.records
  .filter((record) => record.category === "ai-free-tier")
  .map((record) => record.id);

/** 12:00 UTC of an ISO calendar day shifted by whole days. That is 13:00 in the registry's Africa/Tunis calendar, far from a day boundary. */
export function atRegistryDay(isoDay: string, offsetDays = 0): Date {
  return new Date(Date.parse(`${isoDay}T12:00:00Z`) + offsetDays * DAY_MS);
}

function isoDay(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

function recordsOf(ids: readonly string[]): RegistryRecord[] {
  if (ids.length === 0) throw new Error("At least one source ID is required.");
  return ids.map((id) => {
    const record = registry.records.find((candidate) => candidate.id === id);
    if (!record) throw new Error(`Unknown source verification record: ${id}`);
    return record;
  });
}

/** Oldest `lastVerifiedAt` among the sources (YYYY-MM-DD): the date the Exam Hub banner prints as the last verification. */
export function oldestVerificationDay(ids: readonly string[]): string {
  return recordsOf(ids).map((record) => record.lastVerifiedAt).sort()[0];
}

/** Newest `lastVerifiedAt` among the sources (YYYY-MM-DD). */
export function newestVerificationDay(ids: readonly string[]): string {
  return recordsOf(ids).map((record) => record.lastVerifiedAt).sort().at(-1)!;
}

/** Earliest due date among the sources (YYYY-MM-DD): `lastVerifiedAt + maxAgeDays` of the record that expires first. */
export function earliestDueDay(ids: readonly string[]): string {
  return recordsOf(ids)
    .map((record) => isoDay(atRegistryDay(record.lastVerifiedAt, record.maxAgeDays)))
    .sort()[0];
}

/** The day after the newest verification: no source has a negative age and every source is well inside its window. */
export function freshAt(ids: readonly string[]): Date {
  return atRegistryDay(newestVerificationDay(ids), 1);
}

/** Two days before the earliest due date: inside the warning period, not yet stale. */
export function dueSoonAt(ids: readonly string[]): Date {
  return atRegistryDay(earliestDueDay(ids), -2);
}

/** Three days after the earliest due date: the group is stale, so remote use must be blocked and a review requested. */
export function staleAt(ids: readonly string[]): Date {
  return atRegistryDay(earliestDueDay(ids), 3);
}
