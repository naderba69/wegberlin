import { curriculum } from "@/data/curriculum";
import { buildExamReadiness } from "@/core/exams/readiness";
import type { LearningState } from "@/types/learning";

export const JOURNEY_STATE_POLICY_VERSION = "journey-state-machine-v1" as const;
export type JourneyPhaseId = "orientation" | "foundation" | "growth" | "consolidation" | "exam-readiness";

export const journeyPhases: Array<{ id:JourneyPhaseId;titleAr:string;titleDe:string }> = [
  { id:"orientation",titleAr:"تحديد نقطة البداية",titleDe:"Orientierung" },
  { id:"foundation",titleAr:"بناء الأساس",titleDe:"Grundlage" },
  { id:"growth",titleAr:"توسيع القدرة",titleDe:"Aufbau" },
  { id:"consolidation",titleAr:"تثبيت B2",titleDe:"Festigung" },
  { id:"exam-readiness",titleAr:"الاستعداد للامتحان",titleDe:"Prüfungsreife" },
];

export type JourneyState = {
  policyVersion: typeof JOURNEY_STATE_POLICY_VERSION;
  phaseId: JourneyPhaseId;
  phaseIndex: number;
  titleAr: string;
  titleDe: string;
  progressPercent: number;
  reasonAr: string;
  nextTransitionAr: string;
  evidenceBoundaryAr: string;
};

function completedIn(state:LearningState,levels:string[]) {
  return curriculum.filter((lesson)=>levels.includes(lesson.level)&&state.completedLessonIds.includes(lesson.id)).length;
}

function gateReady(state:LearningState,level:"a1"|"a2"|"b1"|"b2") {
  return (state.mastery[`level-${level}-ready`]??0)>=100;
}

function phaseDefinition(id:JourneyPhaseId) {
  return journeyPhases.find((phase)=>phase.id===id)!;
}

export function deriveJourneyState(state:LearningState):JourneyState {
  const needsOrientation=!state.profile||(!state.diagnosticResult&&state.profile.priorExperience!=="none");
  let phaseId:JourneyPhaseId;
  let progressPercent=0;
  let reasonAr:string;
  let nextTransitionAr:string;

  if(needsOrientation){
    phaseId="orientation";
    progressPercent=state.profile?50:0;
    reasonAr=state.profile?"حُفظت تفضيلاتك؛ بقي تحديد نقطة البداية دون افتراض مستوى قطعي.":"نحتاج تفضيلاتك وخبرتك قبل تركيب أول جلسة مناسبة.";
    nextTransitionAr=state.profile?"أكمل التشخيص القصير أو اختر بداية الصفر بوضوح.":"أكمل التهيئة المحلية ثم انتقل إلى نقطة البداية.";
  }else if(!gateReady(state,"a2")){
    phaseId="foundation";
    const lowerCompleted=completedIn(state,["A1","A2"]);
    const evidenceUnits=lowerCompleted+(gateReady(state,"a1")?1:0)+(gateReady(state,"a2")?1:0);
    progressPercent=Math.round(evidenceUnits/50*100);
    reasonAr="هذه المرحلة تبني A1 وA2 مع الاسترجاع والإنتاج والبوابات، لا بمجرد تصفح الدروس.";
    nextTransitionAr="تنتقل إلى التوسيع بعد إكمال A1 وA2 واجتياز بوابتي الأدلة الداخليتين.";
  }else{
    const upperCompleted=completedIn(state,["B1","B2"]);
    const allUpperComplete=upperCompleted===36;
    if(!allUpperComplete){
      phaseId="growth";
      progressPercent=Math.round((upperCompleted+(gateReady(state,"b1")?1:0))/37*100);
      reasonAr="توسع الآن الاستقلال اللغوي عبر B1 وB2 مع مهام نقل وكتابة ومحادثة.";
      nextTransitionAr="تبدأ مرحلة التثبيت بعد إكمال دروس B1 وB2، مع بقاء بوابة B1 شرطًا للمسار.";
    }else if(!gateReady(state,"b2")){
      phaseId="consolidation";
      progressPercent=Math.max(0,Math.min(99,Math.round(state.mastery["level-b2-ready"]??0)));
      reasonAr="اكتمل مسار الدروس؛ المطلوب الآن تثبيت المعرفة وأدلة الكتابة والمحادثة في بوابة B2 الداخلية.";
      nextTransitionAr="تنتقل للاستعداد الامتحاني بعد بوابة B2 الداخلية، دون ادعاء شهادة رسمية.";
    }else{
      phaseId="exam-readiness";
      const provider=state.profile?.targetExam??"goethe-b2";
      const readiness=buildExamReadiness(state,provider);
      progressPercent=Math.round(readiness.readyModuleCount/Math.max(1,readiness.totalModules)*100);
      reasonAr=`هذه المرحلة تعالج وحدات ${provider==="goethe-b2"?"Goethe":"telc"} كلًا على حدة من أدلة الجهة نفسها.`;
      nextTransitionAr=readiness.readyModuleCount===readiness.totalModules?"راجع ملف الأدلة وخطط لمراجعة بشرية؛ المؤشر ليس نتيجة امتحان رسمية.":`قوِّ أضعف وحدة حتى تملك ${readiness.totalModules}/${readiness.totalModules} وحدات بدليل تدريبي قوي.`;
    }
  }

  const definition=phaseDefinition(phaseId);
  return{
    policyVersion:JOURNEY_STATE_POLICY_VERSION,
    phaseId,
    phaseIndex:journeyPhases.findIndex((phase)=>phase.id===phaseId),
    titleAr:definition.titleAr,
    titleDe:definition.titleDe,
    progressPercent,
    reasonAr,
    nextTransitionAr,
    evidenceBoundaryAr:"مرحلة مشتقة من أدلة محلية وبوابات داخلية؛ ليست حكم CEFR أو ضمان نجاح امتحان.",
  };
}
