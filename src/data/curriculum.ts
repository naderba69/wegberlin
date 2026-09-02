import type { CEFRLevel, LessonMeta } from "@/types/learning";

type ModuleSeed = { titleDe: string; titleAr: string; lessons: Array<[string, string, string]> };

const seeds: Record<CEFRLevel, ModuleSeed[]> = {
  A1: [
    { titleDe: "Erste Kontakte", titleAr: "التواصل الأول", lessons: [
      ["Hallo Berlin!", "مرحبًا برلين", "أحيّي الآخرين وأعرّف بنفسي."],
      ["Woher kommst du?", "من أين أتيت؟", "أسأل عن البلد واللغة وأجيب."],
      ["Buchstaben und Zahlen", "الحروف والأرقام", "أتهجّى اسمي وأفهم الأرقام الأساسية."],
    ]},
    { titleDe: "Menschen", titleAr: "الأشخاص", lessons: [
      ["Meine Familie", "عائلتي", "أصف أفراد العائلة ببساطة."],
      ["Alter und Kontakte", "العمر والتواصل", "أعطي بيانات شخصية وأطلبها."],
      ["Berufe", "المهن", "أتحدث عن المهنة ومكان العمل."],
    ]},
    { titleDe: "Alltag", titleAr: "الحياة اليومية", lessons: [
      ["Wie spät ist es?", "كم الساعة؟", "أفهم الوقت وأحدّد موعدًا."],
      ["Mein Tag", "يومي", "أصف روتيني اليومي."],
      ["Termine", "المواعيد", "أقترح موعدًا وأوافق أو أرفض."],
    ]},
    { titleDe: "Essen und Trinken", titleAr: "الطعام والشراب", lessons: [
      ["Lebensmittel", "المواد الغذائية", "أسمّي الطعام والكميات."],
      ["Einkaufen", "التسوّق", "أطلب سلعة وأسأل عن السعر."],
      ["Im Restaurant", "في المطعم", "أطلب طعامًا وأدفع الحساب."],
    ]},
    { titleDe: "Wohnen", titleAr: "السكن", lessons: [
      ["Meine Wohnung", "شقّتي", "أصف الغرف والسكن."],
      ["Möbel und Dinge", "الأثاث والأشياء", "أحدّد مكان الأشياء."],
      ["Wohnungssuche", "البحث عن سكن", "أفهم إعلان سكن بسيطًا."],
    ]},
    { titleDe: "Freizeit", titleAr: "وقت الفراغ", lessons: [
      ["Hobbys", "الهوايات", "أتحدث عما أحب فعله."],
      ["Eine Verabredung", "موعد مع صديق", "أخطط لنشاط مشترك."],
      ["Wetter und Wochenende", "الطقس ونهاية الأسبوع", "أفهم الطقس وأختار نشاطًا."],
    ]},
    { titleDe: "Unterwegs", titleAr: "في الطريق", lessons: [
      ["Verkehrsmittel", "وسائل النقل", "أختار وسيلة نقل وأفهم التذاكر."],
      ["Der Weg", "وصف الطريق", "أسأل عن الطريق وأصفه."],
      ["Eine Reise", "رحلة", "أفهم معلومات سفر أساسية."],
    ]},
    { titleDe: "Gesund und organisiert", titleAr: "الصحة والتنظيم", lessons: [
      ["Mein Körper", "جسمي", "أسمّي الأعضاء وأصف ألمًا بسيطًا."],
      ["Beim Arzt", "عند الطبيب", "أطلب موعدًا وأفهم تعليمات بسيطة."],
      ["Formulare und Service", "النماذج والخدمات", "أملأ نموذجًا وأطلب مساعدة."],
    ]},
  ],
  A2: [
    { titleDe: "Erlebnisse", titleAr: "التجارب", lessons: [["Gestern", "أمس", "أحكي أحداثًا ماضية."], ["Eine Geschichte", "قصة", "أرتّب أحداث قصة."], ["Besondere Momente", "لحظات مميزة", "أصف تجربة شخصية."]]},
    { titleDe: "Nachbarschaft", titleAr: "الحي", lessons: [["Neue Nachbarn", "جيران جدد", "أبدأ حديثًا وأعرض المساعدة."], ["Regeln im Haus", "قواعد المنزل", "أفهم القواعد وأشرح مشكلة."], ["Zusammen leben", "العيش معًا", "أقترح حلًا لخلاف بسيط."]]},
    { titleDe: "Arbeit", titleAr: "العمل", lessons: [["Mein Arbeitsplatz", "مكان عملي", "أصف المهام والروتين."], ["Eine Bewerbung", "طلب عمل", "أفهم إعلانًا وأكتب رسالة قصيرة."], ["Am Telefon", "على الهاتف", "أجري مكالمة مهنية بسيطة."]]},
    { titleDe: "Reisen", titleAr: "السفر", lessons: [["Reiseplanung", "تخطيط السفر", "أقارن خيارات سفر."], ["Unterkunft", "الإقامة", "أحجز وأسأل عن الخدمات."], ["Wenn etwas schiefgeht", "عندما تحدث مشكلة", "أشرح مشكلة وأطلب حلًا."]]},
    { titleDe: "Gesundheit", titleAr: "الصحة", lessons: [["Gesund leben", "حياة صحية", "أعطي نصائح بسيطة."], ["Krankmeldung", "الإبلاغ عن المرض", "أشرح الغياب رسميًا."], ["Apotheke und Rat", "الصيدلية والنصيحة", "أفهم إرشادات دواء بسيطة."]]},
    { titleDe: "Medien", titleAr: "الإعلام", lessons: [["Nachrichten", "الأخبار", "أفهم خبرًا قصيرًا."], ["Online sein", "على الإنترنت", "أتحدث عن عاداتي الرقمية."], ["Eine Meinung", "رأي", "أعبّر عن رأي وأعلله."]]},
    { titleDe: "Lernen", titleAr: "التعلّم", lessons: [["So lerne ich", "هكذا أتعلم", "أشرح استراتيجية تعلم."], ["Kurse und Prüfungen", "الدورات والاختبارات", "أستفسر عن دورة."], ["Pläne", "الخطط", "أتحدث عن أهداف مستقبلية."]]},
    { titleDe: "Gesellschaft", titleAr: "المجتمع", lessons: [["Feste", "المناسبات", "أصف مناسبة وعاداتها."], ["Engagement", "المشاركة", "أتحدث عن مساعدة المجتمع."], ["Gemeinsam entscheiden", "قرار مشترك", "أناقش خيارًا وأتوصل إلى قرار."]]},
  ],
  B1: [
    { titleDe: "Biografien", titleAr: "السير والتجارب", lessons: [["Lebenswege", "مسارات الحياة", "أروي سيرة مترابطة."], ["Entscheidungen", "القرارات", "أشرح قرارًا ونتائجه."], ["Wendepunkte", "نقاط التحول", "أناقش تغيرًا مهمًا."]]},
    { titleDe: "Arbeitswelt", titleAr: "عالم العمل", lessons: [["Teamarbeit", "العمل الجماعي", "أناقش توزيع المهام."], ["Konflikte", "الخلافات", "أعالج خلافًا مهنيًا."], ["Bewerbungsgespräch", "مقابلة عمل", "أعرض خبرتي وأجيب عن أسئلة."]]},
    { titleDe: "Wohnen und Stadt", titleAr: "السكن والمدينة", lessons: [["Stadt oder Land?", "المدينة أم الريف؟", "أقارن نمطي حياة."], ["Mietprobleme", "مشكلات الإيجار", "أكتب شكوى مناسبة."], ["Stadtentwicklung", "تطور المدينة", "أعرض اقتراحًا محليًا."]]},
    { titleDe: "Umwelt", titleAr: "البيئة", lessons: [["Konsum", "الاستهلاك", "أناقش عادات الاستهلاك."], ["Mobilität", "التنقل", "أوازن مزايا خيارات النقل."], ["Eine Initiative", "مبادرة", "أخطط لمبادرة بيئية."]]},
    { titleDe: "Bildung", titleAr: "التعليم", lessons: [["Lernwege", "مسارات التعلم", "أصف نظامًا تعليميًا."], ["Weiterbildung", "التكوين المستمر", "أطلب معلومات مفصلة."], ["Präsentieren", "العرض", "أقدّم موضوعًا منظمًا."]]},
    { titleDe: "Medien und Kultur", titleAr: "الإعلام والثقافة", lessons: [["Mediennutzung", "استخدام الإعلام", "أحلل عادة إعلامية."], ["Film und Literatur", "الفيلم والأدب", "أعرض تقييمًا معللًا."], ["Information prüfen", "التحقق من المعلومات", "أميز الرأي عن المعلومة."]]},
    { titleDe: "Beziehungen", titleAr: "العلاقات", lessons: [["Missverständnisse", "سوء الفهم", "أوضح مقصدًا وأصلح الفهم."], ["Ratschläge", "النصائح", "أعطي نصيحة متوازنة."], ["Gemeinsam handeln", "العمل المشترك", "أتفاوض على حل."]]},
    { titleDe: "Zukunft", titleAr: "المستقبل", lessons: [["Ziele", "الأهداف", "أشرح أهدافًا وخطوات."], ["Technik im Alltag", "التقنية اليومية", "أناقش أثر تقنية."], ["B1-Projekt", "مشروع B1", "أدمج القراءة والكتابة والكلام."]]},
  ],
  B2: [
    { titleDe: "Argumentieren", titleAr: "الحجاج", lessons: [["Standpunkte", "وجهات النظر", "أبني موقفًا واضحًا بأدلة."], ["Debatte", "مناظرة", "أعترض وأرد بلباقة."]]},
    { titleDe: "Beruf und Wandel", titleAr: "العمل والتغير", lessons: [["Arbeitsmodelle", "نماذج العمل", "أحلل مزايا وعيوب نماذج العمل."], ["Komplexe Kommunikation", "التواصل المعقد", "أكتب وأتفاوض بسجل مناسب."]]},
    { titleDe: "Wissen und Forschung", titleAr: "المعرفة والبحث", lessons: [["Daten verstehen", "فهم البيانات", "أصف اتجاهات وأفسرها."], ["Wissenschaft vermitteln", "تبسيط العلم", "ألخص محتوى معقدًا لجمهور عام."]]},
    { titleDe: "Gesellschaft im Diskurs", titleAr: "قضايا المجتمع", lessons: [["Teilhabe", "المشاركة", "أناشق قضية اجتماعية بتوازن."], ["Medienkritik", "نقد الإعلام", "أقيّم مصادر وحججًا."]]},
    { titleDe: "Kultur und Identität", titleAr: "الثقافة والهوية", lessons: [["Perspektiven", "وجهات نظر", "أقارن منظورات ثقافية."], ["Vermitteln", "الوساطة", "أنقل مضمونًا معقدًا بدقة."]]},
    { titleDe: "B2-Prüfungsreife", titleAr: "الجاهزية للامتحان", lessons: [["Schreiben und Sprechen", "الكتابة والمحادثة", "أنجز مهامًا إنتاجية تحت الوقت."], ["Generalprobe", "البروفة النهائية", "أثبت جاهزيتي بأدلة حديثة."]]},
  ],
};

const levelOffsets: Record<CEFRLevel, number> = { A1: 0, A2: 24, B1: 48, B2: 72 };

export const curriculum = (Object.entries(seeds) as Array<[CEFRLevel, ModuleSeed[]]>).flatMap(
  ([level, modules]) => modules.flatMap((module, moduleIndex) =>
    module.lessons.map(([titleDe, titleAr, objectiveAr], lessonIndex) => {
      const order = levelOffsets[level] + moduleIndex * module.lessons.length + lessonIndex + 1;
      const localOrder = moduleIndex * module.lessons.length + lessonIndex + 1;
      return {
        id: `${level.toLowerCase()}-${String(localOrder).padStart(2, "0")}`,
        level,
        module: moduleIndex + 1,
        order,
        titleDe,
        titleAr,
        objectiveAr,
        estimatedMinutes: level === "B2" ? 75 : level === "B1" ? 60 : 45,
        status: level === "A1" || level === "A2" || level === "B1" || (level === "B2" && localOrder <= 12) ? "published" : "planned",
      } satisfies LessonMeta;
    }),
  ),
);

export const moduleTitles = seeds;
export const lessonById = (id: string) => curriculum.find((lesson) => lesson.id === id);
