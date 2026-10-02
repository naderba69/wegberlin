import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const writeMode=process.argv.includes("--write");
const checkMode=process.argv.includes("--check")||!writeMode;
const requiredAdaptiveConsumers=[
  "src/components/exercise-card.tsx","src/components/diagnostic-view.tsx","src/components/library-view.tsx","src/components/module-review.tsx",
  "src/components/a1-level-assessment.tsx","src/components/a2-level-assessment.tsx","src/components/b1-level-assessment.tsx","src/components/b2-level-assessment.tsx",
  "src/components/targeted-choice-simulation.tsx","src/components/targeted-listening-simulation.tsx",
];

async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(absolute));else if(entry.isFile()&&absolute.endsWith(".tsx"))files.push(absolute)}return files}
const files=await walk(path.join(root,"src"));
const issues=[];const mixedStatic=[];let openingTagCount=0,germanTagCount=0,arabicTagCount=0,ltrTagCount=0,rtlTagCount=0,autoDirCount=0,technicalScopeCount=0,dynamicPairCount=0,bdiCount=0;
for(const absolute of files){const relative=path.relative(root,absolute).replaceAll(path.sep,"/");const source=await readFile(absolute,"utf8");
  if(/[\u202a-\u202e\u2066-\u2069]/u.test(source))issues.push(`${relative}: raw Unicode bidi control character is forbidden`);
  for(const match of source.matchAll(/<[A-Za-z][^<>]*>/gs)){const tag=match[0];openingTagCount+=1;if(tag.startsWith("<bdi"))bdiCount+=1;
    const german=/\blang="de(?:-[A-Za-z0-9]+)*"/.test(tag),arabic=/\blang="ar(?:-[A-Za-z0-9]+)*"/.test(tag),ltr=/\bdir="ltr"/.test(tag),rtl=/\bdir="rtl"/.test(tag),auto=/\bdir="auto"/.test(tag),scope=/\bdata-bidi-scope=/.test(tag),dynamicLang=/\blang=\{/.test(tag),dynamicDir=/\bdir=\{/.test(tag);
    if(german)germanTagCount+=1;if(arabic)arabicTagCount+=1;if(ltr)ltrTagCount+=1;if(rtl)rtlTagCount+=1;if(auto)autoDirCount+=1;if(scope)technicalScopeCount+=1;if(dynamicLang&&dynamicDir)dynamicPairCount+=1;
    const line=source.slice(0,match.index).split("\n").length;
    if(german&&!ltr)issues.push(`${relative}:${line}: lang=de lacks dir=ltr`);
    if(arabic&&!rtl)issues.push(`${relative}:${line}: lang=ar lacks dir=rtl`);
    if(ltr&&!german&&!scope)issues.push(`${relative}:${line}: dir=ltr lacks lang=de or an explicit bidi scope`);
    if(rtl&&!arabic&&!scope)issues.push(`${relative}:${line}: dir=rtl lacks lang=ar or an explicit bidi scope`);
    if(dynamicLang!==dynamicDir)issues.push(`${relative}:${line}: dynamic lang/dir attributes are not paired`);
  }
  for(const match of source.matchAll(/>([^<>{}\n]+)</g)){const text=match[1].replace(/\s+/g," ").trim();if(/[\u0600-\u06ff]/u.test(text)&&/[A-Za-zÄÖÜäöüß]/u.test(text))mixedStatic.push({path:relative,line:source.slice(0,match.index).split("\n").length,text});}
}
const layout=await readFile(path.join(root,"src/app/layout.tsx"),"utf8");
const css=await readFile(path.join(root,"src/app/globals.css"),"utf8");
if(!layout.includes('<html lang="ar" dir="rtl">'))issues.push("src/app/layout.tsx: Arabic root lang/dir contract missing");
if(!css.includes('html[lang="ar"][dir="rtl"] :where(')||!css.includes("unicode-bidi:plaintext"))issues.push("globals.css: Arabic mixed-text plaintext boundary missing");
if(!css.includes('[lang="de"][dir="ltr"],[data-bidi-scope],bdi{')||!css.includes("unicode-bidi:isolate!important"))issues.push("globals.css: explicit fragment isolation missing");
for(const file of requiredAdaptiveConsumers){const source=await readFile(path.join(root,file),"utf8");if(!source.includes("fragmentLanguageAttributes"))issues.push(`${file}: adaptive answer-fragment classifier missing`)}
const payloadWithoutHash={format:"dwnb-language-boundary-audit",version:"language-boundary-audit-v1",generatedAt:"2026-09-07",ok:issues.length===0,tsxFiles:files.length,openingTagCount,germanTagCount,arabicTagCount,ltrTagCount,rtlTagCount,autoDirCount,technicalScopeCount,dynamicPairCount,bdiCount,adaptiveConsumerCount:requiredAdaptiveConsumers.length,mixedStaticCount:mixedStatic.length,mixedStatic,issues,boundary:"Static source and production DOM checks prove explicit lang/dir pairing, adaptive answer-bank classification, and bidi containment policy. They do not replace physical browser/screen-reader review of spoken order."};
const contentSha256=createHash("sha256").update(JSON.stringify(payloadWithoutHash)).digest("hex");const machine={...payloadWithoutHash,contentSha256};
const mixedRows=mixedStatic.map((item)=>`| ${item.path}:${item.line} | ${item.text.replaceAll("|","\\|").slice(0,110)} | Arabic host + plaintext boundary |`).join("\n");
const report=`# Language and Bidi Fragment Audit

Generated: 2026-09-07  
Version: \`language-boundary-audit-v1\`  
Policy: \`language-boundary-v1\`  
Content SHA-256: \`${contentSha256}\`

## Result

\`${issues.length?"FAIL":"PASS"}\` — ${files.length} TSX files and ${openingTagCount} opening JSX tags were scanned.

| Contract | Count |
|---|---:|
| Explicit German fragments (lang=de + dir=ltr) | ${germanTagCount} |
| Explicit Arabic fragments (lang=ar + dir=rtl) | ${arabicTagCount} |
| LTR tags audited | ${ltrTagCount} |
| RTL tags audited | ${rtlTagCount} |
| Auto-direction adaptive fragments | ${autoDirCount} |
| Technical/numeric/secret bidi scopes | ${technicalScopeCount} |
| Paired dynamic lang/dir expressions | ${dynamicPairCount} |
| bdi elements | ${bdiCount} |
| Adaptive answer-bank consumers | ${requiredAdaptiveConsumers.length} |
| Static Arabic + Latin text nodes under plaintext host policy | ${mixedStatic.length} |
| **Issues** | **${issues.length}** |

## Enforced rules

- The application root is \`<html lang="ar" dir="rtl">\`.
- Every static German tag owns LTR; every static Arabic tag, including a regional tag such as \`ar-TN\`, owns RTL.
- Every LTR tag has either a German language or an explicit technical/numeric/secret scope.
- Dynamic language and direction expressions appear as a pair.
- Generic answer banks use \`fragmentLanguageAttributes\` to choose Arabic, German, mixed/auto, or technical direction from the actual string.
- Raw Unicode bidi override/isolate control characters are forbidden in TSX source.
- Arabic-host mixed static text uses a global \`unicode-bidi: plaintext\` paragraph boundary; explicit German/technical fragments use \`isolate\`.

## Mixed static fragments audited

| Source | Fragment | Policy |
|---|---|---|
${mixedRows}

## Boundary

${payloadWithoutHash.boundary}
`;
const outputs=new Map([["reports/language-boundary-audit.json",`${JSON.stringify(machine,null,2)}\n`],["docs/generated/LANGUAGE_BOUNDARY_REPORT.md",report]]);
if(writeMode)for(const[file,content]of outputs){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,content)}
if(checkMode){const stale=[];for(const[file,expected]of outputs){let actual="";try{actual=await readFile(file,"utf8")}catch{stale.push(`${file} (missing)`);continue}if(actual!==expected)stale.push(`${file} (stale)`)}if(stale.length)throw new Error(`Language audit artifacts are not current:\n${stale.join("\n")}\nRun: npm run language:audit:write`)}
if(issues.length)throw new Error(`Language/Bidi audit failed:\n${issues.join("\n")}`);
console.log(`Language/Bidi governance verified: ${files.length} TSX / ${openingTagCount} tags / ${germanTagCount} German / ${technicalScopeCount} scoped / ${mixedStatic.length} mixed static / 0 issues`);
console.log(`- content SHA-256: ${contentSha256}`);
