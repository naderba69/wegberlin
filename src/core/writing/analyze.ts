import type { WritingDimensionEvidence } from "@/types/learning";

export type WritingAnalysis = {
  wordCount:number;
  sentenceCount:number;
  feedback:string[];
  checks:Array<{label:string;passed:boolean}>;
  dimensions:WritingDimensionEvidence[];
};

function quote(value:string){const compact=value.replace(/\s+/gu," ").trim();return compact.length>110?`${compact.slice(0,107)}…`:compact}

export function analyzeWriting(text:string,options:{minWords?:number;requireGreeting?:boolean;taskPointsCompleted?:number;taskPointsTotal?:number}={}):WritingAnalysis{
  const minWords=options.minWords??30;
  const cleaned=text.trim();
  const words=cleaned?cleaned.split(/\s+/u):[];
  const sentences=cleaned.split(/(?<=[.!?])\s+/u).map((sentence)=>sentence.trim()).filter(Boolean);
  const sentenceCount=sentences.length;
  const firstQuote=quote(sentences[0]??cleaned);
  const hasGreeting=/\b(hallo|guten tag|liebe|lieber|sehr geehrte)/iu.test(cleaned);
  const hasClosing=/\b(viele grüße|freundliche grüße|mit freundlichen grüßen|liebe grüße|bis bald)/iu.test(cleaned);
  const hasVerb=/\b(bin|bist|ist|sind|war|waren|habe|hat|haben|hatte|heiße|komme|wohne|möchte|kann|will|muss|soll|gehe|lerne|arbeite|suche|brauche|würde|könnte|werde|wird|wurden|finde|denke|glaube|schlage|bitte)\b/iu.test(cleaned);
  const hasConnector=/\b(und|aber|weil|deshalb|daher|obwohl|allerdings|außerdem|zuerst|danach|einerseits|andererseits|hingegen|wenn|falls)\b/iu.test(cleaned);
  const capitalSentences=sentences.filter((sentence)=>/^[A-ZÄÖÜ]/u.test(sentence)).length;
  const hasCapitalStart=/^[A-ZÄÖÜ]/u.test(cleaned);
  const uniqueWords=new Set(words.map((word)=>word.toLocaleLowerCase("de-DE").replace(/[^\p{L}ßäöü]/gu,"")).filter((word)=>word.length>=3));
  const vocabularyThreshold=Math.min(18,Math.max(6,Math.floor(minWords*.18)));
  const taskPointsTotal=options.taskPointsTotal??0;
  const taskPointsCompleted=options.taskPointsCompleted??0;
  const taskCoveragePassed=taskPointsTotal===0||taskPointsCompleted===taskPointsTotal;
  const registerPassed=options.requireGreeting===false?(/\b(ich denke|meiner meinung|sollte|könnte|allerdings|zusammenfassend)\b/iu.test(cleaned)||sentenceCount>=4):(hasGreeting&&hasClosing);
  const weakCapitalSentence=sentences.find((sentence)=>!/^([A-ZÄÖÜ]|\d)/u.test(sentence));

  const dimensions:WritingDimensionEvidence[]=[
    {key:"task-achievement",labelAr:"إنجاز المهمة",passed:words.length>=minWords&&taskCoveragePassed,detailAr:words.length<minWords?`النص ${words.length} كلمة ويحتاج ${minWords} على الأقل.`:taskCoveragePassed?"بلغ طول المهمة وأكدت تغطية نقاطها.":`أكدت ${taskPointsCompleted}/${taskPointsTotal} من نقاط المهمة.`,evidenceQuote:firstQuote||undefined},
    {key:"coherence",labelAr:"الترابط",passed:sentenceCount>=3&&hasConnector,detailAr:sentenceCount<3?"نحتاج ثلاث جمل مكتملة على الأقل.":hasConnector?"توجد إشارة ربط بين الأفكار.":"أضف رابطًا يوضح السبب أو المقابلة أو التسلسل.",evidenceQuote:firstQuote||undefined},
    {key:"vocabulary",labelAr:"المفردات",passed:uniqueWords.size>=vocabularyThreshold,detailAr:`رُصدت ${uniqueWords.size} كلمة محتوى فريدة؛ الحد الداخلي لهذه العينة ${vocabularyThreshold}.`,evidenceQuote:firstQuote||undefined},
    {key:"grammar",labelAr:"القواعد وبناء الجملة",passed:hasVerb&&sentenceCount>0&&capitalSentences/sentenceCount>=.8,detailAr:!hasVerb?"لم يُرصد فعل مصرف واضح في العينة.":weakCapitalSentence?"توجد جملة لا تبدأ بحرف كبير.":"رُصد فعل مصرف وبدايات جمل واضحة؛ هذا لا يثبت الخلو من الأخطاء.",evidenceQuote:quote(weakCapitalSentence??sentences[0]??cleaned)||undefined},
    {key:"register",labelAr:"السجل والملاءمة",passed:registerPassed,detailAr:options.requireGreeting===false?(registerPassed?"توجد مؤشرات موقف أو حجاج مناسبة.":"أظهر موقفًا أو صيغة حجاج مناسبة للسياق."):(registerPassed?"توجد تحية وخاتمة مناسبتان.":"أضف تحية وخاتمة تناسبان الرسالة."),evidenceQuote:firstQuote||undefined},
  ];

  const checks=[...(options.requireGreeting===false?[]:[{label:"افتتاح أو تحية مناسبة",passed:hasGreeting}]),{label:"ثلاث جمل على الأقل",passed:sentenceCount>=3},{label:"وجود فعل مصرف واضح",passed:hasVerb},{label:"بداية بحرف كبير",passed:hasCapitalStart},{label:`${minWords} كلمة على الأقل`,passed:words.length>=minWords}];
  const feedback=dimensions.filter((dimension)=>!dimension.passed).map((dimension)=>`${dimension.labelAr}: ${dimension.detailAr}${dimension.evidenceQuote?` قرب «${dimension.evidenceQuote}»`:""}`);
  if(!feedback.length)feedback.push(`استوفيت المؤشرات الحتمية الخمسة في هذه العينة قرب «${firstQuote}». راجع الدقة اللغوية بشريًا ثم احفظ نسخة منقحة.`);
  return{wordCount:words.length,sentenceCount,feedback,checks,dimensions};
}
