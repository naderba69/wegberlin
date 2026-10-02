"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AudioLines, Check, CircleStop, Mic2, RotateCcw, ShieldAlert, Volume2 } from "lucide-react";
import { createRecordingMediaRecorder } from "@/core/audio/recording-format";
import { decodeRecordingToLocalSample } from "@/core/pronunciation/audio-sample";
import { inspectLocalPronunciationModel, transcribeGermanLocally } from "@/core/pronunciation/local-model";
import { analyzeMicrophoneSignal, type MicrophoneSignalAnalysis } from "@/core/pronunciation/microphone-signal";
import { germanWords, matchExpectedGermanPhrase, type LocalWordMatchResult } from "@/core/pronunciation/word-matching";
import { StatusAnnouncement } from "./status-announcement";

export const PHRASE_PRONUNCIATION_CHECK_POLICY = "transient-local-phrase-word-check-v1" as const;

type Phase = "idle" | "listening" | "analyzing" | "result";

type Props = {
  phrase: string;
  disabled?: boolean;
  onPlayModel: (text: string) => void;
  onAttempt: (result: LocalWordMatchResult, complete: boolean) => void;
};

function maximumListeningMilliseconds(phrase: string) {
  return Math.min(12_000, Math.max(4_500, 3_000 + germanWords(phrase).length * 850));
}

export function PhrasePronunciationCheck({ phrase, disabled = false, onPlayModel, onAttempt }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [signal, setSignal] = useState<MicrophoneSignalAnalysis | null>(null);
  const [result, setResult] = useState<LocalWordMatchResult | null>(null);
  const [message, setMessage] = useState("");
  const [needsModel, setNeedsModel] = useState(false);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  async function analyzeTransientAudio(blob: Blob) {
    setPhase("analyzing");
    try {
      const sample = await decodeRecordingToLocalSample(blob);
      const quality = analyzeMicrophoneSignal(sample, 16_000);
      setSignal(quality);
      if (quality.status !== "usable") {
        setMessage(`${quality.messageAr} ${quality.actionAr}.`);
        setPhase("result");
        return;
      }
      const { transcript } = await transcribeGermanLocally(sample);
      const next = matchExpectedGermanPhrase(transcript, phrase);
      const complete = next.expectedCount > 0 && next.heardCount === next.expectedCount;
      setResult(next);
      setMessage(complete
        ? "تأكدت جميع كلمات العبارة وبالترتيب. ستنتقل إلى الخطوة التالية."
        : "بعض الكلمات لم تتأكد. استمع إليها ثم أعد العبارة كاملة.");
      setPhase("result");
      onAttempt(next, complete);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "تعذر فحص العبارة محليًا.";
      setNeedsModel(/نزّل حزمة/u.test(detail));
      setMessage(detail);
      setPhase("result");
    }
  }

  async function startListening() {
    if (disabled || phase === "listening" || phase === "analyzing") return;
    setMessage("");
    setSignal(null);
    setResult(null);
    setNeedsModel(false);
    try {
      const installed = await inspectLocalPronunciationModel();
      if (!installed) {
        setNeedsModel(true);
        setMessage("نزّل حزمة مطابقة الكلمات المحلية مرة واحدة قبل بدء التحقق الآلي.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("الميكروفون غير متاح في هذا المتصفح.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { recorder } = createRecordingMediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        void analyzeTransientAudio(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setPhase("listening");
      timerRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, maximumListeningMilliseconds(phrase));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر فتح الميكروفون. تحقق من الإذن ثم حاول مرة أخرى.");
      setPhase("result");
    }
  }

  function stopListening() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  const complete = Boolean(result && result.expectedCount > 0 && result.heardCount === result.expectedCount);

  return (
    <section className="phrase-pronunciation-check" data-pronunciation-check={PHRASE_PRONUNCIATION_CHECK_POLICY}>
      <header>
        <div>
          <small lang="de" dir="ltr">Sprich die ganze Zielphrase aus.</small>
          <strong>انطق العبارة كاملة ليتحقق المحرك من كل كلمة</strong>
        </div>
        <button type="button" onClick={() => onPlayModel(phrase)} aria-label="استمع إلى نطق العبارة النموذجي">
          <Volume2 size={16} /> استمع
        </button>
      </header>

      <div className="phrase-word-status" lang="de" dir="ltr" aria-label="حالة كلمات العبارة">
        {(result?.words ?? germanWords(phrase).map((word) => ({ word, normalized: word, status: "pending" as const }))).map((item, index) => (
          <button
            type="button"
            key={`${item.normalized}-${index}`}
            className={item.status}
            onClick={() => item.status === "unconfirmed" && onPlayModel(item.word)}
            disabled={item.status !== "unconfirmed"}
            aria-label={item.status === "heard" ? `${item.word}: مؤكدة` : item.status === "unconfirmed" ? `${item.word}: تحتاج إعادة` : `${item.word}: في الانتظار`}
          >
            {item.status === "heard" ? <Check size={14} /> : item.status === "unconfirmed" ? <RotateCcw size={13} /> : null}
            <span>{item.word}</span>
          </button>
        ))}
      </div>

      <div className="phrase-microphone-actions">
        {phase !== "listening" ? (
          <button type="button" className="primary-button" disabled={disabled || phase === "analyzing" || complete} onClick={() => void startListening()}>
            {phase === "analyzing" ? <AudioLines size={17} /> : <Mic2 size={17} />}
            {phase === "analyzing" ? "جاري التحقق من الكلمات…" : result ? "أعد العبارة كاملة" : "ابدأ النطق"}
          </button>
        ) : (
          <button type="button" className="primary-button listening" onClick={stopListening}>
            <CircleStop size={17} /> أنهيت العبارة
          </button>
        )}
        {phase === "listening" && <span className="live-listening"><i /> يستمع المحرك الآن…</span>}
      </div>

      {disabled && <p className="phrase-prerequisite"><ShieldAlert size={15} /> أكمل الاستماع والكتابة أولًا، ثم انطق العبارة.</p>}
      {signal && signal.status !== "usable" && <p className={`phrase-signal-status ${signal.status}`}>{signal.messageAr}</p>}
      {needsModel && <Link href="/settings#local-pronunciation-model" className="secondary-button">تثبيت المحرك المحلي المجاني</Link>}
      {message && <StatusAnnouncement message={message} channel={`phrase-pronunciation-${phrase}`} className={complete ? "compact success" : "compact"} icon={complete ? <Check size={15} /> : <ShieldAlert size={15} />} />}
      <footer>المحرك يؤكد كلمات العبارة عبر التعرف المحلي. لا يُحفظ الصوت، ولا تُعرض درجة لهجة أو فونيمات غير مثبتة.</footer>
    </section>
  );
}
