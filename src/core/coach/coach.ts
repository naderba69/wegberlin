import type { LearnerGoal, LearningState, MissionBlock } from "@/types/learning";
import { curriculum } from "@/data/curriculum";
import { effectiveSessionMinutes } from "./session-signals";
import { errorRepairState } from "@/core/errors/remediation";
import { buildErrorClinics } from "@/core/errors/clinic";
import { buildExamReadiness } from "@/core/exams/readiness";

const baseBlocks: MissionBlock[] = [
  { id:"diagnostic",kind:"diagnostic",titleAr:"اختبار نقطة البداية",titleDe:"Einstufung",minutes:12,objective:"حدّد نقطة البداية من أدلة بدل التخمين." },
  { id:"check-in",kind:"check-in",titleAr:"تهيئة سريعة",titleDe:"Ankommen",minutes:2,objective:"حدد طاقتك ووقت الجلسة." },
  { id:"review",kind:"review",titleAr:"استرجاع نشط",titleDe:"Abrufen",minutes:6,objective:"استرجع العبارات قبل رؤية الحل." },
  { id:"lesson",kind:"lesson",titleAr:"هدف اليوم",titleDe:"Lernen",minutes:18,objective:"تعلم هدفًا واحدًا ثم انقله إلى استعمال جديد." },
  { id:"practice",kind:"practice",titleAr:"تثبيت موجّه",titleDe:"Üben",minutes:8,objective:"طبّق القاعدة في أكثر من نوع سؤال." },
  { id:"production",kind:"production",titleAr:"مهمتك الإنتاجية",titleDe:"Selbst produzieren",minutes:8,objective:"اكتب أو تحدث دون نسخ نموذج كامل." },
  { id:"reflection",kind:"reflection",titleAr:"إغلاق الجلسة",titleDe:"Rückblick",minutes:3,objective:"قيّم ثقتك وحدد ما يحتاج مراجعة." },
];

const sessionTemplates:Record<number,Array<[MissionBlock["id"],number]>>={
  10:[["check-in",1],["review",3],["production",4],["reflection",2]],
  20:[["check-in",2],["review",4],["lesson",7],["production",4],["reflection",3]],
  30:[["check-in",2],["review",5],["lesson",12],["practice",4],["production",4],["reflection",3]],
  45:[["check-in",2],["review",6],["lesson",18],["practice",8],["production",8],["reflection",3]],
  60:[["check-in",3],["review",10],["lesson",22],["practice",10],["production",10],["reflection",5]],
  90:[["check-in",5],["review",15],["lesson",30],["practice",15],["production",18],["reflection",7]],
};

const productionObjectiveByGoal:Record<LearnerGoal,string>={
  exam:"طبّق هدف اليوم تحت قيد واضح قريب من مهام B2، دون نسخ نموذج كامل.",
  work:"انقل هدف اليوم إلى رسالة أو اجتماع أو موقف مهني قابل للاستعمال.",
  study:"انقل هدف اليوم إلى شرح أو ملاحظة أو عرض مرتبط بالدراسة.",
  "daily-life":"استعمل هدف اليوم في موقف سكن أو خدمة أو موعد من الحياة اليومية.",
  settlement:"استعمل هدف اليوم في موقف تنقل أو إدارة أو استقرار، دون تحويله إلى استشارة قانونية.",
};

function productionObjective(state:LearningState){const goals:LearnerGoal[]=state.profile?.goals??["exam"];const primary=goals.find((goal)=>goal!=="exam")??goals[0]??"exam";return productionObjectiveByGoal[primary]}

export type CoachTarget={kind:"diagnostic"|"review"|"errors"|"lesson"|"assessment"|"exam"|"progress";href:string;titleAr:string;titleDe:string;reasonAr:string};

export function getCoachTarget(state:LearningState,now=new Date()):CoachTarget{
  if(!state.diagnosticResult&&state.profile?.priorExperience==="none"){const first=curriculum.find((lesson)=>lesson.level==="A1"&&lesson.status==="published");if(first)return{kind:"lesson",href:`/lernen/${first.id}`,titleAr:"ابدأ من الصفر: أول تحية",titleDe:first.titleDe,reasonAr:"اخترت أنك لا تعرف الألمانية بعد؛ لذلك نتجاوز التشخيص والكتابة ونبدأ بأول عبارات مفهومة خطوة خطوة."}}
  if(!state.diagnosticResult)return{kind:"diagnostic",href:"/diagnostic",titleAr:"تشخيص نقطة البداية",titleDe:"Einstufung",reasonAr:"لديك خبرة سابقة أو غير مؤكدة؛ نستخدم عينة قصيرة حتى لا نضعك في درس سهل أو صعب بالتخمين."};
  const dueReviews=state.dueReviews;
  if(dueReviews>=20)return{kind:"review",href:"/review",titleAr:"أوقف تراكم النسيان",titleDe:"Fällige Wiederholung",reasonAr:`لديك ${dueReviews} بطاقة مستحقة، والمراجعة الآن أهم من إضافة قاعدة جديدة.`};
  const activeErrors=state.errors.filter((error)=>!error.resolved);
  const dueErrors=activeErrors.filter((error)=>errorRepairState(error,now)==="due");
  if(dueErrors.length)return{kind:"errors",href:"/errors",titleAr:"اختبر علاج الخطأ المؤجل",titleDe:"Fehler-Retest",reasonAr:`حان استرجاع ${dueErrors.length} تصحيحات دون كشف قبل إضافة تدريب امتحاني.`};
  const clinics=buildErrorClinics(activeErrors);
  if(clinics.length)return{kind:"errors",href:"/errors",titleAr:clinics[0].titleAr,titleDe:"Fehlerklinik",reasonAr:`تجمعت ${clinics[0].evidenceCount} أدلة من النوع نفسه؛ أكمل القاعدة وتمرين النقل أولًا.`};
  const published=curriculum.filter((lesson)=>lesson.status==="published");
  const unfinishedA1=published.find((lesson)=>lesson.level==="A1"&&!state.completedLessonIds.includes(lesson.id));
  if(unfinishedA1)return{kind:"lesson",href:`/lernen/${unfinishedA1.id}`,titleAr:unfinishedA1.titleAr,titleDe:unfinishedA1.titleDe,reasonAr:`الخطوة التالية غير المكتملة في المسار: ${unfinishedA1.objectiveAr}`};
  if((state.mastery["level-a1-ready"]??0)<100)return{kind:"assessment",href:"/assessment/a1",titleAr:"بوابة الانتقال إلى A2",titleDe:"A1-Abschluss",reasonAr:"أكملت محتوى A1؛ نحتاج اختبار المعرفة وأدلة الكتابة والمحادثة قبل الانتقال."};
  const unfinishedA2=published.find((lesson)=>lesson.level==="A2"&&!state.completedLessonIds.includes(lesson.id));
  if(unfinishedA2)return{kind:"lesson",href:`/lernen/${unfinishedA2.id}`,titleAr:unfinishedA2.titleAr,titleDe:unfinishedA2.titleDe,reasonAr:`أول هدف A2 غير مكتمل: ${unfinishedA2.objectiveAr}`};
  const allA2Published=curriculum.filter((lesson)=>lesson.level==="A2").every((lesson)=>lesson.status==="published");
  if(allA2Published&&(state.mastery["level-a2-ready"]??0)<100)return{kind:"assessment",href:"/assessment/a2",titleAr:"بوابة الانتقال إلى B1",titleDe:"A2-Abschluss",reasonAr:"أكملت محتوى A2؛ نحتاج اختبار المعرفة وأدلة الكتابة والمحادثة قبل B1."};
  const unfinishedB1=published.find((lesson)=>lesson.level==="B1"&&!state.completedLessonIds.includes(lesson.id));
  if(unfinishedB1)return{kind:"lesson",href:`/lernen/${unfinishedB1.id}`,titleAr:unfinishedB1.titleAr,titleDe:unfinishedB1.titleDe,reasonAr:`أول هدف B1 غير مكتمل: ${unfinishedB1.objectiveAr}`};
  const allB1Published=curriculum.filter((lesson)=>lesson.level==="B1").every((lesson)=>lesson.status==="published");
  if(allB1Published&&(state.mastery["level-b1-ready"]??0)<100)return{kind:"assessment",href:"/assessment/b1",titleAr:"بوابة الانتقال إلى B2",titleDe:"B1-Abschluss",reasonAr:"أكملت محتوى B1؛ نحتاج اختبار المعرفة وأدلة الكتابة والمحادثة قبل B2."};
  const nextLesson=published.find((lesson)=>!state.completedLessonIds.includes(lesson.id));
  if(nextLesson)return{kind:"lesson",href:`/lernen/${nextLesson.id}`,titleAr:nextLesson.titleAr,titleDe:nextLesson.titleDe,reasonAr:`أول هدف منشور بعد البوابة: ${nextLesson.objectiveAr}`};
  const allB2Published=curriculum.filter((lesson)=>lesson.level==="B2").every((lesson)=>lesson.status==="published");
  if(allB2Published&&(state.mastery["level-b2-ready"]??0)<100)return{kind:"assessment",href:"/assessment/b2",titleAr:"بوابة الجاهزية النهائية B2",titleDe:"B2-Abschluss",reasonAr:"أكملت دروس A1–B2؛ نحتاج اختبار المعرفة وأدلة الكتابة والمحادثة قبل إعلان اكتمال جاهزية المنهج داخليًا."};
  const provider=state.profile?.targetExam??"goethe-b2";
  const examReadiness=buildExamReadiness(state,provider);
  if(examReadiness.readyModuleCount<examReadiness.totalModules){const weakest=examReadiness.weakestModule;return{kind:"exam",href:weakest.nextHref,titleAr:`قوِّ وحدة ${weakest.titleAr}`,titleDe:`Prüfungstraining · ${weakest.titleDe}`,reasonAr:`${weakest.statusAr}: لديك ${weakest.attemptedTasks}/${weakest.requiredSamples} من العينة الدنيا في ${weakest.titleAr} ضمن ${provider==="goethe-b2"?"Goethe":"telc"}. نختار مهمة من الجهة نفسها دون خلط أو تحويلها إلى نقاط رسمية.`}}
  return{kind:"progress",href:"/progress",titleAr:"راجع ملف إنجاز B2",titleDe:"B2-Evidenzprofil",reasonAr:"أكملت المنهج وبوابة B2 الداخلية، وكل وحدات الجهة المختارة تملك دليلًا تدريبيًا قويًا. راجع الملف مع إبقاء النتائج غير رسمية."};
}

export function composeTodayMission(state:LearningState,now=new Date()):MissionBlock[]{
  if(!state.diagnosticResult&&state.profile?.priorExperience==="none"){
    const budget=Math.min(30,effectiveSessionMinutes(state,now));const checkMinutes=budget<=10?1:2;const reflectionMinutes=budget<=10?2:budget<=20?3:4;const lessonMinutes=budget-checkMinutes-reflectionMinutes;const target=getCoachTarget(state,now);
    return baseBlocks.filter((block)=>["check-in","lesson","reflection"].includes(block.id)).map((block)=>block.id==="check-in"?{...block,minutes:checkMinutes,objective:"أخبرنا بطاقتك ووقتك؛ لا يوجد اختبار في جلسة الصفر."}:block.id==="lesson"?{...block,titleAr:"أول خطوة من الصفر",titleDe:target.titleDe,minutes:lessonMinutes,objective:target.reasonAr}:{...block,minutes:reflectionMinutes,objective:"اختم بما فهمته دون علامة أو مهمة كتابة."});
  }
  if(!state.diagnosticResult)return baseBlocks.filter((block)=>["diagnostic","reflection"].includes(block.id));
  const target=getCoachTarget(state,now);
  const minutes=effectiveSessionMinutes(state,now);
  const template=sessionTemplates[minutes]??sessionTemplates[45];
  let selected=template.map(([id,blockMinutes])=>{const block=baseBlocks.find((item)=>item.id===id);if(!block)throw new Error(`Unknown mission block: ${id}`);return{...block,minutes:blockMinutes}});
  if(state.completedLessonIds.length===0){const removed=selected.find((block)=>block.id==="review")?.minutes??0;selected=selected.filter((block)=>block.id!=="review");const recipientId=selected.some((block)=>block.id==="lesson")?"lesson":"production";selected=selected.map((block)=>block.id===recipientId?{...block,minutes:block.minutes+removed}:block)}
  return selected.map((block)=>block.id==="lesson"?{...block,titleDe:target.titleDe,objective:target.reasonAr}:block.id==="production"?{...block,objective:productionObjective(state)}:block);
}

export function missionRationale(state:LearningState):string{
  const target=getCoachTarget(state);
  if(!state.diagnosticResult&&state.profile?.priorExperience==="none")return"قلت إنك تبدأ من الصفر. لن نختبرك أو نطلب منك كتابة ألمانية الآن؛ مهمتك الأولى هي فهم التحية والاسم ثم تكرارهما بأمان.";
  if(target.kind==="diagnostic")return"لديك معرفة سابقة أو غير مؤكدة، لذلك نبدأ بتشخيص قصير حتى لا نضعك في مستوى سهل أو صعب اعتمادًا على التخمين.";
  return target.reasonAr;
}
