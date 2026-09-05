"use client";

import Link from "next/link";
import { Activity, ArrowLeft, BookCheck, CircleAlert, Gauge, Goal, Mic2, PenLine, RotateCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import { buildEvidenceReport } from "@/core/evidence/report";
import { DiagnosticSampleCard, DiagnosticSampleSummary } from "@/components/diagnostic-sample-card";

const confidenceAr = { none: "لا دليل", low: "عينة أولية", medium: "عينة متوسطة", high: "عينة قوية" };

export default function ProgressPage() {
  const { state } = useLearning();
  const report = buildEvidenceReport(state, new Date());
  const minutes = state.studyHistory.reduce((sum, day) => sum + day.minutes, 0);
  const evidence = state.studyHistory.reduce((sum, day) => sum + day.evidenceCount, 0);
  const writing = report.skills.find((skill) => skill.key === "writing")!;
  const speaking = report.skills.find((skill) => skill.key === "speaking")!;

  return <div className="wide-page progress-evidence-page">
    <header className="page-heading"><div><span className="eyebrow"><TrendingUp size={15}/> أدلة لا نقرات</span><h1>ما تستطيع فعله <em>فعليًا</em></h1><p>كل مؤشر أدناه مشتق من محاولاتك الفريدة وتغطية الدروس وحداثة الدليل. لا نعرض قيم بداية ثابتة ولا نحولها إلى مستوى CEFR رسمي.</p></div></header>

    <div className="metrics-grid">
      <article><span><BookCheck size={20}/></span><small>الدروس المكتملة</small><strong>{state.completedLessonIds.length}<i>/84</i></strong></article>
      <article><span><Activity size={20}/></span><small>دقائق موثّقة</small><strong>{minutes}</strong></article>
      <article><span><Goal size={20}/></span><small>أدلة الأداء</small><strong>{evidence}</strong></article>
      <article><span><RotateCcw size={20}/></span><small>مراجعات مستحقة</small><strong>{report.dueReviews}</strong></article>
    </div>

    <section className="evidence-overview">
      <div><span><Gauge size={22}/></span><div><small>مؤشر الأدلة الداخلي</small><strong>{report.overallScore === null ? "—" : `${report.overallScore}%`}</strong><p>{report.overallScore === null ? "نحتاج أدلة من ثلاث مهارات على الأقل قبل حساب المتوسط." : `${confidenceAr[report.overallConfidence]} · مبني على المهارات التي لديها بيانات فقط.`}</p></div></div>
      <div className="evidence-overview-stats"><span><b>{report.reviewedCards}</b>/{report.eligibleCards} بطاقات شوهدت</span><span><b>{report.successfulDelayedCards}</b> بطاقات نجحت بعد موعدها · {report.retentionConfirmedLessons} دروس بعينة احتفاظ</span><span><b>{report.activeErrors}</b> أخطاء نشطة · {report.dueErrorReviews} اختبار مؤجل مستحق</span><span><b>{report.errorsPer100CheckedItems === null ? "—" : report.errorsPer100CheckedItems}</b> خطأ لكل 100 عنصر متحقق منه · {report.wrongCheckedItemCount}/{report.checkedItemCount}</span><span><b>{report.studyStreakDays}</b> أيام متتالية</span></div>
    </section>
    <p className="error-rate-boundary">الاحتفاظ لا يُثبت من كشف البطاقة لأول مرة؛ نحتاج نجاحًا بعد حلول موعد مؤجل، وأربع بطاقات مؤجلة ناجحة قبل وصف الدرس بأنه يملك عينة احتفاظ. هذا ليس إتقانًا دائمًا. معدل الخطأ يحسب كل تحقق مسجل، بما فيه الإعادة، ولا يدّعي تحليل أخطاء لكل 100 كلمة من الكتابة الحرة.</p>

    <div className="progress-grid evidence-progress-grid">
      <section className="chart-card">
        <div className="card-title"><span>توازن المهارات من الأدلة</span><small>ليس حكم CEFR</small></div>
        {report.skills.map((skill) => <div className="evidence-skill" key={skill.key}>
          <div className="skill-row"><span>{skill.labelAr}</span><i><b style={{width:`${skill.score ?? 0}%`}}/></i><strong>{skill.score === null ? "—" : `${skill.score}%`}</strong></div>
          <div className="evidence-skill-detail"><span>{skill.detailAr}</span><small>{confidenceAr[skill.confidence]}</small></div>
          <p>{skill.boundaryAr}</p>
        </div>)}
        <p className="chart-note">النتيجة ترتفع بالدقة وتنوع المهام وتغطية أكثر من درس، ولا ترتفع بتكرار السؤال نفسه.</p>
      </section>

      <section className="evidence-card production-evidence-card">
        <div className="card-title"><span>الإنتاج المستقل</span><small>أدلة كمية صادقة</small></div>
        <article><span><PenLine size={18}/></span><div><strong>الكتابة</strong><p>{writing.detailAr}</p><small>{writing.boundaryAr}</small></div></article>
        <article><span><Mic2 size={18}/></span><div><strong>المحادثة</strong><p>{speaking.detailAr}</p><small>{speaking.boundaryAr}</small></div></article>
        <div className="evidence-next-action"><small>المهمة العلاجية التالية</small><strong>{report.nextAction.titleAr}</strong><p>{report.nextAction.reasonAr}</p><Link href={report.nextAction.href}>ابدأ الآن <ArrowLeft size={14}/></Link></div>
      </section>
    </div>

    {state.diagnosticResult && <section className="diagnostic-samples-section">
      <div className="section-heading"><div><span>P0-26 · عينة الإنتاج</span><h2>أثرك الإنتاجي بعد التشخيص</h2></div><strong><ShieldCheck size={14}/> بلا تقييم آلي</strong></div>
      <p className="error-rate-boundary">العينة مرجع لك تعود إليه لتقارن كتابتك وكلامك اليوم بما سيصبح بعد أسابيع. لا يصحّحها البرنامج ولا يقيّمها ولا تُحتسب في مؤشر الأدلة أعلاه.</p>
      <DiagnosticSampleSummary/>
      <DiagnosticSampleCard level={state.diagnosticResult.estimatedLevel} formId={state.diagnosticResult.formId}/>
    </section>}

    <section className="evidence-risks">
      <div className="section-heading"><div><span>مخاطر قابلة للعلاج</span><h2>ما الذي يحد الجاهزية الآن؟</h2></div><strong><ShieldCheck size={14}/> لا توجد درجة رسمية مصطنعة</strong></div>
      {report.risks.length ? <div>{report.risks.map((risk) => <Link href={risk.href} key={risk.id} className={risk.severity === "priority" ? "priority" : ""}><CircleAlert size={18}/><span><strong>{risk.titleAr}</strong><p>{risk.reasonAr}</p></span><ArrowLeft size={15}/></Link>)}</div> : <div className="evidence-no-risk"><ShieldCheck size={20}/><p>{state.completedLessonIds.length ? "لا توجد إشارة آلية قوية الآن؛ واصل جمع أدلة جديدة ومؤجلة." : "ستظهر المخاطر بعد بدء الدروس وجمع عينة فعلية."}</p></div>}
    </section>
  </div>;
}
