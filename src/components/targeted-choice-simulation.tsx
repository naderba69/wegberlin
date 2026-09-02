"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, CircleAlert, Languages, RotateCcw, ShieldCheck, Timer } from "lucide-react";
import type { TargetedChoiceSimulation } from "@/types/exam";
import { examProfiles } from "@/data/exam-profiles";
import { useLearning } from "./learning-provider";
import { clearContinuousTaskDraft, continuousTaskDraft, findContinuousSessionForTask, markContinuousTaskComplete, saveContinuousTaskDraft } from "@/core/exams/continuous-session";
import { ContinuousTaskSubmitted } from "./continuous-exam-session";

export function TargetedChoiceSimulationView({ simulation }: { simulation: TargetedChoiceSimulation }) {
  const { state, update } = useLearning();
  const profile = examProfiles[simulation.provider];
  const savedDraft = continuousTaskDraft<{ started?: boolean; answers?: Record<string, number> }>(state, simulation);
  const continuousSession = findContinuousSessionForTask(state, simulation.id);
  const continuous = Boolean(continuousSession);
  const [started, setStarted] = useState(savedDraft?.started === true);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>(savedDraft?.answers ?? {});
  const [remainingSeconds, setRemainingSeconds] = useState(simulation.practiceMinutes * 60);
  const isReading = simulation.skill === "reading";
  const SkillIcon = isReading ? BookOpenCheck : Languages;

  useEffect(() => {
    if (!started || finished || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, remainingSeconds]);

  const score = simulation.items.filter((item) => answers[item.id] === item.correctIndex).length;
  const answered = Object.keys(answers).length;
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  function begin() {
    setStarted(true);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers }));
  }

  function chooseAnswer(itemId: string, optionIndex: number) {
    const next = { ...answers, [itemId]: optionIndex };
    setAnswers(next);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers: next }));
  }

  function finish() {
    if (answered < simulation.items.length) return;
    setFinished(true);
    update((current) => markContinuousTaskComplete({
      ...current,
      mastery: { ...current.mastery, [`exam-target-${simulation.id}`]: Math.round((score / simulation.items.length) * 100) },
      studyHistory: [...current.studyHistory, { date: new Date().toISOString().slice(0, 10), minutes: simulation.practiceMinutes, evidenceCount: simulation.items.length }],
    }, simulation));
  }

  function reset() {
    setAnswers({});
    setFinished(false);
    setStarted(false);
    setRemainingSeconds(simulation.practiceMinutes * 60);
    if (continuous) update((current) => clearContinuousTaskDraft(current, simulation));
  }

  if (!started) {
    return (
      <div className="wide-page exam-runner-start">
        <Link href="/exams" className="back-link"><ArrowRight size={14} /> العودة إلى مركز الامتحان</Link>
        <section>
          <span className="eyebrow"><SkillIcon size={15} /> {profile.displayName}</span>
          <small lang="de" dir="ltr">{simulation.officialPartLabel}</small>
          <h1 lang="de" dir="ltr">{simulation.titleDe}</h1><h2>{simulation.titleAr}</h2><p>{simulation.descriptionAr}</p>
          <div className="exam-start-meta"><span><Timer size={17} /><b>{simulation.practiceMinutes} دقيقة</b><small>{simulation.timingNoteAr}</small></span><span><Check size={17} /><b>{simulation.items.length} فجوات</b><small>اختيار واحد من ثلاثة لكل فجوة.</small></span></div>
          <div className="exam-integrity-note"><CircleAlert size={18} /><p>هذا تدريب جزئي أصلي. النتيجة لا تمثل مجموع telc الكتابي ولا تُدمج مع نظام نقاط Goethe.</p></div>
          <button className="primary-button" onClick={begin}><Timer size={17} /> ابدأ التدريب</button>
        </section>
      </div>
    );
  }

  if (finished && continuousSession) return <ContinuousTaskSubmitted session={continuousSession} />;

  if (finished) {
    return (
      <div className="wide-page targeted-result">
        <header><span><ShieldCheck size={28} /></span><small>{profile.displayName} · {isReading ? "تدريب قراءة تفصيلية" : "تدريب عناصر لغوية"}</small><h1>{score}<i>/{simulation.items.length}</i></h1><h2>{score >= 8 ? "تحكم جيد — اختبره لاحقًا بنص جديد" : "حدد الروابط والصيغ التي تكررت فيها الفجوة"}</h2><p>نسبة تدريب داخلية وليست نقاطًا رسمية.</p></header>
        <div className="targeted-review-list">{simulation.items.map((item, index) => { const correct = answers[item.id] === item.correctIndex; return <article key={item.id} className={correct ? "correct" : "wrong"}><span>{correct ? <Check size={15} /> : index + 1}</span><div><strong lang="de" dir="ltr">{item.promptDe}</strong><small>إجابتك: <b lang="de" dir="ltr">{item.options[answers[item.id]]}</b></small>{!correct && <small>الصحيح: <b lang="de" dir="ltr">{item.options[item.correctIndex]}</b></small>}<p>{item.explanationAr}</p></div></article>; })}</div>
        <footer><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> إعادة التدريب</button><Link href="/exams" className="primary-button">مركز الامتحان <ArrowRight size={16} /></Link></footer>
      </div>
    );
  }

  return (
    <div className="wide-page targeted-exam">
      <header className="targeted-exam-header"><div><span className="eyebrow">{profile.displayName} · {simulation.officialPartLabel}</span><h1>{simulation.titleAr} <em lang="de" dir="ltr">{simulation.titleDe}</em></h1></div><div className={remainingSeconds === 0 ? "exam-timer expired" : "exam-timer"}><Timer size={17} /><strong>{minutes}:{seconds}</strong><small>{remainingSeconds === 0 ? "انتهى الهدف التدريبي" : "وقت متبقٍ"}</small></div></header>
      <section className="exam-instructions"><p lang="de" dir="ltr">{simulation.instructionsDe}</p><small>{simulation.instructionsAr}</small></section>
      <article className="language-cloze-text" lang="de" dir="ltr">{simulation.textDe}</article>
      <section className="choice-item-grid">{simulation.items.map((item) => <article key={item.id}><header><strong>{item.promptDe}</strong><small>{item.promptAr}</small></header><div>{item.options.map((option, optionIndex) => <button key={option} className={answers[item.id] === optionIndex ? "selected" : ""} onClick={() => chooseAnswer(item.id, optionIndex)}><span>{String.fromCharCode(97 + optionIndex)}</span>{option}</button>)}</div></article>)}</section>
      <button className="primary-button targeted-submit" disabled={answered < simulation.items.length} onClick={finish}><Check size={17} /> {continuous ? "ثبّت الإجابات وانتقل" : "التزم بالإجابات وصحح"}</button>
    </div>
  );
}
