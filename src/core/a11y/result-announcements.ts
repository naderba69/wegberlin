/**
 * P0-256: إعلان مدروس لنتائج المختبرات والامتحانات.
 *
 * القاعدة هنا: ما يُقال في منطقة `aria-live` **ملخّص قصير** لا لوحة النتائج
 * كاملة. لوحة النتائج تبقى مرئية للعين ومنسّقة للقراءة، أما المنطقة الحيّة
 * فتقول مرة واحدة وبجملة واحدة: ماذا حدث، وكم، وأين التفاصيل. تكرار اللوحة
 * كاملة داخل منطقة `aria-atomic` يعني أن قارئ الشاشة يقرأ العناوين والروابط
 * والأزرار كلها عند كل نتيجة، وهذا هو التكرار المزعج المطلوب تجنّبه.
 *
 * حدود مُعلنة: هذه الرسائل لا تضيف تقييمًا ولا درجة. كل ما تقوله مستنتج من
 * الأرقام المعروضة أصلًا في اللوحة نفسها.
 */

export const RESULT_ANNOUNCEMENT_POLICY_VERSION = "result-announcement-v1" as const;

/** نتيجة تدريب امتحاني محدّد (عناصر لغوية/قراءة/استماع). */
export function examResultMessage({ score, total, kindAr }: { score: number; total: number; kindAr: string }) {
  return `${kindAr}: ${score} من ${total} إجابة صحيحة. النتيجة تدريبية داخلية وليست نقاطًا رسمية؛ التفاصيل معروضة أدناه.`;
}

/** نتيجة مختبر إنتاجي تحليله خمسة محاور أو أكثر. */
export function labDimensionMessage({ passed, total, labelAr }: { passed: number; total: number; labelAr: string }) {
  return `${labelAr}: ${passed} من ${total} محاور مستوفاة. المؤشرات حتمية وليست درجة امتحان؛ التفاصيل معروضة أدناه.`;
}

/** حفظ تسجيل محادثة مع مراجعة ذاتية. */
export function speakingSavedMessage({ seconds, criteriaChecked, criteriaTotal }: { seconds: number; criteriaChecked: number; criteriaTotal: number }) {
  return `حُفظ التسجيل: ${seconds} ثانية، وأكدت ${criteriaChecked} من ${criteriaTotal} معايير بنفسك. لا تقييم آلي للنطق أو الطلاقة.`;
}

/** نتيجة التشخيص بعد الالتزام. */
export function diagnosticResultMessage({ level, score, maxScore }: { level: string; score: number; maxScore: number }) {
  return `نتيجة التشخيص: المستوى المقدّر ${level} بـ${score} من ${maxScore}. تقدير داخلي لتحديد نقطة البداية، وليس شهادة مستوى.`;
}

/** تسليم مهمة داخل بروفة متصلة مغلقة المساعدة. */
export function continuousTaskMessage({ completed, total }: { completed: number; total: number }) {
  return `ثُبّت التسليم: ${completed} من ${total} مهام مسلّمة. لن تظهر الحلول أو التفسيرات ما دامت هذه البروفة نشطة.`;
}

/** حفظ تقييم ذاتي لمهمة محادثة امتحانية. */
export function selfScoreSavedMessage({ score, max, labelAr }: { score: number; max: number; labelAr: string }) {
  return `حُفظ ${labelAr}: ${score} من ${max} بتقييمك الذاتي. هذا تقديرك أنت، وليس قياسًا آليًا للنطق.`;
}
