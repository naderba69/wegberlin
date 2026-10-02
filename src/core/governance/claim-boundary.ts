import type { FullLesson } from "@/types/lesson-content";

export const CLAIM_BOUNDARY_POLICY = "practice-law-language-boundary-v1" as const;
export type ClaimBoundaryKind = "language-rule" | "common-practice" | "official-requirement";
export type ClaimBoundaryCard = {
  kind: ClaimBoundaryKind;
  labelDe: string;
  labelAr: string;
  statementAr: string;
  authority: "authored-curriculum" | "context-dependent-practice" | "not-claimed";
  sourceStatus: "lesson-owned" | "not-applicable-no-official-claim";
  sourceRef?: string;
};
export type LessonClaimBoundary = {
  policyVersion: typeof CLAIM_BOUNDARY_POLICY;
  lessonId: string;
  officialVerificationRequired: boolean;
  riskTopics: string[];
  cards: [ClaimBoundaryCard,ClaimBoundaryCard,ClaimBoundaryCard];
  evidenceBoundary: "classification-guidance-not-legal-advice";
};

const riskSignals:Array<{id:string;pattern:RegExp}>=[
  {id:"authority-form",pattern:/behörd|amt\b|anmeldung|formular|antrag|bürgerbüro|ausländer/iu},
  {id:"housing-contract",pattern:/miet|vertrag|kündig|wohnung|heizung|nebenkosten/iu},
  {id:"employment",pattern:/arbeitsvertrag|arbeitgeber|bewerbung|kündigung|arbeitszeit/iu},
  {id:"deadline-obligation",pattern:/gesetz|recht\b|pflicht|frist|vorgabe|nachweis|erforderlich/iu},
  {id:"health",pattern:/arzt|krank|rezept|versicherung|gesundheit/iu},
];

export function buildLessonClaimBoundary(lesson:FullLesson):LessonClaimBoundary{
  const searchable=[lesson.titleDe,lesson.titleAr,lesson.descriptionAr,lesson.entry.sceneAr,lesson.mediation.scenarioAr,lesson.mediation.sourceDe,...lesson.theory.flatMap((block)=>[block.titleDe,block.titleAr,block.explanationAr])].join(" ");
  const riskTopics=riskSignals.filter((signal)=>signal.pattern.test(searchable)).map((signal)=>signal.id);
  const officialVerificationRequired=riskTopics.length>0;
  const firstRule=lesson.theory[0];
  return{
    policyVersion:CLAIM_BOUNDARY_POLICY,
    lessonId:lesson.id,
    officialVerificationRequired,
    riskTopics,
    cards:[
      {kind:"language-rule",labelDe:"Sprachregel",labelAr:"قاعدة لغوية",statementAr:`هذه قاعدة استعمال ألمانية يشرحها الدرس: «${firstRule.titleAr}». هي وصف لغوي داخل المنهج وليست قانونًا أو إجراء معاملة.`,authority:"authored-curriculum",sourceStatus:"lesson-owned",sourceRef:firstRule.id},
      {kind:"common-practice",labelDe:"Übliche Praxis",labelAr:"عرف أو ممارسة شائعة",statementAr:"اختيار التحية أو درجة الرسمية أو طريقة التواصل في الحوار مثال شائع يعتمد على الشخص والمؤسسة والموقف؛ ليس إلزامًا قانونيًا عامًا.",authority:"context-dependent-practice",sourceStatus:"not-applicable-no-official-claim"},
      {kind:"official-requirement",labelDe:"Offizielle Vorgabe / Gesetz",labelAr:"متطلب رسمي أو قانون",statementAr:officialVerificationRequired?"السياق يلامس إدارة أو سكنًا أو عملًا أو صحة أو مهلة. لا يثبت هذا الدرس قانونًا أو وثيقة أو موعدًا ملزمًا؛ تحقق من الجهة الرسمية المختصة بتاريخ معاملتك.":"لا يقدم هذا الدرس ادعاءً قانونيًا أو إجراءً رسميًا. إذا تحول المثال إلى معاملة حقيقية، تحقق من الجهة المختصة بدل تعميم الحوار التدريبي.",authority:"not-claimed",sourceStatus:"not-applicable-no-official-claim"},
    ],
    evidenceBoundary:"classification-guidance-not-legal-advice",
  };
}
