"use client";

import { useState } from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
import type { PracticeExercise, Question } from "@/types/lesson-content";
import { evaluateExercise } from "@/core/lesson/evaluate";
import { exerciseHintSteps, questionHintSteps } from "@/core/lesson/support";
import { LESSON_SHUFFLE_VERSION, shuffledExerciseOptions, shuffledQuestionOptions } from "@/core/lesson/shuffle";

export type LessonAttemptMetadata = { answerIndex?: number; shuffleSeed?: string; shuffleVersion?: typeof LESSON_SHUFFLE_VERSION };

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

  return <article className={result === null ? "exercise-card" : result ? "exercise-card correct" : "exercise-card wrong"} aria-labelledby={`${exercise.id}-prompt`}>
    <div className="exercise-label"><span>{exercise.type}</span><small>{exercise.id}</small></div>
    <h3 id={`${exercise.id}-prompt`}>{exercise.promptAr}</h3>

    {exercise.type === "multiple-choice" && shuffledMcq && <div className="exercise-options" dir="ltr">{shuffledMcq.options.map((option, position) => <button key={option.label} data-original-index={option.originalIndex} aria-pressed={choice === option.originalIndex} onClick={() => { setChoice(option.originalIndex); setResult(null); }} className={choice === option.originalIndex ? "selected" : ""}><span>{String.fromCharCode(65 + position)}</span>{option.label}</button>)}</div>}
    {exercise.type === "fill-blank" && <div className="text-exercise"><p dir="ltr">{exercise.template}</p><input dir="ltr" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} placeholder="اكتب الكلمة الناقصة" /></div>}
    {exercise.type === "word-ordering" && <div className="text-exercise"><div className="word-chips" dir="ltr">{exercise.words.map((word) => <span key={word}>{word}</span>)}</div><input dir="ltr" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} placeholder="اكتب الجملة بالترتيب الصحيح" /></div>}
    {exercise.type === "error-correction" && <div className="text-exercise"><p className="wrong-sentence" dir="ltr">{exercise.sentence}</p><input dir="ltr" value={text} onChange={(event) => { setText(event.target.value); setResult(null); }} placeholder="اكتب الجملة الصحيحة" /></div>}
    {exercise.type === "matching" && <div className="matching-list">{exercise.pairs.map((pair) => <label key={pair.left}><b dir="ltr">{pair.left}</b><select value={matches[pair.left] ?? ""} onChange={(event) => { setMatches((current) => ({ ...current, [pair.left]: event.target.value })); setResult(null); }}><option value="">اختر المعنى</option>{[...exercise.pairs].sort((left, right) => left.right.localeCompare(right.right)).map((item) => <option key={item.right} value={item.right}>{item.right}</option>)}</select></label>)}</div>}

    {result === null && hintLevel > 0 && <p className="hint-panel" role="status" aria-live="polite"><Lightbulb size={14} /><span><b>تلميح {hintLevel}/2</b>{hints[hintLevel - 1]}</span></p>}

    <footer>
      {result !== null ? <div className="exercise-feedback" role="status" aria-live="polite" aria-atomic="true"><span>{result ? <Check size={16} /> : <X size={16} />}</span><p><b>{result ? "إجابة صحيحة" : "تحتاج مراجعة"}</b>{exercise.explanationAr}</p></div> : <span />}
      <div className="exercise-actions">
        {result === null && <button className="tiny-hint" onClick={() => setHintLevel((level) => Math.min(2, level + 1))} disabled={hintLevel >= 2}><Lightbulb size={13} /> {hintLevel === 0 ? "تلميح" : hintLevel === 1 ? "تلميح أقوى" : "استخدم التلميحين"}</button>}
        {result !== null && <button className="tiny-reset" onClick={reset}><RotateCcw size={14} /> أعد</button>}
        <button className="tiny-check" disabled={!ready} onClick={check}>تحقق</button>
      </div>
    </footer>
  </article>;
}

export function QuestionQuiz({ questions, onAttempt, evidenceByQuestionId, shuffleSeed = "lesson-quiz" }: {
  questions: Question[];
  onAttempt: (id: string, answer: string, correct: boolean, metadata?: LessonAttemptMetadata) => void;
  evidenceByQuestionId?: Record<string, string>;
  shuffleSeed?: string;
}) {
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
      <h3 id={`${question.id}-prompt`}>{question.promptAr}</h3>
      <p lang="de" dir="ltr">{question.promptDe}</p>
      <div className="quiz-options">{shuffled.options.map((option, position) => <button key={option.label} data-original-index={option.originalIndex} aria-pressed={answer === option.originalIndex} className={answer === option.originalIndex ? "selected" : ""} disabled={isChecked} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.originalIndex }))}><span>{String.fromCharCode(65 + position)}</span>{option.label}</button>)}</div>

      {!isChecked && hintLevel > 0 && <p className="hint-panel" role="status" aria-live="polite"><Lightbulb size={14} /><span><b>تلميح {hintLevel}/2</b>{hints[hintLevel - 1]}</span></p>}

      {isChecked ? <footer role="status" aria-live="polite" aria-atomic="true"><div><b>{correct ? "صحيح" : "غير صحيح"}</b><span>{question.explanationAr}</span></div>{evidence && <blockquote className="question-evidence"><small>موضع الدليل من النص بعد الالتزام</small><q lang="de" dir="ltr">{evidence}</q></blockquote>}</footer> : <div className="quiz-actions"><button className="tiny-hint" onClick={() => setHintLevels((current) => ({ ...current, [question.id]: Math.min(2, hintLevel + 1) }))} disabled={hintLevel >= 2}><Lightbulb size={13} /> {hintLevel === 0 ? "تلميح قبل الإجابة" : hintLevel === 1 ? "تلميح أقوى" : "استخدم التلميحين"}</button><button className="quiz-check" disabled={answer === undefined} onClick={() => { setChecked((current) => ({ ...current, [question.id]: true })); onAttempt(question.id, question.options[answer], correct, { answerIndex: answer, shuffleSeed: `${shuffleSeed}:${question.id}`, shuffleVersion: LESSON_SHUFFLE_VERSION }); }}>تحقق</button></div>}
    </article>;
  })}</div>;
}
