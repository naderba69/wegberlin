"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  ANONYMOUS_RESPONSE_EXPORT_CONSENT_AR,
  ANONYMOUS_RESPONSE_EXPORT_LIMIT_AR,
  ANONYMOUS_RESPONSE_EXPORT_POLICY_VERSION,
  ITEM_CALIBRATION_BOUNDARY_AR,
  ITEM_CALIBRATION_POLICY_VERSION,
  buildAnonymousResponseExport,
  calibrateItems,
  parseAnonymousResponseFiles,
  type ItemCalibration,
} from "@/core/assessment/item-calibration";
import { useLearning } from "./learning-provider";

function secureRandom() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

const BAND_LABEL: Record<ItemCalibration["band"], string> = {
  "insufficient-data": "عدد الإجابات أقل من الحد",
  "review-very-easy": "للمراجعة: سهل جدًا",
  "review-very-hard": "للمراجعة: صعب جدًا",
  "no-flag": "بلا ملاحظة",
};

/** تحليل ملف إجابات مجهولة يختاره المدرّب محليًا. لا يُرفع شيء ولا يُحفظ ولا يغيّر أي سؤال. */
export function ItemCalibrationPanel() {
  const [results, setResults] = useState<ItemCalibration[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [exported, setExported] = useState<number | null>(null);
  const { state } = useLearning();

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const parsed = parseAnonymousResponseFiles(await Promise.all([...files].map((file) => file.text())));
    setErrors(parsed.errors.slice(0, 10));
    setResults(parsed.errors.length === 0 ? calibrateItems(parsed.rows) : null);
  }

  function exportOwnAnswers() {
    if (!consent) return;
    const { csv, rows } = buildAnonymousResponseExport(state.exerciseAttempts, secureRandom);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "anonymous-answers.csv";
    link.click();
    URL.revokeObjectURL(url);
    setExported(rows);
  }

  return (
    <section className="item-calibration" data-item-calibration-policy={ITEM_CALIBRATION_POLICY_VERSION} aria-labelledby="item-calibration-title">
      <header className="card-title">
        <span id="item-calibration-title"><BarChart3 size={16} /> فحص صعوبة الأسئلة من ملف مجهول</span>
      </header>
      <p>{ITEM_CALIBRATION_BOUNDARY_AR}</p>
      <p><small>الملف: عمودان فقط بالعنوان <code dir="ltr" data-bidi-scope="technical">itemId,correct</code>، والقيمة 1 للإجابة الصحيحة و0 للخاطئة.</small></p>
      <label>
        اختر ملف CSV أو عدة ملفات معًا
        <input type="file" multiple accept=".csv,text/csv" onChange={(event) => void onFiles(event.target.files)} />
      </label>
      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((error) => <li key={error}><code dir="ltr" data-bidi-scope="technical">{error}</code></li>)}
        </ul>
      )}
      <fieldset className="item-calibration-contribute" data-anonymous-export-policy={ANONYMOUS_RESPONSE_EXPORT_POLICY_VERSION}>
        <legend>مساهمة اختيارية بإجاباتك</legend>
        <label>
          <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setExported(null); }} />
          {ANONYMOUS_RESPONSE_EXPORT_CONSENT_AR}
        </label>
        <p><small>{ANONYMOUS_RESPONSE_EXPORT_LIMIT_AR}</small></p>
        <button type="button" className="secondary-button" disabled={!consent} onClick={exportOwnAnswers}>نزّل ملف إجاباتي المختصر</button>
        {exported !== null && <p role="status">نُزّل الملف: {exported} سطرًا، سطر واحد لكل سؤال.</p>}
      </fieldset>
      {results && (
        <div className="item-calibration-scroll">
        <table>
          <caption>{results.length} عنصر</caption>
          <thead><tr><th scope="col">العنصر</th><th scope="col">الإجابات</th><th scope="col">نسبة الصحيح</th><th scope="col">الملاحظة</th></tr></thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.itemId}>
                <td><code dir="ltr" data-bidi-scope="technical">{item.itemId}</code></td>
                <td>{item.responses}</td>
                <td>{item.pCorrect === null ? "—" : `${Math.round(item.pCorrect * 100)}%`}</td>
                <td>{BAND_LABEL[item.band]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}
