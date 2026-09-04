import { z } from "zod";
import rawRegistry from "@/config/source-verification-registry.json";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sourceRecordSchema = z.object({
  id: z.string().min(3),
  category: z.enum(["exam-format", "ai-free-tier", "hosting-free-tier", "ci-free-tier"]),
  service: z.string().min(2),
  organization: z.string().min(2),
  title: z.string().min(4),
  url: z.string().url().startsWith("https://"),
  lastVerifiedAt: dateOnlySchema,
  maxAgeDays: z.number().int().min(1).max(366),
  verificationMode: z.literal("manual-semantic-review"),
  probePolicy: z.enum(["require-success", "manual-on-403"]).optional().default("require-success"),
  observedState: z.string().min(12),
  claimAr: z.string().min(12),
  staleAction: z.enum(["block-release-and-warn-runtime", "block-remote-ai", "block-release"]),
}).strict();

const sourceRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  policyVersion: z.literal("source-freshness-v1"),
  reviewedAt: dateOnlySchema,
  calendarTimeZone: z.literal("Africa/Tunis"),
  warningBeforeExpiryDays: z.number().int().min(1).max(30),
  records: z.array(sourceRecordSchema).min(1),
}).strict().superRefine((registry, context) => {
  const ids = new Set<string>();
  for (const [index, record] of registry.records.entries()) {
    if (ids.has(record.id)) context.addIssue({ code: "custom", path: ["records", index, "id"], message: `Duplicate source ID ${record.id}` });
    ids.add(record.id);
  }
});

export const sourceVerificationRegistry = sourceRegistrySchema.parse(rawRegistry);
export type SourceVerificationRecord = z.infer<typeof sourceRecordSchema>;
export type SourceFreshnessStatus = "fresh" | "due-soon" | "stale" | "clock-error";

const DAY_MS = 86_400_000;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function currentPolicyDay(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: sourceVerificationRegistry.calendarTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day));
}

function formatDateOnly(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function getSourceFreshness(record: SourceVerificationRecord, now = new Date()) {
  const verifiedDay = parseDateOnly(record.lastVerifiedAt);
  const ageDays = Math.floor((currentPolicyDay(now) - verifiedDay) / DAY_MS);
  const dueAt = formatDateOnly(verifiedDay + record.maxAgeDays * DAY_MS);
  const daysUntilDue = record.maxAgeDays - ageDays;
  let status: SourceFreshnessStatus;
  if (ageDays < 0) status = "clock-error";
  else if (ageDays > record.maxAgeDays) status = "stale";
  else if (daysUntilDue <= sourceVerificationRegistry.warningBeforeExpiryDays) status = "due-soon";
  else status = "fresh";
  return { status, ageDays, daysUntilDue, dueAt };
}

export function getSourceRecord(id: string) {
  const record = sourceVerificationRegistry.records.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Unknown source verification record: ${id}`);
  return record;
}

const severity: Record<SourceFreshnessStatus, number> = { fresh: 0, "due-soon": 1, stale: 2, "clock-error": 3 };

export function summarizeSourceFreshness(ids: readonly string[], now = new Date()) {
  if (ids.length === 0) throw new Error("At least one source ID is required.");
  const records = ids.map(getSourceRecord);
  const checks = records.map((record) => ({ record, ...getSourceFreshness(record, now) }));
  const status = checks.reduce<SourceFreshnessStatus>((worst, check) => severity[check.status] > severity[worst] ? check.status : worst, "fresh");
  const dueAt = checks.map((check) => check.dueAt).sort()[0];
  const oldestVerifiedAt = checks.map((check) => check.record.lastVerifiedAt).sort()[0];
  return { status, dueAt, oldestVerifiedAt, checks };
}
