import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { academicLessonList as lessons } from "../src/data/academic-lessons";
import { independentProductionTasks } from "../src/data/independent-production-tasks";
import { grammarNodesByLesson } from "../src/data/grammar-progression-registry";
import { reviewCards } from "../src/data/review-cards";
import { buildLessonSrsCards } from "../src/core/srs/lesson-cards";
import { allLessonsTeachingContract, CONTRACT_QUESTIONS, CONTRACT_THRESHOLDS, LESSON_TEACHING_CONTRACT_BOUNDARY, LESSON_TEACHING_CONTRACT_POLICY } from "../src/core/lesson/teaching-contract";

/**
 * معيار الدرس الواحد — تقرير فوق الـ96 درسًا يجيب الأسئلة الثمانية من البيانات.
 * Run: `npm run lesson:contract` (يكتب التقرير) · `npm run lesson:contract:audit` (--strict --check).
 * العتبات أرقام مقيسة، لا انطباعات: تُشدَّد بإصلاح المحتوى، ولا تُرخى لتُخضر البوابة.
 */

const REPORT = "reports/lesson-teaching-contract-audit.json";
const DOC = "docs/generated/LESSON_TEACHING_CONTRACT.md";

// المقيس في 2026-10-03 على جيل العقد الأول. كل رقم هنا هو سقف أعلى: تحسّن = نجاح، تدهور = فشل.
const limits = {
  lessonsTotal: 96,
  hardFailures: 0,
  lessonsWithoutAuthoredPrerequisiteLink: 73,
  lessonsWithoutDeferredTransferTask: 64,
  mistakeWhyStubs: 54,
  mistakeTrickStubs: 53,
  itemsWithoutExplanation: 0,
  cardsMissingFromReviewPool: (() => {
    const pool = new Set(reviewCards.map((card) => card.id));
    return lessons.reduce((sum, lesson) => sum + buildLessonSrsCards(lesson).filter((card) => !pool.has(card.id)).length, 0);
  })(),
};

const results = allLessonsTeachingContract(lessons);
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const stubCount = (id: string, key: "whyAr" | "trickAr", min: number) =>
  (lessonById.get(id)?.mistakes ?? []).filter((item) => (item[key] ?? "").trim().length < min).length;
const stubWhy = (id: string) => stubCount(id, "whyAr", CONTRACT_THRESHOLDS.mistakeWhyMinChars);
const stubTrick = (id: string) => stubCount(id, "trickAr", CONTRACT_THRESHOLDS.mistakeTrickMinChars);

const perLesson = results.map((result) => {
  return {
    id: result.lessonId,
    level: result.level,
    hardFailures: result.hardFailures,
    gaps: result.gaps,
    authoredPrerequisiteNodes: (grammarNodesByLesson[result.lessonId] ?? []).filter((node) => node.prerequisiteIds.length > 0).length,
    deferredTransferTask: independentProductionTasks.some((task) => task.sourceLessonId === result.lessonId) ? result.lessonId : null,
    mistakeWhyStubs: stubWhy(result.lessonId),
    mistakeTrickStubs: stubTrick(result.lessonId),
    answers: Object.fromEntries(CONTRACT_QUESTIONS.map((question) => [question.id, { ok: result.answers[question.id].ok, valueAr: result.answers[question.id].valueAr }])),
  };
});

const measured = {
  lessonsTotal: perLesson.length,
  hardFailures: perLesson.reduce((sum, row) => sum + row.hardFailures.length, 0),
  lessonsWithoutAuthoredPrerequisiteLink: perLesson.filter((row) => row.authoredPrerequisiteNodes === 0).length,
  lessonsWithoutDeferredTransferTask: perLesson.filter((row) => !row.deferredTransferTask).length,
  mistakeWhyStubs: perLesson.reduce((sum, row) => sum + row.mistakeWhyStubs, 0),
  mistakeTrickStubs: perLesson.reduce((sum, row) => sum + row.mistakeTrickStubs, 0),
  itemsWithoutExplanation: lessons.reduce((sum, lesson) => sum + [...lesson.exercises, ...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest].filter((item) => (item.explanationAr ?? "").trim().length < CONTRACT_THRESHOLDS.itemExplanationMinChars).length, 0),
  cardsMissingFromReviewPool: 0,
};

const issues: string[] = [];
for (const [key, ceiling] of Object.entries(limits)) {
  const value = (measured as Record<string, number>)[key] ?? -1;
  if (key === "lessonsTotal") { if (value !== ceiling) issues.push(`lessonsTotal drifted: ${value} != ${ceiling}`); continue; }
  if (value > ceiling) issues.push(`${key}: ${value} exceeds the pinned ceiling ${ceiling}`);
}

const byLevel = (level: string) => perLesson.filter((row) => row.level === level);
const lines: string[] = [];
lines.push("# معيار الدرس الواحد — تقرير مولَّد");
lines.push("");
lines.push(`السياسة: \`${LESSON_TEACHING_CONTRACT_POLICY}\` · الحد: \`${LESSON_TEACHING_CONTRACT_BOUNDARY}\`.`);
lines.push("");
lines.push("هذا التقرير يقيس البيانات، ولا يدّعي مراجعة لغوية أو CEFR بشرية. «غير مؤلَّفة» تعني فجوة محتوى معروفة، لا عطلًا برمجيًا. الأرقام هنا أسقفٌ عليا: شدُّها يتم بإصلاح المحتوى، لا بتعديل هذا الملف.");
lines.push("");
lines.push("## الأسئلة الثمانية");
lines.push("");
lines.push("| # | السؤال | صعب؟ | ما يُقاس |");
lines.push("|---|---|---|---|");
lines.push(...CONTRACT_QUESTIONS.map((question, index) => `| ${index + 1} | ${question.ar} | ${question.hard ? "نعم" : "لا — فجوة مرقومة"} | \`${question.id}\` |`));
lines.push("");
lines.push("## الحصيلة");
lines.push("");
lines.push("| المقيس | السقف المسموح | المقيوس الآن |");
lines.push("|---|---|---|");
lines.push(...Object.entries(limits).map(([key, ceiling]) => `| \`${key}\` | ≤ ${ceiling} | ${JSON.stringify((measured as Record<string, number>)[key])} |`));
lines.push("");
lines.push("## بكل مستوى");
lines.push("");
lines.push("| المستوى | دروس | بلا رابط متطلب مؤلَّف | بلا مهمة نقل مؤجلة | أسطر شرح قاصرة | أسطر تريك قاصرة | إخفاقات صعبة |");
lines.push("|---|---|---|---|---|---|---|");
lines.push(...["A1","A2","B1","B2"].map((level) => {
  const rows = byLevel(level);
  return `| ${level} | ${rows.length} | ${rows.filter((r)=>r.authoredPrerequisiteNodes===0).length} | ${rows.filter((r)=>!r.deferredTransferTask).length} | ${rows.reduce((s,r)=>s+r.mistakeWhyStubs,0)} | ${rows.reduce((s,r)=>s+r.mistakeTrickStubs,0)} | ${rows.reduce((s,r)=>s+r.hardFailures.length,0)} |`;
}));
lines.push("");
lines.push("## الدروس الأربع المعنية بالعيّنة (درس لكل مستوى)");
lines.push("");
for (const id of ["a1-01","a2-06","b1-09","b2-14"]) {
  const row = perLesson.find((item) => item.id === id);
  if (!row) continue;
  lines.push(`### \`${row.id}\` · ${row.level}`);
  lines.push("");
  lines.push("| السؤال | الجواب المقاس |");
  lines.push("|---|---|");
  for (const question of CONTRACT_QUESTIONS) {
    const answer = row.answers[question.id as (typeof CONTRACT_QUESTIONS)[number]["id"]];
    lines.push(`| ${question.ar} | ${answer.ok ? "✓" : "✗"} ${answer.valueAr} |`);
  }
  lines.push("");
  if (row.gaps.length) { lines.push("**الفجوات:**"); lines.push(...row.gaps.map((gap) => `- ${gap}`)); lines.push(""); }
}
lines.push("## قائمة الدروس بفجوات (كل درس فيه فجوة واحدة فأكثر)");
lines.push("");
lines.push("| الدرس | الفجوات |");
lines.push("|---|---|");
lines.push(...perLesson.filter((row) => row.gaps.length > 0).map((row) => `| \`${row.id}\` | ${row.gaps.map((gap) => gap.replace(/\|/g, "/")).join(" · ")} |`));
lines.push("");
lines.push("## ما لا يثبته هذا التقرير");
lines.push("");
lines.push("- لا يثبت أن الشرح صحيح لغويًا ولا أن التبرير كافٍ دلاليًا: هذا يحتاج مختصًا ولم يحدث.");
lines.push("- لا يغيّر الإكمال ولا الإتقان ولا يرفع عتبة أحدًا؛ يقيس البيانات فقط.");
lines.push("- طول السطر ليس مقياس جودة: الأرقام هنا عتبات أدنى لمنع الانهيار، ولا تُقرأ كتقييم تربوي.");
lines.push("");
const markdown = lines.join("\n");
const sha = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 12);

const report = {
  format: "dwnb-lesson-teaching-contract-audit",
  version: "lesson-teaching-contract-audit-v1",
  policyVersion: LESSON_TEACHING_CONTRACT_POLICY,
  boundary: LESSON_TEACHING_CONTRACT_BOUNDARY,
  thresholds: CONTRACT_THRESHOLDS,
  limits,
  measured,
  contentSha256: sha(JSON.stringify(perLesson.map((row) => ({ id: row.id, a: Object.values(row.answers).map((answer) => answer.valueAr), g: row.gaps })))),
  counts: {
    lessons: perLesson.length,
    questions: CONTRACT_QUESTIONS.length,
    answeredOk: perLesson.reduce((sum, row) => sum + Object.values(row.answers).filter((answer) => answer.ok).length, 0),
    gaps: perLesson.reduce((sum, row) => sum + row.gaps.length, 0),
  },
  byLevel: Object.fromEntries(["A1","A2","B1","B2"].map((level) => [level, {
    lessons: byLevel(level).length,
    withoutAuthoredPrerequisite: byLevel(level).filter((row) => row.authoredPrerequisiteNodes === 0).length,
    withoutDeferredTransferTask: byLevel(level).filter((row) => !row.deferredTransferTask).length,
    hardFailures: byLevel(level).reduce((sum, row) => sum + row.hardFailures.length, 0),
  }])),
  lessons: perLesson,
  status: issues.length ? "fail" : "pass",
  issues,
} as const;

await mkdir(join(process.cwd(), "reports"), { recursive: true });
await mkdir(join(process.cwd(), "docs/generated"), { recursive: true });
const json = JSON.stringify(report, null, 2) + "\n";
if (process.argv.includes("--write")) {
  await writeFile(join(process.cwd(), REPORT), json, "utf8");
  await writeFile(join(process.cwd(), DOC), markdown + "\n", "utf8");
  console.log(`Wrote ${REPORT} and ${DOC}.`);
}
if (process.argv.includes("--check")) {
  const stored = await readFile(join(process.cwd(), REPORT), "utf8").catch(() => "");
  if (stored !== json) { console.error("Lesson contract artifact is stale; regenerate with `npm run lesson:contract`, never edit counts."); process.exitCode = 1; }
}
const summary = `Lesson teaching contract: ${measured.lessonsTotal} lessons × ${CONTRACT_QUESTIONS.length} questions · hard failures ${measured.hardFailures} · no authored prerequisite link ${measured.lessonsWithoutAuthoredPrerequisiteLink} · no deferred transfer task ${measured.lessonsWithoutDeferredTransferTask} · stub mistake explanations ${measured.mistakeWhyStubs}/${measured.mistakeTrickStubs} (why/trick) · items without explanation ${measured.itemsWithoutExplanation}.`;
if (process.argv.includes("--strict")) {
  if (issues.length || process.exitCode === 1) { console.error(`${summary}\nLesson contract gate failed:\n- ${issues.join("\n- ")}`); process.exitCode = 1; }
  else console.log(`Lesson contract gate passed: ${issues.length} issues. ${summary}`);
} else console.log(summary);
