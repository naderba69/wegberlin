"use client";

import { useState } from "react";
import { Check, Clipboard, TriangleAlert, Users } from "lucide-react";
import {
  buildExternalEvaluatorPacket,
  EXTERNAL_EVALUATOR_PACKET_POLICY,
  readExternalEvaluatorNotes,
  renderExternalEvaluatorPacketText,
} from "@/core/assessment/external-evaluator-packet";
import { useLearning } from "./learning-provider";
import type { ExternalEvaluatorEvidence } from "@/types/learning";

/**
 * Hands a writing submission to the human the learner arranged, and stores what
 * that human says as their own statement. The panel never shows a score, never
 * says the app reviewed the text, and never lets this evidence move a level gate:
 * an outside opinion is useful precisely because it stays outside the app's claims.
 */
export function ExternalEvaluatorBridge({
  sourceText,
  submissionId,
  taskId,
  level,
}: {
  sourceText: string;
  submissionId: string;
  taskId: string;
  level: "A1" | "A2" | "B1" | "B2";
}) {
  const { state, update } = useLearning();
  const [criteriaText, setCriteriaText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [reviewerLabel, setReviewerLabel] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const packet = buildExternalEvaluatorPacket({
    level,
    examFormat: "none",
    task: {
      id: taskId,
      titleAr: "مراجعة كتابة خارجية",
      skill: "schreiben",
      inputSummaryAr: "نصّي كما كتبته، مع معايير المهمة.",
      criteria: criteriaText.split("\n").map((line) => line.trim()).filter(Boolean),
    },
    learnerText: sourceText,
  });
  const rows = (state.externalEvaluatorNotes ?? []).filter((row) => row.submissionId === submissionId);

  function copyPacket() {
    void navigator.clipboard
      .writeText(renderExternalEvaluatorPacketText(packet))
      .then(() => {
        setCopied(true);
        setMessage("نُسخت الحزمة إلى الحافظة. أرسلها لمن تختاره، ثم الصق رده هنا.");
      })
      .catch(() => setMessage("تعذّر النسخ من المتصفح؛ حدّق النص وانسخه يدويًا."));
  }

  function accept() {
    const parsed = readExternalEvaluatorNotes({ raw: replyText, learnerText: sourceText, reviewerLabel });
    if (!parsed.reply) {
      setMessage(parsed.errorAr ?? "لم يُقبل شيء.");
      return;
    }
    const row: ExternalEvaluatorEvidence = {
      id: `external-evaluator:${submissionId}:${Date.now()}`,
      policyVersion: EXTERNAL_EVALUATOR_PACKET_POLICY,
      submissionId,
      taskId,
      level,
      reviewerLabel: parsed.reply.reviewerLabel,
      receivedAt: parsed.reply.receivedAt,
      notes: parsed.reply.notes.map((note) => ({ ...note })),
      unconfirmableExcerpts: [...parsed.reply.unconfirmableExcerpts],
      refusedPhrases: [...parsed.reply.refusedPhrases],
      boundary: { ...parsed.reply.boundary },
      createdAt: new Date().toISOString(),
    };
    update((current) => ({ ...current, externalEvaluatorNotes: [...(current.externalEvaluatorNotes ?? []), row] }));
    setReplyText("");
    setMessage(
      parsed.reply.refusedPhrases.length > 0
        ? "حُفظت الملاحظات كمصدر خارجي، مع رفض أي عبارة درجة أو نتيجة أو شهادة."
        : "حُفظت الملاحظات كمصدر خارجي. لا تُحتسب على بوابة المستوى ولا تُثبِت الجاهزية للامتحان.",
    );
  }

  function remove(id: string) {
    update((current) => ({
      ...current,
      externalEvaluatorNotes: (current.externalEvaluatorNotes ?? []).filter((row) => row.id !== id),
    }));
    setMessage("حُذفت الملاحظة المستوردة من هذا الجهاز.");
  }

  return (
    <section className="external-evaluator-bridge" data-external-evaluator-policy={EXTERNAL_EVALUATOR_PACKET_POLICY}>
      <header>
        <span>
          <Users size={18} aria-hidden="true" />
        </span>
        <div>
          <small dir="ltr" data-bidi-scope="technical">
            external-evaluator-packet-v1
          </small>
          <h4>مراجعة إنسان خارجي تختاره أنت</h4>
        </div>
      </header>
      <p>
        التطبيق لا يمنح درجة كتابة ولا يقرّر الجاهزية للامتحان. جهّز نصّك هنا لمن يراجعه خارجيًا، واحفظ رده كرأي موثوق
        المصدر لا كحكم من التطبيق.
      </p>
      <label>
        <span>معايير المهمة كما في ورقة الامتحان (سطر لكل معيار، وإن لم تُدخِل شيئًا فلا معايير)</span>
        <textarea
          value={criteriaText}
          onChange={(event) => setCriteriaText(event.target.value)}
          rows={3}
          placeholder="Aufgabe erfüllen&#10;Kohärenz&#10;Wortschatz"
          aria-label="معايير المهمة للمراجع الخارجي"
        />
      </label>
      <pre dir="ltr" data-bidi-scope="technical" lang="de" className="external-evaluator-packet">
        {renderExternalEvaluatorPacketText(packet)}
      </pre>
      <button type="button" className="secondary-button" onClick={copyPacket}>
        {copied ? <Check size={15} aria-hidden="true" /> : <Clipboard size={15} aria-hidden="true" />} انسخ الحزمة للإرسال
      </button>
      <div className="external-evaluator-import">
        <label>
          <span>اسم المراجع أو صفته (يُحفظ كما كتبته)</span>
          <input value={reviewerLabel} onChange={(event) => setReviewerLabel(event.target.value)} maxLength={80} />
        </label>
        <label>
          <span>الصق رده (سطر لكل ملاحظة)</span>
          <textarea rows={4} value={replyText} onChange={(event) => setReplyText(event.target.value)} />
        </label>
        <button type="button" onClick={accept} disabled={!replyText.trim()}>
          <TriangleAlert size={15} aria-hidden="true" /> احفظ الرد كرأي خارجي
        </button>
      </div>
      {rows.length > 0 && (
        <ul className="external-evaluator-rows">
          {rows.map((row) => (
            <li key={row.id}>
              <strong>{row.reviewerLabel}</strong>
              <span dir="ltr" data-bidi-scope="technical">
                {row.receivedAt}
              </span>
              <ul>
                {row.notes.map((note, index) => (
                  <li key={`${row.id}-${index}`}>
                    {note.excerpt ? (
                      <>
                        <code dir="ltr" data-bidi-scope="technical" lang="de">
                          {note.excerpt}
                        </code>{" "}
                      </>
                    ) : null}
                    {note.comment}
                  </li>
                ))}
              </ul>
              {row.unconfirmableExcerpts.length > 0 && (
                <small>اقتباسات لا يجدها التطبيق في نصّك: {row.unconfirmableExcerpts.length} — حُفظت مع هذا الوسم، لا حُذفت.</small>
              )}
              {row.refusedPhrases.length > 0 && <small>عبارات درجة أو نتيجة مرفوضة: {row.refusedPhrases.length}</small>}
              <small>{row.boundary.officialResultClaimedAr}</small>
              <button type="button" className="ghost" onClick={() => remove(row.id)}>
                حذف من هذا الجهاز
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
