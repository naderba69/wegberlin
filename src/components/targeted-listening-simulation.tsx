"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Headphones, Play, RotateCcw, ShieldCheck, Timer } from "lucide-react";
import type { TargetedListeningSimulation } from "@/types/exam";
import { examProfiles } from "@/data/exam-profiles";
import { useLearning } from "./learning-provider";
import { clearContinuousTaskDraft, continuousTaskDraft, findContinuousSessionForTask, markContinuousTaskComplete, saveContinuousTaskDraft } from "@/core/exams/continuous-session";
import { examAudioAssetsByClipId, examAudioManifest, type ExamAudioAsset } from "@/data/exam-audio-assets";
import { ContinuousTaskSubmitted } from "./continuous-exam-session";

function completeClipAssets(clipId:string){const assets=examAudioAssetsByClipId[clipId]??[];return assets.length>0&&assets.every((asset,index)=>asset.segmentIndex===index+1&&asset.segmentCount===assets.length)?assets:[]}

export function TargetedListeningSimulationView({ simulation }: { simulation: TargetedListeningSimulation }) {
  const { state, update } = useLearning();
  const profile = examProfiles[simulation.provider];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedClipCount = simulation.clips.filter((clip) => completeClipAssets(clip.id).length>0).length;
  const allClipsGenerated = generatedClipCount === simulation.clips.length;
  const savedDraft = continuousTaskDraft<{ started?: boolean; answers?: Record<string, number>; listens?: Record<string, number> }>(state, simulation);
  const continuousSession = findContinuousSessionForTask(state, simulation.id);
  const continuous = Boolean(continuousSession);
  const [started, setStarted] = useState(savedDraft?.started === true);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>(savedDraft?.answers ?? {});
  const [listens, setListens] = useState<Record<string, number>>(savedDraft?.listens ?? {});
  const [remainingSeconds, setRemainingSeconds] = useState(simulation.practiceMinutes * 60);
  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
  const playbackAvailable = allClipsGenerated || speechAvailable;

  useEffect(() => {
    if (!started || finished || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, remainingSeconds]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); audioRef.current?.pause(); }, []);

  const score = simulation.items.filter((item) => answers[item.id] === item.correctIndex).length;
  const answered = Object.keys(answers).length;
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  function begin() {
    setStarted(true);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers, listens }));
  }

  function chooseAnswer(itemId: string, optionIndex: number) {
    const next = { ...answers, [itemId]: optionIndex };
    setAnswers(next);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers: next, listens }));
  }

  function playAssetSequence(assets:ExamAudioAsset[],index=0){const audio=new Audio(assets[index].path);audioRef.current=audio;audio.onended=()=>{if(index+1<assets.length)playAssetSequence(assets,index+1)};void audio.play().catch(()=>undefined)}

  function playClip(clipId: string, forceBrowserTts = false) {
    const clip = simulation.clips.find((item) => item.id === clipId);
    const assets = completeClipAssets(clipId);
    if (!clip || (listens[clipId] ?? 0) >= clip.playLimit || (!assets.length && !speechAvailable) || (forceBrowserTts && !speechAvailable)) return;
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (assets.length && !forceBrowserTts) {
      playAssetSequence(assets);
    } else if (speechAvailable) {
      const utterance = new SpeechSynthesisUtterance(clip.transcriptDe);
      utterance.lang = "de-DE";
      utterance.rate = 0.94;
      window.speechSynthesis.speak(utterance);
    }
    const next = { ...listens, [clipId]: (listens[clipId] ?? 0) + 1 };
    setListens(next);
    if (continuous) update((current) => saveContinuousTaskDraft(current, simulation, { started: true, answers, listens: next }));
  }

  function finish() {
    if (answered < simulation.items.length) return;
    window.speechSynthesis?.cancel();
    setFinished(true);
    update((current) => markContinuousTaskComplete({
      ...current,
      mastery: {
        ...current.mastery,
        [`exam-target-${simulation.id}`]: Math.round((score / simulation.items.length) * 100),
      },
      studyHistory: [
        ...current.studyHistory,
        { date: new Date().toISOString().slice(0, 10), minutes: simulation.practiceMinutes, evidenceCount: simulation.items.length },
      ],
    }, simulation));
  }

  function reset() {
    window.speechSynthesis?.cancel();
    setAnswers({});
    setListens({});
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
          <span className="eyebrow"><Headphones size={15} /> {profile.displayName}</span>
          <small lang="de" dir="ltr">{simulation.officialPartLabel}</small>
          <h1 lang="de" dir="ltr">{simulation.titleDe}</h1>
          <h2>{simulation.titleAr}</h2>
          <p>{simulation.descriptionAr}</p>
          <div className="exam-start-meta">
            <span><Timer size={17} /><b>{simulation.practiceMinutes} دقيقة</b><small>{simulation.timingNoteAr}</small></span>
            <span><Play size={17} /><b>{simulation.clips.length} مقاطع · تشغيل محدود</b><small>اقرأ الأسئلة قبل الضغط؛ لا يظهر النص قبل التصحيح.</small></span>
          </div>
          <div className="exam-integrity-note"><CircleAlert size={18} /><p>{allClipsGenerated?`تتوفر ${generatedClipCount} ملفات MP3 اصطناعية مولّدة من نص التدريب الأصلي. هي أحادية المتحدث وغير امتحانية، وBrowser TTS بديل فقط.`:"بعض المقاطع ما زالت تعتمد على Browser TTS. كلا المصدرين تدريبيان وغير رسميين ولا يمثلان تنوع الصوت البشري في الامتحان."}</p></div>
          <button className="primary-button" disabled={!playbackAvailable} onClick={begin}><Headphones size={17} /> {playbackAvailable ? "ابدأ التدريب" : "لا يتوفر تشغيل صوتي في هذا المتصفح"}</button>
        </section>
      </div>
    );
  }

  if (finished && continuousSession) return <ContinuousTaskSubmitted session={continuousSession} />;

  if (finished) {
    return (
      <div className="wide-page targeted-result">
        <header>
          <span><ShieldCheck size={28} /></span>
          <small>{profile.displayName} · {allClipsGenerated?"استماع بملفات MP3 مولّدة":"استماع جزئي بصوت المتصفح"}</small>
          <h1>{score}<i>/{simulation.items.length}</i></h1>
          <h2>{score / simulation.items.length >= 0.8 ? "التقاط جيد للمعلومات — اختبره لاحقًا بصوت جديد" : "راجع الفرق بين الفكرة العامة والتفصيل"}</h2>
          <p>النتيجة داخلية ولا تُحوّل إلى نقاط رسمية. أُظهر النص الآن للمقارنة بعد الالتزام.</p>
        </header>
        <div className="listening-transcript-review">
          {simulation.clips.map((clip) => <details key={clip.id}><summary lang="de" dir="ltr">{clip.labelDe} · Transkript</summary><p lang="de" dir="ltr">{clip.transcriptDe}</p></details>)}
        </div>
        <div className="targeted-review-list">
          {simulation.items.map((item, index) => {
            const correct = answers[item.id] === item.correctIndex;
            return (
              <article key={item.id} className={correct ? "correct" : "wrong"}>
                <span>{correct ? <Check size={15} /> : index + 1}</span>
                <div>
                  <strong lang="de" dir="ltr">{item.promptDe}</strong>
                  <small>إجابتك: <b lang="de" dir="ltr">{item.options[answers[item.id]]}</b></small>
                  {!correct && <small>الصحيح: <b lang="de" dir="ltr">{item.options[item.correctIndex]}</b></small>}
                  <p>{item.explanationAr}</p>
                </div>
              </article>
            );
          })}
        </div>
        <footer><button className="secondary-button" onClick={reset}><RotateCcw size={16} /> إعادة بنص الصوت نفسه</button><Link href="/exams" className="primary-button">مركز الامتحان <ArrowRight size={16} /></Link></footer>
      </div>
    );
  }

  return (
    <div className="wide-page targeted-exam">
      <header className="targeted-exam-header">
        <div><span className="eyebrow">{profile.displayName} · {simulation.officialPartLabel}</span><h1>{simulation.titleAr} <em lang="de" dir="ltr">{simulation.titleDe}</em></h1></div>
        <div className={remainingSeconds === 0 ? "exam-timer expired" : "exam-timer"}><Timer size={17} /><strong>{minutes}:{seconds}</strong><small>{remainingSeconds === 0 ? "انتهى الهدف التدريبي" : "وقت متبقٍ"}</small></div>
      </header>
      <section className="exam-instructions"><p lang="de" dir="ltr">{simulation.instructionsDe}</p><small>{simulation.instructionsAr}</small></section>
      <div className="exam-integrity-note"><CircleAlert size={18} /><p>{allClipsGenerated?"MP3 اصطناعي مولّد للمشروع: لا تفتح النص قبل التسليم، ولا تعتبر النتيجة بديلًا عن صوت بشري متنوع أو امتحاني.":"Browser-TTS لبعض المقاطع: لا تفتح النص قبل التسليم، ولا تعتبر النتيجة بديلًا عن تدريب صوتي بشري متنوع."}</p></div>
      <div className="listening-clip-stack">
        {simulation.clips.map((clip) => {
          const clipItems = simulation.items.filter((item) => item.clipId === clip.id);
          const used = listens[clip.id] ?? 0;
          const audioAssets = completeClipAssets(clip.id);
          return (
            <section key={clip.id}>
              <header><div><Headphones size={18} /><span><strong lang="de" dir="ltr">{clip.labelDe}</strong><small>التشغيل {used}/{clip.playLimit} · {audioAssets.length?`MP3 مولّد${audioAssets.length>1?` · ${audioAssets.length} مقاطع متسلسلة`:""}`:"Browser TTS"}</small></span></div><div className="exam-clip-actions"><button disabled={used >= clip.playLimit} onClick={() => playClip(clip.id)}><Play size={15} /> {used >= clip.playLimit ? "تم التشغيل" : audioAssets.length ? "تشغيل MP3" : "تشغيل TTS"}</button>{audioAssets.length>0&&speechAvailable&&used<clip.playLimit&&<button className="exam-tts-fallback" title={examAudioManifest.usageNoteAr} onClick={()=>playClip(clip.id,true)}>TTS بديل</button>}</div></header>
              <div>
                {clipItems.map((item, itemIndex) => (
                  <article key={item.id}>
                    <span>{itemIndex + 1}</span>
                    <div><strong lang="de" dir="ltr">{item.promptDe}</strong><small>{item.promptAr}</small></div>
                    <div className="listening-answer-options">
                      {item.options.map((option, optionIndex) => <button key={option} className={answers[item.id] === optionIndex ? "selected" : ""} onClick={() => chooseAnswer(item.id, optionIndex)}><i>{String.fromCharCode(97 + optionIndex)}</i>{option}</button>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <button className="primary-button targeted-submit" disabled={answered < simulation.items.length} onClick={finish}><Check size={17} /> {continuous ? "ثبّت الإجابات وانتقل" : "التزم بالإجابات وصحح"}</button>
    </div>
  );
}
