"use client";

import { CalendarClock, ShieldCheck, Sprout } from "lucide-react";
import { retentionGapSummary, RETENTION_GAP_POLICY } from "@/core/srs/retention-gaps";
import { useLearning } from "./learning-provider";

/**
 * شارة التثبيت المؤجَّل على صفحة الدرس: ترى فيها هل ثبّتت الدرس بفاصل زمني حقيقي،
 * لا بمجرد تكرار البطاقات. تُبنى من أحداث المراجعة المسجَّلة وحدها.
 */
export function LessonRetentionChip({ lessonId }: { lessonId: string }) {
  const { state } = useLearning();
  const summary = retentionGapSummary(state, lessonId);
  const icon = summary.status === "spaced-confirmed" ? <ShieldCheck size={14} /> : summary.status === "unverified-gap" ? <CalendarClock size={14} /> : <Sprout size={14} />;
  return (
    <div className="retention-chip" data-retention-gap={RETENTION_GAP_POLICY} data-retention-status={summary.status}>
      <strong>{icon} التثبيت المؤجَّل</strong>
      <p>{summary.detailAr}</p>
      {summary.nextReviewAt && <small>أقرب مراجعة مجدولة: {new Date(summary.nextReviewAt).toLocaleDateString("ar-TN")}</small>}
    </div>
  );
}
