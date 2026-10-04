"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck2, CheckCircle2, FilePenLine, GitCompareArrows } from "lucide-react";
import { useLearning } from "./learning-provider";
import { WEEKLY_WRITING_POLICY, weeklyWritingCycle, weeklyWritingStatusLabel } from "@/core/writing/weekly-cycle";

/**
 * لوحة دورة الكتابة الأسبوعية (P1-14): تُظهر حالة هذا الأسبوع، وما يجب فعله الآن، والإيقاع
 * المقيس لثمانية أسابيع. الإعادة إلزامية: المسودة وحدها لا تُكمل الدورة، والنسخة المطابقة
 * لأصلها لا تُعدّ إعادة كتابة.
 */
export function WeeklyWritingCyclePanel() {
  const { state } = useLearning();
  const cycle = weeklyWritingCycle(state);
  const status = cycle.current.status;
  return (
    <section className="weekly-writing-cycle" data-weekly-writing-policy={WEEKLY_WRITING_POLICY} data-weekly-writing-status={status}>
      <header>
        <div>
          <span className="eyebrow"><CalendarCheck2 size={15} /> دورة الكتابة الأسبوعية</span>
          <h2>مسودة ← تحليل ← <b>إعادة كتابة إلزامية</b> ← مقارنة</h2>
          <p>{cycle.current.nextActionAr}</p>
        </div>
        <div className="weekly-writing-state">
          <small>{cycle.current.labelAr}</small>
          <strong className={status === "cycle-complete" ? "ok" : "pending"}>{weeklyWritingStatusLabel(status)}</strong>
          <em>{cycle.current.drafts} مسودة · {cycle.current.submitted} مُرسلة · {cycle.current.revised} منقحة · {cycle.current.revisionChangedText ? "الفرق مقيس" : "لا فرق مقيس بعد"}</em>
        </div>
      </header>

      <ol className="weekly-writing-weeks">
        {cycle.weeks.map((week) => (
          <li key={week.weekStart} className={week.status === "cycle-complete" ? "done" : week.status === "not-started" ? "idle" : "open"}>
            <span>{week.weekStart.slice(5)}</span>
            {week.status === "cycle-complete" ? <CheckCircle2 size={14} /> : week.status === "not-started" ? <AlertTriangle size={14} /> : <GitCompareArrows size={14} />}
            <small>{weeklyWritingStatusLabel(week.status)}</small>
          </li>
        ))}
      </ol>

      <footer>
        <p><b>{cycle.completedWeeks}/{cycle.weeksMeasured}</b> أسبوعًا مكتمل الدورة · السلسلة الحالية {cycle.currentStreak} · أطول فاصل {cycle.longestGapDays ?? "—"} يومًا</p>
        <p className="boundary-line">{cycle.boundaryAr}</p>
        <div className="weekly-writing-actions">
          <Link className="primary-button" href={cycle.current.href}><FilePenLine size={15} /> {status === "cycle-complete" ? "افتح ملف الأعمال" : "اذهب إلى مهمة الكتابة"}</Link>
          <Link className="secondary-button" href="/writing/portfolio">الفروق بين النسخ</Link>
        </div>
      </footer>
    </section>
  );
}
