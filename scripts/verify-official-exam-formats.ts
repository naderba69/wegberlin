import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { examProfiles, examSources } from "../src/data/exam-profiles";

/**
 * Cross-checks the app's exam profiles against pinned official snapshots.
 *
 * Offline mode compares `src/config/exam-format-evidence.json` (manually collected
 * verbatim excerpts plus one regex per structural fact) with the structure the app
 * teaches in `src/data/exam-profiles.ts`. `--live` re-fetches the sources and re-tests
 * the same patterns; a network failure is reported as a failure, never as a pass.
 * Neither mode proves that an official exam format is unchanged: a fetched page only
 * shows what that page said at the recorded time.
 */

const AUDIT_NAME = "dwnb-official-exam-format-verification-v1";
const CONFIG_PATH = "src/config/exam-format-evidence.json";
const REPORT_PATH = "reports/official-exam-formats-audit.json";
const DOC_PATH = "docs/generated/OFFICIAL-EXAM-FORMAT-VERIFICATION.md";

type FactKind =
  | "moduleCount"
  | "moduleParts"
  | "moduleMinutes"
  | "moduleNoteNumber"
  | "moduleMaxPointsAll"
  | "passMark"
  | "informational";

interface FormatFact {
  id: string;
  profileId: string;
  sourceId: string;
  kind: FactKind;
  moduleId?: string;
  value?: number;
  checkPattern: string;
  claimAr: string;
}

interface FormatSource {
  id: string;
  profileId: string;
  organization: string;
  title: string;
  url: string;
  documentVersion: string;
  fetchedAt: string;
  excerptNoteAr: string;
  evidenceExcerpt: string;
  excerptSha256: string;
}

interface OpenFact {
  id: string;
  profileId: string;
  fields: string[];
  whyAr: string;
  nextAr: string;
  corroborationAr?: string;
}

export interface FormatEvidence {
  schemaVersion: string;
  collectedAt: string;
  boundaryAr: string;
  collectionAr: string;
  liveModeAr: string;
  allowedHostSuffixes: Record<string, string[]>;
  sources: FormatSource[];
  facts: FormatFact[];
  openFacts: OpenFact[];
}

interface ProfileModuleLike {
  id: string;
  parts: number;
  minutes: number;
  maxPoints?: number;
  noteAr: string;
}

export interface ProfileLike {
  id: string;
  status: string;
  verifiedAt: string;
  modules: ProfileModuleLike[];
  passingRuleAr: string;
  sourceRefs: string[];
}

export interface SourceLike {
  id: string;
  organization: string;
  url: string;
  accessedAt?: string;
}

interface Check {
  id: string;
  message: string;
}

interface Mismatch {
  factId: string;
  profileId: string;
  message: string;
}

export interface ExamFormatReport {
  name: string;
  ok: boolean;
  profileCount: number;
  sourceCount: number;
  factCount: number;
  crossCheckedFactCount: number;
  informationalFactCount: number;
  evidenceIssueCount: number;
  mismatchCount: number;
  openFactCount: number;
  uncoveredFieldCount: number;
  evidenceCollectedAt: string;
  boundaryAr: string;
  claimsFormatUnchanged: false;
  claimsOfficialApproval: false;
  fingerprint: string;
  evidenceIssues: Check[];
  mismatches: Mismatch[];
  openFacts: OpenFact[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function compile(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "ius");
  } catch {
    return null;
  }
}

function officialHost(url: string, organization: string, allowed: Record<string, string[]>): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const suffixes = allowed[organization];
  if (!suffixes || suffixes.length === 0) return false;
  return suffixes.some((suffix) => parsed.hostname === suffix || parsed.hostname.endsWith(`.${suffix}`));
}

function moduleOf(profile: ProfileLike, moduleId: string | undefined): ProfileModuleLike | null {
  if (!moduleId) return null;
  return profile.modules.find((entry) => entry.id === moduleId) ?? null;
}

function crossCheck(fact: FormatFact, profile: ProfileLike): string | null {
  if (fact.kind === "informational") return null;
  const expected = fact.value;
  if (typeof expected !== "number") return `${fact.kind} requires a numeric value`;
  if (fact.kind === "moduleCount") {
    return profile.modules.length === expected ? null : `module count is ${profile.modules.length}, evidence says ${expected}`;
  }
  if (fact.kind === "moduleMaxPointsAll") {
    const offenders = profile.modules.filter((entry) => entry.maxPoints !== expected).map((entry) => entry.id);
    return offenders.length === 0 ? null : `modules without ${expected} points: ${offenders.join(", ")}`;
  }
  if (fact.kind === "passMark") {
    return profile.passingRuleAr.includes(String(expected)) ? null : `passing rule does not state ${expected}`;
  }
  const target = moduleOf(profile, fact.moduleId);
  if (!target) return `module ${fact.moduleId ?? "?"} is missing from the profile`;
  if (fact.kind === "moduleParts") return target.parts === expected ? null : `${target.id} parts is ${target.parts}, evidence says ${expected}`;
  if (fact.kind === "moduleMinutes") return target.minutes === expected ? null : `${target.id} minutes is ${target.minutes}, evidence says ${expected}`;
  return target.noteAr.includes(String(expected)) ? null : `${target.id} note does not state ${expected}`;
}

export function buildExamFormatReport(
  evidence: FormatEvidence,
  profiles: ProfileLike[],
  sources: SourceLike[],
): ExamFormatReport {
  const issues: Check[] = [];
  const mismatches: Mismatch[] = [];
  const push = (id: string, message: string) => issues.push({ id, message });

  if (evidence.schemaVersion !== "dwnb-official-exam-format-evidence-v1") push("schema", "unexpected evidence schemaVersion");
  if (!ISO_DATE.test(evidence.collectedAt)) push("collectedAt", "evidence collectedAt must be an ISO date");

  const sourceIds = new Set<string>();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const registryById = new Map(sources.map((source) => [source.id, source]));

  for (const source of evidence.sources) {
    if (sourceIds.has(source.id)) push(source.id, "duplicate snapshot source id");
    sourceIds.add(source.id);
    if (!profileById.has(source.profileId)) push(source.id, `references unknown profile ${source.profileId}`);
    if (!registryById.has(source.id)) push(source.id, "snapshot source id is not registered in examSources");
    const registered = registryById.get(source.id);
    if (registered && registered.url !== source.url) push(source.id, "snapshot url differs from the registered source url");
    if (registered && registered.organization !== source.organization) push(source.id, "snapshot organization differs from the registered source");
    if (!ISO_DATE.test(source.fetchedAt)) push(source.id, "fetchedAt must be an ISO date");
    if (registered?.accessedAt && source.fetchedAt < registered.accessedAt) push(source.id, "snapshot was fetched before the date the registered source cites");
    if (source.evidenceExcerpt.length < 400) push(source.id, "excerpt is too short to be reviewable");
    if (sha256(source.evidenceExcerpt) !== source.excerptSha256) push(source.id, "excerpt sha256 does not match the stored hash");
    if (!officialHost(source.url, source.organization, evidence.allowedHostSuffixes)) {
      push(source.id, `url host is not an official ${source.organization} domain`);
    }
  }

  const factIds = new Set<string>();
  const coveredFields = new Set<string>();
  let crossChecked = 0;
  for (const fact of evidence.facts) {
    if (factIds.has(fact.id)) push(fact.id, "duplicate fact id");
    factIds.add(fact.id);
    if (fact.kind === "informational") continue;
    crossChecked += 1;
    const source = evidence.sources.find((entry) => entry.id === fact.sourceId);
    if (!source) {
      push(fact.id, `references unknown snapshot source ${fact.sourceId}`);
      continue;
    }
    const pattern = compile(fact.checkPattern);
    if (!pattern) push(fact.id, "checkPattern is not a valid expression");
    else if (!pattern.test(source.evidenceExcerpt)) push(fact.id, "checkPattern does not match the pinned excerpt");
    const profile = profileById.get(fact.profileId);
    if (!profile) {
      push(fact.id, `references unknown profile ${fact.profileId}`);
      continue;
    }
    const mismatch = crossCheck(fact, profile);
    if (mismatch) mismatches.push({ factId: fact.id, profileId: profile.id, message: mismatch });
    if (fact.kind === "moduleParts" && fact.moduleId) coveredFields.add(`${fact.profileId}.${fact.moduleId}.parts`);
    if (fact.kind === "moduleMinutes" && fact.moduleId) coveredFields.add(`${fact.profileId}.${fact.moduleId}.minutes`);
  }

  for (const profile of profiles) {
    const unresolved = profile.sourceRefs.filter((ref) => !registryById.has(ref));
    if (unresolved.length > 0) push(profile.id, `sourceRefs not present in examSources: ${unresolved.join(", ")}`);
    const moduleIds = profile.modules.map((entry) => entry.id);
    if (new Set(moduleIds).size !== moduleIds.length) push(profile.id, "duplicate module ids in profile");
    for (const entry of profile.modules) {
      if (!(entry.parts > 0)) push(`${profile.id}.${entry.id}`, "module has no parts");
      if (!(entry.minutes > 0)) push(`${profile.id}.${entry.id}`, "module has no minutes");
    }
    if (!ISO_DATE.test(profile.verifiedAt)) push(profile.id, "verifiedAt must be an ISO date");
    if (profile.status !== "verified") continue;
    const declaredOpen = new Set(
      evidence.openFacts
        .filter((open) => open.profileId === profile.id)
        .flatMap((open) =>
          open.fields
            .map((field) => field.replace(/\s*\(.*?\)\s*/g, "").trim())
            .flatMap((field) => [field, `${profile.id}.${field}`]),
        ),
    );
    for (const entry of profile.modules) {
      for (const field of ["parts", "minutes"] as const) {
        const key = `${profile.id}.${entry.id}.${field}`;
        if (!coveredFields.has(key) && !declaredOpen.has(key)) {
          mismatches.push({ factId: profile.id, profileId: profile.id, message: `verified profile field ${key} has neither a pinned fact nor a declared open gap` });
        }
      }
    }
  }

  const fingerprint = sha256(
    JSON.stringify({
      evidence,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        status: profile.status,
        verifiedAt: profile.verifiedAt,
        modules: profile.modules,
        passingRuleAr: profile.passingRuleAr,
        sourceRefs: profile.sourceRefs,
      })),
    }),
  ).slice(0, 12);

  return {
    name: AUDIT_NAME,
    ok: issues.length === 0 && mismatches.length === 0,
    profileCount: profiles.length,
    sourceCount: evidence.sources.length,
    factCount: evidence.facts.length,
    crossCheckedFactCount: crossChecked,
    informationalFactCount: evidence.facts.length - crossChecked,
    evidenceIssueCount: issues.length,
    mismatchCount: mismatches.length,
    openFactCount: evidence.openFacts.length,
    uncoveredFieldCount: mismatches.filter((entry) => entry.message.includes("neither a pinned fact")).length,
    evidenceCollectedAt: evidence.collectedAt,
    boundaryAr: evidence.boundaryAr,
    claimsFormatUnchanged: false,
    claimsOfficialApproval: false,
    fingerprint,
    evidenceIssues: issues,
    mismatches,
    openFacts: evidence.openFacts,
  };
}

export function renderExamFormatDoc(report: ExamFormatReport, evidence: FormatEvidence): string {
  const lines: string[] = [
    "# Official exam-format verification (generated)",
    "",
    "> Generated by `scripts/verify-official-exam-formats.ts`. Regenerate with `npm run exam:formats:verify:write`.",
    "",
    `This page records which structural numbers the app teaches and which pinned official excerpt backs each one. A successful match means "the app agrees with the pinned snapshot, collected on the recorded date" — it never means an exam format is unchanged, and it never makes the app's content official or approved.`,
    "",
    `Snapshot collected: ${report.evidenceCollectedAt}. Fingerprint: \`${report.fingerprint}\`.`,
    "",
    `Profiles: ${report.profileCount}. Snapshot sources: ${report.sourceCount}. Pinned facts: ${report.factCount} (${report.crossCheckedFactCount} cross-checked, ${report.informationalFactCount} informational). Evidence issues: ${report.evidenceIssueCount}. Profile mismatches: ${report.mismatchCount}. Declared open gaps: ${report.openFactCount}.`,
    "",
    "## Sources",
    "",
  ];
  for (const source of evidence.sources) {
    lines.push(
      `- \`${source.id}\` — ${source.organization}, "${source.title}", <${source.url}> (version: ${source.documentVersion}), snapshot fetched ${source.fetchedAt}, excerpt sha256 \`${source.excerptSha256.slice(0, 16)}…\``,
      `  - ${source.excerptNoteAr}`,
    );
  }
  lines.push("", "## Pinned facts", "", "| Fact | Profile | Kind | App value | Official claim | Snapshot |", "| --- | --- | --- | --- | --- | --- |");
  for (const fact of evidence.facts) {
    lines.push(
      `| \`${fact.id}\` | \`${fact.profileId}\` | ${fact.kind}${fact.moduleId ? ` (${fact.moduleId})` : ""} | ${fact.kind === "informational" ? "—" : ` pinned to ${String(fact.value)}` as string} | ${fact.claimAr.replace(/\|/g, "\\|")} | \`${fact.sourceId}\` |`,
    );
  }
  lines.push("", "## Declared gaps (no pinned official excerpt yet)", "");
  if (evidence.openFacts.length === 0) lines.push("- none");
  for (const open of evidence.openFacts) {
    lines.push(`- \`${open.id}\` (${open.profileId}) — ${open.fields.join(", ")}`, `  - why: ${open.whyAr}`);
    if (open.corroborationAr) lines.push(`  - third-party corroboration (not evidence): ${open.corroborationAr}`);
    lines.push(`  - next: ${open.nextAr}`);
  }
  lines.push(
    "",
    "## Limits",
    "",
    `- ${evidence.boundaryAr}`,
    `- ${evidence.collectionAr}`,
    `- ${evidence.liveModeAr}`,
    "",
  );
  return lines.join("\n");
}

export async function loadEvidence(rootDir: string): Promise<FormatEvidence> {
  const raw = await readFile(path.join(rootDir, CONFIG_PATH), "utf8");
  return JSON.parse(raw) as FormatEvidence;
}

function liveCheckable(source: FormatSource, fact: FormatFact): boolean {
  if (source.url.toLowerCase().endsWith(".pdf")) return false;
  return !fact.checkPattern.includes("\\|");
}

async function runLive(evidence: FormatEvidence): Promise<number> {
  let failures = 0;
  let checked = 0;
  let skipped = 0;
  const toProse = (html: string) =>
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ");
  for (const source of evidence.sources) {
    const facts = evidence.facts.filter((entry) => entry.sourceId === source.id);
    const checkable = facts.filter((fact) => liveCheckable(source, fact));
    skipped += facts.length - checkable.length;
    if (checkable.length === 0) {
      console.log(`live skip   ${source.id}: ${facts.length} fact(s) need a PDF/table converter, not a plain HTTP probe`);
      continue;
    }
    let text = "";
    try {
      const response = await fetch(source.url, { headers: { "user-agent": "dwnb-exam-format-verifier" }, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = toProse(await response.text());
    } catch (error) {
      failures += 1;
      console.error(`live fetch failed for ${source.id}: ${(error as Error).message} — that is a failure, not a pass.`);
      continue;
    }
    for (const fact of checkable) {
      const pattern = compile(fact.checkPattern);
      const hit = pattern ? pattern.test(text) : false;
      checked += 1;
      if (!hit) failures += 1;
      console.log(`live ${hit ? "match  " : "MISSING"} ${fact.id}`);
    }
  }
  console.log(
    `Live re-check: ${checked} prose fact(s) tested, ${skipped} not testable without a converter, ${failures} problem(s). A reachable page that still says these sentences does not certify the official format; the pinned snapshot in ${CONFIG_PATH} stays the audited record.`,
  );
  return failures === 0 ? 0 : 1;
}

async function main(): Promise<number> {
  const rootDir = process.cwd();
  const writeMode = process.argv.includes("--write");
  const liveMode = process.argv.includes("--live");
  const evidence = await loadEvidence(rootDir);
  if (liveMode) return runLive(evidence);

  const profiles = Object.values(examProfiles) as unknown as ProfileLike[];
  const sources = examSources as unknown as SourceLike[];
  const report = buildExamFormatReport(evidence, profiles, sources);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const doc = renderExamFormatDoc(report, evidence);

  if (writeMode) {
    await mkdir(path.dirname(path.join(rootDir, REPORT_PATH)), { recursive: true });
    await mkdir(path.dirname(path.join(rootDir, DOC_PATH)), { recursive: true });
    await writeFile(path.join(rootDir, REPORT_PATH), json, "utf8");
    await writeFile(path.join(rootDir, DOC_PATH), doc, "utf8");
  } else {
    const expectedDoc = await readFile(path.join(rootDir, DOC_PATH), "utf8").catch(() => "");
    if (await readFile(path.join(rootDir, REPORT_PATH), "utf8").catch(() => "") !== json) {
      console.error(`${REPORT_PATH} is stale — run: npm run exam:formats:verify:write`);
      return 1;
    }
    if (expectedDoc !== doc) {
      console.error(`${DOC_PATH} is stale — run: npm run exam:formats:verify:write`);
      return 1;
    }
  }

  console.log(
    `Official exam-format verification: ${report.profileCount} profiles, ${report.sourceCount} snapshots, ${report.factCount} pinned facts (${report.crossCheckedFactCount} cross-checked), ${report.evidenceIssueCount} evidence issues, ${report.mismatchCount} mismatches, ${report.openFactCount} declared gaps, fingerprint ${report.fingerprint}.`,
  );
  if (!report.ok) {
    for (const issue of report.evidenceIssues) console.error(`evidence: ${issue.id} — ${issue.message}`);
    for (const mismatch of report.mismatches) console.error(`mismatch: ${mismatch.profileId} / ${mismatch.factId} — ${mismatch.message}`);
    return 1;
  }
  return 0;
}

if (process.argv.includes("--write") || process.argv.includes("--check") || process.argv.includes("--live")) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(`[exam-format-verification] ${(error as Error).message}`);
      process.exit(1);
    },
  );
}
