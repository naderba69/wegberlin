import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildLexicalStrategyAudit } from "../src/core/content-validation/lexical-strategy";

const writeMode=process.argv.includes("--write");
const audit=buildLexicalStrategyAudit();
if(!audit.ok)throw new Error(`Lexical strategy audit failed:\n${audit.issues.join("\n")}`);
const contentSha256=createHash("sha256").update(JSON.stringify(audit)).digest("hex");
const payload={...audit,contentSha256};
const registerRows=Object.entries(audit.registerCounts).map(([key,count])=>`| ${key} | ${count} |`).join("\n");
const levelRows=(["A1","A2","B1","B2"] as const).map((level)=>`| ${level} | ${audit.byLevel.wordFamilies[level]} | ${audit.byLevel.registerExamples[level]} | ${audit.byLevel.arabicLearnerConfusions[level]} |`).join("\n");
const recyclingRows=audit.recyclingRows.map((row)=>`| ${row.moduleId} | ${row.currentCount} | ${row.recycledCount} | ${row.recycledPercent}% | ${row.recycledKinds.join(" + ")||"first-module-baseline"} |`).join("\n");
const report=`# Lexical Strategy and Module Recycling Audit

Generated: ${audit.generatedAt}  
Version: \`${audit.version}\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`PASS\` — ${audit.counts.wordFamilies} authored word families with ${audit.counts.wordFamilyMembers} linked members, ${audit.counts.registerExamples} register examples, ${audit.counts.arabicLearnerConfusions} bounded Arabic-learner confusion records, and ${audit.counts.moduleRecyclingPlans}/30 deterministic module-review plans passed strict validation.

| Level | Word families | Register examples | Confusion records |
|---|---:|---:|---:|
${levelRows}
| **Total** | **${audit.counts.wordFamilies}** | **${audit.counts.registerExamples}** | **${audit.counts.arabicLearnerConfusions}** |

## Register taxonomy

| Register | Examples |
|---|---:|
${registerRows}

Formal, neutral, colloquial, and professional are context functions, not a quality ladder. Every colloquial example carries an explicit relationship/regional boundary. Professional wording is not automatically formal.

## Module recycling

Every module review contains exactly ten unique questions. A1.1 stays at 0% because no prior material exists; later A1 modules use 20%, A2/B1 use 30%, and B2 uses 40%. Every non-baseline plan contains both vocabulary retrieval and grammar retrieval from an earlier module.

| Module | Current | Recycled | Recycled ratio | Recycled kinds |
|---|---:|---:|---:|---|
${recyclingRows}

Boundary: \`${audit.recyclingBoundary}\`. The ratio composes review questions; it is not itself mastery, CEFR evidence, or a reason to mark a lesson complete.

## Arabic-learner boundary

Confusion-source counts: ${Object.entries(audit.confusionSourceCounts).map(([key,value])=>`${key}=${value}`).join(" · ")}. Every record has \`notUniversal: true\`: Arabic transfer and English/French mediation are possible risk sources, never a diagnosis of every Arabic speaker.

Registry boundary: \`${audit.registryBoundary}\`.

## Build gates

- strict Zod rejects unknown fields and incomplete records;
- every internal lesson reference exists at the same level;
- exactly 8 families, 8 register examples, and 6 confusion records exist per level;
- each level owns two examples for each of the four register categories;
- every colloquial example explains regional/relationship variability;
- all 30 module plans own ten unique questions and the exact versioned ratio;
- recycled sources must precede the current module and include vocabulary plus grammar;
- learner-visible registry copy may not leak internal lesson IDs.
`;

await mkdir("reports",{recursive:true});await mkdir("docs/generated",{recursive:true});
const jsonPath="reports/lexical-strategy-audit.json";const reportPath="docs/generated/LEXICAL_STRATEGY_REPORT.md";
if(writeMode){await writeFile(jsonPath,`${JSON.stringify(payload,null,2)}\n`);await writeFile(reportPath,report);console.log(`Wrote lexical strategy audit ${contentSha256.slice(0,12)}.`);}
else{const [storedJson,storedReport]=await Promise.all([readFile(jsonPath,"utf8"),readFile(reportPath,"utf8")]);if(storedJson!==`${JSON.stringify(payload,null,2)}\n`||storedReport!==report)throw new Error("Lexical strategy audit artifacts are stale. Run: npm run lexical:strategy:audit:write");console.log(`Lexical strategy audit verified: ${audit.counts.wordFamilies} families / ${audit.counts.registerExamples} register examples / ${audit.counts.arabicLearnerConfusions} confusions / ${audit.counts.moduleRecyclingPlans} module plans / 0 issues`);}
