import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FEEDBACK_BOILERPLATE_TAILS } from "../src/core/lesson/teaching-contract";

/**
 * عملية تأليف — لا يشغّلها `prebuild` ولا أي بوابة.
 *
 * تحذف جُمل «الذيل العام» التي ألحقها `scripts/repair-lesson-feedback.ts` بآلاف الحقول
 * العربية: كانت سبب تلميح 32% من عناصر المنهج نفس السطر حرفيًّا (ع2 من
 * `docs/run-logs/2026-10-03-learner-teacher-audit/README.md`). الحذف لا يمسّ ما هو مخصوص
 * بالعنصر: سبب الخطأ و«الصيغة المطلوبة هنا هي «X».» تبقَيان كما هما. لا يُضاف نصٌ بديل،
 * لأن إضافة صيغة عامة أخرى كانت ستعيد نفس العيب بثياب مختلفة.
 *
 * التشغيل: `node_modules/.bin/tsx scripts/strip-feedback-boilerplate.ts --apply`
 */
const apply = process.argv.includes("--apply");

/** القائمة المرجعية الواحدة: ما يحظره العقد (`FEEDBACK_BOILERPLATE_TAILS`) يزيله هذا الملف. */
const SENTENCES = FEEDBACK_BOILERPLATE_TAILS.map((tail) => `${tail}.`);

let files = 0, removed = 0;
const perFile = new Map<string, number>();
for (const name of (await readdir("src/data")).filter((name) => /^lessons-[ab][12]-module\d+\.ts$/u.test(name)).sort()) {
  const filename = path.join("src/data", name);
  let source = await readFile(filename, "utf8");
  let hit = 0;
  for (const sentence of SENTENCES) {
    // الصيغة مخزَّنة داخل حقل نصّي JSON: تُحذف مع مسافة واحدة لا أكثر، ثم يُنظَّف الالتصاق.
    for (const variant of [`${sentence} `, ` ${sentence}`, sentence] as const) {
      while (source.includes(variant)) { source = source.replace(variant, ""); hit += 1; }
    }
    source = source.replace(/«\s*\.\s*»/gu, "«»").replace(/ {2,}/gu, " ");
  }
  // لا يُقبل أن يبقى الحقل فارغًا أو بلا جملة بعد الحذف.
  for (const match of source.matchAll(/explanationAr:"([^"]*)"/gu)) {
    if (match[1]!.trim().length < 20) throw new Error(`${name}: explanationAr collapsed below 20 chars near offset ${match.index}: ${match[1]}`);
  }
  if (hit) { perFile.set(name, hit); files += 1; removed += hit; if (apply) await writeFile(filename, source, "utf8"); }
}
console.log(`${apply ? "removed" : "would remove"} ${removed} boilerplate sentences from ${files} files`);
for (const [name, hit] of perFile) console.log(`   ${String(hit).padStart(3)}  ${name}`);
