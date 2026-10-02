// Selects the next explanation batch FROM THE POPULATION THE AUDIT'S MEDIAN ACTUALLY USES:
// multiple-choice exercises + reading.questions + listening.questions + miniTest (see
// scripts/generate-lesson-quality-audit.ts). The audit's own under-60 list is wider, so a batch
// picked from it can leave the median untouched — measured: batch #6 lifted 24 texts and moved
// only 2 of them inside this population.
import { academicLessonList as lessons } from "@/data/academic-lessons";

type Scored = { id?: string; explanationAr?: string };
const rows: { id: string; len: number; file: string }[] = [];
let population = 0;
for (const lesson of lessons) {
  const items: Scored[] = [
    ...(lesson.exercises.filter((e) => e.type === "multiple-choice") as unknown as Scored[]),
    ...(lesson.reading.questions as unknown as Scored[]),
    ...(lesson.listening.questions as unknown as Scored[]),
    ...((lesson as unknown as { miniTest?: Scored[] }).miniTest ?? []),
  ];
  for (const item of items) {
    const size = String(item.explanationAr ?? "").trim().length;
    population++;
    if (size > 0 && size < 60) rows.push({ id: String(item.id ?? "?"), len: size, file: lesson.id });
  }
}
rows.sort((a, b) => a.len - b.len || a.id.localeCompare(b.id));
const need = Number(process.argv[2] ?? 24);
const stage = process.argv[3] ?? "a2";
const picked = (stage === "any" ? rows : rows.filter((r) => r.id.startsWith(stage))).slice(0, need);
const cap = Math.floor(population / 2); // items allowed to stay <60 while the median is >=60
const distance = Math.max(0, rows.length - cap);
console.log(`median population ${population} · under 60: ${rows.length} (cap ${cap}) · lifting ${picked.length} ⇒ distance to median 60: ${distance} → ${distance - picked.length}`);
for (const r of picked) console.log(`${r.id}\t${r.len}\t(exercises-${r.file}.ts / academic-${r.file}.ts)`);
