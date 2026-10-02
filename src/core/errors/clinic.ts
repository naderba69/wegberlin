import type { ErrorRecord } from "@/types/learning";

export type ErrorClinic = {
  id:string;
  type:ErrorRecord["type"];
  titleAr:string;
  ruleAr:string;
  trickAr:string;
  modelWrong:string;
  modelCorrect:string;
  followUpPromptAr:string;
  followUpAnswer:string;
  sourceErrors:ErrorRecord[];
  sourceErrorIds:string[];
  evidenceCount:number;
  latestSeenAt:string;
};

type ClinicKnowledge=Pick<ErrorClinic,"titleAr"|"ruleAr"|"trickAr"|"modelWrong"|"modelCorrect"|"followUpPromptAr"|"followUpAnswer">;
const knowledge:Record<ErrorRecord["type"],ClinicKnowledge>={
  article:{titleAr:"عيادة أداة الاسم",ruleAr:"احفظ الاسم مع أداة التعريف وصيغة الجمع؛ الأداة جزء من وحدة الحفظ وليست زينة قبل الاسم.",trickAr:"قل البطاقة دائمًا كثلاثية: der Tisch · die Tische · المعنى.",modelWrong:"Ich kaufe Tisch.",modelCorrect:"Ich kaufe einen Tisch.",followUpPromptAr:"اكتب الجملة كاملة بأداة صحيحة: Das ist ___ Tisch.",followUpAnswer:"Das ist der Tisch."},
  case:{titleAr:"عيادة الحالة الإعرابية",ruleAr:"حدّد وظيفة الاسم وحرف الجر قبل اختيار الأداة؛ mit مثلًا يطلب Dativ.",trickAr:"اربط mit صوتيًا بـ dem: mit dem Bus، mit der Bahn.",modelWrong:"mit der Bus",modelCorrect:"mit dem Bus",followUpPromptAr:"صحح الجملة كاملة: Ich fahre mit der Bus.",followUpAnswer:"Ich fahre mit dem Bus."},
  "word-order":{titleAr:"عيادة ترتيب الجملة",ruleAr:"في الجملة الثانوية مع weil يأتي الفعل المصرف في النهاية، بينما تبقى الجملة الرئيسية بفعل في الموقع الثاني.",trickAr:"weil يرسل الفعل إلى آخر الرصيف.",modelWrong:"weil ich habe keine Zeit",modelCorrect:"weil ich keine Zeit habe",followUpPromptAr:"رتّب واكتب الجملة: weil / ich / heute / keine Zeit / habe",followUpAnswer:"weil ich heute keine Zeit habe"},
  vocabulary:{titleAr:"عيادة المفردات والتراكيب",ruleAr:"تعلم الكلمة داخل Chunk واستعمل الفعل الملازم لها بدل ترجمة كل كلمة منفصلة.",trickAr:"احفظ القرار مع فعله: eine Entscheidung treffen.",modelWrong:"eine Entscheidung machen",modelCorrect:"eine Entscheidung treffen",followUpPromptAr:"اكتب جملة طبيعية باستعمال Entscheidung وtreffen.",followUpAnswer:"Wir treffen eine Entscheidung."},
  spelling:{titleAr:"عيادة الإملاء الألماني",ruleAr:"Umlaut وß قد يغيران الشكل الصحيح؛ لا تعاملهما كزخرفة يمكن حذفها.",trickAr:"انسخ الكلمة مرة، غطها، ثم اكتبها من الذاكرة مع العلامة نفسها.",modelWrong:"Ich heisse Sami.",modelCorrect:"Ich heiße Sami.",followUpPromptAr:"صحح الجملة كاملة: Ich heisse Sami.",followUpAnswer:"Ich heiße Sami."},
  tense:{titleAr:"عيادة الزمن",ruleAr:"في Perfekt اختر الفعل المساعد ثم ضع Partizip II في نهاية الجملة.",trickAr:"ابنِ قوسًا: habe في البداية gearbeitet في النهاية.",modelWrong:"Gestern ich gearbeitet.",modelCorrect:"Gestern habe ich gearbeitet.",followUpPromptAr:"أكمل الجملة صحيحة: Gestern ___ ich lange gearbeitet.",followUpAnswer:"Gestern habe ich lange gearbeitet."},
  grammar:{titleAr:"عيادة القاعدة",ruleAr:"حدّد العلاقة أولًا: شرط، سبب، هدف أو تنازل؛ ثم اختر البنية التي تحققها كاملة.",trickAr:"لا تحفظ الرابط وحده؛ احفظ معه موضع الفعل وصيغة المثال.",modelWrong:"Wenn ich Zeit hätte, ich lerne mehr.",modelCorrect:"Wenn ich Zeit hätte, würde ich mehr lernen.",followUpPromptAr:"صحح الجملة الشرطية كاملة: Wenn ich Zeit hätte, ich lerne mehr.",followUpAnswer:"Wenn ich Zeit hätte, würde ich mehr lernen."},
};

export const ERROR_CLINIC_TRIGGER=3;

export function buildErrorClinics(errors:ErrorRecord[]):ErrorClinic[]{
  const active=errors.filter((error)=>!error.resolved);
  const types=[...new Set(active.map((error)=>error.type))];
  return types.flatMap((type)=>{
    const sourceErrors=active.filter((error)=>error.type===type).sort((left,right)=>right.occurrences-left.occurrences||Date.parse(right.lastSeenAt)-Date.parse(left.lastSeenAt));
    const evidenceCount=sourceErrors.reduce((sum,error)=>sum+error.occurrences,0);
    if(evidenceCount<ERROR_CLINIC_TRIGGER)return[];
    return[{id:`error-clinic:${type}`,type,...knowledge[type],sourceErrors:sourceErrors.slice(0,3),sourceErrorIds:sourceErrors.map((error)=>error.id),evidenceCount,latestSeenAt:sourceErrors.map((error)=>error.lastSeenAt).sort().at(-1)!}];
  }).sort((left,right)=>right.evidenceCount-left.evidenceCount||Date.parse(right.latestSeenAt)-Date.parse(left.latestSeenAt));
}
