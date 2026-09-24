import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Deterministic answer-position rebalancer for published lesson MCQ items.
 *
 * Why: `reports/lesson-quality-audit.json` measured A 466 / B 665 / C 114 / D 5 of 1,250 scored items,
 * and 91 of 96 lessons never used position D. A key that sits in a predictable place is not a measurement
 * of knowledge, and it inflates every mastery/readiness signal derived from these items.
 *
 * Guards (a rotation must never damage an item):
 *  - items whose Arabic explanation points at a position or a letter («الموضع الثاني», «Erläuterung A» …) are skipped;
 *  - items whose options carry explicit ordinal/temporal order («Zuerst», «Erstens» …) or are pure numbers/dates are skipped;
 *  - only the correct string is moved; distractors keep their relative order, so no option text is rewritten.
 *
 * Modes: default = dry report · `--write` = rewrite files. Verified afterwards by `npm run lesson:quality:audit`.
 */
const root = process.cwd();
const write = process.argv.includes("--write");

const positional = /(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])/i;
const ordered = /(^|\s)(Zuerst|Dann|Danach|Erstens|Zweitens|Drittens|Als Erstes|Am (Anfang|Ende)|Schritt\s*\d)/i;
const numericish = (values: string[]) => values.every((value) => /^[\d.\-\s:°]+(.*?Wörter|Tage|Minuten|Euro)?$/i.test(value.trim()));

function scanArray(text: string, from: number) {
  const open = text.indexOf("[", from);
  if (open < 0) return null;
  let depth = 0, index = open, quoted = false, escaped = false;
  for (; index < text.length; index++) {
    const ch = text[index];
    if (quoted) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === '"') quoted = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { quoted = true; continue; }
    if (ch === "[" || ch === "{" || ch === "(") depth++;
    else if (ch === "]" || ch === "}" || ch === ")") { depth--; if (depth === 0) break; }
  }
  if (depth !== 0) return null;
  return { start: open, end: index, body: text.slice(open + 1, index) };
}

function splitItems(body: string) {
  const parts: string[] = []; let current = "", quoted = false, escaped = false, depth = 0;
  for (const ch of body) {
    if (quoted) { current += ch; if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === '"') quoted = false; continue; }
    if (ch === "\\") { current += ch; escaped = true; continue; }
    if (ch === '"') { current += ch; quoted = true; continue; }
    if (ch === "[" || ch === "{" || ch === "(") depth++;
    if (ch === "]" || ch === "}" || ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(current); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}
const unquote = (raw: string) => raw.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/\\n/g, "\n");
const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`;

type Plan = { file: string; optionsStart: number; optionsEnd: number; newOptions: string; indexPos: number; indexLen: number; newIndex: number; id: string };

function hash(value: string) { let h = 2166136261; for (const ch of value) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619); } return Math.abs(h); }

const files = (await readdir(join(root, "src", "data"))).filter((name) => /^lessons-[a-z0-9]+-module\d+\.ts$/.test(name)).sort();
const counts = [0, 0, 0, 0];
let seen = 0, skipped = 0;
const skipReasons: Record<string, number> = {};
const perFile = new Map<string, Plan[]>();
const lessonCounts = new Map<string, number[]>();

for (const name of files) {
  const path = join(root, "src", "data", name);
  const text = await readFile(path, "utf8");
  const plans: Plan[] = [];
  let cursor = 0;
  for (;;) {
    const at = text.indexOf("options:", cursor);
    if (at < 0) break;
    const array = scanArray(text, at);
    if (!array) { cursor = at + 8; continue; }
    const after = text.slice(array.end, array.end + 140);
    const indexMatch = after.match(/correctIndex:\s*([0-3])/);
    const tail = text.slice(Math.max(0, at - 700), array.start);
    const idAt = tail.lastIndexOf('id: "');
    const itemId = idAt < 0 ? `${name}#item${plans.length}` : tail.slice(idAt + 6, tail.indexOf('"', idAt + 6));
    cursor = array.end;
    if (!indexMatch) continue;
    seen++;
    const items = splitItems(array.body).map(unquote);
    const currentIndex = Number(indexMatch[1]);
    const explanation = text.slice(array.end, array.end + 400).match(/explanationAr:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
    const lessonKey = itemId.split(/-(?:e\d+|rq\d+|lq\d+|mq\d+|m\d+|q\d+|w\d+|s\d+|card)/)[0] || itemId;
    const reason = items.length !== 4 ? "options≠4" : ordered.test(items.join(" §")) ? "ordered-options" : numericish(items) ? "numeric-options" : positional.test(explanation.replace(/\\"/g, '"')) ? "positional-explanation" : "";
    if (reason) {
      skipped++; skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
      const lesson = lessonCounts.get(lessonKey) ?? [0, 0, 0, 0];
      lesson[currentIndex]++; lessonCounts.set(lessonKey, lesson); counts[currentIndex]++;
      continue;
    }
    const lesson = lessonCounts.get(lessonKey) ?? [0, 0, 0, 0];
    const low = Math.min(...lesson);
    const candidates = [0, 1, 2, 3].filter((position) => lesson[position] === low);
    const target = candidates[hash(itemId + ":" + name) % candidates.length];
    lesson[target]++; lessonCounts.set(lessonKey, lesson); counts[target]++;
    const correct = items[currentIndex];
    const distractors = items.filter((_, position) => position !== currentIndex);
    const next = [...distractors.slice(0, target), correct, ...distractors.slice(target)];
    if (next[0] === items[0] && next[1] === items[1] && next[2] === items[2] && next[3] === items[3] && target === currentIndex) continue;
    plans.push({ file: name, optionsStart: array.start, optionsEnd: array.end, newOptions: `[${next.map(quote).join(", ")}]`, indexPos: array.end + (indexMatch.index ?? 0), indexLen: indexMatch[0].length, newIndex: target, id: itemId });
  }
  if (plans.length) perFile.set(name, plans);
}

let changedItems = 0;
for (const [name, plans] of perFile) {
  const path = join(root, "src", "data", name);
  let text = await readFile(path, "utf8");
  for (const plan of [...plans].sort((a, b) => b.optionsStart - a.optionsStart)) {
    text = text.slice(0, plan.indexPos)
      + text.slice(plan.indexPos, plan.indexPos + plan.indexLen).replace(/correctIndex:\s*[0-3]/, `correctIndex: ${plan.newIndex}`)
      + text.slice(plan.indexPos + plan.indexLen);
    text = text.slice(0, plan.optionsStart) + plan.newOptions + text.slice(plan.optionsEnd + 1);
    changedItems++;
  }
  if (write) await writeFile(path, text, "utf8");
}
const total = counts.reduce((a, b) => a + b, 0);
console.log(`${write ? "Rebalanced" : "Dry run"}: ${changedItems} items re-ordered across ${perFile.size} files · ${seen} MCQ items seen · ${skipped} kept in place ${JSON.stringify(skipReasons)}.`);
console.log(`New position mix: A ${counts[0]} (${(100 * counts[0] / total).toFixed(1)}%) · B ${counts[1]} (${(100 * counts[1] / total).toFixed(1)}%) · C ${counts[2]} (${(100 * counts[2] / total).toFixed(1)}%) · D ${counts[3]} (${(100 * counts[3] / total).toFixed(1)}%).`);
if (!write) console.log("Pass --write to apply. Nothing was changed.");
