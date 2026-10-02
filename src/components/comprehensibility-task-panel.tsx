"use client";

import { useMemo, useState } from "react";
import { Ear, ShieldCheck, UserRound } from "lucide-react";
import type { CEFRLevel } from "@/types/learning";
import {
  COMPREHENSIBILITY_BOUNDARY_AR,
  COMPREHENSIBILITY_MAX_PER_SESSION,
  COMPREHENSIBILITY_POLICY_VERSION,
  COMPREHENSIBILITY_TASK_COUNT,
  createComprehensibilityCheck,
  selectComprehensibilityTasks,
  summarizeComprehensibilityChecks,
  type ComprehensibilityMode,
  type ComprehensibilityOutcome,
} from "@/core/pronunciation/comprehensibility-task";
import { useLearning } from "./learning-provider";

const modeLabels: Record<ComprehensibilityMode, string> = {
  "peer-human-listener": "شخص آخر يستمع (مستمع حقيقي)",
  "self-listen-back": "أستمع لنفسي لاحقًا (تقرير ذاتي)",
};

const outcomeLabels: Record<ComprehensibilityOutcome, string> = {
  "task-achieved-immediately": "أنجز المهمة فورًا",
  "task-achieved-after-repetition": "أنجزها بعد إعادة",
  "task-not-achieved": "لم ينجز المهمة",
};

export function ComprehensibilityTaskPanel({ level }: { level: CEFRLevel }) {
  const { state, update } = useLearning();
  const records = useMemo(() => state.comprehensibilityChecks ?? [], [state.comprehensibilityChecks]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [mode, setMode] = useState<ComprehensibilityMode>("peer-human-listener");
  const [chosenOptionId, setChosenOptionId] = useState("");
  const [outcome, setOutcome] = useState<ComprehensibilityOutcome>("task-achieved-immediately");
  const [repeatedTimes, setRepeatedTimes] = useState<0 | 1 | 2>(0);
  const [unclearPoints, setUnclearPoints] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const tasks = useMemo(
    () => selectComprehensibilityTasks(level, records.map((record) => record.taskId)),
    [level, records],
  );
  const task = tasks[Math.min(taskIndex, Math.max(0, tasks.length - 1))];
  const summary = useMemo(() => summarizeComprehensibilityChecks(records), [records]);
  const today = new Date().toISOString().slice(0, 10);
  const savedToday = records.filter((record) => record.createdAt.slice(0, 10) === today).length;
  const capReached = savedToday >= COMPREHENSIBILITY_MAX_PER_SESSION;

  function resetForm() {
    setChosenOptionId("");
    setOutcome("task-achieved-immediately");
    setRepeatedTimes(0);
    setUnclearPoints([]);
  }

  function save() {
    if (!task) return;
    if (!chosenOptionId) {
      setMessage("اختر أولًا ما فهمه المستمع فعلًا من الخيارات؛ الحكم بلا إجابةٍ ليس حكمًا.");
      return;
    }
    try {
      const record = createComprehensibilityCheck({
        taskId: task.id,
        mode,
        outcome,
        listenerSelectedOptionId: chosenOptionId,
        repeatedTimes,
        unclearInformationPointIds: unclearPoints,
      });
      update((current) => ({
        ...current,
        comprehensibilityChecks: [...(current.comprehensibilityChecks ?? []), record],
      }));
      setMessage(
        mode === "peer-human-listener"
          ? `حُفظ حكم المستمع على مهمة «${task.titleAr}». هذا حكم إنسان على مهمة، لا درجة نطق.`
          : `حُفظ تقريرك الذاتي على مهمة «${task.titleAr}». تقرير ذاتي لا يُعدّ تحقّقًا خارجيًا.`,
      );
      resetForm();
      setTaskIndex(0);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذّر حفظ الحكم.");
    }
  }

  function toggleUnclear(point: string) {
    setUnclearPoints((current) => (current.includes(point) ? current.filter((item) => item !== point) : [...current, point]));
  }

  if (!task) return null;

  return (
    <section className="comprehensibility-task" data-comprehensibility-policy={COMPREHENSIBILITY_POLICY_VERSION} data-comprehensibility-level={level} data-comprehensibility-bank={COMPREHENSIBILITY_TASK_COUNT} data-comprehensibility-cap={COMPREHENSIBILITY_MAX_PER_SESSION}>
      <header>
        <Ear size={18} />
        <div>
          <strong>تقييم قابلية الفهم عبر مهمة حقيقية</strong>
          <small>
            {level} · {COMPREHENSIBILITY_TASK_COUNT} مهام مؤلَّفة · سقف الجلسة {COMPREHENSIBILITY_MAX_PER_SESSION} مهام · مُنجَز اليوم {savedToday}
          </small>
        </div>
      </header>

      <p className="comprehensibility-intro">
        المقياس هنا ليس «قراءة كلمات»: تُنفّذ مهمةً تواصلية، ثم يخبرك إنسانٌ استمع إليك هل أنجز المهمة فعلًا (نفّذ
        القرار أو نقل المعلومة). الجواب الصحيح معروف سلفًا في ورقتك، والمستمع لا يراه.
      </p>

      <div className="comprehensibility-picker" data-comprehensibility-picker="true" data-comprehensibility-task={task.id}>
        {tasks.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === taskIndex ? "active" : ""}
            disabled={capReached}
            onClick={() => {
              setTaskIndex(index);
              resetForm();
              setMessage("");
            }}
          >
            {item.titleAr}
          </button>
        ))}
      </div>

      <article className="comprehensibility-brief">
        <h3>{task.titleAr}</h3>
        <p>{task.scenarioAr}</p>
        <p className="comprehensibility-goal" lang="de" dir="ltr">
          {task.speakingGoalDe}
        </p>
        <small>مدة معقولة نحو {task.durationHintSeconds} ثانية · سجّل بصوتك ثم استمع للمهمة مع المستمع.</small>
        <div className="comprehensibility-answer-key" data-comprehensibility-answer-key="true">
          <ShieldCheck size={15} />
          <span>
            المعلومة التي يجب أن تصل: <b>{task.listenerOptions.find((option) => option.id === task.correctOptionId)?.labelAr}</b> — علّمها لنفسك
            فقط، ولا تعرضها على المستمع قبل سماعه.
          </span>
        </div>
      </article>

      <div className="comprehensibility-modes" data-comprehensibility-mode={mode}>
        {(Object.keys(modeLabels) as ComprehensibilityMode[]).map((item) => (
          <button key={item} type="button" className={item === mode ? "active" : ""} onClick={() => setMode(item)}>
            {item === "peer-human-listener" ? <UserRound size={15} /> : <Ear size={15} />}
            {modeLabels[item]}
          </button>
        ))}
      </div>

      <div className="comprehensibility-listener" data-comprehensibility-listener-question="true">
        <strong>سؤال المستمع بعد السماع</strong>
        <p>{task.listenerQuestionAr}</p>
        <small>{task.listenerInstructionAr}</small>
        <div className="comprehensibility-options" data-comprehensibility-options="true">
          {task.listenerOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={chosenOptionId === option.id ? "active" : ""}
              onClick={() => setChosenOptionId(option.id)}
            >
              {option.labelAr}
            </button>
          ))}
        </div>
      </div>

      <div className="comprehensibility-outcome" data-comprehensibility-outcome={outcome}>
        {(Object.keys(outcomeLabels) as ComprehensibilityOutcome[]).map((item) => (
          <button
            key={item}
            type="button"
            className={item === outcome ? "active" : ""}
            onClick={() => {
              setOutcome(item);
              if (item !== "task-achieved-after-repetition") setRepeatedTimes(0);
              if (item === "task-achieved-after-repetition" && repeatedTimes === 0) setRepeatedTimes(1);
            }}
          >
            {outcomeLabels[item]}
          </button>
        ))}
        <label>
          مرات الإعادة
          <select value={repeatedTimes} onChange={(event) => setRepeatedTimes(Number(event.target.value) as 0 | 1 | 2)}>
            <option value={0}>بلا إعادة</option>
            <option value={1}>إعادة واحدة</option>
            <option value={2}>إعادتان</option>
          </select>
        </label>
      </div>

      <fieldset className="comprehensibility-unclear">
        <legend>أي معلومات لم تصل بوضوح؟</legend>
        {task.informationPointsAr.map((point) => (
          <label key={point}>
            <input type="checkbox" checked={unclearPoints.includes(point)} onChange={() => toggleUnclear(point)} />
            {point}
          </label>
        ))}
      </fieldset>

      <button className="primary-button" type="button" onClick={save} data-comprehensibility-save="true" disabled={capReached}>
        احفظ حكم المستمع
      </button>
      {capReached && <p role="status">بلغت سقف الجلسة ({COMPREHENSIBILITY_MAX_PER_SESSION} مهام). أكمل في جلسة قادمة كي تبقى مهمةً حقيقية.</p>}
      {message && <p role="status" data-comprehensibility-status="true">{message}</p>}

      {records.length > 0 && (
        <div className="comprehensibility-summary" data-comprehensibility-summary="true">
          <strong>الملخّص الصادق</strong>
          <ul>
            <li>محاولات: {summary.totalAttempts} · أنجز المهمة: {summary.achieved} · لم ينجزها: {summary.notAchieved}</li>
            <li>حكم مستمعٍ آخر: {summary.peerVerified} · تقرير ذاتي: {summary.selfReported}</li>
            <li>
              بالستوى: {summary.byLevel.map((row) => `${row.level} ${row.achieved}/${row.attempts}`).join(" · ")}
            </li>
          </ul>
          {records
            .slice(-3)
            .reverse()
            .map((record) => (
              <div key={record.id} className="comprehensibility-record" data-comprehensibility-record={record.id}>
                <span>{record.level}</span>
                <span>{outcomeLabels[record.outcome]}</span>
                <span>{modeLabels[record.mode]}</span>
                <small>{record.createdAt.slice(0, 10)}</small>
              </div>
            ))}
        </div>
      )}

      <p className="comprehensibility-no-effect" data-comprehensibility-no-effect="true">
        لا تُمنح هنا درجة نطقٍ أو طلاقة، ولا تُرفع نتيجة مستوى، ولا تُفتح بوابة، ولا تُمَسّ بيانات الإتقان: هذه وحدة مهمة
        تواصلية بحتة.
      </p>
      <p className="comprehensibility-honest-note" data-comprehensibility-honest-note="true">
        {COMPREHENSIBILITY_BOUNDARY_AR}
      </p>
    </section>
  );
}
