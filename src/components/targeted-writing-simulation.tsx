"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, FilePenLine, RotateCcw, Save, Send, Timer } from "lucide-react";
import type { TargetedWritingSimulation } from "@/types/exam";
import { examProfiles } from "@/data/exam-profiles";
import { analyzeWriting } from "@/core/writing/analyze";
import { useLearning } from "./learning-provider";
import { clearContinuousTaskDraft, continuousTaskDraft, findContinuousSessionForTask, markContinuousTaskComplete, saveContinuousTaskDraft } from "@/core/exams/continuous-session";
import { ContinuousTaskSubmitted } from "./continuous-exam-session";

export function TargetedWritingSimulationView({ simulation }: { simulation: TargetedWritingSimulation }) {
  const { state, update } = useLearning();
  const profile = examProfiles[simulation.provider];
  const latest = state.writingSubmissions.filter((submission) => submission.taskId === simulation.id).at(-1);
  const savedDraft = continuousTaskDraft<{ started?: boolean; choiceId?: string; text?: string }>(state, simulation);
  const continuousSession = findContinuousSessionForTask(state, simulation.id);
  const continuousStartedAt = continuousSession?.startedAt;
  const [started, setStarted] = useState(savedDraft?.started === true);
  const [finished, setFinished] = useState(false);
  const [choiceId, setChoiceId] = useState(savedDraft?.choiceId ?? (simulation.choices.length === 1 ? simulation.choices[0].id : ""));
  const [text, setText] = useState(savedDraft?.text ?? (continuousSession ? "" : latest?.text ?? ""));
  const [remainingSeconds, setRemainingSeconds] = useState(simulation.practiceMinutes * 60);
  const choice = simulation.choices.find((item) => item.id === choiceId);
  const analysis = useMemo(() => analyzeWriting(text, { minWords: simulation.minimumWordsForPractice }), [text, simulation.minimumWordsForPractice]);

  useEffect(() => {
    if (!started || finished || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, remainingSeconds]);

  useEffect(() => {
    if (!continuousStartedAt || !started || finished) return;
    const timer = window.setTimeout(() => {
      update((current) => saveContinuousTaskDraft(current, simulation, { started: true, choiceId, text }));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [choiceId, continuousStartedAt, finished, simulation, started, text, update]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  function begin() {
    setStarted(true);
    if (continuousStartedAt) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, choiceId, text }));
  }

  function persist(status: "draft" | "submitted") {
    if (!choice || !text.trim()) return;
    const now = new Date().toISOString();
    update((current) => {
      const next = {
        ...current,
        writingSubmissions: [
          ...current.writingSubmissions,
          {
            id: `writing-${crypto.randomUUID()}`,
            taskId: simulation.id,
            text,
            wordCount: analysis.wordCount,
            version: current.writingSubmissions.filter((submission) => submission.taskId === simulation.id).length + 1,
            status,
            feedback: status === "draft" ? [] : analysis.feedback,
            createdAt: now,
            updatedAt: now,
          },
        ],
        studyHistory: status === "submitted"
          ? [...current.studyHistory, { date: now.slice(0, 10), minutes: simulation.practiceMinutes, evidenceCount: 1 }]
          : current.studyHistory,
      };
      return status === "submitted" ? markContinuousTaskComplete(next, simulation) : next;
    });
    if (status === "submitted") setFinished(true);
  }

  function reset() {
    setText("");
    setChoiceId(simulation.choices.length === 1 ? simulation.choices[0].id : "");
    setFinished(false);
    setStarted(false);
    setRemainingSeconds(simulation.practiceMinutes * 60);
    if (continuousStartedAt) update((current) => clearContinuousTaskDraft(current, simulation));
  }

  if (!started) {
    return (
      <div className="wide-page exam-runner-start">
        <Link href="/exams" className="back-link"><ArrowRight size={14} /> العودة إلى مركز الامتحان</Link>
        <section>
          <span className="eyebrow"><FilePenLine size={15} /> {profile.displayName}</span>
          <small lang="de" dir="ltr">{simulation.officialPartLabel}</small>
          <h1 lang="de" dir="ltr">{simulation.titleDe}</h1>
          <h2>{simulation.titleAr}</h2>
          <p>{simulation.descriptionAr}</p>
          <div className="exam-start-meta">
            <span><Timer size={17} /><b>{simulation.practiceMinutes} دقيقة</b><small>{simulation.timingNoteAr}</small></span>
            <span><FilePenLine size={17} /><b>{simulation.choices.length === 1 ? "مهمة واحدة" : `اختيار من ${simulation.choices.length} مهمتين`}</b><small>{simulation.wordTargetNoteAr}</small></span>
          </div>
          <div className="exam-integrity-note"><CircleAlert size={18} /><p>الفحص حتمي ومحدود بالبنية والطول وبعض المؤشرات. لا يمنح نقاطًا رسمية ولا يدعي تقييم جودة الحجة مثل مصحح بشري معتمد.</p></div>
          <button className="primary-button" onClick={begin}><Timer size={17} /> ابدأ المؤقت والكتابة</button>
        </section>
      </div>
    );
  }

  if (finished && continuousSession) return <ContinuousTaskSubmitted session={continuousSession} />;

  if (finished && choice) {
    return (
      <div className="wide-page targeted-writing-result">
        <header><span><Check size={27} /></span><small>{profile.displayName} · تدريب كتابي غير رسمي</small><h1>حُفظت النسخة محليًا</h1><p>{analysis.wordCount} كلمة · المهمة: <b lang="de" dir="ltr">{choice.titleDe}</b></p></header>
        <div className="writing-result-grid">
          <section><h2>فحوص حتمية</h2>{analysis.checks.map((check) => <article key={check.label} className={check.passed ? "passed" : ""}><span>{check.passed ? <Check size={13} /> : "—"}</span><p>{check.label}</p></article>)}</section>
          <section><h2>تدقيق ذاتي خاص بالمهمة</h2>{choice.checklistAr.map((item) => <article key={item}><span>□</span><p>{item}</p></article>)}</section>
        </div>
        <div className="exam-integrity-note"><CircleAlert size={18} /><p>راجع النص بنفسك وفق النقاط قبل إنشاء نسخة ثانية. لا تعرض المنصة درجة Goethe أو telc اعتمادًا على عد الكلمات والفحوص الشكلية.</p></div>
        <footer><button className="secondary-button" onClick={() => setFinished(false)}><RotateCcw size={16} /> حرر نسخة منقحة</button><button className="secondary-button" onClick={reset}>ابدأ المهمة من جديد</button><Link href="/exams" className="primary-button">مركز الامتحان <ArrowRight size={16} /></Link></footer>
      </div>
    );
  }

  return (
    <div className="wide-page targeted-exam targeted-writing">
      <header className="targeted-exam-header">
        <div><span className="eyebrow">{profile.displayName} · {simulation.officialPartLabel}</span><h1>{simulation.titleAr} <em lang="de" dir="ltr">{simulation.titleDe}</em></h1></div>
        <div className={remainingSeconds === 0 ? "exam-timer expired" : "exam-timer"}><Timer size={17} /><strong>{minutes}:{seconds}</strong><small>{remainingSeconds === 0 ? "انتهى الهدف الزمني" : "وقت متبقٍ"}</small></div>
      </header>
      <section className="exam-instructions"><p lang="de" dir="ltr">{simulation.instructionsDe}</p><small>{simulation.instructionsAr}</small></section>
      {simulation.choices.length > 1 && <div className="writing-choice-switch">{simulation.choices.map((item) => <button key={item.id} className={choiceId === item.id ? "active" : ""} onClick={() => { setChoiceId(item.id); setText(""); }}>{item.titleDe}</button>)}</div>}
      {choice ? (
        <div className="targeted-writing-layout">
          <section className="writing-prompt-card">
            <small lang="de" dir="ltr">{choice.titleDe}</small>
            <p lang="de" dir="ltr">{choice.situationDe}</p>
            <span>{choice.situationAr}</span>
            <h3>Bearbeiten Sie:</h3>
            <ul lang="de" dir="ltr">{choice.guidingPointsDe.map((point) => <li key={point}>{point}</li>)}</ul>
            <div className="exam-integrity-note"><CircleAlert size={16} /><p>{simulation.wordTargetNoteAr}</p></div>
          </section>
          <section className="writing-exam-editor">
            <textarea lang="de" dir="ltr" value={text} onChange={(event) => setText(event.target.value)} placeholder="Schreiben Sie hier …" spellCheck={false} />
            <footer><span className={analysis.wordCount >= simulation.minimumWordsForPractice ? "good" : ""}>{analysis.wordCount} كلمة · هدف التدريب {simulation.minimumWordsForPractice}</span><div><button className="secondary-button" disabled={!text.trim()} onClick={() => persist("draft")}><Save size={15} /> حفظ مسودة</button><button className="primary-button" disabled={analysis.wordCount < 50} onClick={() => persist("submitted")}><Send size={15} /> {continuousSession ? "ثبّت النص وانتقل" : "تسليم التدريب"}</button></div></footer>
          </section>
        </div>
      ) : <section className="writing-choice-empty"><FilePenLine size={30} /><h2>اختر المهمة A أو B أولًا</h2><p>لن يبدأ النص قبل تثبيت سياق الرسالة.</p></section>}
    </div>
  );
}
