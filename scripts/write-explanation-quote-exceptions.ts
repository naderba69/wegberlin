import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { academicLessonList } from "../src/data/academic-lessons";
import { findUnquotedExplanationQuotes } from "../src/core/content-validation/explanation-quotes";

const FILE = "reports/explanation-quote-exceptions.json";
// يكتب قائمة الاستثناءات المعروفة. القائمة لا تُوسَّع إلا بقرار مراجع بشري، ويُحذف منها ما أُصلح.
// القرار البشري (human-kept) مع سببه يُحفظ عند إعادة الكتابة ولا يُمسح تلقائيًا.
type PriorEntry = { lessonId: string; quote: string; status: string; decision?: string };
const prior = new Map<string, PriorEntry>();
if (existsSync(FILE)) {
  for (const entry of JSON.parse(readFileSync(FILE, "utf8")).entries as PriorEntry[]) {
    prior.set(`${entry.lessonId}\u0000${entry.quote}`, entry);
  }
}
const entries = findUnquotedExplanationQuotes(academicLessonList).map((entry) => {
  const old = prior.get(`${entry.lessonId}\u0000${entry.quote}`);
  if (old?.status === "human-kept" && old.decision) {
    return { ...entry, status: "human-kept", decision: old.decision };
  }
  return { ...entry, status: "unreviewed" };
});
const payload = {
  policy: "explanation-quote-exceptions-v1",
  rule: "every German «…» quote in explanationAr must appear verbatim in the same lesson's German content, or be listed here as an exception: status unreviewed (not yet decided) or human-kept (kept as is by a human decision, with its reason in decision)",
  count: entries.length,
  entries,
};
writeFileSync(FILE, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`explanation quote exceptions written: ${entries.length}`);
