import { academicLessonList } from "@/data/academic-lessons";
import type { FullLesson, Question } from "@/types/lesson-content";
import type { CEFRLevel } from "@/types/learning";

export const QUESTION_TAXONOMY_VERSION="comprehension-question-taxonomy-v1" as const;
export type ComprehensionQuestionCategory="gist"|"detail"|"stance"|"inference"|"structure";
export type QuestionTaxonomyDisplay={category:ComprehensionQuestionCategory;labelDe:string;labelAr:string};
export interface QuestionTaxonomyRecord extends QuestionTaxonomyDisplay{id:string;policyVersion:typeof QUESTION_TAXONOMY_VERSION;lessonId:string;level:CEFRLevel;surface:"reading"|"listening";questionId:string;classificationBasis:"listening-sequence-gist-contract"|"item-text-semantic-signal"|"specific-detail-default";matchedSignal:string;evidenceBoundary:"question-function-label-no-score-mastery-or-cefr";}

export const questionCategoryLabels:Record<ComprehensionQuestionCategory,{labelDe:string;labelAr:string;strategyAr:string}>={
  gist:{labelDe:"Hauptaussage",labelAr:"الفكرة العامة",strategyAr:"اختر الجواب الذي يغطي النص أو المقطع كله، لا كلمة منفردة."},
  detail:{labelDe:"Detail",labelAr:"تفصيل",strategyAr:"حدد الاسم أو الرقم أو الفعل المطلوب ثم ارجع إلى موضعه."},
  stance:{labelDe:"Haltung",labelAr:"الموقف",strategyAr:"فرّق بين ما يقوله الشخص وبين موقفه أو تقييمه له."},
  inference:{labelDe:"Schlussfolgern",labelAr:"استنتاج",strategyAr:"اجمع دليلين ظاهرين ولا تضف معرفة من خارج النص."},
  structure:{labelDe:"Textaufbau",labelAr:"البنية",strategyAr:"راقب الترتيب ووظيفة الجزء أو العلاقة بين الخطوات."},
};

const signals:Array<{category:Exclude<ComprehensionQuestionCategory,"detail">;label:string;pattern:RegExp}>=[
  {category:"structure",label:"sequence-or-text-function",pattern:/\b(reihenfolge|zuerst|danach|anschließend|schließlich|am ende|welche funktion|welcher schritt|womit beginnt|aufgebaut|gliedert|abschnitt|ablauf|wie wurde .* erklärt|kreislauf|verweisketten|synthetisiert)\b|ترتيب|أول(?:ًا|ا)|بعد ذلك|في النهاية|وظيفة|بنية|خطوة|تسلسل|دورة المشاركة|سلسلة الإحالة|تركيب المصدرين/iu},
  {category:"stance",label:"speaker-stance-or-evaluation",pattern:/\b(meinung|haltung|position|findet|bevorzugt|empfiehlt|kritisiert|warnt|bewertet|zufrieden|überzeugt|lehnt .* ab|spricht sich)\b|رأي|موقف|يفضل|توصي|ينتقد|يحذر|تقييم|راض/iu},
  {category:"inference",label:"reason-or-conclusion",pattern:/\b(warum|weshalb|wozu|welchen schluss|schlussfolger|was zeigt|was bedeutet|lässt sich|welcher grund|daraus|inwiefern|worauf deutet)\b|لماذا|ما السبب|ماذا نستنتج|ما الذي يدل|ما معنى ذلك|بم يدل|ما النتيجة/iu},
  {category:"gist",label:"global-topic-or-summary",pattern:/\b(worum|hauptaussage|hauptthema|zentrale aussage|welches thema|beste überschrift|fasst .* zusammen|worum geht|gesamtziel)\b|الفكرة العامة|الفكرة الرئيسية|موضوع النص|العنوان الأنسب|يلخص النص|الهدف العام/iu},
];

function classify(question:Question,surface:"reading"|"listening",index:number){
  if(surface==="listening"&&index===0)return{category:"gist" as const,basis:"listening-sequence-gist-contract" as const,matchedSignal:"first-listening-question-after-gist-prompt"};
  const text=`${question.promptDe} ${question.promptAr} ${question.explanationAr}`;
  const signal=signals.find((item)=>item.pattern.test(text));
  return signal?{category:signal.category,basis:"item-text-semantic-signal" as const,matchedSignal:signal.label}:{category:"detail" as const,basis:"specific-detail-default" as const,matchedSignal:"specific-who-what-where-when-or-explicit-fact"};
}

function recordsForLesson(lesson:FullLesson):QuestionTaxonomyRecord[]{return(["reading","listening"] as const).flatMap((surface)=>lesson[surface].questions.map((question,index)=>{const classification=classify(question,surface,index);const labels=questionCategoryLabels[classification.category];return{id:`question-taxonomy:${question.id}`,policyVersion:QUESTION_TAXONOMY_VERSION,lessonId:lesson.id,level:lesson.level,surface,questionId:question.id,category:classification.category,labelDe:labels.labelDe,labelAr:labels.labelAr,classificationBasis:classification.basis,matchedSignal:classification.matchedSignal,evidenceBoundary:"question-function-label-no-score-mastery-or-cefr"};}));}

export const questionTaxonomyRecords=academicLessonList.flatMap(recordsForLesson);
export const questionTaxonomyByQuestionId=Object.fromEntries(questionTaxonomyRecords.map((item)=>[item.questionId,item])) as Record<string,QuestionTaxonomyRecord>;
export function questionTaxonomyForLesson(lesson:FullLesson):Record<string,QuestionTaxonomyDisplay>{return Object.fromEntries([...lesson.reading.questions,...lesson.listening.questions].map((question)=>{const record=questionTaxonomyByQuestionId[question.id];return[question.id,{category:record.category,labelDe:record.labelDe,labelAr:record.labelAr}]}));}
