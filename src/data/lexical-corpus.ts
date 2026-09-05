/**
 * نصوص المشروع الألمانية كمادة للجرد.
 *
 * الجردان (أسماء مسرد القراءة، وأفعال التكافؤ) يعملان على المادة نفسها: كل نص ألماني
 * داخل أي بنية متداخلة في محتوى الدرس. تُستبعد النصوص العربية حتى لا تتسرّب كلمات
 * ألمانية مقتبسة داخل الشرح العربي إلى القياس.
 */
import { academicLessonList } from "./academic-lessons";

export function germanStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    if (/[A-Za-zÄÖÜäöüß]/.test(value) && !/[؀-ۿ]/.test(value)) out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) germanStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) germanStrings(nested, out);
    return out;
  }
  return out;
}

export const lessonGermanText: Record<string, string> = Object.fromEntries(
  academicLessonList.map((lesson) => [lesson.id, germanStrings(lesson).join(" \n ")]),
);

export const courseGermanCorpus = Object.values(lessonGermanText).join(" \n ");
