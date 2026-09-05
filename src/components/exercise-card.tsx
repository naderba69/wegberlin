"use client";

import { useState } from "react";
import type { ReadingEvidenceView } from "@/core/lesson/support";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
import type { PracticeExercise, Question } from "@/types/lesson-content";
import { evaluateExercise } from "@/core/lesson/evaluate";
import { exerciseHintSteps, questionHintSteps } from "@/core/lesson/support";
import { LESSON_SHUFFLE_VERSION, shuffledExerciseOptions, shuffledQuestionOptions } from "@/core/lesson/shuffle";
import { BidiText } from "./bidi-text";

export type LessonAttemptMetadata = { answerIndex?: number; shuffleSeed?: string; shuffleVersion?: typeof LESSON_SHUFFLE_VERSION };

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

export function ExerciseCard({ exercise, onAttempt }: { exercise: PracticeExercise; onAttempt: (answer: string, correct: boolean, metadata?: LessonAttemptMetadata) => void }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [result, setResult] = useState<boolean | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const hints = exerciseHintSteps(exercise);
  const shuffledMcq = exercise.type === "multiple-choice" ? shuffledExerciseOptions(exercise) : null;

  function check() {
    const answer = exercise.type === "multiple-choice" ? (choice ?? -1) : exercise.type === "matching" ? matches : text;
    const correct = evaluateExercise(exercise, answer);
    const recordedAnswer = exercise.type === "multiple-choice" ? exercise.options[choice ?? 0] : typeof answer === "string" ? answer : JSON.stringify(answer);
    setResult(correct);
    onAttempt(recordedAnswer, correct, exercise.type === "multiple-choice" ? { answerIndex: choice ?? undefined, shuffleSeed: exercise.id, shuffleVersion: LESSON_SHUFFLE_VERSION } : undefined);
  }

  function reset() {
    setChoice(null);
    setText("");
    setMatches({});
    setResult(null);
    setHintLevel(0);
  }

  const ready = exercise.type === "multiple-choice" ? choice !== null : exercise.type === "matching" ? Object.keys(matches).length === exercise.pairs.length : text.trim().length > 0;

  return <article data-exercise-id={exercise.id} className={result === null ? "exercise-card" : result ? "exercise-card correct" : "exercise-card wrong"} aria-labelledby={`${exercise.id}-prompt`}>
    <div className="exercise-label"><span>{exerciseTypeLabels[exercise.type]}</span><small lang="de" dir="ltr">Direkte Übung</small></div>
    <h3 id={`${exercise.id}-prompt`} lang="de" dir="ltr">{exerciseInstructionsDe[exercise.type]}</h3>
    <p className="exercise-prompt-ar"><BidiText text={exercise.promptAr}/></p>
    {exercise.type === "multiple-choice" && exercise.promptDe && <p className="exercise-german-stem" lang="de" dir="ltr">{exercise.promptDe.replace("___", "□")}</p>}

    {exercise.type === "multiple-choice" && shuffledMcq && <div className="exercise-options" dir="ltr">{shuffledMcq.options.map((option, position) => <button key={option.label} data-original-index={option.originalIndex} aria-pressed={choice === option.originalIndex} onClick={() => { setChoice(option.originalIndex); setResult(null); }} className={choice === option.originalIndex ? "selected" : ""}><span>{String.fromCharCode(65 + position)}</span>{option.label}</button>)}</div>}
    {exercise.type === "fill-blank" && <div className="text-exercise"><GapSentence template={exercise.template}/><label className="exercise-answer-field"><span>جوابك بالألمانية</span><input aria-label={`جواب تمرين: ${exercise.promptAr}`} dir="ltr" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} placeholder="اكتب الكلمة هنا" /></label></div>}
    {exercise.type === "word-ordering" && <div className="text-exercise"><div className="word-chips" dir="ltr">{exercise.words.map((word) => <span key={word}>{word}</span>)}</div><label className="exercise-answer-field"><span>الجملة بعد الترتيب</span><input aria-label={`جواب تمرين: ${exercise.promptAr}`} dir="ltr" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} placeholder="اكتب الجملة كاملة" /></label></div>}
    {exercise.type === "error-correction" && <div className="text-exercise"><p className="wrong-sentence" lang="de" dir="ltr">{exercise.sentence}</p><label className="exercise-answer-field"><span>الجملة المصححة</span><input aria-label={`جواب تمرين: ${exercise.promptAr}`} dir="ltr" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} placeholder="اكتب الجملة الصحيحة" /></label></div>}
    {exercise.type === "matching" && <div className="matching-list">{exercise.pairs.map((pair) => <label key={pair.left}><b dir="ltr">{pair.left}</b><select aria-label={`معنى ${pair.left}`} value={matches[pair.left] ?? ""} onChange={(event) => { setMatches((current) => ({ ...current, [pair.left]: event.target.value })); setResult(null); }}><option value="">اختر المعنى</option>{[...exercise.pairs].sort((left, right) => left.right.localeCompare(right.right)).map((item) => <option key={item.right} value={item.right}>{item.right}</option>)}</select></label>)}</div>}

    {result === null && hintLevel > 0 && <p className="hint-panel" role="status" aria-live="polite"><Lightbulb size={14} /><span><b>تلميح {hintLevel}/2</b>{hints[hintLevel - 1]}</span></p>}

    <footer>
      {result !== null ? <div className="exercise-feedback" role="status" aria-live="polite" aria-atomic="true"><span>{result ? <Check size={16} /> : <X size={16} />}</span><p><b>{result ? "إجابة صحيحة" : "تحتاج مراجعة"}</b><BidiText text={exercise.explanationAr}/></p></div> : <span />}
      <div className="exercise-actions">
        {result === null && <button aria-label="تلميح" className="tiny-hint" onClick={() => setHintLevel((level) => Math.min(2, level + 1))} disabled={hintLevel >= 2}><Lightbulb size={13} /> {hintLevel === 0 ? "Tipp" : hintLevel === 1 ? "Mehr Hilfe" : "Tipps benutzt"}</button>}
        {result !== null && <button aria-label="أعد" className="tiny-reset" onClick={reset}><RotateCcw size={14} /> Wiederholen</button>}
        <button aria-label="تحقق" className="tiny-check" disabled={!ready} onClick={check}>Prüfen</button>
      </div>
    </footer>
  </article>;
}

const DEFAULT_EVIDENCE_LABELS = {
  authored: "موضع الدليل من النص بعد الالتزام",
  auto: "أقرب جملة بالنص (مطابقة آلية غير مراجَعة)",
} as const;

export function QuestionQuiz({ questions, onAttempt, evidenceByQuestionId, evidenceLabels, shuffleSeed = "lesson-quiz" }: {
  questions: Question[];
  onAttempt: (id: string, answer: string, correct: boolean, metadata?: LessonAttemptMetadata) => void;
  evidenceByQuestionId?: Record<string, ReadingEvidenceView>;
  /** تسمية الدليل حسب المهارة: نص مقروء أم نص مسموع. */
  evidenceLabels?: { authored: string; auto: string };
  shuffleSeed?: string;
}) {
  const labels = evidenceLabels ?? DEFAULT_EVIDENCE_LABELS;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});

  return <div className="question-stack">{questions.map((question, index) => {
    const answer = answers[question.id];
    const isChecked = checked[question.id];
    const correct = answer === question.correctIndex;
    const hintLevel = hintLevels[question.id] ?? 0;
    const hints = questionHintSteps(question);
    const evidence = evidenceByQuestionId?.[question.id];
    const shuffled = shuffledQuestionOptions(question, shuffleSeed);

    return <article key={question.id} className={isChecked ? (correct ? "quiz-item correct" : "quiz-item wrong") : "quiz-item"} aria-labelledby={`${question.id}-prompt`}>
      <small>سؤال {index + 1}</small>
      <h3 id={`${question.id}-prompt`}><BidiText text={question.promptAr}/></h3>
      <p lang="de" dir="ltr">{question.promptDe}</p>
      <div className="quiz-options">{shuffled.options.map((option, position) => <button key={option.label} data-original-index={option.originalIndex} aria-pressed={answer === option.originalIndex} className={answer === option.originalIndex ? "selected" : ""} disabled={isChecked} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.originalIndex }))}><span>{String.fromCharCode(65 + position)}</span>{option.label}</button>)}</div>

      {!isChecked && hintLevel > 0 && <p className="hint-panel" role="status" aria-live="polite"><Lightbulb size={14} /><span><b>تلميح {hintLevel}/2</b>{hints[hintLevel - 1]}</span></p>}

      {isChecked ? <footer role="status" aria-live="polite" aria-atomic="true"><div><b>{correct ? "صحيح" : "غير صحيح"}</b><span><BidiText text={question.explanationAr}/></span></div>{evidence && <blockquote className="question-evidence"><small>{evidence.origin === "authored" ? labels.authored : labels.auto}</small><q lang="de" dir="ltr">{evidence.quote}</q>{evidence.whyAr ? <span lang="ar" dir="rtl">{evidence.whyAr}</span> : null}</blockquote>}</footer> : <div className="quiz-actions"><button aria-label="تلميح قبل الإجابة" className="tiny-hint" onClick={() => setHintLevels((current) => ({ ...current, [question.id]: Math.min(2, hintLevel + 1) }))} disabled={hintLevel >= 2}><Lightbulb size={13} /> {hintLevel === 0 ? "Tipp" : hintLevel === 1 ? "Mehr Hilfe" : "Tipps benutzt"}</button><button aria-label="تحقق" className="quiz-check" disabled={answer === undefined} onClick={() => { setChecked((current) => ({ ...current, [question.id]: true })); onAttempt(question.id, question.options[answer], correct, { answerIndex: answer, shuffleSeed: `${shuffleSeed}:${question.id}`, shuffleVersion: LESSON_SHUFFLE_VERSION }); }}>Prüfen</button></div>}
    </article>;
  })}</div>;
}
