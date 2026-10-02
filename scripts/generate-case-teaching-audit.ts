import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildMeaningFirstCaseAudit } from "../src/core/content-validation/meaning-first-case";

const writeMode=process.argv.includes("--write");
const checkMode=process.argv.includes("--check")||!writeMode;
const audit=buildMeaningFirstCaseAudit();
if(!audit.ok)throw new Error(`Meaning-first case audit failed:\n${audit.issues.join("\n")}`);
const withoutHash={format:"dwnb-meaning-first-case-audit",generatedAt:"2026-09-05",...audit};
const contentSha256=createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex");
const machine={...withoutHash,contentSha256};
const rows=audit.contracts.map((item)=>`| \`${item.lessonId}\` | ${item.titleDe} | ${item.semanticQuestionAr} | ${item.roleChoicesAr.length} | ${item.governedCases.join(", ")} | ${item.theoryIds.length} | ${item.controlledExerciseIds.length} | ${item.assessmentIds.length} |`).join("\n");
const report=`# Meaning → Role → Case Form Coverage Report

Generated: 2026-09-05  
Version: \`${audit.version}\`  
Policy: \`meaning-first-case-v1\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`PASS\` — **${audit.contractCount} case-teaching contracts in ${audit.lessonCount} lessons** render the fixed sequence **Bedeutung → Rolle → Form** before controlled practice. They map **${audit.theoryReferenceCount} theory blocks**, **${audit.controlledReferenceCount} controlled exercises**, and **${audit.assessmentReferenceCount} Mini-Test items**.

Explicit case-name discovery found ${audit.discoveredSignals.theory} theory, ${audit.discoveredSignals.controlled} controlled, and ${audit.discoveredSignals.assessment} assessment signals; every discovered ID is owned by one lesson contract.

| Level | Contracts |
|---|---:|
| A1 | ${audit.byLevel.A1} |
| A2 | ${audit.byLevel.A2} |
| B1 | ${audit.byLevel.B1} |
| B2 | ${audit.byLevel.B2} |
| **Total** | **${audit.contractCount}** |

## Required order

1. **Bedeutung verstehen:** ask what happens in the situation without naming a case or ending.
2. **Rolle bestimmen:** choose actor, affected item, recipient, location/direction, source, topic, instrument, or reference-noun role.
3. **Form prüfen:** only then apply Nominativ/Akkusativ/Dativ/Genitiv and article/pronoun/adjective form.

The build fails if a contract starts with case/form terminology, loses teaching/practice/assessment references, owns an unknown ID, duplicates a lesson/ID, changes the required order, or leaves an explicit case-name signal unowned.

## Per-lesson contract

| Lesson | German focus | Semantic first question | Roles | Cases | Theory | Controlled | Assessment |
|---|---|---|---:|---|---:|---:|---:|
${rows}

## Boundary

${audit.boundary}
`;
const outputs=new Map([["reports/case-teaching-audit.json",`${JSON.stringify(machine,null,2)}\n`],["docs/generated/MEANING_FIRST_CASE_REPORT.md",report]]);
if(writeMode)for(const[file,content]of outputs){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,content)}
if(checkMode){const stale=[];for(const[file,expected]of outputs){let actual="";try{actual=await readFile(file,"utf8")}catch{stale.push(`${file} (missing)`);continue}if(actual!==expected)stale.push(`${file} (stale)`)}if(stale.length)throw new Error(`Case audit artifacts are not current:\n${stale.join("\n")}\nRun: npm run case:audit:write`)}
console.log(`Meaning-first case governance verified: ${audit.contractCount} contracts / ${audit.theoryReferenceCount} theory / ${audit.controlledReferenceCount} controlled / ${audit.assessmentReferenceCount} assessment / 0 gaps`);
console.log(`- content SHA-256: ${contentSha256}`);
