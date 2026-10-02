import { describe, expect, it } from "vitest";
import {
  ALIGNMENT_CLAIM_BOUNDARY,
  ALIGNMENT_HONEST_NOTE_AR,
  ALIGNMENT_INDEX_HINT_MAX_CHARS,
  ALIGNMENT_MAP_POLICY,
  ALIGNMENT_OWNERSHIP_REFUSAL_AR,
  ALIGNMENT_OWNERSHIP_STATEMENT_AR,
  ALIGNMENT_PASTED_INDEX_MAX_CHARS,
  ALIGNMENT_SOURCE_LABEL_MAX_CHARS,
  alignmentContactCount,
  alignmentContactReferences,
  alignmentCoverageByLevel,
  alignmentSummary,
  assertAlignmentMapIntegrity,
  buildLearnerAlignmentMap,
  cleanAlignmentIndexHint,
  cleanAlignmentSourceLabel,
  cleanPastedIndex,
  containsReproductionLikeText,
  getAlignmentContact,
  listPastedIndexLines,
  mergeLearnerAlignmentMaps,
  removeAlignmentEntries,
  sanitizeAlignmentMapForStorage,
  updateAlignmentEntry,
} from "@/core/alignment/learner-alignment-map";
import { defaultState } from "@/core/portability/db";

const LESSON = alignmentContactReferences[0].lessonId;
const SECOND = alignmentContactReferences[1].lessonId;

function validDraft(overrides: Partial<Parameters<typeof buildLearnerAlignmentMap>[0]["draft"]> = {}) {
  const now = "2026-09-28T10:00:00.000Z";
  return {
    sourceLabel: "فهرست كتابي الخاص",
    pastedIndex: "الوحدة 3 — ص 42\nالوحدة 4 — ص 55",
    ownershipAcknowledged: true,
    entries: [{ lessonId: LESSON, indexHint: "ص 42، الوحدة 3" }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("learner alignment map — خريطة مواءمة على فهرس يملكه المتعلّم (P2-93)", () => {
  it("builds a map only with the ownership acknowledgement, and refuses without it", () => {
    const ok = buildLearnerAlignmentMap({ draft: validDraft(), acknowledge: true });
    expect(ok.ok).toBe(true);
    if (!ok.ok) throw new Error("expected ok");
    expect(ok.map.policyVersion).toBe(ALIGNMENT_MAP_POLICY);
    expect(ok.map.ownershipAcknowledged).toBe(true);
    expect(ok.map.claimBoundary).toBe(ALIGNMENT_CLAIM_BOUNDARY);
    expect(ok.keptEntryCount).toBe(1);
    // رفضٌ برسالة عربية صريحة، لا صمت.
    const refused = buildLearnerAlignmentMap({ draft: validDraft({ ownershipAcknowledged: false }), acknowledge: false });
    expect(refused.ok).toBe(false);
    if (refused.ok) throw new Error("expected refusal");
    expect(refused.reason).toBe("ownership");
    expect(refused.messageAr).toBe(ALIGNMENT_OWNERSHIP_REFUSAL_AR);
    // الإقرار المزدوج مطلوب: خانة الواجهة **و**الإقرار المرسل مع الطلب.
    const halfAcknowledged = buildLearnerAlignmentMap({ draft: validDraft(), acknowledge: false });
    expect(halfAcknowledged.ok).toBe(false);
  });

  it("refuses pasted source-text contexts by name (no book reproduction), keeps page/unit hints", () => {
    for (const bad of ["نص الكتاب كاملًا من الوحدة 3", "extract via OCR من المسح الضوئي", "full transcript of the unit"]) {
      expect(containsReproductionLikeText(bad), bad).toBe(true);
      const result = buildLearnerAlignmentMap({ draft: validDraft({ pastedIndex: bad }), acknowledge: true });
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.reason).toBe("reproduction");
    }
    // المسموح: أرقام صفحة وأسماء وحدات — هذا هو البند، لا نقل المصدر.
    for (const good of ["الوحدة 3 — ص 42", "Kapitel 5, Seite 88", "Lektion 7 Übung 3"]) {
      expect(containsReproductionLikeText(good), good).toBe(false);
      expect(buildLearnerAlignmentMap({ draft: validDraft({ pastedIndex: good }), acknowledge: true }).ok).toBe(true);
    }
  });

  it("keeps the pasted index out of storage: the sanitizer empties it, the summary says so", () => {
    const built = buildLearnerAlignmentMap({ draft: validDraft(), acknowledge: true });
    if (!built.ok) throw new Error("expected ok");
    expect(built.map.pastedIndex.length).toBeGreaterThan(0);
    const stored = sanitizeAlignmentMapForStorage(built.map);
    expect(stored.pastedIndex).toBe("");
    expect(alignmentSummary(stored).pastedIndexStored).toBe(false);
    expect(alignmentSummary(built.map).pastedIndexStored).toBe(true);
    // الالتزام المكتوب في الواجهة: القيمة المطلوبة «لا»، وهذا هو ما تفحصه الشيفرة أعلاه.
    expect(ALIGNMENT_HONEST_NOTE_AR).toContain("لا تُحفظ منها نسخة من فهرسك");
  });

  it("counts in one direction only: our lessons that carry a learner hint", () => {
    const built = buildLearnerAlignmentMap({
      draft: validDraft({ entries: [{ lessonId: LESSON, indexHint: "ص 42" }, { lessonId: SECOND, indexHint: "الوحدة 9" }] }),
      acknowledge: true,
    });
    if (!built.ok) throw new Error("expected ok");
    const summary = alignmentSummary(built.map);
    expect(summary.contactLessonCount).toBe(alignmentContactCount);
    expect(summary.mappedLessonCount).toBe(2);
    expect(summary.unmappedLessonCount).toBe(alignmentContactCount - 2);
    const total = alignmentCoverageByLevel(built.map).reduce((sum, row) => sum + row.totalCount, 0);
    expect(total).toBe(alignmentContactCount);
    // وليس في أي مكان عدّ من جهة «كتابه»: لا حقل كهذا في الملخّص أصلًا.
    expect(Object.keys(summary).sort()).toEqual(
      ["contactLessonCount", "mappedLessonCount", "mappingLevelCount", "pastedIndexStored", "unmappedLessonCount"],
    );
  });

  it("drops unknown lessons and duplicate rows instead of inventing a match", () => {
    const built = buildLearnerAlignmentMap({
      draft: validDraft({
        entries: [
          { lessonId: LESSON, indexHint: "ص 42" },
          { lessonId: LESSON, indexHint: "ص 43" },
          { lessonId: "lesson-that-does-not-exist", indexHint: "ص 99" },
          { lessonId: SECOND, indexHint: "   " },
        ],
      }),
      acknowledge: true,
    });
    if (!built.ok) throw new Error("expected ok");
    expect(built.keptEntryCount).toBe(1);
    expect(built.droppedEntryCount).toBe(3);
    expect(() => getAlignmentContact("lesson-that-does-not-exist")).toThrow();
  });

  it("cleans control characters without rewriting the learner's own words", () => {
    const raw = "الوحدة\u202E3\u0000 — ص 42\r\n\n\n  الوحدة 4 — ص 55   ";
    const cleaned = cleanPastedIndex(raw);
    expect(cleaned).toBe("الوحدة3 — ص 42\nالوحدة 4 — ص 55");
    expect(listPastedIndexLines(raw)).toEqual(["الوحدة3 — ص 42", "الوحدة 4 — ص 55"]);
    // لا كلمة أُضيفت ولا صُحّحت: النصّ نفسه بحروفه.
    expect(cleaned).toContain("الوحدة");
  });

  it("bounds label, hint and pasted index without inventing values", () => {
    expect(cleanAlignmentSourceLabel("  فهرسى   الشخصي  ")).toBe("فهرسى الشخصي");
    expect(cleanAlignmentSourceLabel("ا".repeat(500)).length).toBe(ALIGNMENT_SOURCE_LABEL_MAX_CHARS);
    expect(cleanAlignmentIndexHint("  ص 42  ")).toBe("ص 42");
    expect(cleanAlignmentIndexHint("ص".repeat(500)).length).toBe(ALIGNMENT_INDEX_HINT_MAX_CHARS);
    const big = Array.from({ length: 600 }, (_, index) => `سطر ${index}`).join("\n");
    expect(cleanPastedIndex(big).length).toBeLessThanOrEqual(ALIGNMENT_PASTED_INDEX_MAX_CHARS);
  });

  it("integrity refuses an unacknowledged map or a map with a missing claim boundary", () => {
    const built = buildLearnerAlignmentMap({ draft: validDraft(), acknowledge: true });
    if (!built.ok) throw new Error("expected ok");
    expect(() => assertAlignmentMapIntegrity(built.map)).not.toThrow();
    expect(() => assertAlignmentMapIntegrity({ ...built.map, ownershipAcknowledged: false as never })).toThrow();
    expect(() => assertAlignmentMapIntegrity({ ...built.map, claimBoundary: "anything" as never })).toThrow();
    expect(() => assertAlignmentMapIntegrity({ ...built.map, entries: [{ lessonId: "ghost", level: "A1", indexHint: "ص 1", updatedAt: "x" }] })).toThrow();
  });

  it("updates and removes a single position, and merges imports by newest row", () => {
    const built = buildLearnerAlignmentMap({ draft: validDraft(), acknowledge: true });
    if (!built.ok) throw new Error("expected ok");
    const later = new Date("2026-09-28T12:00:00.000Z");
    const updated = updateAlignmentEntry(built.map, SECOND, " الوحدة 9 ", later);
    expect(updated.entries).toHaveLength(2);
    expect(updated.entries.find((entry) => entry.lessonId === SECOND)?.indexHint).toBe("الوحدة 9");
    // إدخال فارغ = إزالة الموضع، لا حفظ سطر فارغ.
    const emptied = updateAlignmentEntry(updated, SECOND, "   ", later);
    expect(emptied.entries.map((entry) => entry.lessonId)).toEqual([LESSON]);
    expect(removeAlignmentEntries(updated, [LESSON]).entries.map((entry) => entry.lessonId)).toEqual([SECOND]);

    const older = sanitizeAlignmentMapForStorage({
      ...built.map,
      entries: [{ lessonId: LESSON, level: built.map.entries[0].level, indexHint: "ص 1", updatedAt: "2026-01-01T00:00:00.000Z" }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const merged = mergeLearnerAlignmentMaps(older, built.map);
    expect(merged?.entries.find((entry) => entry.lessonId === LESSON)?.indexHint).toBe("ص 42، الوحدة 3");
    expect(merged?.pastedIndex).toBe("");
    expect(mergeLearnerAlignmentMaps(null, built.map)?.entries).toHaveLength(1);
    expect(mergeLearnerAlignmentMaps(built.map, null)?.entries).toHaveLength(1);
    expect(mergeLearnerAlignmentMaps(null, null)).toBeNull();
  });

  it("ships as an optional, empty, non-gating field that reset preserves", () => {
    // الحقل مشحون فارغًا (اختياري في النوع) ولا يعطي شيئًا لأي حذر مستوى.
    expect(defaultState.learnerAlignmentMap ?? null).toBeNull();
    const built = buildLearnerAlignmentMap({ draft: validDraft(), acknowledge: true });
    if (!built.ok) throw new Error("expected ok");
    // لا شيء داخل الخريطة يشبه نتيجة أو إتقانًا: الحدّ الصادق نصّ واحد للحقيقة.
    expect(built.map.claimBoundary).toBe(ALIGNMENT_CLAIM_BOUNDARY);
    expect(built.map.claimBoundary).not.toMatch(/mastery|passed|score/i);
    expect(ALIGNMENT_HONEST_NOTE_AR).toContain("لا تدخل أي بوابة مستوى أو حساب إتقان");
    expect(ALIGNMENT_OWNERSHIP_STATEMENT_AR).toContain("ملكي");
  });
});
