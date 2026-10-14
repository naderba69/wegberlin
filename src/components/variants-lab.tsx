"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Globe2, MapPin, X } from "lucide-react";
import { GERMAN_VARIANTS_BOUNDARY, GERMAN_VARIANTS_POLICY, buildVariantQuiz, variantCoverage, variantEntries, type GermanicRegion } from "@/data/german-variants";

const REGION_LABELS: Record<GermanicRegion, { name: string; city: string }> = {
  AT: { name: "النمسا", city: "فيينا" },
  CH: { name: "سويسرا", city: "زيورخ" },
  DE: { name: "ألمانيا", city: "برلين" },
};

/**
 * وحدة التنوّع الألماني (P1-17): 12 فرقًا عمليًّا بين النمسا وسويسرا وألمانيا، مع الفخّ
 * العملي لكل كلمة، ثم اختبار مواقف. التدريب على **الوعي** لا على النطق اللهجي، ولا يُدّعى
 * إتقان لهجة — وهذا مكتوب في الواجهة كما في الحدّ المصدَّر.
 */
export function VariantsLab() {
  const coverage = useMemo(() => variantCoverage(), []);
  const quiz = useMemo(() => buildVariantQuiz(), []);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const graded = Object.keys(checked).length;
  const correct = Object.entries(checked).filter(([key, value]) => value && answers[key] === quiz.find((item) => `${item.entryId}:${item.region}` === key)?.correct).length;

  function answer(entryId: string, region: GermanicRegion, choice: string, right: string) {
    const key = `${entryId}:${region}`;
    setAnswers((current) => ({ ...current, [key]: choice }));
    setChecked((current) => ({ ...current, [key]: choice === right }));
  }

  return (
    <div className="wide-page variants-page" data-variants-policy={GERMAN_VARIANTS_POLICY} data-evidence-boundary={GERMAN_VARIANTS_BOUNDARY}>
      <header className="variants-hero">
        <div>
          <span className="eyebrow"><Globe2 size={15} /> وحدة تنوّع ألماني قبل B1</span>
          <h1><span lang="de" dir="ltr">Deutsch ist nicht überall gleich</span><em>نفس الشيء بثلاث كلمات: Semmel · Brötchen · Brötli</em></h1>
          <p>المعيار الذي تتعلّمه في الدروس صحيح ومفهوم في كل مكان — لكن الحياة في فيينا أو زيورخ تستعمل كلمات أخرى. تعرفها لتفهم ولا تُفاجأ، لا لتتكلّم لهجة.</p>
        </div>
        <aside>
          <div><small>الفروق المؤلَّفة</small><strong>{coverage.entries}</strong><em>{coverage.at} نمساوية · {coverage.ch} سويسرية · {coverage.de} ألمانية</em></div>
          <div><small>فخّ عملي موثَّق</small><strong>{coverage.withHazard}</strong><em>ما لا يُفهم في الجهة الأخرى مذكور صراحةً</em></div>
          <div><small>حدّ الوحدة</small><strong>وعي لا إتقان</strong><em>{GERMAN_VARIANTS_BOUNDARY}</em></div>
        </aside>
      </header>

      <section className="variants-grid">
        {variantEntries.map((entry) => (
          <article key={entry.id} className="variant-card" data-variant-domain={entry.domain}>
            <header>
              <div><small>{entry.domain === "food" ? "طعام" : entry.domain === "education" ? "تعليم" : entry.domain === "transport" ? "تنقّل" : "يومي"}</small><h2 lang="de" dir="ltr">{entry.standardDe}</h2><em>{entry.meaningAr}</em></div>
              <MapPin size={16} />
            </header>
            <ul className="variant-forms">
              {entry.regional.map((item) => (
                <li key={`${entry.id}-${item.region}-${item.form}`}><span>{REGION_LABELS[item.region].name}</span><b lang="de" dir="ltr">{item.form}</b></li>
              ))}
            </ul>
            <p className="variant-usage">{entry.usageAr}</p>
            <p className="variant-hazard"><AlertTriangle size={14} /> {entry.hazardAr}</p>
          </article>
        ))}
      </section>

      <section className="variants-quiz" data-variant-quiz={GERMAN_VARIANTS_POLICY}>
        <header>
          <div><small>اختبار مواقف</small><h2>أيّ صيغة تسمعها فعلًا في هذه المدينة؟</h2><p>{graded} من {quiz.length} سؤالًا مُجاب · {correct} صحيحة. النتائج هنا لا تُحفظ كدليل إتقان: هذه وحدة وعي تنوّعي، لا قياس لهجة.</p></div>
        </header>
        <ol>
          {quiz.map((item) => {
            const key = `${item.entryId}:${item.region}`;
            const state = checked[key];
            return (
              <li key={key} className={state === undefined ? "" : state ? "ok" : "bad"}>
                <p><MapPin size={14} /> {item.promptAr}</p>
                <div className="variant-choices">
                  {item.choices.map((choice) => (
                    <button key={choice} type="button" lang="de" dir="ltr" className={answers[key] === choice ? "chosen" : ""} onClick={() => answer(item.entryId, item.region, choice, item.correct)}>{choice}</button>
                  ))}
                </div>
                {state !== undefined ? (
                  <small className="variant-verdict" role="status">{state ? <><Check size={13} /> صحيح: {item.correct}</> : <><X size={13} /> الصواب «{item.correct}» — {variantEntries.find((entry) => entry.id === item.entryId)?.usageAr}</>}</small>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="variants-footer">
        <p>{GERMAN_VARIANTS_BOUNDARY}</p>
        <p><Link href="/practice/cohesion">وحدة التماسك</Link> · <Link href="/practice">العودة إلى المختبرات</Link></p>
      </footer>
    </div>
  );
}
