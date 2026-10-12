"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  ITEM_CALIBRATION_BOUNDARY_AR,
  ITEM_CALIBRATION_POLICY_VERSION,
  calibrateItems,
  parseAnonymousResponseCsv,
  type ItemCalibration,
} from "@/core/assessment/item-calibration";

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

  async function onFile(file: File | undefined) {
    if (!file) return;
    const parsed = parseAnonymousResponseCsv(await file.text());
    setErrors(parsed.errors.slice(0, 10));
    setResults(parsed.errors.length === 0 ? calibrateItems(parsed.rows) : null);
  }

  return (
    <section className="item-calibration" data-item-calibration-policy={ITEM_CALIBRATION_POLICY_VERSION} aria-labelledby="item-calibration-title">
      <header className="card-title">
        <span id="item-calibration-title"><BarChart3 size={16} /> فحص صعوبة الأسئلة من ملف مجهول</span>
      </header>
      <p>{ITEM_CALIBRATION_BOUNDARY_AR}</p>
      <p><small>الملف: عمودان فقط بالعنوان <code dir="ltr" data-bidi-scope="technical">itemId,correct</code>، والقيمة 1 للإجابة الصحيحة و0 للخاطئة.</small></p>
      <label>
        اختر ملف CSV
        <input type="file" accept=".csv,text/csv" onChange={(event) => void onFile(event.target.files?.[0])} />
      </label>
      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((error) => <li key={error}><code dir="ltr" data-bidi-scope="technical">{error}</code></li>)}
        </ul>
      )}
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
