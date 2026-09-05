/**
 * الفاصل الموحّد للجمل الألمانية في نصوص القراءة.
 * يستعمله كل من اختيار الدليل الآلي وجرد المواضع المؤلفة، حتى يبقى ترقيم الجمل واحدًا.
 */
export function splitGermanSentences(textDe: string): string[] {
  return textDe
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
