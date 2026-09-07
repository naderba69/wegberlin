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

/**
 * وحدات الاستماع: الدور إن كان قصيرًا، والجملة إن كان الدور طويلًا.
 * نصوص الاستماع حوارات تفصل بين المتكلمين بـ ` — `؛ وحين يكون النص متصلًا
 * (إعلان محطة أو مونولوج) تُقسَّم الجمل مباشرة. الدور الطويل يُقسَّم إلى جمل
 * لأن موضع الدليل يجب أن يكون الجملة التي تحمل الجواب لا المقطع كله،
 * ويبقى اسم المتكلم على أول جملة من دوره (`splitGermanSentences` تحافظ على النص).
 */
export function splitListeningUnits(transcriptDe: string): string[] {
  const turns = transcriptDe
    .split(/\s+—\s+|\n+/u)
    .map((turn) => turn.trim())
    .filter(Boolean);
  if (!turns.length) return [];
  if (turns.length === 1) return splitGermanSentences(transcriptDe);
  const units: string[] = [];
  for (const turn of turns) {
    const sentences = splitGermanSentences(turn);
    units.push(...(sentences.length ? sentences : [turn]));
  }
  return units;
}
