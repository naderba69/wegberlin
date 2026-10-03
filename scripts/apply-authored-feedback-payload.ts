import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * عملية تأليف — لا يشغّلها `prebuild` ولا أي بوابة.
 *
 * تُطبِّق حِمولة عربية مؤلَّفة يدويًا على حقول `explanationAr` في `src/data/lessons-*.ts`.
 * وُجدت لصفَّين من خطة تدقيق 2026-10-03:
 * - ع4: ستة أزواج يشارك فيها تمرينٌ واختبارٌ قصير النصَّ نفسه داخل الدرس — يُعاد طرفُ
 *   الزوج الثاني بزاوية أخرى (خطأ شائع أو استعمال جديد). حِمولتها:
 *   `docs/run-logs/2026-10-03-learner-teacher-audit/c4-duplicate-payload.json`.
 * - ع2: عناصر صارت دون حدّ الردّ الآلي (60 حرفًا) بعد حذف جُمل الذيل العامّة — تُؤلَّف
 *   لها تتمة مخصوصة بالعنصر، لا صيغة عامة أُخرى. حِمولتها:
 *   `docs/run-logs/2026-10-03-learner-teacher-audit/thin-feedback-payload.json`.
 *
 * الأمان: ترفض الكتابة إن لم يكن النصّ الحالي مطابقًا حرفيًّا لما رصدته الجلسة (لا تسحق
 * تحريرًا لاحقًا)، وتعدّ العنصر «مُطبَّقًا» بصمت إن كان قد صار إلى النصّ الجديد (إعادة
 * تشغيل آمنة). جملة المفتاح «الصيغة المطلوبة هنا هي «X».» تبقى كما هي لأن اتساق
 * المفتاح↔التبرير مفحوص على كل عناصر المنهج.
 *
 * التشغيل: `node_modules/.bin/tsx scripts/apply-authored-feedback-payload.ts --payload <file> --apply`
 */
const argv = process.argv.slice(2);
const payloadPath = argv[argv.indexOf("--payload") + 1];
const apply = argv.includes("--apply");
if (!payloadPath) throw new Error("usage: --payload <json> [--apply]");

const payload = JSON.parse(await readFile(payloadPath, "utf8")) as Record<string, { expect: string; text: string }>;
const ids = new Set(Object.keys(payload));
if (!ids.size) throw new Error(`empty payload: ${payloadPath}`);
for (const [id, entry] of Object.entries(payload)) {
  if (!entry.expect?.trim() || !entry.text?.trim()) throw new Error(`${id}: payload entry needs both expect and text`);
  if (entry.text.trim().length < 60) throw new Error(`${id}: replacement text is below the 60-char feedback floor (${entry.text.trim().length})`);
}

const found = new Set<string>();
let written = 0, already = 0, drift = 0, files = 0;
for (const name of (await readdir("src/data")).filter((name) => /^lessons-[ab][12]-module\d+\.ts$/u.test(name)).sort()) {
  const filename = path.join("src/data", name);
  let source = await readFile(filename, "utf8");
  let changed = false;
  for (const id of ids) {
    // الملف القديم والمولَّد يتباينان في المسافات: `id:"x",` و`id: "x",` — كلاهما مقبول.
    const idMatch = new RegExp(`id:\\s*"${id}"`, "u").exec(source);
    if (!idMatch) continue;
    found.add(id);
    const atField = source.slice(idMatch.index).search(/explanationAr:\s*"/u);
    if (atField < 0) throw new Error(`${id}: no explanationAr literal after its id in ${name}`);
    const open = idMatch.index + atField + (source.slice(idMatch.index + atField).match(/explanationAr:\s*"/u)![0].length) - 1;
    const nextId = source.indexOf('id:', open);
    const close = (() => {
      let i = open + 1;
      while (i < source.length) { if (source[i] === "\\") { i += 2; continue; } if (source[i] === '"') return i; i += 1; }
      throw new Error(`${id}: unterminated explanationAr literal`);
    })();
    if (nextId >= 0 && nextId < close) throw new Error(`${id}: explanationAr literal runs past the next item in ${name}`);
    const current = JSON.parse(source.slice(open, close + 1)) as string;
    const wanted = payload[id]!;
    if (current !== wanted.expect) {
      if (current === wanted.text) { already += 1; continue; }
      drift += 1;
      console.log(`DRIFT ${id} in ${name}\n   expected: ${wanted.expect}\n   actual  : ${current}`);
      continue;
    }
    source = `${source.slice(0, open)}${JSON.stringify(wanted.text)}${source.slice(close + 1)}`;
    written += 1; changed = true;
  }
  if (changed && apply) await writeFile(filename, source, "utf8");
  if (changed) files += 1;
}
const missing = [...ids].filter((id) => !found.has(id));
if (missing.length) throw new Error(`payload ids not found in src/data: ${missing.join(", ")}`);
if (drift) throw new Error(`${drift} item(s) drifted from the recorded text — refusing to write; re-measure before applying`);
console.log(`${apply ? "rewrote" : "would rewrite"} ${written} item(s), ${already} already applied, in ${files} files — ${payloadPath}`);
