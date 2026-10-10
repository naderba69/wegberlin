"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GitCompareArrows, Lightbulb, PenLine, Repeat2, X } from "lucide-react";
import { COHESION_BOUNDARY, COHESION_POLICY, checkCohesionRewrite, cohesionItems, summarizeCohesionCoverage, type CohesionItem } from "@/core/training/cohesion";
import { useLearning } from "./learning-provider";

const KIND_LABELS_AR: Record<CohesionItem["kind"], string> = {
  reason: "سبب",
  concession: "تنازل",
  purpose: "غرض",
  consequence: "نتيجة",
  contrast: "تقابل",
  addition: "إضافة",
  alternative: "بديل",
  temporal: "زمن",
};

/**
 * وحدة التماسك قبل B1 (P1-12): يقرأ المتعلّم الجملتين، يفهم العلاقة المنطقية، يعيد الصياغة
 * بنفسه، فيُفحص كلامه بقواعد صريحة (موضع الفعل · وجود الرابط · الفكرتان · الترقيم)، ثم يقارن
 * بنموذجين مؤلَّفين ويجيب سؤال الموازنة — فلا يُحفظ جواب واحد.
 */
export function CohesionLab() {
  const { state, update } = useLearning();
  const [itemIndex, setItemIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [seenModels, setSeenModels] = useState(false);
  const [nuanceOpen, setNuanceOpen] = useState(false);
  const item = cohesionItems[itemIndex];
  const coverage = useMemo(() => summarizeCohesionCoverage(), []);
  const attempts = state.cohesionRewriteAttempts.filter((attempt) => attempt.itemId === item.id);
  const check = useMemo(() => (draft.trim().length > 3 ? checkCohesionRewrite({ item, text: draft }) : null), [draft, item]);

  function saveAttempt() {
    if (!check) return;
    update((current) => ({
      ...current,
      cohesionRewriteAttempts: [
        ...current.cohesionRewriteAttempts,
        {
          id: `cohesion-${crypto.randomUUID()}`,
          policyVersion: COHESION_POLICY,
          itemId: item.id,
          connectorDe: item.connectorDe,
          level: item.level,
          ruleKind: item.id.startsWith("coh-entweder") || item.id.startsWith("coh-sowohl") ? "element-connector" : item.id === "coh-deshalb-lernen" || item.id === "coh-deswegen-termin" || item.id === "coh-trotzdem-regen" ? "verb-second" : "verb-final",
          text: draft.trim(),
          ok: check.ok,
          checkFlags: { connectorPresent: check.connectorPresent, verbFinal: check.verbFinal, verbSecond: check.verbSecond, bothClausesPresent: check.bothClausesPresent },
          issuesAr: check.issuesAr,
          engine: "deterministic-rule-check",
          evidenceBoundary: COHESION_BOUNDARY,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }

  function move(delta: number) {
    const next = (itemIndex + delta + cohesionItems.length) % cohesionItems.length;
    setItemIndex(next);
    setDraft("");
    setSeenModels(false);
    setNuanceOpen(false);
  }

  return (
    <div className="wide-page cohesion-page" data-cohesion-policy={COHESION_POLICY} data-evidence-boundary={COHESION_BOUNDARY}>
      <header className="cohesion-hero">
        <div>
          <span className="eyebrow"><GitCompareArrows size={15} /> وحدة تماسك مستقلة قبل B1</span>
          <h1><span lang="de" dir="ltr">Sätze verbinden</span><em>لا جمل صحيحة منفصلة، بل نصّ مترابط</em></h1>
          <p>التماسك لا يُتعلَّم بحفظ قائمة روابط: تقرأ جملتين، تحدّد العلاقة المنطقية، ثم **تعيد الصياغة بنفسك** وتقارن بنموذجين.</p>
        </div>
        <aside>
          <div><small>العناصر</small><strong>{coverage.items}</strong><em>{coverage.a2} في A2 · {coverage.b1} في B1</em></div>
          <div><small>نماذج إعادة صياغة</small><strong>{coverage.models}</strong><em>نموذجان لكل عنصر: لا جواب واحد يُحفظ</em></div>
          <div><small>محاولاتك على هذا العنصر</small><strong>{attempts.length}</strong><em>{attempts.filter((attempt) => attempt.ok).length} مطابقة للقاعدة</em></div>
        </aside>
      </header>

      <nav className="cohesion-tabs" aria-label="عناصر وحدة التماسك">
        {cohesionItems.map((entry, index) => (
          <button type="button" key={entry.id} className={index === itemIndex ? "active" : ""} aria-current={index === itemIndex ? "page" : undefined} onClick={() => { setItemIndex(index); setDraft(""); setSeenModels(false); setNuanceOpen(false); }}>
            <b lang="de" dir="ltr">{entry.connectorDe}</b><small>{entry.connectorAr} · {entry.level}</small>
          </button>
        ))}
      </nav>

      <section className="cohesion-workspace">
        <article className="cohesion-card">
          <header>
            <div><small>{item.level} · {KIND_LABELS_AR[item.kind]}</small><h2 lang="de" dir="ltr">{item.connectorDe}</h2><em>{item.connectorAr} — {item.logicAr}</em></div>
            <span>{itemIndex + 1}/{cohesionItems.length}</span>
          </header>
          <div className="cohesion-pair">
            <div><b>1</b><p lang="de" dir="ltr">{item.clauseA_de}</p><small>{item.clauseA_ar}</small></div>
            <div><b>2</b><p lang="de" dir="ltr">{item.clauseB_de}</p><small>{item.clauseB_ar}</small></div>
          </div>
          <p className="cohesion-rule"><Lightbulb size={15} /> {item.verbRuleAr}</p>

          <label className="cohesion-input">
            <span><PenLine size={15} /> أعد الصياغة في جملة واحدة بهذا الرابط</span>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} dir="ltr" lang="de" placeholder={`${item.connectorDe} …`} />
          </label>
          <div className="cohesion-actions">
            <button type="button" className="secondary-button" onClick={() => setSeenModels(true)} disabled={seenModels}><Repeat2 size={16} /> أظهر النموذجين</button>
            <button type="button" className="primary-button" onClick={saveAttempt} disabled={!check}><Check size={16} /> احفظ المحاولة</button>
          </div>

          {check ? (
            <div className={check.ok ? "cohesion-check ok" : "cohesion-check bad"} role="status" data-cohesion-check={check.ok ? "pass" : "issues"}>
              <strong>{check.ok ? "صياغتك تستوفي قواعد التركيب." : "تحتاج تعديلًا قبل الحفظ:"}</strong>
              {check.ok ? <small>الفحص يتحقّق من القاعدة (موضع الفعل · الرابط · الفكرتان · الترقيم)؛ الأسلوب والطلاقة لا يقيسهما هذا الفحص.</small> : <ul>{check.issuesAr.map((issue) => <li key={issue}><X size={13} /> {issue}</li>)}</ul>}
            </div>
          ) : null}

          {seenModels ? (
            <div className="cohesion-models" data-cohesion-models>
              <h3><Repeat2 size={15} /> نموذجان مقبولان</h3>
              <ol>{item.modelsDe.map((model) => <li key={model}><p lang="de" dir="ltr">{model}</p></li>)}</ol>
              <p className="cohesion-error"><X size={14} /> <b>الخطأ الشائع:</b> <span lang="de" dir="ltr">{item.commonErrorDe}</span> — {item.commonErrorAr}</p>
              <button type="button" className="secondary-button" onClick={() => setNuanceOpen((open) => !open)} aria-expanded={nuanceOpen}><GitCompareArrows size={15} /> {nuanceOpen ? "أخفِ سؤال الموازنة" : "سؤال الموازنة: أيّهما أدقّ ولماذا؟"}</button>
              {nuanceOpen ? <div className="cohesion-nuance" role="note"><p><b>{item.nuanceQuestionAr}</b></p><p>{item.nuanceAnswerAr}</p></div> : null}
            </div>
          ) : null}

          <footer className="cohesion-nav">
            <button type="button" className="secondary-button" onClick={() => move(-1)}>السابق</button>
            <button type="button" className="secondary-button" onClick={() => move(1)}>التالي <ArrowRight size={15} /></button>
          </footer>
        </article>

        <aside className="cohesion-side">
          <section><h3>كيف تُقيَّم إعادة الصياغة؟</h3><ul><li>الرابط الصحيح موجود بالصيغة المطلوبة.</li><li>الفعل المصرف في موضعه: بعد deshalb/trotzdem، وفي نهاية الجملة الفرعية بعد obwohl/damit/nachdem/bevor.</li><li>الفكرتان معًا، لا جملة واحدة.</li><li>ترقيم يفصل الجملتين.</li></ul><p className="boundary-line">{COHESION_BOUNDARY}</p></section>
          <section><h3>سجلّك</h3><p>{state.cohesionRewriteAttempts.length} محاولة محفوظة، {state.cohesionRewriteAttempts.filter((attempt) => attempt.ok).length} مطابقة للقاعدة.</p><p><small>لكل عنصر نموذجان، والسؤال «أيّهما أدقّ» يمنع حفظ جواب واحد.</small></p></section>
          <section><h3>مختبرات أخرى</h3><p><Link href="/practice/collocations">شبكات التراكيب</Link> · <Link href="/practice/dictation">الإملاء</Link> · <Link href="/practice/conversation-paths">مسارات الحوار</Link></p></section>
        </aside>
      </section>
    </div>
  );
}
