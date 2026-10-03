// @vitest-environment node
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  consumeLearningStateIntegrityNotice,
  defaultState,
  loadInvalidPrimaryStateRecord,
  loadLearningState,
  migrateLearningState,
  saveLearningState,
  STATE_INTEGRITY_ARABIC_NOTICE,
} from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";

/**
 * شريط سلامة الحالة (ADR-106 · م3): حالة مخزّنة لا يقرأها هذا الإصدار يجب أن تُحفَظ كما هي،
 * وأن تُبلِّغ المتعلم، بدل أن تُستبدل بحالة فارغة ثم تُكتَب فوق الأصل.
 * الكتابة تتم عبر `saveLearningState` نفسه: مسار التطبيق بلا تحقق، فيبقى المحاكى هو المخزَّن حرفيًّا.
 */
describe("unreadable stored state is preserved, never silently replaced", () => {
  it("loads defaults but quarantines the payload and tells the learner", async () => {
    const unreadable = { ...defaultState, dueReviews: 41, delayedTransferTasks: [{ policyVersion: "delayed-transfer-task-v0" }] };
    await saveLearningState(unreadable as never);
    const state = await loadLearningState();
    expect(state.dueReviews).toBe(defaultState.dueReviews);
    expect(consumeLearningStateIntegrityNotice()).toBe(STATE_INTEGRITY_ARABIC_NOTICE);
    const quarantined = await loadInvalidPrimaryStateRecord();
    expect(quarantined).not.toBeNull();
    expect(JSON.parse(quarantined!).dueReviews).toBe(41);
    expect(JSON.parse(quarantined!).delayedTransferTasks).toHaveLength(1);
  });

  it("says nothing when the stored state is readable", async () => {
    await saveLearningState({ ...defaultState, dueReviews: 3 });
    const state = await loadLearningState();
    expect(state.dueReviews).toBe(3);
    expect(consumeLearningStateIntegrityNotice()).toBeNull();
  });

  it("consumes the notice once so a reload does not nag forever", async () => {
    // بنية مرفوضة حتى بعد الترحيل: عنصر داخل كائن صارم لا يطابق مخططه.
    await saveLearningState({ ...defaultState, exerciseAttempts: [{ nope: true }] } as never);
    await loadLearningState();
    expect(consumeLearningStateIntegrityNotice()).toBe(STATE_INTEGRITY_ARABIC_NOTICE);
    expect(consumeLearningStateIntegrityNotice()).toBeNull();
  });

  it("defaults any foreign schema version instead of rejecting the whole profile", () => {
    const future = { ...defaultState, schemaVersion: 4, aFieldFromANewerBuild: { anything: true } };
    const parsed = learningStateSchema.safeParse(migrateLearningState(future));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.schemaVersion).toBe(3);
      expect(parsed.data.completedLessonIds).toEqual(defaultState.completedLessonIds);
    }
  });
});
