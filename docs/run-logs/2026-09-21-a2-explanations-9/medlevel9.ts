import { academicLessonList as lessons } from "@/data/academic-lessons";
type Any = Record<string, unknown>;
const per = new Map<string, { short: number; total: number }>();
for (const lesson of lessons as unknown as Any[]) {
  const level = String(lesson.level ?? "?");
  const rec = per.get(level) ?? { short: 0, total: 0 };
  const items: Any[] = [
    ...(((lesson.exercises as Any[]) ?? []).filter((e) => e.type === "multiple-choice")),
    ...(((lesson.reading as Any)?.questions as Any[]) ?? []),
    ...(((lesson.listening as Any)?.questions as Any[]) ?? []),
    ...((lesson.miniTest as Any[]) ?? []),
  ];
  for (const it of items) {
    const raw = it.explanationAr;
    if (typeof raw !== "string") continue;
    rec.total++;
    if (raw.trim().length < 60) rec.short++;
  }
  per.set(level, rec);
}
let st = 0, to = 0;
for (const [k, v] of [...per.entries()].sort()) { st += v.short; to += v.total; console.log(`${k}: short=${v.short} total=${v.total}`); }
console.log(`SUM short=${st} total=${to} · batches to median 60 = ${Math.ceil((st - Math.floor(to / 2)) / 24)}`);
