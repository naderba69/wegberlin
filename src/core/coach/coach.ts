import type { LearnerGoal, LearningConcern, LearningState, MissionBlock } from "@/types/learning";
import { buildLevelEvidenceGate, diagnosticSuggestsChallenge } from "@/core/assessment/level-evidence";
import { lessonEvidenceGate } from "@/core/lessons/evidence-gate";
import { independentProductionTasks } from "@/data/independent-production-tasks";
import { dailyReviewQuota } from "@/core/review/daily-quota";
import { isPlannedRestDay } from "./study-calendar";
import { studyPhase } from "./study-phase";
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
  { id:"exam",kind:"exam",titleAr:"مهمة امتحانية جزئية",titleDe:"Prüfungsaufgabe",minutes:15,objective:"طبّق جزءًا محددًا من صيغة الجهة المختارة؛ هذه كتلة تدريب وليست محاكاة كاملة.",evidenceKind:"exam-practice",href:"/exams" },
  { id:"reflection",kind:"reflection",titleAr:"إغلاق الجلسة",titleDe:"Rückblick",minutes:3,objective:"قيّم ثقتك وحدد ما يحتاج مراجعة.",evidenceKind:"planning-reflection" },
];

const sessionTemplates:Record<number,Array<[MissionBlock["id"],number]>>={
  10:[["check-in",1],["review",3],["production",4],["reflection",2]],
  20:[["check-in",2],["review",4],["lesson",7],["production",4],["reflection",3]],
  30:[["check-in",2],["review",5],["lesson",12],["practice",4],["production",4],["reflection",3]],
  45:[["check-in",2],["review",6],["lesson",18],["practice",8],["production",8],["reflection",3]],
  60:[["check-in",3],["review",10],["lesson",22],["practice",10],["production",10],["reflection",5]],
  90:[["check-in",2],["review",12],["lesson",23],["practice",10],["production",25],["exam",15],["reflection",3]],
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

export type CoachTarget={kind:"diagnostic"|"review"|"errors"|"lesson"|"assessment"|"exam"|"progress"|"rest";href:string;titleAr:string;titleDe:string;reasonAr:string};

export function getCoachTarget(state:LearningState,now=new Date()):CoachTarget{
  if(isPlannedRestDay(state,now))return{kind:"rest",href:"/today#session-check-in",titleAr:"راحة مخططة؛ جلسة اختيارية فقط",titleDe:"Geplante Pause",reasonAr:"اليوم خارج أيام الدراسة التي اخترتها أو الأحد الافتراضي. لا دين ولا دليل وهمي؛ ابدأ تهيئة صريحة إذا رغبت في جلسة اختيارية."};
  if(!state.diagnosticResult&&state.profile?.priorExperience!=="none")return{kind:"diagnostic",href:"/diagnostic",titleAr:"تشخيص نقطة البداية",titleDe:"Einstufung",reasonAr:"نجمع عينة محافظة؛ النتيجة توجه إلى تحدّي تجاوز ولا تمنح إكمالًا أو شهادة."};
  const dueReviews=buildDueReviewQueue(state,now).length;
  if(dueReviews>=20&&!dailyReviewQuota(state,now).reached)return{kind:"review",href:"/review",titleAr:"استرجاع مستحق ضمن الوقت",titleDe:"Fällige Wiederholung",reasonAr:`لديك ${dueReviews} بطاقات مستحقة فعلًا. خذ حصة محدودة من المراجعة، ولا تُلغِ الإنتاج أو تحوّل التراكم إلى دين.`};
  const activeErrors=state.errors.filter(error=>!error.resolved);
  const dueErrors=activeErrors.filter(error=>errorRepairState(error,now)==="due");
  if(dueErrors.length)return{kind:"errors",href:"/errors",titleAr:"اختبر علاج الخطأ المؤجل",titleDe:"Fehler-Retest",reasonAr:`حان استرجاع ${dueErrors.length} تصحيحات دون كشف قبل إضافة معرفة جديدة.`};
  const clinics=buildErrorClinics(activeErrors);
  if(clinics.length)return{kind:"errors",href:"/errors",titleAr:clinics[0].titleAr,titleDe:"Fehlerklinik",reasonAr:`تجمعت ${clinics[0].evidenceCount} أدلة من النوع نفسه؛ أكمل علاجًا قصيرًا ومهمة نقل.`};
  for(const level of ["A1","A2","B1","B2"] as const){
    const gate=buildLevelEvidenceGate(state,level,now);
    if(gate.passed)continue;
    if(diagnosticSuggestsChallenge(state,level)&&!gate.latestRun)return{kind:"assessment",href:`/assessment/${level.toLowerCase()}`,titleAr:`تحدّي تجاوز أهداف ${level}`,titleDe:`Nachweis · ${level}`,reasonAr:"نتيجة التشخيص ترجح أن لديك معرفة سابقة. نختبر أهداف المستوى بعينة مستقلة قبل اختصار المسار؛ لا نكمل دروسًا بالتخمين."};
    const unfinished=curriculum.find(lesson=>lesson.level===level&&lesson.status==="published"&&!state.completedLessonIds.includes(lesson.id));
    if(unfinished&&!gate.placement){
      const lesson=academicLessons[unfinished.id];
      const activity=lessonEvidenceGate(lesson,state);
      if(activity.basicTrainingPassed){
        const missing=activity.criteria.find(item=>!item.passed);
        if(missing&&["writing","speaking","mediation"].includes(missing.id)){
          const technical=missing.id==="speaking"&&["unavailable","permission-denied"].includes(state.profile?.deviceReadiness?.microphone??"");
          if(!technical)return{kind:"lesson",href:`/${missing.id==="speaking"?"speaking":missing.id==="writing"?"writing":"mediation"}?lesson=${lesson.id}`,titleAr:missing.labelAr,titleDe:lesson.titleDe,reasonAr:"أنجزت التدريب الأساسي. تبقى مهمة إنتاج مرتبطة بالدرس؛ المشاركة لا تعني صحة اللغة. المراجعة المعجمية متاحة الآن."};
          const next=curriculum.find(item=>item.level===level&&item.order>unfinished.order&&!lessonEvidenceGate(academicLessons[item.id],state).basicTrainingPassed);
          if(next)return{kind:"lesson",href:`/lernen/${next.id}`,titleAr:next.titleAr,titleDe:next.titleDe,reasonAr:"الميكروفون غير متاح. نواصل التعلّم دون تسجيل خطأ لغة أو الادعاء بأن الكلام أُثبت؛ تبقى المهمة الصوتية معلقة."};
        }
      }
      return{kind:"lesson",href:`/lernen/${unfinished.id}`,titleAr:unfinished.titleAr,titleDe:unfinished.titleDe,reasonAr:`الهدف غير المكتمل: ${unfinished.objectiveAr}. يمكنك تقسيم مراحله على جلسات دون إكمال وهمي.`};
    }
    const tasks=independentProductionTasks.filter(task=>task.level===level);
    if(gate.criteria.knowledge&&!gate.criteria.writing){const task=tasks.find(task=>!state.writingSubmissions.some(item=>item.taskId===`${task.id}-writing`&&item.status!=="draft"))??tasks[0];return{kind:"lesson",href:`/writing?task=${task.id}`,titleAr:`كتابة مستقلة جديدة · ${level}`,titleDe:"Unabhängige Schreibaufgabe",reasonAr:`لديك ${gate.writing}/${gate.requiredProductiveSamples} مهام كتابة مستقلة حديثة. التنقيح للمهمة نفسها لا يضاعف العينة.`};}
    if(gate.criteria.knowledge&&!gate.criteria.speaking){const task=tasks.find(task=>!state.speakingAttempts.some(item=>item.taskId===`${task.id}-speaking`))??tasks[0];return{kind:"lesson",href:`/speaking?task=${task.id}`,titleAr:`كلام مستقل جديد · ${level}`,titleDe:"Unabhängige Sprechaufgabe",reasonAr:`لديك ${gate.speaking}/${gate.requiredProductiveSamples} مهام كلام مستقلة حديثة؛ نخفي العبارات النموذجية أثناء التسجيل ولا نقيّم الطلاقة آليًا.`};}
    if(gate.criteria.knowledge&&!gate.criteria.retention&&buildDueReviewQueue(state,now).length)return{kind:"review",href:"/review",titleAr:"ثبّت عينة احتفاظ مؤجل",titleDe:"Verzögerter Abruf",reasonAr:"النجاح القريب لا يكفي؛ نحتاج استرجاعًا مؤجلًا من ثلاثة دروس أو صيغة معرفة بديلة بعد ثلاثة أيام."};
    return{kind:"assessment",href:`/assessment/${level.toLowerCase()}`,titleAr:`راجع بوابة الانتقال ${level}`,titleDe:`Lernnachweis · ${level}`,reasonAr:"البوابة تعرض المعرفة المستقلة، تنوع الإنتاج وحداثته، والاحتفاظ منفصلين. اختيار البداية من الصفر بديل صحيح للتشخيص."};
  }
  const provider=state.profile?.targetExam??"goethe-b2";
  const readiness=buildExamReadiness(state,provider,now);
  if(readiness.readyModuleCount<readiness.totalModules){const weakest=readiness.weakestModule;if(weakest.status==="quality-unverified")return{kind:"progress",href:"/progress#productive-evidence",titleAr:"راجع جودة الإنتاج والتفاعل غير المحسومة",titleDe:"Produktive Qualität bleibt offen",reasonAr:"أكملت عينة تدريب، لكن الكمية والإعادة لا تثبتان الجودة. راجع النصوص والتسجيلات والتفاعل مع مستمع أو شريك حقيقي؛ لا نكرر المهمة لمجرد رفع عدد."};return{kind:"exam",href:weakest.nextHref,titleAr:`راجع وحدة ${weakest.titleAr}`,titleDe:`Prüfungstraining · ${weakest.titleDe}`,reasonAr:`${weakest.statusAr}. جودة الكتابة والكلام لا تثبت من عدد المحاولات أو إعادة واحدة؛ لا نحول التغطية إلى حكم نجاح.`};}
  return{kind:"progress",href:"/progress",titleAr:"راجع ملف الأدلة وحدوده",titleDe:"Evidenzprofil",reasonAr:"راجع الفهم والاستقلال والاحتفاظ وجودة الإنتاج كلًا على حدة؛ لا توجد شهادة تلقائية."};
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
  if(isPlannedRestDay(state,now)){const check=baseBlocks.find(block=>block.id==="check-in")!;return[{...check,minutes:0,titleAr:"راحة؛ ابدأ جلسة اختيارية فقط إذا رغبت",objective:"لا توجد دراسة مفروضة اليوم. حفظ التهيئة يبدأ جلسة اختيارية بميزانية تختارها."}];}
  if(studyPhase(state,now).id==="entry"&&state.profile?.priorExperience==="none"){
    const budget=Math.min(30,effectiveSessionMinutes(state,now));const checkMinutes=budget<=10?1:2;const reflectionMinutes=budget<=10?2:budget<=20?3:4;const hasRecallMaterial=Object.values(state.lessonProgress).some((stage)=>stage>=2)||state.exerciseAttempts.length>0;const warmupMinutes=hasRecallMaterial?(budget<=10?2:3):0;const lessonMinutes=budget-checkMinutes-reflectionMinutes-warmupMinutes;const target=getCoachTarget(state,now);
    const ids=hasRecallMaterial?["check-in","warmup","lesson","reflection"]:["check-in","lesson","reflection"];
    const beginnerMission=baseBlocks.filter((block)=>ids.includes(block.id)).map((block)=>block.id==="check-in"?{...block,minutes:checkMinutes,objective:"أخبرنا بطاقتك ووقتك؛ لا يوجد اختبار في جلسة الصفر."}:block.id==="warmup"?{...block,minutes:warmupMinutes}:block.id==="lesson"?{...block,titleAr:"أول خطوة من الصفر",titleDe:target.titleDe,minutes:lessonMinutes,objective:target.reasonAr,href:target.href}:{...block,minutes:reflectionMinutes,objective:"اختم بما فهمته دون علامة أو مهمة كتابة."});
    return applySelectedMissionAlternatives(state,applySessionRitualPreferences(state,beginnerMission),now);
  }
  if(!state.diagnosticResult&&state.profile?.priorExperience!=="none")return applySelectedMissionAlternatives(state,applySessionRitualPreferences(state,baseBlocks.filter((block)=>["diagnostic","reflection"].includes(block.id))),now);
  const target=getCoachTarget(state,now);
  const phase=studyPhase(state,now);
  const minutes=effectiveSessionMinutes(state,now);
  const template=sessionTemplates[minutes]??sessionTemplates[45];
  let selected=template.map(([id,blockMinutes])=>{const block=baseBlocks.find((item)=>item.id===id);if(!block)throw new Error(`Unknown mission block: ${id}`);return{...block,minutes:blockMinutes}});
  if(buildDueReviewQueue(state,now).length===0){const warmup=baseBlocks.find((block)=>block.id==="warmup")!;selected=selected.map((block)=>block.id==="review"?{...warmup,minutes:block.minutes}:block)}
  selected=selected.map(block=>block.id==="exam"&&!phase.examSpecific?{...block,kind:"practice" as const,titleAr:"مهمة فهم من مستواك",titleDe:"Aufgaben verstehen",evidenceKind:"controlled-practice" as const,objective:"تدرّب على تعليمات وفهم مناسبين لمستواك، لا ورقة B2 كاملة.",href:`/practice/endurance?level=${phase.level}`}:block.id==="production"?{...block,href:target.href.startsWith("/speaking")?target.href:`/speaking?lesson=${state.currentLessonId}`,objective:minutes===90?"إنتاج شفهي مسجّل: نمذجة قصيرة ثم إعادة قول، وإصلاح المقطع الصعب. وقت هذه الكتلة 25 دقيقة ولا تمنح درجة طلاقة.":productionObjective(state)}:block);
  const date=localSessionDate(now);const completed=new Set(state.completedBlockIds.filter((id)=>id.startsWith(`${date}:`)).map((id)=>id.slice(date.length+1)));
  const lessonIndex=selected.findIndex((block)=>block.id==="lesson");const lessonBlock=selected[lessonIndex];const readingMinutes=target.kind==="lesson"&&lessonBlock&&!completed.has("lesson")&&!completed.has("reading-calibrated")?calibratedReadingBlockMinutes(state,lessonBlock.minutes):0;
  if(lessonBlock&&readingMinutes>0){const reading={...baseBlocks.find((block)=>block.id==="reading-calibrated")!,minutes:readingMinutes};selected.splice(lessonIndex,1,{...lessonBlock,minutes:lessonBlock.minutes-readingMinutes},reading)}
  if(state.dailySessions[date]?.planningSignal==="too-easy"&&!completed.has("practice")&&!completed.has("production")){const practice=selected.find((block)=>block.id==="practice"),production=selected.find((block)=>block.id==="production");if(practice&&production&&practice.minutes>1){const transfer=Math.min(3,practice.minutes-1);selected=selected.map((block)=>block.id==="practice"?{...block,minutes:block.minutes-transfer,objective:"اختبر القاعدة سريعًا ثم انتقل إلى نقل أصعب؛ إشارة السهولة لا تمنح إتقانًا."}:block.id==="production"?{...block,minutes:block.minutes+transfer,objective:`${productionObjective(state)} اختر صياغة أبعد عن المثال لأنك أشرت إلى أن الحمل سهل.`}:block)}}
  const practice=selected.find((block)=>block.id==="practice"),production=selected.find((block)=>block.id==="production");const writingPool=(practice?.minutes??0)+(minutes===90?0:production?.minutes??0);let writingMinutes=!completed.has("practice")&&!completed.has("production")&&!completed.has("writing-calibrated")?calibratedWritingBlockMinutes(state,writingPool):0;
  if(writingMinutes>0&&production){const fromProduction=minutes===90?0:Math.min(writingMinutes,Math.max(0,production.minutes-2));writingMinutes-=fromProduction;const fromPractice=Math.min(writingMinutes,Math.max(0,(practice?.minutes??0)-1));const actualWriting=fromProduction+fromPractice;if(actualWriting>0){selected=selected.map((block)=>block.id==="production"?{...block,minutes:block.minutes-fromProduction}:block.id==="practice"?{...block,minutes:block.minutes-fromPractice}:block);const insertAt=selected.findIndex((block)=>block.id==="production");selected.splice(insertAt,0,{...baseBlocks.find((block)=>block.id==="writing-calibrated")!,minutes:actualWriting})}}
  const contextualized=selected.map((block)=>block.id==="lesson"?{...block,titleDe:target.titleDe,objective:target.reasonAr,href:target.href}:block.id==="production"?{...block,objective:block.objective===baseBlocks.find((item)=>item.id==="production")?.objective?productionObjective(state):block.objective}:block);
  return applySelectedMissionAlternatives(state,applySessionRitualPreferences(state,contextualized),now);
}

const concernPlanningCopy:Record<LearningConcern,string>={speaking:"ذكرت أن الكلام يقلقك؛ سنبقي المحاولة قصيرة مع تحضير واستماع ذاتي.",listening:"ذكرت أن فهم المسموع يقلقك؛ سنبني الاستماع على ثلاث مرات وأهداف محددة.",writing:"ذكرت أن الكتابة تقلقك؛ سنبدأ بقالب قصير وتصحيح محلي محدود وصادق.",grammar:"ذكرت أن القواعد تقلقك؛ سنعرض المعنى والدور قبل اسم القاعدة والشكل.",pronunciation:"ذكرت أن النطق يقلقك؛ سنستعمل المقارنة والشرح البصري دون درجة نطق زائفة.",exam:"ذكرت أن الامتحان يقلقك؛ لن نخلط بين Goethe وtelc وسنؤجل المحاكاة حتى تتوفر الأدلة.",time:"ذكرت ضيق الوقت؛ ستبقى كل جلسة قابلة لإعادة التركيب دون دين متراكم.",technology:"ذكرت الجهاز أو الإنترنت؛ تحقق جاهزية Offline ظاهر قبل بدء المهمة."};
function concernPlanningNote(state:LearningState){const concern=state.profile?.onboardingContext?.concerns[0];return concern?` ${concernPlanningCopy[concern]}`:""}

export function missionRationale(state:LearningState):string{
  const target=getCoachTarget(state);const planningNote=concernPlanningNote(state);
  if(studyPhase(state).id==="entry"&&state.profile?.priorExperience==="none")return`قلت إنك تبدأ من الصفر. لن نختبرك أو نطلب منك كتابة ألمانية الآن؛ مهمتك الأولى هي فهم التحية والاسم ثم تكرارهما بأمان.${planningNote}`;
  if(target.kind==="diagnostic")return`لديك معرفة سابقة أو غير مؤكدة، لذلك نبدأ بتشخيص قصير حتى لا نضعك في مستوى سهل أو صعب اعتمادًا على التخمين.${planningNote}`;
  return`${target.reasonAr}${planningNote}`;
}
