"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AudioLines, Bot, BrainCircuit, Check, CircleStop, Clock3, FileText, Headphones, Mic2, RotateCcw, Save, ShieldAlert, ShieldCheck, Sparkles, Star, Trash2, Volume2 } from "lucide-react";
import { academicLessons } from "@/data/academic-lessons";
import { deleteMedia, saveMedia } from "@/core/portability/db";
import { createRecordingMediaRecorder } from "@/core/audio/recording-format";
import { canSaveSpeakingReview, GUIDED_SPEAKING_SUPPORT_POLICY, speakingDurationBand, speakingPreparationSeconds, speakingTargetSeconds } from "@/core/speaking/workflow";
import { CONTENT_FOLLOW_UP_POLICY_VERSION, createSpeakingContentFollowUpEvidence, generateContentFollowUpCandidates, generateLocalContentFollowUp, LOCAL_FOLLOW_UP_MODEL, MAX_FOLLOW_UP_SOURCE_LENGTH } from "@/core/speaking/content-follow-up";
import { aiFallbackMessage, askSpeakingFollowUp } from "@/core/ai/client";
import { inspectWebGPUModelCache, rankFollowUpCandidatesWithWebGPU } from "@/core/ai/webgpu-model";
import { webGPUModelRegistry } from "@/config/webgpu-model-registry";
import { behavioralPraise } from "@/core/coach/behavioral-praise";
import type { SpeakingConditionAttribution, SpeakingContentFollowUpEvidence, SpeakingPauseMetrics, SpeakingSelfReview } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";
import { InformationGapLab } from "./information-gap-lab";
import { AccessibleDialog } from "./accessible-dialog";
import { LocalWordRepairPractice } from "./local-word-repair-practice";
import { startLocalPauseMonitor } from "@/core/speaking/pause-analysis";
import { RedemittelBank } from "./redemittel-bank";
import { markBestSpeakingAttempt, removeSpeakingAttempt } from "@/core/speaking/best-attempt";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import { decodeRecordingToLocalSample } from "@/core/pronunciation/audio-sample";
import { inspectLocalPronunciationModel, transcribeGermanLocally } from "@/core/pronunciation/local-model";
import { matchExpectedGermanWords, type LocalWordMatchResult } from "@/core/pronunciation/word-matching";
import { analyzeMicrophoneSignal, LOCAL_MICROPHONE_SIGNAL_POLICY, type MicrophoneSignalAnalysis } from "@/core/pronunciation/microphone-signal";
import { LOCAL_PRONUNCIATION_MODEL_POLICY, localPronunciationModelRegistry } from "@/config/local-pronunciation-model-registry";

const fallback = {
  level: "A1",
  titleAr: "قدم نفسك",
  promptDe: "Stellen Sie sich 30 Sekunden lang vor und stellen Sie eine Frage.",
  promptAr: "قدم نفسك ثم اطرح سؤالًا.",
  usefulPhrases: ["Ich heiße …", "Ich komme aus …", "Wie heißt du?"],
  successCriteriaAr: ["تحدثت دون قراءة النص كاملًا.", "طرحت سؤالًا."],
};
type SpeakingPhase = "prepare" | "ready" | "recording" | "review" | "saved";
const ratingValues = [1, 2, 3, 4, 5] as const;
const providerLabel = { disabled: "المحرك المحلي", gemini: "Gemini", openrouter: "OpenRouter Free-only", local: "Ollama المحلي" } as const;

export function SpeakingLab({ lessonId }: { lessonId?: string }) {
  const { state, update } = useLearning();
  const lesson = lessonId ? academicLessons[lessonId] : undefined;
  const task = lesson?.speaking ?? fallback;
  const taskId = lesson?.id ?? "a1-introduction";
  const level = lesson?.level ?? "A1";
  const firstLessonScaffold = taskId === "a1-01";
  const targetSeconds = speakingTargetSeconds(task.promptDe, level, { beginnerFirstLesson: firstLessonScaffold });
  const preparationTotal = speakingPreparationSeconds(level);
  const attempts = state.speakingAttempts.filter((attempt) => attempt.taskId === taskId);
  const latestAttempt = attempts.at(-1);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const pauseMonitorRef=useRef<Awaited<ReturnType<typeof startLocalPauseMonitor>>|null>(null);
  const [phase, setPhase] = useState<SpeakingPhase>("prepare");
  const [preparationRemaining, setPreparationRemaining] = useState(preparationTotal);
  const [responseRemaining, setResponseRemaining] = useState(targetSeconds);
  const [preparationNotes, setPreparationNotes] = useState(["", "", ""]);
  const [showRecordingSupport, setShowRecordingSupport] = useState(true);
  const [audioUrl, setAudioUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [pauseMetrics,setPauseMetrics]=useState<SpeakingPauseMetrics|null>(null);
  const [conditionCategory,setConditionCategory]=useState<SpeakingConditionAttribution["category"]>("unclear");
  const [conditionFactors,setConditionFactors]=useState<SpeakingConditionAttribution["factors"]>([]);
  const [listenedBack, setListenedBack] = useState(false);
  const [achievedCriteria, setAchievedCriteria] = useState<string[]>([]);
  const [clarityScore, setClarityScore] = useState<SpeakingSelfReview["clarityScore"]>(3);
  const [turnTaking, setTurnTaking] = useState(false);
  const [repairUsed, setRepairUsed] = useState(false);
  const [reflection, setReflection] = useState("");
  const [message, setMessage] = useState("");
  const [followUpSource, setFollowUpSource] = useState("");
  const [followUpEvidence, setFollowUpEvidence] = useState<SpeakingContentFollowUpEvidence | null>(null);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpBusy, setFollowUpBusy] = useState(false);
  const [pendingFollowUpConsent, setPendingFollowUpConsent] = useState(false);
  const [webGPUReady, setWebGPUReady] = useState(false);
  const [localPronunciationReady, setLocalPronunciationReady] = useState(false);
  const [localWordMatch, setLocalWordMatch] = useState<LocalWordMatchResult | null>(null);
  const [localWordMatchBusy, setLocalWordMatchBusy] = useState(false);
  const [localWordMatchMessage, setLocalWordMatchMessage] = useState("");
  const [localSignal, setLocalSignal] = useState<MicrophoneSignalAnalysis | null>(null);
  const [selectedRepairWord, setSelectedRepairWord] = useState("");

  useEffect(() => {
    if (firstLessonScaffold || phase !== "prepare" || preparationRemaining <= 0) return;
    const timer = window.setTimeout(() => {
      setPreparationRemaining((value) => Math.max(0, value - 1));
      if (preparationRemaining <= 1) setPhase("ready");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [firstLessonScaffold, phase, preparationRemaining]);

  useEffect(() => {
    if (phase !== "recording" || responseRemaining <= 0) return;
    const timer = window.setTimeout(() => {
      setResponseRemaining((value) => Math.max(0, value - 1));
      if (responseRemaining <= 1 && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, responseRemaining]);

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    let active = true;
    void Promise.all([inspectWebGPUModelCache(), inspectLocalPronunciationModel()]).then(([followUpMetadata, pronunciationMetadata]) => {
      if (!active) return;
      setWebGPUReady(Boolean(followUpMetadata));
      setLocalPronunciationReady(Boolean(pronunciationMetadata));
    }).catch(() => {
      if (!active) return;
      setWebGPUReady(false);
      setLocalPronunciationReady(false);
    });
    return () => { active = false; };
  }, []);

  function playModel(text: string, rate = .82) {
    if (!("speechSynthesis" in window)) {
      setMessage("هذا المتصفح لا يوفر صوتًا اصطناعيًا محليًا. يمكنك إبقاء العبارة ظاهرة والتدرب عليها.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = applySpeechPreferences(new SpeechSynthesisUtterance(text), state.speechPreferences, window.speechSynthesis.getVoices());
    utterance.lang = "de-DE";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
    setMessage("يتم تشغيل نموذج اصطناعي تعليمي، وليس صوت امتحان أو تقييم نطق.");
  }

  async function analyzeLocalWords() {
    if (!blob || !localPronunciationReady || localWordMatchBusy) return;
    setLocalWordMatchBusy(true);
    setLocalWordMatch(null);
    setLocalSignal(null);
    setSelectedRepairWord("");
    setLocalWordMatchMessage("");
    try {
      const sample = await decodeRecordingToLocalSample(blob);
      const signal = analyzeMicrophoneSignal(sample, localPronunciationModelRegistry.sampleRateHz);
      setLocalSignal(signal);
      if (signal.status !== "usable") {
        setLocalWordMatchMessage(`${signal.messageAr} ${signal.actionAr}. لم نحمّل نموذج الكلمات كي لا نخلط عيب الإشارة بالنطق.`);
        return;
      }
      const { transcript } = await transcribeGermanLocally(sample);
      const result = matchExpectedGermanWords(transcript, task.usefulPhrases);
      setLocalWordMatch(result);
      setLocalWordMatchMessage("اكتملت مطابقة الكلمات داخل جهازك. لم يُرسل التسجيل ولم تُحسب درجة نطق.");
    } catch (error) {
      setLocalWordMatchMessage(error instanceof Error ? error.message : "تعذر تحليل الكلمات محليًا.");
    } finally {
      setLocalWordMatchBusy(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { recorder } = createRecordingMediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      pauseMonitorRef.current=await startLocalPauseMonitor(stream);
      setPauseMetrics(null);
      setResponseRemaining(targetSeconds);
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const metrics=await pauseMonitorRef.current?.stop();pauseMonitorRef.current=null;if(metrics)setPauseMetrics(metrics);
        const next = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBlob(next);
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(next);
        });
        setDuration(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
        setListenedBack(false);
        stream.getTracks().forEach((track) => track.stop());
        setPhase("review");
      };
      recorderRef.current = recorder;
      recorder.start();
      setMessage("");
      setLocalWordMatch(null);
      setLocalSignal(null);
      setLocalWordMatchMessage("");
      setSelectedRepairWord("");
      setPhase("recording");
    } catch {
      setMessage("لم نتمكن من الوصول إلى الميكروفون. تحقق من إذن المتصفح.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }
  function selectBestAttempt(attemptId:string){update((current)=>markBestSpeakingAttempt(current,taskId,attemptId));setMessage("وُسمت هذه كأفضل محاولة باختيارك أنت؛ لا توجد مقارنة آلية للنطق.")}
  async function deleteSavedAttempt(attemptId:string,mediaId?:string){if(!window.confirm("حذف هذا التسجيل ومحاولته المحلية نهائيًا؟"))return;if(mediaId)await deleteMedia(mediaId);update((current)=>removeSpeakingAttempt(current,attemptId));setMessage("حُذف التسجيل والمحاولة المرتبطة به محليًا.")}

  function toggleFactor(item:SpeakingConditionAttribution["factors"][number]){setConditionFactors(current=>current.includes(item)?current.filter(value=>value!==item):[...current,item])}
  function toggleCriterion(item: string) {
    setAchievedCriteria((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }

  function updateFollowUpSource(value: string) {
    setFollowUpSource(value.slice(0, MAX_FOLLOW_UP_SOURCE_LENGTH));
    setFollowUpEvidence(null);
    setFollowUpMessage("");
  }

  function validateFollowUpSource() {
    const local = generateLocalContentFollowUp(followUpSource, level);
    if (local.status === "unavailable") {
      setFollowUpMessage(local.messageAr);
      return null;
    }
    return local;
  }

  async function generateLocalFollowUp() {
    const local = validateFollowUpSource();
    if (!local) return;
    setFollowUpBusy(true);
    try {
      const evidence = await createSpeakingContentFollowUpEvidence({
        sourceText: followUpSource,
        ...local.draft,
        provider: "disabled",
        model: LOCAL_FOLLOW_UP_MODEL,
        consent: "not-required",
      });
      setFollowUpEvidence(evidence);
      setFollowUpMessage("تولّد السؤال محليًا من النص المكتوب فقط؛ لم يُحلل التسجيل ولم تُستخدم الشبكة.");
    } catch (error) {
      setFollowUpMessage(error instanceof Error ? error.message : "تعذر إنشاء سؤال المتابعة المحلي.");
    } finally {
      setFollowUpBusy(false);
    }
  }

  async function generateWebGPUFollowUp() {
    const candidates = generateContentFollowUpCandidates(followUpSource, level);
    if (candidates.status === "unavailable") {
      setFollowUpMessage(candidates.messageAr);
      return;
    }
    setFollowUpBusy(true);
    setFollowUpMessage("");
    try {
      const ranked = await rankFollowUpCandidatesWithWebGPU(followUpSource, candidates.drafts.map((draft) => draft.questionDe));
      const selected = candidates.drafts[ranked.selectedIndex];
      const evidence = await createSpeakingContentFollowUpEvidence({
        sourceText: followUpSource,
        ...selected,
        supportAr: `${selected.supportAr} اختار نموذج التشابه المحلي هذا المرشح من ${candidates.drafts.length} أسئلة مؤلفة.`,
        provider: "browser-webgpu",
        model: webGPUModelRegistry.modelId,
        consent: "not-required",
      });
      setFollowUpEvidence(evidence);
      setFollowUpMessage("رتّب نموذج WebGPU المرشحات داخل جهازك. لم يُرسل النص أو التسجيل إلى مزود AI.");
    } catch (error) {
      const fallback = generateLocalContentFollowUp(followUpSource, level);
      if (fallback.status === "ready") {
        const evidence = await createSpeakingContentFollowUpEvidence({ sourceText:followUpSource,...fallback.draft,provider:"disabled",model:LOCAL_FOLLOW_UP_MODEL,consent:"not-required" });
        setFollowUpEvidence(evidence);
      }
      setFollowUpMessage(`${error instanceof Error ? error.message : "تعذر تشغيل نموذج WebGPU."} استُخدم السؤال الحتمي المحلي بدلًا منه.`);
    } finally {
      setFollowUpBusy(false);
    }
  }

  function requestAIContentFollowUp() {
    if (!validateFollowUpSource()) return;
    setPendingFollowUpConsent(true);
  }

  async function confirmAIContentFollowUp() {
    setPendingFollowUpConsent(false);
    setFollowUpBusy(true);
    setFollowUpMessage("");
    try {
      const answer = await askSpeakingFollowUp({
        provider: state.aiSettings.provider,
        model: state.aiSettings.model,
        key: sessionStorage.getItem("dwnb-ai-key") ?? "",
      }, followUpSource, {
        context: { lessonId: lesson?.id, level, taskPromptDe: task.promptDe },
        consentGranted: true,
      });
      const evidence = await createSpeakingContentFollowUpEvidence({
        sourceText: followUpSource,
        questionDe: answer.questionDe,
        supportAr: answer.supportAr,
        sourceCue: answer.groundingCue,
        cueCategory: answer.fallbackEvidence ? "keyword" : "ai-grounded",
        provider: answer.provider,
        model: answer.model,
        consent: answer.fallbackEvidence ? "not-required" : "explicit",
        fallbackEvidence: answer.fallbackEvidence,
      });
      setFollowUpEvidence(evidence);
      setFollowUpMessage(answer.fallbackEvidence ? aiFallbackMessage(answer.fallbackEvidence) : "استُخدم النص المكتوب بعد موافقتك مرة واحدة. لم يُرسل التسجيل الصوتي.");
    } catch (error) {
      setFollowUpMessage(error instanceof Error ? error.message : "تعذر إنشاء سؤال المتابعة عبر المزود الاختياري.");
    } finally {
      setFollowUpBusy(false);
    }
  }

  async function save() {
    if (!blob || !canSaveSpeakingReview({ listenedBack, reflection })) return;
    const mediaId = `speaking-${crypto.randomUUID()}`;
    await saveMedia(mediaId, blob);
    const now = new Date().toISOString();
    update((current) => ({
      ...current,
      speakingAttempts: [...current.speakingAttempts, {
        id: `attempt-${crypto.randomUUID()}`,
        taskId,
        mediaId,
        durationSeconds: duration,
        selfScore: clarityScore,
        reflection,
        selfReview: {
          listenedBack,
          achievedCriteria: [...achievedCriteria],
          clarityScore,
          turnTaking,
          repairUsed,
          preparationNotes: preparationNotes.map((note) => note.trim()).filter(Boolean),
          supportVisibleDuringRecording: showRecordingSupport,
        },
        contentFollowUp: followUpEvidence ?? undefined,
        targetSeconds,
        preparationSeconds: preparationTotal - preparationRemaining,
        pauseMetrics:pauseMetrics??undefined,
        conditionAttribution:{policyVersion:"learner-attributed-language-vs-device-v1",category:conditionCategory,factors:conditionFactors,attribution:"learner-reported-not-automatically-diagnosed",evidenceBoundary:"planning-context-no-score-mastery-or-device-diagnosis"},
        retryOf: latestAttempt?.id,
        createdAt: now,
      }],
      studyHistory: [...current.studyHistory, { date: now.slice(0, 10), minutes: Math.max(1, Math.ceil((preparationTotal + duration) / 60)), evidenceCount: 1 }],
    }));
    setMessage(`${state.motivationPreferences.gamificationVisible?`${behavioralPraise("speaking-self-review")} `:"حُفظت المراجعة الذاتية. "}لم يُرفع الصوت ولم تُحسب درجة نطق.`);
    setPhase("saved");
  }

  function retry() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setBlob(null);
    setDuration(0);
    setPauseMetrics(null);setConditionCategory("unclear");setConditionFactors([]);
    setListenedBack(false);
    setAchievedCriteria([]);
    setClarityScore(3);
    setTurnTaking(false);
    setRepairUsed(false);
    setReflection("");
    setMessage("");
    setFollowUpSource("");
    setFollowUpEvidence(null);
    setFollowUpMessage("");
    setPendingFollowUpConsent(false);
    setLocalWordMatch(null);
    setLocalSignal(null);
    setLocalWordMatchMessage("");
    setSelectedRepairWord("");
    setPreparationRemaining(preparationTotal);
    setResponseRemaining(targetSeconds);
    setShowRecordingSupport(true);
    setPhase("prepare");
  }

  function discard() {
    retry();
    setPreparationNotes(["", "", ""]);
  }

  const prepLabel = firstLessonScaffold ? "دون مؤقت" : `${String(Math.floor(preparationRemaining / 60)).padStart(2, "0")}:${String(preparationRemaining % 60).padStart(2, "0")}`;
  const responseLabel = `${String(Math.floor(responseRemaining / 60)).padStart(2, "0")}:${String(responseRemaining % 60).padStart(2, "0")}`;
  const band = duration ? speakingDurationBand(duration, targetSeconds) : null;
  const saveReady = Boolean(blob && canSaveSpeakingReview({ listenedBack, reflection }));
  const provider = state.aiSettings.provider;

  return <div className="lab-page" data-guided-speaking-policy={GUIDED_SPEAKING_SUPPORT_POLICY}>
    <header className="page-heading">
      <div><span className="eyebrow"><Mic2 size={15} /> تدريب التحدث · {level}</span><h1>تعلّم العبارة، <em>ثم سجّلها.</em></h1><p>{lesson ? `من درس «${lesson.titleAr}». سنبني الكلام خطوة بخطوة قبل أن نطلب منك التسجيل.` : "اختر درسًا، وسنشرح الهدف وندربك قبل التسجيل."}</p></div>
      <div className="lab-counter"><strong>{attempts.length || "ابدأ"}</strong><span>{attempts.length ? "محاولات محفوظة محليًا" : "لا توجد محاولة بعد"}</span></div>
    </header>

    {attempts.some((attempt)=>attempt.mediaId)&&<section className="speaking-best-attempts" data-best-attempt-policy="learner-selected-best-speaking-attempt-v1"><header><div><small lang="de" dir="ltr">Meine beste Aufnahme</small><strong>اختر أفضل تسجيل بنفسك أو احذفه</strong></div><span>لا تقييم آلي</span></header><div>{attempts.filter((attempt)=>attempt.mediaId).slice(-4).reverse().map((attempt)=><article key={attempt.id} className={attempt.bestForTask?"best":""}><div><strong>{attempt.bestForTask?"أفضل محاولة":"محاولة محفوظة"}</strong><small>{attempt.durationSeconds} ث · {new Intl.DateTimeFormat("ar-TN",{dateStyle:"short"}).format(new Date(attempt.createdAt))}</small></div><button type="button" disabled={attempt.bestForTask} onClick={()=>selectBestAttempt(attempt.id)}><Star size={14}/> {attempt.bestForTask?"مختارة":"اجعلها الأفضل"}</button><button type="button" onClick={()=>void deleteSavedAttempt(attempt.id,attempt.mediaId)}><Trash2 size={14}/> حذف</button></article>)}</div></section>}

    <nav className="speaking-workflow" aria-label="خطوات تدريب التحدث">
      {["استمع واقرأ", "تدرّب بالكلمات", "سجّل مع المساعدة", "استمع وراجع", "أعد للتحسين"].map((label, index) => {
        const active = phase === "prepare" ? index === 0 : phase === "ready" ? index === 1 : phase === "recording" ? index === 2 : phase === "review" ? index === 3 : phase === "saved" ? index === 4 : false;
        return <span key={label} className={active ? "active" : ""}><i>{index + 1}</i>{label}</span>;
      })}
    </nav>

    <div className="speaking-layout">
      <section className="speaking-task">
        <span className="task-label">هدفك في هذا التدريب · {level}</span>
        <h2 lang="de" dir="ltr">{task.promptDe}</h2>
        <p>{firstLessonScaffold ? "في نهاية التدريب ستستطيع قول اسمك، ثم سؤال شخص عن اسمه وحاله. سنبدأ بعبارات قصيرة، والتسجيل الأول لا يتجاوز عشر ثوانٍ." : task.promptAr}</p>

        {(phase === "prepare" || phase === "ready") && <>
          <section className="guided-speaking-phrases" aria-label="عبارات التدريب المسموعة">
            <header><strong>استمع، ثم قل كل عبارة بصوتك</strong><small>النموذج اصطناعي تعليمي. اضغط على أي عبارة لإعادة سماعها.</small></header>
            <div>{task.usefulPhrases.map((phrase) => <article key={phrase}><strong lang="de" dir="ltr">{phrase}</strong><button type="button" onClick={() => playModel(phrase)}><Volume2 size={15} /> استمع</button></article>)}</div>
          </section>
          <div className="speaking-preparation">
            <header><Clock3 size={18} /><div><strong>{firstLessonScaffold ? "تدرّب دون ضغط زمني" : "جهّز كلمات تساعدك"}</strong><small>ستبقى العبارات ظاهرة أثناء التسجيل ما لم تختر إخفاءها بنفسك.</small></div><b>{prepLabel}</b></header>
            <div>{preparationNotes.map((note, index) => <input key={index} value={note} onChange={(event) => setPreparationNotes((current) => current.map((value, itemIndex) => itemIndex===index?event.target.value:value))} placeholder={firstLessonScaffold ? ["اسمي", "سؤال الاسم", "سؤال الحال"][index] : `كلمة تساعدني ${index + 1}`} />)}</div>
            {phase === "prepare" ? <button onClick={() => setPhase("ready")}>تدرّبت، انتقل إلى التسجيل <ArrowLeft size={15} /></button> : <><label className="recording-support-choice"><input type="checkbox" checked={showRecordingSupport} onChange={(event)=>setShowRecordingSupport(event.target.checked)}/><span>أبقِ العبارات ظاهرة أثناء التسجيل</span></label><button onClick={() => void startRecording()}><Mic2 size={16} /> ابدأ تسجيلًا قصيرًا</button></>}
          </div>
        </>}

        {phase === "recording" && <>{showRecordingSupport&&<div className="recording-visible-support"><small>مساعدة ظاهرة باختيارك</small><div lang="de" dir="ltr">{task.usefulPhrases.map((phrase)=><span key={phrase}>{phrase}</span>)}</div><button type="button" onClick={()=>setShowRecordingSupport(false)}>إخفاء المساعدة</button></div>} {!showRecordingSupport&&<button type="button" className="show-recording-support" onClick={()=>setShowRecordingSupport(true)}>إظهار العبارات المساعدة</button>}<div className="speaking-live"><span className="record-dot" /><div><strong>التسجيل يعمل على جهازك</strong><small>قل ما تعلمته؛ الهدف التقريبي {targetSeconds} ثوانٍ</small></div><b>{responseLabel}</b><button onClick={stopRecording}><CircleStop size={17} /> أنهِ التسجيل</button></div></>}

        {(phase === "review" || phase === "saved") && <div className="speaking-playback">
          <header><Headphones size={18} /><div><strong>استمع إلى محاولتك كاملةً</strong><small>لا يُفتح الحفظ قبل وصول المشغل إلى النهاية.</small></div></header>
          <audio controls src={audioUrl} onEnded={() => setListenedBack(true)} aria-label="تشغيل محاولة المحادثة" />
          <div><span>المدة الفعلية <b>{duration} ث</b></span><span>الهدف الداخلي <b>{targetSeconds} ث</b></span><span>مقارنة المدة <b>{band === "short" ? "أقصر من 60%" : band === "long" ? "أطول من 130%" : "ضمن النطاق الداخلي"}</b></span></div>
          {pauseMetrics&&<div className="pause-metrics" data-pause-policy={pauseMetrics.policyVersion}><span>كلام مقدّر <b>{pauseMetrics.estimatedVoicedSeconds} ث</b></span><span>صمت مقدّر <b>{pauseMetrics.estimatedSilenceSeconds} ث</b></span><span>توقفات ≥0.3ث <b>{pauseMetrics.pauseCount}</b></span><small>طاقة صوت محلية فقط؛ لا كلمات ولا فونيمات ولا درجة طلاقة.</small></div>}
          {listenedBack && <p><Check size={14} /> اكتمل الاستماع الذاتي.</p>}
        </div>}

        {(phase === "review" || phase === "saved") && targetSeconds <= localPronunciationModelRegistry.maximumAudioSeconds && <section className="local-word-match-card" data-local-word-match={LOCAL_PRONUNCIATION_MODEL_POLICY}>
          <header><span><AudioLines size={18}/></span><div><small>اختياري · يعمل على جهازك</small><h3>طابق الكلمات التي قلتها</h3><p>يحوّل نموذج Whisper التسجيل مؤقتًا إلى نص ألماني، ثم يبحث عن كلمات المهمة. هذه ليست درجة نطق أو لهجة.</p></div></header>
          {localPronunciationReady ? <button type="button" className="primary-button" disabled={!listenedBack || localWordMatchBusy} onClick={()=>void analyzeLocalWords()}><AudioLines size={16}/>{localWordMatchBusy?"جاري فحص الإشارة والكلمات…":"افحص الإشارة وطابق الكلمات"}</button> : <div className="local-word-match-install"><p>حزمة مطابقة الكلمات غير مثبتة. يمكنك تنزيلها مرة واحدة من الإعدادات، أو متابعة الاستماع الذاتي دونها.</p><Link href="/settings#local-pronunciation-model" className="secondary-button">افتح إعدادات الحزمة</Link></div>}
          {localSignal&&<div className={`microphone-signal ${localSignal.status}`} data-microphone-signal={LOCAL_MICROPHONE_SIGNAL_POLICY}><div aria-hidden="true">{localSignal.waveform.map((value,index)=><i key={index} style={{height:`${Math.max(5,Math.round(value*100))}%`}}/>)}</div><p><b>{localSignal.status==="usable"?"الإشارة مناسبة":localSignal.status==="clipping"?"الصوت مرتفع جدًا":localSignal.status==="too-quiet"?"الصوت منخفض":"معظم التسجيل صامت"}</b>{localSignal.messageAr}</p><small>{localSignal.durationSeconds} ث · نشاط الإشارة {Math.round(localSignal.activeFrameRatio*100)}% · فحص جهاز لا تقييم لغة</small></div>}
          {localWordMatch&&<div className="local-word-match-result"><div><strong>ما استطاع النموذج سماعه</strong><span>{localWordMatch.heardCount} من {localWordMatch.expectedCount} كلمات مستهدفة</span></div><blockquote lang="de" dir="ltr">{localWordMatch.transcript||"Kein Text erkannt."}</blockquote><div className="local-word-match-words" lang="de" dir="ltr">{localWordMatch.words.map((item)=><button type="button" key={item.normalized} className={item.status} onClick={()=>{if(item.status==="unconfirmed"){setSelectedRepairWord(item.word);playModel(item.word,.72)}}} aria-label={item.status==="heard"?`تم التعرف على ${item.word}`:`لم تُؤكد ${item.word}، افتح تدريبها`}>{item.status==="heard"?<Check size={13}/>:"?"}<span>{item.word}</span></button>)}</div><div className="local-word-match-feedback">{localWordMatch.feedbackAr.map((item)=><p key={item}>{item}</p>)}</div></div>}
          {selectedRepairWord&&<LocalWordRepairPractice word={selectedRepairWord} onPlayModel={(word)=>playModel(word,.72)} onClose={()=>setSelectedRepairWord("")}/>} 
          {localWordMatchMessage&&<StatusAnnouncement message={localWordMatchMessage} channel="local-word-match" className="compact" icon={<ShieldCheck size={15}/>}/>} 
          <footer>النتيجة تبقى في ذاكرة الصفحة ولا تُحفظ في تقدمك. التسجيل نفسه لا يُحفظ إلا إذا ضغطت زر الحفظ.</footer>
        </section>}

        {(phase === "review" || phase === "saved") && <section className="content-follow-up-card" data-follow-up-policy={CONTENT_FOLLOW_UP_POLICY_VERSION}>
          <header><span><FileText size={18} /></span><div><small>اختياري · بعد الاستماع</small><h3 lang="de" dir="ltr">Was haben Sie gesagt?</h3><p>اكتب خلاصة ألمانية قصيرة لما قلته. هذا إدخال يدوي، وليس تحويلًا أو فهمًا للتسجيل.</p></div></header>
          <label><span lang="de" dir="ltr">Schreiben Sie drei bis fünf Sätze oder Stichpunkte.</span><textarea lang="de" dir="ltr" aria-label="Kurzer Inhalt Ihrer Antwort" maxLength={MAX_FOLLOW_UP_SOURCE_LENGTH} disabled={phase === "saved" || followUpBusy} value={followUpSource} onChange={(event) => updateFollowUpSource(event.target.value)} placeholder="Ich komme aus Tunesien und wohne in Berlin. Ich lerne Deutsch für meine Arbeit." /><small>{followUpSource.length}/{MAX_FOLLOW_UP_SOURCE_LENGTH} · يبقى محليًا ما لم توافق على إرسال هذا النص نفسه.</small></label>
          <div className="content-follow-up-actions">
            <button className="secondary-button" disabled={!listenedBack || followUpBusy || phase === "saved"} onClick={() => void generateLocalFollowUp()}><Sparkles size={15} /> متابعة محلية دون شبكة</button>
            {webGPUReady && <button className="secondary-button webgpu" disabled={!listenedBack || followUpBusy || phase === "saved"} onClick={() => void generateWebGPUFollowUp()}><BrainCircuit size={15} /> رتّب بنموذج WebGPU المحلي</button>}
            {provider !== "disabled" && <button className="secondary-button ai" disabled={!listenedBack || followUpBusy || phase === "saved"} onClick={requestAIContentFollowUp}><Bot size={15} /> متابعة عبر {providerLabel[provider]}</button>}
          </div>
          {followUpBusy && <p className="content-follow-up-busy">نبني سؤالًا واحدًا مرتبطًا بالنص المكتوب…</p>}
          {followUpEvidence && <article className="content-follow-up-result">
            <small>الإشارة المستخدمة: <q lang="de" dir="ltr">{followUpEvidence.sourceCue}</q></small>
            <strong lang="de" dir="ltr">{followUpEvidence.questionDe}</strong>
            <p>{followUpEvidence.supportAr}</p>
            <footer><bdi dir="ltr" data-bidi-scope="technical">{followUpEvidence.provider} · {followUpEvidence.model}</bdi><span>{followUpEvidence.consent === "explicit" ? "موافقة إرسال صريحة" : "محلي دون إرسال"}</span></footer>
          </article>}
          {followUpMessage && <StatusAnnouncement message={followUpMessage} channel="speaking-content-follow-up" className="compact" icon={<ShieldCheck size={15} />} />}
          <div className="content-follow-up-boundary"><ShieldAlert size={16} /><p>السؤال مبني على النص الذي كتبته فقط. لا توجد هنا تقنية تعرف الكلام، ولا تحليل للتسجيل، ولا درجة نطق أو طلاقة.</p></div>
        </section>}

        {message && <StatusAnnouncement message={message} channel="speaking-lab" className="success-banner" icon={<ShieldCheck size={17} />} />}
        {phase === "review" && <button className="secondary-button speaking-discard" onClick={discard}><Trash2 size={16} /> حذف التسجيل دون احتسابه</button>}
      </section>

      <aside className="self-rubric">
        <div className="card-title"><span>راجع ما قلته</span><small>استمع أولًا، ثم اختر ما أنجزته</small></div>
        {phase === "review" || phase === "saved" ? <>
          <div className="speaking-criteria">{task.successCriteriaAr.map((item) => <label key={item} className={achievedCriteria.includes(item) ? "checked" : ""}><input type="checkbox" checked={achievedCriteria.includes(item)} onChange={() => toggleCriterion(item)} /><span>{item}</span></label>)}</div>
          <label>وضوح المهمة من 5<div className="score-buttons">{ratingValues.map((score) => <button key={score} onClick={() => setClarityScore(score)} className={clarityScore === score ? "active" : ""}>{score}</button>)}</div></label>
          <label className="speaking-review-check"><input type="checkbox" checked={turnTaking} onChange={(event) => setTurnTaking(event.target.checked)} /><span>أخذت الدور أو طرحت/أجبت عن سؤال مناسب.</span></label>
          <label className="speaking-review-check"><input type="checkbox" checked={repairUsed} onChange={(event) => setRepairUsed(event.target.checked)} /><span>أصلحت فكرة أو أعدت صياغتها عند التعثر.</span></label>
          <fieldset className="audio-condition-check" data-condition-policy="learner-attributed-language-vs-device-v1"><legend><span lang="de" dir="ltr">Was war schwierig?</span> · ما مصدر الصعوبة؟</legend><div>{([['language','اللغة'],['audio-device','الصوت أو الجهاز'],['both','كلاهما'],['unclear','غير واضح']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={conditionCategory===id} onClick={()=>setConditionCategory(id)}>{label}</button>)}</div><section>{([['vocabulary','المفردات'],['grammar','القواعد'],['planning','تخطيط الجواب'],['speed','السرعة'],['noise','الضجيج'],['microphone','الميكروفون'],['playback','التشغيل'],['permission','الإذن']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={conditionFactors.includes(id)} onClick={()=>toggleFactor(id)}>{label}</button>)}</section><small>اختيارك أنت، لا تشخيص آلي ولا عقوبة.</small></fieldset>
          <label>الفجوة المحددة وخطة الإعادة<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="مثال: توقفت قبل السؤال؛ في الإعادة سأحفظ ترتيب السؤال لا النص كاملًا." /></label>
          <button className="primary-button" onClick={() => void save()} disabled={!saveReady || phase === "saved"}><Save size={16} /> {phase === "saved" ? "تم حفظ المحاولة" : "احفظ المحاولة بعد مراجعتها"}</button>
          {phase === "saved" && <button className="secondary-button" onClick={retry}><RotateCcw size={15} /> ابدأ محاولة محسنة</button>}
          <div className="privacy-note"><Volume2 size={17} /><p>لا يُحفظ التسجيل إلا عندما تضغط زر الحفظ. نثبت أيضًا إن كانت المساعدة ظاهرة حتى لا نخلط التدريب الموجّه بالمحاولة المستقلة. لا توجد درجة نطق آلية بعد.</p></div>
        </> : <div className="feedback-placeholder"><Mic2 size={26} /><p>ابدأ بالاستماع إلى العبارات وتكرارها. عندما تصبح مستعدًا، سجّل مع بقاء المساعدة ظاهرة أو أخفها باختيارك.</p></div>}
      </aside>
    </div>

    <RedemittelBank initialLevel={level}/>
    <InformationGapLab lessonId={taskId} />

    {pendingFollowUpConsent && <AccessibleDialog labelledBy="follow-up-consent-title" describedBy="follow-up-consent-description" className="tutor-consent-dialog" onClose={() => setPendingFollowUpConsent(false)}>
      <span><ShieldAlert size={24} /></span>
      <h2 id="follow-up-consent-title">موافقة مطلوبة قبل إرسال خلاصة جوابك</h2>
      <p id="follow-up-consent-description">سيُرسل النص المكتوب أدناه مع مستوى الدرس ومهمته إلى <b>{providerLabel[provider]}</b> لإنشاء سؤال ألماني واحد. لن يُرسل التسجيل أو ملف <bdi dir="ltr" data-bidi-scope="technical">Blob</bdi> أو مفتاحك داخل المحتوى.</p>
      <blockquote lang="de" dir="ltr">{followUpSource}</blockquote>
      <div><button className="secondary-button" onClick={() => setPendingFollowUpConsent(false)}>إلغاء الإرسال</button><button className="primary-button" onClick={() => void confirmAIContentFollowUp()}>أوافق وأرسل هذا النص مرة واحدة</button></div>
    </AccessibleDialog>}
  </div>;
}
