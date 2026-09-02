"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Clock3, ExternalLink, Flag, LockKeyhole, Play, RotateCcw, ShieldCheck } from "lucide-react";
import type { FullExamSimulation, PublishedTargetedExamSimulation } from "@/types/exam";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { examProfiles, examSourceById } from "@/data/exam-profiles";
import { useLearning } from "./learning-provider";
import { ContinuousExamClock } from "./continuous-exam-session";
import { abandonContinuousSession, completeContinuousSession, continuousSessionEffectiveStatus, createContinuousExamSession } from "@/core/exams/continuous-session";
import { deleteMedia } from "@/core/portability/db";
import { AccessibleDialog } from "./accessible-dialog";

const tasksById = Object.fromEntries(allPublishedExamTasks.map((task) => [task.id, task])) as Record<string, PublishedTargetedExamSimulation>;
const kindAr = { matching: "مطابقة", choice: "اختيار", listening: "استماع", writing: "كتابة", speaking: "محادثة" };

export function FullExamSimulationView({ simulation }: { simulation: FullExamSimulation }) {
  const { state, update } = useLearning();
  const [confirmAction, setConfirmAction] = useState<"abandon" | "reset" | null>(null);
  const profile = examProfiles[simulation.provider];
  const taskIds = simulation.modules.flatMap((module) => module.taskIds);
  const startedKey = `full-exam-${simulation.id}-started`;
  const completedKey = `full-exam-${simulation.id}-completed`;
  const continuousSession = state.examSessions[simulation.id];
  const continuousStatus = continuousSession ? continuousSessionEffectiveStatus(continuousSession) : null;
  const continuousAttempt = Boolean(continuousSession);
  const connected = Boolean(continuousSession && continuousSession.status !== "abandoned");
  const abandoned = continuousSession?.status === "abandoned";
  const startedAt = continuousAttempt ? 1 : state.mastery[startedKey];
  const finalized = continuousAttempt ? continuousStatus === "completed" : (state.mastery[completedKey] ?? 0) >= 100;

  function isTaskComplete(task: PublishedTargetedExamSimulation) {
    if (continuousSession) return continuousSession.completedTaskIds.includes(task.id);
    if (task.kind === "writing") return state.writingSubmissions.some((submission) => submission.taskId === task.id && submission.status !== "draft");
    if (task.kind === "speaking") return state.speakingAttempts.some((attempt) => attempt.taskId === task.id);
    return typeof state.mastery[`exam-target-${task.id}`] === "number";
  }

  const completedIds = taskIds.filter((id) => isTaskComplete(tasksById[id]));
  const allTasksComplete = completedIds.length === taskIds.length;
  const nextTaskId = taskIds.find((id) => !completedIds.includes(id));
  const nextTask = nextTaskId ? tasksById[nextTaskId] : undefined;

  function start() {
    if (startedAt) return;
    update((current) => ({ ...current, mastery: { ...current.mastery, [startedKey]: 1 } }));
  }

  function startContinuous() {
    if (startedAt) return;
    const session = createContinuousExamSession(simulation);
    update((current) => ({
      ...current,
      mastery: { ...current.mastery, [startedKey]: 1 },
      examSessions: { ...current.examSessions, [simulation.id]: session },
    }));
  }

  function startFreshContinuous() {
    const session = createContinuousExamSession(simulation);
    update((current) => ({
      ...current,
      mastery: { ...current.mastery, [startedKey]: 1 },
      examSessions: { ...current.examSessions, [simulation.id]: session },
    }));
  }

  function finalize() {
    if (!allTasksComplete) return;
    const now = new Date();
    update((current) => {
      const withEvidence = {
        ...current,
        mastery: { ...current.mastery, [completedKey]: 100 },
        studyHistory: [...current.studyHistory, { date: now.toISOString().slice(0, 10), minutes: simulation.modules.reduce((sum, module) => sum + module.officialMinutes, 0), evidenceCount: taskIds.length }],
      };
      return connected ? completeContinuousSession(withEvidence, simulation.id, now) : withEvidence;
    });
  }

  async function abandonRehearsal() {
    const temporaryMediaIds = Object.values(continuousSession?.taskDrafts ?? {}).flatMap((draft) => typeof draft.payload.mediaId === "string" ? [draft.payload.mediaId] : []);
    await Promise.all(temporaryMediaIds.map((mediaId) => deleteMedia(mediaId)));
    update((current) => abandonContinuousSession(current, simulation.id));
    setConfirmAction(null);
  }

  async function resetMarker() {
    const temporaryMediaIds = Object.values(continuousSession?.taskDrafts ?? {}).flatMap((draft) => typeof draft.payload.mediaId === "string" ? [draft.payload.mediaId] : []);
    await Promise.all(temporaryMediaIds.map((mediaId) => deleteMedia(mediaId)));
    update((current) => {
      const mastery = { ...current.mastery };
      const examSessions = { ...current.examSessions };
      delete mastery[startedKey];
      delete mastery[completedKey];
      delete examSessions[simulation.id];
      return { ...current, mastery, examSessions };
    });
    setConfirmAction(null);
  }

  return (
    <div className="wide-page full-exam-page">
      {continuousStatus !== "active" && <Link href="/exams" className="back-link"><ArrowRight size={14} /> العودة إلى مركز الامتحان</Link>}
      <header className="full-exam-hero">
        <div>
          <span className="eyebrow"><Flag size={15} /> {profile.displayName} · محاكاة أصلية غير رسمية</span>
          <h1 lang="de" dir="ltr">{simulation.titleDe}</h1>
          <h2>{simulation.titleAr}</h2>
          <p>{simulation.descriptionAr}</p>
        </div>
        <div className="full-exam-progress"><strong>{completedIds.length}/{taskIds.length}</strong><span>مهام مكتملة</span><i><b style={{ width: `${(completedIds.length / taskIds.length) * 100}%` }} /></i><small>{finalized ? "منتهية داخليًا" : abandoned ? "أُنهيت البروفة ولم تعد قابلة للاستئناف" : continuousStatus === "expired" ? "انتهى وقت البروفة المتصلة" : connected ? "بروفة متصلة — الساعة لا تتوقف" : startedAt ? "جلسة موجهة قابلة للاستئناف" : "لم تبدأ"}</small></div>
      </header>

      <section className="exam-integrity-note"><CircleAlert size={18} /><p>{abandoned ? <><b>بروفة منتهية يدويًا:</b> حُذفت المسودات غير المسلّمة، وبقيت الأدلة التي ثبّتها المستخدم قبل الإنهاء. لا يمكن استئناف الموعد القديم.</> : connected ? <><b>بروفة زمنية متصلة مغلقة المساعدة:</b> ساعة مركزية واحدة وترتيب ثابت وأدلة جديدة فقط. لا يظهر التصحيح أو النصوص المفرغة أثناء النشاط. يمكن للمستخدم مغادرة المتصفح أو استخدام مصادر خارجية؛ فهذا تدريب محلي غير مراقب وليس قفلًا رسميًا.</> : <><b>وضع جلسة موجهة:</b> المؤقت داخل كل مهمة مستقل، ويمكنك الاستئناف بين الصفحات. هذه حزمة كاملة المحتوى لكنها ليست جلسة مراقبة رسمية، ولا تُنشئ شهادة أو نتيجة رسمية.</>}</p></section>
      {connected && continuousSession && <ContinuousExamClock simulationId={simulation.id} />}

      {abandoned ? (
        <section className="full-exam-start-card abandoned-rehearsal-card">
          <CircleAlert size={30} /><div><h2>انتهت هذه البروفة يدويًا</h2><p>لا يمكن استئناف الموعد السابق. المسودات غير المسلّمة حُذفت، أما الأدلة التي ثبّتها المستخدم فبقيت في سجل التعلم. يمكنك بدء محاولة جديدة بموعد مستقل.</p></div><div className="full-exam-start-actions"><button className="primary-button" onClick={startFreshContinuous}><Clock3 size={16} /> ابدأ بروفة جديدة</button><button className="secondary-button" onClick={() => setConfirmAction("reset")}><RotateCcw size={16} /> امسح علامة المحاولة</button></div>
        </section>
      ) : !startedAt ? (
        <section className="full-exam-start-card">
          <ShieldCheck size={30} /><div><h2>اختر نمط المحاكاة</h2><p>الموجّه قابل للاستئناف ويستفيد من الأدلة السابقة. البروفة المتصلة تبدأ ساعة مركزية جديدة، تفرض الترتيب، ولا تحتسب إجابات قديمة.</p></div><div className="full-exam-start-actions"><button className="secondary-button" onClick={start}><Play size={16} /> جلسة موجهة</button><button className="primary-button" onClick={startContinuous}><Clock3 size={16} /> بروفة زمنية متصلة</button></div>
        </section>
      ) : (
        <section className="full-exam-next">
          <div><small>الخطوة التالية</small><strong>{nextTask ? nextTask.titleAr : "اكتملت جميع المهام"}</strong><span lang="de" dir="ltr">{nextTask?.officialPartLabel ?? "Alle Teile abgeschlossen"}</span></div>
          {nextTask ? continuousStatus === "expired" ? <span className="continuous-expired-label">انتهى وقت التسليم</span> : <Link className="primary-button" href={`/exams/${nextTask.provider}/${nextTask.id}`}><Play size={16} /> {continuousStatus === "active" ? "استئناف المهمة الحالية" : "افتح المهمة التالية"}</Link> : <button className="primary-button" disabled={finalized} onClick={finalize}><Check size={16} /> {finalized ? "تم تثبيت الإنجاز" : "ثبّت إنهاء المحاكاة"}</button>}
        </section>
      )}

      <div className="full-exam-modules">
        {simulation.modules.map((module) => {
          const moduleDone = module.taskIds.filter((id) => isTaskComplete(tasksById[id])).length;
          return (
            <section key={module.id}>
              <header><div><span>{moduleDone === module.taskIds.length ? <Check size={17} /> : moduleDone + 1}</span><div><small lang="de">{module.titleDe}</small><h2>{module.titleAr}</h2></div></div><div><Clock3 size={14} /><strong>{module.officialMinutes} دقيقة</strong><small>{moduleDone}/{module.taskIds.length}</small></div></header>
              <p>{module.resultRuleAr}</p>
              <div>
                {module.taskIds.map((taskId, index) => {
                  const task = tasksById[taskId];
                  const done = isTaskComplete(task);
                  const sequenceLocked = connected && continuousStatus === "active" && !done && continuousSession?.currentTaskId !== taskId;
                  return (
                    <article key={taskId} className={done ? "done" : sequenceLocked ? "sequence-locked" : ""}>
                      <span>{done ? <Check size={14} /> : index + 1}</span>
                      <div><small>{kindAr[task.kind]}</small><strong lang="de" dir="ltr">{task.officialPartLabel}</strong><p>{task.titleAr}</p></div>
                      <em>{task.practiceMinutes} د</em>
                      {sequenceLocked ? <span className="task-sequence-lock"><LockKeyhole size={12} /> لاحقًا</span> : continuousStatus === "expired" && !done ? <span className="task-sequence-lock">انتهى</span> : <Link href={`/exams/${task.provider}/${task.id}`}>{done ? "مراجعة" : "بدء"}<ArrowRight size={13} /></Link>}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="full-exam-limitations"><h2>حدود الدليل الحالية</h2>{simulation.limitationsAr.map((limitation) => <p key={limitation}><CircleAlert size={14} />{limitation}</p>)}</section>
      <section className="exam-source-strip"><strong>مصادر توثيق الصيغة</strong><div>{simulation.sourceRefs.map((sourceId) => { const source = examSourceById[sourceId]; return <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.organization}<ExternalLink size={12} /></a>; })}</div></section>
      {startedAt && !abandoned && <button className="full-exam-reset" onClick={() => setConfirmAction(continuousStatus === "active" ? "abandon" : "reset")}><RotateCcw size={14} /> {continuousStatus === "active" ? "إنهاء هذه البروفة المتصلة" : "إعادة علامة الجلسة"}</button>}

      {confirmAction && <AccessibleDialog labelledBy="rehearsal-confirm-title" describedBy="rehearsal-confirm-description" onClose={() => setConfirmAction(null)}>
        <span><CircleAlert size={24} /></span>
        <h2 id="rehearsal-confirm-title">{confirmAction === "abandon" ? "هل تنهي البروفة المتصلة نهائيًا؟" : "هل تمسح علامة هذه المحاولة؟"}</h2>
        <p id="rehearsal-confirm-description">{confirmAction === "abandon" ? "لن تتمكن من استئناف الموعد الحالي. ستُحذف المسودات غير المسلّمة وأي تسجيل مؤقت، بينما تبقى الأدلة التي سلّمتها فعلًا. الساعة لا تتوقف إلا لأن المحاولة ستُنهيها أنت." : "ستُحذف حالة المحاكاة والمسودات المؤقتة، ولن تُحذف الكتابات أو التسجيلات التي سبق تثبيتها كأدلة تعلم."}</p>
        <div><button className="secondary-button" onClick={() => setConfirmAction(null)}>إلغاء والعودة</button><button className="danger-button" onClick={() => void (confirmAction === "abandon" ? abandonRehearsal() : resetMarker())}>{confirmAction === "abandon" ? "نعم، أنهِ البروفة" : "نعم، امسح العلامة"}</button></div>
      </AccessibleDialog>}
    </div>
  );
}
