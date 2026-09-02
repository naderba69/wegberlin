import { describe, expect, it } from "vitest";
import { bilingualSearchEntries, searchBilingual } from "@/core/search/bilingual-search";
import { curriculum } from "@/data/curriculum";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";

describe("local bilingual search", () => {
  it("builds a unique A1-B2 index with every lesson and exam task", () => {
    expect(new Set(bilingualSearchEntries.map((entry) => entry.id)).size).toBe(bilingualSearchEntries.length);
    expect(bilingualSearchEntries.length).toBe(3_080);
    expect(new Set(bilingualSearchEntries.map((entry) => entry.level))).toEqual(new Set(["A1", "A2", "B1", "B2"]));
    for (const lesson of curriculum.filter((item) => item.status === "published")) {
      expect(bilingualSearchEntries.some((entry) => entry.id === `lesson:${lesson.id}`)).toBe(true);
    }
    for (const task of allPublishedExamTasks) {
      expect(bilingualSearchEntries.some((entry) => entry.id === `exam:${task.id}` && entry.provider === task.provider)).toBe(true);
    }
  });

  it("finds German terms in titles and context", () => {
    const results = searchBilingual("Heizung");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(({ entry }) => `${entry.titleDe} ${entry.contextDe}`.includes("Heizung"))).toBe(true);
  });

  it("normalizes German spelling without requiring umlauts or ß", () => {
    const results = searchBilingual("strasse");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(({ entry }) => /Straße|Straßen/.test(`${entry.titleDe} ${entry.contextDe}`))).toBe(true);
  });

  it("normalizes Arabic diacritics and alef variants", () => {
    const plain = searchBilingual("التدفئة").map(({ entry }) => entry.id);
    const marked = searchBilingual("التَّدْفِئَة").map(({ entry }) => entry.id);
    expect(plain.length).toBeGreaterThan(0);
    expect(marked.slice(0, 5)).toEqual(plain.slice(0, 5));
  });

  it("applies source and level filters without cross-provider mutation", () => {
    const libraryA2 = searchBilingual("Termin", { source: "library", level: "A2" });
    expect(libraryA2.length).toBeGreaterThan(0);
    expect(libraryA2.every(({ entry }) => entry.source === "library" && entry.level === "A2")).toBe(true);
    const exam = searchBilingual("Lesen", { source: "exam", level: "B2" });
    expect(exam.length).toBeGreaterThan(0);
    expect(exam.every(({ entry }) => entry.source === "exam" && Boolean(entry.provider))).toBe(true);
  });
});
