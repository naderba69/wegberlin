"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import {
  TELC_CRITERIA,
  TELC_CRITERIA_NOTES_AR,
  TELC_LEVELS,
  isTelcSelectionComplete,
  type TelcCriterionId,
  type TelcCriteriaSelfAssessment,
  type TelcLevel,
} from "@/core/writing/telc-criteria";

type Props = {
  saved?: TelcCriteriaSelfAssessment;
  onSave: (assessment: TelcCriteriaSelfAssessment) => void;
};

/** تقييم ذاتي بمعايير telc على النسخة المفحوصة. لا مجموع ولا درجة ولا نسبة نجاح. */
export function TelcCriteriaSelfAssessmentPanel({ saved, onSave }: Props) {
  const [choices, setChoices] = useState<Partial<Record<TelcCriterionId, TelcLevel>>>(() => (saved ? { ...saved.levels } : {}));
  const complete = isTelcSelectionComplete(choices);

  function choose(id: TelcCriterionId, level: TelcLevel) {
    setChoices((current) => ({ ...current, [id]: level }));
  }

  function save() {
    if (!isTelcSelectionComplete(choices)) return;
    onSave({ policyVersion: "telc-criteria-self-assessment-v1", assessedAt: new Date().toISOString(), levels: choices });
  }

  return (
    <section className="telc-self-assessment" aria-labelledby="telc-self-assessment-title">
      <header className="card-title">
        <span id="telc-self-assessment-title"><ClipboardCheck size={16} /> تقييم ذاتي بمعايير telc</span>
        <small lang="de" dir="ltr">Selbsteinschätzung</small>
      </header>
      <p className="telc-self-assessment-intro">
        اختر لكل معيار المستوى الأقرب إلى نصّك. هذا تقدير شخصي للتدريب فقط، ولا يُجمع في درجة امتحان ولا يتنبأ بنتيجة. الحكم النهائي للمراجع البشري.
      </p>
      <ul className="telc-criteria-notes">
        {TELC_CRITERIA_NOTES_AR.map((note) => <li key={note}>{note}</li>)}
      </ul>
      <div className="telc-criteria-list">
        {TELC_CRITERIA.map((criterion) => (
          <fieldset key={criterion.id} className="telc-criterion">
            <legend>
              <strong>{criterion.nameAr}</strong> <small lang="de" dir="ltr">{criterion.nameDe}</small>
            </legend>
            <p>{criterion.questionAr}</p>
            <div className="telc-level-options" role="radiogroup" aria-label={criterion.nameAr}>
              {TELC_LEVELS.map((level) => (
                <label key={level} className={choices[criterion.id] === level ? "selected" : ""}>
                  <input
                    type="radio"
                    name={`telc-${criterion.id}`}
                    value={level}
                    checked={choices[criterion.id] === level}
                    onChange={() => choose(criterion.id, level)}
                  />
                  <span><strong>{level}</strong> — {criterion.levels[level]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <footer>
        <button className="primary-button" type="button" disabled={!complete} onClick={save}>
          احفظ تقييمي الذاتي لهذه النسخة
        </button>
        {saved && <small role="status">محفوظ على هذه النسخة فقط، ولم يُرسل إلى أي خدمة.</small>}
      </footer>
    </section>
  );
}
