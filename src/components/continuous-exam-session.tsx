"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, Clock3, LockKeyhole } from "lucide-react";
import type { PublishedTargetedExamSimulation } from "@/types/exam";
import type { FullExamSession } from "@/types/learning";
import { continuousSessionEffectiveStatus, continuousSessionRemainingSeconds, expireContinuousSession, findContinuousSessionForTask } from "@/core/exams/continuous-session";
import { useLearning } from "./learning-provider";

function timeLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function SessionClock({ session }: { session: FullExamSession }) {
  const { update } = useLearning();
  const [now, setNow] = useState(() => Date.now());
  const status = continuousSessionEffectiveStatus(session, new Date(now));
  const remaining = continuousSessionRemainingSeconds(session, new Date(now));

  useEffect(() => {
    if (session.status !== "active") return;
    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (nextNow >= Date.parse(session.deadlineAt)) {
        update((current) => expireContinuousSession(current, session.simulationId, new Date(nextNow)));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session.deadlineAt, session.simulationId, session.status, update]);

  return <div className={status === "expired" ? "continuous-clock expired" : "continuous-clock"}>
    <Clock3 size={18} />
    <div><small>{status === "expired" ? "انتهت البروفة المتصلة" : "الوقت المركزي المتبقي"}</small><strong dir="ltr">{timeLabel(remaining)}</strong></div>
  </div>;
}

export function ContinuousExamClock({ simulationId }: { simulationId: string }) {
  const { state } = useLearning();
  const session = state.examSessions[simulationId];
  if (!session || session.mode !== "continuous-timed" || session.status === "abandoned") return null;
  return <SessionClock session={session} />;
}

export function ContinuousTaskSubmitted({ session }: { session: FullExamSession }) {
  const dashboardHref = `/exams/${session.provider}/full/${session.simulationId}`;
  const nextHref = session.currentTaskId ? `/exams/${session.provider}/${session.currentTaskId}` : dashboardHref;
  return <div className="wide-page continuous-task-submitted" role="status" aria-live="polite" aria-atomic="true">
    <span><CheckCircle2 size={32} /></span>
    <small>بروفة متصلة · تسليم مغلق المساعدة</small>
    <h1>ثُبّت التسليم دون كشف التصحيح</h1>
    <p>حُفظ الدليل وانتقلت الجلسة إلى الخطوة التالية. لن تظهر الحلول أو التفسيرات أو نصوص الاستماع ما دامت هذه البروفة نشطة.</p>
    <div><strong>{session.completedTaskIds.length}/{session.taskIds.length}</strong><span>مهام مسلّمة في هذه المحاولة</span></div>
    <Link className="primary-button" href={nextHref}>{session.currentTaskId ? "انتقل إلى المهمة التالية" : "ارجع إلى لوحة الإنهاء"}<ArrowRight size={16} /></Link>
  </div>;
}

export function ContinuousExamTaskGuard({ task, children }: { task: PublishedTargetedExamSimulation; children: React.ReactNode }) {
  const { state, ready } = useLearning();
  if (!ready) return <div className="loading-state"><span /><p>جاري استعادة الجلسة الزمنية…</p></div>;

  const session = findContinuousSessionForTask(state, task.id);
  if (!session) return children;
  const status = continuousSessionEffectiveStatus(session);
  const dashboardHref = `/exams/${session.provider}/full/${session.simulationId}`;
  const taskAlreadyCompleted = session.completedTaskIds.includes(task.id);
  const outOfSequence = !taskAlreadyCompleted && session.currentTaskId !== task.id;

  if (status === "expired") {
    return <div className="wide-page continuous-session-blocked">
      <span><CircleAlert size={28} /></span>
      <h1>انتهى الوقت المركزي</h1>
      <p>لا تسمح البروفة المتصلة بتسليم مهمة جديدة بعد الموعد النهائي. بقيت الأدلة المحفوظة محلية، لكن الجلسة ليست امتحانًا رسميًا أو مراقبًا.</p>
      <Link className="primary-button" href={dashboardHref}>العودة إلى لوحة البروفة <ArrowRight size={16} /></Link>
    </div>;
  }

  if (outOfSequence) {
    return <div className="wide-page continuous-session-blocked">
      <span><LockKeyhole size={28} /></span>
      <h1>هذه ليست المهمة التالية</h1>
      <p>الوضع المتصل يثبت ترتيب المهام ولا يحتسب أدلة قديمة. عد إلى اللوحة وافتح المهمة الحالية؛ يمكنك مغادرة الصفحة لكن الساعة المركزية لن تتوقف.</p>
      <Link className="primary-button" href={dashboardHref}>فتح المهمة الصحيحة <ArrowRight size={16} /></Link>
    </div>;
  }

  return <>
    <section className="continuous-session-banner">
      <div><LockKeyhole size={17} /><p><b>تركيز مغلق المساعدة:</b> لا يوجد إيقاف، وإعادة التحميل لا تعيد الساعة. تُحفظ المسودات محليًا، ويؤجَّل التصحيح والحلول ونصوص الاستماع حتى مغادرة البروفة النشطة. هذا ليس قفل متصفح أو مراقبة رسمية.</p></div>
      <SessionClock session={session} />
      <Link href={dashboardHref}>لوحة الجلسة</Link>
    </section>
    {children}
  </>;
}
