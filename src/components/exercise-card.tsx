"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
import type { PracticeExercise, Question } from "@/types/lesson-content";
import type { AnswerConfidence, AttemptUncertaintyKind } from "@/types/learning";
import { evaluateExercise } from "@/core/lesson/evaluate";
import { exerciseHintSteps, questionHintSteps } from "@/core/lesson/support";
import { LESSON_SHUFFLE_VERSION, shuffledExerciseOptions, shuffledQuestionOptions } from "@/core/lesson/shuffle";
import { fragmentLanguageAttributes } from "@/core/i18n/language-boundary";
import type { QuestionTaxonomyDisplay } from "@/core/comprehension/question-taxonomy";
import { locateErrorSpan } from "@/core/lesson/error-span";

export type LessonAttemptMetadata = { confidence?: AnswerConfidence; answerIndex?: number; shuffleSeed?: string; shuffleVersion?: typeof LESSON_SHUFFLE_VERSION; responseTimeMs?: number; answerChangeCount?: number; uncertaintyKind?: AttemptUncertaintyKind; processPolicyVersion?: "bounded-attempt-process-v1" };

const confidenceOptions: Array<{ value: AnswerConfidence; de: string; ar: string }> = [
  { value:"low", de:"Unsicher", ar:"غير متأكد" },
  { value:"medium", de:"Ziemlich sicher", ar:"ثقة متوسطة" },
  { value:"high", de:"Sehr sicher", ar:"واثق جدًا" },
];

const uncertaintyOptions:Array<{value:AttemptUncertaintyKind;de:string;ar:string}>=[
  {value:"knowledge-recall",de:"Ich weiß es",ar:"أعرف الجواب"},
  {value:"guess",de:"Ich rate",ar:"أخمن"},
  {value:"instruction-unclear",de:"Die Aufgabe ist unklar",ar:"لم أفهم تعليمات السؤال"},
];

function useBoundedAttemptProcess(){
  const startedAt=useRef<number|null>(null);const hiddenAt=useRef<number|null>(null);const hiddenMs=useRef(0);const selections=useRef(new Map<string,string>());const changes=useRef(0);
  function start(){if(startedAt.current===null)startedAt.current=Date.now()}
  function select(field:string,value:string){start();const before=selections.current.get(field);if(before!==undefined&&before!==value)changes.current+=1;selections.current.set(field,value)}
  function snapshot(){const now=Date.now();const hidden=hiddenAt.current===null?0:now-hiddenAt.current;return{responseTimeMs:startedAt.current===null?undefined:Math.max(0,Math.min(30*60_000,now-startedAt.current-hiddenMs.current-hidden)),answerChangeCount:changes.current,processPolicyVersion:"bounded-attempt-process-v1" as const}}
  function reset(){startedAt.current=null;hiddenAt.current=null;hiddenMs.current=0;selections.current.clear();changes.current=0}
  useEffect(()=>{const visibility=()=>{if(document.visibilityState==="hidden"&&startedAt.current!==null&&hiddenAt.current===null)hiddenAt.current=Date.now();else if(document.visibilityState==="visible"&&hiddenAt.current!==null){hiddenMs.current+=Date.now()-hiddenAt.current;hiddenAt.current=null}};document.addEventListener("visibilitychange",visibility);return()=>document.removeEventListener("visibilitychange",visibility)},[]);
  return{start,select,snapshot,reset}
}

function useQuestionAttemptProcesses(){
  const records=useRef(new Map<string,{startedAt:number;hiddenAt:number|null;hiddenMs:number;lastAnswer?:number;changes:number}>());
  function ensure(id:string){let record=records.current.get(id);if(!record){record={startedAt:Date.now(),hiddenAt:null,hiddenMs:0,changes:0};records.current.set(id,record)}return record}
  function start(id:string){ensure(id)}
  function select(id:string,value:number){const record=ensure(id);if(record.lastAnswer!==undefined&&record.lastAnswer!==value)record.changes+=1;record.lastAnswer=value}
  function snapshot(id:string){const record=records.current.get(id);if(!record)return{answerChangeCount:0,processPolicyVersion:"bounded-attempt-process-v1" as const};const now=Date.now(),hidden=record.hiddenAt===null?0:now-record.hiddenAt;return{responseTimeMs:Math.max(0,Math.min(30*60_000,now-record.startedAt-record.hiddenMs-hidden)),answerChangeCount:record.changes,processPolicyVersion:"bounded-attempt-process-v1" as const}}
  useEffect(()=>{const visibility=()=>{const now=Date.now();for(const record of records.current.values()){if(document.visibilityState==="hidden"&&record.hiddenAt===null)record.hiddenAt=now;else if(document.visibilityState==="visible"&&record.hiddenAt!==null){record.hiddenMs+=now-record.hiddenAt;record.hiddenAt=null}}};document.addEventListener("visibilitychange",visibility);return()=>document.removeEventListener("visibilitychange",visibility)},[]);
  return{start,select,snapshot}
}

const exerciseTypeLabels: Record<PracticeExercise["type"], string> = {
  "multiple-choice": "اختيار من متعدد",
  "fill-blank": "إكمال فراغ",
  "word-ordering": "ترتيب كلمات",
  "error-correction": "تصحيح خطأ",
  matching: "مطابقة",
};

export const exerciseInstructionsDe: Record<PracticeExercise["type"], string> = {
  "multiple-choice": "Wählen Sie die richtige Antwort.",
  "fill-blank": "Ergänzen Sie die Lücke.",
  "word-ordering": "Bringen Sie die Wörter in die richtige Reihenfolge.",
  "error-correction": "Korrigieren Sie den Satz.",
  matching: "Ordnen Sie zu.",
};

function GapSentence({ template }: { template: string }) {
  const parts = template.split("___");
  return <p className="fill-sentence" lang="de" dir="ltr">{parts.map((part, index) => <span key={`${part}-${index}`}>{part}{index < parts.length - 1 && <mark className="blank-slot" aria-label="الكلمة الألمانية الناقصة">?</mark>}</span>)}</p>;
}

export function ExerciseCard({ exercise, onAttempt, onSupport }: { exercise: PracticeExercise; onAttempt: (answer: string, correct: boolean, metadata?: LessonAttemptMetadata) => void; onSupport?: (contentId: string, level: 1 | 2) => void }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [result, setResult] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<AnswerConfidence | undefined>();
  const [uncertaintyKind,setUncertaintyKind]=useState<AttemptUncertaintyKind|undefined>();
  const [hintLevel, setHintLevel] = useState(0);
  const process=useBoundedAttemptProcess();
  const hints = exerciseHintSteps(exercise);
  const shuffledMcq = exercise.type === "multiple-choice" ? shuffledExerciseOptions(exercise) : null;
  const correctionSpan=exercise.type==="error-correction"?locateErrorSpan(exercise.sentence,exercise.acceptedAnswers):null;

  function check() {
    const answer = exercise.type === "multiple-choice" ? (choice ?? -1) : exercise.type === "matching" ? matches : text;
    const correct = evaluateExercise(exercise, answer);
    const recordedAnswer = exercise.type === "multiple-choice" ? exercise.options[choice ?? 0] : typeof answer === "string" ? answer : JSON.stringify(answer);
    setResult(correct);
    const processMetadata={...process.snapshot(),uncertaintyKind};
    onAttempt(recordedAnswer, correct, exercise.type === "multiple-choice" ? { confidence, answerIndex: choice ?? undefined, shuffleSeed: exercise.id, shuffleVersion: LESSON_SHUFFLE_VERSION,...processMetadata } : { confidence,...processMetadata });
  }

  function revealHint() {
    process.start();
    const nextLevel = Math.min(2, hintLevel + 1) as 1 | 2;
    if (nextLevel === hintLevel) return;
    setHintLevel(nextLevel);
    onSupport?.(exercise.id, nextLevel);
  }

  function reset() {
    setChoice(null);
    setText("");
    setMatches({});
    setResult(null);
    setConfidence(undefined);
    setUncertaintyKind(undefined);
    setHintLevel(0);
    process.reset();
  }

  const ready = exercise.type === "multiple-choice" ? choice !== null : exercise.type === "matching" ? Object.keys(matches).length === exercise.pairs.length : text.trim().length > 0;

  return <article data-exercise-id={exercise.id} className={result === null ? "exercise-card" : result ? "exercise-card correct" : "exercise-card wrong"} aria-labelledby={`${exercise.id}-prompt`}>
    <div className="exercise-label"><span>{exerciseTypeLabels[exercise.type]}</span><small lang="de" dir="ltr">Direkte Übung</small></div>
    <h3 id={`${exercise.id}-prompt`} lang="de" dir="ltr">{exerciseInstructionsDe[exercise.type]}</h3>
    <p className="exercise-prompt-ar">{exercise.promptAr}</p>
    {exercise.type === "multiple-choice" && exercise.promptDe && <p className="exercise-german-stem" lang="de" dir="ltr">{exercise.promptDe.replace("___", "□")}</p>}

    {exercise.type === "multiple-choice" && shuffledMcq && <div className="exercise-options" lang="de" dir="ltr">{shuffledMcq.options.map((option, position) => <button key={option.label} data-original-index={option.originalIndex} aria-pressed={choice === option.originalIndex} onClick={() => { process.select("choice",String(option.originalIndex));setChoice(option.originalIndex); setResult(null); }} className={choice === option.originalIndex ? "selected" : ""}><span>{String.fromCharCode(65 + position)}</span><bdi {...fragmentLanguageAttributes(option.label)}>{option.label}</bdi></button>)}</div>}
    {exercise.type === "fill-blank" && <div className="text-exercise"><GapSentence template={exercise.template}/><label className="exercise-answer-field"><span>جوابك بالألمانية</span><input aria-label={`جواب تمرين: ${exercise.promptAr}`} lang="de" dir="ltr" value={text} onChange={(event) => { process.start();setText(event.target.value); setResult(null); }} placeholder="اكتب الكلمة هنا" /></label></div>}
    {exercise.type === "word-ordering" && <div className="text-exercise"><div className="word-chips" lang="de" dir="ltr">{exercise.words.map((word) => <span key={word}>{word}</span>)}</div><label className="exercise-answer-field"><span>الجملة بعد الترتيب</span><input aria-label={`جواب تمرين: ${exercise.promptAr}`} lang="de" dir="ltr" value={text} onChange={(event) => { process.start();setText(event.target.value); setResult(null); }} placeholder="اكتب الجملة كاملة" /></label></div>}
    {exercise.type === "error-correction" && correctionSpan && <div className="text-exercise"><p className="error-location-label"><span lang="de" dir="ltr">Fehlerstelle</span> · موضع الخطأ فقط، لا نكشف التصحيح</p><p className="wrong-sentence located" lang="de" dir="ltr">{correctionSpan.prefix}<mark>{correctionSpan.target}</mark>{correctionSpan.suffix}</p><label className="exercise-answer-field"><span>الجملة المصححة</span><input aria-label={`جواب تمرين: ${exercise.promptAr}`} lang="de" dir="ltr" value={text} onChange={(event) => { process.start();setText(event.target.value); setResult(null); }} placeholder="اكتب الجملة الصحيحة" /></label></div>}
    {exercise.type === "matching" && <div className="matching-list">{exercise.pairs.map((pair) => <label key={pair.left}><b lang="de" dir="ltr">{pair.left}</b><select aria-label={`معنى ${pair.left}`} value={matches[pair.left] ?? ""} onChange={(event) => { process.select(`match:${pair.left}`,event.target.value);setMatches((current) => ({ ...current, [pair.left]: event.target.value })); setResult(null); }}><option value="">اختر المعنى</option>{[...exercise.pairs].sort((left, right) => left.right.localeCompare(right.right)).map((item) => <option key={item.right} value={item.right} {...fragmentLanguageAttributes(item.right)}>{item.right}</option>)}</select></label>)}</div>}

    {result === null && <fieldset className="answer-confidence"><legend><span lang="de" dir="ltr">Wie sicher sind Sie?</span><small>اختياري · يُستعمل لترتيب العلاج فقط</small></legend><div>{confidenceOptions.map((option)=><button type="button" key={option.value} className={confidence===option.value?"active":""} aria-pressed={confidence===option.value} onClick={()=>{process.start();setConfidence(option.value)}}><b lang="de" dir="ltr">{option.de}</b><small>{option.ar}</small></button>)}</div></fieldset>}

    {result===null&&<fieldset className="attempt-uncertainty" data-attempt-process-policy="bounded-attempt-process-v1"><legend><span lang="de" dir="ltr">Was beschreibt Ihren Versuch?</span><small>اختياري · لا نسجل ضغطات المفاتيح</small></legend><div>{uncertaintyOptions.map((option)=><button type="button" key={option.value} aria-pressed={uncertaintyKind===option.value} className={uncertaintyKind===option.value?"active":""} onClick={()=>{process.start();setUncertaintyKind(option.value)}}><b lang="de" dir="ltr">{option.de}</b><small>{option.ar}</small></button>)}</div></fieldset>}

    {result === null && hintLevel > 0 && <p className="hint-panel" role="status" aria-live="polite"><Lightbulb size={14} /><span><b>تلميح {hintLevel}/2</b>{hints[hintLevel - 1]}</span></p>}

    <footer>
      {result !== null ? <div className="exercise-feedback" role="status" aria-live="polite" aria-atomic="true"><span>{result ? <Check size={16} /> : <X size={16} />}</span><p><b>{result ? "إجابة صحيحة" : "تحتاج مراجعة"}</b>{exercise.explanationAr}</p></div> : <span />}
      <div className="exercise-actions">
        {result === null && <button aria-label="تلميح" className="tiny-hint" onClick={revealHint} disabled={hintLevel >= 2}><Lightbulb size={13} /> {hintLevel === 0 ? "Tipp" : hintLevel === 1 ? "Mehr Hilfe" : "Tipps benutzt"}</button>}
        {result !== null && <button aria-label="أعد" className="tiny-reset" onClick={reset}><RotateCcw size={14} /> Wiederholen</button>}
        <button aria-label="تحقق" className="tiny-check" disabled={!ready} onClick={check}>Prüfen</button>
      </div>
    </footer>
  </article>;
}

export function QuestionQuiz({ questions, onAttempt, evidenceByQuestionId, taxonomyByQuestionId, shuffleSeed = "lesson-quiz", onSupport }: {
  questions: Question[];
  onAttempt: (id: string, answer: string, correct: boolean, metadata?: LessonAttemptMetadata) => void;
  evidenceByQuestionId?: Record<string, string>;
  taxonomyByQuestionId?: Record<string, QuestionTaxonomyDisplay>;
  shuffleSeed?: string;
  onSupport?: (contentId: string, level: 1 | 2) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [confidences, setConfidences] = useState<Record<string, AnswerConfidence>>({});
  const [uncertainties,setUncertainties]=useState<Record<string,AttemptUncertaintyKind>>({});
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const processes=useQuestionAttemptProcesses();

  return <div className="question-stack">{questions.map((question, index) => {
    const answer = answers[question.id];
    const isChecked = checked[question.id];
    const correct = answer === question.correctIndex;
    const confidence = confidences[question.id];
    const uncertaintyKind=uncertainties[question.id];
    const hintLevel = hintLevels[question.id] ?? 0;
    const hints = questionHintSteps(question);
    const evidence = evidenceByQuestionId?.[question.id];
    const taxonomy = taxonomyByQuestionId?.[question.id];
    const shuffled = shuffledQuestionOptions(question, shuffleSeed);

    return <article key={question.id} className={isChecked ? (correct ? "quiz-item correct" : "quiz-item wrong") : "quiz-item"} aria-labelledby={`${question.id}-prompt`}>
      <div className="question-function-meta"><small>سؤال {index + 1}</small>{taxonomy&&<span data-question-category={taxonomy.category}><b lang="de" dir="ltr">{taxonomy.labelDe}</b> · {taxonomy.labelAr}</span>}</div>
      <h3 id={`${question.id}-prompt`} lang="de" dir="ltr">{question.promptDe}</h3>
      <p>{question.promptAr}</p>
      <div className="quiz-options">{shuffled.options.map((option, position) => <button key={option.label} data-original-index={option.originalIndex} aria-pressed={answer === option.originalIndex} className={answer === option.originalIndex ? "selected" : ""} disabled={isChecked} onClick={() => {processes.select(question.id,option.originalIndex);setAnswers((current) => ({ ...current, [question.id]: option.originalIndex }))}}><span>{String.fromCharCode(65 + position)}</span><bdi {...fragmentLanguageAttributes(option.label)}>{option.label}</bdi></button>)}</div>

      {!isChecked && <fieldset className="answer-confidence"><legend><span lang="de" dir="ltr">Wie sicher sind Sie?</span><small>اختياري · ثقة عالية مع خطأ ترفع أولوية العلاج فقط</small></legend><div>{confidenceOptions.map((option)=><button type="button" key={option.value} className={confidence===option.value?"active":""} aria-pressed={confidence===option.value} onClick={()=>{processes.start(question.id);setConfidences((current)=>({...current,[question.id]:option.value}))}}><b lang="de" dir="ltr">{option.de}</b><small>{option.ar}</small></button>)}</div></fieldset>}

      {!isChecked&&<fieldset className="attempt-uncertainty" data-attempt-process-policy="bounded-attempt-process-v1"><legend><span lang="de" dir="ltr">Was beschreibt Ihren Versuch?</span><small>اختياري · لا نسجل ضغطات المفاتيح</small></legend><div>{uncertaintyOptions.map((option)=><button type="button" key={option.value} aria-pressed={uncertaintyKind===option.value} className={uncertaintyKind===option.value?"active":""} onClick={()=>{processes.start(question.id);setUncertainties((current)=>({...current,[question.id]:option.value}))}}><b lang="de" dir="ltr">{option.de}</b><small>{option.ar}</small></button>)}</div></fieldset>}

      {!isChecked && hintLevel > 0 && <p className="hint-panel" role="status" aria-live="polite"><Lightbulb size={14} /><span><b>تلميح {hintLevel}/2</b>{hints[hintLevel - 1]}</span></p>}

      {isChecked ? <footer role="status" aria-live="polite" aria-atomic="true"><div><b>{correct ? "صحيح" : "غير صحيح"}</b><span>{question.explanationAr}</span></div>{evidence && <blockquote className="question-evidence"><small>موضع الدليل من النص بعد الالتزام</small><q lang="de" dir="ltr">{evidence}</q></blockquote>}</footer> : <div className="quiz-actions"><button aria-label="تلميح قبل الإجابة" className="tiny-hint" onClick={() => { processes.start(question.id);const nextLevel = Math.min(2, hintLevel + 1) as 1 | 2; setHintLevels((current) => ({ ...current, [question.id]: nextLevel })); onSupport?.(question.id, nextLevel); }} disabled={hintLevel >= 2}><Lightbulb size={13} /> {hintLevel === 0 ? "Tipp" : hintLevel === 1 ? "Mehr Hilfe" : "Tipps benutzt"}</button><button aria-label="تحقق" className="quiz-check" disabled={answer === undefined} onClick={() => { setChecked((current) => ({ ...current, [question.id]: true })); onAttempt(question.id, question.options[answer], correct, { confidence, answerIndex: answer, shuffleSeed: `${shuffleSeed}:${question.id}`, shuffleVersion: LESSON_SHUFFLE_VERSION,uncertaintyKind,...processes.snapshot(question.id) }); }}>Prüfen</button></div>}
    </article>;
  })}</div>;
}
