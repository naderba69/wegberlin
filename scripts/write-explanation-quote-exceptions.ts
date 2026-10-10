import { writeFileSync } from "node:fs";
import { academicLessonList } from "../src/data/academic-lessons";
import { findUnquotedExplanationQuotes } from "../src/core/content-validation/explanation-quotes";

// يكتب قائمة الاستثناءات المعروفة. القائمة لا تُوسَّع إلا بقرار مراجع بشري، ويُحذف منها ما أُصلح.
const entries = findUnquotedExplanationQuotes(academicLessonList).map((entry) => ({
  ...entry,
  status: "unreviewed",
}));
const payload = {
  policy: "explanation-quote-exceptions-v1",
  rule: "every German «…» quote in explanationAr must appear verbatim in the same lesson's German content, or be listed here as an unreviewed exception",
  count: entries.length,
  entries,
};
writeFileSync("reports/explanation-quote-exceptions.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(`explanation quote exceptions written: ${entries.length}`);
