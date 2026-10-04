"use client";

import { CalendarRange, CircleAlert, Clock3, Hourglass, ShieldCheck } from "lucide-react";
import { buildTimeBudget, TIME_BUDGET_POLICY, REVIEW_OVERHEAD_RATIO } from "@/core/planning/time-budget";
import { useLearning } from "./learning-provider";

const levelAr: Record<string, string> = { A1: "A1", A2: "A2", B1: "B1", B2: "B2" };

/**
 * خطة زمنية صادقة (البند P0-10): تفصل بصراحة بين «إتمام دروس المنهج» و«بلوغ المستوى»،
 * وتقارن التاريخ الهدف بالساعات الموجّهة الدنيا، بلا وعد.
 */
export function TimeBudgetPanel() {
  const { state } = useLearning();
  const budget = buildTimeBudget(state);
  const from = budget.guidedHours.fromLevel === "start" ? "البداية" : levelAr[budget.guidedHours.fromLevel];
  return (
    <section className="settings-card time-budget-card" data-time-budget={TIME_BUDGET_POLICY}>
      <div className="settings-title"><span><Hourglass size={20} /></span><div><h2>خطة زمنية صادقة</h2><p>كم يلزم فعلًا: إتمام دروس المنهج شيء، وبلوغ المستوى شيء آخر.</p></div></div>
      <div className="webgpu-model-facts">
        <div><Clock3 size={16} /><span><small>وقتك المختار</small><strong>{budget.dailyMinutes} دقيقة/يوم · {Math.round(budget.weeklyMinutes / 60)} ساعة/أسبوع</strong><em>يمكن تغييره في ملفك أثناء التأسيس.</em></span></div>
        <div><CalendarRange size={16} /><span><small>إتمام الدروس الباقية</small><strong>{budget.remainingLessons} درسًا · نحو {Math.round(budget.curriculumMonths)} شهرًا</strong><em>{budget.lessonMinutes} دقيقة محتوى + {Math.round(REVIEW_OVERHEAD_RATIO * 100)}% مراجعة.</em></span></div>
        <div><ShieldCheck size={16} /><span><small>بلوغ {levelAr[budget.requestedLevel]} من {from}</small><strong>{budget.guidedHours.min}–{budget.guidedHours.max} ساعة موجّهة</strong><em>أي نحو {budget.guidedMonths.min}–{budget.guidedMonths.max} شهرًا بوقتك الحالي. نطاق من الأدبيات، لا وعد.</em></span></div>
      </div>
      {budget.verdict && (
        <div className={budget.verdict.feasible ? "privacy-note" : "privacy-note warning"} role="status" data-time-budget-verdict={budget.verdict.feasible ? "feasible" : "stretch"}>
          <CircleAlert size={16} /><p>{budget.verdict.messageAr}</p>
        </div>
      )}
      <p className="privacy-note"><ShieldCheck size={16} /><span>{budget.boundaryAr}</span></p>
    </section>
  );
}
