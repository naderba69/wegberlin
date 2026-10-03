"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CEFRLevel, ExerciseAttempt } from "@/types/learning";
import { levelAssessmentQuestions, levelAssessmentDomains, type AssessmentFormId } from "@/data/level-assessment-bank";
import { independentProductionTasks } from "@/data/independent-production-tasks";
import { buildLevelEvidenceGate, diagnosticSuggestsChallenge, nextAssessmentForm } from "@/core/assessment/level-evidence";
import { shuffledQuestionOptions } from "@/core/lesson/shuffle";
import { fragmentLanguageAttributes } from "@/core/i18n/language-boundary";
import { studyDayKey } from "@/core/coach/session-signals";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";

export function LevelAssessment({ level }: { level: CEFRLevel }) {
  const { ready } = useLearning();
  if (!ready) return <div className="loading-state"><p>نحمّل الأدلة المحلية قبل اختيار صيغة التقييم…</p></div>;
  return <LevelAssessmentForm level={level} />;
}

function LevelAssessmentForm({ level }: { level: CEFRLevel }) {
  const { state, update } = useLearning();
  const [formId, setFormId] = useState<AssessmentFormId>(() => nextAssessmentForm(state, level));
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [visibleSeconds, setVisibleSeconds] = useState(0);
  const submittedRef = useRef(false);
  const questions = levelAssessmentQuestions(level, formId);
  const required = Math.ceil(questions.length * .8);
  const gate = buildLevelEvidenceGate(state, level);
  const placement = diagnosticSuggestsChallenge(state, level) && gate.completed < gate.requiredLessons;
  const previouslySeen = questions.some((question) => state.exerciseAttempts.some((attempt) => attempt.exerciseId === question.id));
  const score = questions.filter((question) => answers[question.id] === question.correctIndex).length;
  const tasks = independentProductionTasks.filter((task) => task.level === level);
  const nextWriting = tasks.find((task) => !state.writingSubmissions.some((item) => item.taskId === `${task.id}-writing` && item.status !== "draft")) ?? tasks[0];
  const nextSpeaking = tasks.find((task) => !state.speakingAttempts.some((item) => item.taskId === `${task.id}-speaking`)) ?? tasks[0];

  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") setVisibleSeconds((seconds) => seconds + 1); }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished]);

  function finish() {
    if (submittedRef.current || Object.keys(answers).length !== questions.length) return;
    submittedRef.current = true;
    const now = new Date();
    const createdAt = now.toISOString();
    const runId = `level-run-${crypto.randomUUID()}`;
    const attempts: ExerciseAttempt[] = questions.map((question) => ({
      id: `${runId}:${question.id}`, lessonId: `assessment-${level.toLowerCase()}`, exerciseId: question.id,
      answer: question.options[answers[question.id]], answerIndex: answers[question.id], correct: answers[question.id] === question.correctIndex,
      evidenceContext: { policyVersion: "independent-assessment-v1", kind: placement ? "placement-challenge" : "level-check", level, formId, runId, independent: true, expectedItems: questions.length },
      createdAt,
    }));
    update((current) => {
      const candidate = { ...current, exerciseAttempts: [...current.exerciseAttempts, ...attempts], studyHistory: [...current.studyHistory, { date: studyDayKey(new Date(createdAt)), minutes: Math.ceil(visibleSeconds/60), evidenceCount: questions.length }] };
      const evaluated = buildLevelEvidenceGate(candidate, level, now);
      return { ...candidate, mastery: { ...candidate.mastery, [`level-${level.toLowerCase()}-knowledge`]: Math.round(score/questions.length*100), [`level-${level.toLowerCase()}-ready`]: evaluated.passed ? 100 : 0 } };
    });
    setFinished(true);
  }

  const criteriaRows: [boolean,string,string][] = [
    [gate.criteria.orientation, "نقطة البداية", "التشخيص أو اختيار البداية من الصفر؛ لا نعيد فرض التشخيص على المبتدئ."],
    [gate.prerequisite, "المتطلبات السابقة", "بوابات سابقة بدليل مستقل، لا رقم قديم وحده."],
    [gate.criteria.knowledge, "المعرفة المستقلة", `${gate.latestRun?.score??0}/${questions.length}؛ المطلوب ${required}، وحد أدنى في كل مجال. الإعادة الفورية تدريب فقط؛ الإعادة بعد ثلاثة أيام دليل مؤجل لا جديد.`],
    [gate.criteria.curriculum, "أنشطة المنهج أو تحدّي تجاوز مثبت", `${gate.completed}/${gate.requiredLessons} دروس؛ التشخيص وحده لا يكملها.`],
    [gate.criteria.writing, "كتابات مستقلة فريدة وحديثة", `${gate.writing}/${gate.requiredProductiveSamples} مهام خلال 30 يومًا؛ النموذج والنسخ والتنقيحات لا تضاعف العينة.`],
    [gate.criteria.speaking, "كلام مستقل فريد وحديث", `${gate.speaking}/${gate.requiredProductiveSamples} مهام خلال 30 يومًا، دون عبارات نموذجية أثناء التسجيل.`],
    [gate.criteria.retention, "احتفاظ مؤجل", `${gate.retainedLessons}/3 دروس بعينة استرجاع، أو نجاح صيغتين مستقلتين بفاصل ثلاثة أيام.`],
  ];

  return <div className="wide-page" data-level-assessment-policy="independent-level-transition-v2">
    <header className="page-heading"><div><span className="eyebrow">تقييم معرفة داخلي · {level}</span><p lang="de" dir="ltr">Unabhängige Lernkontrolle · {level}</p><h1>{placement?"تحدّي تجاوز مبني على الدليل":"تحقق من المعرفة، ثم راجع الإنتاج"}</h1><p>{questions.length} سؤالًا من بنك مستقل عن أسئلة الدروس، موزعة على ستة مجالات. عتبة المعرفة {required}/{questions.length}، وليست نتيجة Goethe أو telc.</p></div><div className="path-summary"><strong>{finished?score:Object.keys(answers).length}</strong><span>من {questions.length}</span></div></header>
    <section className="assessment-warning"><p>{gate.boundaryAr}</p><p>البنك مؤلف للمشروع بصيغتين متوازيتين؛ مراجعة اللغة والمحاذاة المستقلة ومعايرة الصعوبة ما زالت معلقة.</p>{gate.legacyReadyUnverified&&<p>علامة انتقال قديمة محفوظة، لكنها لا تثبت الشروط الجديدة. لا نحذف تقدمك ولا نخترع محاولة بديلة.</p>}{previouslySeen&&<p>سبق أن شاهدت هذه الصيغة. الإعادة ليست سؤالًا جديدًا. يمكن احتساب إعادة بلا مساعدة بعد ثلاثة أيام كاختبار مؤجل، ولا تُسمّى نقلًا جديدًا أو شهادة.</p>}</section>
    {!started&&!finished&&<section className="assessment-start"><p>أجب دون فتح مصادر أو نماذج. التفسيرات مخفية حتى تسليم جميع الأجوبة. الزمن المسجل هو زمن الصفحة المرئي، لا مدة ثابتة مفترضة.</p><button className="primary-button" onClick={()=>setStarted(true)}>ابدأ الصيغة <span data-bidi-scope="technical" dir="ltr">{formId}</span></button></section>}
    {started&&!finished&&<><div className="level-question-list">{levelAssessmentDomains[level].map((domain)=><section key={domain.id}><header><strong>{domain.titleAr}</strong><span>{questions.filter(question=>question.domainId===domain.id&&answers[question.id]!==undefined).length}/{questions.filter(question=>question.domainId===domain.id).length}</span></header>{questions.filter(question=>question.domainId===domain.id).map((question,index)=>{
      const shuffled=shuffledQuestionOptions(question,`level-check:${formId}`);
      return <article key={question.id} data-assessment-question-id={question.id}><small>{index+1}</small><div><h3 lang="de" dir="ltr">{question.promptDe}</h3></div><label><span className="sr-only">جواب السؤال من مجال {question.domainAr}</span><select aria-label={`جواب ${domain.titleAr} ${index+1}`} value={answers[question.id]??""} onChange={(event)=>setAnswers(current=>({...current,[question.id]:Number(event.target.value)}))}><option value="">اختر الجواب</option>{shuffled.options.map(option=><option key={option.label} value={option.originalIndex} {...fragmentLanguageAttributes(option.label)}>{option.label}</option>)}</select></label></article>;
    })}</section>)}</div><button className="primary-button level-submit" disabled={Object.keys(answers).length!==questions.length} onClick={finish}>سلّم {questions.length} جوابًا واحسب الشروط</button></>}
    {finished&&<><StatusAnnouncement message={`اكتمل تقييم ${level}: ${score} من ${questions.length}. ${gate.passed?"شروط الانتقال الداخلي متحققة، وليست شهادة.":"توجد شروط ناقصة؛ راجع القائمة."}`} channel={`assessment-${level.toLowerCase()}-result`} className="compact"/><section className="level-result"><h2>{gate.passed?"شروط الانتقال الداخلي متحققة":"نجاح المعرفة وحده لا يكفي"}</h2><div className="gate-criteria">{criteriaRows.map(([passed,label,detail])=><article key={label} className={passed?"passed":""}><span>{passed?"✓":"○"}</span><div><strong>{label}</strong><small>{detail}</small></div></article>)}</div><p>لا توجد درجة آلية لجودة الكتابة والكلام. المؤشر يثبت مصدر المحاولة والتغطية والاحتفاظ المحدود فقط.</p><div className="level-production-actions"><Link className="primary-button" href={`/writing?task=${nextWriting.id}`}>مهمة كتابة مستقلة جديدة</Link><Link className="secondary-button" href={`/speaking?task=${nextSpeaking.id}`}>مهمة كلام مستقلة جديدة</Link><Link className="secondary-button" href="/review">استرجاع مؤجل</Link><Link className="secondary-button" href="/today">راجع مهمة اليوم</Link></div></section><section className="assessment-review"><h2>تفسير الأجوبة بعد التسليم</h2>{questions.map(question=><details key={question.id}><summary>{answers[question.id]===question.correctIndex?"✓":"○"} {question.domainAr} · <span lang="de" dir="ltr">{question.promptDe}</span></summary><p lang="de" dir="ltr">{question.options[question.correctIndex]}</p><p>{question.explanationAr}</p></details>)}</section><button className="secondary-button" onClick={()=>{setFormId(nextAssessmentForm(state,level));setAnswers({});setFinished(false);setStarted(false);setVisibleSeconds(0);submittedRef.current=false;}}>افتح الصيغة البديلة؛ ليست إعادة الأسئلة نفسها</button></>}
  </div>;
}
