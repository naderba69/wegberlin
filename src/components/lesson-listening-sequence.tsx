"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Headphones, Lightbulb, LockKeyhole } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import type { ExerciseAttempt, ListeningFocusId, ListeningProcessEvent, ListeningProcessEventKind } from "@/types/learning";
import { buildLessonListeningSequence, deriveListeningSequenceProgress, LISTENING_SEQUENCE_POLICY } from "@/core/listening/sequence";
import { LessonListeningPlayer } from "./lesson-listening-player";
import { QuestionQuiz, type LessonAttemptMetadata } from "./exercise-card";
import { questionTaxonomyForLesson } from "@/core/comprehension/question-taxonomy";
import { emitListeningUsage } from "@/core/listening/usage-evidence";

export function LessonListeningSequence({
  lesson,
  attempts,
  processEvents,
  speechStatus,
  onBrowserTts,
  onQuestionAttempt,
  onProcessEvent,
  onTranscriptOpen,
  onHint,
}: {
  lesson: FullLesson;
  attempts: ExerciseAttempt[];
  processEvents: ListeningProcessEvent[];
  speechStatus: string;
  onBrowserTts: (rate: number) => void;
  onQuestionAttempt: (id: string, answer: string, correct: boolean, metadata?: LessonAttemptMetadata) => void;
  onProcessEvent: (event: ListeningProcessEventKind, details?: { focusId?: ListeningFocusId; questionId?: string }) => void;
  onTranscriptOpen: () => void;
  onHint: (contentId: string, level: 1 | 2) => void;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const sequence = buildLessonListeningSequence(lesson);
  const progress = deriveListeningSequenceProgress(sequence, processEvents, attempts);
  const selectedFocus = sequence.before.focusOptions.find((option) => option.id === progress.focusId);
  const questionTaxonomy=questionTaxonomyForLesson(lesson);

  function commitGist(id: string, answer: string, correct: boolean, metadata?: LessonAttemptMetadata) {
    onQuestionAttempt(id, answer, correct, metadata);
    onProcessEvent("gist-committed", { questionId: id });
  }

  function commitDetail(id: string, answer: string, correct: boolean, metadata?: LessonAttemptMetadata) {
    onQuestionAttempt(id, answer, correct, metadata);
    onProcessEvent("detail-committed", { questionId: id });
  }

  function toggleTranscript() {
    if (!progress.transcriptUnlocked) return;
    const next = !showTranscript;
    setShowTranscript(next);
    if (next) { onTranscriptOpen(); emitListeningUsage({surface:"lesson",contentId:lesson.id,event:"transcript-revealed",revealAfterAnswerCommit:progress.transcriptUnlocked}); }
  }

  return <section className="lesson-section-block full listening-sequence" data-listening-sequence={LISTENING_SEQUENCE_POLICY}>
    <div className="listening-phase-map" aria-label="مراحل الاستماع الثلاث">
      <div className={progress.preparationComplete ? "done" : "active"}><span>{progress.preparationComplete ? <Check size={13}/> : 1}</span><p><b lang="de" dir="ltr">Vor dem Hören</b><small>قبل الاستماع</small></p></div>
      <div className={progress.gistCommitted ? "done" : progress.preparationComplete ? "active" : "locked"}><span>{progress.gistCommitted ? <Check size={13}/> : 2}</span><p><b lang="de" dir="ltr">Beim ersten Hören</b><small>أثناء السماع الأول</small></p></div>
      <div className={progress.transcriptUnlocked ? "done" : progress.gistCommitted ? "active" : "locked"}><span>{progress.transcriptUnlocked ? <Check size={13}/> : 3}</span><p><b lang="de" dir="ltr">Nach dem Hören</b><small>بعد الاستماع</small></p></div>
    </div>

    <article className="listening-phase-card before">
      <header><span>1</span><div><small lang="de" dir="ltr">Vor dem Hören</small><h2>حدد هدف السماع قبل التشغيل</h2></div></header>
      <p lang="de" dir="ltr">{sequence.before.promptDe}</p>
      <p>{sequence.before.promptAr}</p>
      <aside><Lightbulb size={16}/><span>{sequence.before.strategyAr}</span></aside>
      <div className="listening-focus-options" role="group" aria-label="اختر هدف السماع الأول">
        {sequence.before.focusOptions.map((option) => <button
          key={option.id}
          className={progress.focusId === option.id ? "selected" : ""}
          aria-pressed={progress.focusId === option.id}
          disabled={progress.preparationComplete}
          onClick={() => onProcessEvent("focus-committed", { focusId: option.id })}
        ><b lang="de" dir="ltr">{option.de}</b><small>{option.ar}</small></button>)}
      </div>
      {progress.preparationComplete && <div className="listening-commit-note"><Check size={15}/><span>{selectedFocus ? `ثُبت هدفك: ${selectedFocus.ar}.` : "وجدنا محاولة استماع سابقة؛ يمكنك مواصلة التسلسل دون إعادة الدليل."} هذا الاختيار لا يصنع درجة أو إتقانًا.</span></div>}
    </article>

    {progress.preparationComplete ? <>
      <LessonListeningPlayer lesson={lesson} speechStatus={speechStatus} onBrowserTts={onBrowserTts} onPlaybackStart={() => onProcessEvent("playback-started")}/>
      <article className="listening-phase-card during">
        <header><span>2</span><div><small lang="de" dir="ltr">Beim ersten Hören</small><h2>الفكرة العامة أولًا</h2></div></header>
        <p lang="de" dir="ltr">{sequence.during.promptDe}</p><p>{sequence.during.promptAr}</p>
        {progress.playbackStarted
          ? <QuestionQuiz questions={[sequence.during.question]} taxonomyByQuestionId={questionTaxonomy} onAttempt={commitGist} onSupport={onHint} shuffleSeed={`${lesson.id}:listening:gist`}/>
          : <div className="listening-phase-lock"><Headphones size={18}/><div><strong>شغّل المقطع أولًا</strong><p>بعد بدء MP3 أو Browser TTS يظهر سؤال الفكرة العامة. لا تحتاج إلى التقاط كل كلمة.</p></div></div>}
      </article>
    </> : <div className="listening-phase-lock"><LockKeyhole size={18}/><div><strong>الصوت ينتظر هدفًا واحدًا</strong><p>اختر ما ستراقبه في السماع الأول؛ الاختيار تخطيطي وغير مصحح.</p></div></div>}

    {progress.gistCommitted ? <article className="listening-phase-card after">
      <header><span>3</span><div><small lang="de" dir="ltr">Nach dem ersten Hören</small><h2>السماع الثاني للتفاصيل</h2></div></header>
      <p lang="de" dir="ltr">{sequence.after.promptDe}</p><p>{sequence.after.promptAr}</p>
      <QuestionQuiz questions={sequence.after.questions} taxonomyByQuestionId={questionTaxonomy} onAttempt={commitDetail} onSupport={onHint} shuffleSeed={`${lesson.id}:listening:detail`}/>
    </article> : <div className="listening-phase-lock"><LockKeyhole size={18}/><div><strong>التفاصيل مؤجلة</strong><p>التزم أولًا بجواب الفكرة العامة، ثم تظهر أسئلة التفاصيل.</p></div></div>}

    <div className={progress.transcriptUnlocked ? "listening-transcript-gate unlocked" : "listening-transcript-gate"}>
      <button disabled={!progress.transcriptUnlocked} onClick={toggleTranscript}>{showTranscript ? <EyeOff size={16}/> : <Eye size={16}/>} {showTranscript ? "إخفاء النص" : progress.transcriptUnlocked ? "إظهار النص بعد تثبيت الأجوبة" : `النص مقفول · ${progress.detailCommitted}/${progress.detailTotal} تفاصيل مثبتة`}</button>
      {!progress.transcriptUnlocked && <p><LockKeyhole size={14}/> أكمل سؤال الفكرة وكل أسئلة التفاصيل قبل فتح النص. لا يكشف الدعم جوابًا مبكرًا.</p>}
      {showTranscript && <div className="transcript-box"><p lang="de" dir="ltr">{lesson.listening.transcriptDe}</p><small>{lesson.listening.transcriptAr}</small></div>}
    </div>
  </section>;
}
