"use client";

import { useMemo, useRef, useState } from "react";
import { ClipboardCopy, Copy, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import {
  EXTERNAL_PROMPT_DATA_POLICY_AR,
  EXTERNAL_PROMPT_EXTRA_MAX_CHARS,
  EXTERNAL_PROMPT_PACK_POLICY,
  guardExternalPromptText,
  containsSecretLike,
} from "@/core/ai/external-prompt-pack";
import { buildExternalPromptPack } from "@/core/ai/external-prompt-pack";

/**
 * P2-225 — لوحة «برومبتات جاهزة لمساعد خارجي مجاني».
 * لا تفتح شبكة: تعرض نصوصًا ينسخها المتعلّم بنفسه، وتفحص أي سياق يضيفه قبل النسخ.
 */
export function ExternalPromptPackPanel() {
  const { state } = useLearning();
  const [extraContext, setExtraContext] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyMode, setCopyMode] = useState<"clipboard" | "manual" | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const areas = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const level = state.profile?.currentLevel ?? "A1";
  const targetExam = state.profile?.targetExam ?? "telc-deutsch-b2";
  const currentLesson = state.currentLessonId;

  const extraIsSecret = containsSecretLike(extraContext);
  const extraGuard = guardExternalPromptText(extraContext || "x", EXTERNAL_PROMPT_EXTRA_MAX_CHARS);
  const extraTooLong = extraContext.length > EXTERNAL_PROMPT_EXTRA_MAX_CHARS;

  const cards = useMemo(
    () =>
      buildExternalPromptPack({
        level,
        targetExam,
        lessonId: currentLesson ?? undefined,
        extraContext: extraIsSecret || extraTooLong ? undefined : extraContext.trim() || undefined,
      }),
    [level, targetExam, currentLesson, extraContext, extraIsSecret, extraTooLong],
  );

  async function copy(id: string, text: string) {
    setRefusal(null);
    const guard = guardExternalPromptText(text);
    if (!guard.ok) {
      setRefusal(guard.reasonAr);
      setCopiedId(null);
      setCopyMode(null);
      return;
    }
    if (extraIsSecret) {
      setRefusal("رُفض النسخ: سياقك الإضافي يحتوي ما يشبه مفتاحًا أو سرًّا. أزل السرّ أولًا.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setCopyMode("clipboard");
    } catch {
      const area = areas.current[id];
      area?.focus();
      area?.select();
      setCopiedId(id);
      setCopyMode("manual");
    }
  }

  return (
    <section className="tutor-prompt-pack" data-prompt-pack-policy={EXTERNAL_PROMPT_PACK_POLICY}>
      <header>
        <span>
          <ClipboardCopy size={18} aria-hidden="true" />
        </span>
        <div>
          <h2>برومبتات جاهزة لمساعد خارجي مجاني</h2>
          <p>{EXTERNAL_PROMPT_DATA_POLICY_AR}</p>
        </div>
      </header>

      <p data-prompt-context="true">
        سياق النصوص الآن: مستوى <strong>{level}</strong> · امتحاني{" "}
        <strong>{targetExam === "goethe-b2" ? "Goethe-Zertifikat B2" : "telc Deutsch B2"}</strong>
        {currentLesson ? (
          <>
            {" "}
            · الدرس الحالي <code dir="ltr" data-bidi-scope="technical">{currentLesson}</code>
          </>
        ) : (
          " · لا درس مفتوح الآن"
        )}
      </p>

      <label className="prompt-extra">
        سياق إضافي من عندك (اختياري — لا يُخزَّن ولا يُرسل)
        <textarea
          rows={2}
          value={extraContext}
          maxLength={EXTERNAL_PROMPT_EXTRA_MAX_CHARS + 1}
          onChange={(event) => setExtraContext(event.target.value)}
          placeholder="مثال: أخطائي في ترتيب الفعل داخل الجملة الثانوية"
          aria-label="سياق إضافي للبرومبت"
          data-prompt-extra="true"
        />
      </label>
      {extraIsSecret && (
        <p role="status" data-prompt-extra-refusal="true">
          <ShieldAlert size={14} aria-hidden="true" /> سياقك يحتوي ما يشبه مفتاحًا أو سرًّا — لن يُدرج في أي نصّ، ولن يُسمح بالنسخ حتى تزيله.
        </p>
      )}
      {extraTooLong && !extraIsSecret && (
        <p role="status" data-prompt-extra-refusal="true">
          <ShieldAlert size={14} aria-hidden="true" /> السياق أطول من {EXTERNAL_PROMPT_EXTRA_MAX_CHARS} حرفًا ولن يُدرج.
        </p>
      )}
      {extraGuard.ok && extraContext.trim() && !extraIsSecret && (
        <p data-prompt-extra-ok="true">
          <ShieldCheck size={14} aria-hidden="true" /> السياق مقبول وسيُدرج في النصوص أدناه.
        </p>
      )}

      <div className="prompt-cards">
        {cards.map((card) => (
          <article key={card.id} data-prompt-card={card.id}>
            <h3>{card.titleAr}</h3>
            <p>{card.purposeAr}</p>
            <textarea
              ref={(node) => {
                areas.current[card.id] = node;
              }}
              readOnly
              rows={8}
              value={card.text}
              dir="rtl"
              aria-label={`نصّ البرومبت: ${card.titleAr}`}
              data-prompt-text={card.id}
            />
            <div className="prompt-card-foot">
              <small data-prompt-chars={card.charCount}>
                {card.charCount} حرفًا (السقف 1,200)
              </small>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copy(card.id, card.text)}
                data-prompt-copy={card.id}
              >
                <Copy size={14} aria-hidden="true" /> انسخ
              </button>
            </div>
          </article>
        ))}
      </div>

      {refusal && (
        <p role="status" data-prompt-refusal="true">
          <ShieldAlert size={14} aria-hidden="true" /> {refusal}
        </p>
      )}
      {copiedId && !refusal && (
        <p role="status" data-prompt-status={copyMode}>
          {copyMode === "clipboard"
            ? "نُسخ إلى الحافظة — الصقه في المساعد المجاني الذي تختاره."
            : "حُدِّد النصّ كاملًا — انسخه بـCtrl+C (المتصفح لم يمنح الحافظة)."}
        </p>
      )}
      <p className="prompt-honest-note" data-prompt-honest-note="true">
        المساعد الخارجي المجاني له شروطه وحدود حصته، وجودة ردّه ليست مضمونة، ولا يجوز اعتبار ردّه تصحيحًا رسميًا أو درجة
        امتحان. هذه نصوص تدريبية فقط.
      </p>
    </section>
  );
}
