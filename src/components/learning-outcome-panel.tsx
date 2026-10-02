"use client";
import { useState } from "react";
import { buildLearningOutcomeObservation } from "@/core/evidence/learning-outcomes";
import { useLearning } from "./learning-provider";

export function LearningOutcomePanel(){
  const {state}=useLearning();const[days,setDays]=useState(14);const observation=buildLearningOutcomeObservation(state,new Date(),days);
  const rows=[['المحاولة الأولى المستقلة',observation.independentFirst],['المحاولة الأولى المدعومة أو التدريبية',observation.assistedFirst],['الإعادة للسؤال نفسه',observation.retries]] as const;
  return <section className="learning-outcome-panel" data-learning-outcome-policy={observation.policyVersion}>
    <header><div><small>متابعة أثر التعلّم محليًا</small><h2>الاستقلال والاحتفاظ، لا عدد الميزات</h2></div><label>نافذة الملاحظة<select value={days} onChange={event=>setDays(Number(event.target.value))}><option value={14}>14 يومًا</option><option value={30}>30 يومًا</option><option value={60}>60 يومًا</option></select></label></header>
    <div className="learning-outcome-grid">{rows.map(([label,row])=><article key={label}><strong>{label}</strong><p>{row.correct}/{row.items} أجوبة صحيحة{row.accuracyPercent===null?'':` · ${row.accuracyPercent}%`}</p></article>)}<article><strong>استرجاع معجمي مؤجل</strong><p>{observation.successfulDelayedCards} بطاقات فريدة ناجحة من {observation.delayedReviews} مراجعات</p></article><article><strong>مراجعة وإنتاج مؤجل</strong><p>{observation.revisedWritingTasks} مهام كتابة منقحة · {observation.delayedTransferTasks} إنتاجات مؤجلة بلا حكم جودة</p></article><article><strong>زمن الصفحة المرئي</strong><p>{observation.visibleSessionMinutes} دقيقة تقريبية؛ ليست قياسًا للانتباه أو ساعات اكتساب لغة</p></article></div>
    <p>{observation.interpretationAr}</p><footer>البيانات محلية وقابلة للنقل والحذف. لا نرسلها إلى خدمة إحصاءات، ولا نعتبر مقارنة قبل/بعد إثباتًا سببيًا لفعالية ميزة.</footer>
  </section>;
}
