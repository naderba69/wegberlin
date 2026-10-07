"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, CircleAlert, ClipboardCheck, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { fragmentLanguageAttributes } from "@/core/i18n/language-boundary";
import { buildLocalPracticeTest, createLocalTestSeed, LOCAL_TEST_GENERATOR_BOUNDARY, LOCAL_TEST_GENERATOR_POLICY, LOCAL_TEST_SIZES, type GeneratedLocalTest, type LocalTestSize } from "@/core/training/local-test-generator";
import { loadLocalTestTemplateBank } from "@/core/training/local-test-template-loader";
import type { CEFRLevel } from "@/types/learning";

const LEVELS: readonly CEFRLevel[] = ["A1", "A2", "B1", "B2"];

export function LocalTestGenerator() {
  const [level, setLevel] = useState<CEFRLevel | "">("");
  const [itemCount, setItemCount] = useState<LocalTestSize>(10);
  const [test, setTest] = useState<GeneratedLocalTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = Object.keys(answers).length;
  const correctCount = test?.items.reduce((sum, item, index) => sum + (answers[index] === item.correctIndex ? 1 : 0), 0) ?? 0;

  async function startTest() {
    if (!level || loading) return;
    setLoading(true);
    setError("");
    try {
      const bank = await loadLocalTestTemplateBank(level);
      const nextTest = buildLocalPracticeTest(level, itemCount, createLocalTestSeed(), bank);
      setTest(nextTest);
      setAnswers({});
      setSubmitted(false);
    } catch {
      setTest(null);
      setAnswers({});
      setSubmitted(false);
      setError("تعذر تجهيز المجموعة المحلية. لم تُحفظ أي إجابة؛ اختر المستوى والحجم ثم أعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }

  function returnToSetup() {
    setTest(null);
    setAnswers({});
    setSubmitted(false);
    setError("");
  }

  // Policy marker: local-test-generator-v1 is emitted from the core contract below.
  return (
    <div className="wide-page local-test-generator" data-local-test-policy={LOCAL_TEST_GENERATOR_POLICY} data-evidence-boundary={LOCAL_TEST_GENERATOR_BOUNDARY}>
      <header className="local-test-hero">
        <div>
          <span className="eyebrow"><Sparkles size={15} /> تدريب محلي من المنهج</span>
          <h1>اختبار تدريبي <em>من أسئلة الدروس</em></h1>
          <p>اختر المستوى وعدد الأسئلة؛ نجمع عينة جديدة من اختبارات الدروس المنشورة، من دون إنشاء أسئلة آليًا أو إرسال بياناتك.</p>
        </div>
        <aside className="local-test-source-note">
          <ClipboardCheck size={22} />
          <div><strong>قالب معروف المصدر</strong><span>كل سؤال مأخوذ كما هو من اختبار مصغّر مؤلَّف داخل درس منشور؛ يظهر اسم الدرس للمراجعة.</span></div>
        </aside>
      </header>

      {!test ? (
        <section className="local-test-setup" aria-labelledby="local-test-setup-title">
          <header><div><small>قبل البدء</small><h2 id="local-test-setup-title">اضبط عيّنتك</h2></div><span><ClipboardCheck size={20} /> لا مؤقّت ولا اختيار مستوى تلقائي</span></header>
          <div className="local-test-controls">
            <label htmlFor="local-test-level"><span>المستوى الذي تريد التدريب عليه</span><select id="local-test-level" value={level} onChange={(event) => setLevel(event.target.value as CEFRLevel | "")}>
              <option value="">اختر بنفسك</option>
              {LEVELS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select></label>
            <label htmlFor="local-test-count"><span>عدد الأسئلة</span><select id="local-test-count" value={itemCount} onChange={(event) => setItemCount(Number(event.target.value) as LocalTestSize)}>
              {LOCAL_TEST_SIZES.map((value) => <option key={value} value={value}>{value} أسئلة</option>)}
            </select></label>
          </div>
          <div className="local-test-boundary">
            <CircleAlert size={19} />
            <p><strong>تدريب ذاتي، لا امتحان ولا تحديد مستوى.</strong> لا تُحفظ الإجابات أو النتيجة، ولا تغيّر الإتقان أو التقدم أو خطة اليوم. لا تظهر الإجابات الصحيحة إلا بعد تثبيت إجاباتك كلها.</p>
          </div>
          {error && <p className="local-test-error" role="alert">{error}</p>}
          <button className="primary-button local-test-start" type="button" disabled={!level || loading} onClick={() => void startTest()}>
            {loading ? <><LoaderCircle size={17} className="local-test-spinner" /> تجهيز العينة المحلية…</> : <><ClipboardCheck size={17} /> ابدأ {itemCount} أسئلة من {level || "مستواك المختار"}</>}
          </button>
        </section>
      ) : (
        <section className="local-test-run" aria-labelledby="local-test-run-title">
          <header className="local-test-run-header">
            <div><Link href="/practice" className="back-link"><ArrowLeft size={15} /> مختبرات المهارة</Link><small>عينة محلية غير مؤقّتة · {test.level}</small><h2 id="local-test-run-title">اختبار تدريبي من {test.itemCount} أسئلة</h2><p>{answeredCount} من {test.itemCount} مُجاب · تثبيت الإجابات يكشف التفسير بعد المحاولة.</p></div>
            <button type="button" className="secondary-button" onClick={returnToSetup}><RotateCcw size={15} /> إعداد عينة أخرى</button>
          </header>

          <div className="local-test-question-list">
            {test.items.map((item, questionIndex) => (
              <fieldset className="local-test-question" key={item.templateId}>
                <legend>
                  <small>السؤال {questionIndex + 1} · درس المصدر</small>
                  <span className="local-test-source-title"><b lang="de" dir="ltr">{item.sourceLessonTitleDe}</b><span lang="ar" dir="rtl">{item.sourceLessonTitleAr}</span></span>
                  <strong lang="de" dir="ltr">{item.promptDe}</strong>
                  <span lang="ar" dir="rtl">{item.promptAr}</span>
                </legend>
                <div className="local-test-options">
                  {item.options.map((option, optionIndex) => {
                    const selected = answers[questionIndex] === optionIndex;
                    const correctOption = submitted && item.correctIndex === optionIndex;
                    const wrongSelection = submitted && selected && !correctOption;
                    return (
                      <label key={`${questionIndex}-${optionIndex}`} className={correctOption ? "is-correct" : wrongSelection ? "is-wrong" : selected ? "is-selected" : ""}>
                        <input type="radio" name={`local-test-question-${questionIndex}`} value={optionIndex} checked={selected} disabled={submitted} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} />
                        <span {...fragmentLanguageAttributes(option)}>{option}</span>
                        {correctOption && <small>الإجابة الصحيحة</small>}
                      </label>
                    );
                  })}
                </div>
                {submitted && <div className={answers[questionIndex] === item.correctIndex ? "local-test-feedback is-correct" : "local-test-feedback is-wrong"} role="status"><strong>{answers[questionIndex] === item.correctIndex ? "إجابة صحيحة في هذا السؤال" : "راجع الإجابة الصحيحة أعلاه"}</strong><p {...fragmentLanguageAttributes(item.explanationAr)}>{item.explanationAr}</p></div>}
              </fieldset>
            ))}
          </div>

          {!submitted ? (
            <footer className="local-test-submit-area">
              {answeredCount < test.itemCount && <p role="status">أجب عن {test.itemCount - answeredCount} أسئلة متبقية قبل كشف التفسيرات.</p>}
              <button type="button" className="primary-button" disabled={answeredCount !== test.itemCount} onClick={() => setSubmitted(true)}><Check size={17} /> ثبّت الإجابات واعرض المراجعة</button>
            </footer>
          ) : (
            <footer className="local-test-result" role="status" aria-live="polite">
              <div><small>نتيجة هذه العينة فقط · لا تُحفظ</small><strong>{correctCount} / {test.itemCount}</strong><p>هذه مراجعة لأسئلة الدروس التي اخترتها، وليست درجة CEFR أو حكمًا على إتقانك.</p></div>
              <button type="button" className="secondary-button" onClick={() => void startTest()} disabled={loading}>{loading ? "تجهيز…" : "أنشئ مجموعة أخرى"}</button>
            </footer>
          )}
        </section>
      )}
    </div>
  );
}
