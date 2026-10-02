"use client";

import { Bot, CheckCircle2, CircleSlash2, Gauge, ShieldCheck, TriangleAlert } from "lucide-react";
import { AI_PROVIDER_CAPABILITY_POLICY, getAIProviderCapabilityMatrix, type AIFeatureCapability, type AIProviderFeatureId } from "@/core/ai/provider-capabilities";
import type { AIProvider } from "@/types/learning";

const featureLabel: Record<AIProviderFeatureId, string> = {
  tutor: "Tutor · سؤال المرشد",
  "tutor-commands": "Befehle · أوامر المتابعة",
  "speaking-follow-up": "Sprechen · متابعة الكلام",
  "writing-ai": "Schreiben AI · كتابة عبر AI",
};
const featureStatus: Record<AIFeatureCapability, string> = {
  available: "متاح",
  limited: "محدود",
  "not-available": "غير متاح",
};
const sourceStatusLabel = {
  local: "محلي — لا تقادم حصة",
  fresh: "المصدر حديث",
  "due-soon": "إعادة التحقق قريبة",
  stale: "المصدر متقادم — محظور",
  "clock-error": "ساعة الجهاز غير صالحة — محظور",
};

export function AIProviderCapabilityMatrix({ provider, model, hasSessionCredential }: {
  provider: AIProvider;
  model: string;
  hasSessionCredential: boolean;
}) {
  const rows = getAIProviderCapabilityMatrix({ selectedProvider: provider, selectedModel: model, hasSessionCredential });
  return <section className="settings-card ai-capability-card" data-capability-policy={AI_PROVIDER_CAPABILITY_POLICY}>
    <div className="settings-title"><span><Gauge size={20} /></span><div><h2>قدرات المزودات وحدودها</h2><p>لوحة موحدة للميزة، الخصوصية، المصدر، والحصة المتاحة معلوماتيًا — دون اختلاق عداد لحظي.</p></div></div>
    <div className="ai-capability-legend">
      <span><CheckCircle2 size={14} /> متاح في المسار الحالي</span>
      <span><TriangleAlert size={14} /> محدود أو يحتاج إعدادًا</span>
      <span><CircleSlash2 size={14} /> غير موصول</span>
    </div>
    <div className="ai-capability-grid">
      {rows.map((row) => <article key={row.id} data-provider-capability={row.id} className={row.selected ? "selected" : ""}>
        <header>
          <span>{row.id === "disabled" ? <ShieldCheck size={18} /> : <Bot size={18} />}</span>
          <div><strong>{row.labelAr}</strong><code dir="ltr" data-bidi-scope="technical">{row.model}</code></div>
          {row.selected && <b>المختار</b>}
        </header>
        <div className={`ai-provider-setup ${row.setupStatus}`}><small>حالة القدرة</small><strong>{row.setupStatus === "ready" ? "جاهز ضمن الحد المعلن" : row.setupStatus === "blocked" ? "محظور حاليًا" : "يحتاج إعدادًا أو فحصًا"}</strong><p>{row.setupAr}</p></div>
        <div className="ai-feature-list" aria-label={`قدرات ${row.labelAr}`}>
          {Object.entries(row.features).map(([feature, capability]) => <div key={feature} className={capability.status}>
            <span>{capability.status === "available" ? <CheckCircle2 size={14} /> : capability.status === "limited" ? <TriangleAlert size={14} /> : <CircleSlash2 size={14} />}</span>
            <p><strong>{featureLabel[feature as AIProviderFeatureId]}</strong><small>{featureStatus[capability.status]} · {capability.detailAr}</small></p>
          </div>)}
        </div>
        <dl>
          <div><dt>الشبكة والموافقة</dt><dd>{row.networkAr} {row.consentAr}</dd></div>
          <div><dt>الخصوصية</dt><dd>{row.privacyAr}</dd></div>
          <div><dt>الحصة</dt><dd>{row.quotaAr}</dd></div>
          <div><dt>حد 0 USD</dt><dd>{row.freeBoundaryAr}</dd></div>
          <div><dt>حداثة المصدر</dt><dd><b className={`source-${row.sourceStatus}`}>{sourceStatusLabel[row.sourceStatus]}</b>{row.sourceDueAt ? ` · حتى ${row.sourceDueAt}` : ""}. {row.sourceAr}</dd></div>
          <div><dt>البديل</dt><dd>{row.fallbackAr}</dd></div>
        </dl>
      </article>)}
    </div>
    <p className="ai-live-quota-boundary"><ShieldCheck size={15} /> لا تعرض المنصة «حصة متبقية الآن» لأن المزودات لا تمنح هذا المسار قراءة موحدة موثوقة. راجع لوحة حسابك؛ 429/402 يعيدان الميزة إلى البديل المحلي دون شراء أو إرسال ثانٍ.</p>
  </section>;
}
