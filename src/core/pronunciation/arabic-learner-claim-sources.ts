/**
 * ADR-134 — published-source check (kept outside src/data: governance evidence, not curriculum content) of the 18 Arabic-learner pronunciation claims (P1-380).
 * Server/test-only evidence: not imported by client components.
 * Tier: `source-verified-agent` (ADR-116). This is not an independent phonetician's review and does
 * not change `reviewStatus` of the inventory rows, which stays `authored-review-pending`.
 */
export const ARABIC_PRONUNCIATION_SOURCE_POLICY = "arabic-learner-pronunciation-source-check-v1" as const;
export const ARABIC_PRONUNCIATION_SOURCE_CHECKED_AT = "2026-10-18" as const;

export type PronunciationSourceId =
  | "SCHULTE_BUNERT_2018" | "EL_BAGHDADI_2013" | "WIKIBOOKS_ARABISCH_AUSSPRACHE" | "HFH_INTERFERENZEN_ARABISCH"
  | "REHMAN_2022_LTR" | "KUZMINYKH_2017" | "ZIF_LEHRWERKE_AUSSPRACHE";

export const pronunciationSources: Readonly<Record<PronunciationSourceId, { citation: string; url: string; access: "fetched" | "search-excerpt"; findingDe: string }>> = {
  SCHULTE_BUNERT_2018: { citation: "Schulte-Bunert, E. (2018): Worüber stolpern Majeda und andere Kinder beim Deutschlernen? Grundschulverband (PDF, 2018).", url: "https://grundschulverband.de/wp-content/uploads/2019/09/T198_GSV_2018_Schulte_Bunert_Worueber_stolpern_Majeda_und_andere_Kinder_beim_Deutschlernen.pdf", access: "fetched", findingDe: "Arabisch kennt [g], [p], [v] nicht; ich-Laut wird durch ach-Laut oder isch ersetzt; keine Umlaute; Zäpfchen-r meist unbekannt; Sprossvokale in Konsonantenverbindungen; Lang-/Kurzvokal-Opposition für a, i, u im Arabischen vorhanden." },
  EL_BAGHDADI_2013: { citation: "El Baghdadi, H. (2013): Sprachbeschreibung Modernes Standard-Arabisch. ProDaZ, Universität Duisburg-Essen.", url: "https://www.uni-due.de/imperia/md/content/prodaz/sprachbeschreibung_arabisch.pdf", access: "search-excerpt", findingDe: "/p/ und /v/ fehlen; ä, ö, ü, au, eu, ng und ich-Laut kommen nicht vor; Verwechslung i/e und u/o; ö/ü oft durch u ersetzt." },
  WIKIBOOKS_ARABISCH_AUSSPRACHE: { citation: "Wikibooks: Arabisch: Schrift und Aussprache (de.wikibooks.org).", url: "https://de.wikibooks.org/wiki/Arabisch:_Schrift_und_Aussprache", access: "fetched", findingDe: "Keine Auslautverhärtung im Arabischen; Hāʼ = h und Hamza = Glottisschlag; Rāʼ = Zungenspitzen-r, Ġain = Zäpfchen-r; Ḫāʼ = ch wie in Bach." },
  HFH_INTERFERENZEN_ARABISCH: { citation: "Interkantonale Hochschule für Heilpädagogik Zürich (HfH), ILIAS-Wiki Interferenzen: Arabisch.", url: "https://ilias.hfh.ch/ilias.php?baseClass=ilwikihandlergui&cmd=viewPage&cmdClass=ilobjwikigui&cmdNode=18a%3Aro&page=Arabisch&ref_id=338740", access: "search-excerpt", findingDe: "/p, g, v, ç, ŋ/ fehlen; [ç] wird als [ʃ] gesprochen; keine R-Vokalisierung, keine Auslautverhärtung; Affrikaten /pf, ts/ nur im Deutschen; häufige Tilgung von /t/ in Konsonantenhäufungen." },
  REHMAN_2022_LTR: { citation: "Rehman, I., Silpachai, A., Levis, J., Zhao, G., Gutierrez-Osuna, R. (2022): The English pronunciation of Arabic speakers. Language Teaching Research. doi:10.1177/1362168820931888", url: "https://journals.sagepub.com/doi/full/10.1177/1362168820931888", access: "search-excerpt", findingDe: "Korpusbefund (Englisch als L2): /p/–/b/ in beide Richtungen, /v/ problematisch, Vokaleinschub in Konsonantenverbindungen. Analogie, nicht Deutsch." },
  KUZMINYKH_2017: { citation: "Kuzminykh, K. (2017): Inklusiver Deutschunterricht: Mehrsprachigkeit im Fokus. SUB Göttingen (webdoc).", url: "https://webdoc.sub.gwdg.de/pub/mon/2017/3-kuzminykh.pdf", access: "search-excerpt", findingDe: "Vokalersetzungen bei arabischen Lernenden: Boss/Bus, Schloss/Schluss, küssen→kussen, süß→suß." },
  ZIF_LEHRWERKE_AUSSPRACHE: { citation: "Zeitschrift für Interkulturellen Fremdsprachenunterricht: Lehrwerke als Mittel zur Aussprachedidaktisierung für DaF.", url: "https://zif.tujournals.ulb.tu-darmstadt.de/article/3373/galley/3304/download/", access: "search-excerpt", findingDe: "Akzentuierung, Melodie, Pausen gehören zu den häufigsten Ausspracheabweichungen im DaF allgemein (nicht arabisch-spezifisch)." },
};

export type PronunciationClaimSupport = "supported" | "partially-supported" | "revised-to-positive-transfer" | "general-daf-not-arabic-specific";

export const arabicLearnerPronunciationClaimSources: Readonly<Record<string, { support: PronunciationClaimSupport; sources: readonly PronunciationSourceId[]; noteAr: string }>> = {
  "ar-pron-p-b": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "EL_BAGHDADI_2013", "HFH_INTERFERENZEN_ARABISCH", "REHMAN_2022_LTR"], noteAr: "غياب p في العربية موثق في ثلاثة مصادر ألمانية." },
  "ar-pron-f-v": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "EL_BAGHDADI_2013", "HFH_INTERFERENZEN_ARABISCH", "REHMAN_2022_LTR"], noteAr: "غياب v في العربية موثق." },
  "ar-pron-h-zero": { support: "revised-to-positive-transfer", sources: ["WIKIBOOKS_ARABISCH_AUSSPRACHE"], noteAr: "العربية فيها الهاء والهمزة معًا، فصار النص يعرض الفرق كنقل إيجابي لا كصعوبة عامة." },
  "ar-pron-ich-sch": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "HFH_INTERFERENZEN_ARABISCH", "EL_BAGHDADI_2013"], noteAr: "الإبدال بالشين موثق نصًا." },
  "ar-pron-ich-s": { support: "partially-supported", sources: ["SCHULTE_BUNERT_2018", "EL_BAGHDADI_2013"], noteAr: "غياب ich-Laut موثق؛ الإبدال بالسين تحديدًا غير مذكور في المصادر المفحوصة." },
  "ar-pron-ach-ch": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "WIKIBOOKS_ARABISCH_AUSSPRACHE"], noteAr: "الخاء مألوفة، وإبدال ich-Laut بالخاء موثق." },
  "ar-pron-ts-z": { support: "partially-supported", sources: ["HFH_INTERFERENZEN_ARABISCH"], noteAr: "غياب المركب ts في العربية مذكور في مقتطف بحث واحد." },
  "ar-pron-pf-f": { support: "supported", sources: ["HFH_INTERFERENZEN_ARABISCH", "SCHULTE_BUNERT_2018", "EL_BAGHDADI_2013"], noteAr: "غياب pf ومعه غياب p." },
  "ar-pron-r-variants": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "WIKIBOOKS_ARABISCH_AUSSPRACHE", "HFH_INTERFERENZEN_ARABISCH"], noteAr: "الراء اللسانية عربية الأصل، والغين قريبة من الراء الحلقية؛ أضيف هذا التلميح." },
  "ar-pron-final-devoicing": { support: "supported", sources: ["WIKIBOOKS_ARABISCH_AUSSPRACHE", "HFH_INTERFERENZEN_ARABISCH"], noteAr: "لا يوجد في العربية تحول الجهر في آخر المقطع." },
  "ar-pron-vowel-length-a": { support: "revised-to-positive-transfer", sources: ["SCHULTE_BUNERT_2018"], noteAr: "العربية تميّز الطول في a و i و u، فصار النص ينقل الصعوبة إلى قراءة الطول من الكتابة." },
  "ar-pron-vowel-open-o": { support: "partially-supported", sources: ["EL_BAGHDADI_2013", "KUZMINYKH_2017"], noteAr: "خلط o و u موثق؛ خلط الانفتاح [ɔ] بالطول [oː] تحديدًا غير موثق." },
  "ar-pron-y-u": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "EL_BAGHDADI_2013", "KUZMINYKH_2017"], noteAr: "إبدال ü بـ u موثق بأمثلة." },
  "ar-pron-oe-o": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "EL_BAGHDADI_2013"], noteAr: "غياب ö في العربية موثق." },
  "ar-pron-consonant-cluster": { support: "supported", sources: ["SCHULTE_BUNERT_2018", "HFH_INTERFERENZEN_ARABISCH", "REHMAN_2022_LTR"], noteAr: "الحركة المقحمة في التجمعات موثقة بأمثلة." },
  "ar-pron-word-stress": { support: "general-daf-not-arabic-specific", sources: ["ZIF_LEHRWERKE_AUSSPRACHE"], noteAr: "صعوبة عامة في تعلم الألمانية، لا مصدر عربي خاص." },
  "ar-pron-sentence-focus": { support: "general-daf-not-arabic-specific", sources: ["ZIF_LEHRWERKE_AUSSPRACHE"], noteAr: "صعوبة عامة في تعلم الألمانية، لا مصدر عربي خاص." },
  "ar-pron-statement-question": { support: "general-daf-not-arabic-specific", sources: ["ZIF_LEHRWERKE_AUSSPRACHE"], noteAr: "صعوبة عامة في تعلم الألمانية، لا مصدر عربي خاص." },
};
