export const CONTENT_GOVERNANCE_POLICY = "content-accountability-lifecycle-v1" as const;
export const GOVERNED_CONTENT_RECORD_COUNT = 3_277 as const;
export const GOVERNED_SOURCE_COUNT = 18 as const;

export type ContentLifecycleStage="draft"|"validated"|"published";
export type ContentFamilyScope="diagnostic"|"exam"|"exam-speaking"|"exam-writing"|"lesson-controlled"|"lesson-listening"|"lesson-mediation"|"lesson-mini-test"|"lesson-reading"|"lesson-speaking"|"lesson-writing"|"library-listening"|"library-reading"|"practice-dictation"|"practice-branching"|"practice-collocation";

export type ContentFamilyGovernance={
  scope:ContentFamilyScope;
  labelAr:string;
  labelDe:string;
  ownerId:string;
  reviewerId:string;
  currentStage:"published";
  transitionOrder:readonly ["draft","validated","published"];
  validationEvidence:string;
  publicationEvidence:string;
  reviewStatus:"automated-validated-independent-review-pending";
  evidenceBoundary:"publication-state-does-not-claim-independent-language-cefr-or-rights-review";
};

const shared={
  currentStage:"published",
  transitionOrder:["draft","validated","published"],
  reviewStatus:"automated-validated-independent-review-pending",
  evidenceBoundary:"publication-state-does-not-claim-independent-language-cefr-or-rights-review",
} as const;

export const contentFamilyGovernance:readonly ContentFamilyGovernance[]=[
  {scope:"diagnostic",labelAr:"أسئلة التشخيص",labelDe:"Diagnostik",ownerId:"assessment-content-owner",reviewerId:"assessment-reviewer-role",validationEvidence:"strict diagnostic schema + answer integrity + audio ownership",publicationEvidence:"two complete A/B forms are reachable from /diagnostic",...shared},
  {scope:"exam",labelAr:"أسئلة الامتحان الاستقبالية",labelDe:"Prüfung rezeptiv",ownerId:"exam-content-owner",reviewerId:"exam-format-reviewer-role",validationEvidence:"provider/task schema + answer integrity + source ownership",publicationEvidence:"provider-scoped task routes are generated",...shared},
  {scope:"exam-speaking",labelAr:"مهام الكلام الامتحانية",labelDe:"Prüfung Sprechen",ownerId:"exam-content-owner",reviewerId:"productive-task-reviewer-role",validationEvidence:"productive-task contract + provider separation",publicationEvidence:"provider-owned speaking routes are generated",...shared},
  {scope:"exam-writing",labelAr:"مهام الكتابة الامتحانية",labelDe:"Prüfung Schreiben",ownerId:"exam-content-owner",reviewerId:"productive-task-reviewer-role",validationEvidence:"productive-task contract + provider separation",publicationEvidence:"provider-owned writing routes are generated",...shared},
  {scope:"lesson-controlled",labelAr:"تمارين الدروس المضبوطة",labelDe:"Gelenkte Übungen",ownerId:"curriculum-content-owner",reviewerId:"german-item-reviewer-role",validationEvidence:"strict exercise schema + type-aware answer integrity",publicationEvidence:"84 published lesson runners render the exercises",...shared},
  {scope:"lesson-listening",labelAr:"أسئلة استماع الدروس",labelDe:"Hören im Kurs",ownerId:"curriculum-content-owner",reviewerId:"listening-item-reviewer-role",validationEvidence:"question schema + transcript/audio references + answer integrity",publicationEvidence:"84 lesson listening stages are generated",...shared},
  {scope:"lesson-mediation",labelAr:"مهام الوساطة",labelDe:"Sprachmittlung",ownerId:"curriculum-content-owner",reviewerId:"productive-task-reviewer-role",validationEvidence:"productive-task contract + objective mapping",publicationEvidence:"84 lesson mediation tasks are reachable",...shared},
  {scope:"lesson-mini-test",labelAr:"اختبارات الدروس القصيرة",labelDe:"Mini-Tests",ownerId:"assessment-content-owner",reviewerId:"german-item-reviewer-role",validationEvidence:"strict question schema + answer integrity + evidence gate",publicationEvidence:"84 Mini-Test stages are generated",...shared},
  {scope:"lesson-reading",labelAr:"أسئلة قراءة الدروس",labelDe:"Lesen im Kurs",ownerId:"curriculum-content-owner",reviewerId:"reading-item-reviewer-role",validationEvidence:"question schema + literal source evidence + answer integrity",publicationEvidence:"84 reading stages are generated",...shared},
  {scope:"lesson-speaking",labelAr:"مهام كلام الدروس",labelDe:"Sprechen im Kurs",ownerId:"curriculum-content-owner",reviewerId:"productive-task-reviewer-role",validationEvidence:"productive-task contract + objective mapping",publicationEvidence:"84 speaking stages are reachable",...shared},
  {scope:"lesson-writing",labelAr:"مهام كتابة الدروس",labelDe:"Schreiben im Kurs",ownerId:"curriculum-content-owner",reviewerId:"productive-task-reviewer-role",validationEvidence:"productive-task contract + objective mapping",publicationEvidence:"84 writing stages are reachable",...shared},
  {scope:"library-listening",labelAr:"مكتبة الاستماع",labelDe:"Hörbibliothek",ownerId:"library-content-owner",reviewerId:"listening-item-reviewer-role",validationEvidence:"strict library schema + audio manifest + answer integrity",publicationEvidence:"80 listening library records are reachable",...shared},
  {scope:"library-reading",labelAr:"مكتبة القراءة",labelDe:"Lesebibliothek",ownerId:"library-content-owner",reviewerId:"reading-item-reviewer-role",validationEvidence:"strict library schema + answer integrity",publicationEvidence:"80 reading library records are reachable",...shared},
  {scope:"practice-dictation",labelAr:"الإملاء المتكيف",labelDe:"Adaptives Diktat",ownerId:"practice-content-owner",reviewerId:"listening-item-reviewer-role",validationEvidence:"strict partial/full dictation schema + canonical reconstruction + similarity review",publicationEvidence:"16 A1–B2 dictation tasks are reachable from /practice/dictation",...shared},
  {scope:"practice-branching",labelAr:"المحادثات المتفرعة",labelDe:"Verzweigte Dialoge",ownerId:"practice-content-owner",reviewerId:"productive-task-reviewer-role",validationEvidence:"strict deterministic tree schema + reachable choices and terminals + similarity review",publicationEvidence:"8 A1–B2 scenarios are reachable from /practice/conversation-paths",...shared},
  {scope:"practice-collocation",labelAr:"شبكات التلازم اللفظي",labelDe:"Kollokationsnetze",ownerId:"vocabulary-content-owner",reviewerId:"german-item-reviewer-role",validationEvidence:"strict network/node schema + stable ownership + similarity review",publicationEvidence:"16 networks and 48 links are reachable from /practice/collocations",...shared},
] as const;

export const riskOwnershipRegistry=[
  {riskId:"reviews",ownerId:"learning-evidence-owner",reviewerId:"srs-policy-reviewer-role"},
  {riskId:"error-retests",ownerId:"learning-evidence-owner",reviewerId:"error-policy-reviewer-role"},
  {riskId:"high-confidence-errors",ownerId:"learning-evidence-owner",reviewerId:"error-policy-reviewer-role"},
  {riskId:"error-clinic",ownerId:"learning-evidence-owner",reviewerId:"error-policy-reviewer-role"},
  {riskId:"errors",ownerId:"learning-evidence-owner",reviewerId:"error-policy-reviewer-role"},
  {riskId:"weak-reading",ownerId:"learning-evidence-owner",reviewerId:"reading-item-reviewer-role"},
  {riskId:"weak-listening",ownerId:"learning-evidence-owner",reviewerId:"listening-item-reviewer-role"},
  {riskId:"weak-grammar",ownerId:"learning-evidence-owner",reviewerId:"german-item-reviewer-role"},
  {riskId:"weak-writing",ownerId:"learning-evidence-owner",reviewerId:"productive-task-reviewer-role"},
  {riskId:"weak-speaking",ownerId:"learning-evidence-owner",reviewerId:"productive-task-reviewer-role"},
  {riskId:"missing-writing",ownerId:"learning-evidence-owner",reviewerId:"productive-task-reviewer-role"},
  {riskId:"missing-speaking",ownerId:"learning-evidence-owner",reviewerId:"productive-task-reviewer-role"},
] as const;

export function contentGovernanceForScope(scope:string){const row=contentFamilyGovernance.find((item)=>item.scope===scope);if(!row)throw new Error(`Unowned content scope: ${scope}`);return row}
export function governanceForRisk(riskId:string){const row=riskOwnershipRegistry.find((item)=>item.riskId===riskId);if(!row)throw new Error(`Unowned learner risk: ${riskId}`);return{policyVersion:CONTENT_GOVERNANCE_POLICY,...row,reviewStatus:"assigned-policy-review-pending" as const}}
export function canTransitionContent(from:ContentLifecycleStage,to:ContentLifecycleStage){return(from==="draft"&&to==="validated")||(from==="validated"&&to==="published")}
