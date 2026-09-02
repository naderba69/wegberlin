import type { FullExamSimulation, PublishedTargetedExamSimulation } from "@/types/exam";
import type { FullExamSession, LearningState } from "@/types/learning";
import { fullExamSimulations } from "@/data/full-exam-simulations";

export function fullExamTaskIds(simulation: FullExamSimulation) {
  return simulation.modules.flatMap((module) => module.taskIds);
}

export function fullExamDurationSeconds(simulation: FullExamSimulation) {
  return simulation.modules.reduce((sum, module) => sum + module.officialMinutes, 0) * 60;
}

export function createContinuousExamSession(simulation: FullExamSimulation, now = new Date()): FullExamSession {
  const taskIds = fullExamTaskIds(simulation);
  return {
    simulationId: simulation.id,
    provider: simulation.provider,
    mode: "continuous-timed",
    status: "active",
    startedAt: now.toISOString(),
    deadlineAt: new Date(now.getTime() + fullExamDurationSeconds(simulation) * 1000).toISOString(),
    taskIds,
    completedTaskIds: [],
    currentTaskId: taskIds[0] ?? null,
    taskDrafts: {},
  };
}

export function continuousSessionRemainingSeconds(session: FullExamSession, now = new Date()) {
  return Math.max(0, Math.ceil((Date.parse(session.deadlineAt) - now.getTime()) / 1000));
}

export function continuousSessionEffectiveStatus(session: FullExamSession, now = new Date()): FullExamSession["status"] {
  if (session.status === "active" && continuousSessionRemainingSeconds(session, now) === 0) return "expired";
  return session.status;
}

export function isContinuousSessionFocusActive(session: FullExamSession, now = new Date()) {
  return session.mode === "continuous-timed" && continuousSessionEffectiveStatus(session, now) === "active";
}

export function continuousSessionOwnsPath(session: FullExamSession, pathname: string) {
  const dashboardPath = `/exams/${session.provider}/full/${session.simulationId}`;
  if (pathname === dashboardPath) return true;
  return session.taskIds.some((taskId) => pathname === `/exams/${session.provider}/${taskId}`);
}

export function continuousFocusSession(state: LearningState, pathname: string, now = new Date()) {
  return Object.values(state.examSessions).find((session) =>
    isContinuousSessionFocusActive(session, now) && continuousSessionOwnsPath(session, pathname),
  );
}

export function findContinuousSessionForTask(state: LearningState, taskId: string) {
  return Object.values(state.examSessions).find((session) =>
    (session.status === "active" || session.status === "expired") && session.taskIds.includes(taskId),
  );
}

export function continuousTaskDraft<T>(state: LearningState, task: PublishedTargetedExamSimulation): T | undefined {
  const session = findContinuousSessionForTask(state, task.id);
  const draft = session?.taskDrafts[task.id];
  return draft?.kind === task.kind ? draft.payload as T : undefined;
}

export function saveContinuousTaskDraft(state: LearningState, task: PublishedTargetedExamSimulation, payload: Record<string, unknown>, now = new Date()): LearningState {
  const session = findContinuousSessionForTask(state, task.id);
  if (!session || continuousSessionEffectiveStatus(session, now) !== "active" || session.currentTaskId !== task.id) return state;
  return {
    ...state,
    examSessions: {
      ...state.examSessions,
      [session.simulationId]: {
        ...session,
        taskDrafts: {
          ...session.taskDrafts,
          [task.id]: { taskId: task.id, kind: task.kind, payload, savedAt: now.toISOString() },
        },
      },
    },
  };
}

export function clearContinuousTaskDraft(state: LearningState, task: PublishedTargetedExamSimulation): LearningState {
  const session = findContinuousSessionForTask(state, task.id);
  if (!session?.taskDrafts[task.id]) return state;
  const taskDrafts = { ...session.taskDrafts };
  delete taskDrafts[task.id];
  return {
    ...state,
    examSessions: { ...state.examSessions, [session.simulationId]: { ...session, taskDrafts } },
  };
}

export function markContinuousTaskComplete(state: LearningState, task: PublishedTargetedExamSimulation, now = new Date()): LearningState {
  const session = findContinuousSessionForTask(state, task.id);
  if (!session || continuousSessionEffectiveStatus(session, now) !== "active" || session.currentTaskId !== task.id) return state;
  const completedTaskIds = session.completedTaskIds.includes(task.id)
    ? session.completedTaskIds
    : [...session.completedTaskIds, task.id];
  const currentTaskId = session.taskIds.find((id) => !completedTaskIds.includes(id)) ?? null;
  const taskDrafts = { ...session.taskDrafts };
  delete taskDrafts[task.id];
  return {
    ...state,
    examSessions: {
      ...state.examSessions,
      [session.simulationId]: { ...session, completedTaskIds, currentTaskId, taskDrafts },
    },
  };
}

export function expireContinuousSession(state: LearningState, simulationId: string, now = new Date()): LearningState {
  const session = state.examSessions[simulationId];
  if (!session || continuousSessionEffectiveStatus(session, now) !== "expired" || session.status === "expired") return state;
  return {
    ...state,
    examSessions: { ...state.examSessions, [simulationId]: { ...session, status: "expired" } },
  };
}

export function completeContinuousSession(state: LearningState, simulationId: string, now = new Date()): LearningState {
  const session = state.examSessions[simulationId];
  if (!session || session.completedTaskIds.length !== session.taskIds.length) return state;
  return {
    ...state,
    examSessions: {
      ...state.examSessions,
      [simulationId]: { ...session, status: "completed", currentTaskId: null, completedAt: now.toISOString() },
    },
  };
}

/**
 * Ends a rehearsal without deleting already-submitted learning evidence.
 * Unsubmitted task drafts are deliberately cleared so an abandoned attempt
 * can never be resumed accidentally. The UI deletes any temporary draft media.
 */
export function abandonContinuousSession(state: LearningState, simulationId: string, now = new Date()): LearningState {
  const session = state.examSessions[simulationId];
  if (!session || continuousSessionEffectiveStatus(session, now) !== "active") return state;
  return {
    ...state,
    examSessions: {
      ...state.examSessions,
      [simulationId]: {
        ...session,
        status: "abandoned",
        currentTaskId: null,
        taskDrafts: {},
        abandonedAt: now.toISOString(),
      },
    },
  };
}

export function simulationForSession(session: FullExamSession) {
  return fullExamSimulations.find((simulation) => simulation.id === session.simulationId);
}
