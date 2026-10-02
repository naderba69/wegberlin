import type { DelayedTransferTaskRecord, LearningState } from "@/types/learning";

/**
 * مهامّ النقل المؤجّل (ADR-086).
 *
 * الدرس الذي يُتعلَّم اليوم يُختبر بإنتاجٍ جديد بعد أيام، لا بنفس تمرين الأمس. المهمّة تُشتَقّ
 * من إنتاجٍ حقيقي موجود في الحالة (كتابة · وساطة · كلام)، ويُسجَّل الإنتاج الجديد كـ**دليل نقل**
 * فقط: لا يُحرّك الإتقان، ولا يُفتح به مستوى، ولا يُمنح به امتحان.
 */
export const DELAYED_TRANSFER_POLICY = "delayed-transfer-task-v1" as const;
export const DELAYED_TRANSFER_MIN_DAYS = 3;
export const DELAYED_TRANSFER_MIN_ANSWER_CHARS = 60;
export const DELAYED_TRANSFER_EVIDENCE_BOUNDARY = "transfer-evidence-no-mastery-no-gate" as const;

export type DelayedTransferSourceKind = "writing-submission" | "mediation-submission" | "speaking-attempt";

export type DelayedTransferCandidate = {
  sourceKind: DelayedTransferSourceKind;
  sourceId: string;
  sourceCreatedAt: string;
  level: "A1" | "A2" | "B1" | "B2";
  promptAr: string;
};

function writingCandidates(state: LearningState): DelayedTransferCandidate[] {
  return state.writingSubmissions
    .filter((submission) => submission.status !== "draft" && submission.wordCount > 0)
    .map((submission) => ({
      sourceKind: "writing-submission" as const,
      sourceId: submission.id,
      sourceCreatedAt: submission.createdAt,
      level: state.profile?.currentLevel ?? "A1",
      promptAr: `أعد إنتاج أفكار «${submission.taskId}» في نصٍّ جديد بجمل مختلفة عن نصّك الأول.`,
    }));
}

function mediationCandidates(state: LearningState): DelayedTransferCandidate[] {
  return state.mediationSubmissions.filter((submission) => submission.status !== "draft" && submission.responseDe.trim().length > 0).map((submission) => ({
    sourceKind: "mediation-submission" as const,
    sourceId: submission.id,
    sourceCreatedAt: submission.createdAt,
    level: state.profile?.currentLevel ?? "A1",
    promptAr: "أعد صياغة رسالة وساطة جديدة لنفس الموقف بمعلومات مختلفة عن نصّك السابق.",
  }));
}

function speakingCandidates(state: LearningState): DelayedTransferCandidate[] {
  return state.speakingAttempts
    .filter((attempt) => (attempt.transcriptConfirmation?.confirmedText ?? attempt.reflection).trim().length > 0)
    .map((attempt) => ({
      sourceKind: "speaking-attempt" as const,
      sourceId: attempt.id,
      sourceCreatedAt: attempt.createdAt,
      level: state.profile?.currentLevel ?? "A1",
      promptAr: "أعد التحدّث عن الموقف نفسه بمفردات جديدة وبترتيب مختلف عن محاولتك الأولى.",
    }));
}

function sourceCandidates(state: LearningState): DelayedTransferCandidate[] {
  return [...writingCandidates(state), ...mediationCandidates(state), ...speakingCandidates(state)].sort(
    (left, right) => Date.parse(right.sourceCreatedAt) - Date.parse(left.sourceCreatedAt),
  );
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function alreadyScheduled(state: LearningState, candidate: DelayedTransferCandidate) {
  return (state.delayedTransferTasks ?? []).some(
    (task) => task.sourceKind === candidate.sourceKind && task.sourceId === candidate.sourceId,
  );
}

/**
 * يُجدول مهمّة نقل واحدة للإنتاج الأحدث غير المُجدوَل. لا يُجدوَل شيء بلا إنتاج حقيقي:
 * الحالة الفارغة تُعيد `null` بدل مهمّة عامة.
 */
export function scheduleDelayedTransferTask(
  state: LearningState,
  options: { now?: Date; minDays?: number } = {},
): { record: DelayedTransferTaskRecord; candidate: DelayedTransferCandidate } | null {
  const now = options.now ?? new Date();
  const minDays = options.minDays ?? DELAYED_TRANSFER_MIN_DAYS;
  const candidate = sourceCandidates(state).find((item) => !alreadyScheduled(state, item));
  if (!candidate) return null;
  const createdAt = now.toISOString();
  return {
    candidate,
    record: {
      id: `delayed-transfer:${candidate.sourceKind}:${candidate.sourceId}`,
      policyVersion: DELAYED_TRANSFER_POLICY,
      sourceKind: candidate.sourceKind,
      sourceId: candidate.sourceId,
      sourceCreatedAt: candidate.sourceCreatedAt,
      scheduledFor: addDays(createdAt, minDays),
      taskKind: "fresh-production",
      promptAr: candidate.promptAr,
      level: candidate.level,
      status: "scheduled",
      evidenceBoundary: DELAYED_TRANSFER_EVIDENCE_BOUNDARY,
      createdAt,
    },
  };
}

export function scheduleDelayedTransferTasksForState(state: LearningState, options: { now?: Date } = {}): LearningState {
  let next = state;
  for (let guard = 0; guard < 50; guard += 1) {
    const scheduled = scheduleDelayedTransferTask(next, options);
    if (!scheduled) break;
    next = { ...next, delayedTransferTasks: [...(next.delayedTransferTasks ?? []), scheduled.record] };
  }
  return next;
}

export type DelayedTransferTaskView = {
  record: DelayedTransferTaskRecord;
  status: "scheduled" | "due" | "completed";
  daysRemaining: number;
  labelAr: string;
};

export function listDelayedTransferTasks(state: LearningState, now: Date = new Date()): DelayedTransferTaskView[] {
  return (state.delayedTransferTasks ?? [])
    .map((record) => {
      const dueAt = Date.parse(record.scheduledFor);
      const daysRemaining = Math.ceil((dueAt - now.getTime()) / 86_400_000);
      const due = record.status === "scheduled" && daysRemaining <= 0;
      return {
        record,
        status: record.status === "completed" ? ("completed" as const) : due ? ("due" as const) : ("scheduled" as const),
        daysRemaining,
        labelAr:
          record.status === "completed"
            ? "اكتملت مهامّ النقل"
            : due
              ? "حان وقت الإنتاج الجديد"
              : `مؤجّلة ${daysRemaining} يومًا`,
      };
    })
    .sort((left, right) => Date.parse(left.record.scheduledFor) - Date.parse(right.record.scheduledFor));
}

export type DelayedTransferCompletion = {
  ok: boolean;
  reasonsAr: string[];
  state: LearningState;
  record?: DelayedTransferTaskRecord;
};

/**
 * تسجيل الإنتاج الجديد. الرفض صريح ومُختبر: مهمّة غير موجودة · مُكتملة سابقًا ·
 * إنتاج أقصر من الحد · إنتاج مطابق لنصّ المصدر (نسخ لا نقل).
 */
export function completeDelayedTransferTask(
  state: LearningState,
  taskId: string,
  input: { answerText: string; now?: Date },
): DelayedTransferCompletion {
  const now = input.now ?? new Date();
  const tasks = state.delayedTransferTasks ?? [];
  const record = tasks.find((task) => task.id === taskId);
  if (!record) return { ok: false, reasonsAr: ["لا توجد مهمّة نقل بهذا المعرّف."], state };
  if (record.status === "completed") return { ok: false, reasonsAr: ["هذه المهمّة مسجّلة كمكتملة سابقًا."], state };
  const answer = input.answerText.trim();
  if (answer.length < DELAYED_TRANSFER_MIN_ANSWER_CHARS) {
    return { ok: false, reasonsAr: [`الإنتاج الجديد قصير: الحد ${DELAYED_TRANSFER_MIN_ANSWER_CHARS} حرفًا.`], state };
  }
  const sourceText = sourceTextFor(state, record);
  if (sourceText && normalized(answer) === normalized(sourceText)) {
    return { ok: false, reasonsAr: ["النصّ نفسه بلا تغيير: المطلوب إنتاج جديد لا نسخ."], state };
  }
  const completed: DelayedTransferTaskRecord = {
    ...record,
    status: "completed",
    completedAt: now.toISOString(),
    answerText: answer,
  };
  return {
    ok: true,
    reasonsAr: [],
    record: completed,
    state: { ...state, delayedTransferTasks: tasks.map((task) => (task.id === taskId ? completed : task)) },
  };
}

function normalized(text: string) {
  return text.toLocaleLowerCase("de").replace(/\s+/g, " ").trim();
}

function sourceTextFor(state: LearningState, record: DelayedTransferTaskRecord) {
  if (record.sourceKind === "writing-submission") {
    return state.writingSubmissions.find((submission) => submission.id === record.sourceId)?.text ?? "";
  }
  if (record.sourceKind === "mediation-submission") {
    return state.mediationSubmissions.find((submission) => submission.id === record.sourceId)?.responseDe ?? "";
  }
  const attempt = state.speakingAttempts.find((row) => row.id === record.sourceId);
  return attempt?.transcriptConfirmation?.confirmedText ?? attempt?.reflection ?? "";
}

export function delayedTransferAudit(state: LearningState, now: Date = new Date()) {
  const views = listDelayedTransferTasks(state, now);
  return {
    policyVersion: DELAYED_TRANSFER_POLICY,
    total: views.length,
    scheduled: views.filter((view) => view.status === "scheduled").length,
    due: views.filter((view) => view.status === "due").length,
    completed: views.filter((view) => view.status === "completed").length,
    sources: {
      writing: (state.delayedTransferTasks ?? []).filter((task) => task.sourceKind === "writing-submission").length,
      mediation: (state.delayedTransferTasks ?? []).filter((task) => task.sourceKind === "mediation-submission").length,
      speaking: (state.delayedTransferTasks ?? []).filter((task) => task.sourceKind === "speaking-attempt").length,
    },
    minDays: DELAYED_TRANSFER_MIN_DAYS,
  };
}
