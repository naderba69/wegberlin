import type { ReviewEvent } from "@/types/learning";

/**
 * معايرة التقدير الذاتي في المراجعة (البند P1-13 من تدقيق الطريقة).
 *
 * المشكلة المقيسة: أزرار الدرجات كانت كلمات مجرّدة («نسيت · بصعوبة · جيد · سهل») بلا وصف
 * سلوكي، فيصير التقدير مزاجًا لا قياسًا، وتتلوّث به جداول SM-2 وبوابة التثبيت. الحل: وصف
 * سلوكي ملازم لكل درجة + مثال + تحذير ممّا لا يجوز استنتاجه من التقدير الذاتي.
 */
export const REVIEW_GRADE_POLICY = "calibrated-self-rating-v1" as const;
export const REVIEW_GRADE_BOUNDARY = "self-rating-calibrates-scheduling-only-it-is-not-an-assessment-score" as const;

export type ReviewGradeValue = 1 | 3 | 4 | 5;

export type ReviewGradeDescriptor = {
  labelAr: string;
  behaviourAr: string;
  exampleAr: string;
  avoidAr: string;
};

export const REVIEW_GRADE_DESCRIPTORS: Record<ReviewGradeValue, ReviewGradeDescriptor> = {
  1: {
    labelAr: "نسيت",
    behaviourAr: "لم تسترجع البطاقة حتى بعد التفكير",
    exampleAr: "مثال: رأيت كلمة Termin ولم تتذكّر معناها ولا جملتها.",
    avoidAr: "لا تخترها إذا كنت تعرف المعنى بمجرد النظر إلى الخيار — هذا تعرّف لا استرجاع.",
  },
  3: {
    labelAr: "بصعوبة",
    behaviourAr: "استرجعت الجواب بعد جهد أو بعد مساعدة صغيرة",
    exampleAr: "مثال: تذكّرت الصيغة بعد أن راجعت القاعدة في ذهنك أو تلمحت من أول حرف.",
    avoidAr: "لا تحتسب الصعوبة فشلًا: الدرجة 3 سليمة ودليلها أقل تأكيدًا فقط.",
  },
  4: {
    labelAr: "جيد",
    behaviourAr: "استرجعت الجواب مباشرة وبثقة معقولة",
    exampleAr: "مثال: قلت «die Entscheidung treffen» فور رؤية البطاقة.",
    avoidAr: "لا تخترها إن كنت ترجمت من العربية كلمة كلمة؛ هذا اشتقاق لا استرجاع.",
  },
  5: {
    labelAr: "سهل",
    behaviourAr: "الجواب حاضر تلقائيًا وبلا تفكير ملحوظ",
    exampleAr: "مثال: أكملت الجملة قبل أن تقرأ الخيارات، وأمكنك استخدامها في جملة جديدة.",
    avoidAr: "لا تخترها لأنك رأيت البطاقة قبل دقائق؛ «سهل» تعني حاضر تلقائيًا لا مألوف الآن.",
  },
};

export function gradeDescriptor(value: number): ReviewGradeDescriptor | null {
  return value === 1 || value === 3 || value === 4 || value === 5 ? REVIEW_GRADE_DESCRIPTORS[value] : null;
}

/** ملخّص الانحياز: هل تُستخدم «سهل» أكثر من اللازم؟ عرض فقط، ولا يعدّل أي جدولة. */
export function selfRatingBias(events: readonly ReviewEvent[]): { total: number; easySharePct: number; noteAr: string } {
  const total = events.length;
  if (!total) return { total: 0, easySharePct: 0, noteAr: "لا مراجعات مسجّلة بعد؛ لا يمكن الحكم على انحياز تقديرك." };
  const easy = events.filter((event) => event.grade === 5).length;
  const share = Math.round((easy / total) * 100);
  return {
    total,
    easySharePct: share,
    noteAr:
      share > 60
        ? `${share}% من مراجعاتك بدرجة «سهل»؛ إن كان ذلك لا يطابق استرجاعًا تلقائيًا فالأرجح أنك تقدّر بمزاج لا بسلوك.`
        : "توزيع تقديرك لا يُظهر انحيازًا واضحًا نحو «سهل».",
  };
}
