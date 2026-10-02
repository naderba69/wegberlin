"use client";

import { useMemo, useState } from "react";
import { RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useLearning } from "./learning-provider";
import {
  applyLearningReset,
  canExecuteReset,
  classifyResetCoverage,
  planLearningReset,
  RESET_ACKNOWLEDGEMENT_AR,
  RESET_CONFIRMATION_WORD,
  RESET_PLAN_POLICY,
} from "@/core/state/reset-plan";

/**
 * معالج إعادة التهيئة على `/settings` (P2-24، ADR-088).
 *
 * يُظهر للمتعلّم **قبل** التنفيذ ما سيُصفَّر وما سيبقى (تغطية كاملة بالعدد)، ولا ينفّذ إلا
 * بإقرار + كلمة تأكيد مكتوبة. سجل المحاولات لا يُمحى: العدد يظهر في الواجهة قبل وبعد، والمنطق
 * نفسه يرفض أي محو عبر `assertAttemptLogPreserved`.
 */
export function ResetWizard() {
  const { state, update } = useLearning();
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");

  const coverage = useMemo(() => classifyResetCoverage(state), [state]);
  const plan = useMemo(() => planLearningReset(state), [state]);
  const attemptLog = state.exerciseAttempts.length;
  const evidenceKept = plan.preservedEvidence.filter((row) => row.size > 0).length;

  function execute() {
    const gate = canExecuteReset({ acknowledged, confirmation });
    if (!gate.allowed) {
      setMessage(gate.reasonAr);
      return;
    }
    const outcome = applyLearningReset(state);
    update(() => outcome.state);
    setAcknowledged(false);
    setConfirmation("");
    setMessage(
      `${outcome.clearedFieldCount} حقل تقدّم صُفِّر · ${outcome.preservedEvidenceFieldCount} سجل أدلة قبل=بعد · سجل المحاولات (${outcome.attemptLogCount} محاولة) محفوظ`,
    );
  }

  return (
    <section className="settings-card reset-wizard" data-reset-policy={RESET_PLAN_POLICY}>
      <div className="settings-title">
        <span>
          <RotateCcw size={20} />
        </span>
        <div>
          <small dir="ltr" data-bidi-scope="technical">
            {RESET_PLAN_POLICY}
          </small>
          <h2>إعادة تهيئة التقدّم مع الحفاظ على سجلّك</h2>
        </div>
      </div>
      <p>
        تُصفَّر حالة التقدّم المشتقّة (الدروس والمرحلة والإتقان والجدول) وتُعاد كما شُحنت، بينما تبقى أدلّتك:
        سجل المحاولات ونصوص الكتابة والوساطة والكلام والإملاء والمحادثة وأحداث المراجعة وسجل أيام الدراسة
        وملاحظات المراجع الخارجي. لا تُلمس إعداداتك ولا هوية ملفك.
      </p>
      <ul className="reset-wizard-coverage">
        <li>
          التغطية: <strong>{coverage.totalClassified}</strong> حقلًا مصنَّفًا · يُصفَّر{" "}
          <strong>{coverage.progressCleared}</strong> تقدّمًا · يبقى <strong>{coverage.evidencePreserved}</strong> سجل أدلة ·{" "}
          <strong>{coverage.settingsPreserved}</strong> إعدادًا · <strong>{coverage.identityPreserved}</strong> هوية
        </li>
        <li>
          ما لا يُصنَّف: <strong data-reset-unclassified={coverage.unclassifiedFields.length}>{coverage.unclassifiedFields.length}</strong>{" "}
          {coverage.unclassifiedFields.length > 0 ? `(${coverage.unclassifiedFields.join(", ")})` : "— لا حقول بلا سلة"}
        </li>
        <li>
          أدلة غير فارغة تبقى كما هي: <strong>{evidenceKept}</strong> سجلًا
        </li>
      </ul>
      <p className="reset-wizard-attempts" data-reset-attempt-log={attemptLog}>
        سجل المحاولات ({attemptLog} محاولة) محفوظ — لا تمحوه إعادة التهيئة.
      </p>
      <label className="reset-wizard-ack">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          data-reset-acknowledgement={acknowledged ? "true" : "false"}
        />
        <span>{RESET_ACKNOWLEDGEMENT_AR}</span>
      </label>
      <label className="reset-wizard-confirm">
        <span>
          اكتب كلمة التأكيد <code lang="ar" dir="rtl">{RESET_CONFIRMATION_WORD}</code> لتنفيذ الإجراء
        </span>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          aria-label="كلمة تأكيد إعادة التهيئة"
          data-reset-confirmation={confirmation}
        />
      </label>
      <button type="button" className="secondary-button" onClick={execute} data-reset-run="true">
        <TriangleAlert size={15} aria-hidden="true" /> نفِّذ إعادة التهيئة الآن
      </button>
      {message && (
        <p role="status" className="reset-wizard-status">
          <ShieldCheck size={15} aria-hidden="true" /> {message}
        </p>
      )}
    </section>
  );
}
