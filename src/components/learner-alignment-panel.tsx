"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MapPin, ShieldAlert, Trash2 } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import {
  ALIGNMENT_CLAIM_BOUNDARY,
  ALIGNMENT_HONEST_NOTE_AR,
  ALIGNMENT_INDEX_HINT_MAX_CHARS,
  ALIGNMENT_MAP_POLICY,
  ALIGNMENT_OWNERSHIP_STATEMENT_AR,
  ALIGNMENT_PASTED_INDEX_MAX_CHARS,
  ALIGNMENT_SOURCE_LABEL_MAX_CHARS,
  alignmentContactReferences,
  alignmentCoverageByLevel,
  alignmentSummary,
  buildLearnerAlignmentMap,
  containsReproductionLikeText,
  listPastedIndexLines,
  mergeLearnerAlignmentMaps,
  removeAlignmentEntries,
  sanitizeAlignmentMapForStorage,
  updateAlignmentEntry,
} from "@/core/alignment/learner-alignment-map";

/**
 * P2-93 — لوحة «خريطة المواءمة الخاصة».
 *
 * القاعدة التي تحكم هذه اللوحة: الفهرس **يملكه المتعلّم**، يلصقه هو، ويُقابِل
 * **دروسنا** بمواضع فهرسه. لا ننشر فهرسًا جاهزًا، ولا نحتفظ بنصّ فهرسه، ولا ندّعي
 * أن المواءمة روجعت أو اعتمدت. إن ظهر في السياق ما يشير إلى نقل نصّ المصدر رُفض
 * الطلب برسالة صريحة، ولو كان الإقرار مؤشَّرًا.
 */
export function LearnerAlignmentPanel() {
  const { state, update } = useLearning();
  const map = state.learnerAlignmentMap ?? null;

  const [sourceLabel, setSourceLabel] = useState(map?.sourceLabel ?? "");
  const [pastedIndex, setPastedIndex] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const [lessonId, setLessonId] = useState(alignmentContactReferences[0]?.lessonId ?? "");
  const [indexHint, setIndexHint] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  const lines = useMemo(() => listPastedIndexLines(pastedIndex), [pastedIndex]);
  const reproductionLike =
    containsReproductionLikeText(pastedIndex) || containsReproductionLikeText(sourceLabel);
  const summary = alignmentSummary(map);
  const coverage = alignmentCoverageByLevel(map);
  const mappedLessons = new Set((map?.entries ?? []).map((entry) => entry.lessonId));

  function build() {
    const now = new Date().toISOString();
    const result = buildLearnerAlignmentMap({
      acknowledge,
      draft: {
        sourceLabel,
        pastedIndex,
        ownershipAcknowledged: acknowledge,
        entries: [{ lessonId, indexHint }],
        createdAt: map?.createdAt ?? now,
        updatedAt: now,
      },
    });
    if (!result.ok) {
      setRefusal(result.messageAr);
      setStatus(null);
      return;
    }
    const storedLength = result.map.pastedIndex.length;
    const next = sanitizeAlignmentMapForStorage(
      map ? mergeLearnerAlignmentMaps(map, result.map) ?? result.map : result.map,
    );
    update((current) => ({ ...current, learnerAlignmentMap: next }));
    setRefusal(null);
    setStatus(
      `حُفظت الخريطة: ${next.entries.length} موضعًا مقابلًا · الفهرس الملصوق (${storedLength.toLocaleString("en-US")} حرفًا) لم يُحفظ ولن يُحفظ.`,
    );
    setPastedIndex("");
  }

  function saveHint() {
    if (!map) {
      setRefusal("لا خريطة بعد: ابنِ الخريطة أولًا (إقرار الملكية + سطر من فهرسك).");
      setStatus(null);
      return;
    }
    const next = updateAlignmentEntry(map, lessonId, indexHint);
    update((current) => ({ ...current, learnerAlignmentMap: next }));
    setRefusal(null);
    setStatus(indexHint.trim() ? "حُدِّث موضع واحد في الخريطة." : "أُزيل موضع هذا الدرس من الخريطة.");
    setIndexHint("");
  }

  function removeOne(id: string) {
    if (!map) return;
    update((current) => ({
      ...current,
      learnerAlignmentMap: removeAlignmentEntries(map, [id]),
    }));
    setStatus("أُزيل درس واحد من الخريطة.");
  }

  function clearAll() {
    if (!map) return;
    if (!window.confirm("حذف خريطة المواءمة الخاصة كاملة؟ لا تُحذف أي أدلّة أخرى.")) return;
    update((current) => ({ ...current, learnerAlignmentMap: null }));
    setStatus("حُذفت خريطة المواءمة كاملة. أدلّتك الأخرى لم تُمسّ.");
  }

  return (
    <section
      className="settings-card learner-alignment-manager"
      data-alignment-policy={ALIGNMENT_MAP_POLICY}
      data-alignment-claim-boundary={ALIGNMENT_CLAIM_BOUNDARY}
    >
      <div className="settings-title">
        <span><MapPin size={20} /></span>
        <div>
          <h2>خريطة المواءمة (فهرس تملكه أنت)</h2>
          <p data-alignment-honest-note>{ALIGNMENT_HONEST_NOTE_AR}</p>
        </div>
      </div>

      <label>
        <span>تسمية فهرسك (حرة تمامًا)</span>
        <input
          type="text"
          value={sourceLabel}
          maxLength={ALIGNMENT_SOURCE_LABEL_MAX_CHARS}
          dir="auto"
          onChange={(event) => setSourceLabel(event.target.value)}
          data-alignment-source-label
        />
      </label>

      <label>
        <span>فهرسك: سطر لكل وحدة أو صفحة (لا نصّ للمصدر)</span>
        <textarea
          rows={5}
          dir="auto"
          value={pastedIndex}
          maxLength={ALIGNMENT_PASTED_INDEX_MAX_CHARS}
          onChange={(event) => setPastedIndex(event.target.value)}
          placeholder={"مثال:\nالوحدة 3 — ص 42\nالوحدة 4 — ص 55"}
          data-alignment-pasted-index
        />
      </label>

      <p data-alignment-pasted-lines>
        سطور فهرسك المقروءة الآن: {lines.length} — تُقرأ في متصفحك فقط ولا تُرسل إلى أي جهة.
      </p>

      {reproductionLike && (
        <p data-alignment-reproduction-refusal>
          <ShieldAlert aria-hidden="true" size={16} /> السياق يشير إلى نقل نصّ المصدر أو استخراجه؛ هذا مرفوض في هذا البند: رقم الصفحة أو اسم الوحدة فقط.
        </p>
      )}

      <label data-alignment-acknowledgement-row>
        <span style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={acknowledge}
            onChange={(event) => setAcknowledge(event.target.checked)}
            data-alignment-acknowledge
          />
          <span>{ALIGNMENT_OWNERSHIP_STATEMENT_AR}</span>
        </span>
      </label>

      <label>
        <span>درس التطبيق</span>
        <select value={lessonId} onChange={(event) => setLessonId(event.target.value)} data-alignment-lesson>
          {alignmentContactReferences.map((reference) => (
            <option key={reference.lessonId} value={reference.lessonId}>
              {reference.level} · {reference.titleAr}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>موضعك منه في فهرسك (تكتبه أنت)</span>
        <input
          type="text"
          value={indexHint}
          maxLength={ALIGNMENT_INDEX_HINT_MAX_CHARS}
          dir="auto"
          onChange={(event) => setIndexHint(event.target.value)}
          placeholder="مثال: ص 42، الوحدة 3"
          data-alignment-index-hint
        />
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="primary-button" onClick={build} data-alignment-build>
          <CheckCircle2 aria-hidden="true" size={16} /> ابنِ الخريطة
        </button>
        <button type="button" className="secondary-button" onClick={saveHint} data-alignment-save-entry disabled={!map}>
          احفظ موضع هذا الدرس
        </button>
        <button type="button" className="secondary-button" onClick={clearAll} data-alignment-clear disabled={!map}>
          <Trash2 aria-hidden="true" size={16} /> احذف الخريطة كاملة
        </button>
      </div>

      {refusal && <p role="status" data-alignment-refusal>{refusal}</p>}
      {status && <p role="status" data-alignment-status>{status}</p>}

      {map && (
        <div data-alignment-summary>
          <h3>خريطتك</h3>
          <p>
            فهرسك: <b>{map.sourceLabel}</b> · مواضع كتبتها بيدك: <b>{summary.mappedLessonCount}</b> من{" "}
            <b>{summary.contactLessonCount}</b> درسًا · مستويات فيها مواضع: <b>{summary.mappingLevelCount}</b>
          </p>
          <ul data-alignment-coverage>
            {coverage.map((row) => (
              <li key={row.level} data-alignment-coverage-row>
                {row.level}: <b>{row.mappedCount}</b>/{row.totalCount}
              </li>
            ))}
          </ul>
          <div className="content-note-list">
            {map.entries.map((entry) => (
              <article
                key={entry.lessonId}
                data-alignment-row
                data-alignment-row-level={entry.level}
                data-alignment-row-hint={entry.indexHint}
              >
                <span>{entry.level}</span>
                <div>
                  <b>{entry.lessonId}</b>
                  <p dir="auto">موضعك من فهرستك: {entry.indexHint}</p>
                </div>
                <button type="button" className="secondary-button" onClick={() => removeOne(entry.lessonId)} data-alignment-row-remove>
                  إزالة
                </button>
              </article>
            ))}
          </div>
          <p data-alignment-storage-note>
            الفهرس الخام الملصوق محفوظ الآن: <b>{summary.pastedIndexStored ? "نعم" : "لا"}</b> — والقيمة المطلوبة «لا».
          </p>
        </div>
      )}

      {map && (
        <details data-alignment-unmapped-note>
          <summary>دروس بلا موضع عندك بعد: {summary.unmappedLessonCount}</summary>
          <p>
            هذه عدّادات من دروسنا نحوك، لا ادّعاء تغطية لكتابك: لا نعرف كتابك ولا نقيس عليه.{" "}
            {alignmentContactReferences.filter((reference) => !mappedLessons.has(reference.lessonId)).length} درسًا بلا موضع في هذا العرض.
          </p>
        </details>
      )}
    </section>
  );
}
