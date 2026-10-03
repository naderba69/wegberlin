// @vitest-environment node
import { describe, expect, it } from "vitest";
import { defaultState } from "@/core/portability/db";
import {
  completeDelayedTransferTask,
  DELAYED_TRANSFER_EVIDENCE_BOUNDARY,
  DELAYED_TRANSFER_MIN_ANSWER_CHARS,
  DELAYED_TRANSFER_MIN_DAYS,
  DELAYED_TRANSFER_POLICY,
  delayedTransferAudit,
  listDelayedTransferTasks,
  scheduleDelayedTransferTask,
  scheduleDelayedTransferTasksForState,
} from "@/core/evidence/delayed-transfer-task";
import type { LearningState } from "@/types/learning";

const now = new Date("2026-09-26T12:00:00.000Z");

const longAnswer =
  "Ich möchte mich heute für einen anderen Deutschkurs anmelden und dabei erklären, wie sich mein Zeitplan seit dem letzten Monat verändert hat und warum ich mehr Übung im Schreiben brauche.";

function withWriting(createdAt = "2026-09-20T08:00:00.000Z"): LearningState {
  return {
    ...defaultState,
    writingSubmissions: [
      {
        id: "writing-1",
        taskId: "write-b2-01",
        text: "Ich habe mich um einen Platz im Deutschkurs beworben und beschreibe hier meinen Alltag mit Arbeit und Lernen.",
        wordCount: 18,
        version: 1,
        status: "submitted",
        feedback: [],
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}

describe("delayed transfer tasks — from real production, no mastery, no gate", () => {
  it("schedules nothing without real production", () => {
    expect(scheduleDelayedTransferTask(defaultState, { now })).toBeNull();
    expect(scheduleDelayedTransferTasksForState(defaultState, { now }).delayedTransferTasks).toEqual([]);
  });

  it("derives the task from the newest production with the documented delay", () => {
    const scheduled = scheduleDelayedTransferTask(withWriting(), { now });
    expect(scheduled).not.toBeNull();
    expect(scheduled?.record.policyVersion).toBe(DELAYED_TRANSFER_POLICY);
    expect(scheduled?.record.sourceKind).toBe("writing-submission");
    expect(scheduled?.record.sourceId).toBe("writing-1");
    expect(scheduled?.record.taskKind).toBe("fresh-production");
    expect(scheduled?.record.status).toBe("scheduled");
    expect(scheduled?.record.evidenceBoundary).toBe(DELAYED_TRANSFER_EVIDENCE_BOUNDARY);
    expect(DELAYED_TRANSFER_MIN_DAYS).toBe(3);
    // التأجيل محسوب من تاريخ الإنتاج نفسه، لا من لحظة الجدولة (م2 من تدقيق 2026-10-03).
    expect(Date.parse(scheduled!.record.scheduledFor)).toBe(
      Date.parse("2026-09-20T08:00:00.000Z") + DELAYED_TRANSFER_MIN_DAYS * 86_400_000,
    );
  });

  it("never schedules the same source twice", () => {
    const once = scheduleDelayedTransferTasksForState(withWriting(), { now });
    const twice = scheduleDelayedTransferTasksForState(once, { now });
    expect(once.delayedTransferTasks).toHaveLength(1);
    expect(twice.delayedTransferTasks).toHaveLength(1);
    expect(scheduleDelayedTransferTask(once, { now })).toBeNull();
  });

  it("labels scheduled, due and completed tasks from the clock, not from a counter", () => {
    const scheduled = scheduleDelayedTransferTasksForState(withWriting("2026-09-26T09:00:00.000Z"), { now });
    expect(listDelayedTransferTasks(scheduled, now)[0].status).toBe("scheduled");
    expect(listDelayedTransferTasks(scheduled, now)[0].labelAr).toContain("مؤجّلة");
    const later = new Date("2026-09-30T12:00:00.000Z");
    expect(listDelayedTransferTasks(scheduled, later)[0].status).toBe("due");
    expect(listDelayedTransferTasks(scheduled, later)[0].labelAr).toContain("حان وقت");
  });

  it("makes an older production due the moment it is scheduled, never waiting another three days", () => {
    const scheduled = scheduleDelayedTransferTasksForState(withWriting("2026-09-20T08:00:00.000Z"), { now });
    const view = listDelayedTransferTasks(scheduled, now)[0];
    expect(view.status).toBe("due");
    expect(view.labelAr).toContain("حان وقت");
    expect(view.daysRemaining).toBeLessThanOrEqual(0);
  });

  it("names every source in Arabic: the learner never sees a raw identifier", async () => {
    const { DELAYED_TRANSFER_SOURCE_LABEL_AR } = await import("@/core/evidence/delayed-transfer-task");
    const { countTransferSources, countUnscheduledTransferSources } = await import("@/core/evidence/delayed-transfer-task");
    expect(Object.values(DELAYED_TRANSFER_SOURCE_LABEL_AR).every((label) => /[\u0600-\u06ff]/u.test(label))).toBe(true);
    expect(Object.keys(DELAYED_TRANSFER_SOURCE_LABEL_AR).sort()).toEqual(
      ["mediation-submission", "speaking-attempt", "writing-submission"],
    );
    expect(countTransferSources(defaultState)).toBe(0);
    expect(countUnscheduledTransferSources(defaultState)).toBe(0);
    const produced = withWriting();
    expect(countTransferSources(produced)).toBe(1);
    expect(countUnscheduledTransferSources(produced)).toBe(1);
    expect(countUnscheduledTransferSources(scheduleDelayedTransferTasksForState(produced, { now }))).toBe(0);
  });

  it("records fresh production as transfer evidence with the boundary written into the row", () => {
    const scheduled = scheduleDelayedTransferTasksForState(withWriting(), { now });
    const taskId = scheduled.delayedTransferTasks![0].id;
    const outcome = completeDelayedTransferTask(scheduled, taskId, { answerText: longAnswer, now });
    expect(outcome.ok).toBe(true);
    const record = outcome.state.delayedTransferTasks![0];
    expect(record.status).toBe("completed");
    expect(record.answerText).toBe(longAnswer.trim());
    expect(record.evidenceBoundary).toBe("transfer-evidence-no-mastery-no-gate");
    expect(outcome.state.mastery).toEqual(scheduled.mastery);
    expect(outcome.state.completedLessonIds).toEqual(scheduled.completedLessonIds);
  });

  it("rejects unknown tasks, short answers, re-completion and copying the source text", () => {
    const scheduled = scheduleDelayedTransferTasksForState(withWriting(), { now });
    const taskId = scheduled.delayedTransferTasks![0].id;
    expect(completeDelayedTransferTask(scheduled, "delayed-transfer:missing", { answerText: longAnswer, now }).reasonsAr[0]).toContain(
      "لا توجد مهمّة",
    );
    const short = completeDelayedTransferTask(scheduled, taskId, { answerText: "kurz", now });
    expect(short.ok).toBe(false);
    expect(short.reasonsAr[0]).toContain(String(DELAYED_TRANSFER_MIN_ANSWER_CHARS));
    const copied = completeDelayedTransferTask(scheduled, taskId, { answerText: scheduled.writingSubmissions[0].text, now });
    expect(copied.ok).toBe(false);
    expect(copied.reasonsAr[0]).toContain("نسخ");
    const done = completeDelayedTransferTask(scheduled, taskId, { answerText: longAnswer, now });
    const again = completeDelayedTransferTask(done.state, taskId, { answerText: longAnswer, now });
    expect(again.ok).toBe(false);
    expect(again.reasonsAr[0]).toContain("مكتملة");
  });

  it("audits the queue by source kind without scoring anything", () => {
    const scheduled = scheduleDelayedTransferTasksForState(withWriting(), { now });
    const audit = delayedTransferAudit(scheduled, now);
    expect(audit.policyVersion).toBe(DELAYED_TRANSFER_POLICY);
    expect(audit.total).toBe(1);
    // الإنتاج الأقدم من الأجل صار مستحقًّا فور جدولته: لا يُعدّ «مؤجَّلًا».
    expect(audit.scheduled).toBe(0);
    expect(audit.due).toBe(1);
    expect(audit.completed).toBe(0);
    expect(audit.sources).toEqual({ writing: 1, mediation: 0, speaking: 0 });
    expect(audit.minDays).toBe(DELAYED_TRANSFER_MIN_DAYS);
  });
});
