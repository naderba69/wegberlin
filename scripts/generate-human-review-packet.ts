import { readFile, readdir, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

/**
 * Builds the human review packet: every governed content record with its actual text,
 * grouped into signed CSV sheets a named human reviewer can accept/reject/edit, plus the
 * B2 lesson checklist and the pending lexical decisions. It changes no review status.
 * Run: `npm run review:packet`
 */
const root = process.cwd();
const OUT = join(root, "reports", "review-packet");
const SHEET_SIZE = 200;

const governance = JSON.parse(await readFile(join(root, "reports", "content-governance-audit.json"), "utf8"));
const quality = JSON.parse(await readFile(join(root, "reports", "lesson-quality-audit.json"), "utf8"));
const lexical = JSON.parse(await readFile(join(root, "reports", "lexical-strategy-audit.json"), "utf8"));

// Raw source index so every record id resolves to the text a human must actually read.
const dataDir = join(root, "src", "data");
const sources: Array<{ file: string; text: string }> = [];
for (const entry of await readdir(dataDir, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.(ts|json)$/.test(entry.name)) continue;
  sources.push({ file: `src/data/${entry.name}`, text: await readFile(join(dataDir, entry.name), "utf8") });
}
function locate(id: string) {
  const needle = `"${id}"`;
  for (const source of sources) {
    const at = source.text.indexOf(needle);
    if (at < 0) continue;
    const slice = source.text.slice(Math.max(0, at - 40), at + 620);
    const excerpt = slice.replace(/\s+/g, " ").replace(/[{}[\]"],/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);
    return { file: source.file, excerpt };
  }
  return { file: "", excerpt: "" };
}

const flagsFor = (lessonId: string) => {
  const flags: string[] = [];
  if (quality.writing.violationList.some((row: { lessonId: string }) => row.lessonId === lessonId)) flags.push("model-answer-shorter-than-stated-range");
  if (quality.objectives.reviewPromptList.some((row: string) => row.startsWith(`${lessonId}#`))) flags.push("objective-not-traced");
  return flags;
};
const levelOf = (id: string) => (/^a1/.test(id) ? "A1" : /^a2/.test(id) ? "A2" : /^b1/.test(id) ? "B1" : /^b2/.test(id) ? "B2" : "");
const csv = (cells: string[]) => cells.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",");

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const header = ["sheet", "row", "contentId", "scope", "level", "artifactOwner", "sourceFile", "contentToRead", "qualityFlags", "decision", "reviewerName", "reviewDate", "note"];
const rows: string[][] = [];
for (const [index, record] of governance.contentRows.entries()) {
  const owner = String(record.contentId).split(/-(e\d+|q\d+|m\d+|card|w\d+|l\d+)/)[0] || "";
  const { file, excerpt } = locate(String(record.contentId));
  rows.push([`sheet-${Math.floor(index / SHEET_SIZE) + 1}`, String(index + 1), String(record.contentId), String(record.scope), levelOf(owner), owner, file || "غير محلول آليًا — افتش المعرّف في src", excerpt, flagsFor(owner).join("; "), "", "", "", ""]);
}
const sheetCount = Math.ceil(rows.length / SHEET_SIZE);
for (let sheet = 0; sheet < sheetCount; sheet++) {
  const body = rows.slice(sheet * SHEET_SIZE, (sheet + 1) * SHEET_SIZE);
  await writeFile(join(OUT, `review-sheet-${String(sheet + 1).padStart(2, "0")}.csv`), [csv(header), ...body.map(csv)].join("\n") + "\n", "utf8");
}

const unresolved = rows.filter((row) => row[6].startsWith("غير")).length;
const unresolvedScopes: Record<string, number> = {};
for (const row of rows) if (row[6].startsWith("غير")) unresolvedScopes[row[3]] = (unresolvedScopes[row[3]] ?? 0) + 1;
const unresolvedNote = Object.entries(unresolvedScopes).map(([scope, count]) => `\`${scope}\` ${count}`).join(" · ");
const flagged = rows.filter((row) => row[8]).length;
const scopeCounts: Record<string, number> = {};
for (const record of governance.contentRows) scopeCounts[record.scope] = (scopeCounts[record.scope] ?? 0) + 1;

// The B2 table needs lesson-level data, so build it from the lesson sources themselves.
{
  const { academicLessonList } = await import("../src/data/academic-lessons");
  const lines = ["| الدرس | كلمات النموذج / المطلوب | هدف غير متتبَّع | كلمات الاستماع | عناصر نطق | عبارات | قرار المراجع (قبول/رفض/تعديل) |", "|---|---|---|---:|---:|---:|---|"];
  for (const lesson of academicLessonList.filter((item) => item.level === "B2")) {
    const stated = String(lesson.writing.promptDe).match(/(\d{2,3})\s*(?:bis|-|–)\s*(\d{2,3})\s*Wörter/i);
    const modelWords = String(lesson.writing.modelDe).match(/\S+/g)?.length ?? 0;
    const short = stated && (modelWords < Number(stated[1]) || modelWords > Number(stated[2])) ? `**${modelWords}** مقابل ${stated[1]}–${stated[2]}` : `${modelWords} ✓`;
    const orphan = quality.objectives.reviewPromptList.filter((row: string) => row.startsWith(`${lesson.id}#`)).map((row: string) => row.split(" ")[1] ?? row).join(", ") || "—";
    lines.push(`| \`${lesson.id}\` | ${short} | ${orphan} | ${(String(lesson.listening.transcriptDe).match(/\S+/g) ?? []).length} | ${lesson.pronunciation.items.length} | ${lesson.phrases.length} |  |`);
  }
  await writeFile(join(OUT, "b2-lesson-checklist.md"), [
    "# قائمة فحص دروس B2 — يملؤها مراجع بشري مسمّى (لا يملؤها السكربت)",
    "",
    "الأعمدة المرقّمة من `reports/lesson-quality-audit.json`. المطلوب من المراجع: تأكيد أن النموذج لا يعلّم مخالفة المعيار،",
    "وأن كل هدف يُدرَّب ويُقاس، وأن طول الاستماع ودرجة صعوبة النص تناسبان المتعلّم المستقل لا المصحّح الآلي.",
    "",
    ...lines, "",
    `إجمالي الصفوف: ${academicLessonList.filter((item) => item.level === "B2").length}`,
  ].join("\n") + "\n", "utf8");
}

const pendingNouns = (lexical.registryRows?.wordFamilies ?? []).length;
await writeFile(join(OUT, "README.md"), [
  "# حزمة المراجعة البشرية المستقلة — Der Weg nach Berlin",
  "",
  `تاريخ التوليد: ${new Date().toISOString().slice(0, 10)} · مولّدها: \`scripts/generate-human-review-packet.ts\` (\`npm run review:packet\`)`,
  "",
  "- عدد السجلات المحكومة: **3,277** موزّعة على `" + String(sheetCount) + "` أوراق CSV بـ" + SHEET_SIZE + " سطرًا (آخر ورقة أقصر).",
  "- حالة كل سجل اليوم: `automated-validated-independent-review-pending` — أي أن البوابات الآلية تحققت من البنية، ولم يوقّع إنسان على الوصف/المستوى/الحقوق.",
  "- أعمدة القرار (`decision`, `reviewerName`, `reviewDate`, `note`) **فارغة عمدًا**: لا يملؤها سكربت ولا نموذج، والمقبول الوحيد هو توقيع إنسان مسمّى.",
  "- الورقة `b2-lesson-checklist.md` تبدأ من حيث ينتهي القياس الآلي: 24 درس B2 مع أرقام النموذج/الهدف/الاستماع لكل درس.",
  "",
  `## التوزيع حسب النطاق`, "", "| النطاق | العدد |", "|---|---:|",
  ...Object.entries(scopeCounts).map(([scope, count]) => `| \`${scope}\` | ${count} |`),
  "",
  "## ما لا تفعله هذه الحزمة",
  "",
  "- لا تُغيّر أي حالة مراجعة في الشيفرة، ولا تُنتج ادّعاء «مُعتمد/رسمي». بعد توقيع المراجع تُحدَّث السجلات والوثائق في دفعة كود مستقلة.",
  "- لا تُغني عن: صوت بشري للامتحان (0 من 96)، دليل الفونيم (0 من 9 خطوات)، مراجعة سياقية حقوقية (P1-377)، تجربة قارئ الشاشة (P1-331 · P2-264)، تثبيت توزيع نقاط telc.",
  "",
  "## مؤشرات مساعدة",
  "",
  `- صفوف وُسمت بانحراف جودة مقيس: **${flagged}** (من ` + rows.length + `) — لا تعني رفضًا، بل أولوية مراجعة أعلى.`,
  `- صفوف لم يُحلّ نصّها آليًا (معرّفها لا يظهر كنصّ حرفي في src/data لأنها تُولَّد برمجية): **${unresolved}** — التوزيع حسب النطاق: ${unresolvedNote}؛ يقرؤها المراجع من صفحة الدرس/الامتحان أو من عمود sourceFile.`,
  `- عائلات المعجم في سجل الاستراتيجية: ${pendingNouns} (مرشّحات الاسم/الإطار المعلّقة تُراجَع في ملف مستقل).`,
  "",
].join("\n") + "\n", "utf8");

console.log(`Human review packet: ${rows.length} governed records → ${sheetCount} CSV sheets in reports/review-packet/ · ${flagged} quality-flagged · ${unresolved} unresolved-text · ${Object.keys(scopeCounts).length} scopes.`);
