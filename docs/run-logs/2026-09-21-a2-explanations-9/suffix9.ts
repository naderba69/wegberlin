// A2 / A1 breakdown of the under-60 shorts by item-kind suffix (_e exercise, _m miniTest,
// _rq/_lq/_w question), computed from the live lesson objects, not from text scanning.
import { academicLessonList as lessons } from "@/data/academic-lessons";
type Any = Record<string, unknown>;
const bucket = new Map<string, { total: number; short: number }>();
const kind = (id: string): string => {
  const m = id.match(/[-_]([a-z]+)(\d+)$/) || id.match(/-([a-z]{1,3})\d+$/);
  return m ? m[1]! : "?";
};
for (const lesson of lessons as unknown as Any[]) {
  const level = String(lesson.level ?? "?");
  if (level !== "A1" && level !== "A2") continue;
  const buckets: Any[][] = [
    (lesson.exercises as Any[]) ?? [],
    ((lesson.reading as Any)?.questions as Any[]) ?? [],
    ((lesson.listening as Any)?.questions as Any[]) ?? [],
    (lesson.miniTest as Any[]) ?? [],
  ];
  for (const items of buckets) {
    for (const it of items) {
      const raw = it.explanationAr;
      if (typeof raw !== "string") continue;
      const id = String(it.id ?? "?");
      const key = `${level}:${kind(id)}`;
      const rec = bucket.get(key) ?? { total: 0, short: 0 };
      rec.total++;
      if (raw.trim().length < 60) rec.short++;
      bucket.set(key, rec);
    }
  }
}
console.log(JSON.stringify(Object.fromEntries([...bucket.entries()].sort().map(([k, v]) => [k, v])), null, 1));
