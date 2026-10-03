"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { loadInvalidPrimaryStateRecord } from "@/core/portability/db";
import { useLearning } from "./learning-provider";

/**
 * شريط سلامة الحالة (ADR-106 · م3). يظهر فقط حين عجز هذا الإصدار عن قراءة الحالة المخزّنة:
 * لا يعد بحلّ ولا يُلوم المتعلم، ويعطيه مخرجًا واحدًا ملموسًا — تنزيل بياناته كما هي.
 */
export function StateIntegrityNotice() {
  const { integrityNotice } = useLearning();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!integrityNotice) return null;

  async function download() {
    setBusy(true);
    setError("");
    try {
      const record = await loadInvalidPrimaryStateRecord();
      if (!record) {
        setError("لم تُعثر نسخة محفوظة للاسترجاع؛ تواصل مع صيانة التطبيق قبل إجراء أي تغيير.");
        return;
      }
      const url = URL.createObjectURL(new Blob([record], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `der-weg-state-unreadable-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("تعذّر التنزيل من هذا المتصفح؛ استخدم متصفحًا آخر قبل إجراء أي تغيير.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="state-integrity-notice" role="status" aria-label="سلامة بيانات التعلّم المحفوظة" data-state-integrity="unreadable">
      <TriangleAlert size={17} aria-hidden="true" />
      <p><strong>تعذّرت قراءة تقدّمك المحفوظ.</strong> {integrityNotice}</p>
      <div>
        <button type="button" className="secondary-button" onClick={() => void download()} disabled={busy} data-state-integrity-download="true">
          {busy ? "يُحضَّر التنزيل…" : "نزّل النسخة المحفوظة"}
        </button>
        <Link href="/settings" className="text-link">استرجاع نقطة ما قبل الاستيراد</Link>
      </div>
      {error && <small role="alert">{error}</small>}
    </aside>
  );
}
