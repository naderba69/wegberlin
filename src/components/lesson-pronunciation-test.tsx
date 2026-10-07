"use client";

import { useState } from "react";
import { Check, Ear, Volume2, X } from "lucide-react";
import { derivePronunciationTestCase } from "@/core/lessons/pronunciation-test";
import type { FullLesson } from "@/types/lesson-content";

/**
 * عنصر النطق المشتقّ في اختبار الدرس (P1-22). لا صوت هنا ولا تسجيل: عرض رمز صوتي مؤلَّف
 * من الدرس نفسه، وتمييز المتعلّم، وتفسير فوري. الحدّ مكتوب: هذا تدريب تمييز لا قياس نطق.
 */
export function LessonPronunciationTest({ lesson, onAttempt }: { lesson: FullLesson; onAttempt: (id: string, answer: string, correct: boolean) => void }) {
  const item = derivePronunciationTestCase(lesson);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  if (!item) return null;
  const correct = answer === item.correctIndex;
  return (
    <article className="quiz-item pronunciation-test-item" data-pronunciation-test={item.policyVersion} data-pronunciation-boundary={item.boundary}>
      <div className="question-function-meta">
        <small>عنصر نطق إلزامي</small>
        <span><b lang="de" dir="ltr">Aussprache</b> · تمييز الرمز الصوتي</span>
      </div>
      <p className="pronunciation-test-prompt"><Ear size={16} /> {item.promptAr}</p>
      <p className="pronunciation-test-note">من بنود النطق المؤلَّفة في هذا الدرس — لا رمز صوتي مختلق ولا مستعار من درس آخر.</p>
      <div className="pronunciation-test-options" lang="de" dir="ltr" role="radiogroup" aria-label={item.promptDe}>
        {item.options.map((option, index) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={answer === index}
            className={checked ? (index === item.correctIndex ? "correct" : answer === index ? "wrong" : "") : answer === index ? "chosen" : ""}
            onClick={() => { if (checked) return; setAnswer(index); }}
          >
            <Volume2 size={14} /> {option}
          </button>
        ))}
      </div>
      <div className="pronunciation-test-actions">
        <button
          type="button"
          className="primary-button"
          disabled={answer === null || checked}
          onClick={() => { if (answer === null) return; setChecked(true); onAttempt(item.id, item.options[answer], answer === item.correctIndex); }}
        >
          <Check size={15} /> تحقّق
        </button>
        {checked ? <button type="button" className="secondary-button" onClick={() => { setAnswer(null); setChecked(false); }}>أعد المحاولة</button> : null}
      </div>
      {checked ? (
        <div className={correct ? "exercise-feedback ok" : "exercise-feedback bad"} role="status" aria-live="polite">
          <span>{correct ? <Check size={16} /> : <X size={16} />}</span>
          <p><b>{correct ? "تمييز صحيح" : "راجع الرمز"}</b>{item.explanationAr}</p>
        </div>
      ) : null}
    </article>
  );
}
