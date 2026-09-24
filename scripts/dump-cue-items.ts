import { academicLessonList as lessons } from "../src/data/academic-lessons";

/**
 * Dev tool: emit the cue-flagged multiple-choice items of given lessons as JSONL for `scripts/cue-batch.py`.
 * One line per item: {id, key, keyLen, correctIndex, others}. Keys are copied verbatim from the registry so a
 * batch never has to retype them (a retyped key fails the paralleliser's byte-identity guard anyway).
 * Run: npx tsx scripts/dump-cue-items.ts b2-12 > /tmp/b2-12-items.jsonl
 */
const ids = process.argv.slice(2);
const strip = (v: string) => v.trim().replace(/[.!?]+$/, "");

for (const lesson of lessons) {
  if (ids.length && !ids.includes(lesson.id)) continue;
  type Item = { id: string; options: readonly string[]; correctIndex: number };
  const groups: Item[][] = [
    lesson.exercises.filter((e) => e.type === "multiple-choice") as unknown as Item[],
    lesson.reading.questions as unknown as Item[],
    lesson.listening.questions as unknown as Item[],
    lesson.miniTest as unknown as Item[],
  ];
  for (const items of groups) {
    for (const item of items) {
      const options = item.options.map((o) => String(o));
      const lens = options.map((o) => strip(o).length);
      const others = lens.filter((_, i) => i !== item.correctIndex);
      if (lens[item.correctIndex] <= Math.max(...others)) continue;
      console.log(JSON.stringify({
        lessonId: lesson.id,
        id: item.id,
        key: options[item.correctIndex],
        keyLen: lens[item.correctIndex],
        correctIndex: item.correctIndex,
        others: options.filter((_, i) => i !== item.correctIndex),
      }));
    }
  }
}
