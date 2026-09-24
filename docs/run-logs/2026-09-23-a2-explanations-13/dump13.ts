// Dumps the 24 batch-13 items with the context each explanation must quote from.
// Ids come from docs/run-logs/2026-09-21-a2-explanations-13/pick_median.ts 24 a2 (distance 342 → 318).
import { academicLessonList as lessons } from "@/data/academic-lessons";

const IDS = [
  "a2-23-m1",
  "a2-23-rq3",
  "a2-24-rq1",
  "a2-04-rq3",
  "a2-05-rq3",
  "a2-07-rq2",
  "a2-09-rq3",
  "a2-11-lq2",
  "a2-11-m5",
  "a2-16-m1",
  "a2-18-m4",
  "a2-19-m2",
  "a2-01-rq3",
  "a2-03-lq1",
  "a2-13-rq3",
  "a2-14-rq3",
  "a2-15-lq3",
  "a2-19-m5",
  "a2-21-m4",
  "a2-21-m5",
  "a2-22-lq3",
  "a2-24-lq2",
  "a2-01-lq1",
  "a2-02-rq2",
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
