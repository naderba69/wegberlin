import{createHash}from"node:crypto";import{mkdir,readFile,writeFile}from"node:fs/promises";import{buildStudyModesAudit}from"../src/core/content-validation/study-modes";const writeMode=process.argv.includes("--write");const audit=buildStudyModesAudit();if(!audit.ok)throw new Error(`Study modes audit failed:\n${audit.issues.join("\n")}`);const contentSha256=createHash("sha256").update(JSON.stringify(audit)).digest("hex");const payload={...audit,contentSha256};const report=`# Reading, Listening Process, and Prosody Audit

Generated: ${audit.generatedAt}  
Version: \`${audit.version}\`  
Content SHA-256: \`${contentSha256}\`

\`PASS\` — ${audit.counts.readingItems} reading items expose separate Easy/Exam contracts; ${audit.counts.unknownWordChallenges} items currently match an authored word-family meaning for hypothesis-first unknown-word practice; ${audit.counts.prosodyItems} prosody steps cover all four levels.

- \`easy-vs-exam-reading-v1\`: mode-scoped answers; Exam hides summary and strategy.
- \`unknown-word-and-compound-strategy-v1\`: guess word function, inspect context, split only known compounds, then reveal an authored meaning. No generated semantics.
- \`unified-listening-usage-evidence-v1\`: playback ordinal and transcript timing are process evidence only across onboarding, diagnostic, lesson, library, shadowing, guided exam, and continuous exam surfaces.
- \`prosody-rhythm-progression-v1\`: four steps per level cover word stress, sentence focus, rhythm, and hesitation/repair using synthetic Browser TTS examples.
- \`local-rms-pause-estimate-v1\`: locally estimates voiced/silent energy and pauses without words, phonemes, pronunciation, or fluency scoring.
- \`learner-attributed-language-vs-device-v1\`: the learner—not automation—separates language/planning factors from noise, microphone, playback, or permission.
- \`central-redemittel-function-register-v1\`: ${audit.counts.redemittelEntries} phrases are browsable by ${audit.counts.redemittelFunctions} functions and ${audit.counts.redemittelRegisters} registers.

| Level | Reading items | Unknown-word challenges |
|---|---:|---:|
${Object.entries(audit.unknownWordByLevel).map(([level,x])=>`| ${level} | ${x.total} | ${x.covered} |`).join("\n")}

All stored listening events carry \`${audit.boundaries.listening}\`. Prosody remains \`${audit.boundaries.prosody}\`; it is not acoustic scoring or a fluency judgment.
`;await mkdir("reports",{recursive:true});await mkdir("docs/generated",{recursive:true});const jp="reports/study-modes-audit.json",mp="docs/generated/STUDY_MODES_REPORT.md";if(writeMode){await writeFile(jp,`${JSON.stringify(payload,null,2)}\n`);await writeFile(mp,report);console.log(`Wrote study modes audit ${contentSha256.slice(0,12)}.`)}else{const[j,m]=await Promise.all([readFile(jp,"utf8"),readFile(mp,"utf8")]);if(j!==`${JSON.stringify(payload,null,2)}\n`||m!==report)throw new Error("Study modes audit artifacts are stale. Run: npm run study:modes:audit:write");console.log(`Study modes audit verified: ${audit.counts.readingItems} reading / ${audit.counts.unknownWordChallenges} word challenges / ${audit.counts.prosodyItems} prosody steps / 0 issues`)}
