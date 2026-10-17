import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { READING_EVIDENCE_REVIEW, readingEvidenceLocators } from "@/data/reading-evidence-locators";
import { authoredReadingEvidence, selectReadingEvidence } from "@/core/lesson/support";

const questions = academicLessonList.flatMap((lesson) => lesson.reading.questions.map((question) => ({ lesson, question })));

describe("authored reading evidence locators (P0-124, ADR-120)", () => {
  it("covers every published reading question and nothing else", () => {
    expect(questions).toHaveLength(288);
    expect(Object.keys(readingEvidenceLocators).sort()).toEqual(questions.map(({ question }) => question.id).sort());
    expect(READING_EVIDENCE_REVIEW.questionCount).toBe(288);
    expect(READING_EVIDENCE_REVIEW.independentHumanReview).toBe(false);
    const counts: Record<string, number> = {};
    for (const locator of Object.values(readingEvidenceLocators)) counts[locator.relation] = (counts[locator.relation] ?? 0) + 1;
    expect(counts).toEqual(READING_EVIDENCE_REVIEW.relationCounts);
  });

  it("quotes only verbatim spans that occur exactly once, in text order", () => {
    for (const { lesson, question } of questions) {
      const locator = readingEvidenceLocators[question.id];
      let previous = -1;
      for (const quote of locator.quotes) {
        const first = lesson.reading.textDe.indexOf(quote);
        expect(first, `${question.id}: span missing`).toBeGreaterThanOrEqual(0);
        expect(lesson.reading.textDe.indexOf(quote, first + 1), `${question.id}: span is ambiguous`).toBe(-1);
        expect(first, `${question.id}: spans out of text order`).toBeGreaterThanOrEqual(previous);
        previous = first;
      }
      if (locator.relation === "combined") expect(locator.quotes.length, question.id).toBeGreaterThanOrEqual(2);
      else expect(locator.quotes.length, question.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("is what the learner sees after committing an answer", () => {
    for (const { lesson, question } of questions) {
      const evidence = selectReadingEvidence(lesson.reading.textDe, question);
      expect(evidence.source).toBe("authored");
      expect(evidence.quotes).toEqual([...readingEvidenceLocators[question.id].quotes]);
      expect(evidence.labelAr.length).toBeGreaterThan(0);
      expect(evidence.labelAr).not.toMatch(/[A-Za-z]/u);
    }
  });

  it("falls back to the lexical selector instead of quoting a span the text no longer contains", () => {
    const { lesson, question } = questions[0];
    expect(authoredReadingEvidence(lesson.reading.textDe.replace(readingEvidenceLocators[question.id].quotes[0], "Der Text wurde geändert."), question.id)).toBeNull();
    expect(authoredReadingEvidence(lesson.reading.textDe, "unknown-question")).toBeNull();
  });

  it("keeps the regression cases the lexical selector got wrong", () => {
    const byId = (id: string) => questions.find(({ question }) => question.id === id)!;
    // a1-10-rq2: the lexical sentence named Samir but not the tomato.
    const tomato = byId("a1-10-rq2");
    expect(selectReadingEvidence(tomato.lesson.reading.textDe, tomato.question).quote).toContain("Tomate");
    // a2-21-rq1: the lexical sentence was the four-week test, not the four weekdays.
    const weekdays = byId("a2-21-rq1");
    expect(selectReadingEvidence(weekdays.lesson.reading.textDe, weekdays.question).quote).toContain("montags, dienstags, donnerstags und samstags");
    // a2-08-rq1: an absent task is proved by the complete task list, not by an unrelated sentence.
    const absent = byId("a2-08-rq1");
    expect(selectReadingEvidence(absent.lesson.reading.textDe, absent.question).kind).toBe("exclusion");
  });
});
