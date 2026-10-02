import { academicLessonList as lessons } from "@/data/academic-lessons";

// Replicates the audit's scored-item population exactly (scripts/generate-lesson-quality-audit.ts:41-45).
const lens: number[] = [];
let under60 = 0, under40 = 0;
const perLevel = new Map<string, { n: number; u60: number }>();
for (const lesson of lessons) {
  type Scored = { explanationAr?: string; type?: string };
  const items: Scored[] = [
    ...(lesson.exercises as Scored[]).filter((e) => e.type === "multiple-choice"),
    ...(lesson.reading.questions as Scored[]), ...(lesson.listening.questions as Scored[]),
    ...((lesson as unknown as { miniTest?: Scored[] }).miniTest ?? []),
  ];
  const lvl = lesson.id.split("-")[0].toUpperCase();
  const rec = perLevel.get(lvl) ?? { n: 0, u60: 0 };
  for (const item of items) {
    const size = String(item.explanationAr ?? "").trim().length;
    lens.push(size);
    if (size < 60) { under60++; rec.u60++; }
    if (size < 40) under40++;
    rec.n++;
  }
  perLevel.set(lvl, rec);
}
const n = lens.length;
const sorted = [...lens].sort((a, b) => a - b);
const med = sorted[Math.floor(n / 2)];
const cap = Math.floor(n / 2); // at most `cap` items may stay <60 for the median to reach 60
console.log(`scored items ${n} · median ${med} · <60 ${under60} · <40 ${under40}`);
console.log(`to reach median ≥60: at most ${cap} items under 60 ⇒ lift ${Math.max(0, under60 - cap)} more (batches of 24 ⇒ ${Math.ceil(Math.max(0, under60 - cap) / 24)})`);
for (const [l, r] of [...perLevel.entries()].sort()) console.log(`  ${l}: scored ${r.n} · under60 ${r.u60}`);
