"use client";

import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import { buildWeeklyEvidenceSummary, weeklySummarySentence, WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION } from "@/core/coach/weekly-summary";
import { useDeviceEpoch } from "./device-value";
import { useLearning } from "./learning-provider";

/** تحويل الزمن المستلم بعد الترطيب إلى تاريخ؛ على الخادم وفي أول رسم يبقى الصفر (1970). */
function epochToDate(epochMs: number): Date {
  return new Date(epochMs);
}

/** بطاقة الملخص الأسبوعي: أرقام نشاط فقط، بلا درجة ولا إتقان ولا مستوى. */
export function WeeklyEvidenceSummary() {
  const { state } = useLearning();
  const deviceNow = useDeviceEpoch(0);
  const now = useMemo(() => epochToDate(deviceNow), [deviceNow]);
  const summary = useMemo(() => buildWeeklyEvidenceSummary(state, now), [state, now]);
  const average = (value: number | null) => (value === null ? "—" : value.toFixed(1));

  return (
    <section className="week-evidence-summary" data-weekly-evidence-policy={WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION} aria-labelledby="week-evidence-title">
      <div className="card-title">
        <span id="week-evidence-title"><CalendarRange size={18} /> ملخص الأسبوع من أدلتك</span>
        <small lang="de" dir="ltr">Wochenbilanz</small>
      </div>
      <p>{weeklySummarySentence(summary)}</p>
      <dl className="week-evidence-grid">
        <div><dt>دقائق نشطة</dt><dd>{summary.activeMinutes}</dd></div>
        <div><dt>أيام خطة الإنقاذ</dt><dd>{summary.rescueDays}</dd></div>
        <div><dt>«سهل» / «صعب»</dt><dd>{summary.planningSignals.tooEasy} / {summary.planningSignals.tooHard}</dd></div>
        <div><dt>محاولات استماع ونطق وقراءة</dt><dd>{summary.receptionAttempts}</dd></div>
        <div><dt>قياسات الكتابة</dt><dd>{summary.writingBenchmarks}</dd></div>
        <div><dt>متوسط الطاقة</dt><dd>{average(summary.averages.energy)}</dd></div>
      </dl>
      <p className="week-evidence-boundary">
        هذه أرقام نشاط محلية فقط. لا تعني درجة ولا إتقانًا ولا مستوى. الكتابة والكلام الحر لا يُحسبان هنا لأن سجلهما بلا توقيت.
      </p>
    </section>
  );
}
