"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleStop, Mic2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import {
  buildDiagnosticProductiveSample,
  canSubmitDiagnosticProductiveSample,
  DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION,
  DIAGNOSTIC_SPEAKING_TARGET_SECONDS,
} from "@/core/diagnostic/productive-sample";
import { saveMedia } from "@/core/portability/db";
import { createRecordingMediaRecorder } from "@/core/audio/recording-format";
import type { DiagnosticProductiveSample, DiagnosticProductiveSelfAssessment } from "@/types/learning";
import { StatusAnnouncement } from "./status-announcement";

type Props = { estimatedLevel: string; onComplete: (sample: DiagnosticProductiveSample) => void };

export function DiagnosticProductiveSampleStep({ estimatedLevel, onComplete }: Props) {
  const [writingText, setWritingText] = useState("");
  const [selfAssessment, setSelfAssessment] = useState<DiagnosticProductiveSelfAssessment | "">("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { recorder } = createRecordingMediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const seconds = Math.max(3, Math.min(45, Math.round((Date.now() - startedAtRef.current) / 1000)));
        setAudioBlob(blob);
        setDuration(seconds);
        setAudioUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(blob); });
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        setMessage(`اكتمل تسجيل محلي مدته ${seconds} ثانية. لم يُحلل النطق أو الطلاقة.`);
      };
      recorderRef.current = recorder;
      recorder.start();
      stopTimerRef.current = window.setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 45_000);
      setMessage("التسجيل يعمل محليًا؛ سيتوقف تلقائيًا بعد 45 ثانية.");
      setRecording(true);
    } catch {
      setMessage("تعذر تشغيل الميكروفون. يمكنك تقديم ثلاث كلمات مكتوبة أو اختيار «لا أستطيع بعد».");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function removeRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setAudioBlob(null);
    setDuration(0);
    setMessage("حُذف التسجيل التشخيصي قبل الحفظ.");
  }

  async function submit() {
    if (!selfAssessment) return;
    try {
      let mediaId: string | undefined;
      if (audioBlob) {
        mediaId = `diagnostic-speaking-${crypto.randomUUID()}`;
        await saveMedia(mediaId, audioBlob);
      }
      const sample = buildDiagnosticProductiveSample({
        writingText,
        speakingMediaId: mediaId,
        speakingDurationSeconds: duration || undefined,
        selfAssessment,
      });
      onComplete(sample);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ العينة الإنتاجية.");
    }
  }

  const canSubmit = Boolean(selfAssessment && canSubmitDiagnosticProductiveSample({ writingText, speakingDurationSeconds: duration || undefined, selfAssessment }));
  return <div className="diagnostic-productive-sample" data-productive-policy={DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION}>
    <header><span><ShieldCheck size={24}/></span><div><small lang="de" dir="ltr">Produktionsprobe ohne Note · {estimatedLevel}</small><h1>عينة قصيرة، بلا درجة لغوية مصطنعة</h1><p>هذه الخطوة تظهر فقط لمن اختار خبرة سابقة أو غير مؤكدة. لا تغيّر مستوى أسئلة التشخيص، بل تحفظ ما استطعت إنتاجه لمراجعته بنفسك.</p></div></header>
    <section className="diagnostic-production-prompt"><strong lang="de" dir="ltr">Stellen Sie sich in ein bis drei Sätzen vor. Sagen Sie auch, warum Sie Deutsch lernen.</strong><p>قدّم نفسك في جملة إلى ثلاث، واذكر لماذا تتعلم الألمانية. اكتب أو سجّل، ولا تحتاج إلى فعل الاثنين.</p></section>
    <label className="diagnostic-writing-sample"><span>Kurze Schreibprobe · عينة كتابة قصيرة</span><textarea lang="de" dir="ltr" value={writingText} onChange={(event)=>setWritingText(event.target.value)} placeholder="Ich heiße … Ich lerne Deutsch, weil …" maxLength={500}/><small>{writingText.trim()?writingText.trim().split(/\s+/u).length:0} كلمات · الحد التقني للإرسال 3 كلمات، وليس معيار جودة.</small></label>
    <section className="diagnostic-speaking-sample"><header><Mic2 size={18}/><div><strong>Kurze Sprechprobe · عينة كلام اختيارية</strong><small>الهدف نحو {DIAGNOSTIC_SPEAKING_TARGET_SECONDS} ثانية، والحد الأقصى 45 ثانية. التسجيل محلي فقط.</small></div></header>{audioUrl?<><audio controls src={audioUrl} aria-label="تشغيل عينة المحادثة التشخيصية"/><button type="button" onClick={removeRecording}><RotateCcw size={14}/> حذف وإعادة التسجيل</button></>:recording?<button type="button" onClick={stopRecording}><CircleStop size={15}/> أوقف التسجيل</button>:<button type="button" onClick={()=>void startRecording()}><Mic2 size={15}/> ابدأ تسجيلًا محليًا</button>}</section>
    {message&&<StatusAnnouncement message={message} channel="diagnostic-productive-recording" className="compact"/>}
    <fieldset><legend>Wie selbstständig war das? · كيف كان إنتاجك؟</legend><div>{([
      ["independent","دون مساعدة"],["with-help","بمساعدة أو تردد"],["not-yet","لا أستطيع بعد"],
    ] as const).map(([value,label])=><button type="button" key={value} aria-pressed={selfAssessment===value} className={selfAssessment===value?"active":""} onClick={()=>setSelfAssessment(value)}>{selfAssessment===value&&<Check size={13}/>} {label}</button>)}</div></fieldset>
    <div className="diagnostic-production-boundary"><ShieldCheck size={17}/><p><b>لا يوجد تصحيح أو تقدير CEFR لهذه العينة.</b> نحفظ النص، مدة التسجيل إن وجدت، وتقييمك الذاتي فقط. اختيار «لا أستطيع بعد» لا يخفض نتيجة الفهم.</p></div>
    <button type="button" className="primary-button" disabled={!canSubmit} onClick={()=>void submit()}><Save size={16}/> حفظ العينة وعرض نتيجة الفهم</button>
  </div>;
}
