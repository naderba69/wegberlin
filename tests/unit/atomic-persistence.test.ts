// @vitest-environment node
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { commitImportedStateAtomic, defaultState, ensureProfileRegistry, listLearningProfiles, loadLearningState, loadMedia, loadRestorePoint, saveLearningState } from "@/core/portability/db";

const stateA = { ...defaultState, dueReviews: 2, updatedAt: "2026-09-02T08:00:00.000Z" };
const stateB = { ...defaultState, dueReviews: 19, completedLessonIds: ["a1-01"], updatedAt: "2026-09-02T09:00:00.000Z" };

async function deleteTestDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("der-weg-nach-berlin");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

describe("atomic IndexedDB persistence under injected interruption", () => {
  it("rolls back save/import writes at every fault point, then commits state, profile, media, and restore point together", async () => {
    await deleteTestDatabase();
    await saveLearningState(stateA);
    await ensureProfileRegistry(stateA);

    await expect(saveLearningState(stateB, { faultAt: "after-primary-state" })).rejects.toBeTruthy();
    expect((await loadLearningState()).dueReviews).toBe(2);

    for (const faultAt of ["after-primary-state", "after-restore-point", "after-media"] as const) {
      await expect(commitImportedStateAtomic({
        state: stateB,
        targetProfileId: "primary",
        media: [{ id: `audio-${faultAt}`, blob: new Blob([faultAt], { type: "audio/webm" }) }],
        restorePoint: new Blob([`restore-${faultAt}`]),
        faultAt,
      })).rejects.toBeTruthy();
      expect((await loadLearningState()).dueReviews).toBe(2);
      expect(await loadMedia(`audio-${faultAt}`)).toBeNull();
      expect(await loadRestorePoint()).toBeNull();
    }

    const restorePoint = new Blob(["state-a-archive"], { type: "application/octet-stream" });
    await commitImportedStateAtomic({
      state: stateB,
      targetProfileId: "primary",
      media: [{ id: "audio-success", blob: new Blob(["voice"], { type: "audio/webm" }) }],
      restorePoint,
    });
    expect((await loadLearningState()).dueReviews).toBe(19);
    expect(await loadMedia("audio-success")).toBeInstanceOf(Blob);
    expect(await loadRestorePoint()).toBeInstanceOf(Blob);

    const importedProfile = { ...stateB, profile: { name:"Imported",targetExam:"goethe-b2" as const,dailyMinutes:30 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"A1" as const,createdAt:"2026-09-02T10:00:00Z" }, updatedAt:"2026-09-02T10:00:00Z" };
    await commitImportedStateAtomic({ state: importedProfile, targetProfileId: "profile-imported", media: [], restorePoint, currentState: stateB });
    expect((await loadLearningState()).profile?.name).toBe("Imported");
    expect((await listLearningProfiles()).map((profile) => profile.id).sort()).toEqual(["primary", "profile-imported"]);
  });
});
