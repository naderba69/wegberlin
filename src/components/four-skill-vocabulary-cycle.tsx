"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpenCheck, Check, Headphones, PenLine, Sparkles } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import type { LocalWordMatchResult } from "@/core/pronunciation/word-matching";
import { FOUR_SKILL_CYCLE_POLICY, validateAdaptiveWriting } from "@/core/lessons/four-skill-cycle";
import { PhrasePronunciationCheck } from "./phrase-pronunciation-check";

function firstIncompleteIndex(phraseCount: number, completed: Set<number>) {
  for (let index = 0; index < phraseCount; index += 1) if (!completed.has(index)) return index;
  return Math.max(0, phraseCount - 1);
}

type Props = {
  lesson: FullLesson;
  completedPhraseIndexes: number[];
  onPlayModel: (text: string) => Promise<boolean>;
  onPhraseAttempt: (phraseIndex: number, transcript: string, complete: boolean) => void;
  onComplete: () => void;
};

export function FourSkillVocabularyCycle({
  lesson,
  completedPhraseIndexes,
  onPlayModel,
  onPhraseAttempt,
  onComplete,
}: Props) {
  const completed = useMemo(() => new Set(completedPhraseIndexes), [completedPhraseIndexes]);
  const initiallyComplete = completed.size >= lesson.phrases.length;
  const [index, setIndex] = useState(() => firstIncompleteIndex(lesson.phrases.length, completed));
  const [heard, setHeard] = useState(false);
  const [written, setWritten] = useState("");
  const [spoken, setSpoken] = useState(false);
  const [cycleComplete, setCycleComplete] = useState(initiallyComplete);
  const [listenMessage, setListenMessage] = useState("");
  const advanceTimerRef = useRef<number | undefined>(undefined);
  const phrase = lesson.phrases[index];
  const writing = validateAdaptiveWriting(written, phrase.de, lesson.level);
  const visibleCompletedCount = Math.min(lesson.phrases.length, completed.size + (spoken && !completed.has(index) ? 1 : 0));

  useEffect(() => () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
  }, []);

  async function listen() {
    setListenMessage("");
    const started = await onPlayModel(phrase.de);
    setHeard(started);
    if (!started) setListenMessage("لم يبدأ الصوت. اختر صوتًا ألمانيًا متاحًا ثم أعد الاستماع.");
  }

  function resetPhrase(nextIndex: number) {
    setIndex(nextIndex);
    setHeard(false);
    setWritten("");
    setSpoken(false);
    setListenMessage("");
  }

  function advanceAfterSuccess() {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    const nextIndex = lesson.phrases.findIndex((_, candidate) => candidate !== index && !completed.has(candidate));
    if (nextIndex >= 0) {
      resetPhrase(nextIndex);
      return;
    }
    setCycleComplete(true);
    onComplete();
  }

  function handlePronunciationAttempt(result: LocalWordMatchResult, complete: boolean) {
    onPhraseAttempt(index, result.transcript, complete);
    if (!complete) {
      setSpoken(false);
      return;
    }
    setSpoken(true);
    advanceTimerRef.current = window.setTimeout(advanceAfterSuccess, 1100);
  }

  if (cycleComplete) {
    return (
      <section className="four-skill-vocabulary-cycle complete" data-vocabulary-cycle-policy={FOUR_SKILL_CYCLE_POLICY}>
        <div className="vocabulary-cycle-complete">
          <span><Sparkles size={22} /></span>
          <div>
            <small lang="de" dir="ltr">Lesen · Hören · Schreiben · Sprechen</small>
            <strong>اكتملت جميع العبارات {lesson.phrases.length}/{lesson.phrases.length}</strong>
            <p>لن تعود الدورة إلى العبارة الأولى. خطوتك التالية هي اكتشاف النمط.</p>
          </div>
          <button type="button" className="primary-button" onClick={onComplete}>اكتشف النمط <ArrowLeft size={16} /></button>
        </div>
      </section>
    );
  }

  return (
    <section className="four-skill-vocabulary-cycle" data-vocabulary-cycle-policy={FOUR_SKILL_CYCLE_POLICY}>
      <header>
        <div>
          <small lang="de" dir="ltr">Lesen · Hören · Schreiben · Sprechen</small>
          <strong>هدف متكيف لكل عبارة، وتقدم محفوظ دون دوران</strong>
        </div>
        <b aria-label={`${visibleCompletedCount} من ${lesson.phrases.length} عبارات مكتملة`}>{visibleCompletedCount}/{lesson.phrases.length}</b>
      </header>

      <article>
        <div className="vocabulary-cycle-read">
          <BookOpenCheck size={18} />
          <div>
            <small>اقرأ العبارة في معناها</small>
            <p lang="de" dir="ltr"><strong>{phrase.de}</strong></p>
            <span>{phrase.ar}</span>
          </div>
        </div>

        <button type="button" onClick={() => void listen()} className={heard ? "done" : ""}>
          {heard ? <Check size={15} /> : <Headphones size={15} />}
          {heard ? "تم الاستماع" : "استمع إلى العبارة"}
        </button>
        {listenMessage && <p className="vocabulary-listen-message" role="status">{listenMessage}</p>}

        <label className={writing.valid ? "valid" : ""}>
          <span><PenLine size={15} /> <b lang="de" dir="ltr">Schreiben Sie einen passenden Satz.</b></span>
          <small>{writing.instructionAr}</small>
          <input
            lang="de"
            dir="ltr"
            value={written}
            onChange={(event) => setWritten(event.target.value)}
            placeholder={`… ${phrase.de} …`}
            aria-describedby={`writing-goal-${lesson.id}-${index}`}
          />
          <em id={`writing-goal-${lesson.id}-${index}`} className={written && !writing.valid ? "needs-work" : ""}>
            {writing.feedbackAr}
          </em>
        </label>

        <PhrasePronunciationCheck
          key={`${lesson.id}-${index}`}
          phrase={phrase.de}
          disabled={!heard || !writing.valid || spoken}
          onPlayModel={(text) => { void onPlayModel(text); }}
          onAttempt={handlePronunciationAttempt}
        />

        <footer>
          <span className="done"><BookOpenCheck size={13} /> قراءة</span>
          <span className={heard ? "done" : ""}>{heard ? <Check size={13} /> : "2"} استماع ناجح</span>
          <span className={writing.valid ? "done" : ""}>{writing.valid ? <Check size={13} /> : "3"} كتابة بالعبارة</span>
          <span className={spoken ? "done" : ""}>{spoken ? <Check size={13} /> : "4"} مطابقة الكلمات</span>
          <strong>{spoken ? "نجحت العبارة — انتقال تلقائي…" : "أكمل المهارات بالترتيب"}</strong>
        </footer>
      </article>

      <p>تتغير مهمة الكتابة حسب المستوى وطول العبارة. فشل تقني في الميكروفون لا يُسجل خطأ نطق.</p>
    </section>
  );
}
