import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { findUnquotedExplanationQuotes } from "@/core/content-validation/explanation-quotes";

/**
 * بوابة متدرّجة (ratchet): كل اقتباس ألماني في شرح لا يرد حرفيًا في الدرس يجب أن يكون مُسجَّلًا
 * في reports/explanation-quote-exceptions.json. لا يُضاف استثناء جديد دون قرار مراجع بشري،
 * ولا يبقى استثناء بعد إصلاحه (فالقائمة تتقلّص فقط).
 */
type ExceptionFile = { policy: string; count: number; entries: { lessonId: string; quote: string; status: string }[] };

const file = JSON.parse(readFileSync("reports/explanation-quote-exceptions.json", "utf8")) as ExceptionFile;
const key = (lessonId: string, quote: string) => `${lessonId}\u0000${quote}`;

describe("explanation German-quote gate", () => {
  const violations = findUnquotedExplanationQuotes(academicLessonList);
  const allowed = new Set(file.entries.map((entry) => key(entry.lessonId, entry.quote)));
  const current = new Set(violations.map((entry) => key(entry.lessonId, entry.quote)));

  it("records the policy and a count that matches its entries", () => {
    expect(file.policy).toBe("explanation-quote-exceptions-v1");
    expect(file.count).toBe(file.entries.length);
    expect(file.entries.every((entry) => entry.status === "unreviewed")).toBe(true);
  });

  it("has no new unlisted quote that is absent from its lesson", () => {
    const fresh = violations.filter((entry) => !allowed.has(key(entry.lessonId, entry.quote)));
    expect(fresh).toEqual([]);
  });

  it("has no stale exception left after the quote is fixed", () => {
    const stale = file.entries.filter((entry) => !current.has(key(entry.lessonId, entry.quote)));
    expect(stale).toEqual([]);
  });
});
