// Wider population than the median one: every item that carries an explanationAr anywhere in the
// academic lesson data. Prints the numbers the docs pin (under-60 count, totals, medians, per level).
import { academicLessonList as lessons } from "@/data/academic-lessons";

type Any = Record<string, unknown>;
const lens: number[] = [];
const perLevel = new Map<string, { short: number; total: number }>();
for (const lesson of lessons as unknown as Any[]) {
  const level = String(lesson.level ?? "?");
  const rec = perLevel.get(level) ?? { short: 0, total: 0 };
  const buckets: Any[][] = [
    ((lesson.exercises as Any[]) ?? []),
    (((lesson.reading as Any)?.questions as Any[]) ?? []),
    (((lesson.listening as Any)?.questions as Any[]) ?? []),
    ((lesson.miniTest as Any[]) ?? []),
  ];
  for (const items of buckets) {
    for (const it of items) {
      const raw = it.explanationAr;
      if (typeof raw !== "string") continue;
      const size = raw.trim().length;
      lens.push(size);
      rec.total++;
      if (size < 60) rec.short++;
    }
  }
  perLevel.set(level, rec);
}
lens.sort((a, b) => a - b);
const median = (arr: number[]) => (arr.length ? (arr.length % 2 ? arr[(arr.length - 1) / 2] : Math.round((arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2)) : 0);
const under60 = lens.filter((n) => n < 60).length;
const under40 = lens.filter((n) => n < 40).length;
console.log(JSON.stringify({
  totalItems: lens.length,
  under60,
  under40,
  allMedianChars: median(lens),
  shortPopulation: under60,
  perLevel: Object.fromEntries([...perLevel.entries()].sort().map(([k, v]) => [k, v])),
}, null, 1));
