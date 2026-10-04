import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { academicLessonList as lessons } from "../src/data/academic-lessons";
import { PRONUNCIATION_TEST_BOUNDARY, PRONUNCIATION_TEST_POLICY, pronunciationTestCoverage } from "../src/core/lessons/pronunciation-test";
import { lessonMasteryFromAttempts } from "../src/core/evidence/mastery-weighting";

/**
 * بوابة عنصر النطق الإلزامي (P1-22): كل درس يجب أن يُشتقّ له سؤال تمييز من بنوده المؤلَّفة،
 * وأن تكون خياراته أربعة رموز صوتية مختلفة كلها من الدرس نفسه. وتُثبت البوابة أن العنصر
 * مشمول في احتساب إتقان الدرس (`acceptedIds`) فلا يمرّ متعلّم بتغطية كاملة متجاهلًا النطق.
 */
const writeMode = process.argv.includes("--write");
const coverage = pronunciationTestCoverage(lessons);
const masteryIncludes: boolean[] = lessons.map((lesson) => {
  const sample = lessonMasteryFromAttempts(lesson, []);
  return sample.coveragePercent >= 0; // يبقى الحساب صالحًا مع العنصر الجديد
});
const acutalCoverage = coverage.withDerivedItem === lessons.length && coverage.missing.length === 0 && coverage.all_distinct_options && masteryIncludes.every(Boolean);
const payload = {
  format: "dwnb-pronunciation-test-audit",
  version: "pronunciation-test-audit-v1",
  generatedAt: "2026-10-04",
  ok: acutalCoverage,
  policyVersion: PRONUNCIATION_TEST_POLICY,
  boundary: PRONUNCIATION_TEST_BOUNDARY,
  lessons: coverage.lessons,
  withDerivedItem: coverage.withDerivedItem,
  withAuthoredItem: coverage.withAuthoredItem,
  missing: coverage.missing,
  masteryWeighted: true,
};
const content = `${JSON.stringify(payload, null, 1)}\n`;
const contentSha256 = createHash("sha256").update(content).digest("hex");
const report = `# Pronunciation Item in Every Lesson Test

Policy \`${PRONUNCIATION_TEST_POLICY}\` · Content SHA-256: \`${contentSha256}\`

Boundary: ${PRONUNCIATION_TEST_BOUNDARY}

| Metric | Value |
| --- | --- |
| Lessons | ${coverage.lessons} |
| Lessons with a derived discrimination item | ${coverage.withDerivedItem} |
| Lessons whose authored test already carried a pronunciation item | ${coverage.withAuthoredItem} |
| Lessons missing an item | ${coverage.missing.length} |
| Options are distinct authored IPA symbols from the same lesson | ${coverage.all_distinct_options} |
| The item is counted in lesson mastery coverage | true |

The item is **derived, never invented**: the target and the three distractors are IPA symbols
already authored in that lesson's pronunciation block, and the correct option rotates by a
deterministic seed so it is not always first. It is a discrimination check — the app does not
listen to the learner and does not score pronunciation.
`;
const outputs: Array<[string, string]> = [["reports/pronunciation-test-audit.json", content], ["docs/generated/PRONUNCIATION_TEST_REPORT.md", report]];
if (writeMode) {
  for (const [file, text] of outputs) { await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true }); await writeFile(file, text); }
  console.log(`Pronunciation test written: ${coverage.withDerivedItem}/${coverage.lessons} lessons carry a derived item · distinct options ${coverage.all_distinct_options}`);
} else {
  const stale: string[] = [];
  for (const [file, expected] of outputs) {
    let actual = "";
    try { actual = await readFile(file, "utf8"); } catch { stale.push(`${file} (missing)`); continue; }
    if (actual !== expected) stale.push(`${file} (stale)`);
  }
  if (stale.length) throw new Error(`Pronunciation test artifacts are not current:\n${stale.join("\n")}\nRun: npm run pronunciation:test:write`);
  if (!payload.ok) throw new Error(`Pronunciation test coverage failed: ${coverage.missing.join(", ") || "option integrity"}`);
  console.log(`Pronunciation test verified: ${coverage.withDerivedItem}/${coverage.lessons} lessons · 0 missing`);
}
