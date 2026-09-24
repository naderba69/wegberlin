"use client";

import { useState } from "react";
import { ClipboardCheck, Copy, HeartHandshake, Info, Volume2 } from "lucide-react";
import {
  NURSING_LAYER_DISCLAIMER_AR,
  NURSING_LAYER_RULES_AR,
  NURSING_LAYER_TRACK_LABEL_AR,
  NURSING_LAYER_VERSION,
} from "@/data/nursing-layer-registry";
import {
  NURSING_PRACTICE_BOUNDARY,
  evaluateNursingChoice,
  nursingReviewTsvForLesson,
  nursingUnitsForLesson,
} from "@/core/nursing/safety-practice";
import type { CEFRLevel } from "@/types/learning";

/**
 * Woven nursing layer (owner contract v152 / ADR-080): "توابل" at A1/A2 reframes level material inside a
 * care situation, "طبق ثانٍ" at B1+ adds memorisable professional words. The panel is display +
 * deterministic language feedback only: no clinical guidance, no mastery, no gate, no exam coupling.
 */
export function NursingLayerPanel({ lessonId, level, onSpeak }: { lessonId: string; level: CEFRLevel; onSpeak?: (text: string) => void }) {
  const units = nursingUnitsForLesson(lessonId);
  const [chosenIndex, setChosenIndex] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  if (!units.length) return null;

  const track = units[0].track;
  void level;
  const tsv = nursingReviewTsvForLesson(lessonId);
  const copyTsv = async () => {
    if (!tsv) return;
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return <aside className="nursing-layer-panel" data-nursing-policy={NURSING_LAYER_VERSION} data-nursing-track={track} data-nursing-disclaimer={NURSING_LAYER_DISCLAIMER_AR}>
    <header>
      <span><HeartHandshake size={20}/></span>
      <div>
        <small lang="de" dir="ltr">Pflegebezogene Sprachschicht</small>
        <h2>{track === "gewuerz" ? "توابل: لغتك في سياق الرعاية" : "طبق ثانٍ: مفردات مهنية تُحفظ وتُراجَع"}</h2>
        <p>{NURSING_LAYER_TRACK_LABEL_AR[track]}. الطبقة اختيارية وطفيلية: إخفاؤها لا ينقص مسار B2 العام شيئًا.</p>
      </div>
      <b data-nursing-rules-count={NURSING_LAYER_RULES_AR.length}><Info size={14}/> 3 قواعد</b>
    </header>
    <details className="nursing-rules">
      <summary>القواعد الثلاث الصارمة</summary>
      <ol>{NURSING_LAYER_RULES_AR.map((rule) => <li key={rule}>{rule}</li>)}</ol>
    </details>
    <div className="nursing-unit-list">
      {units.map((item) => {
        const index = chosenIndex[item.id];
        const outcome = index === undefined ? null : evaluateNursingChoice(item, index);
        return <article key={item.id} data-nursing-unit={item.id} data-nursing-cluster={item.cluster} data-nursing-disclaimer={item.disclaimerAr}>
          <header>
            <div><strong>{item.titleAr}</strong><small lang="de" dir="ltr">{item.titleDe}</small></div>
            <span data-nursing-cluster-label={item.cluster}>{item.cluster === "recognition" ? "تعرّف" : item.cluster === "confirmation" ? "تأكيد" : item.cluster === "questioning" ? "سؤال" : "توثيق"}</span>
          </header>
          <section className="nursing-situation"><small>الموقف اللغوي</small><p>{item.situationAr}</p></section>
          <section className="nursing-target">
            <small>الصياغة التي تُعاد</small>
            <p lang="de" dir="ltr">{item.targetDe}</p>
            {onSpeak && <button type="button" className="secondary-button" onClick={() => onSpeak(item.safetyTask.stimulusDe)}><Volume2 size={15}/> اسمع النموذج (صوت المتصفح التخليقي)</button>}
          </section>
          <section className="nursing-task" data-nursing-stimulus={item.safetyTask.stimulusDe}>
            <small>تدريب: البيئة تُفشل التخمين وتُنجح الفعل اللغوي</small>
            <p lang="de" dir="ltr" className="nursing-stimulus"><Volume2 size={14}/>{item.safetyTask.stimulusDe}</p>
            <p className="nursing-prompt">{item.safetyTask.promptAr}</p>
            <div className="nursing-options">
              {item.safetyTask.options.map((option, optionIndex) => {
                const isChosen = index === optionIndex;
                const verdict = isChosen ? outcome?.status : undefined;
                return <button key={option.textDe} type="button" data-nursing-option-kind={option.kind} data-nursing-verdict={verdict}
                  onClick={() => setChosenIndex((current) => ({ ...current, [item.id]: optionIndex }))}>
                  <bdi lang="de" dir="ltr">{option.textDe}</bdi>
                  {isChosen && outcome && <span data-nursing-feedback={outcome.status}>{outcome.status === "accepted" ? "مقبول: " : "مرفوض: "}{outcome.reasonAr}</span>}
                </button>;
              })}
            </div>
            {outcome && <p className="nursing-outcome" data-nursing-outcome={outcome.status}>
              {outcome.status === "accepted"
                ? "هذا فعلٌ لغوي: إعادة قول أو سؤال أو توثيق — وهو ما لا يحتاج معرفة سريرية."
                : "رفضت البيئة هذا الخيار لأن ما بُني عليه غير موجود في المادة المعروضة."}
              {" "}لا إتقان ولا دليل ولا بوابة مستوى من هذا التدريب، ولا صوت قُرئ ولا حُكم على نطقك.
            </p>}
          </section>
          {item.reviewWords.length > 0 && <section className="nursing-words" data-nursing-review-words={item.reviewWords.length}>
            <small>مفردات B1+ تُحفظ وتُراجَع</small>
            <ul>{item.reviewWords.map((word) => <li key={word.de}><bdi lang="de" dir="ltr">{word.de}</bdi><span>{word.ar}</span><small lang="de" dir="ltr">{word.exampleDe}</small></li>)}</ul>
          </section>}
          <footer data-nursing-unit-disclaimer="true"><ClipboardCheck size={14}/>{item.disclaimerAr} — والمراجعة المهنية معلّقة (0 مراجعات) ولا يمنح هذا التدريب إتقانًا.</footer>
        </article>;
      })}
    </div>
    {tsv && <div className="nursing-tsv">
      <button type="button" className="secondary-button" onClick={() => void copyTsv()}><Copy size={15}/> {copied ? "نُسخ TSV" : "انسخ مفردات الطبقة (TSV)"}</button>
      <p>الصيغة نفسها التي يقبلها «استيراد مفردات شخصية» في الإعدادات (German → Arabic → Example → Tags)؛ الطبقة لا تكتب في التخزين بنفسها.</p>
    </div>}
    <footer className="nursing-boundary">{NURSING_PRACTICE_BOUNDARY}</footer>
  </aside>;
}
