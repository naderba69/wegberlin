import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeAcceptedAnswerHygiene } from "../src/core/content-validation/accepted-answer-hygiene";
import { academicLessonList as lessons } from "../src/data/academic-lessons";

/**
 * accepted-answer-hygiene-v1 audit — reads the published lesson tree, never rewrites it.
 *
 * Run: `npm run accepted:answers` (report) · `npm run accepted:answers:write` (regenerate after content changes).
 * `--check` (the default) fails when the on-disk report is stale OR when any published exercise lists an
 * accepted answer that normalizes onto a form already listed, i.e. an answer the grader can never reward.
 */
const JSON_REPORT = "reports/accepted-answer-hygiene-audit.json";
const MD_REPORT = "docs/generated/ACCEPTED_ANSWER_HYGIENE_REPORT.md";
const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;

const summary = analyzeAcceptedAnswerHygiene(lessons.map((lesson) => ({ id: lesson.id, level: lesson.level, exercises: lesson.exercises })));
const ok = summary.noOpVariantCount === 0;
const withoutHash = { format: "dwnb-accepted-answer-hygiene-audit", generatedAt: "2026-09-23", ok, ...summary };
const contentSha256 = createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex");
const machine = { ...withoutHash, contentSha256 };

const rows = Object.entries(summary.byLevel)
  .map(([level, row]) => `| ${level} | ${row.productiveExercises} | ${row.acceptsExactlyOneString} | ${row.acceptsExactlyOneStringPct}% | ${row.noOpVariantCount} |`)
  .join("\n");

const offenders = summary.offenders.length
  ? summary.offenders.map((row) => `| \`${row.exerciseId}\` | ${row.type} | ${row.noOpVariants.map((v) => `\`${v}\``).join(", ")} |`).join("\n")
  : "| — | — | لا شيء بالقياس الحالي |";

const markdown = `# Accepted-Answer Breadth Hygiene Report

Generated: 2026-09-23  
Version: \`${summary.version}\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`${ok ? "PASS" : "FAIL"}\` — **${summary.productiveExercises}** productive exercises, of which **${summary.acceptsExactlyOneString}** (${summary.acceptsExactlyOneStringPct}%) accept exactly one normalized string and **${summary.broadenedExercises}** accept more than one. Unreachable accepted variants listed in the tree: **${summary.noOpVariantCount}**.

## Policy

${summary.policy}

Breadth is therefore counted on distinct normalized forms. \`normalizeGermanText\` lowercases and strips \`. ! ? , : ; ، „ “ " '\`, so sentence-initial capitalization and a trailing full stop are never a second form.

## By level

| Level | Productive exercises | One accepted string | Share | Unreachable variants |
|---|---:|---:|---:|---:|
${rows}

## Unreachable variants

| Exercise | Type | Variant normalized onto a listed form |
|---|---|---|
${offenders}

## What this report does not claim

- It does not widen acceptance: the grader is untouched and ADR-078 still stands (explicitly listed variants only).
- It does not close P1-398. The ceiling (<=25% single-string productive exercises) is now evaluated honestly and remains far above it; whether the ceiling itself is the right definition is an owner decision recorded in \`P1_AUDIT.md\`.
- A green run here means "no variant is unreachable", not "the exercises accept every correct answer".
`;

if (writeMode) {
  await mkdir(path.join(process.cwd(), "reports"), { recursive: true });
  await mkdir(path.join(process.cwd(), "docs/generated"), { recursive: true });
  await writeFile(path.join(process.cwd(), JSON_REPORT), `${JSON.stringify(machine, null, 2)}\n`, "utf8");
  await writeFile(path.join(process.cwd(), MD_REPORT), markdown, "utf8");
  console.log(`Wrote ${JSON_REPORT} and ${MD_REPORT}.`);
}

if (checkMode) {
  const stale: string[] = [];
  for (const [file, expected] of [
    [JSON_REPORT, `${JSON.stringify(machine, null, 2)}\n`],
    [MD_REPORT, markdown],
  ] as const) {
    const actual = await readFile(path.join(process.cwd(), file), "utf8").catch(() => "");
    if (actual !== expected) stale.push(file);
  }
  if (!ok) throw new Error(`accepted-answer hygiene failed: ${summary.noOpVariantCount} unreachable accepted variants in ${summary.exercisesWithNoOpVariants} exercises`);
  if (stale.length) throw new Error(`accepted-answer hygiene artifacts are not current: ${stale.join(", ")} (run npm run accepted:answers:write)`);
}

console.log(
  `Accepted-answer hygiene: ${summary.productiveExercises} productive · one accepted string ${summary.acceptsExactlyOneString} (${summary.acceptsExactlyOneStringPct}%) · broadened ${summary.broadenedExercises} · unreachable variants ${summary.noOpVariantCount}`,
);
