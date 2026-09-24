"use client";

import { useEffect, useState } from "react";
import { Accessibility, Check, Contrast, RotateCcw, Type } from "lucide-react";
import { ACCESSIBILITY_PREFERENCES_POLICY, accessibilityPreferencesAreDefault, DEFAULT_ACCESSIBILITY_PREFERENCES } from "@/core/accessibility/preferences";
import type { AccessibilityPreferences } from "@/types/learning";
import { useLearning } from "./learning-provider";

export function AccessibilityPreferencesControl() {
  const { state, update } = useLearning();
  const preferences = state.accessibilityPreferences;
  const [message, setMessage] = useState("");
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystemReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function change(patch: Partial<Pick<AccessibilityPreferences, "fontScale" | "highContrast" | "reducedMotion">>, announcement: string) {
    update((current) => ({
      ...current,
      accessibilityPreferences: { ...current.accessibilityPreferences, ...patch },
    }));
    setMessage(announcement);
  }

  function reset() {
    update((current) => ({ ...current, accessibilityPreferences: DEFAULT_ACCESSIBILITY_PREFERENCES }));
    setMessage("أُعيدت تفضيلات العرض إلى الوضع الافتراضي وحُفظ التغيير محليًا.");
  }

  const effectiveReducedMotion = preferences.reducedMotion || systemReducedMotion;

  return <section className="settings-card accessibility-preferences-card" data-accessibility-policy={ACCESSIBILITY_PREFERENCES_POLICY}>
    <div className="settings-title">
      <span><Accessibility size={20} /></span>
      <div>
        <h2>تفضيلات الوصول والعرض</h2>
        <p>معاينة فورية، حفظ محلي داخل ملفك، وتطبيق على جميع الصفحات.</p>
      </div>
    </div>

    <fieldset className="accessibility-font-choice">
      <legend><Type size={15} /> حجم النص</legend>
      <div>
        <button
          type="button"
          aria-pressed={preferences.fontScale === "compact"}
          className={preferences.fontScale === "compact" ? "active" : ""}
          onClick={() => change({ fontScale: "compact" }, "تم تطبيق الحجم الأصغر وحفظه محليًا.")}
        >
          <span className="compact" aria-hidden="true">Aa</span>
          <b>أصغر</b>
          <small>لمن يفضّل كثافة أعلى مع بقاء النص مقروءًا</small>
        </button>
        <button
          type="button"
          aria-pressed={preferences.fontScale === "default"}
          className={preferences.fontScale === "default" ? "active" : ""}
          onClick={() => change({ fontScale: "default" }, "تم تطبيق الحجم المريح وحفظه محليًا.")}
        >
          <span aria-hidden="true">Aa</span>
          <b>مريح</b>
          <small>الخيار الافتراضي الجديد للقراءة اليومية</small>
        </button>
        <button
          type="button"
          aria-pressed={preferences.fontScale === "large"}
          className={preferences.fontScale === "large" ? "active" : ""}
          onClick={() => change({ fontScale: "large" }, "تم تطبيق الحجم الأكبر وحفظه محليًا.")}
        >
          <span className="large" aria-hidden="true">Aa</span>
          <b>أكبر</b>
          <small>قراءة أوسع مع إعادة التفاف المحتوى</small>
        </button>
      </div>
    </fieldset>

    <div className="accessibility-toggle-list">
      <label>
        <input
          type="checkbox"
          checked={preferences.highContrast}
          onChange={(event) => change({ highContrast: event.target.checked }, event.target.checked ? "تم تشغيل التباين العالي وحفظه محليًا." : "تم إيقاف التباين العالي وحفظ التغيير محليًا.")}
        />
        <span><Contrast size={17} /><b>تباين أعلى</b><small>خلفيات أوضح، حدود أغمق، وظل أقل.</small></span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferences.reducedMotion}
          onChange={(event) => change({ reducedMotion: event.target.checked }, event.target.checked ? "تم تقليل الحركة وحفظ التفضيل محليًا." : "أُوقف اختيار تقليل الحركة؛ يبقى إعداد الجهاز محترمًا إن كان مفعّلًا.")}
        />
        <span><Accessibility size={17} /><b>حركة مخفضة</b><small>يلغي الانتقالات والحركات غير الضرورية.</small></span>
      </label>
    </div>

    <div className="accessibility-preview" data-accessibility-preview data-motion={effectiveReducedMotion ? "reduced" : "full"} aria-label="معاينة تفضيلات العرض المباشرة">
      <span className="accessibility-preview-orb" aria-hidden="true"><Check size={16} /></span>
      <div>
        <small>Live-Vorschau · معاينة مباشرة</small>
        <strong lang="de" dir="ltr">Heute lerne ich Schritt für Schritt.</strong>
        <p>اليوم أتعلم خطوة بخطوة. تغييرات الحجم والتباين والحركة تظهر هنا وفي الصفحة فورًا.</p>
      </div>
      <i aria-hidden="true" />
    </div>

    <footer className="accessibility-preferences-footer">
      <p>
        {systemReducedMotion
          ? "إعداد جهازك يطلب حركة مخفضة، لذلك نحترمه حتى إذا بقي المفتاح المحلي متوقفًا."
          : "إذا طلب نظام التشغيل حركة مخفضة فسنحترمه تلقائيًا أيضًا."}
      </p>
      <button type="button" className="secondary-button" disabled={accessibilityPreferencesAreDefault(preferences)} onClick={reset}>
        <RotateCcw size={15} /> إعادة الضبط
      </button>
    </footer>
    <p className="accessibility-preferences-status" role="status" aria-live="polite" aria-atomic="true">{message}</p>
  </section>;
}
