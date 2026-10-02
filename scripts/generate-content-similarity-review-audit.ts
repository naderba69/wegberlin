import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildContentSimilarityReviewAudit } from "../src/core/content-validation/content-similarity-review";

const writeMode=process.argv.includes("--write");
const checkMode=process.argv.includes("--check")||!writeMode;
const audit=buildContentSimilarityReviewAudit();
if(audit.similarity.issueCount)throw new Error(`Unexempt internal near-duplicates:\n${audit.similarity.issues.slice(0,100).join("\n")}`);
const payloadWithoutHash={...audit};
const contentSha256=createHash("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex");
const machine={...payloadWithoutHash,contentSha256};
const reviewRows=Object.entries(audit.reviewState.reviewCounts).map(([dimension,value])=>`| ${dimension} | ${value.total} | ${value.automatedPassHumanPending} | ${value.independentlyReviewed} |`).join("\n");
const pairRows=audit.similarity.pairs.slice(0,80).map((pair)=>`| \`${pair.leftId}\` | \`${pair.rightId}\` | ${pair.score} | ${pair.status} | ${pair.reason??"—"} |`).join("\n")||"| — | — | — | No suspicious pairs above threshold | — |";
const report=`# Internal Similarity and Independent Review-State Audit

Generated: ${audit.generatedAt}  
Version: \`${audit.version}\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`PASS\` — ${audit.similarity.entryCount} closed/productive content objects were compared across ${audit.similarity.comparedPairCount.toLocaleString("en-US")} deterministic pairs. Unexempt internal near-duplicates: **${audit.similarity.issueCount}**.

- Suspicious pairs above threshold: ${audit.similarity.suspiciousPairCount}
- Same-context teach→practice→assessment exemptions: ${audit.similarity.exemptSameContextCount}
- Explicit independently reviewed exemptions: ${audit.similarity.exemptReviewedCount}
- External authorized reference corpora: ${audit.externalReferenceCorpusCount}
- Copyright clearance: \`${audit.copyrightClearance}\`

## Separate per-object review states

| Dimension | Objects | Automated pass / human pending | Independently reviewed |
|---|---:|---:|---:|
${reviewRows}

Every object has separate \`german\`, \`arabic\`, \`cefr\`, and \`copyright\` state objects in the machine report. An automated structural pass is never rendered as independent review.

## Similarity pairs retained for audit

| Left | Right | Score | Status | Reason |
|---|---|---:|---|---|
${pairRows}

## Boundaries

${audit.similarity.boundary}

${audit.boundary}
`;
const outputs=new Map([["reports/content-similarity-review-audit.json",`${JSON.stringify(machine,null,2)}\n`],["docs/generated/CONTENT_SIMILARITY_REVIEW_REPORT.md",report]]);
if(writeMode)for(const[file,content]of outputs){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,content)}
if(checkMode){const stale=[];for(const[file,expected]of outputs){let actual="";try{actual=await readFile(file,"utf8")}catch{stale.push(`${file} (missing)`);continue}if(actual!==expected)stale.push(`${file} (stale)`)}if(stale.length)throw new Error(`Similarity/review artifacts are not current:\n${stale.join("\n")}\nRun: npm run similarity:audit:write`)}
console.log(`Content similarity/review governance: ${audit.similarity.entryCount} objects / ${audit.similarity.comparedPairCount} pairs / ${audit.similarity.issueCount} issues / external corpora ${audit.externalReferenceCorpusCount}`);
console.log(`- separate review states: German/Arabic/CEFR/copyright × ${audit.reviewState.rowCount}; independent review remains explicit`);
console.log(`- content SHA-256: ${contentSha256}`);
