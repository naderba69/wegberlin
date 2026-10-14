"use client";

import { lessonHumanReviewStatus } from "@/core/content-validation/lesson-review-status";

/** شارة تُظهر للتلميذ هل راجع إنسان هذا الدرس. مشتقّة من السجلّ، لا من نص ثابت. */
export function LessonReviewStatusNotice({ lessonId }: { lessonId: string }) {
  const status = lessonHumanReviewStatus(lessonId);
  if (status.status === "reviewed") {
    return (
      <p className="lesson-review-status reviewed" data-review-status="reviewed">
        راجعه إنسان بتاريخ {status.reviewedAt}
      </p>
    );
  }
  return (
    <p className="lesson-review-status pending" data-review-status="pending">
      لم تُراجعه مختصة بشريًا بعد. ما زال المحتوى قيد التدقيق، ولا يُعدّ معيارًا نهائيًا.
    </p>
  );
}
