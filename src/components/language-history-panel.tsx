"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Info, Library, ShieldCheck } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import {
  LANGUAGE_HISTORY_BOUNDARY,
  LANGUAGE_HISTORY_BOUNDARY_AR,
  LANGUAGE_HISTORY_DISPUTED_NOTE_AR,
  LANGUAGE_HISTORY_MAX_PER_SESSION,
  LANGUAGE_HISTORY_OFF_NOTE_AR,
  LANGUAGE_HISTORY_POLICY,
  assertLanguageHistoryIntegrity,
  getLanguageHistorySource,
  languageHistoryClaimStrengthLabelsAr,
  languageHistoryNotes,
  languageHistorySources,
  languageHistorySummary,
  selectLanguageHistorySession,
} from "@/core/vocabulary/language-history-enrichment";

/**
 * P2-119 — لوحة «التاريخ اللغوي: إثراء اختياري موثّق».
 *
 * تعطَّل افتراضيًّا، ولا تعرض ملاحظة واحدة قبل تفعيل صريح يحفظه المتعلّم. كل ملاحظة
 * تظهر بمرجعها المعلن ووسم قوّة الادّعاء، ولا شيء منها يدخل أي حكم أو إتقان.
 */
export function LanguageHistoryPanel() {
  const { state, update } = useLearning();
  const preferences = state.languageHistoryPreferences;
  const enabled = preferences.enabled ?? false;
  const level = state.profile?.currentLevel ?? "A1";
  const [seen, setSeen] = useState<string[]>([]);

  const summary = useMemo(() => languageHistorySummary(), []);
  const selection = useMemo(
    () => selectLanguageHistorySession({ enabled, level, alreadySeen: seen, limit: LANGUAGE_HISTORY_MAX_PER_SESSION }),
    [enabled, level, seen],
  );
  const shownNotes = selection.noteIds
    .map((noteId) => languageHistoryNotes.find((note) => note.noteId === noteId))
    .filter((note): note is (typeof languageHistoryNotes)[number] => Boolean(note));

  if (enabled) {
    // سلامة معلنة: تُفحص في كل عرض، ولو اختلّ شيء يرمي بدل أن يعرض ملاحظة بلا مرجع.
    assertLanguageHistoryIntegrity({ enabled, selection });
  }

  function toggle(next: boolean) {
    update((current) => ({
      ...current,
      languageHistoryPreferences: { policyVersion: LANGUAGE_HISTORY_POLICY, enabled: next },
    }));
    setSeen([]);
  }

  return (
    <section
      className="settings-card language-history-manager"
      data-language-history-policy={LANGUAGE_HISTORY_POLICY}
      data-language-history-boundary={LANGUAGE_HISTORY_BOUNDARY}
      data-language-history-enabled={enabled ? "true" : "false"}
      data-language-history-notes={summary.notes}
      data-language-history-visible={shownNotes.length}
    >
      <div className="settings-title">
        <span><BookOpenText size={20} /></span>
        <div>
          <h2>التاريخ اللغوي — إثراء اختياري موثّق</h2>
          <p data-language-history-honest-note>{LANGUAGE_HISTORY_BOUNDARY_AR}</p>
        </div>
      </div>

      <label data-language-history-toggle-row>
        <span style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => toggle(event.target.checked)}
            data-language-history-toggle
          />
          <span>
            أُفعّل إثراء التاريخ اللغوي ({summary.notes} ملاحظة مؤلَّفة من {summary.sources} مراجع معلنة) — وأستطيع تعطيله في أي وقت.
          </span>
        </span>
      </label>

      {!enabled && <p data-language-history-off-note>{LANGUAGE_HISTORY_OFF_NOTE_AR}</p>}

      {enabled && (
        <>
          <p data-language-history-summary>
            مستواك الحالي <b>{level}</b>: <b>{summary.byLevel.find((row) => row.level === level)?.notes ?? 0}</b> ملاحظة في مستواك · تُعرض{" "}
            <b>{LANGUAGE_HISTORY_MAX_PER_SESSION}</b> كحدّ أقصى في الجلسة · وسوم غير «موثّق»: <b>{summary.disputed}</b>.
          </p>

          <ul data-language-history-notes-list>
            {shownNotes.map((note) => {
              const source = getLanguageHistorySource(note.sourceKey);
              return (
                <li
                  key={note.noteId}
                  data-language-history-note={note.noteId}
                  data-language-history-note-level={note.level}
                  data-language-history-note-strength={note.claimStrength}
                  data-language-history-note-source={source.key}
                >
                  <b dir="auto">{note.headword}</b>{" "}
                  <span data-language-history-strength-label>{languageHistoryClaimStrengthLabelsAr[note.claimStrength]}</span>
                  <p dir="auto">{note.historyAr}</p>
                  <p data-language-history-source>
                    <Library aria-hidden="true" size={14} /> المرجع: {source.labelAr}
                    {source.url ? ` — ${source.url}` : " (مرجع مطبوع)"}
                  </p>
                </li>
              );
            })}
          </ul>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              className="secondary-button"
              data-language-history-more
              onClick={() => setSeen((current) => [...current, ...selection.noteIds])}
              disabled={!selection.truncated}
            >
              ملاحظات أخرى من مستواي
            </button>
            <button
              type="button"
              className="secondary-button"
              data-language-history-reset
              onClick={() => setSeen([])}
              disabled={seen.length === 0}
            >
              أعد العرض من البداية
            </button>
          </div>

          {selection.truncated && <p data-language-history-truncated>بقيت ملاحظات من مستواك لم تُعرض بعد — بحدٍّ أقصى {LANGUAGE_HISTORY_MAX_PER_SESSION} في الجلسة.</p>}

          <details data-language-history-sources>
            <summary>المراجع المعلنة ({summary.sources})</summary>
            <p>{LANGUAGE_HISTORY_DISPUTED_NOTE_AR}</p>
            <ul>
              {languageHistorySources.map((source) => (
                <li key={source.key} data-language-history-source-item={source.key}>
                  {source.labelAr}
                  {source.url ? ` — ${source.url}` : " (مرجع مطبوع)"}
                </li>
              ))}
            </ul>
          </details>

          <p data-language-history-no-effect>
            <ShieldCheck aria-hidden="true" size={15} /> هذا الإثراء لا يمنح درجة ولا يعدّل إتقانًا ولا يُنشئ حدث دليل؛ اختياريّته مُختبَرة (الافتراضيّ معطّل).
          </p>
        </>
      )}

      {!enabled && (
        <p data-language-history-neutral>
          <Info aria-hidden="true" size={14} /> ما دام معطّلًا لا يُقرأ شيء ولا يُحفظ شيء: مجرّد إعدادٍ في ملفّك المحلي.
        </p>
      )}
    </section>
  );
}
