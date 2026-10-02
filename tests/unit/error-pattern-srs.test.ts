// @vitest-environment node
import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { captureLessonError } from "@/core/errors/capture";
import { classifyErrorPattern, errorPrerequisite, ERROR_PATTERN_CLASSIFICATION_POLICY } from "@/core/errors/pattern";
import { applySuccessfulErrorRepair, recordFailedErrorRepair } from "@/core/errors/remediation";
import { exportArchive, importArchive } from "@/core/portability/backup";
import { defaultState } from "@/core/portability/db";
import { mergeLearningStates } from "@/core/portability/merge";
import { learningStateSchema } from "@/core/portability/schema";
import { confirmedErrorSrsCards, PERSONAL_ERROR_SRS_POLICY } from "@/core/srs/error-cards";
import { buildDueReviewQueue, eligibleReviewCards } from "@/core/srs/review-queue";
import { applyReviewGrade, retentionEvidence } from "@/core/srs/review-session";
import type { ErrorRecord } from "@/types/learning";

const lesson = academicLessons["a1-01"];
const exercise = lesson.exercises[0];
const base: ErrorRecord = {
  id:"lesson-error:a1-01:test", type:"grammar", wrong:"Wie du heißt?", correct:"Wie heißt du?", explanationAr:"رتب الفعل.", occurrences:1,
  lastSeenAt:"2026-09-01T08:00:00Z", sourceLessonId:"a1-01", sourceExerciseId:"test", patternClassification:"possible-slip",
  classificationPolicyVersion:ERROR_PATTERN_CLASSIFICATION_POLICY, resolved:false, repairCount:0,
};

function confirmed(id = base.id): ErrorRecord {
  return { ...base, id, resolved:true, repairCount:2, confirmedAt:"2026-09-03T08:00:00Z", lastRepairedAt:"2026-09-03T08:00:00Z" };
}

describe("confidence-aware error patterns and confirmed-error SRS", () => {
  it("distinguishes possible slips, emerging patterns, and misconception risk deterministically", () => {
    expect(classifyErrorPattern(1, 0, 0)).toBe("possible-slip");
    expect(classifyErrorPattern(2, 0, 0)).toBe("emerging-pattern");
    expect(classifyErrorPattern(3, 0, 0)).toBe("misconception-risk");
    expect(classifyErrorPattern(1, 1, 0)).toBe("misconception-risk");
    expect(classifyErrorPattern(1, 0, 2)).toBe("misconception-risk");
  });

  it("captures source and optional learner confidence without changing correctness", () => {
    const wrongAnswer = exercise.type === "multiple-choice" ? exercise.options[exercise.correctIndex === 0 ? 1 : 0] : "falsch";
    const [error] = captureLessonError([], lesson, exercise.id, wrongAnswer, new Date("2026-09-07T08:00:00Z"), "high");
    expect(error).toMatchObject({ sourceLessonId:lesson.id, sourceExerciseId:exercise.id, lastConfidence:"high", highConfidenceWrongCount:1, patternClassification:"misconception-risk", classificationPolicyVersion:ERROR_PATTERN_CLASSIFICATION_POLICY });
  });

  it("increments high-confidence wrong evidence inside one stable error record", () => {
    const wrongAnswer = exercise.type === "multiple-choice" ? exercise.options[exercise.correctIndex === 0 ? 1 : 0] : "falsch";
    const once = captureLessonError([], lesson, exercise.id, wrongAnswer, new Date("2026-09-07T08:00:00Z"), "high");
    const twice = captureLessonError(once, lesson, exercise.id, wrongAnswer, new Date("2026-09-07T09:00:00Z"), "low");
    expect(twice).toHaveLength(1);
    expect(twice[0]).toMatchObject({ occurrences:2, highConfidenceWrongCount:1, lastConfidence:"low", patternClassification:"misconception-risk" });
  });

  it("routes to the source rule only after two failed repair attempts", () => {
    const first = recordFailedErrorRepair(base, new Date("2026-09-07T08:00:00Z"));
    const second = recordFailedErrorRepair(first, new Date("2026-09-07T08:05:00Z"));
    expect(errorPrerequisite(first)).toBeNull();
    expect(errorPrerequisite(second)).toMatchObject({ lessonId:"a1-01", stageIndex:4, href:"/lernen/a1-01" });
    expect(second.patternClassification).toBe("misconception-risk");
  });

  it("creates cards only after delayed repair confirmation and deduplicates equivalent errors", () => {
    const untreated = confirmed("z-error");
    delete untreated.confirmedAt;
    untreated.resolved = false;
    expect(confirmedErrorSrsCards([untreated])).toEqual([]);
    const cards = confirmedErrorSrsCards([confirmed("z-error"), confirmed("a-error")]);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id:"personal-error-card:a-error", back:"Wie heißt du?" });
    expect(cards[0].tags).toContain(PERSONAL_ERROR_SRS_POLICY);
  });

  it("adds a confirmed personal error to SRS without requiring lesson completion", () => {
    const state = { ...defaultState, errors:[confirmed()] };
    expect(eligibleReviewCards(state)).toHaveLength(1);
    expect(buildDueReviewQueue(state, new Date("2026-09-07T08:00:00Z"))[0].card.tags).toContain("personal-error");
  });

  it("keeps personal-error review mastery at zero even after a due delayed success", () => {
    const start = new Date("2026-09-07T08:00:00Z");
    const state = { ...defaultState, errors:[confirmed()] };
    const first = buildDueReviewQueue(state, start)[0];
    const initial = applyReviewGrade(state, first, 5, start, "event-initial");
    const dueAt = new Date(initial.nextReview.nextReviewDate);
    const delayedQueue = buildDueReviewQueue(initial.state, dueAt)[0];
    const delayed = applyReviewGrade(initial.state, delayedQueue, 5, dueAt, "event-delayed");
    expect(delayed.event).toMatchObject({ evidenceScope:"personal-error-remediation", masteryDelta:0, evidenceKind:"delayed" });
    expect(delayed.state.mastery).toEqual(defaultState.mastery);
    expect(retentionEvidence(delayed.state).successfulDelayedCards).toBe(0);
  });

  it("merges the strongest classification and monotonic counters", () => {
    const current = { ...defaultState, errors:[{ ...base, occurrences:2, failedRepairCount:1, patternClassification:"emerging-pattern" as const }], updatedAt:"2026-09-07T08:00:00Z" };
    const incoming = { ...defaultState, errors:[{ ...base, occurrences:1, highConfidenceWrongCount:1, patternClassification:"misconception-risk" as const }], updatedAt:"2026-09-07T09:00:00Z" };
    expect(mergeLearningStates(current,incoming).errors[0]).toMatchObject({ occurrences:2, failedRepairCount:1, highConfidenceWrongCount:1, patternClassification:"misconception-risk" });
  });

  it("keeps new provenance schema-valid while accepting legacy error records", () => {
    expect(learningStateSchema.parse({ ...defaultState, errors:[base] }).errors[0].classificationPolicyVersion).toBe(ERROR_PATTERN_CLASSIFICATION_POLICY);
    const legacy = { id:"legacy",type:"grammar",wrong:"x",correct:"y",explanationAr:"z",occurrences:1,lastSeenAt:"2026-09-01T00:00:00Z" };
    expect(learningStateSchema.parse({ ...defaultState, errors:[legacy] }).errors[0].patternClassification).toBeUndefined();
  });

  it("round-trips confidence, classification, failed repairs, and personal review scope through DWNB", async () => {
    const failed = recordFailedErrorRepair(recordFailedErrorRepair({ ...confirmed(), lastConfidence:"high", highConfidenceWrongCount:1 }), new Date("2026-09-07T08:00:00Z"));
    const event = { id:"review-personal",cardId:`personal-error-card:${base.id}`,lessonId:"a1-01",grade:5,evidenceKind:"delayed" as const,evidenceScope:"personal-error-remediation" as const,scheduledFor:"2026-09-06T00:00:00Z",reviewedAt:"2026-09-07T08:00:00Z",masteryDelta:0 };
    const archive = await exportArchive({ ...defaultState, errors:[failed], reviewEvents:[event] }, { includeMedia:false });
    const imported = await importArchive(archive);
    expect(imported.state.errors[0]).toMatchObject({ lastConfidence:"high", highConfidenceWrongCount:1, failedRepairCount:2, patternClassification:"misconception-risk" });
    expect(imported.state.reviewEvents[0].evidenceScope).toBe("personal-error-remediation");
  });

  it("still confirms a repair only through the existing initial-plus-delayed success path", () => {
    const first = applySuccessfulErrorRepair(base, new Date("2026-09-01T12:00:00Z"));
    const done = applySuccessfulErrorRepair(first, new Date("2026-09-02T08:00:00Z"));
    expect(done).toMatchObject({ resolved:true, repairCount:2, confirmedAt:"2026-09-02T08:00:00.000Z" });
  });
});
