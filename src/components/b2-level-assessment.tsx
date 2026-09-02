"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardList,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { academicLessonList } from "@/data/academic-lessons";
import { useLearning } from "./learning-provider";

const lessons = academicLessonList.filter((lesson) => lesson.level === "B2");
const questions = lessons.flatMap((lesson) =>
  lesson.miniTest.slice(0, 4).map((question) => ({
    ...question,
    module: lesson.module,
    lessonId: lesson.id,
  })),
);

export function B2LevelAssessment() {
  const { state, update } = useLearning();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const score = questions.filter((question) => answers[question.id] === question.correctIndex).length;
  const moduleScores = useMemo(
    () =>
      Object.fromEntries(
        Array.from({ length: 6 }, (_, index) => {
          const items = questions.filter((question) => question.module === index + 1);
          return [index + 1, items.filter((question) => answers[question.id] === question.correctIndex).length];
        }),
      ),
    [answers],
  );

  const writing = state.writingSubmissions.filter(
    (item) => item.taskId.startsWith("b2-") && item.status !== "draft",
  ).length;
  const speaking = state.speakingAttempts.filter((item) => item.taskId.startsWith("b2-")).length;
  const completed = state.completedLessonIds.filter((id) => id.startsWith("b2-")).length;
  const criteria = {
    prerequisite: (state.mastery["level-b1-ready"] ?? 0) >= 100,
    knowledge: score >= 38,
    lessons: completed >= 12,
    writing: writing >= 6,
    speaking: speaking >= 6,
    diagnostic: Boolean(state.diagnosticResult),
  };
  const ready = Object.values(criteria).every(Boolean);

  function finish() {
    setFinished(true);
    update((current) => ({
      ...current,
      mastery: {
        ...current.mastery,
        "level-b2-knowledge": Math.round((score / questions.length) * 100),
        "level-b2-ready": ready ? 100 : 0,
      },
      studyHistory: [
        ...current.studyHistory,
        { date: new Date().toISOString().slice(0, 10), minutes: 70, evidenceCount: questions.length },
      ],
    }));
  }

  if (finished) {
    return (
      <div className="level-result">
        <header>
          <span className={ready ? "ready" : "locked"}>
            {ready ? <Trophy size={28} /> : <LockKeyhole size={28} />}
          </span>
          <small>بوابة B2 — تقييم تعلم داخلي غير رسمي</small>
          <h1>{score}<i>/48</i></h1>
          <h2>{ready ? "أدلة المنهج B2 مكتملة" : "الجاهزية تحتاج معرفة وإنتاجًا حديثًا"}</h2>
          <p>
            هذه نتيجة داخل المنصة وليست شهادة لغة أو محاكاة رسمية. تُفحص بوابة B1 وإكمال 12 درسًا وست كتابات وست محاولات محادثة مرتبطة بـB2.
          </p>
        </header>
        <div className="gate-criteria">
          {[
            ["prerequisite", "بوابة B1", criteria.prerequisite ? "مكتملة" : "غير مكتملة"],
            ["knowledge", "اختبار المعرفة", `${score}/48 — المطلوب 38`],
            ["lessons", "دروس B2", `${completed}/12`],
            ["writing", "كتابات B2", `${writing}/6`],
            ["speaking", "محاولات B2", `${speaking}/6`],
            ["diagnostic", "التشخيص", "دليل البداية"],
          ].map(([key, label, detail]) => (
            <article key={String(key)} className={criteria[key as keyof typeof criteria] ? "passed" : ""}>
              <span>{criteria[key as keyof typeof criteria] ? <Check size={15} /> : <LockKeyhole size={15} />}</span>
              <div><strong>{label}</strong><small>{String(detail)}</small></div>
            </article>
          ))}
        </div>
        <section className="module-score-report">
          <h3>نتيجة المعرفة حسب وحدة B2</h3>
          <div>
            {Object.entries(moduleScores).map(([module, value]) => (
              <article key={module}>
                <span>الوحدة {module}</span>
                <i><b style={{ width: `${(Number(value) / 8) * 100}%` }} /></i>
                <strong>{String(value)}/8</strong>
              </article>
            ))}
          </div>
        </section>
        <footer>
          <Link href={ready ? "/progress" : "/errors"} className="primary-button">
            {ready ? "افتح ملف أدلة B2" : "عالج الفجوات"}<ArrowLeft size={17} />
          </Link>
          <button className="secondary-button" onClick={() => { setFinished(false); setAnswers({}); }}>
            <RotateCcw size={16} /> إعادة صيغة تدريب
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="wide-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow"><ClipboardList size={15} /> تقييم نهاية B2</span>
          <h1>أثبت الجاهزية، <em>بدليل حديث.</em></h1>
          <p>48 سؤالًا موزعة بالتساوي على الوحدات الست، مع بوابة إنتاج تمنع تحويل B2 إلى اختبار تعرّف فقط.</p>
        </div>
        <div className="path-summary"><strong>{Object.keys(answers).length}</strong><span>إجابة<br />من أصل 48</span></div>
      </header>
      <div className="assessment-warning">
        <AlertTriangle size={18} />
        <p><b>تقييم داخلي محايد:</b> لا يخلط صيغة Goethe بصيغة telc ولا يمثل امتحانًا رسميًا. بعده تُراجع متطلبات الجهة التي اخترتها بصورة منفصلة.</p>
      </div>
      <div className="level-question-list">
        {Array.from({ length: 6 }, (_, moduleIndex) => (
          <section key={moduleIndex}>
            <header>
              <span>B2 · الوحدة {moduleIndex + 1}</span>
              <strong>{Object.keys(answers).filter((id) => questions.find((question) => question.id === id)?.module === moduleIndex + 1).length}/8</strong>
            </header>
            {questions.filter((question) => question.module === moduleIndex + 1).map((question, index) => (
              <article key={question.id}>
                <small>{index + 1}</small>
                <div><h3>{question.promptAr}</h3><p lang="de" dir="ltr">{question.promptDe}</p></div>
                <select
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: Number(event.target.value) }))}
                >
                  <option value="">اختر الجواب</option>
                  {question.options.map((option, optionIndex) => <option key={option} value={optionIndex}>{option}</option>)}
                </select>
              </article>
            ))}
          </section>
        ))}
      </div>
      <button
        className="primary-button level-submit"
        disabled={Object.keys(answers).length < questions.length}
        onClick={finish}
      >
        <ShieldCheck size={17} /> إنهاء وحساب بوابة B2
      </button>
    </div>
  );
}
