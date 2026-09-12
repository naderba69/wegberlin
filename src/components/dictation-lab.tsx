"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Headphones, Lightbulb, LockKeyhole, RefreshCcw, RotateCcw, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import type { CEFRLevel } from "@/types/learning";
import { buildPartialCanonical, DICTATION_EVIDENCE_BOUNDARY, DICTATION_POLICY, dictationItemsForLevel, type DictationItem } from "@/data/dictation-bank";
import { createDictationAttempt, evaluateFullDictation, evaluatePartialDictation, type DictationEvaluation, type DictationMismatch } from "@/core/listening/dictation";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import { AudioSpeedControl } from "./audio-speed-control";
import type { LearningPlaybackRate } from "@/core/audio/playback-speed";
import { useLearning } from "./learning-provider";

const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
const levelGuidance: Record<CEFRLevel, { modeAr: string; goalAr: string }> = {
  A1: { modeAr: "إملاء جزئي", goalAr: "كلمتان داخل جملة ظاهرة حتى تركز على الصوت والشكل دون حمل زائد." },
  A2: { modeAr: "جزئي ثم كامل", goalAr: "ثلاث مهام بفراغات ثم انتقال واضح إلى جملة كاملة قصيرة." },
  B1: { modeAr: "جسر إلى الإملاء الكامل", goalAr: "تمهيد واحد بالفراغات ثم ثلاث جمل كاملة ببنى مترابطة." },
  B2: { modeAr: "إملاء كامل", goalAr: "إعادة بناء حجة أو شرط كامل مع الحروف الكبيرة وعلامات الترقيم." },
};

function mismatchLabel(mismatch: DictationMismatch) {
  if (mismatch.kind === "missing") return { title: "كلمة ناقصة", actual: "—", expected: mismatch.expected ?? "" };
  if (mismatch.kind === "extra") return { title: "كلمة زائدة", actual: mismatch.actual ?? "", expected: "—" };
  return { title: "راجع هذه الكلمة", actual: mismatch.actual ?? "—", expected: mismatch.expected ?? "" };
}

function PartialFields({ item, answers, onChange }: { item: DictationItem; answers: Record<number, string>; onChange: (index: number, value: string) => void }) {
  const parts = item.partialTemplate?.split(/(\{\{\d+\}\})/gu) ?? [];
  return <div className="dictation-partial-sentence" lang="de" dir="ltr">
    {parts.map((part, position) => {
      const match = /^\{\{(\d+)\}\}$/u.exec(part);
      if (!match) return <span key={`${position}-${part}`}>{part}</span>;
      const index = Number(match[1]);
      const slot = item.slots?.find((candidate) => candidate.index === index);
      return <label key={`slot-${index}`}>
        <span className="sr-only">Lücke {index} · الفراغ {index}</span>
        <input
          lang="de"
          dir="ltr"
          value={answers[index] ?? ""}
          onChange={(event) => onChange(index, event.target.value)}
          aria-label={`Lücke ${index} · الفراغ ${index}`}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={40}
          style={{ width: `${Math.max(7, Math.min(15, (slot?.answer.length ?? 7) + 3))}ch` }}
        />
      </label>;
    })}
  </div>;
}

export function DictationLab() {
  const { state, update } = useLearning();
  const [level, setLevel] = useState<CEFRLevel>(() => state.profile?.currentLevel ?? "A1");
  const items = useMemo(() => dictationItemsForLevel(level), [level]);
  const [itemIndex, setItemIndex] = useState(0);
  const item = items[itemIndex] ?? items[0];
  const [played, setPlayed] = useState(false);
  const [playbackCount, setPlaybackCount] = useState(0);
  const [rate, setRate] = useState<LearningPlaybackRate>(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [fullAnswer, setFullAnswer] = useState("");
  const [result, setResult] = useState<{ evaluation: DictationEvaluation; attemptId: string } | null>(null);
  const [speechStatus, setSpeechStatus] = useState("");
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const taskAttempts = state.dictationAttempts.filter((attempt) => attempt.itemId === item.id);
  const hasInput = item.mode === "partial"
    ? Boolean(item.slots?.some((slot) => (answers[slot.index] ?? "").trim()))
    : Boolean(fullAnswer.trim());
  const readyToCheck = item.mode === "partial"
    ? Boolean(item.slots?.every((slot) => (answers[slot.index] ?? "").trim()))
    : Boolean(fullAnswer.trim());
  const activeStage = result ? 4 : hasInput ? 3 : played ? 2 : 1;

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => { if (result) resultHeadingRef.current?.focus(); }, [result]);

  function resetTask(nextLevel = level, nextIndex = itemIndex) {
    window.speechSynthesis?.cancel();
    setLevel(nextLevel);
    setItemIndex(nextIndex);
    setPlayed(false);
    setPlaybackCount(0);
    setRate(1);
    setAnswers({});
    setFullAnswer("");
    setResult(null);
    setSpeechStatus("");
  }

  function selectLevel(next: CEFRLevel) {
    resetTask(next, 0);
  }

  function play() {
    setPlayed(true);
    setPlaybackCount((count) => count + 1);
    if (!("speechSynthesis" in window)) {
      setSpeechStatus("هذا المتصفح لا يوفر صوتًا اصطناعيًا محليًا. يمكنك فتح المختبر من متصفح يدعم German TTS.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = applySpeechPreferences(new SpeechSynthesisUtterance(item.canonicalText), state.speechPreferences, window.speechSynthesis.getVoices());
    utterance.lang = "de-DE";
    utterance.rate = (level === "A1" ? 0.72 : level === "A2" ? 0.78 : 0.84) * rate;
    utterance.onstart = () => setSpeechStatus("يتم تشغيل الجملة الاصطناعية الآن…");
    utterance.onend = () => setSpeechStatus("انتهى التشغيل. اكتب ما سمعت، ويمكنك الإعادة دون عقوبة.");
    utterance.onerror = () => setSpeechStatus("تعذر تشغيل صوت الجهاز. المحاولة لا تُحسب إتقانًا ويمكنك إعادة التشغيل.");
    window.speechSynthesis.speak(utterance);
  }

  function submit() {
    if (!readyToCheck || !played || result) return;
    const evaluation = item.mode === "partial" ? evaluatePartialDictation(item, answers) : evaluateFullDictation(fullAnswer, item.canonicalText);
    const priorAttempt = taskAttempts.at(-1);
    const attempt = createDictationAttempt({ item, evaluation, playbackCount, retryOf: priorAttempt?.id });
    update((current) => ({ ...current, dictationAttempts: [...current.dictationAttempts, attempt] }));
    setResult({ evaluation, attemptId: attempt.id });
  }

  function retry() {
    setAnswers({});
    setFullAnswer("");
    setResult(null);
    setSpeechStatus("أخفينا النموذج. شغّل الجملة من جديد ثم أعد الكتابة.");
    requestAnimationFrame(() => editorRef.current?.querySelector<HTMLElement>("input, textarea")?.focus());
  }

  function nextTask() {
    resetTask(level, (itemIndex + 1) % items.length);
  }

  const renderedCanonical = item.mode === "partial" ? buildPartialCanonical(item) : item.canonicalText;

  return <div className="wide-page dictation-page" data-dictation-policy={DICTATION_POLICY} data-evidence-boundary={DICTATION_EVIDENCE_BOUNDARY}>
    <header className="dictation-hero">
      <div>
        <span className="eyebrow"><Sparkles size={15}/> تدريب متكيف حسب المستوى</span>
        <h1><span lang="de" dir="ltr">Diktat-Werkstatt</span> <em>مختبر الإملاء</em></h1>
        <p>استمع أولًا، اكتب قدر المستوى، ثم قارن موضع الخطأ وأعد المحاولة. يبدأ A1 بفراغات محددة ويتدرج حتى جمل B2 الكاملة.</p>
      </div>
      <aside aria-label="حدود المختبر">
        <span><Headphones size={19}/></span>
        <div><strong>16 مهمة أصلية</strong><small>4 لكل مستوى · دون AI أو شبكة من المنصة</small></div>
        <div><strong>محاولاتك: {state.dictationAttempts.length}</strong><small>نحفظ الملخص فقط، لا النص الذي كتبته</small></div>
      </aside>
    </header>

    <section className="dictation-level-panel" aria-labelledby="dictation-level-title">
      <div>
        <small lang="de" dir="ltr">Niveau wählen</small>
        <h2 id="dictation-level-title">اختر مستوى الحمل الكتابي</h2>
      </div>
      <div className="dictation-level-tabs" role="group" aria-label="مستوى الإملاء">
        {levels.map((candidate) => <button key={candidate} type="button" aria-pressed={candidate === level} className={candidate === level ? "active" : ""} onClick={() => selectLevel(candidate)}>
          <b>{candidate}</b><span>{levelGuidance[candidate].modeAr}</span>
        </button>)}
      </div>
      <footer><Lightbulb size={16}/><span><b>{levelGuidance[level].modeAr}:</b> {levelGuidance[level].goalAr}</span></footer>
    </section>

    <nav className="dictation-task-nav" aria-label={`مهام الإملاء في ${level}`}>
      {items.map((candidate, index) => <button key={candidate.id} type="button" className={index === itemIndex ? "active" : ""} aria-current={index === itemIndex ? "step" : undefined} onClick={() => resetTask(level, index)}>
        <span>{index + 1}</span><div><small lang="de" dir="ltr">Aufgabe {index + 1}</small><strong>{candidate.titleAr}</strong></div><em>{candidate.mode === "partial" ? "جزئي" : "كامل"}</em>
      </button>)}
    </nav>

    <section className="dictation-workspace">
      <ol className="dictation-step-rail" aria-label="خطوات الإملاء الأربع">
        {[
          ["Vorbereiten", "استعد"], ["Hören", "استمع"], ["Schreiben", "اكتب"], ["Vergleichen", "قارن"],
        ].map(([de, ar], index) => {
          const stage = index + 1;
          return <li key={de} className={stage < activeStage ? "done" : stage === activeStage ? "active" : "locked"} aria-current={stage === activeStage ? "step" : undefined}>
            <span>{stage < activeStage ? <Check size={14}/> : stage}</span><div><b lang="de" dir="ltr">{de}</b><small>{ar}</small></div>
          </li>;
        })}
      </ol>

      <div className="dictation-main-card">
        <header>
          <div><small>{level} · {item.mode === "partial" ? "إملاء جزئي" : "إملاء كامل"}</small><h2><span lang="de" dir="ltr">{item.titleDe}</span><em>{item.titleAr}</em></h2></div>
          <span>{itemIndex + 1}/{items.length}</span>
        </header>

        <article className="dictation-situation">
          <span><Lightbulb size={17}/></span><div><small lang="de" dir="ltr">Situation und Hörziel</small><strong>الموقف وهدف السماع</strong><p>{item.situationAr}</p><p><b>ركز الآن:</b> {item.focusAr}</p></div>
        </article>

        <section className="dictation-audio-stage" aria-labelledby="dictation-instruction">
          <div><Volume2 size={23}/><div><strong id="dictation-instruction" lang="de" dir="ltr">{item.instructionDe}</strong><p>{item.instructionAr}</p></div></div>
          <button type="button" className="dictation-play-button" onClick={play}><Headphones size={18}/><span lang="de" dir="ltr">{played ? "Noch einmal hören" : "Jetzt hören"}</span><small>{played ? "إعادة بلا عقوبة" : "ابدأ بالسماع"}</small></button>
          {played && <AudioSpeedControl rate={rate} onChange={setRate} label="سرعة صوت الإملاء الاصطناعي"/>}
          <p className="dictation-speech-status" role="status">{speechStatus || "الصوت اصطناعي من المتصفح وليس تسجيلًا بشريًا أو امتحانيًا. توفره وجودته يحددهما الجهاز."}</p>
        </section>

        {!played ? <div className="dictation-editor-lock"><LockKeyhole size={20}/><div><strong>حقل الكتابة يفتح بعد طلب السماع</strong><p>لا نعرض النموذج قبل المحاولة. يمكنك إعادة الصوت وتغيير السرعة متى شئت.</p></div></div> : <div className="dictation-editor" ref={editorRef}>
          <header><div><small lang="de" dir="ltr">Jetzt schreiben</small><h3>{item.mode === "partial" ? "أكمل الفراغات داخل الجملة" : "اكتب الجملة كاملة من الذاكرة السمعية"}</h3></div><span>{item.mode === "partial" ? `${item.slots?.length ?? 0} فراغات` : `${item.canonicalText.split(/\s+/u).length} كلمة تقريبًا`}</span></header>
          <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
            {item.mode === "partial"
              ? <PartialFields item={item} answers={answers} onChange={(index, value) => { setAnswers((current) => ({ ...current, [index]: value })); setResult(null); }}/>
              : <label className="dictation-full-field"><span lang="de" dir="ltr">Schreiben Sie den gehörten Satz.</span><small>اكتب ما سمعته. الحروف الكبيرة والفواصل جزء من المقارنة التعليمية.</small><textarea lang="de" dir="ltr" value={fullAnswer} onChange={(event) => { setFullAnswer(event.target.value); setResult(null); }} maxLength={360} spellCheck={false} autoComplete="off" /></label>}
            <div className="dictation-editor-actions"><small>{readyToCheck ? "إجابتك جاهزة للمقارنة." : "أكمل كل الحقول أولًا."}</small><button type="submit" className="primary-button" disabled={!readyToCheck || Boolean(result)}><CheckCircle2 size={17}/><span lang="de" dir="ltr">Vergleichen</span> · قارن</button></div>
          </form>
        </div>}

        {result && <section className={result.evaluation.exact ? "dictation-result exact" : "dictation-result needs-work"} aria-labelledby="dictation-result-title">
          <header><span>{result.evaluation.exact ? <CheckCircle2 size={22}/> : <RotateCcw size={22}/>}</span><div><small lang="de" dir="ltr">Auswertung zum Lernen</small><h3 id="dictation-result-title" ref={resultHeadingRef} tabIndex={-1}>{result.evaluation.exact ? "مطابقة كاملة لهذه المحاولة" : "قارن ثم أعد المحاولة"}</h3><p>{result.evaluation.feedbackAr}</p></div><strong aria-label={`مطابقة الكلمات ${result.evaluation.wordAccuracyPercent} بالمئة`}>{result.evaluation.wordAccuracyPercent}%<small>مطابقة الكلمات</small></strong></header>
          {!result.evaluation.exact && result.evaluation.mismatches.length > 0 && <div className="dictation-mismatch-list">
            {result.evaluation.mismatches.slice(0, 6).map((mismatch, index) => { const label = mismatchLabel(mismatch); return <article key={`${index}-${label.expected}-${label.actual}`}><small>{label.title}</small><div><del lang="de" dir="ltr">{label.actual}</del><ArrowLeft size={14}/><ins lang="de" dir="ltr">{label.expected}</ins></div></article>; })}
            {result.evaluation.mismatches.length > 6 && <p>توجد {result.evaluation.mismatches.length - 6} فروق أخرى؛ استخدم النموذج الكامل للمقارنة.</p>}
          </div>}
          <div className="dictation-model"><small lang="de" dir="ltr">Lösung zum Vergleichen</small><strong>النموذج بعد الالتزام</strong><p lang="de" dir="ltr">{renderedCanonical}</p></div>
          <footer><button type="button" className="secondary-button" onClick={retry}><RefreshCcw size={16}/> أخفِ النموذج وأعد</button><button type="button" className="primary-button" onClick={nextTask}>المهمة التالية <ArrowLeft size={16}/></button></footer>
        </section>}
      </div>

      <aside className="dictation-boundaries">
        <section><ShieldCheck size={18}/><div><strong>ما الذي يُحفظ؟</strong><p>المستوى، نوع المهمة، عدد مرات التشغيل، نسبة مطابقة الكلمات وعدد الفروق فقط. لا نحفظ النص الذي كتبته.</p></div></section>
        <section><CheckCircle2 size={18}/><div><strong>{taskAttempts.length} محاولات لهذه المهمة</strong><p>{taskAttempts.some((attempt) => attempt.exact) ? "لديك مطابقة كاملة محفوظة، لكنها لا تمنح إتقانًا أو حكم مستوى." : "أعد بقدر حاجتك؛ لا عقوبة ولا تأثير على مسار الدرس."}</p></div></section>
        <footer>هذا تدريب إملائي محلي القواعد، وليس اختبار CEFR أو درجة استماع رسمية. لا يرسل التطبيق النص أو الصوت إلى Gemini أو أي مزود.</footer>
      </aside>
    </section>
  </div>;
}
