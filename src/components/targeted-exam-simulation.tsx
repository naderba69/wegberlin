"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Clock3, ExternalLink, RotateCcw, ShieldCheck, Timer } from "lucide-react";
import type { TargetedExamSimulation } from "@/types/exam";
import { examProfiles, examSourceById } from "@/data/exam-profiles";
import { useLearning } from "./learning-provider";
import { clearContinuousTaskDraft, continuousTaskDraft, findContinuousSessionForTask, markContinuousTaskComplete, saveContinuousTaskDraft } from "@/core/exams/continuous-session";
import { ContinuousTaskSubmitted } from "./continuous-exam-session";
import { ResultAnnouncer } from "./result-announcer";
import { examResultMessage } from "@/core/a11y/result-announcements";

export function TargetedExamSimulationView({ simulation }: { simulation: TargetedExamSimulation }) {
  const { state, update } = useLearning();
  const profile = examProfiles[simulation.provider];
  const savedDraft = continuousTaskDraft<{ started?: boolean; answers?: Record<string, string> }>(state, simulation);
  const continuousSession = findContinuousSessionForTask(state, simulation.id);
  const continuous = Boolean(continuousSession);
  const [started, setStarted] = useState(savedDraft?.started === true);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(savedDraft?.answers ?? {});
  const [remainingSeconds, setRemainingSeconds] = useState(simulation.practiceMinutes * 60);

  useEffect(() => {
    if (!started || finished || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, remainingSeconds]);

  const score = simulation.items.filter((item) => answers[item.id] === item.correctOptionId).length;
  const answered = Object.keys(answers).length;
  const selectedOptionIds = useMemo(() => Object.values(answers), [answers]);
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  function begin() {
    setStarted(true);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers }));
  }

  function chooseAnswer(itemId: string, optionId: string) {
    const next = { ...answers, [itemId]: optionId };
    setAnswers(next);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers: next }));
  }

  function finish() { 
    if (answered < simulation.items.length) return;
    setFinished(true);
    update((current) => markContinuousTaskComplete({
      ...current,
      mastery: {
        ...current.mastery,
        [`exam-target-${simulation.id}`]: Math.round((score / simulation.items.length) * 100),
      },
      studyHistory: [
        ...current.studyHistory,
        {
          date: new Date().toISOString().slice(0, 10),
          minutes: simulation.practiceMinutes,
          evidenceCount: simulation.items.length,
        },
      ],
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
          <span className="eyebrow"><ShieldCheck size={15} /> {profile.displayName}</span>
          <small lang="de" dir="ltr">{simulation.officialPartLabel}</small>
          <h1 lang="de" dir="ltr">{simulation.titleDe}</h1>
          <h2>{simulation.titleAr}</h2>
          <p>{simulation.descriptionAr}</p>
          <div className="exam-start-meta">
            <span><Clock3 size={17} /><b>{simulation.practiceMinutes} دقيقة</b><small>{simulation.timingNoteAr}</small></span>
            <span><Check size={17} /><b>{simulation.items.length} عناصر</b><small>{continuous ? "يبقى التصحيح مخفيًا حتى تنتهي البروفة المتصلة." : "تظهر الحلول والتفسيرات بعد الالتزام بالإجابة."}</small></span>
          </div>
          <div className="exam-integrity-note"><CircleAlert size={18} /><p>محتوى أصلي غير رسمي. يحاكي هذا التدريب نوع الجزء المحدد فقط، ولا يمثل محاكاة كاملة أو نتيجة صادرة عن {profile.displayName}.</p></div>
          <button className="primary-button" onClick={begin}><Timer size={17} /> ابدأ المؤقت والتدريب</button>
        </section>
      </div>
    );
  }

  if (finished && continuousSession) return <ContinuousTaskSubmitted session={continuousSession} />;

  if (finished) {
    return (
      <div className="wide-page targeted-result">
        <ResultAnnouncer message={examResultMessage({ score, total: simulation.items.length, kindAr: "نتيجة التدريب الجزئي" })}/>
        <header>
          <span><ShieldCheck size={28} /></span>
          <small>{profile.displayName} · تدريب جزئي غير رسمي</small>
          <h1>{score}<i>/{simulation.items.length}</i></h1>
          <h2>{score / simulation.items.length >= 0.8 ? "فهم جيد لهذا النوع — أعده لاحقًا بنص جديد" : "راجع مواضع الخلط ثم أعد نوعًا مماثلًا"}</h2>
          <p>هذه نسبة تدريب داخل التطبيق ولا تُحوّل إلى نقاط رسمية أو حكم نجاح في الوحدة الكاملة.</p>
        </header>
        <div className="targeted-review-list">
          {simulation.items.map((item, index) => {
            const correct = answers[item.id] === item.correctOptionId;
            const selected = simulation.options.find((option) => option.id === answers[item.id]);
            const expected = simulation.options.find((option) => option.id === item.correctOptionId);
            return (
              <article key={item.id} className={correct ? "correct" : "wrong"}>
                <span>{correct ? <Check size={15} /> : index + 1}</span>
                <div>
                  <strong lang="de" dir="ltr">{item.promptDe}</strong>
                  <small>إجابتك: <b lang="de" dir="ltr">{selected?.labelDe}</b></small>
                  {!correct && <small>الصحيح: <b lang="de" dir="ltr">{expected?.labelDe}</b></small>}
                  <p>{item.explanationAr}</p>
                </div>
              </article>
            );
          })}
        </div>
        <footer>
          <button className="secondary-button" onClick={reset}><RotateCcw size={16} /> إعادة التدريب</button>
          <Link href="/exams" className="primary-button">مركز الامتحان <ArrowRight size={16} /></Link>
        </footer>
      </div>
    );
  }

  return (
    <div className="wide-page targeted-exam">
      <header className="targeted-exam-header">
        <div>
          <span className="eyebrow">{profile.displayName} · {simulation.officialPartLabel}</span>
          <h1>{simulation.titleAr} <em lang="de" dir="ltr">{simulation.titleDe}</em></h1>
        </div>
        <div className={remainingSeconds === 0 ? "exam-timer expired" : "exam-timer"}><Timer size={17} /><strong>{minutes}:{seconds}</strong><small>{remainingSeconds === 0 ? "انتهى الهدف التدريبي" : "وقت متبقٍ"}</small></div>
      </header>
      <section className="exam-instructions">
        <p lang="de" dir="ltr">{simulation.instructionsDe}</p>
        <small>{simulation.instructionsAr}</small>
      </section>
      {!simulation.allowOptionReuse && (
        <section className="exam-heading-bank">
          {simulation.options.map((option) => <span key={option.id} lang="de" dir="ltr">{option.labelDe}</span>)}
        </section>
      )}
      <div className="targeted-texts">
        {simulation.texts.map((text) => (
          <article key={text.id}>
            <span lang="de" dir="ltr">{text.labelDe}</span>
            <p lang="de" dir="ltr">{text.textDe}</p>
          </article>
        ))}
      </div>
      <section className="targeted-items">
        <header><strong>الإجابات</strong><span>{answered}/{simulation.items.length}</span></header>
        {simulation.items.map((item, index) => (
          <label key={item.id}>
            <span>{index + 1}</span>
            <div><strong lang="de" dir="ltr">{item.promptDe}</strong><small>{item.promptAr}</small></div>
            <select
              aria-label={`إجابة السؤال ${index + 1}`}
              value={answers[item.id] ?? ""}
              onChange={(event) => chooseAnswer(item.id, event.target.value)}
            >
              <option value="">اختر</option>
              {simulation.options.map((option) => {
                const usedElsewhere = !simulation.allowOptionReuse && selectedOptionIds.includes(option.id) && answers[item.id] !== option.id;
                return <option key={option.id} value={option.id} disabled={usedElsewhere}>{option.labelDe}</option>;
              })}
            </select>
          </label>
        ))}
      </section>
      <button className="primary-button targeted-submit" disabled={answered < simulation.items.length} onClick={finish}><Check size={17} /> {continuous ? "ثبّت الإجابات وانتقل" : "التزم بالإجابات وصحح"}</button>
      {!continuous && <section className="exam-source-strip">
        <strong>مصادر توثيق الصيغة</strong>
        <div>
          {simulation.sourceRefs.map((sourceId) => {
            const source = examSourceById[sourceId];
            return <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">{source.organization}<ExternalLink size={12} /></a>;
          })}
        </div>
      </section>}
    </div>
  );
}
