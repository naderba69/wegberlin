// Exam-format claim guard.
//
// The project states in prose that it never issues official grades, certificates,
// or exam-readiness decisions. Prose is not a gate: a future edit to an exam
// surface could quietly add "Prüfungsergebnis" or "مضمون النجاح" and nothing in
// the build would notice. This audit turns that promise into a check on the
// surfaces themselves, and records how many of them carry an explicit boundary
// sentence so removing one is also a failure.
//
// It measures only this repository. It says nothing about any official exam
// format, and nothing about whether such a format has changed.
//
// Usage:
//   node scripts/verify-official-exam-format-claims.mjs           # report
//   node scripts/verify-official-exam-format-claims.mjs --write    # write artifacts
//   node scripts/verify-official-exam-format-claims.mjs --check    # prebuild gate

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CONFIG_PATH = "src/config/exam-format-claims.json";
const REPORT_PATH = "reports/official-exam-format-claims-audit.json";
const DOC_PATH = "docs/generated/OFFICIAL-EXAM-FORMAT-CLAIMS.md";
const checkMode = process.argv.includes("--check");
const writeMode = process.argv.includes("--write");

const config = JSON.parse(readFileSync(`${ROOT}${CONFIG_PATH}`, "utf8"));
const patterns = config.forbiddenClaimPatterns.map((entry) => ({ ...entry, regex: new RegExp(entry.pattern, "giu") }));
// A denial is not a claim. "لا نتيجة رسمية" is the boundary sentence itself, so a
// match only counts when no negation marker stands in front of it.
const DENIED_EDGE = "[\s\u00bb\u00ab\u201c\u201d\u0027\u0060\u007b]";
const NEGATION_WORD = new RegExp("(^|" + DENIED_EDGE + ")(" + config.negationMarkers.join("|") + ")(" + DENIED_EDGE + "|$)", "iu");
const CLAUSE_BREAK = new RegExp("[\u060c\u061b.\u00b7!?\n\u007b\u007d\u0022\u0027\u0060]", "u");
// Negation is clause-scoped: "ولا تُنشئ شهادة أو نتيجة رسمية" denies the whole
// disjunction, while "نتيجة رسمية" alone does not. Scan back to the previous
// clause break instead of only to the word directly before the match.
function isDenied(text, index) {
  const start = Math.max(0, index - 120);
  let clause = text.slice(start, index);
  for (let at = clause.length - 1; at >= 0; at -= 1) {
    if (CLAUSE_BREAK.test(clause[at])) {
      clause = clause.slice(at + 1);
      break;
    }
  }
  return NEGATION_WORD.test(clause);
}
function scanForbidden(text) {
  const found = [];
  for (const entry of patterns) {
    entry.regex.lastIndex = 0;
    let match;
    while ((match = entry.regex.exec(text))) {
      if (isDenied(text, match.index)) continue;
      found.push({ id: entry.id, whyAr: entry.whyAr, at: match.index });
      break;
    }
  }
  return found;
}
const read = (path) => readFileSync(`${ROOT}${path}`, "utf8");

const surfaces = [];
for (const path of config.surfaces) {
  let text = "";
  try {
    text = read(path);
  } catch {
    surfaces.push({ path, missing: true, hits: [], boundaryFragments: [] });
    continue;
  }
  const hits = scanForbidden(text);
  const boundaryFragments = config.boundaryFragments.filter((fragment) => text.includes(fragment));
  surfaces.push({
    path,
    missing: false,
    bytes: Buffer.byteLength(text, "utf8"),
    hits,
    boundaryFragments,
    hasBoundary: boundaryFragments.length > 0,
  });
}

const missing = surfaces.filter((surface) => surface.missing).map((surface) => surface.path);
const violations = surfaces.flatMap((surface) => surface.hits.map((hit) => ({ path: surface.path, ...hit })));
const withBoundary = surfaces.filter((surface) => surface.hasBoundary).length;
const fingerprint = createHash("sha256")
  .update(surfaces.map((surface) => `${surface.path}:${surface.missing ? "missing" : surface.bytes}`).sort().join("|"))
  .digest("hex")
  .slice(0, 12);
const failures = [
  ...missing.map((path) => `exam surface is missing: ${path}`),
  ...violations.map((violation) => `${violation.path} claims ${violation.id} (${violation.whyAr})`),
];

const audit = {
  format: "dwnb-official-exam-format-claims-audit",
  version: config.policyVersion,
  ok: failures.length === 0,
  auditedAt: "committed-state",
  surfaceCount: surfaces.length,
  boundarySurfaceCount: withBoundary,
  violationCount: violations.length,
  missingSurfaceCount: missing.length,
  sourceFingerprint: fingerprint,
  claimsAboutOfficialFormat: false,
  claimsFormatUnchanged: false,
  issues: failures,
  ruleAr: config.ruleAr,
};

const markdown = [
  "# Official exam-format claim guard",
  "",
  `Policy: \`${audit.version}\` · Result: **${audit.ok ? "PASS" : "FAIL"}**`,
  "",
  "| Measurement | Value |",
  "| --- | --- |",
  `| Exam-facing surfaces audited | ${audit.surfaceCount} |`,
  `| Surfaces carrying an explicit boundary sentence | ${audit.boundarySurfaceCount} |`,
  `| Forbidden claim matches | ${audit.violationCount} |`,
  `| Missing surfaces | ${audit.missingSurfaceCount} |`,
  `| Source fingerprint | \`${audit.sourceFingerprint}\` |`,
  "",
  audit.issues.length ? `Failures:\n\n${audit.issues.map((issue) => `- ${issue}`).join("\n")}` : "No surface claims an official grade, a guaranteed pass, a certificate, a certified level, or a readiness decision.",
  "",
  `**Boundary:** ${audit.ruleAr}`,
  "",
  "## Surfaces",
  "",
  ...surfaces.map((surface) => `- \`${surface.path}\` — ${surface.missing ? "missing" : surface.hasBoundary ? `boundary: ${surface.boundaryFragments.join(", ")}` : "no boundary sentence"}${surface.hits.length ? `; violations: ${surface.hits.map((hit) => hit.id).join(", ")}` : ""}`),
  "",
  "## Policy fields",
  "",
  "- `claimsAboutOfficialFormat: false` — this audit reads repository text, not any exam authority.",
  "- `claimsFormatUnchanged: false` — a green result here never means an exam format is unchanged.",
  "",
].join("\n");

if (writeMode || !checkMode) {
  mkdirSync(`${ROOT}reports`, { recursive: true });
  mkdirSync(dirname(`${ROOT}${DOC_PATH}`), { recursive: true });
  writeFileSync(`${ROOT}${REPORT_PATH}`, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  writeFileSync(`${ROOT}${DOC_PATH}`, markdown, "utf8");
}

if (checkMode) {
  const stale = [];
  for (const [path, expected] of [[REPORT_PATH, `${JSON.stringify(audit, null, 2)}\n`], [DOC_PATH, markdown]]) {
    let actual = "";
    try {
      actual = readFileSync(`${ROOT}${path}`, "utf8");
    } catch {
      stale.push(`${path} (missing)`);
      continue;
    }
    if (actual !== expected) stale.push(`${path} (stale)`);
  }
  if (stale.length) throw new Error(`official exam-format claim audit is not current:\n${stale.join("\n")}\nRun: npm run exam:format-claims:write`);
}

console.log(
  `Official exam-format claim guard: ${audit.surfaceCount} surfaces, ${audit.boundarySurfaceCount} with a boundary sentence, ${audit.violationCount} forbidden claims, ${audit.missingSurfaceCount} missing, fingerprint ${audit.sourceFingerprint}.`,
);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
