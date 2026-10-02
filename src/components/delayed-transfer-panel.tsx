"use client";

import { useState } from "react";
import { CalendarClock, Recycle, TriangleAlert } from "lucide-react";
import { useLearning } from "./learning-provider";
import {
  completeDelayedTransferTask,
  DELAYED_TRANSFER_MIN_ANSWER_CHARS,
  DELAYED_TRANSFER_POLICY,
  delayedTransferAudit,
  listDelayedTransferTasks,
  scheduleDelayedTransferTask,
} from "@/core/evidence/delayed-transfer-task";

/**
 * لوحة مهامّ النقل المؤجّل على `/progress` (ADR-086).
 *
 * الجدولة مشتقّة من إنتاجٍ حقيقي موجود (كتابة/وساطة/كلام)، والإنتاج الجديد يُسجَّل **دليل نقل**:
 * لا يُحرّك الإتقان ولا يفتح مستوى. اختبار المتصفح يمشي على المسار نفسه: إنتاج مسجَّل ⇒ جدولة ⇒
 * إنتاج جديد يوم الاستحقاق ⇒ صفّ دليل نقل واحد.
 */
export function DelayedTransferPanel() {
  const { state, update } = useLearning();
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const now = new Date();
  const views = listDelayedTransferTasks(state, now);
  const audit = delayedTransferAudit(state, now);
  const pending = scheduleDelayedTransferTask(state, { now });

  function schedule() {
    const scheduled = scheduleDelayedTransferTask(state, { now });
    if (!scheduled) {
      setMessage("لا إنتاج حقيقي بعد: أنجز كتابة أو وساطة أو تحدّي كلام أولًا، ثم تُشتَقّ المهمّة منه.");
      return;
    }
    update((current) => ({ ...current, delayedTransferTasks: [...(current.delayedTransferTasks ?? []), scheduled.record] }));
    setMessage(`جُدولت مهمّة نقل من «${scheduled.candidate.sourceKind}» بعد ${audit.minDays} أيام من الإنتاج نفسه.`);
  }

  function complete(taskId: string) {
    const outcome = completeDelayedTransferTask(state, taskId, { answerText: answer[taskId] ?? "", now });
    if (!outcome.ok) {
      setMessage(outcome.reasonsAr.join(" "));
      return;
    }
    update(() => outcome.state);
    setMessage("سُجّل الإنتاج الجديد كدليل نقل: لا إتقان ولا بوابة.");
  }

  return (
    <section className="progress-card delayed-transfer-panel" data-transfer-policy={DELAYED_TRANSFER_POLICY}>
      <h2>
        <CalendarClock size={18} aria-hidden="true" /> مهامّ النقل المؤجّل
      </h2>
      <p>
        الدرس يُثبَّت بإنتاجٍ جديد بعد أيام لا بإعادة تمرين الأمس. المهمّة تُشتَقّ من إنتاجٍ حقيقي سجّلته،
        ويُسجَّل إنتاجك الجديد كـ<strong>دليل نقل</strong> يبقى في سجلّك.
      </p>
      <p data-transfer-audit={audit.total}>
        مجموع المهامّ: <strong>{audit.total}</strong> · مُجدولة <strong>{audit.scheduled}</strong> · مستحقّة{" "}
        <strong>{audit.due}</strong> · مكتملة <strong>{audit.completed}</strong> · التأجيل <strong>{audit.minDays}</strong> أيام
      </p>
      {pending ? (
        <div className="delayed-transfer-candidate">
          <span>
            مصدر المهمّة: <strong>{pending.candidate.sourceKind}</strong> · <code dir="ltr" data-bidi-scope="technical">{pending.candidate.sourceId}</code>
          </span>
          <p>{pending.candidate.promptAr}</p>
          <button type="button" className="secondary-button" onClick={schedule} data-transfer-schedule="true">
            <Recycle size={15} aria-hidden="true" /> جدِّل مهمّة نقل مؤجّلة
          </button>
        </div>
      ) : (
        <p>لا إنتاج حقيقي بلا مهمّة نقل بعد: كل إنتاج مسجَّل صارت له مهمّة.</p>
      )}
      {views.length > 0 && (
        <ul className="delayed-transfer-rows" data-transfer-completed={audit.completed}>
          {views.map((view) => (
            <li key={view.record.id} data-transfer-status={view.status}>
              <strong>{view.labelAr}</strong>
              <span dir="ltr" data-bidi-scope="technical">
                {view.record.scheduledFor.slice(0, 10)}
              </span>
              <p>{view.record.promptAr}</p>
              {view.record.status === "completed" ? (
                <small>دليل نقل محفوظ ({view.record.answerText?.length ?? 0} حرفًا) — لا إتقان ولا فتح مستوى.</small>
              ) : (
                <div className="delayed-transfer-answer">
                  <textarea
                    rows={3}
                    value={answer[view.record.id] ?? ""}
                    onChange={(event) => setAnswer((current) => ({ ...current, [view.record.id]: event.target.value }))}
                    aria-label="الإنتاج الجديد لمهمّة النقل"
                    placeholder="اكتب إنتاجك الجديد بجمل مختلفة عن نصّك الأول"
                    data-transfer-answer={view.record.id}
                  />
                  <small>الحد الأدنى {DELAYED_TRANSFER_MIN_ANSWER_CHARS} حرفًا · نسخ النصّ الأول مرفوض.</small>
                  <button type="button" className="secondary-button" onClick={() => complete(view.record.id)}>
                    <TriangleAlert size={15} aria-hidden="true" /> سجِّل الإنتاج الجديد
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
