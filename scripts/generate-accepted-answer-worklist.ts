import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { academicLessonList as lessons } from "../src/data/academic-lessons";

/**
 * Work list for productive exercises that accept exactly one string.
 * ADR-078 policy: the grader accepts only explicitly listed variants, so fixes belong in the data.
 * This script never writes to the lessons; it classifies each item and proposes a variant ONLY when the
 * equivalence is provable by reordering a trailing prepositional phrase while keeping verb-second order.
 * Run: `npm run lessons:variant-worklist` → reports/accepted-answer-worklist.md
 */
const PREPS = new Set(["in", "an", "auf", "bei", "mit", "nach", "aus", "zu", "von", "um", "vor", "hinter", "über", "unter", "zwischen", "am", "im", "ans", "zum", "zur"]);
const SUB = /\b(dass|ob|weil|wenn|obwohl|damit|wodurch|während|bevor|als|um|ohne|bis)\b/i;
type Row = { lessonId: string; exerciseId: string; type: string; sentence: string; why: string; proposal?: string };
const rows: Row[] = [];

for (const lesson of lessons) {
  for (const exercise of lesson.exercises) {
    if (exercise.type === "multiple-choice" || exercise.type === "matching") continue;
    const accepted = exercise.acceptedAnswers;
    if (accepted.length !== 1) continue;
    const sentence = accepted[0];
    const tokens = sentence.split(/\s+/);
    const chunkTokens = exercise.type === "word-ordering" ? exercise.words.flatMap((chunk) => chunk.split(/\s+/)) : tokens;
    if (chunkTokens.length !== tokens.length) { rows.push({ lessonId: lesson.id, exerciseId: exercise.id, type: exercise.type, sentence, why: "die Antwort enthält mehr/weniger Tokens als die Bausteine — nur ein Autor kann beurteilen, ob eine weitere Form gilt" }); continue; }
    if (SUB.test(sentence)) { rows.push({ lessonId: lesson.id, exerciseId: exercise.id, type: exercise.type, sentence, why: "نص فرعي أو مجموعة المصدر: ترتيبه الوحيد نحويًا، فلا بديل قابل للإضافة" }); continue; }
    if (tokens.length < 5) { rows.push({ lessonId: lesson.id, exerciseId: exercise.id, type: exercise.type, sentence, why: "جملة قصيرة جدًا: لا عنصر ثانٍ يمكن تقديمه دون تغيير المعنى" }); continue; }
    let start = -1;
    for (let i = 2; i < tokens.length - 1; i++) if (PREPS.has(tokens[i].toLowerCase())) { start = i; break; }
    if (start < 2) { rows.push({ lessonId: lesson.id, exerciseId: exercise.id, type: exercise.type, sentence, why: "لا توجد جرّة خلفية قابلة للتقديم؛ البديل المحتمل يحتاج قرار مؤلِّف" }); continue; }
    const proposal = [tokens.slice(start).join(" "), tokens[1], tokens[0], ...tokens.slice(2, start)].filter(Boolean).join(" ");
    const same = proposal.toLowerCase().split(/\s+/).sort().join(" ") === tokens.slice().sort().join(" ").toLowerCase();
    if (!same || proposal === sentence) { rows.push({ lessonId: lesson.id, exerciseId: exercise.id, type: exercise.type, sentence, why: "التقديم المقترح لا يحافظ على نفس الرصيد أو يعيد نفس النص" }); continue; }
    rows.push({ lessonId: lesson.id, exerciseId: exercise.id, type: exercise.type, sentence, why: "قابل للإضافة بثقة: تقديم الجرّة مع الحفاظ على Position 2 للفعل", proposal });
  }
}

const derivable = rows.filter((row) => row.proposal);
const reasons = new Map<string, number>();
for (const row of rows) reasons.set(row.why, (reasons.get(row.why) ?? 0) + 1);
const body = [
  "# قائمة عمل: تمارين إنتاجية بإجابة وحيدة مقبولة",
  "",
  `السياسة (ADR-078): المُصحِّح يقبل ما هو مُدرَج صراحةً فقط؛ لا تخفيف في ` + "`normalizeGermanText`" + `. يُضيف هذا التقرير قائمة عمل ولا يغيّر البيانات.",`,
  "",
  `- بنود بإجابة واحدة: **${rows.length}** · قابلة للإضافة بثقة: **${derivable.length}** · تحتاج قرار مؤلِّف: **${rows.length - derivable.length}**`,
  "",
  "## التبريرات",
  "",
  "| السبب | العدد |",
  "|---|---:|",
  ...[...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([reason, count]) => `| ${reason} | ${count} |`),
  "",
  "## بنود قابلة للإضافة فورًا (إن اعتمدها مؤلِّف)",
  "",
  "| الدرس | التمرين | النوع | النص المقبول حاليًا | البديل الإضافي |",
  "|---|---|---|---|---|",
  ...(derivable.length ? derivable.map((row) => `| \`${row.lessonId}\` | \`${row.exerciseId}\` | ${row.type} | ${row.sentence} | ${row.proposal} |`) : ["| — | — | — | لا شيء بالقياس الحالي | — |"]),
  "",
  "## أولويات التأليف",
  "",
  "1. `error-correction` حيث يصح أكثر من إصلاح واحد (الباقي بعد استثناء النص الفرعي).",
  "2. `fill-blank` النائم على حرف جر أو أداة تعريف يمكن أن يسقط في سياق مقبول.",
  "3. أي بديل يُضاف يجب أن يُذكر في `explanationAr` أيضًا، لكي يعرف المتعلّم سبب القبول.",
  "",
].join("\n");
await mkdir(join(process.cwd(), "reports"), { recursive: true });
await writeFile(join(process.cwd(), "reports", "accepted-answer-worklist.md"), body.replace(/",$/, "") + "\n", "utf8");
console.log(`Accepted-answer work list: ${rows.length} single-variant productive items · ${derivable.length} provably derivable · reports/accepted-answer-worklist.md`);
