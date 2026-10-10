/**
 * وحدة التنوّع الألماني قبل B1 (البند P1-17 من تدقيق الطريقة).
 *
 * المشكلة المقيسة: المنهج كله ألمانية معيارية واحدة؛ لا تمثيل نمساوي ولا سويسري ولا مفردات
 * إقليمية. الضرر عملي: من يقرأ «Semmel» أو «Velo» أو «Topfen» أمامه في فيينا أو زيورخ لا يجدها
 * في قاموسه، ومن يتحدّث الألمانية المعيارية سليمًا لكنه لا يعرف أن «Brötchen» تُفهم في الجنوب
 * بتحفّظ. الهدف وعي تنوّعي لا إتقان لهجات: لا نُدرّب على النطق اللهجي ولا ندّعي بلوغه.
 */
export const GERMAN_VARIANTS_POLICY = "german-variants-awareness-v1" as const;
export const GERMAN_VARIANTS_BOUNDARY = "regional-awareness-no-dialect-pronunciation-training-and-no-dialect-mastery-claim" as const;

export type GermanicRegion = "AT" | "CH" | "DE";

export type VariantEntry = {
  id: string;
  /** المعيار المستعمل في الدروس. */
  standardDe: string;
  meaningAr: string;
  /** المفردة الإقليمية كما تُرى مكتوبة (الأشكال الشائعة). */
  regional: Array<{ region: GermanicRegion; form: string }>;
  /** أين تُستعمل فعلًا وبأي حدّ. */
  usageAr: string;
  /** فخّ عملي: ما لا يفهمه الآخر، أو ما يبدو غريبًا في الجهة الأخرى. */
  hazardAr: string;
  /** ملاحظة نطق واحدة موثوقة (لا تدريب لهجي). */
  pronunciationNoteDe?: string;
  domain: "food" | "education" | "daily" | "transport";
};

export const variantEntries: VariantEntry[] = [
  { id: "var-semmel", standardDe: "Brötchen", meaningAr: "لفّة خبز صغيرة", regional: [{ region: "AT", form: "Semmel" }, { region: "CH", form: "Brötli (تصغير)" }], usageAr: "في فيينا «Semmel» هي الاسم اليومي الطبيعي؛ «Brötchen» تُفهم لكنها تبدو شمالية.", hazardAr: "من حفظ «Brötchen» وحدها يظنّ «Semmel» كلمة خبز حلوى؛ العكس أيضًا.", domain: "food" },
  { id: "var-topfen", standardDe: "Quark", meaningAr: "جبن قريش طازج", regional: [{ region: "AT", form: "Topfen" }, { region: "CH", form: "Topfen" }], usageAr: "«Topfen» هو الاسم في النمسا وسويسرا، وتُبنى عليه كلمات كثيرة (Topfenstrudel).", hazardAr: "«Quark» تُفهم في الجنوب أحيانًا بمعنى مختلف في سياق الفيزياء أو تُستغرب في المطبخ.", domain: "food" },
  { id: "var-paradeiser", standardDe: "Tomate", meaningAr: "بندورة", regional: [{ region: "AT", form: "Paradeiser" }, { region: "DE", form: "Tomate" }], usageAr: "في كل جنوب النمسا تقريبًا «Paradeiser»، وتنتشر أيضًا في بافاريا الشرقية.", hazardAr: "«Paradeiser» لا تُفهم في شمال ألمانيا، لذا في النصّ الرسمي استعمل Tomate.", domain: "food" },
  { id: "var-marille", standardDe: "Aprikose", meaningAr: "مشمش", regional: [{ region: "AT", form: "Marille" }, { region: "CH", form: "Aprikose" }], usageAr: "«Marille» أساسية في النمسا وفي أسماء مأكولات مؤصلة (Marillenknödel).", hazardAr: "ترجمة القوائم في النمسا تعتمد Marille، ومن لا يعرفها يفوّت الأطباق.", domain: "food" },
  { id: "var-erdapfel", standardDe: "Kartoffel", meaningAr: "بطاطا", regional: [{ region: "AT", form: "Erdapfel" }, { region: "CH", form: "Erdäpfel" }], usageAr: "«Erdapfel» شائع جدًا في النمسا، و «Erdäpfelsalat» طبق وطني.", hazardAr: "«Erdapfel» حرفيًّا «تفاحة الأرض»؛ من لا يعرفها يظنّ نوع تفاح.", domain: "food" },
  { id: "var-kaffee", standardDe: "Milchkaffee", meaningAr: "قهوة بالحليب", regional: [{ region: "AT", form: "Melange" }, { region: "CH", form: "Café crème (فرنسي)" }], usageAr: "«Melange» طلب المقهى الكلاسيكي في فيينا، وتأتي بكوب صغير مع رغوة حليب.", hazardAr: "طلب «Milchkaffee» في مقهى فييني يعني عادةً كوبًا كبيرًا أكثر حليبًا؛ الفرق حقيقي لا تفصيل.", domain: "food" },
  { id: "var-sackerl", standardDe: "Tüte", meaningAr: "كيس", regional: [{ region: "AT", form: "Sackerl" }, { region: "CH", form: "Säckli" }], usageAr: "في المتاجر: «Möchten Sie ein Sackerl?» سؤال يومي في فيينا.", hazardAr: "«Tüte» تُفهم، لكن استعمال «Sackerl» يُظهر معرفة عملية وليست عيبًا.", domain: "daily" },
  { id: "var-jause", standardDe: "Pausenbrot", meaningAr: "أكلة ما بين الوجبات", regional: [{ region: "AT", form: "Jause" }, { region: "CH", form: "Znüni / Zvieri (بالتوقيت)" }], usageAr: "«Jause» أكلة خفيفة أو استراحة، و «Znüni» حرفيًّا «الساعة التاسعة» في سويسرا.", hazardAr: "«Znüni» لا معنى لها خارج سويسرا؛ من يسمعها يظنّها اسم مأكول.", domain: "daily" },
  { id: "var-guetzi", standardDe: "Keks", meaningAr: "بسكويت", regional: [{ region: "AT", form: "Keks" }, { region: "CH", form: "Guetzli" }], usageAr: "«Guetzli» في سويسرا للبسكويت الحلو.", hazardAr: "جمع ألماني معياري (d...n) لا يُطبَّق على كلمات سويسرية؛ احفظ الكلمة كما هي.", domain: "food" },
  { id: "var-velo", standardDe: "Fahrrad", meaningAr: "دراجة", regional: [{ region: "CH", form: "Velo" }, { region: "AT", form: "Fahrrad" }], usageAr: "«Velo» من الفرنسية ومسيطرة في سويسرا في الكلام واللافتات.", hazardAr: "«Velo» لا تُفهم في ألمانيا؛ في نصّك الرسمي اكتب Fahrrad.", domain: "transport" },
  { id: "var-trottoir", standardDe: "Gehweg", meaningAr: "رصيف المشي", regional: [{ region: "CH", form: "Trottoir" }, { region: "AT", form: "Gehsteig" }], usageAr: "«Trottoir» في سويسرا و «Gehsteig» في النمسا، و «Gehweg» معيار ألماني.", hazardAr: "ثلاث كلمات لشيء واحد: قراءة لافتة مدينة في زيورخ تحتاج Trottoir.", domain: "transport" },
  { id: "var-matura", standardDe: "Abitur", meaningAr: "شهادة الثانوية العامة", regional: [{ region: "AT", form: "Matura" }, { region: "CH", form: "Maturität / Matura" }], usageAr: "«Matura» في النمسا وسويسرا، و «Abitur» في ألمانيا؛ وفي سويسرا تُستعمل أيضًا المatura في السياقات الرسمية.", hazardAr: "في سيرة ذاتية أو نموذج تسجيل، الخطأ في التسمية يوقع لبسًا إداريًّا.", domain: "education" },
];

export const variantEntryById = new Map(variantEntries.map((entry) => [entry.id, entry]));

export type VariantQuizItem = {
  entryId: string;
  region: GermanicRegion;
  /** الصيغة الصحيحة في تلك الجهة. */
  correct: string;
  choices: string[];
  promptAr: string;
};

function choicesFor(entry: VariantEntry, correct: string): string[] {
  const others = entry.regional.map((item) => item.form).filter((form) => form !== correct);
  const fillers = variantEntries.filter((item) => item.id !== entry.id).slice(0, 3).map((item) => item.standardDe);
  return [...new Set([correct, ...others, ...fillers])].slice(0, 4);
}

/** أسئلة مؤلَّفة من البيانات نفسها، بلا توليد عشوائي: كل سؤال له جواب واحد في جهته. */
export function buildVariantQuiz(entries: readonly VariantEntry[] = variantEntries): VariantQuizItem[] {
  const quiz: VariantQuizItem[] = [];
  for (const entry of entries) {
    for (const item of entry.regional) {
      const choices = choicesFor(entry, item.form);
      if (choices.length < 3) continue;
      quiz.push({
        entryId: entry.id,
        region: item.region,
        correct: item.form,
        choices,
        promptAr: `أنت في ${item.region === "AT" ? "النمسا (فيينا)" : item.region === "CH" ? "سويسرا (زيورخ)" : "ألمانيا (برلين)"}: أيّ صيغة تسمعها/تقرأها فعلًا لـ«${entry.meaningAr}»؟`,
      });
    }
  }
  return quiz;
}

export function variantCoverage(entries: readonly VariantEntry[] = variantEntries) {
  const regions = { AT: 0, CH: 0, DE: 0 };
  for (const entry of entries) for (const item of entry.regional) regions[item.region] += 1;
  return {
    policyVersion: GERMAN_VARIANTS_POLICY,
    entries: entries.length,
    at: regions.AT,
    ch: regions.CH,
    de: regions.DE,
    withHazard: entries.filter((entry) => entry.hazardAr.length > 0).length,
    withPronunciationNote: entries.filter((entry) => entry.pronunciationNoteDe).length,
    domains: [...new Set(entries.map((entry) => entry.domain))],
  };
}
