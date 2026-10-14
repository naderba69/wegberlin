"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Check, Mic2, PenLine, ShieldCheck } from "lucide-react";
import type { DiagnosticProductiveSample } from "@/types/learning";
import {
  buildProductiveSampleComparison,
  DIAGNOSTIC_PRODUCTIVE_PROMPT_DE,
  isProductiveSampleFollowUpAvailable,
  PRODUCTIVE_SAMPLE_COMPARISON_POLICY,
  productiveSampleComparisonFor,
  recordProductiveSampleFollowUp,
} from "@/core/diagnostic/productive-sample";
import { useLearning } from "./learning-provider";
import { DiagnosticProductiveSampleStep } from "./diagnostic-productive-sample";

const selfAssessmentAr = {
  independent: "دون مساعدة",
  "with-help": "بمساعدة أو تردد",
  "not-yet": "لا أستطيع بعد",
} as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ar-TN", { dateStyle:"medium", timeStyle:"short" }).format(date)
    : "تاريخ غير متاح";
}

function SampleCard({ sample, title }: { sample: DiagnosticProductiveSample; title: string }) {
  return <article className="productive-sample-card">
    <header><div><small>{title}</small><strong>{formatDate(sample.submittedAt)}</strong></div><span>{sample.selfAssessment === "independent" ? <Check size={16}/> : <ShieldCheck size={16}/>}</span></header>
    <ul>
      <li><PenLine size={15}/> الكتابة: <b>{sample.writingWordCount}</b> كلمات</li>
      <li><ShieldCheck size={15}/> تقديرك الذاتي: <b>{selfAssessmentAr[sample.selfAssessment]}</b></li>
      <li><Mic2 size={15}/> التسجيل: <b>{sample.speakingDurationSeconds ? `${sample.speakingDurationSeconds} ثانية` : "لا توجد عينة صوتية"}</b></li>
    </ul>
    {sample.writingText&&<details><summary>أظهر نصّك الألماني</summary><p lang="de" dir="ltr">{sample.writingText}</p></details>}
  </article>;
}

export function ProductiveSampleComparisonPanel() {
  const { state, update, ready } = useLearning();
  const [stage, setStage] = useState<"new-baseline" | "four-week-follow-up" | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [message, setMessage] = useState("");
  const result = state.diagnosticResult;
  const comparison = state.productiveSampleComparison ?? productiveSampleComparisonFor(result);
  const dueAt = comparison?.followUpDueAt;

  useEffect(() => {
    const refresh = () => setNowMs(Date.now());
    refresh();
    if (!dueAt || comparison?.followUp) return;
    const delay = Math.max(0, Date.parse(dueAt) - Date.now() + 25);
    const timer = window.setTimeout(refresh, delay);
    return () => window.clearTimeout(timer);
  }, [dueAt, comparison?.followUp]);

  function saveSample(sample: DiagnosticProductiveSample) {
    if (!stage) return;
    if (stage === "new-baseline") {
      const nextComparison = buildProductiveSampleComparison(sample);
      update((current) => {
        if (current.productiveSampleComparison || productiveSampleComparisonFor(current.diagnosticResult)) return current;
        return {
          ...current,
          productiveSampleComparison: nextComparison,
          ...(current.diagnosticResult ? { diagnosticResult: { ...current.diagnosticResult, productiveSample: sample } } : {}),
        };
      });
      setMessage("حُفظ خط الأساس من اليوم. موعد المقارنة الاختيارية بعد أربعة أسابيع.");
      setStage(null);
      return;
    }

    const capturedComparison = state.productiveSampleComparison ?? productiveSampleComparisonFor(state.diagnosticResult);
    if (!capturedComparison || !isProductiveSampleFollowUpAvailable(capturedComparison, sample.submittedAt)) {
      setMessage("لم يحن موعد عينة المتابعة بعد؛ يلزم مرور 28 يومًا كاملًا على خط الأساس.");
      return;
    }
    const nextComparison = recordProductiveSampleFollowUp(capturedComparison, sample);
    update((current) => {
      const currentComparison = current.productiveSampleComparison ?? productiveSampleComparisonFor(current.diagnosticResult);
      if (!currentComparison || currentComparison.followUp || currentComparison.baseline.submittedAt !== capturedComparison.baseline.submittedAt) return current;
      return { ...current, productiveSampleComparison: nextComparison };
    });
    setMessage("حُفظت عينة الأسبوع الرابع. قارن الكمية المرئية وتقييمك الذاتي؛ لم نُصدر درجة لغوية.");
    setStage(null);
  }

  if (!ready) return null;
  if (stage) {
    return <section className="productive-sample-comparison" data-productive-comparison-policy={PRODUCTIVE_SAMPLE_COMPARISON_POLICY}>
      <DiagnosticProductiveSampleStep
        estimatedLevel={result?.estimatedLevel ?? "خط البداية"}
        stage={stage}
        onComplete={saveSample}
        onCancel={() => setStage(null)}
      />
    </section>;
  }

  if (!comparison) return <section className="productive-sample-comparison" data-productive-comparison-policy={PRODUCTIVE_SAMPLE_COMPARISON_POLICY}>
    <header><span><CalendarClock size={19}/></span><div><small>لا نخترع سجلًا قديمًا</small><h2>أنشئ خط أساس إنتاجيًا</h2></div></header>
    <p>{result ? "لا توجد عينة بداية محفوظة لهذا الملف." : "لا يوجد خط أساس إنتاجي لهذا الملف بعد. يمكنك إنشاءه اليوم من دون اختبار أو تغيير نقطة البداية."} يبدأ حساب الأسابيع الأربعة من تاريخ العينة الفعلي فقط.</p>
    <div className="productive-sample-baseline-actions"><button className="primary-button" type="button" onClick={() => setStage("new-baseline")}>سجّل خط الأساس من اليوم</button>{!result&&<Link className="secondary-button" href="/diagnostic">لدي خبرة سابقة؟ ابدأ التشخيص <ArrowLeft size={15}/></Link>}</div>
  </section>;

  const baseline = comparison.baseline;
  const followUp = comparison.followUp;
  const available = nowMs > 0 && isProductiveSampleFollowUpAvailable(comparison, nowMs);
  const dueDateAr = formatDate(comparison.followUpDueAt);
  const writingDelta = followUp ? followUp.writingWordCount - baseline.writingWordCount : null;
  const speakingDelta = followUp?.speakingDurationSeconds && baseline.speakingDurationSeconds
    ? followUp.speakingDurationSeconds - baseline.speakingDurationSeconds
    : null;

  return <section className="productive-sample-comparison" data-productive-comparison-policy={PRODUCTIVE_SAMPLE_COMPARISON_POLICY} data-follow-up-state={followUp ? "complete" : available ? "due" : "waiting"}>
    <header><span><CalendarClock size={19}/></span><div><small>عينة إنتاجية · ليست درجة لغوية</small><h2>قارن خط البداية بعينة بعد أربعة أسابيع</h2></div><strong>28 يومًا</strong></header>
    <p className="productive-sample-prompt" lang="de" dir="ltr">{DIAGNOSTIC_PRODUCTIVE_PROMPT_DE}</p>
    {followUp ? <>
      <div className="productive-sample-pair"><SampleCard sample={baseline} title="خط البداية"/><SampleCard sample={followUp} title="عينة المتابعة بعد أربعة أسابيع"/></div>
      <div className="productive-sample-deltas" aria-label="فروق كمية فقط">
        <p>حجم الكتابة: <b>{writingDelta! > 0 ? `+${writingDelta}` : writingDelta} كلمات</b> بين العينتين.</p>
        {speakingDelta !== null&&<p>مدة التسجيل: <b>{speakingDelta > 0 ? `+${speakingDelta}` : speakingDelta} ثانية</b> بين العينتين.</p>}
      </div>
      <p className="productive-sample-boundary">هذه مقارنة ذاتية وصفية: عدد كلمات، مدة تسجيل، وتقدير تختاره أنت. لا نفحص صحة النص أو النطق، ولا نستنتج طلاقة أو مستوى CEFR أو إتقانًا.</p>
    </> : <>
      <SampleCard sample={baseline} title="خط البداية المحفوظ"/>
      <div className={available ? "productive-sample-due is-ready" : "productive-sample-due"}>
        <strong>{available ? "حان موعد المقارنة الاختيارية" : `موعدها ${dueDateAr}`}</strong>
        <p>{available ? "أعد المهمة نفسها الآن إن رغبت. لن نطلب إجابة أفضل، ولن نوقف دراستك إن أجلتها." : `تُفتح العينة بعد مرور 28 يومًا كاملة من خط البداية (${dueDateAr}). لا توجد درجة أو تنبيه قسري.`}</p>
        {available&&<button className="primary-button" type="button" onClick={() => setStage("four-week-follow-up")}>ابدأ عينة الأسبوع الرابع</button>}
      </div>
      <p className="productive-sample-boundary">التقدير الإنتاجي يقارن حجم ما اخترت إنتاجه وتقييمك الذاتي فقط. لا يصحح التطبيق الكتابة أو الكلام، ولا ينتج درجة لغة أو CEFR.</p>
    </>}
    {message&&<p className="productive-sample-message" role="status">{message}</p>}
  </section>;
}
