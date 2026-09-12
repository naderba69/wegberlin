import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { buildLearningArchitectureAudit } from "../src/core/content-validation/learning-architecture";

const writeMode=process.argv.includes("--write");const audit=buildLearningArchitectureAudit();if(!audit.ok)throw new Error(`Learning architecture audit failed:\n${audit.issues.join("\n")}`);const contentSha256=createHash("sha256").update(JSON.stringify(audit)).digest("hex");const payload={...audit,contentSha256};
const grammarRows=audit.grammarRows.map((row)=>`| ${row.level} | ${row.titleDe} | ${row.prerequisiteIds.length} | ${row.controlledExerciseIds.length} | ${row.production.stage} | ${row.boundariesAr.length} | ${row.exceptionsAr.length} |`).join("\n");
const questionRows=Object.entries(audit.questionByLevel).map(([level,value])=>`| ${level} | ${value.total} | ${value.counts.gist} | ${value.counts.detail} | ${value.counts.stance} | ${value.counts.inference} | ${value.counts.structure} | ${value.detailPercent}% |`).join("\n");
const report=`# Grammar Progression and Comprehension Taxonomy Audit

Generated: ${audit.generatedAt}  
Version: \`${audit.version}\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`PASS\` — ${audit.counts.grammarNodes} canonical grammar nodes with ${audit.counts.grammarEdges} prerequisite edges, ${audit.counts.controlledMappings}/${audit.counts.grammarNodes} controlled mappings, ${audit.counts.productiveMappings}/${audit.counts.grammarNodes} productive mappings, and ${audit.counts.questionTaxonomyRows} item-level reading/listening taxonomy rows passed strict validation.

## Grammar progression

Exactly six canonical rule nodes per A1/A2/B1/B2 are linked to real theory, at least two controlled exercises, and one lesson-owned writing/speaking/mediation task. Every node contains an introduced-now layer, a common limit, deferred complexity, two or more boundaries, and at least one common exception. The prerequisite graph is acyclic and every parent precedes its child.

| Level | Rule | Prerequisites | Controlled | Free production | Boundaries | Exceptions |
|---|---|---:|---:|---|---:|---:|
${grammarRows}

Boundary: \`${audit.boundaries.grammar}\`. The graph is curriculum navigation, not an official CEFR sequence, and browsing it creates no mastery.

## Comprehension question taxonomy

Every one of ${audit.counts.readingQuestions} reading and ${audit.counts.listeningQuestions} listening questions has exactly one function label. The first listening question in all 84 lessons inherits the existing authored gist-stage contract; other rows use explicit semantic signals, with specific fact questions defaulting to detail.

| Level | Total | Gist | Detail | Stance | Inference | Structure | Detail share |
|---|---:|---:|---:|---:|---:|---:|---:|
${questionRows}
| **Total** | **${audit.counts.questionTaxonomyRows}** | **${audit.questionCategoryCounts.gist}** | **${audit.questionCategoryCounts.detail}** | **${audit.questionCategoryCounts.stance}** | **${audit.questionCategoryCounts.inference}** | **${audit.questionCategoryCounts.structure}** | — |

Balance gates require all five functions in every level, keep details at or below 72%, and keep gist between 12% and 30%. Labels guide strategy only and never change correctness, score, mastery, or CEFR.

Boundary: \`${audit.boundaries.questions}\`. This deterministic item-function audit is not represented as independent human semantic review; final wording/classification review remains part of the whole-project expert round.

## Build gates

- strict Zod rejects unknown or incomplete grammar/taxonomy records;
- lesson/theory/exercise/productive references must resolve exactly;
- every productive prompt must be the actual lesson-owned task;
- prerequisite cycles, forward edges, and missing parents fail;
- all 24 rules must contain progressive limits and explicit exceptions;
- all ${audit.counts.questionTaxonomyRows} source questions must be covered once;
- provenance must preserve lesson, level, and reading/listening surface;
- every level must meet the published function-balance envelope.
`;
await mkdir("reports",{recursive:true});await mkdir("docs/generated",{recursive:true});const jsonPath="reports/learning-architecture-audit.json";const reportPath="docs/generated/LEARNING_ARCHITECTURE_REPORT.md";
if(writeMode){await writeFile(jsonPath,`${JSON.stringify(payload,null,2)}\n`);await writeFile(reportPath,report);console.log(`Wrote learning architecture audit ${contentSha256.slice(0,12)}.`);}else{const [storedJson,storedReport]=await Promise.all([readFile(jsonPath,"utf8"),readFile(reportPath,"utf8")]);if(storedJson!==`${JSON.stringify(payload,null,2)}\n`||storedReport!==report)throw new Error("Learning architecture audit artifacts are stale. Run: npm run learning:architecture:audit:write");console.log(`Learning architecture audit verified: ${audit.counts.grammarNodes} rules / ${audit.counts.questionTaxonomyRows} questions / 0 issues`);}
