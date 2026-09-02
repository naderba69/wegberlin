"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, CircleStop, LockKeyhole, Mic2, RotateCcw, Save, Timer, Trash2 } from "lucide-react";
import type { TargetedSpeakingSimulation } from "@/types/exam";
import { examProfiles } from "@/data/exam-profiles";
import { deleteMedia, loadMedia, saveMedia } from "@/core/portability/db";
import { useLearning } from "./learning-provider";
import { clearContinuousTaskDraft, continuousTaskDraft, findContinuousSessionForTask, markContinuousTaskComplete, saveContinuousTaskDraft } from "@/core/exams/continuous-session";
import { ContinuousTaskSubmitted } from "./continuous-exam-session";

type Phase = "setup" | "preparing" | "ready" | "recording" | "recorded" | "saved";
type SpeakingDraft = { choiceId?: string; phase?: Phase; mediaId?: string; duration?: number; selfScore?: number; reflection?: string };

export function TargetedSpeakingSimulationView({ simulation }: { simulation: TargetedSpeakingSimulation }) {
  const { state, update } = useLearning();
  const profile = examProfiles[simulation.provider];
  const savedDraft = continuousTaskDraft<SpeakingDraft>(state, simulation);
  const continuousSession = findContinuousSessionForTask(state, simulation.id);
  const continuousStartedAt = continuousSession?.startedAt;
  const restoredPhase: Phase = savedDraft?.phase === "recorded" && savedDraft.mediaId ? "recorded" : savedDraft?.phase === "preparing" || savedDraft?.phase === "ready" ? savedDraft.phase : "setup";
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const [phase, setPhase] = useState<Phase>(restoredPhase);
  const [choiceId, setChoiceId] = useState(savedDraft?.choiceId ?? "");
  const [preparationSeconds, setPreparationSeconds] = useState(simulation.preparationMinutes * 60);
  const [responseSeconds, setResponseSeconds] = useState(simulation.responseSeconds);
  const [audioUrl, setAudioUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [draftMediaId, setDraftMediaId] = useState(savedDraft?.mediaId ?? "");
  const [duration, setDuration] = useState(savedDraft?.duration ?? 0);
  const [selfScore, setSelfScore] = useState(savedDraft?.selfScore ?? 3);
  const [reflection, setReflection] = useState(savedDraft?.reflection ?? "");
  const [message, setMessage] = useState(savedDraft?.phase === "recorded" ? "جاري استعادة التسجيل المؤقت من التخزين المحلي…" : "");
  const choice = simulation.choices.find((item) => item.id === choiceId);
  const choiceIndex = Math.max(0, simulation.choices.findIndex((item) => item.id === choiceId));
  const followUp = simulation.followUpPromptsDe[choiceIndex % simulation.followUpPromptsDe.length];
  const attempts = state.speakingAttempts.filter((attempt) => attempt.taskId === simulation.id).length;

  useEffect(() => {
    if (phase !== "recorded" || !draftMediaId || blob) return;
    let active = true;
    void loadMedia(draftMediaId).then((restored) => {
      if (!active) return;
      if (!restored) {
        setDraftMediaId("");
        setPhase("ready");
        setMessage("تعذر استعادة التسجيل المؤقت. أعد التسجيل؛ الساعة المركزية لم تتغير.");
        update((current) => clearContinuousTaskDraft(current, simulation));
        return;
      }
      setBlob(restored);
      setAudioUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(restored);
      });
      setMessage("استُعيد التسجيل المؤقت محليًا. راجعه ثم اضغط الحفظ لإضافته إلى أدلة الجلسة.");
    });
    return () => { active = false; };
  }, [blob, draftMediaId, phase, simulation, update]);

  useEffect(() => {
    if (!continuousStartedAt || !choiceId || phase === "saved") return;
    const persistedPhase: Phase = phase === "recording" ? "ready" : phase;
    const timer = window.setTimeout(() => {
      update((current) => saveContinuousTaskDraft(current, simulation, {
        choiceId,
        phase: persistedPhase,
        mediaId: draftMediaId || undefined,
        duration,
        selfScore,
        reflection,
      }));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [choiceId, continuousStartedAt, draftMediaId, duration, phase, reflection, selfScore, simulation, update]);

  useEffect(() => {
    if (phase !== "preparing" || preparationSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setPreparationSeconds((value) => Math.max(0, value - 1));
      if (preparationSeconds <= 1) setPhase("ready");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, preparationSeconds]);

  useEffect(() => {
    if (phase !== "recording" || responseSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setResponseSeconds((value) => Math.max(0, value - 1));
      if (responseSeconds <= 1 && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, responseSeconds]);

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  function begin() {
    if (!choice) return;
    setPhase(simulation.preparationMinutes > 0 ? "preparing" : "ready");
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setResponseSeconds(simulation.responseSeconds);
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const nextBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const nextDuration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const temporaryMediaId = continuousStartedAt ? `exam-speaking-draft-${crypto.randomUUID()}` : "";
        if (temporaryMediaId) {
          try {
            if (draftMediaId) await deleteMedia(draftMediaId);
            await saveMedia(temporaryMediaId, nextBlob);
            setDraftMediaId(temporaryMediaId);
            update((current) => saveContinuousTaskDraft(current, simulation, {
              choiceId,
              phase: "recorded",
              mediaId: temporaryMediaId,
              duration: nextDuration,
              selfScore,
              reflection,
            }));
            setMessage("حُفظ التسجيل مؤقتًا داخل الجلسة. راجعه ثم ثبّت المحاولة.");
          } catch {
            setMessage("تم التسجيل، لكن تعذر حفظ النسخة المؤقتة. ثبّت المحاولة قبل إعادة التحميل.");
          }
        }
        setBlob(nextBlob);
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(nextBlob);
        });
        setDuration(nextDuration);
        stream.getTracks().forEach((track) => track.stop());
        setPhase("recorded");
      };
      recorderRef.current = recorder;
      recorder.start();
      setMessage("");
      setPhase("recording");
    } catch {
      setMessage("تعذر الوصول إلى الميكروفون. تحقق من إذن المتصفح ثم أعد المحاولة.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function save() {
    if (!blob || !choice) return;
    const mediaId = draftMediaId || `exam-speaking-${crypto.randomUUID()}`;
    if (!draftMediaId) await saveMedia(mediaId, blob);
    update((current) => markContinuousTaskComplete({
      ...current,
      speakingAttempts: [
        ...current.speakingAttempts,
        {
          id: `attempt-${crypto.randomUUID()}`,
          taskId: simulation.id,
          mediaId,
          durationSeconds: duration,
          selfScore,
          reflection: continuousStartedAt ? "تسليم بروفة متصلة مغلق المساعدة" : `${choice.titleDe} | Nachfrage: ${followUp} | ${reflection}`,
          createdAt: new Date().toISOString(),
        },
      ],
      studyHistory: [...current.studyHistory, { date: new Date().toISOString().slice(0, 10), minutes: simulation.practiceMinutes, evidenceCount: 1 }],
    }, simulation));
    setMessage("حُفظ التسجيل محليًا. لم يُرفع الصوت ولم تُحسب درجة نطق آلية.");
    setPhase("saved");
  }

  function reset() {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (draftMediaId && phase !== "saved") void deleteMedia(draftMediaId);
    if (continuousStartedAt) update((current) => clearContinuousTaskDraft(current, simulation));
    setPhase("setup");
    setChoiceId("");
    setPreparationSeconds(simulation.preparationMinutes * 60);
    setResponseSeconds(simulation.responseSeconds);
    setAudioUrl("");
    setBlob(null);
    setDraftMediaId("");
    setDuration(0);
    setSelfScore(3);
    setReflection("");
    setMessage("");
  }

  const prepMinutes = String(Math.floor(preparationSeconds / 60)).padStart(2, "0");
  const prepSeconds = String(preparationSeconds % 60).padStart(2, "0");
  const responseMinutes = String(Math.floor(responseSeconds / 60)).padStart(2, "0");
  const responseRemainder = String(responseSeconds % 60).padStart(2, "0");

  if (phase === "setup") {
    return (
      <div className="wide-page exam-runner-start speaking-exam-start">
        <Link href="/exams" className="back-link"><ArrowRight size={14} /> العودة إلى مركز الامتحان</Link>
        <section>
          <span className="eyebrow"><Mic2 size={15} /> {profile.displayName}</span>
          <small lang="de" dir="ltr">{simulation.officialPartLabel}</small>
          <h1 lang="de" dir="ltr">{simulation.titleDe}</h1><h2>{simulation.titleAr}</h2><p>{simulation.descriptionAr}</p>
          <div className="speaking-choice-list">{simulation.choices.map((item) => <button key={item.id} className={choiceId === item.id ? "active" : ""} onClick={() => setChoiceId(item.id)}><strong lang="de" dir="ltr">{item.titleDe}</strong><small lang="de" dir="ltr">{item.situationDe}</small></button>)}</div>
          <div className="exam-start-meta"><span><Timer size={17} /><b>{simulation.preparationMinutes > 0 ? `${simulation.preparationMinutes} دقيقة تحضير` : "تحضير مسبق"}</b><small>{simulation.timingNoteAr}</small></span><span><Mic2 size={17} /><b>{Math.round(simulation.responseSeconds / 30) / 2} دقيقة كلام</b><small>تسجيل فردي محلي؛ لا يحاكي تفاعل شريك حي.</small></span></div>
          <button className="primary-button" disabled={!choiceId} onClick={begin}><Timer size={17} /> ثبّت الموضوع وابدأ</button>
        </section>
      </div>
    );
  }

  if (phase === "saved" && continuousSession) return <ContinuousTaskSubmitted session={continuousSession} />;
  if (!choice) return null;

  return (
    <div className="wide-page targeted-speaking">
      <header className="targeted-exam-header"><div><span className="eyebrow">{profile.displayName} · {simulation.officialPartLabel}</span><h1>{simulation.titleAr} <em lang="de" dir="ltr">{choice.titleDe}</em></h1></div>{!continuousSession && <div className="lab-counter"><strong>{attempts}</strong><span>محاولات سابقة<br />محفوظة محليًا</span></div>}</header>
      <div className="targeted-speaking-layout">
        <section className="speaking-exam-task">
          <small lang="de" dir="ltr">{choice.situationDe}</small>
          <ul lang="de" dir="ltr">{choice.bulletPointsDe.map((point) => <li key={point}>{point}</li>)}</ul>
          {phase === "preparing" && <div className="speaking-phase-timer"><Timer size={23} /><span><small>Vorbereitung</small><strong>{prepMinutes}:{prepSeconds}</strong></span><button onClick={() => setPhase("ready")}>إنهاء التحضير الآن</button></div>}
          {phase === "ready" && <div className="speaking-phase-timer ready"><Mic2 size={23} /><span><small>جاهز للتسجيل</small><strong>{Math.round(simulation.responseSeconds / 30) / 2} min</strong></span><button onClick={startRecording}>ابدأ التسجيل</button></div>}
          {phase === "recording" && <div className="speaking-phase-timer recording"><span className="record-dot" /><span><small>Aufnahme läuft</small><strong>{responseMinutes}:{responseRemainder}</strong></span><button onClick={stopRecording}><CircleStop size={16} /> إيقاف</button></div>}
          {(phase === "recorded" || phase === "saved") && !continuousSession && <><audio controls src={audioUrl} className="audio-player" /><div className="follow-up-card"><small>سؤال شريك محتمل — بعد العرض</small><strong lang="de" dir="ltr">{followUp}</strong><p>أجب عنه شفهيًا لنفسك أو اكتب في التأمل كيف ستجيب. السؤال لا يحاكي تفاعلًا حيًا ولا يُقيّم آليًا.</p></div></>}
          {phase === "recorded" && continuousSession && <div className="closed-recording-ready"><Check size={18} /><div><strong>اكتمل التسجيل المؤقت</strong><p>ثبّته للانتقال دون تشغيل راجع أو معايير تقييم أثناء البروفة.</p></div></div>}
          {message && <div className="exam-integrity-note"><CircleAlert size={17} /><p>{message}</p></div>}
        </section>
        {continuousSession ? <aside className="closed-assistance-submit-card">
          <LockKeyhole size={24} />
          <h2>تسليم بلا مساعدة</h2>
          <p>لا تظهر معايير التقييم أو سؤال المتابعة أو التشغيل الراجع أثناء البروفة النشطة. ثبّت التسجيل للانتقال بالترتيب.</p>
          <button className="primary-button" disabled={!blob || phase === "saved"} onClick={save}><Save size={16} /> ثبّت التسجيل وانتقل</button>
          {blob && phase !== "saved" && <button className="secondary-button" onClick={reset}><Trash2 size={15} /> حذف التسجيل وإعادته</button>}
        </aside> : <aside className="speaking-self-review">
          <h2>تقييم ذاتي غير رسمي</h2>
          {simulation.selfCriteriaAr.map((criterion) => <label key={criterion}><input type="checkbox" /> <span>{criterion}</span></label>)}
          <div><small>وضوح المهمة والبنية من 5</small><div className="score-buttons">{[1, 2, 3, 4, 5].map((score) => <button key={score} className={selfScore === score ? "active" : ""} onClick={() => setSelfScore(score)}>{score}</button>)}</div></div>
          <label className="reflection-field"><span>تأمل وسؤال المتابعة</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="ما الجزء الناقص؟ وكيف ستجيب عن سؤال المتابعة؟" /></label>
          <button className="primary-button" disabled={!blob || phase === "saved"} onClick={save}><Save size={16} /> حفظ المحاولة محليًا</button>
          {blob && phase !== "saved" && <button className="secondary-button" onClick={reset}><Trash2 size={15} /> حذف وبدء جديد</button>}
          {phase === "saved" && <button className="secondary-button" onClick={reset}><RotateCcw size={15} /> محاولة جديدة</button>}
          <div className="exam-integrity-note"><CircleAlert size={16} /><p>لا توجد درجة نطق أو طلاقة آلية. الدليل المحفوظ هو التسجيل والمدة وتقييمك الذاتي فقط.</p></div>
        </aside>}
      </div>
    </div>
  );
}
