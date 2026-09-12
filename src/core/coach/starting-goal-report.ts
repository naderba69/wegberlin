import type { LearningState } from "@/types/learning";
import { getCoachTarget } from "./coach";

export const STARTING_GOAL_REPORT_POLICY_VERSION="evidence-linked-starting-goal-report-v1" as const;
export type StartingGoalRow={id:string;goalAr:string;evidenceAr:string;evidenceRef:string;boundaryAr:string};

export function buildStartingGoalReport(state:LearningState):{policyVersion:typeof STARTING_GOAL_REPORT_POLICY_VERSION;rows:StartingGoalRow[];evidenceBoundary:"reviewable-planning-report-no-level-certification-or-mastery"}{
 const target=getCoachTarget(state);const rows:StartingGoalRow[]=[{id:"next",goalAr:target.titleAr,evidenceAr:target.reasonAr,evidenceRef:`coach-target:${target.kind}:${target.href}`,boundaryAr:"هدف تخطيط يومي؛ لا يثبت مستوى أو إتقانًا."}];
 if(state.diagnosticResult)rows.push({id:"diagnostic",goalAr:`ابدأ تدريبًا مناسبًا لعينة ${state.diagnosticResult.estimatedLevel}`,evidenceAr:`أجبت عن ${state.diagnosticResult.questionsAnswered??state.diagnosticResult.maxScore} عناصر في عينة التشخيص، وكانت الثقة ${state.diagnosticResult.confidence==="high"?"مرتفعة":state.diagnosticResult.confidence==="medium"?"متوسطة":"محدودة"}.`,evidenceRef:`diagnostic:${state.diagnosticResult.completedAt}`,boundaryAr:"العينة تقترح نقطة بداية ولا تمنح شهادة CEFR."});
 else rows.push({id:"entry",goalAr:state.profile?.priorExperience==="none"?"ابدأ من أول تحية بلا اختبار":"اجمع عينة قصيرة قبل تحديد نقطة البداية",evidenceAr:state.profile?.priorExperience==="none"?"صرحت أنك لا تعرف الألمانية بعد.":"خبرتك السابقة غير مقاسة بعد.",evidenceRef:`profile-prior-experience:${state.profile?.priorExperience??"unset"}`,boundaryAr:"تصريح المتعلم سياق تخطيط، لا حكم قدرة."});
 const concern=state.profile?.onboardingContext?.concerns[0];if(concern)rows.push({id:"concern",goalAr:"أبقِ المهارة التي تقلقك ظاهرة في الخطة",evidenceAr:`اخترت ${concern} ضمن سياق البداية.`,evidenceRef:`onboarding-concern:${concern}`,boundaryAr:"قلق مصرّح به ذاتيًا؛ لا نستنتج حالة نفسية أو ضعفًا لغويًا."});
 return{policyVersion:STARTING_GOAL_REPORT_POLICY_VERSION,rows,evidenceBoundary:"reviewable-planning-report-no-level-certification-or-mastery"};
}
