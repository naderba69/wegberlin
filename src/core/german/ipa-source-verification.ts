/**
 * ADR-134 — evidence contract for the dictionary verification of tabulated IPA.
 * Server/test-only: not imported by any client component.
 */
export const IPA_SOURCE_VERIFICATION_POLICY = "ipa-dictionary-source-verification-v1" as const;
export const IPA_SOURCE_VERIFICATION_CSV = "reports/pronunciation-source-verification/IPA_SOURCE_VERIFICATION_2026-10-18.csv" as const;
export const IPA_SOURCE_VERIFICATION_BOUNDARY = "written-transcription-vs-wiktionary-derived-dictionary-no-audio-no-learner-score-not-independent-phonetician-review" as const;
export const IPA_SOURCE_DICTIONARY = {
  name: "open-dict-data/ipa-dict data/de.txt (from devio-at/german-ipa-dict, extracted from de.wiktionary)",
  licence: "CC BY-SA",
  commit: "43c3570eb3553bdd19fccd2bd0091534889af023",
  sha256: "d36d11dbcc226468a22f0fb3a0794ee0ce142bf277e26e517a8bfd0de1ec2653",
  checkedAt: "2026-10-18",
} as const;

export function ipaVerificationKey(de: string, ipa: string): string {
  return `${de}|${ipa}`;
}

export type ManualIpaDecision = { decision: "accepted-after-manual-check" | "out-of-scope-intonation-notation"; noteAr: string };

/** Rows the automatic comparison could not settle; each was checked by hand and the reason is recorded. */
export const manualIpaDecisions: Readonly<Record<string, ManualIpaDecision>> = {
  "Am Ende war alles gut.|[am ˈʔɛndə …]": { decision: "accepted-after-manual-check", noteAr: "القاموس يعطي صيغة الاستشهاد aːm؛ الصيغة الضعيفة [am] هي المعتادة في الجملة." },
  "Sie kommen heute.|[↘]": { decision: "out-of-scope-intonation-notation", noteAr: "سهم نغمة لا تفريغ مقطعي؛ لا يقارَن بقاموس." },
  "Sie kommen heute?|[↗]": { decision: "out-of-scope-intonation-notation", noteAr: "سهم نغمة لا تفريغ مقطعي؛ لا يقارَن بقاموس." },
  "Das ist möglich.|[↘]": { decision: "out-of-scope-intonation-notation", noteAr: "سهم نغمة لا تفريغ مقطعي؛ لا يقارَن بقاموس." },
  "Das ist möglich?|[↗]": { decision: "out-of-scope-intonation-notation", noteAr: "سهم نغمة لا تفريغ مقطعي؛ لا يقارَن بقاموس." },
  "Einstufungstest|[ˈaɪ̯nʃtuːfʊŋsˌtɛst]": { decision: "accepted-after-manual-check", noteAr: "مركّب غير مدرج؛ أجزاؤه Einstufung و-s- وTest تطابق القاموس." },
  "Als ich 18 wurde, …|[als ɪç … ˈvʊʁdə]": { decision: "accepted-after-manual-check", noteAr: "الرقم غير مفرّغ عمدًا؛ als وich وwurde تطابق القاموس." },
  "ANSCHLIESSEND zeige ich …|[ˈanʃliːsn̩t …]": { decision: "accepted-after-manual-check", noteAr: "الكتابة بالأحرف الكبيرة SS منعت البحث؛ anschließend في القاموس ˈanˌʃliːsn̩t." },
  "Wie die DATEN zeigen …|[… ˈdaːtn̩ …]": { decision: "accepted-after-manual-check", noteAr: "البحث بالأحرف الكبيرة التقط مدخلًا إنجليزيًا؛ Daten في القاموس ˈdaːtn̩." },
  "womit|[voˈmɪt]": { decision: "accepted-after-manual-check", noteAr: "de.wiktionary يذكر الصيغتين voˈmɪt وˈvoːmɪt؛ الأولى المعتادة في الربط." },
  "DARAUF, dass …|[daˈʁaʊ̯f …]": { decision: "accepted-after-manual-check", noteAr: "مدخل القاموس معطوب؛ darauf في الاستعمال الرابط daˈʁaʊ̯f." },
  "um DREISSIG Prozent|[ʊm ˈdʁaɪ̯sɪç pʁoˈtsɛnt]": { decision: "accepted-after-manual-check", noteAr: "SS بالأحرف الكبيرة منعت البحث؛ dreißig ˈdʁaɪ̯sɪç وProzent pʁoˈt͡sɛnt." },
  "ABSCHLIESSEND halte ich fest …|[ˈapʃliːsn̩t …]": { decision: "accepted-after-manual-check", noteAr: "SS بالأحرف الكبيرة منعت البحث؛ abschließend ˈapˌʃliːsn̩t." },
  "DAdurch, dass die Meldung spät kam …|[ˈdaːdʊʁç das diː ˈmɛldʊŋ ʃpɛːt kaːm]": { decision: "accepted-after-manual-check", noteAr: "نبر إشاري مقصود على DA في درس التوكيد؛ الصيغة المحايدة daˈdʊʁç." },
  "WÄHrend Online-Termine schneller sind …|[ˈvɛːʁənt ˈɔnlaɪ̯ntɛʁˌmiːnə ˈʃnɛlɐ zɪnt]": { decision: "accepted-after-manual-check", noteAr: "Online مستعار غير مدرج بهذا الشكل؛ الأجزاء الألمانية تطابق القاموس." },
  "DIEse Frist — nicht der Antrag.|[ˈdiːzə ˈfʁɪst nɪçt deːɐ̯ ˈanˌtʁaːk]": { decision: "accepted-after-manual-check", noteAr: "الشرطة منعت التقسيم الآلي؛ كل كلمة تطابق القاموس مع نبر توكيد مقصود." },
  "die Gebührenordnung|[ɡəˈbyːʁənˌʔɔʁdnʊŋ]": { decision: "accepted-after-manual-check", noteAr: "التقسيم الآلي للمركّب وضع نبرًا أول على الجزء الثاني؛ النبر الرئيسي على bühr صحيح." },
  "Wir bitten darum, …|[ˈbɪtn̩ daˈʁʊm]": { decision: "accepted-after-manual-check", noteAr: "التفريغ يغطي bitten darum؛ كلاهما يطابق القاموس." },
};
