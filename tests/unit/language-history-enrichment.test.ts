import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { defaultState } from "@/core/portability/db";
import { RESET_FIELD_POLICIES, classifyResetCoverage } from "@/core/state/reset-plan";
import {
  DEFAULT_LANGUAGE_HISTORY_ENABLED,
  DEFAULT_LANGUAGE_HISTORY_PREFERENCES,
  LANGUAGE_HISTORY_BOUNDARY,
  LANGUAGE_HISTORY_BOUNDARY_AR,
  LANGUAGE_HISTORY_MAX_PER_SESSION,
  LANGUAGE_HISTORY_POLICY,
  LanguageHistoryGuardError,
  assertLanguageHistoryIntegrity,
  getLanguageHistoryNotesForLesson,
  getLanguageHistoryNotesForLevel,
  getLanguageHistorySource,
  languageHistoryClaimStrengthLabelsAr,
  languageHistoryNoteCount,
  languageHistoryNotes,
  languageHistoryPreferencesAreDefault,
  languageHistorySources,
  languageHistorySummary,
  selectLanguageHistorySession,
} from "@/core/vocabulary/language-history-enrichment";

const lessonById = new Map(academicLessonList.map((lesson) => [lesson.id, lesson] as const));

describe("language history enrichment — إثراء اختياري موثّق (P2-119)", () => {
  it("ships off by default and renders nothing until the learner opts in", () => {
    expect(DEFAULT_LANGUAGE_HISTORY_ENABLED).toBe(false);
    expect(defaultState.languageHistoryPreferences).toEqual(DEFAULT_LANGUAGE_HISTORY_PREFERENCES);
    expect(defaultState.languageHistoryPreferences.enabled).toBe(false);
    expect(languageHistoryPreferencesAreDefault(defaultState.languageHistoryPreferences)).toBe(true);
    const off = selectLanguageHistorySession({ enabled: false, level: "B1" });
    expect(off.noteIds).toEqual([]);
    expect(off.truncated).toBe(false);
    // ولا يُخفي التعطيل ملاحظاتٍ مصنَّفة خطأً: الجرد كامل لكن العرض صفر.
    expect(languageHistoryNotes.length).toBeGreaterThan(0);
    // الحارس يرفض عرض ملاحظات بينما الإثراء معطّل.
    expect(() => assertLanguageHistoryIntegrity({ enabled: false, selection: { noteIds: ["lh-kaffee"], truncated: false } })).toThrowError(LanguageHistoryGuardError);
  });

  it("caps a session and follows the learner's level only", () => {
    const on = selectLanguageHistorySession({ enabled: true, level: "A2" });
    expect(on.noteIds.length).toBeLessThanOrEqual(LANGUAGE_HISTORY_MAX_PER_SESSION);
    for (const noteId of on.noteIds) {
      const note = languageHistoryNotes.find((entry) => entry.noteId === noteId)!;
      expect(note.level).toBe("A2");
    }
    const seen = selectLanguageHistorySession({ enabled: true, level: "A2", alreadySeen: on.noteIds });
    for (const noteId of seen.noteIds) expect(on.noteIds).not.toContain(noteId);
    // وبلا حدّ: كل ملاحظات المستوى نفسه، بلا تسرّب من مستوى آخر.
    const all = selectLanguageHistorySession({ enabled: true, level: "A2", limit: 99 });
    expect(all.noteIds.length).toBe(getLanguageHistoryNotesForLevel("A2").length);
  });

  it("documents every note: declared source, published lesson, level match", () => {
    for (const note of languageHistoryNotes) {
      expect(() => getLanguageHistorySource(note.sourceKey)).not.toThrow();
      expect(note.historyAr.trim().length).toBeGreaterThan(40);
      expect(note.level).toBe(["A1", "A2", "B1", "B2"].includes(note.level) ? note.level : "A1");
      expect(note.lessonIds.length).toBeGreaterThan(0);
      for (const lessonId of note.lessonIds) {
        const lesson = lessonById.get(lessonId);
        expect(lesson, lessonId).toBeTruthy();
        // الملاحظة تُربط بدرسٍ منشور **بمستواها**: لا إثراء B2 على درس A1.
        expect(lesson!.level, lessonId).toBe(note.level);
        expect(getLanguageHistoryNotesForLesson(lessonId)).toContainEqual(note);
      }
    }
    expect(languageHistoryNotes.length).toBe(languageHistoryNoteCount);
    // كل مرجع معلن مستعمل مرّة على الأقل — لا مرجع للزينة.
    for (const source of languageHistorySources) {
      expect(languageHistoryNotes.some((note) => note.sourceKey === source.key), source.key).toBe(true);
    }
  });

  it("marks claims honestly and keeps one refuted folk etymology on record", () => {
    const strengths = new Set(languageHistoryNotes.map((note) => note.claimStrength));
    expect(strengths.has("documented")).toBe(true);
    expect(strengths.has("refuted-folk-etymology")).toBe(true);
    const refuted = languageHistoryNotes.find((note) => note.claimStrength === "refuted-folk-etymology")!;
    expect(refuted.headword).toBe("Alkohol");
    expect(refuted.historyAr).toContain("دحض");
    expect(languageHistoryClaimStrengthLabelsAr["refuted-folk-etymology"]).toContain("شائعة");
    for (const note of languageHistoryNotes) expect(languageHistoryClaimStrengthLabelsAr[note.claimStrength].length).toBeGreaterThan(4);
  });

  it("carries the honesty boundary in text and in the exported policy", () => {
    expect(LANGUAGE_HISTORY_BOUNDARY).toBe("enrichment-only-no-grading-no-mastery-no-network");
    expect(LANGUAGE_HISTORY_BOUNDARY_AR).toContain("لا يمنح درجة");
    expect(LANGUAGE_HISTORY_BOUNDARY_AR).toContain("بوابة مستوى");
    expect(LANGUAGE_HISTORY_POLICY).toBe("optional-language-history-enrichment-v1");
    // ولا وعد بما لا نقدر عليه: لا «تعلّم أسرع» ولا نصّ رسمي.
    expect(LANGUAGE_HISTORY_BOUNDARY_AR).not.toMatch(/رسمي|مضمون/);
  });

  it("is authored data: no network, no storage, no lookup at display time", async () => {
    const source = await import("node:fs").then((fs) => fs.readFileSync("src/core/vocabulary/language-history-enrichment.ts", "utf8"));
    expect(source).not.toMatch(/\bfetch\(|XMLHttpRequest|localStorage|indexedDB|getItem\(/);
    // المصادر المعلنة روابطُ وصفية فقط، لا نداءات.
    for (const item of languageHistorySources) if (item.url) expect(item.url.startsWith("https://")).toBe(true);
  });

  it("never touches mastery, evidence or any gate surface", async () => {
    const state = defaultState;
    // لا حقل إتقان/دليل مشتقّ من الإثراء، والتفعيل تغيير تفضيل واحد فقط.
    expect(Object.keys(state).filter((key) => key.toLowerCase().includes("languagehistory"))).toEqual(["languageHistoryPreferences"]);
    expect(state.masteryEvidenceEvents).toEqual([]);
    const moduleSource = await import("node:fs").then((fs) => fs.readFileSync("src/core/vocabulary/language-history-enrichment.ts", "utf8"));
    // نفحص **الوصول الفعلي** لا ورود الكلمة في نصّ الحدّ الصادق نفسه.
    expect(moduleSource).not.toMatch(/\.mastery\b|masteryDelta|masteryEvidence|completedLessonIds|examSessions|dueReviews|mastery:/);
    // والحدّ مكتوب صريحًا داخل الوحدة كي لا يُنسى.
    expect(moduleSource).toContain("no-grading-no-mastery-no-network");
  });

  it("survives reset as a learner preference and keeps the classification complete (68 fields)", () => {
    const row = RESET_FIELD_POLICIES.find((entry) => String(entry.field) === "languageHistoryPreferences")!;
    expect(row.bucket).toBe("settings");
    const coverage = classifyResetCoverage(defaultState);
    expect(coverage.totalClassified).toBe(68);
    expect(coverage.unclassifiedFields).toEqual([]);
    expect({ cleared: coverage.progressCleared, evidence: coverage.evidencePreserved, settings: coverage.settingsPreserved, identity: coverage.identityPreserved })
      .toEqual({ cleared: 19, evidence: 27, settings: 12, identity: 10 });
  });

  it("parses a legacy state written before this field existed", async () => {
    const { learningStateSchema } = await import("@/core/portability/schema");
    const legacy = { ...defaultState } as Record<string, unknown>;
    delete legacy.languageHistoryPreferences;
    const parsed = learningStateSchema.parse(legacy);
    expect(parsed.languageHistoryPreferences.enabled).toBe(false);
    expect(parsed.languageHistoryPreferences.policyVersion).toBe(LANGUAGE_HISTORY_POLICY);
  });

  it("reports the measured inventory without rounding up", () => {
    const summary = languageHistorySummary();
    expect(summary.notes).toBe(languageHistoryNotes.length);
    expect(summary.sources).toBe(languageHistorySources.length);
    expect(summary.disputed).toBe(languageHistoryNotes.filter((note) => note.claimStrength !== "documented").length);
    expect(summary.byLevel.reduce((sum, row) => sum + row.notes, 0)).toBe(summary.notes);
    expect(summary.defaultEnabled).toBe(false);
  });
});
