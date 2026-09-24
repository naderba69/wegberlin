"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, ClipboardCheck, Gauge, Headphones, Pause, Play, ShieldCheck } from "lucide-react";
import { diagnosticForms, diagnosticSkills, type DiagnosticQuestion } from "@/data/diagnostic";
import { libraryAudioAssetByItemId } from "@/data/library-audio-assets";
import { listeningLibrary } from "@/data/library-registry";
import { alternateDiagnosticForm, nextDiagnosticLevel, questionsForDiagnosticLevel, scoreDiagnosticLevel } from "@/core/diagnostic/adaptive";
import { evaluateDiagnostic } from "@/core/diagnostic/evaluate";
import type { DiagnosticProductiveSample, DiagnosticResult, DiagnosticSkill } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { ResilientAudioPlayer } from "./resilient-audio-player";
import { StatusAnnouncement } from "./status-announcement";
import { fragmentLanguageAttributes } from "@/core/i18n/language-boundary";
import { DiagnosticProductiveSampleStep } from "./diagnostic-productive-sample";
import { SkillDiagnosticRetest } from "./skill-diagnostic-retest";

const skillLabels: Record<DiagnosticSkill, string> = {
  grammar: "القواعد والاستعمال",
  vocabulary: "المفردات والتراكيب",
  reading: "فهم القراءة",
  listening: "فهم الاستماع",
};
const confidenceLabels = { low: "حدود غير حاسمة", medium: "ثقة متوسطة", high: "حد واضح في هذه العينة" };
function restoreDiagnosticQuestions(formId:"A"|"B",ids:string[]){const byId=new Map(diagnosticForms[formId].map((question)=>[question.id,question]));return ids.flatMap((id)=>{const question=byId.get(id);return question?[question]:[]})}

export function DiagnosticView() {
  const { state, update } = useLearning();
  const restoredDraft=state.diagnosticSessionDraft;
  const [formId] = useState(() => restoredDraft?.formId??alternateDiagnosticForm(state.diagnosticResult?.formId));
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>(() => restoredDraft?.formId===formId?restoreDiagnosticQuestions(formId,restoredDraft.questionIds):questionsForDiagnosticLevel(formId, "A1"));
  const [index, setIndex] = useState(()=>restoredDraft?.formId===formId?Math.min(restoredDraft.index,restoredDraft.questionIds.length-1):0);
  const [answers, setAnswers] = useState<Record<string, number>>(()=>restoredDraft?.formId===formId?restoredDraft.answers:{});
  const [paused,setPaused]=useState(()=>restoredDraft?.formId===formId&&restoredDraft.status==="paused");
  const [pendingEvaluation, setPendingEvaluation] = useState<ReturnType<typeof evaluateDiagnostic> | null>(null);
  const [finalResult, setFinalResult] = useState<DiagnosticResult | null>(null);
  const [fullRetest, setFullRetest] = useState(false);
  const question = questions[index];
  const selected = answers[question?.id];
  const levelQuestions = question ? questionsForDiagnosticLevel(formId, question.level) : [];
  const levelPosition = question ? levelQuestions.findIndex((item) => item.id === question.id) : 0;
  const percent = Math.round(((levelPosition + (selected !== undefined ? 1 : 0)) / Math.max(levelQuestions.length, 1)) * 100);
  const audioItem = question?.audioItemId ? listeningLibrary.find((item) => item.id === question.audioItemId) : undefined;
  const audioAsset = question?.audioItemId ? libraryAudioAssetByItemId[question.audioItemId] : undefined;
  const currentLevelStart = question ? questions.findIndex((item) => item.level === question.level) : 0;

  function select(value: number) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  }

  function prepareProductiveSample(currentAnswers: Record<string, number>) {
    setPendingEvaluation(evaluateDiagnostic(currentAnswers, formId));
  }

  function pauseForFatigue(){const now=new Date().toISOString();update((current)=>({...current,diagnosticSessionDraft:{policyVersion:"fatigue-pause-resume-diagnostic-v1",formId,questionIds:questions.map((item)=>item.id),index,answers,status:"paused",pauseReason:"learner-fatigue",evidenceBoundary:"resume-process-only-no-score-mastery-or-fatigue-diagnosis",updatedAt:now}}));setPaused(true)}
  function resumeAfterPause(){update((current)=>current.diagnosticSessionDraft?{...current,diagnosticSessionDraft:{...current.diagnosticSessionDraft,status:"active",updatedAt:new Date().toISOString()}}:current);setPaused(false)}

  function finish(sample: DiagnosticProductiveSample) {
    if (!pendingEvaluation) return;
    const result: DiagnosticResult = { ...pendingEvaluation.result, productiveSample: sample, completedAt: sample.submittedAt };
    update((current) => ({
      ...current,
      diagnosticResult: result,
      diagnosticSessionDraft:null,
      profile: current.profile ? { ...current.profile, currentLevel: result.estimatedLevel } : null,
      errors: [...current.errors.filter((error) => !error.id.startsWith("diagnostic-")), ...pendingEvaluation.errors],
      mastery: { ...current.mastery, diagnostic: Math.round((result.score / Math.max(result.maxScore, 1)) * 100) },
      studyHistory: [...current.studyHistory, {
        date: new Date().toISOString().slice(0, 10),
        minutes: Math.max(5, Math.ceil((result.questionsAnswered ?? result.maxScore) * 0.75) + (sample.mode === "not-yet" ? 1 : 2)),
        evidenceCount: result.questionsAnswered ?? result.maxScore,
      }],
    }));
    setFinalResult(result);
    setPendingEvaluation(null);
  }

  function next() {
    if (selected === undefined) return;
    if (index < questions.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    const correct = scoreDiagnosticLevel(levelQuestions, answers);
    const nextLevel = nextDiagnosticLevel(question.level, correct);
    if (nextLevel) {
      const nextQuestions = questionsForDiagnosticLevel(formId, nextLevel);
      setQuestions((current) => [...current, ...nextQuestions]);
      setIndex((current) => current + 1);
    } else {
      prepareProductiveSample(answers);
    }
  }

  if (state.diagnosticResult && !fullRetest && !pendingEvaluation && !finalResult) return <SkillDiagnosticRetest onFullRetest={() => setFullRetest(true)}/>;
  if (pendingEvaluation) return <DiagnosticProductiveSampleStep estimatedLevel={pendingEvaluation.result.estimatedLevel} onComplete={finish}/>;
  if(paused)return <section className="diagnostic-pause-card" data-diagnostic-resume-policy="fatigue-pause-resume-diagnostic-v1"><Pause size={30}/><small lang="de" dir="ltr">Pause wegen Müdigkeit</small><h1>توقف الآن، وأكمل من السؤال نفسه لاحقًا.</h1><p>حُفظت اختياراتك وموضعك محليًا. التعب تصريح منك وليس تشخيصًا، ولا يحسب التوقف خطأ أو نتيجة أو إتقانًا.</p><div><button className="primary-button" type="button" onClick={resumeAfterPause}><Play size={16}/> استأنف السؤال {index+1}</button><Link className="secondary-button" href="/today">عد إلى مهمة اليوم</Link></div></section>;

  if (finalResult) {
    const result = finalResult;
    const confidence = result.confidence ?? "low";
    return <div className="diagnostic-result">
      <span className="result-orb"><Gauge size={29}/></span>
      <small>تقدير أولي متكيف · الصيغة {result.formId} · ليس شهادة رسمية</small>
      <h1>نقطة البداية المقترحة: <em>{result.estimatedLevel}</em></h1>
      <p>أجبت عن {result.score} من {result.maxScore} في {result.questionsAnswered} سؤالًا. {result.stoppedEarly ? "توقف التشخيص مبكرًا لأن حد المستوى ظهر قبل الحاجة إلى بقية البنك." : "اكتمل البنك حتى B2."} سيواصل المدرب التحقق من كل مهارة.</p>
      <StatusAnnouncement message={`اكتمل التشخيص: نقطة البداية المقترحة ${result.estimatedLevel} من ${result.questionsAnswered} سؤالًا. النتيجة داخلية وليست حكم CEFR رسميًا.`} channel="diagnostic-result" className="compact"/>
      <div className="diagnostic-confidence"><ShieldCheck size={17}/><span><strong>{confidenceLabels[confidence]}</strong><small>الثقة تخص هذه العينة فقط، ولا تساوي حكم CEFR رسميًا.</small></span></div>
      <div className="level-score-grid">{(["A1", "A2", "B1", "B2"] as const).map((level) => {
        const attempted = result.levelAttempted?.[level] ?? 0;
        return <div key={level}><strong>{level}</strong><span>{attempted ? `${result.levelScores[level]}/${attempted}` : "لم يُسأل"}</span><i><b style={{ width: `${attempted ? (result.levelScores[level] / attempted) * 100 : 0}%` }}/></i></div>;
      })}</div>
      {result.skillScores && <section className="diagnostic-skill-report"><h2>الأدلة حسب المهارة</h2><div>{diagnosticSkills.map((skill) => {
        const evidence = result.skillScores![skill];
        return <article key={skill}><span>{skillLabels[skill]}</span><strong>{evidence.correct}/{evidence.attempted}</strong></article>;
      })}</div><p>لا توجد مهمة إملاء كتابية هنا، لذلك لا يساوي التشخيص بين خطأ الإملاء وضعف الفهم.</p></section>}
      {result.productiveSample&&<section className="diagnostic-productive-summary"><h2>Produktionsprobe · العينة الإنتاجية</h2><div><span><b>{result.productiveSample.mode==="not-yet"?"لم تُنتج بعد":result.productiveSample.mode.includes("writing")?`${result.productiveSample.writingWordCount} كلمات مكتوبة`:"تسجيل شفهي"}</b><small>{result.productiveSample.speakingDurationSeconds?` · ${result.productiveSample.speakingDurationSeconds} ثانية صوت محلي`:""}</small></span><strong>{result.productiveSample.selfAssessment==="independent"?"دون مساعدة":result.productiveSample.selfAssessment==="with-help"?"بمساعدة أو تردد":"لا أستطيع بعد"}</strong></div><p>محفوظة كدليل ذاتي بلا تصحيح أو درجة لغة، ولم تغيّر نتيجة القواعد أو المفردات أو القراءة أو الاستماع.</p></section>}
      <div className="result-actions"><Link className="primary-button" href="/today">ابنِ مهمتي التالية <ArrowLeft size={17}/></Link><Link className="secondary-button" href="/errors">شاهد الفجوات المكتشفة</Link></div>
    </div>;
  }

  return <div className="diagnostic-page">
    <header><div><span className="eyebrow"><ClipboardCheck size={15}/> تشخيص متكيف · الصيغة {formId}</span><h1>نبحث عن نقطة البداية،<br/><em>لا عن علامة جميلة.</em></h1><p>أجب دون قاموس. كل مستوى يفحص القواعد والمفردات والقراءة والاستماع، ويتوقف البنك عندما يظهر الحد بدل فرض الأسئلة الأعلى عليك.</p></div><div className="diagnostic-meta"><ShieldCheck size={18}/><span>محلي بالكامل<br/><small><bdi dir="ltr" data-bidi-scope="numeric">4–16</bdi> سؤالًا · نحو <bdi dir="ltr" data-bidi-scope="numeric">3–12</bdi> دقيقة</small></span></div></header>
    <div className="diagnostic-progress"><span>السؤال {index + 1} · العنصر {levelPosition + 1} من 4 في {question.level}</span><i><b style={{ width: `${percent}%` }}/></i><strong>{question.level}</strong></div>
    <section className="question-card">
      <small>{skillLabels[question.skill]}</small>
      {question.contextDe && <article className="diagnostic-reading" lang="de" dir="ltr"><BookOpenCheck size={17}/><p lang="de" dir="ltr">{question.contextDe}</p></article>}
      {audioItem && audioAsset && <div className="diagnostic-listening"><header><Headphones size={17}/><span><strong lang="de" dir="ltr">{audioItem.titleDe}</strong><small>استمع دون فتح النص. إن رفض جهازك MP3 يظهر بديل صوت المتصفح تلقائيًا؛ كلاهما تدريبي وغير امتحاني.</small></span></header><ResilientAudioPlayer src={audioAsset.path} transcriptDe={audioItem.transcriptDe} expectedDurationMs={audioAsset.durationMs} label={`مقطع التشخيص ${audioItem.titleAr}`} listeningSurface="diagnostic" listeningContentId={audioItem.id}/></div>}
      <h2>{question.prompt}</h2>
      <div className="option-list" lang="de" dir="ltr">{question.options.map((option, optionIndex) => <button key={option} onClick={() => select(optionIndex)} className={selected === optionIndex ? "selected" : ""}><span>{String.fromCharCode(65 + optionIndex)}</span><b {...fragmentLanguageAttributes(option)}>{option}</b>{selected === optionIndex && <Check size={17}/>}</button>)}</div>
    </section>
    <footer className="diagnostic-controls"><button className="secondary-button" onClick={() => setIndex((current) => Math.max(currentLevelStart, current - 1))} disabled={index === currentLevelStart}><ArrowRight size={17}/> السابق داخل المستوى</button><button className="secondary-button" type="button" onClick={pauseForFatigue}><Pause size={17}/> تعبت — أكمل لاحقًا</button><button className="primary-button" onClick={next} disabled={selected === undefined}>{index === questions.length - 1 ? (question.level === "B2" ? "إنهاء التشخيص" : "قيّم هذا المستوى") : "السؤال التالي"}<ArrowLeft size={17}/></button></footer>
  </div>;
}
