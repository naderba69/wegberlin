/**
 * مسبار تشغيل P2-22: يبني جلسة ضيف، يقيس الفراغ، يحوّلها، ويطبع الفرق.
 * التشغيل: npx tsx docs/run-logs/2026-09-26-guest-session-profile/measure.ts
 */
import { defaultState } from "@/core/portability/db";
import { RESET_EVIDENCE_FIELDS } from "@/core/state/reset-plan";
import {
  assertGuestIsolation,
  createGuestSession,
  describeGuestSession,
  promoteGuestSession,
} from "@/core/state/guest-session";

const now = new Date("2026-09-26T18:00:00.000Z");
const active = {
  ...defaultState,
  completedLessonIds: ["a1-01", "a1-02"],
  currentLessonId: "a1-03",
  exerciseAttempts: [
    { id: "attempt-1", exerciseId: "a1-01-e1", lessonId: "a1-01", correct: true, createdAt: now.toISOString() },
  ],
} as typeof defaultState;

const created = createGuestSession({ minutes: 30, now, activeState: active });
const isolation = assertGuestIsolation(created.state, active);
const promoted = promoteGuestSession({
  session: created.session,
  guestState: created.state,
  displayName: "ضيف-تحويل",
  now,
  activeState: active,
});

console.log("evidenceFields:", RESET_EVIDENCE_FIELDS.length);
console.log("nonEmptyEvidenceFields:", isolation.nonEmptyEvidenceFields.length);
console.log("inheritedFromActive:", isolation.evidenceInheritedFromActiveProfile);
console.log("expiresAt:", created.session.expiresAt);
console.log("describe:", describeGuestSession(created.session, now));
console.log("promotedStatus:", promoted.session.status);
console.log("classifiedFieldCount:", promoted.plan.classifiedFieldCount);
console.log("evidence before=after:", promoted.plan.evidenceFieldsBefore === promoted.plan.evidenceFieldsAfter);
console.log("activeUntouched:", promoted.activeProfileUntouched);
