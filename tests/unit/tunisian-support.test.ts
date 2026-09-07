import { describe, expect, it } from "vitest";
import {
  TUNISIAN_SUPPORT_NOTES,
  TUNISIAN_SUPPORT_VERSION,
  tunisianNoteCountForLesson,
  tunisianNotesFor,
} from "@/core/arabic/tunisian-support";
import { academicLessonList } from "@/data/academic-lessons";

const block = (titleDe: string, extra = "") => ({
  titleDe,
  titleAr: "عنوان القاعدة",
  formula: extra,
  explanationAr: "شرح القاعدة بالعربية",
});

describe("P0-373 + P0-376: authored Tunisian support that actually changes the content", () => {
  it("keeps every note a structured contrast, not a translation or a judgement", () => {
    expect(TUNISIAN_SUPPORT_NOTES.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(TUNISIAN_SUPPORT_NOTES.map((note) => note.id));
    expect(ids.size).toBe(TUNISIAN_SUPPORT_NOTES.length);
    for (const note of TUNISIAN_SUPPORT_NOTES) {
      expect(note.keywordsDe.length, note.id).toBeGreaterThan(0);
      expect(note.titleAr.length, note.id).toBeGreaterThan(10);
      expect(note.standardAr.length, note.id).toBeGreaterThan(20);
      expect(note.tunisianAr.length, note.id).toBeGreaterThan(20);
      expect(note.whyAr.length, note.id).toBeGreaterThan(40);
      // الشرح التونسي ليس نسخة من الفصحى، وليس حكمًا على لهجة المتعلّم.
      expect(note.tunisianAr, note.id).not.toBe(note.standardAr);
      expect(note.whyAr, note.id).toMatch(/الألمانية|الألماني/);
      expect(TUNISIAN_SUPPORT_VERSION).toBe("tunisian-support-v1");
    }
  });

  it("matches notes to the structure actually being taught, not to the whole lesson", () => {
    expect(tunisianNotesFor(block("Dativ und Akkusativ")).map((note) => note.id)).toContain("preposition-cases");
    expect(tunisianNotesFor(block("Nebensätze mit weil")).map((note) => note.id)).toContain("subordinate-verb-final");
    expect(tunisianNotesFor(block("Perfekt")).map((note) => note.id)).toContain("spoken-past");
    expect(tunisianNotesFor(block("Trennbare Verben")).map((note) => note.id)).toContain("separable-verbs");
    expect(tunisianNotesFor(block("Aussprache der Umlaute")).map((note) => note.id)).toContain("umlaut-and-ch");
    // درس لا علاقة له بالبنية لا يأخذ شرحها: المطابقة على البنية لا على المجال.
    expect(tunisianNotesFor(block("Begrüßung und Vorstellung"))).toEqual([]);
  });

  it("covers the authored curriculum with a stable, non-trivial footprint", () => {
    let lessonsWithSupport = 0;
    let totalNotes = 0;
    for (const lesson of academicLessonList) {
      const count = tunisianNoteCountForLesson(lesson.theory);
      expect(count).toBeLessThanOrEqual(TUNISIAN_SUPPORT_NOTES.length);
      if (count > 0) lessonsWithSupport += 1;
      totalNotes += count;
    }
    // أغلب الدروس المنشورة تجد فيها شرحًا واحدًا على الأقل، ولا درسًا يُغرق بكل الشروح.
    expect(lessonsWithSupport).toBeGreaterThan(academicLessonList.length / 2);
    expect(totalNotes).toBeGreaterThan(academicLessonList.length);
    expect(totalNotes).toBeLessThan(academicLessonList.length * TUNISIAN_SUPPORT_NOTES.length);
  });
});
