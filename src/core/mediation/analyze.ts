import type { MediationDimensionEvidence } from "@/types/learning";

export const MEDIATION_SELF_CHECKS=[
  "نقلت المقصد بدل ترتيب الكلمات.",
  "نقلت المعلومات الأساسية التي سجلتها.",
  "حافظت على القيود والشرط وعدم اليقين.",
  "صغت الكلام بما يناسب المتلقي.",
  "لم أضف معلومة أو ضمانًا غير موجود في المصدر.",
] as const;

export type MediationAnalysis={dimensions:MediationDimensionEvidence[];feedback:string[];requiresGermanResponse:boolean};
const compact=(value:string)=>value.replace(/\s+/gu," ").trim();
const excerpt=(value:string)=>{const text=compact(value);return text.length>110?`${text.slice(0,107)}…`:text};

export function analyzeMediation(input:{sourceDe:string;taskAr:string;audience:string;purpose:string;keyFacts:string[];transferAr:string;responseDe:string;selfChecklist:string[]}):MediationAnalysis{
  const transfer=compact(input.transferAr),response=compact(input.responseDe);
  const requiresGermanResponse=/ألمان|بالألمانية|ألماني/iu.test(input.taskAr);
  const hasArabic=/[\u0600-\u06ff]/u.test(transfer);
  const sourceWords=new Set(input.sourceDe.toLocaleLowerCase("de-DE").match(/[a-zäöüß]{4,}/gu)??[]);
  const copiedWords=(transfer.toLocaleLowerCase("de-DE").match(/[a-zäöüß]{4,}/gu)??[]).filter((word)=>sourceWords.has(word));
  const literalCopy=copiedWords.length>=Math.max(4,Math.ceil(sourceWords.size*.45))||transfer.includes(input.sourceDe.slice(0,30));
  const facts=input.keyFacts.map(compact).filter(Boolean);
  const hasConstraint=/\b(nicht|kein|keine|nur|bis|ab|muss|müssen|soll|sollen|ohne|falls|wenn|jedoch)\b/iu.test(input.sourceDe);
  const confirms=(text:string)=>input.selfChecklist.includes(text);
  const transferQuote=excerpt(transfer);
  const responseWords=response?response.split(/\s+/u):[];
  const responseHasVerb=/\b(bin|ist|sind|habe|hat|kann|können|muss|müssen|soll|sollten|möchte|bitte|komme|wohne|spreche|würde|reicht|zeigt|bedeutet)\b/iu.test(response);
  const dimensions:MediationDimensionEvidence[]=[
    {key:"intent",labelAr:"نقل المقصد",passed:hasArabic&&!literalCopy&&confirms(MEDIATION_SELF_CHECKS[0]),detailAr:literalCopy?"الاستجابة تقترب من نسخ المصدر بدل شرح مقصده.":hasArabic?"استُعمل شرح عربي مستقل عن ترتيب المصدر.":"أضف شرحًا عربيًا واضحًا للمقصد.",evidenceQuote:transferQuote||undefined},
    {key:"completeness",labelAr:"اكتمال المعلومات",passed:facts.length>=2&&transfer.split(/\s+/u).length>=8&&confirms(MEDIATION_SELF_CHECKS[1]),detailAr:facts.length<2?"سجل نقطتين أساسيتين على الأقل قبل الصياغة.":"توجد نقاط مصدر وخلاصة قابلة للمراجعة.",evidenceQuote:transferQuote||undefined},
    {key:"audience",labelAr:"ملاءمة المتلقي",passed:Boolean(compact(input.audience)&&compact(input.purpose)&&confirms(MEDIATION_SELF_CHECKS[3])),detailAr:compact(input.audience)&&compact(input.purpose)?`المتلقي: ${compact(input.audience)}؛ الغرض: ${compact(input.purpose)}.`:"حدّد من سيقرأ وما الذي يحتاجه بعد الشرح.",evidenceQuote:transferQuote||undefined},
    {key:"constraints",labelAr:"القيود وعدم اليقين",passed:!hasConstraint||(confirms(MEDIATION_SELF_CHECKS[2])&&confirms(MEDIATION_SELF_CHECKS[4])),detailAr:hasConstraint?"المصدر يحتوي نفيًا أو شرطًا أو حدًا؛ يجب الحفاظ عليه وعدم تحويل الاحتمال إلى ضمان.":"لم يُرصد قيد لغوي صريح في المصدر، مع بقاء منع الإضافة واجبًا.",evidenceQuote:transferQuote||undefined},
    {key:"response",labelAr:"الاستجابة الألمانية",passed:!requiresGermanResponse||(responseWords.length>=4&&responseHasVerb),detailAr:!requiresGermanResponse?"المهمة لا تفرض ردًا ألمانيًا مستقلًا.":responseWords.length>=4&&responseHasVerb?"توجد استجابة ألمانية قصيرة مع مؤشر فعل؛ يلزم فحص بشري للدقة.":"أضف ردًا ألمانيًا قصيرًا قابلًا للاستعمال.",evidenceQuote:excerpt(response)||undefined},
  ];
  const feedback=dimensions.filter((item)=>!item.passed).map((item)=>`${item.labelAr}: ${item.detailAr}${item.evidenceQuote?` قرب «${item.evidenceQuote}»`:""}`);
  if(!feedback.length)feedback.push(`اكتملت المؤشرات الحتمية الخمسة قرب «${transferQuote}». قارن الآن بالاقتراح ثم أعد الصياغة دون نسخه.`);
  return{dimensions,feedback,requiresGermanResponse};
}
