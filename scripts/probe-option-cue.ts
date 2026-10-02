import { academicLessonList as lessons } from "../src/data/academic-lessons";

/**
 * Dev tool (not part of the app bundle): census of the "longest option is the key" cue.
 * Run: `npx tsx scripts/probe-option-cue.ts [lessonId,lessonId]` — with ids it dumps each offending
 * item (prompt, options with effective lengths, explanation) so distractors can be authored in parallel shape.
 *
 * Original purpose: phase 3 probe. where does the "longest option is the key" cue live?
 * Reports per-lesson and per-source counts, plus the length gap distribution, and can dump
 * the offending items of given lessons so distractors can be rewritten in parallel shape.
 */

type Src = "ex" | "rd" | "ls" | "mt";
type Row = { lessonId: string; level: string; itemId: string; src: Src; prompt: string; promptDe: string; options: string[]; correctIndex: number; lengths: number[]; gap: number; explanationAr: string };

const len = (v: unknown) => String(v ?? "").trim().replace(/[.!?]$/, "").length;
const rows: Row[] = [];
for (const lesson of lessons) {
  type Item = { id: string; options: readonly string[]; correctIndex: number; explanationAr?: string; promptAr?: string; promptDe?: string };
const groups: Array<[Src, Item[]]> = [
    ["ex", lesson.exercises.filter((e) => e.type === "multiple-choice") as unknown as Item[]],
    ["rd", lesson.reading.questions as unknown as Item[]],
    ["ls", lesson.listening.questions as unknown as Item[]],
    ["mt", lesson.miniTest as unknown as Item[]],
  ];
  for (const [src, items] of groups) {
    for (const item of items) {
      const options = item.options.map((o) => String(o));
      const lengths = options.map((o) => len(o));
      const others = lengths.filter((_, i) => i !== item.correctIndex);
      const gap = lengths[item.correctIndex] - Math.max(...others);
      rows.push({
        lessonId: lesson.id,
        level: lesson.level,
        itemId: item.id,
        src,
        prompt: String(item.promptAr ?? "").slice(0, 150), promptDe: String(item.promptDe ?? "").slice(0, 150),
        options,
        correctIndex: item.correctIndex,
        lengths,
        gap,
        explanationAr: String(item.explanationAr ?? ""),
      });
    }
  }
}

const cue = rows.filter((r) => r.gap > 0);
console.log(`items ${rows.length} · cue ${cue.length} (${((100 * cue.length) / rows.length).toFixed(1)}%)`);

const bySrc = new Map<string, [number, number]>();
for (const r of rows) {
  const t = bySrc.get(r.src) ?? [0, 0];
  t[0]++; if (r.gap > 0) t[1]++;
  bySrc.set(r.src, t);
}
for (const [k, [n, c]] of bySrc) console.log(`  src ${k}: items ${n} cue ${c} (${((100 * c) / n).toFixed(1)}%)`);

const byLevel = new Map<string, [number, number]>();
for (const r of rows) {
  const t = byLevel.get(r.level) ?? [0, 0];
  t[0]++; if (r.gap > 0) t[1]++;
  byLevel.set(r.level, t);
}
for (const [k, [n, c]] of byLevel) console.log(`  lvl ${k}: items ${n} cue ${c} (${((100 * c) / n).toFixed(1)}%)`);

const gapDist = new Map<number, number>();
for (const r of cue) {
  const bucket = r.gap >= 16 ? 16 : r.gap;
  gapDist.set(bucket, (gapDist.get(bucket) ?? 0) + 1);
}
console.log("  gap distribution (chars over longest distractor):", JSON.stringify([...gapDist.entries()].sort((a, b) => a[0] - b[0])));

const perLesson = new Map<string, { level: string; items: number; cue: number; cueItems: Row[] }>();
for (const r of rows) {
  const t = perLesson.get(r.lessonId) ?? { level: r.level, items: 0, cue: 0, cueItems: [] };
  t.items++;
  if (r.gap > 0) { t.cue++; t.cueItems.push(r); }
  perLesson.set(r.lessonId, t);
}
const ranked = [...perLesson.entries()].sort((a, b) => b[1].cue - a[1].cue);
console.log("top 26 lessons by cue count:");
for (const [id, t] of ranked.slice(0, 26)) {
  const pct = ((100 * t.cue) / t.items).toFixed(0);
  const medGap = [...t.cueItems].map((x) => x.gap).sort((a, b) => a - b)[Math.floor(t.cueItems.length / 2)] ?? 0;
  console.log(`  ${id} ${t.level} cue ${t.cue}/${t.items} (${pct}%) medianGap ${medGap}`);
}
// Cumulative: how many lessons must be converted to reach 40%?
const target = Math.floor(0.4 * rows.length);
let removed = 0, count = 0;
for (const [, t] of ranked) { removed += t.cue; count++; if (cue.length - removed <= target) break; }
console.log(`to reach <=40%: convert ${count} lessons (removes up to ${removed} cue items, need ${cue.length - target})`);

const dump = process.argv[2];
if (dump) {
  for (const id of dump.split(",")) {
    const t = perLesson.get(id);
    if (!t) { console.log(`!! unknown lesson ${id}`); continue; }
    console.log(`\n===== ${id} (${t.level}) cue ${t.cue}/${t.items}`);
    for (const r of t.cueItems) {
      console.log(`[${r.src}] ${r.itemId} gap ${r.gap} key@${r.correctIndex}`);
      console.log(`  promptAr: ${r.prompt}`);
      console.log(`  promptDe: ${r.promptDe}`);
      r.options.forEach((o, i) => console.log(`   ${i === r.correctIndex ? "KEY" : "   "} ${len(o)}| ${o}`));
      console.log(`  expl: ${r.explanationAr.slice(0, 150)}`);
    }
  }
}
