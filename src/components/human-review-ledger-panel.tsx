"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Copy, ShieldCheck, UserCheck } from "lucide-react";
import { academicLessonList } from "@/data/academic-lessons";
import {
  HUMAN_REVIEW_CHECKLIST,
  HUMAN_REVIEW_LESSON_TOTAL,
  HUMAN_REVIEW_POLICY,
  VERDICT_LABELS_AR,
  humanReviewLedger,
  summarizeHumanReviewLedger,
  validateHumanReviewEntry,
  type HumanReviewChecklistId,
  type HumanReviewEntry,
  type HumanReviewVerdict,
} from "@/data/human-review-ledger";
import { useDeviceValue } from "./device-value";
import { useLearning } from "./learning-provider";

/**
 * سجل المراجعة البشرية (البند P0-9): المراجع يكتب اسمه وتاريخه ويفحص البنود العشرة،
 * والتطبيق يمنع حفظ سطر ناقص أو مراجعة ذاتية، ثم يعطي JSON جاهزًا للالتزام في المستودع.
 * لا يدّعي التطبيق أنه يتحقق من هوية المراجع — الشهادة على ما سُجّل لا على ما يُدّعى.
 */
/** تاريخ محلي ثابت خلال اليوم: دالة على نطاق الملف حتى لا تتغيّر القيمة مع كل رسم. */
function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * لحظة الحساب تُبنى من تاريخ الجهاز المُهيَّأ بعد الترطيب، لا من ساعة داخل مُهيِّئ رسم
 * (حارس `no-storage-in-render-init`: قراءة الزمن في أول رسم تكسر الترطيب).
 */
function reviewNow(deviceToday: string): Date {
  return deviceToday ? new Date(`${deviceToday}T12:00:00.000Z`) : new Date(0);
}

export function HumanReviewLedgerPanel() {
  const { state } = useLearning();
  const deviceToday = useDeviceValue(localToday, "");
  const [lessonId, setLessonId] = useState(academicLessonList[0]?.id ?? "a1-01");
  const [reviewer, setReviewer] = useState("");
  const [verdict, setVerdict] = useState<HumanReviewVerdict>("accept");
  const [notes, setNotes] = useState("");
  const [fixes, setFixes] = useState("");
  const [checked, setChecked] = useState<Record<HumanReviewChecklistId, boolean>>(
    () => Object.fromEntries(HUMAN_REVIEW_CHECKLIST.map((item) => [item.id, true])) as Record<HumanReviewChecklistId, boolean>,
  );
  const [drafts, setDrafts] = useState<HumanReviewEntry[]>([]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => summarizeHumanReviewLedger([...humanReviewLedger, ...drafts], reviewNow(deviceToday), state.profile?.name), [drafts, deviceToday, state.profile?.name]);
  const draft: HumanReviewEntry = {
    policyVersion: HUMAN_REVIEW_POLICY,
    lessonId,
    reviewerLabel: reviewer,
    reviewedAt: deviceToday || "1970-01-01",
    checklist: checked,
    verdict,
    fixesAr: fixes.trim() ? fixes.split("\n").map((line) => line.trim()).filter(Boolean) : undefined,
    notesAr: notes.trim() || undefined,
  };
  const validation = validateHumanReviewEntry(draft, state.profile?.name);

  function addDraft() {
    if (!validation.ok) {
      setMessage(validation.issuesAr.join(" "));
      return;
    }
    setDrafts((current) => [...current, { ...draft, reviewedAt: deviceToday }]);
    setMessage(`أُضيف سطر مراجعة للدرس ${lessonId}. انسخ JSON والتزمه ليحتسبه الفاحص.`);
    setNotes("");
    setFixes("");
  }

  async function copyJson() {
    const text = JSON.stringify(drafts, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setMessage("نُسخ JSON. الصقه داخل humanReviewLedger في src/data/human-review-ledger.ts والزمه.");
    } catch {
      setCopied(false);
      setMessage("تعذّر النسخ التلقائي؛ حدّد النص يدويًا من الصندوق.");
    }
  }

  const uncheckedCount = HUMAN_REVIEW_CHECKLIST.filter((item) => !checked[item.id]).length;

  return (
    <section className="settings-card human-review-card" id="human-review-ledger" data-human-review-ledger={HUMAN_REVIEW_POLICY}>
      <div className="settings-title"><span><UserCheck size={20} /></span><div><h2>سجل المراجعة البشرية</h2><p>المراجعة الآلية لا تكفي: من يراجع يكتب اسمه وتاريخه ويفحص البنود العشرة.</p></div></div>
      <div className="webgpu-model-status"><span className={summary.targetMetLastMonth ? "ready" : "unavailable"}>{summary.targetMetLastMonth ? <ClipboardCheck size={18} /> : <ShieldCheck size={18} />}</span><div><small>الحالة الصادقة</small><strong>{summary.reviewedLessons} من {HUMAN_REVIEW_LESSON_TOTAL} درسًا مُراجع بشريًا ({summary.coveragePct}%) · هذا الشهر {summary.lastMonthReviewed}/{summary.monthlyTarget}</strong><em>الهدف الإيقاعي 8 دروس شهريًا؛ الصفر يُعرض صفرًا ولا يُجمَّل.</em></div></div>
      <div className="webgpu-model-facts">
        <div><ClipboardCheck size={16} /><span><small>بنود الفحص</small><strong>{HUMAN_REVIEW_CHECKLIST.length} بنود</strong><em>{HUMAN_REVIEW_CHECKLIST.slice(0, 3).map((item) => item.labelAr).join(" · ")} …</em></span></div>
        <div><ShieldCheck size={16} /><span><small>حدّ السجل</small><strong>شهادة على ما سُجّل</strong><em>{summary.boundaryAr}</em></span></div>
      </div>
      <div className="human-review-form">
        <label>الدرس<select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>{academicLessonList.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.id} · {lesson.titleAr}</option>)}</select></label>
        <label>اسم المراجع<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="مثال: د. أحمد — مدرّس ألمانية" /></label>
        <label>تاريخ المراجعة<input value={deviceToday} readOnly dir="ltr" data-bidi-scope="technical" /></label>
        <label>الحكم<select value={verdict} onChange={(event) => setVerdict(event.target.value as HumanReviewVerdict)}>{(Object.keys(VERDICT_LABELS_AR) as HumanReviewVerdict[]).map((value) => <option key={value} value={value}>{VERDICT_LABELS_AR[value]}</option>)}</select></label>
        <fieldset className="human-review-checklist"><legend>بنود الفحص ({HUMAN_REVIEW_CHECKLIST.length - uncheckedCount}/{HUMAN_REVIEW_CHECKLIST.length})</legend>
          {HUMAN_REVIEW_CHECKLIST.map((item) => <label key={item.id} className="human-review-item"><input type="checkbox" checked={checked[item.id]} onChange={(event) => setChecked((current) => ({ ...current, [item.id]: event.target.checked }))} /><span><b>{item.labelAr}</b><small>{item.noteAr}</small></span></label>)}
        </fieldset>
        <label>ما تغيّر بعد المراجعة (سطر لكل تصحيح)<textarea value={fixes} onChange={(event) => setFixes(event.target.value)} rows={3} placeholder="مثال: صُحّح تفريغ nch في البطاقة 3 إلى [x]" /></label>
        <label>ملاحظات المراجع<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} /></label>
        <div className="settings-actions">
          <button type="button" className="primary-button" onClick={addDraft} disabled={!validation.ok}><ClipboardCheck size={16} /> أضف سطر المراجعة</button>
          <button type="button" className="secondary-button" onClick={() => void copyJson()} disabled={!drafts.length}><Copy size={16} /> {copied ? "نُسخ" : "انسخ JSON"}</button>
        </div>
        {!validation.ok && <div className="privacy-note warning" role="status"><ShieldCheck size={16} /><p>{validation.issuesAr.join(" ")}</p></div>}
        {message && <p className="human-review-message" role="status">{message}</p>}
        {drafts.length > 0 && <pre className="human-review-json" dir="ltr" data-bidi-scope="technical" aria-label="JSON المراجعات المضافة">{JSON.stringify(drafts, null, 2)}</pre>}
      </div>
    </section>
  );
}
