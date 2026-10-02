// Dumps the 24 batch-12 items with the context each explanation must quote from.
// Ids come from docs/run-logs/2026-09-21-a2-explanations-9/pick_median.ts 24 a2 (distance 342 → 318).
import { academicLessonList as lessons } from "@/data/academic-lessons";

const IDS = [
  "a2-02-m2", "a2-02-m3", "a2-03-m1", "a2-05-m2", "a2-06-m4", "a2-07-lq1",
  "a2-09-lq1", "a2-11-rq1", "a2-13-m2", "a2-14-lq1", "a2-15-m2", "a2-15-rq2",
  "a2-16-lq3", "a2-16-rq2", "a2-20-rq2", "a2-21-rq1", "a2-23-m4", "a2-01-m4",
  "a2-04-m1", "a2-04-m5", "a2-04-rq2", "a2-06-m1", "a2-16-m5", "a2-17-m1",
];

type Item = {
  id?: string;
  promptDe?: string;
  promptAr?: string;
  options?: string[];
  correctIndex?: number;
  explanationAr?: string;
  passageDe?: string;
  passageAr?: string;
  transcriptDe?: string;
};

for (const lesson of lessons) {
  type Bag = { items: Item[]; kind: string; src?: string; srcAr?: string };
  const bags: Bag[] = [
    { items: lesson.exercises.filter((e) => e.type === "multiple-choice") as unknown as Item[], kind: "exercise" },
    { items: lesson.reading.questions as unknown as Item[], kind: "reading", src: (lesson.reading as { textDe?: string }).textDe, srcAr: (lesson.reading as { textAr?: string }).textAr },
    { items: lesson.listening.questions as unknown as Item[], kind: "listening", src: (lesson.listening as { transcriptDe?: string }).transcriptDe },
    { items: ((lesson as unknown as { miniTest?: Item[] }).miniTest ?? []), kind: "miniTest" },
  ];
  for (const bag of bags) {
    for (const item of bag.items) {
      if (!item?.id || !IDS.includes(item.id)) continue;
      const opts = (item.options ?? []).map((o, i) => `${i === item.correctIndex ? "*" : " "}${o}`).join(" | ");
      console.log(`\n### ${item.id} [${bag.kind}] old=${String(item.explanationAr ?? "").trim().length}`);
      console.log(`PA: ${item.promptAr ?? ""}`);
      console.log(`DE: ${item.promptDe ?? ""}`);
      console.log(`OP: ${opts}`);
      console.log(`OLD: ${item.explanationAr ?? ""}`);
      if (bag.kind === "reading" && bag.src) console.log(`READING: ${bag.src}`);
      if (bag.kind === "reading" && bag.srcAr) console.log(`READING-AR: ${bag.srcAr}`);
      if (bag.kind === "listening" && bag.src) console.log(`TRANSCRIPT: ${bag.src}`);
    }
  }
}
