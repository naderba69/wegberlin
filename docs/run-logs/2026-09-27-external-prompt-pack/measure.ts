/**
 * مسبار P2-225: يبني الحزمة بسياق حقيقي ويقيس الأسقف والرفض.
 * التشغيل: npx tsx docs/run-logs/2026-09-27-external-prompt-pack/measure.ts
 */
import {
  EXTERNAL_PROMPT_MAX_CHARS,
  assertPromptPackIntegrity,
  buildExternalPromptPack,
  containsSecretLike,
  guardExternalPromptText,
} from "@/core/ai/external-prompt-pack";

const cards = buildExternalPromptPack({
  level: "B1",
  targetExam: "telc-deutsch-b2",
  lessonId: "b1-12",
  lessonTitleDe: "Umwelt und Verkehr",
  activeErrors: ["Passiv", "Konjunktiv II", "Wortstellung"],
});
assertPromptPackIntegrity(cards);
console.log("cards:", cards.length);
console.log("chars per card:", cards.map((card) => card.charCount).join(", "));
console.log("cap:", EXTERNAL_PROMPT_MAX_CHARS, "total:", cards.reduce((sum, card) => sum + card.charCount, 0));
const fakeOpenaiStyle = ["sk", "proj", "abcdefgh12345678"].join("-");
console.log("secret refused:", !guardExternalPromptText(fakeOpenaiStyle).ok);
console.log("plain accepted:", guardExternalPromptText("أخطائي في ترتيب الفعل").ok);
console.log("secret detector on lesson text:", containsSecretLike(cards[0].text));
