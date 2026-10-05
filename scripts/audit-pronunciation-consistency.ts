import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildPronunciationConsistencyAudit } from "../src/core/german/pronunciation-consistency";

const writeMode = process.argv.includes("--write");
const audit = buildPronunciationConsistencyAudit();
const payload = { format: "dwnb-pronunciation-consistency-audit", version: "pronunciation-consistency-audit-v1", generatedAt: "2026-10-04", ...audit };
const content = `${JSON.stringify(payload, null, 1)}\n`;
const contentSha256 = createHash("sha256").update(content).digest("hex");
const rows = audit.issues.map((issue) => `| ${issue.lessonId} | ${issue.word} | ${issue.ipa} | ${issue.kind} | ${issue.expectedAr} |`).join("\n");
const report = `# Pronunciation Transcription Consistency Audit

Policy \`${audit.policyVersion}\`. Content SHA-256: \`${contentSha256}\`

Boundary: ${audit.boundary}

| Metric | Value |
| --- | --- |
| Lessons | ${audit.lessons} |
| Pronunciation items | ${audit.items} |
| Word-aligned items checked | ${audit.alignedItems} |
| Items skipped (placeholder ellipsis or token mismatch) | ${audit.skippedItems} |
| Issues | ${audit.issues.length} |

The check applies the German rule to the transcribed text itself: after a front vowel (i, e, ä, ö, ü, ei, eu, äu) \`ch\` is [ç]; after a back vowel (a, o, u, au) it is [x]; after s/l/n/r it is [ç]; a diminutive \`-chen\` is not the \`sch\` digraph. It verifies spelling against the tabulated transcription only and does not listen to any audio.

${audit.issues.length ? `## Issues\n\n| Lesson | Word | Transcription | Kind | Expected |\n| --- | --- | --- | --- | --- |\n${rows}\n` : "## Issues\n\nNone.\n"}
`;
const outputs = [["reports/pronunciation-consistency-audit.json", content], ["docs/generated/PRONUNCIATION_CONSISTENCY_REPORT.md", `${report.trimEnd()}\n`]];
if (writeMode) {
  for (const [file, text] of outputs) { await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true }); await writeFile(file, text); }
  console.log(`Pronunciation consistency written: ${audit.alignedItems}/${audit.items} aligned items checked · ${audit.skippedItems} skipped · ${audit.issues.length} issues`);
} else {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Pronunciation consistency artifacts are not current:\n${stale.join("\n")}\nRun: npm run pronunciation:consistency:write`);
  console.log(`Pronunciation consistency verified: ${audit.alignedItems}/${audit.items} aligned · ${audit.issues.length} issues`);
}
if (!audit.ok) throw new Error(`Pronunciation transcription issues:\n${audit.issues.map((issue) => `${issue.lessonId} ${issue.word} → ${issue.detailAr}`).join("\n")}`);
