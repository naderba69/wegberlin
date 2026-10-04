import { describe, expect, it } from "vitest";
import type { LearningState } from "@/types/learning";
import { defaultState } from "@/core/portability/db";
import { RESET_EVIDENCE_FIELDS, RESET_FIELD_POLICIES } from "@/core/state/reset-plan";
import {
  GUEST_MAX_MINUTES,
  GUEST_PROMOTION_REFUSAL_AR,
  GUEST_SESSION_POLICY,
  assertGuestIsolation,
  clampGuestMinutes,
  createGuestSession,
  createGuestState,
  describeGuestSession,
  guestSessionExpired,
  promoteGuestSession,
} from "@/core/state/guest-session";

const NOW = new Date("2026-09-26T18:00:00.000Z");

function activeProfileWithEvidence(): LearningState {
  return {
    ...defaultState,
    profile: {
      name: "المتعلّم الأساسي",
      targetExam: "telc-deutsch-b2",
      dailyMinutes: 30,
      arabicSupport: "tunisian-supported",
      currentLevel: "B1",
      createdAt: "2026-08-01T00:00:00.000Z",
    },
    exerciseAttempts: [
      {
        id: "attempt-1",
        exerciseId: "a1-01-e1",
        lessonId: "a1-01",
        correct: true,
        createdAt: "2026-09-20T10:00:00.000Z",
        answer: "Guten Tag",
      },
    ] as unknown as LearningState["exerciseAttempts"],
    completedLessonIds: ["a1-01", "a1-02"],
    currentLessonId: "a1-03",
    updatedAt: "2026-09-25T00:00:00.000Z",
  } as LearningState;
}

describe("guest session — جلسة ضيف معزولة بلا وراثة أدلّة", () => {
  it("starts from the shipped defaults with every evidence field empty, never from the active profile", () => {
    const active = activeProfileWithEvidence();
    const created = createGuestSession({ minutes: 30, now: NOW, activeState: active });
    const guest = created.state as unknown as Record<string, unknown>;
    const nonEmpty = RESET_EVIDENCE_FIELDS.filter((field) => {
      const value = guest[field as string];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
    });
    expect(nonEmpty).toEqual([]);
    expect(guest.profile).toMatchObject({ name: "ضيف" });
    expect(created.boundary).toMatchObject({
      evidenceInheritedFromActiveProfile: false,
      writtenToActiveProfile: false,
      awardsMastery: false,
      sendsToNetwork: false,
    });
    expect(created.session).toMatchObject({
      policyVersion: GUEST_SESSION_POLICY,
      status: "temporary",
      countsTowardLevelGate: false,
      countsAsStudyEvidence: false,
    });
  });

  it("proves isolation structurally against a profile that does carry evidence", () => {
    const active = activeProfileWithEvidence();
    const guest = createGuestState(NOW);
    const isolation = assertGuestIsolation(guest, active);
    expect(isolation.evidenceInheritedFromActiveProfile).toBe(false);
    expect(isolation.nonEmptyEvidenceFields).toEqual([]);
    // والملف النشط نفسه ما زال يحمل أدلّته: الجلسة لم تسحبه.
    expect(active.exerciseAttempts.length).toBe(1);
  });

  it("clamps the guest window to ten minutes minimum and 240 maximum — no eternal guest", () => {
    expect(clampGuestMinutes(5)).toBe(10);
    expect(clampGuestMinutes(9_999)).toBe(GUEST_MAX_MINUTES);
    expect(clampGuestMinutes(Number.NaN, 30)).toBe(30);
    const long = createGuestSession({ minutes: 10_000, now: NOW });
    const short = createGuestSession({ minutes: 1, now: NOW });
    expect(long.session.expiresAt).toBe("2026-09-26T22:00:00.000Z");
    expect(short.session.expiresAt).toBe("2026-09-26T18:10:00.000Z");
  });

  it("reports expiry without deleting anything, and its description never claims a gate or mastery", () => {
    const created = createGuestSession({ minutes: 15, now: NOW });
    expect(guestSessionExpired(created.session, new Date("2026-09-26T18:14:00.000Z"))).toBe(false);
    expect(guestSessionExpired(created.session, new Date("2026-09-26T18:15:00.000Z"))).toBe(true);
    const text = describeGuestSession(created.session, new Date("2026-09-26T18:20:00.000Z"));
    expect(text).toContain("انتهى الوقت");
    expect(text).not.toContain("مستوى");
    expect(text).not.toContain("بوابة مفتوحة");
  });

  it("keeps the guest state on the same 66-field classified shape — zero unclassified fields", () => {
    const guest = createGuestState(NOW);
    const classified = new Set(RESET_FIELD_POLICIES.map((row) => String(row.field)));
    const unclassified = Object.keys(guest as unknown as Record<string, unknown>).filter(
      (key) => !classified.has(key),
    );
    expect(unclassified).toEqual([]);
    expect(classified.size).toBe(66);
  });

  it("refuses promotion without a real name while leaving the guest session intact", () => {
    const created = createGuestSession({ minutes: 30, now: NOW });
    expect(() =>
      promoteGuestSession({
        session: created.session,
        guestState: created.state,
        displayName: " ",
        now: NOW,
      }),
    ).toThrowError(GUEST_PROMOTION_REFUSAL_AR);
    expect(created.session.status).toBe("temporary");
  });

  it("promotes to a permanent local profile with evidence byte-for-byte and the source profile untouched", () => {
    const active = activeProfileWithEvidence();
    const created = createGuestSession({ minutes: 60, now: NOW, activeState: active });
    const activeBefore = JSON.stringify(active);
    const result = promoteGuestSession({
      session: created.session,
      guestState: created.state,
      displayName: "ضيف دائم",
      now: new Date("2026-09-26T18:30:00.000Z"),
      activeState: active,
    });
    expect(result.session.status).toBe("promoted");
    expect(result.session.displayNameAr).toBe("ضيف دائم");
    expect(result.state.profile?.name).toBe("ضيف دائم");
    expect(result.plan.classifiedFieldCount).toBe(66);
    expect(result.plan.evidenceFieldsAfter).toBe(result.plan.evidenceFieldsBefore);
    expect(result.activeProfileUntouched).toBe(true);
    expect(JSON.stringify(active)).toBe(activeBefore);
    // ملف دائم جديد: له وقته الخاص لا وقت الملف النشط.
    expect(result.state.profile?.createdAt).not.toBe(active.profile?.createdAt);
    expect(result.state.profile?.createdAt).toBe("2026-09-26T18:00:00.000Z");
  });

  it("promotion is explicit only: nothing in the module writes into another profile", () => {
    const created = createGuestSession({ minutes: 30, now: NOW });
    const source = JSON.stringify(created.state);
    promoteGuestSession({
      session: created.session,
      guestState: created.state,
      displayName: "ضيف دائم",
      now: NOW,
    });
    // الحالة المُدخلة لم تُعدَّل في مكانها: التحويل يبني نسخة جديدة.
    expect(JSON.stringify(created.state)).toBe(source);
  });
});
