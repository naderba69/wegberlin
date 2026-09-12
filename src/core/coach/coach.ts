import type { LearnerGoal, LearningConcern, LearningState, MissionBlock } from "@/types/learning";
import { curriculum } from "@/data/curriculum";
import { academicLessons } from "@/data/academic-lessons";
import { buildDueReviewQueue } from "@/core/srs/review-queue";
import { applySelectedMissionAlternatives, effectiveSessionMinutes, localSessionDate } from "./session-signals";
import { errorRepairState } from "@/core/errors/remediation";
import { buildErrorClinics } from "@/core/errors/clinic";
import { buildExamReadiness } from "@/core/exams/readiness";
import { calibratedReadingBlockMinutes } from "@/core/reading/benchmark";
import { calibratedWritingBlockMinutes } from "@/core/writing/device-benchmark";

const baseBlocks: MissionBlock[] = [
  { id:"diagnostic",kind:"diagnostic",titleAr:"اختبار نقطة البداية",titleDe:"Einstufung",minutes:12,objective:"حدّد نقطة البداية من أدلة بدل التخمين.",evidenceKind:"diagnostic-sample",href:"/diagnostic" },
  { id:"check-in",kind:"check-in",titleAr:"تهيئة سريعة",titleDe:"Ankommen",minutes:2,objective:"حدد طاقتك ووقت الجلسة.",evidenceKind:"planning-check-in" },
  { id:"review",kind:"review",titleAr:"استرجاع نشط",titleDe:"Abrufen",minutes:6,objective:"استرجع العبارات قبل رؤية الحل.",evidenceKind:"retrieval-process",href:"/review" },
  { id:"warmup",kind:"warmup",titleAr:"استرجاع تمهيدي بلا بطاقة",titleDe:"Abruf-Warm-up",minutes:6,objective:"حاول ثلاث عبارات من هدفك الحالي قبل الكشف؛ لا تُمنح درجة أو إتقانًا من هذا التمهيد.",evidenceKind:"retrieval-process" },
  { id:"lesson",kind:"lesson",titleAr:"هدف اليوم",titleDe:"Lernen",minutes:18,objective:"تعلم هدفًا واحدًا ثم انقله إلى استعمال جديد.",evidenceKind:"lesson-evidence" },
  { id:"reading-calibrated",kind:"reading",titleAr:"قراءة بطول مناسب",titleDe:"Lesen mit Verständnis",minutes:6,objective:"اقرأ نصًا مناسبًا لقياسك الأخير مع الحفاظ على الفهم؛ السرعة ليست درجة مستوى.",evidenceKind:"reading-comprehension",href:"/library" },
  { id:"writing-calibrated",kind:"writing",titleAr:"كتابة بزمن مناسب",titleDe:"Schreiben im passenden Tempo",minutes:8,objective:"اكتب مهمة قصيرة ضمن الزمن المخطط من سرعة الجهاز فقط؛ لا توجد درجة جودة آلية.",evidenceKind:"writing-production",href:"/writing" },
  { id:"practice",kind:"practice",titleAr:"تثبيت موجّه",titleDe:"Üben",minutes:8,objective:"طبّق القاعدة في أكثر من نوع سؤال.",evidenceKind:"controlled-practice",href:"/practice" },
  { id:"production",kind:"production",titleAr:"مهمتك الإنتاجية",titleDe:"Selbst produzieren",minutes:8,objective:"اكتب أو تحدث دون نسخ نموذج كامل.",evidenceKind:"productive-practice",href:"/speaking" },
  { id:"reflection",kind:"reflection",titleAr:"إغلاق الجلسة",titleDe:"Rückblick",minutes:3,objective:"قيّم ثقتك وحدد ما يحتاج مراجعة.",evidenceKind:"planning-reflection" },
];

const sessionTemplates:Record<number,Array<[MissionBlock["id"],number]>>={
  10:[["check-in",1],["review",3],["production",4],["reflection",2]],
  20:[["check-in",2],["review",4],["lesson",7],["production",4],["reflection",3]],
  30:[["check-in",2],["review",5],["lesson",12],["practice",4],["production",4],["reflection",3]],
  45:[["check-in",2],["review",6],["lesson",18],["practice",8],["production",8],["reflection",3]],
  60:[["check-in",3],["review",10],["lesson",22],["practice",10],["production",10],["reflection",5]],
  90:[["check-in",5],["review",15],["lesson",30],["practice",15],["production",18],["reflection",7]],
};

function applySessionRitualPreferences(state:LearningState,blocks:MissionBlock[]):MissionBlock[]{
  const hidden=new Set<string>();if(!state.sessionRitualPreferences.startEnabled)hidden.add("check-in");if(!state.sessionRitualPreferences.endEnabled)hidden.add("reflection");
  const released=blocks.filter((block)=>hidden.has(block.id)).reduce((sum,block)=>sum+block.minutes,0);const visible=blocks.filter((block)=>!hidden.has(block.id));if(!released||!visible.length)return visible;
  const recipientId=["production","lesson","diagnostic","practice","warmup","review"].find((id)=>visible.some((block)=>block.id===id))??visible[0].id;
  return visible.map((block)=>block.id===recipientId?{...block,minutes:block.minutes+released}:block);
}

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

export const RETRIEVAL_WARMUP_VERSION="pre-srs-retrieval-warmup-v1" as const;
export type RetrievalWarmupItem={id:string;lessonId:string;cueAr:string;answerDe:string;policyVersion:typeof RETRIEVAL_WARMUP_VERSION};

export function buildRetrievalWarmup(state:LearningState,now=new Date()):RetrievalWarmupItem[]{
  const target=getCoachTarget(state,now);
  const targetLessonId=target.href.match(/^\/lernen\/([ab][12]-\d{2})$/i)?.[1];
  const lesson=academicLessons[targetLessonId??state.currentLessonId]??academicLessons[state.currentLessonId]??academicLessons["a1-01"];
  return lesson.phrases.slice(0,3).map((phrase,index)=>({id:`warmup-${lesson.id}-${index+1}`,lessonId:lesson.id,cueAr:phrase.ar,answerDe:phrase.de,policyVersion:RETRIEVAL_WARMUP_VERSION}));
}

export function composeTodayMission(state:LearningState,now=new Date()):MissionBlock[]{
  if(!state.diagnosticResult&&state.profile?.priorExperience==="none"){
    const budget=Math.min(30,effectiveSessionMinutes(state,now));const checkMinutes=budget<=10?1:2;const reflectionMinutes=budget<=10?2:budget<=20?3:4;const hasRecallMaterial=Object.values(state.lessonProgress).some((stage)=>stage>=2)||state.exerciseAttempts.length>0;const warmupMinutes=hasRecallMaterial?(budget<=10?2:3):0;const lessonMinutes=budget-checkMinutes-reflectionMinutes-warmupMinutes;const target=getCoachTarget(state,now);
    const ids=hasRecallMaterial?["check-in","warmup","lesson","reflection"]:["check-in","lesson","reflection"];
    const beginnerMission=baseBlocks.filter((block)=>ids.includes(block.id)).map((block)=>block.id==="check-in"?{...block,minutes:checkMinutes,objective:"أخبرنا بطاقتك ووقتك؛ لا يوجد اختبار في جلسة الصفر."}:block.id==="warmup"?{...block,minutes:warmupMinutes}:block.id==="lesson"?{...block,titleAr:"أول خطوة من الصفر",titleDe:target.titleDe,minutes:lessonMinutes,objective:target.reasonAr,href:target.href}:{...block,minutes:reflectionMinutes,objective:"اختم بما فهمته دون علامة أو مهمة كتابة."});
    return applySelectedMissionAlternatives(state,applySessionRitualPreferences(state,beginnerMission),now);
  }
  if(!state.diagnosticResult)return applySelectedMissionAlternatives(state,applySessionRitualPreferences(state,baseBlocks.filter((block)=>["diagnostic","reflection"].includes(block.id))),now);
  const target=getCoachTarget(state,now);
  const minutes=effectiveSessionMinutes(state,now);
  const template=sessionTemplates[minutes]??sessionTemplates[45];
  let selected=template.map(([id,blockMinutes])=>{const block=baseBlocks.find((item)=>item.id===id);if(!block)throw new Error(`Unknown mission block: ${id}`);return{...block,minutes:blockMinutes}});
  if(buildDueReviewQueue(state,now).length===0){const warmup=baseBlocks.find((block)=>block.id==="warmup")!;selected=selected.map((block)=>block.id==="review"?{...warmup,minutes:block.minutes}:block)}
  const date=localSessionDate(now);const completed=new Set(state.completedBlockIds.filter((id)=>id.startsWith(`${date}:`)).map((id)=>id.slice(date.length+1)));
  const lessonIndex=selected.findIndex((block)=>block.id==="lesson");const lessonBlock=selected[lessonIndex];const readingMinutes=lessonBlock&&!completed.has("lesson")&&!completed.has("reading-calibrated")?calibratedReadingBlockMinutes(state,lessonBlock.minutes):0;
  if(lessonBlock&&readingMinutes>0){const reading={...baseBlocks.find((block)=>block.id==="reading-calibrated")!,minutes:readingMinutes};selected.splice(lessonIndex,1,{...lessonBlock,minutes:lessonBlock.minutes-readingMinutes},reading)}
  if(state.dailySessions[date]?.planningSignal==="too-easy"&&!completed.has("practice")&&!completed.has("production")){const practice=selected.find((block)=>block.id==="practice"),production=selected.find((block)=>block.id==="production");if(practice&&production&&practice.minutes>1){const transfer=Math.min(3,practice.minutes-1);selected=selected.map((block)=>block.id==="practice"?{...block,minutes:block.minutes-transfer,objective:"اختبر القاعدة سريعًا ثم انتقل إلى نقل أصعب؛ إشارة السهولة لا تمنح إتقانًا."}:block.id==="production"?{...block,minutes:block.minutes+transfer,objective:`${productionObjective(state)} اختر صياغة أبعد عن المثال لأنك أشرت إلى أن الحمل سهل.`}:block)}}
  const practice=selected.find((block)=>block.id==="practice"),production=selected.find((block)=>block.id==="production");const writingPool=(practice?.minutes??0)+(production?.minutes??0);let writingMinutes=!completed.has("practice")&&!completed.has("production")&&!completed.has("writing-calibrated")?calibratedWritingBlockMinutes(state,writingPool):0;
  if(writingMinutes>0&&production){const fromProduction=Math.min(writingMinutes,Math.max(0,production.minutes-2));writingMinutes-=fromProduction;const fromPractice=Math.min(writingMinutes,Math.max(0,(practice?.minutes??0)-1));const actualWriting=fromProduction+fromPractice;if(actualWriting>0){selected=selected.map((block)=>block.id==="production"?{...block,minutes:block.minutes-fromProduction}:block.id==="practice"?{...block,minutes:block.minutes-fromPractice}:block);const insertAt=selected.findIndex((block)=>block.id==="production");selected.splice(insertAt,0,{...baseBlocks.find((block)=>block.id==="writing-calibrated")!,minutes:actualWriting})}}
  const contextualized=selected.map((block)=>block.id==="lesson"?{...block,titleDe:target.titleDe,objective:target.reasonAr,href:target.href}:block.id==="production"?{...block,objective:block.objective===baseBlocks.find((item)=>item.id==="production")?.objective?productionObjective(state):block.objective}:block);
  return applySelectedMissionAlternatives(state,applySessionRitualPreferences(state,contextualized),now);
}

const concernPlanningCopy:Record<LearningConcern,string>={speaking:"ذكرت أن الكلام يقلقك؛ سنبقي المحاولة قصيرة مع تحضير واستماع ذاتي.",listening:"ذكرت أن فهم المسموع يقلقك؛ سنبني الاستماع على ثلاث مرات وأهداف محددة.",writing:"ذكرت أن الكتابة تقلقك؛ سنبدأ بقالب قصير وتصحيح محلي محدود وصادق.",grammar:"ذكرت أن القواعد تقلقك؛ سنعرض المعنى والدور قبل اسم القاعدة والشكل.",pronunciation:"ذكرت أن النطق يقلقك؛ سنستعمل المقارنة والشرح البصري دون درجة نطق زائفة.",exam:"ذكرت أن الامتحان يقلقك؛ لن نخلط بين Goethe وtelc وسنؤجل المحاكاة حتى تتوفر الأدلة.",time:"ذكرت ضيق الوقت؛ ستبقى كل جلسة قابلة لإعادة التركيب دون دين متراكم.",technology:"ذكرت الجهاز أو الإنترنت؛ تحقق جاهزية Offline ظاهر قبل بدء المهمة."};
function concernPlanningNote(state:LearningState){const concern=state.profile?.onboardingContext?.concerns[0];return concern?` ${concernPlanningCopy[concern]}`:""}

export function missionRationale(state:LearningState):string{
  const target=getCoachTarget(state);const planningNote=concernPlanningNote(state);
  if(!state.diagnosticResult&&state.profile?.priorExperience==="none")return`قلت إنك تبدأ من الصفر. لن نختبرك أو نطلب منك كتابة ألمانية الآن؛ مهمتك الأولى هي فهم التحية والاسم ثم تكرارهما بأمان.${planningNote}`;
  if(target.kind==="diagnostic")return`لديك معرفة سابقة أو غير مؤكدة، لذلك نبدأ بتشخيص قصير حتى لا نضعك في مستوى سهل أو صعب اعتمادًا على التخمين.${planningNote}`;
  return`${target.reasonAr}${planningNote}`;
}
