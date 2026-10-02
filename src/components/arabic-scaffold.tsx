"use client";

import type { ReactNode } from "react";
import type { ArabicSupportMode, CEFRLevel } from "@/types/learning";

/** Arabic stays available; German-first never means removing accessible help. */
export function ArabicScaffold({ children, level = "A1", mode = "modern-standard-arabic", onReveal }: {
  children: ReactNode;
  level?: CEFRLevel;
  mode?: ArabicSupportMode;
  onReveal?: () => void;
}) {
  const visible = (level === "A1" || level === "A2") && mode !== "minimal-arabic";
  if (visible) return <div className="arabic-scaffold" lang="ar" dir="rtl">{children}</div>;
  return <details className="arabic-scaffold" data-scaffold-policy="progressive-arabic-scaffold-v2" onToggle={(event) => { if (event.currentTarget.open) onReveal?.(); }}>
    <summary>دعم عربي عند الحاجة</summary>
    <div lang="ar" dir="rtl">{children}</div>
  </details>;
}
