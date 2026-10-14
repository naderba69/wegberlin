import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ChevronDown, Route } from "lucide-react";
import {
  ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS,
  ILLUSTRATIVE_PATHWAYS_NOTICE_AR,
  ILLUSTRATIVE_PATHWAYS_POLICY_VERSION,
  illustrativeLearningPathways,
} from "@/core/planning/illustrative-pathways";

export function IllustrativePathways() {
  return (
    <section
      className="illustrative-pathways"
      aria-labelledby="illustrative-pathways-title"
      data-illustrative-pathways-policy={ILLUSTRATIVE_PATHWAYS_POLICY_VERSION}
      data-evidence-status={ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS}
      data-outcome-claims="none"
    >
      <header className="illustrative-pathways-heading">
        <span className="illustrative-pathways-icon" aria-hidden="true"><BookOpenCheck size={21} /></span>
        <div>
          <span className="eyebrow"><Route size={14} /> دليل تطبيقي افتراضي</span>
          <h2 id="illustrative-pathways-title">خطوات عملية لمواقف افتراضية</h2>
          <p>اختر موقفًا قريبًا من هدفك، ثم جرّب فقط المسار الذي يناسبك.</p>
        </div>
      </header>

      <p className="illustrative-pathways-disclosure" role="note">{ILLUSTRATIVE_PATHWAYS_NOTICE_AR}</p>

      <div className="illustrative-pathways-grid">
        {illustrativeLearningPathways.map((pathway) => (
          <article
            className="illustrative-pathway-card"
            key={pathway.id}
            data-illustrative-pathway={pathway.id}
            data-outcome-claim={pathway.outcomeClaim ? "present" : "none"}
            data-evidence-status={pathway.evidenceStatus}
          >
            <header>
              <span>حالة توضيحية فقط</span>
              <h3>{pathway.titleAr}</h3>
              <p>{pathway.situationAr}</p>
            </header>

            <details>
              <summary>
                <span>اعرض خطوات داخل المنصة</span>
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <ol>
                {pathway.steps.map((step, index) => (
                  <li key={`${pathway.id}-${step.href}`}>
                    <span className="illustrative-step-number" aria-hidden="true">{index + 1}</span>
                    <div>
                      <strong>{step.titleAr}</strong>
                      <p>{step.detailAr}</p>
                      <Link href={step.href}>{step.linkLabelAr}<ArrowLeft size={15} aria-hidden="true" /></Link>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="illustrative-reflection">
                <strong>سؤال للتخطيط</strong>
                <p>{pathway.reflectionPromptAr}</p>
              </div>
            </details>

            <p className="illustrative-pathway-boundary">{pathway.boundaryAr}</p>
          </article>
        ))}
      </div>

      <footer className="illustrative-pathways-footer">
        فتح هذه الأمثلة لا يحفظ اختيارًا ولا يغيّر التقدم؛ الروابط تفتح أدوات المنصة الموجودة.
      </footer>
    </section>
  );
}
