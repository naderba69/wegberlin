/**
 * P0-26: منطق «عينة الإنتاج» القصيرة بعد التشخيص.
 *
 * الفكرة التي يغلقها هذا الملف: التشخيص كله أسئلة اختيار من متعدد (استقبال)، فلا يترك
 * أثرًا إنتاجيًا واحدًا يقارن به المتعلّم نفسه لاحقًا. العينة تسدّ هذه الفجوة بشرطين
 * صارمين معلنين في الشيفرة نفسها:
 *
 *   1. **لا تقييم آلي**: لا درجة، ولا تصحيح، ولا مستوى مشتقًا من العينة. الدوال هنا
 *      تحسب «هل تكفي للحفظ؟» فقط (حد أدنى من الكلمات أو الثواني)، وهذا شرط اكتمال
 *      لا حكم جودة.
 *   2. **لا إطالة للتشخيص**: العينة تُعرض بعد شاشة النتيجة، ويمكن تخطّيها، ولا تدخل في
 *      مسار الأسئلة ولا في `estimatedLevel`.
 *
 * العينة تُخزَّن نصًّا في حالة التعلّم (كتابة) أو كمعرّف وسائط (محادثة)، وتُعرض في
 * `/progress` كمرجع زمني للمتعلّم لا كمؤشر أداء.
 */
import { diagnosticSampleTasks, type DiagnosticSampleTask } from "@/data/diagnostic";
import type { CEFRLevel, DiagnosticSample, DiagnosticSampleKind } from "@/types/learning";

export function sampleTaskFor(level: CEFRLevel, kind: DiagnosticSampleKind): DiagnosticSampleTask {
  return diagnosticSampleTasks[level][kind];
}

/** عدّ الكلمات بالمسافات: يكفي للحد الأدنى ولا يدّعي تحليلًا لغويًا. */
export function countWords(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export function canSaveWritingSample(text: string, level: CEFRLevel) {
  return countWords(text) >= diagnosticSampleTasks[level].writing.minimum;
}

export function canSaveSpeakingSample(durationSeconds: number, level: CEFRLevel) {
  return durationSeconds >= diagnosticSampleTasks[level].speaking.minimum;
}

/** آخر عينة محفوظة من كل نوع، للعرض في صفحة الأدلة. */
export function latestSample(samples: readonly DiagnosticSample[], kind: DiagnosticSampleKind) {
  return [...samples].filter((sample) => sample.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export type DiagnosticSampleSummary = {
  total: number;
  writingCount: number;
  speakingCount: number;
  latestWriting: DiagnosticSample | null;
  latestSpeaking: DiagnosticSample | null;
  /** أحدث تاريخ حفظ، أو null إن لم تُحفظ أي عينة. */
  lastSavedAt: string | null;
};

export function summarizeDiagnosticSamples(samples: readonly DiagnosticSample[]): DiagnosticSampleSummary {
  const latestWriting = latestSample(samples, "writing");
  const latestSpeaking = latestSample(samples, "speaking");
  const dates = samples.map((sample) => sample.createdAt).sort();
  return {
    total: samples.length,
    writingCount: samples.filter((sample) => sample.kind === "writing").length,
    speakingCount: samples.filter((sample) => sample.kind === "speaking").length,
    latestWriting,
    latestSpeaking,
    lastSavedAt: dates.at(-1) ?? null,
  };
}

/**
 * استبدال العينة: تُحذف العينات السابقة من النوع نفسه عند حفظ الجديدة، لأن المرجع
 * المطلوب هو آخر أثر إنتاجي لا سجل تراكمي. لا تُحذف الوسائط القديمة تلقائيًا هنا؛
 * المتعلّم يستطيع حذف العينة من الواجهة فيُحذف تسجيلها معها.
 */
export function withSample(samples: readonly DiagnosticSample[], sample: DiagnosticSample): DiagnosticSample[] {
  return [...samples.filter((existing) => existing.kind !== sample.kind), sample];
}

export function withoutSample(samples: readonly DiagnosticSample[], id: string): DiagnosticSample[] {
  return samples.filter((sample) => sample.id !== id);
}
