"use client";

import Link from "next/link";
import { Activity, ArrowLeft, BookCheck, CircleAlert, Clock3, Gauge, Goal, LifeBuoy, Mic2, PenLine, RotateCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import { buildEvidenceReport } from "@/core/evidence/report";
import { EvidenceAchievements } from "@/components/evidence-achievements";
import { masteryDerivationSummary } from "@/core/evidence/event-derived-mastery";

const confidenceAr = { none: "لا دليل", low: "عينة أولية", medium: "عينة متوسطة", high: "عينة قوية" };

export default function ProgressPage() {
  const { state } = useLearning();
  const report = buildEvidenceReport(state, new Date());
  const minutes = state.studyHistory.reduce((sum, day) => sum + day.minutes, 0);
  const evidence = state.studyHistory.reduce((sum, day) => sum + day.evidenceCount, 0);
  const writing = report.skills.find((skill) => skill.key === "writing")!;
  const speaking = report.skills.find((skill) => skill.key === "speaking")!;
  const masteryDerivation=masteryDerivationSummary(state);

  return <div className="wide-page progress-evidence-page">
    <header className="page-heading"><div><span className="eyebrow"><TrendingUp size={15}/> أدلة لا نقرات</span><h1>ما تستطيع فعله <em>فعليًا</em></h1><p>كل مؤشر أدناه مشتق من محاولاتك الفريدة وتغطية الدروس وحداثة الدليل. لا نعرض قيم بداية ثابتة ولا نحولها إلى مستوى CEFR رسمي.</p></div></header>

    <div className="metrics-grid">
      <article><span><BookCheck size={20}/></span><small>الدروس المكتملة</small><strong>{state.completedLessonIds.length}<i>/84</i></strong></article>
      <article><span><Activity size={20}/></span><small>دقائق موثّقة</small><strong>{minutes}</strong></article>
      <article><span><Goal size={20}/></span><small>أدلة الأداء</small><strong>{evidence}</strong></article>
      <article><span><RotateCcw size={20}/></span><small>مراجعات مستحقة</small><strong>{report.dueReviews}</strong></article>
    </div>

    {state.motivationPreferences.gamificationVisible&&<EvidenceAchievements state={state}/>}

    <section className="evidence-overview">
      <div><span><Gauge size={22}/></span><div><small>مؤشر الأدلة الداخلي</small><strong>{report.overallScore === null ? "—" : `${report.overallScore}%`}</strong><p>{report.overallScore === null ? "نحتاج أدلة من ثلاث مهارات على الأقل قبل حساب المتوسط." : `${confidenceAr[report.overallConfidence]} · مبني على المهارات التي لديها بيانات فقط.`}</p></div></div>
      <div className="evidence-overview-stats"><span><b>{report.reviewedCards}</b>/{report.eligibleCards} بطاقات شوهدت</span><span><b>{report.successfulDelayedCards}</b> بطاقات نجحت بعد موعدها · {report.retentionConfirmedLessons} دروس بعينة احتفاظ</span><span><b>{report.activeErrors}</b> أخطاء نشطة · {report.highConfidenceErrors} عالية الثقة · {report.misconceptionRiskErrors} خطر تصور · {report.personalErrorSrsCards} بطاقات علاج</span><span><b>{report.errorsPer100CheckedItems === null ? "—" : report.errorsPer100CheckedItems}</b> خطأ لكل 100 عنصر متحقق منه · {report.wrongCheckedItemCount}/{report.checkedItemCount}</span><span><b>{report.studyStreakDays}</b> أيام دراسة ضمن استمرارية {report.graceDayDate&&<small>· سماح {report.graceDayDate}</small>}</span><span><b>{report.supportUsage.total}</b> طلبات دعم على {report.supportUsage.distinctContent} عناصر</span></div>
    </section>
    <section className="mastery-derivation-card" data-mastery-derivation-policy={masteryDerivation.policyVersion}>
      <header><ShieldCheck size={18}/><div><small>مصدر الإتقان القابل للتدقيق</small><h2>القيمة المعروضة Cache مشتق، وسجل الأحداث هو المرجع الجديد.</h2></div><strong>{masteryDerivation.eventCount}</strong></header>
      <div><span><b>{masteryDerivation.eventDerivedKeys}</b> مفاتيح أعيد حسابها من الأحداث</span><span><b>{masteryDerivation.legacyFallbackCount}</b> مفاتيح قديمة بلا Event بعد</span></div>
      <p>{masteryDerivation.legacyFallbackCount?"القيم القديمة تبقى Legacy fallback حتى تنتج محاولة جديدة لذلك المفتاح؛ لا نخترع Events رجعية.":"كل مفاتيح الإتقان الحالية لها سجل أحداث قابل لإعادة الحساب بعد الدمج."}</p>
      <footer>سياسة `{masteryDerivation.policyVersion}` · Merge يوحّد Event IDs ثم يعيد الحساب؛ لا يأخذ أعلى رقم تلقائيًا.</footer>
    </section>
    <section className="assistance-separation-card" data-assistance-separation-policy={report.assistanceSeparation.policyVersion}>
      <header><LifeBuoy size={18}/><div><small>الموجّه ليس هو المستقل</small><h2>نفصل نجاح التمرين مع الدعم عن النقل دون دعم.</h2></div></header>
      <div><span><b>{report.assistanceSeparation.buckets.guided.attempted}</b> تدريب موجّه <small>{report.assistanceSeparation.buckets.guided.accuracyPercent===null?"—":`${report.assistanceSeparation.buckets.guided.accuracyPercent}%`} دقة</small></span><span><b>{report.assistanceSeparation.buckets.transferIndependent.attempted}</b> نقل مستقل <small>{report.assistanceSeparation.buckets.transferIndependent.accuracyPercent===null?"—":`${report.assistanceSeparation.buckets.transferIndependent.accuracyPercent}%`} دقة</small></span><span><b>{report.assistanceSeparation.buckets.transferAssisted.attempted}</b> نقل مع دعم <small>{report.assistanceSeparation.buckets.transferAssisted.accuracyPercent===null?"—":`${report.assistanceSeparation.buckets.transferAssisted.accuracyPercent}%`} دقة</small></span><span><b>{report.assistanceSeparation.buckets.assisted.attempted}</b> كل المحاولات المدعومة <small>مقابل {report.assistanceSeparation.buckets.independent.attempted} مستقلة</small></span></div>
      <p>{report.assistanceSeparation.recommendationAr}</p><footer>تُحسب أحدث محاولة فريدة فقط. الترجمة أو النص المفتوح بعد الالتزام لا يجعل المحاولة السابقة «مدعومة»، ولا تُقيّم الكتابة أو الكلام الحر آليًا.</footer>
    </section>
    <section className="attempt-process-card" data-attempt-process-summary={report.attemptProcess.policyVersion}>
      <header><Clock3 size={18}/><div><small>زمن وتغييرات بلا مراقبة كتابة</small><h2>كيف جرت المحاولة؟</h2></div><strong>{report.attemptProcess.attemptCount}</strong></header>
      <div><span><b>{report.attemptProcess.medianResponseTimeMs===null?"—":`${Math.round(report.attemptProcess.medianResponseTimeMs/1000)} ث`}</b> وسيط زمن الجواب المرئي</span><span><b>{report.attemptProcess.answerChangeCount}</b> تغييرات اختيار ملتزمة</span><span><b>{report.attemptProcess.uncertainty.guess}</b> تخمينات مصرّح بها</span><span><b>{report.attemptProcess.uncertainty.instructionUnclear}</b> تعليمات غير واضحة</span><span><b>{report.attemptProcess.directPreCommitSupportedAttempts}</b> محاولات بدعم مباشر</span></div>
      <p>{report.attemptProcess.recommendationAr}</p><footer>لا نسجل ضغطات المفاتيح أو النص الوسيط أو حركة المؤشر. الزمن يستبعد مدة إخفاء الصفحة ويُحد عند 30 دقيقة، ولا يصبح درجة ذكاء أو CEFR أو mastery.</footer>
    </section>
    <p className="error-rate-boundary">الاحتفاظ لا يُثبت من كشف البطاقة لأول مرة؛ نحتاج نجاحًا بعد حلول موعد مؤجل، وأربع بطاقات مؤجلة ناجحة قبل وصف الدرس بأنه يملك عينة احتفاظ. هذا ليس إتقانًا دائمًا. سياسة `weekly-grace-v1` تسمح بفاصل يوم واحد بين يومي دراسة دون اختلاق دليل لذلك اليوم أو تصفير العودة. معدل الخطأ يحسب كل تحقق مسجل، بما فيه الإعادة، ولا يدّعي تحليل أخطاء لكل 100 كلمة من الكتابة الحرة.</p>

    <section className="support-evidence-card" data-support-policy={report.supportUsage.policyVersion} data-freshness-policy={report.evidenceFreshnessPolicyVersion}>
      <header><span><LifeBuoy size={19}/></span><div><small>سياق للدعم، لا عقوبة</small><h2>كيف استعنت بالمساندة؟</h2><p>نسجل فتح المساعدة لنخطط تدريبًا أوضح، ولا نحوله إلى خطأ أو نجاح أو خصم من الإتقان.</p></div><strong>{report.supportUsage.total}</strong></header>
      <div><span><b>{report.supportUsage.hints}</b> تلميحات</span><span><b>{report.supportUsage.translations}</b> ترجمات قراءة</span><span><b>{report.supportUsage.transcripts}</b> نصوص مفرغة</span><span><b>{report.supportUsage.models}</b> نماذج مقارنة</span><span><b>{report.supportUsage.afterCommit}</b> بعد تثبيت محاولة</span></div>
      <footer><Clock3 size={14}/><p>سياسة الحداثة `{report.evidenceFreshnessPolicyVersion}` تخفّض <b>الثقة فقط</b> تدريجيًا بعد 30/90/180 يومًا. لا تحذف المحاولة ولا تغيّر الدرجة الخام أو mastery.</p></footer>
    </section>

    <div className="progress-grid evidence-progress-grid">
      <section className="chart-card">
        <div className="card-title"><span>توازن المهارات من الأدلة</span><small>ليس حكم CEFR</small></div>
        {report.skills.map((skill) => <div className="evidence-skill" key={skill.key}>
          <div className="skill-row"><span>{skill.labelAr}</span><i><b style={{width:`${skill.score ?? 0}%`}}/></i><strong>{skill.score === null ? "—" : `${skill.score}%`}</strong></div>
          <div className="evidence-skill-detail"><span>{skill.detailAr}</span><small className={`freshness-${skill.freshness.band}`} title={`الثقة قبل الحداثة: ${confidenceAr[skill.baseConfidence]}`}>{confidenceAr[skill.confidence]} · {skill.freshness.labelAr} · وزن ثقة {Math.round(skill.freshness.factor*100)}%</small></div>
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

    <section className="evidence-risks">
      <div className="section-heading"><div><span>مخاطر قابلة للعلاج</span><h2>ما الذي يحد الجاهزية الآن؟</h2></div><strong><ShieldCheck size={14}/> لا توجد درجة رسمية مصطنعة</strong></div>
      {report.risks.length ? <div>{report.risks.map((risk) => <Link href={risk.href} key={risk.id} className={risk.severity === "priority" ? "priority" : ""}><CircleAlert size={18}/><span><strong>{risk.titleAr}</strong><p>{risk.reasonAr}</p></span><ArrowLeft size={15}/></Link>)}</div> : <div className="evidence-no-risk"><ShieldCheck size={20}/><p>{state.completedLessonIds.length ? "لا توجد إشارة آلية قوية الآن؛ واصل جمع أدلة جديدة ومؤجلة." : "ستظهر المخاطر بعد بدء الدروس وجمع عينة فعلية."}</p></div>}
    </section>
  </div>;
}
