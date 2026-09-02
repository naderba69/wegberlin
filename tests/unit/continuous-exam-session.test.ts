import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { abandonContinuousSession, completeContinuousSession, continuousFocusSession, continuousSessionEffectiveStatus, continuousSessionOwnsPath, continuousSessionRemainingSeconds, continuousTaskDraft, createContinuousExamSession, expireContinuousSession, fullExamDurationSeconds, isContinuousSessionFocusActive, markContinuousTaskComplete, saveContinuousTaskDraft } from "@/core/exams/continuous-session";

const tasksById = Object.fromEntries(allPublishedExamTasks.map((task) => [task.id, task]));
const goethe = fullExamSimulations.find((simulation) => simulation.id === "goethe-b2-full-02")!;
const telc = fullExamSimulations.find((simulation) => simulation.id === "telc-b2-full-02")!;
const startedAt = new Date("2026-08-29T08:00:00.000Z");

describe("continuous full-exam session", () => {
  it("uses one provider-specific central deadline", () => {
    expect(fullExamDurationSeconds(goethe)).toBe(195 * 60);
    expect(fullExamDurationSeconds(telc)).toBe(155 * 60);
    const session = createContinuousExamSession(goethe, startedAt);
    expect(session.currentTaskId).toBe("goethe-b2-full-02-reading-01");
    expect(session.completedTaskIds).toEqual([]);
    expect(session.deadlineAt).toBe("2026-08-29T11:15:00.000Z");
    expect(continuousSessionRemainingSeconds(session, startedAt)).toBe(195 * 60);
  });

  it("accepts only fresh evidence for the current task and advances in order", () => {
    const session = createContinuousExamSession(goethe, startedAt);
    const state = {
      ...defaultState,
      mastery: { ...defaultState.mastery, "exam-target-goethe-b2-full-02-reading-02": 100 },
      examSessions: { [goethe.id]: session },
    };
    const skipped = markContinuousTaskComplete(state, tasksById[session.taskIds[1]], new Date("2026-08-29T08:10:00.000Z"));
    expect(skipped.examSessions[goethe.id].completedTaskIds).toEqual([]);
    const advanced = markContinuousTaskComplete(state, tasksById[session.taskIds[0]], new Date("2026-08-29T08:10:00.000Z"));
    expect(advanced.examSessions[goethe.id].completedTaskIds).toEqual([session.taskIds[0]]);
    expect(advanced.examSessions[goethe.id].currentTaskId).toBe(session.taskIds[1]);
  });

  it("persists a current-task draft and removes it after fresh completion", () => {
    const session = createContinuousExamSession(goethe, startedAt);
    const task = tasksById[session.taskIds[0]];
    const state = { ...defaultState, examSessions: { [goethe.id]: session } };
    const drafted = saveContinuousTaskDraft(state, task, { started: true, answers: { q1: "b" } }, new Date("2026-08-29T08:05:00.000Z"));
    expect(continuousTaskDraft<{ answers: Record<string, string> }>(drafted, task)?.answers.q1).toBe("b");
    const completed = markContinuousTaskComplete(drafted, task, new Date("2026-08-29T08:06:00.000Z"));
    expect(completed.examSessions[goethe.id].taskDrafts[task.id]).toBeUndefined();
  });

  it("derives and persists expiry without extending the deadline", () => {
    const session = createContinuousExamSession(telc, startedAt);
    const afterDeadline = new Date("2026-08-29T10:36:00.000Z");
    expect(continuousSessionEffectiveStatus(session, afterDeadline)).toBe("expired");
    const state = { ...defaultState, examSessions: { [telc.id]: session } };
    const expired = expireContinuousSession(state, telc.id, afterDeadline);
    expect(expired.examSessions[telc.id].status).toBe("expired");
    expect(expired.examSessions[telc.id].deadlineAt).toBe(session.deadlineAt);
  });

  it("finalizes only after every session task has fresh evidence", () => {
    const session = createContinuousExamSession(goethe, startedAt);
    const incomplete = { ...defaultState, examSessions: { [goethe.id]: session } };
    expect(completeContinuousSession(incomplete, goethe.id, startedAt).examSessions[goethe.id].status).toBe("active");
    const completeSession = { ...session, completedTaskIds: [...session.taskIds], currentTaskId: null };
    const completeState = { ...defaultState, examSessions: { [goethe.id]: completeSession } };
    const finalized = completeContinuousSession(completeState, goethe.id, new Date("2026-08-29T10:00:00.000Z"));
    expect(finalized.examSessions[goethe.id].status).toBe("completed");
    expect(finalized.examSessions[goethe.id].completedAt).toBe("2026-08-29T10:00:00.000Z");
  });

  it("activates focus only on routes owned by the live provider-specific session", () => {
    const session = createContinuousExamSession(goethe, startedAt);
    const state = { ...defaultState, examSessions: { [goethe.id]: session } };
    const dashboard = "/exams/goethe-b2/full/goethe-b2-full-02";
    const currentTask = `/exams/goethe-b2/${session.currentTaskId}`;
    expect(isContinuousSessionFocusActive(session, startedAt)).toBe(true);
    expect(continuousSessionOwnsPath(session, dashboard)).toBe(true);
    expect(continuousFocusSession(state, currentTask, startedAt)?.simulationId).toBe(goethe.id);
    expect(continuousFocusSession(state, `/exams/telc-deutsch-b2/${session.currentTaskId}`, startedAt)).toBeUndefined();
    expect(continuousFocusSession(state, "/exams", startedAt)).toBeUndefined();
  });

  it("never applies focus to completed, expired, or abandoned attempts", () => {
    const session = createContinuousExamSession(goethe, startedAt);
    const dashboard = "/exams/goethe-b2/full/goethe-b2-full-02";
    expect(isContinuousSessionFocusActive({ ...session, status: "completed" }, startedAt)).toBe(false);
    expect(isContinuousSessionFocusActive({ ...session, status: "expired" }, startedAt)).toBe(false);
    expect(isContinuousSessionFocusActive({ ...session, status: "abandoned" }, startedAt)).toBe(false);
    expect(continuousFocusSession({ ...defaultState, examSessions: { [goethe.id]: session } }, dashboard, new Date("2026-08-29T11:16:00.000Z"))).toBeUndefined();
  });

  it("abandons explicitly, preserves submitted evidence, and clears only unsubmitted drafts", () => {
    const session = {
      ...createContinuousExamSession(goethe, startedAt),
      completedTaskIds: ["goethe-b2-full-02-reading-01"],
      currentTaskId: "goethe-b2-full-02-reading-02",
      taskDrafts: {
        "goethe-b2-full-02-reading-02": {
          taskId: "goethe-b2-full-02-reading-02",
          kind: "matching" as const,
          payload: { answers: { q1: "a" } },
          savedAt: "2026-08-29T08:20:00.000Z",
        },
      },
    };
    const state = { ...defaultState, mastery: { "exam-target-goethe-b2-full-02-reading-01": 80 }, examSessions: { [goethe.id]: session } };
    const abandoned = abandonContinuousSession(state, goethe.id, new Date("2026-08-29T08:30:00.000Z"));
    expect(abandoned.examSessions[goethe.id]).toMatchObject({ status: "abandoned", currentTaskId: null, taskDrafts: {}, abandonedAt: "2026-08-29T08:30:00.000Z" });
    expect(abandoned.examSessions[goethe.id].deadlineAt).toBe(session.deadlineAt);
    expect(abandoned.examSessions[goethe.id].completedTaskIds).toEqual(session.completedTaskIds);
    expect(abandoned.mastery["exam-target-goethe-b2-full-02-reading-01"]).toBe(80);
  });
});
