import { humanReviewLedger, validateHumanReviewEntry, type HumanReviewEntry } from "@/data/human-review-ledger";

/**
 * حالة المراجعة البشرية لدرس واحد، مشتقّة من سجلّ المراجعة وحده.
 * لا نص ثابت يقول «مُراجَع»: الدرس يُعدّ مُراجَعًا فقط إذا وُجد سطر صالح بحكم قبول.
 * (تدقيق 2026-10-10: السجلّ فارغ، لذلك كل الدروس «بانتظار المراجعة».)
 */
export type LessonHumanReviewStatus =
  | { status: "reviewed"; reviewedAt: string; reviewerLabel: string }
  | { status: "pending"; reasonAr: string };

export function lessonHumanReviewStatus(
  lessonId: string,
  ledger: readonly HumanReviewEntry[] = humanReviewLedger,
): LessonHumanReviewStatus {
  const entries = ledger.filter((entry) => entry.lessonId === lessonId);
  if (entries.length === 0) return { status: "pending", reasonAr: "لم تُسجَّل مراجعة بشرية لهذا الدرس بعد." };
  // آخر سطر صالح هو الحكم المعتمد؛ السطر الناقص لا يُحتسب.
  const valid = entries.filter((entry) => validateHumanReviewEntry(entry).ok);
  const accepted = valid.filter((entry) => entry.verdict === "accept" || entry.verdict === "accept-with-fixes");
  const latest = accepted.sort((a, b) => (a.reviewedAt < b.reviewedAt ? 1 : -1))[0];
  if (latest) return { status: "reviewed", reviewedAt: latest.reviewedAt, reviewerLabel: latest.reviewerLabel };
  if (valid.some((entry) => entry.verdict === "block")) {
    return { status: "pending", reasonAr: "المراجعة الأخيرة أوقفت الدرس حتى التصحيح." };
  }
  return { status: "pending", reasonAr: "سطر المراجعة المسجّل ناقص ولا يُحتسب بعد." };
}
