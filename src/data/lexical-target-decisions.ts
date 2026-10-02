export const LEXICAL_FRAME_EXCLUSION_POLICY = "lexical-frame-exclusions-v1" as const;

export type LexicalFrameExclusionReason = "locative-adjunct" | "separable-particle" | "condition-adjunct" | "purpose-clause";

export type LexicalFrameExclusionDecision = {
  id: string;
  lessonId: string;
  normalizedVerb: string;
  preposition: string;
  reason: LexicalFrameExclusionReason;
  explanationAr: string;
  reviewStatus: "authored-review-pending";
  policyVersion: typeof LEXICAL_FRAME_EXCLUSION_POLICY;
};

const decision = (value: Omit<LexicalFrameExclusionDecision, "id" | "reviewStatus" | "policyVersion">): LexicalFrameExclusionDecision => ({
  ...value,
  id: `${value.lessonId}-${value.normalizedVerb}-${value.preposition}-frame-exclusion`,
  reviewStatus: "authored-review-pending",
  policyVersion: LEXICAL_FRAME_EXCLUSION_POLICY,
});

export const lexicalFrameExclusionDecisions: LexicalFrameExclusionDecision[] = [
  decision({ lessonId:"a1-21",normalizedVerb:"umsteigen",preposition:"in",reason:"locative-adjunct",explanationAr:"في in Hannover يحدد حرف الجر مكان تبديل القطار؛ ليس حرفًا يحكمه الفعل umsteigen في كل استعمال." }),
  decision({ lessonId:"b1-15",normalizedVerb:"liegen",preposition:"vor",reason:"separable-particle",explanationAr:"vor هنا جزء منفصل من الفعل vorliegen، وليس حرف جر يكوّن إطار liegen + vor." }),
  decision({ lessonId:"b1-22",normalizedVerb:"nachsteuern",preposition:"bei",reason:"condition-adjunct",explanationAr:"bei Bedarf ظرف شرط بمعنى عند الحاجة؛ يمكن حذف الظرف ويبقى الفعل nachsteuern كاملًا." }),
  decision({ lessonId:"b1-23",normalizedVerb:"liegen",preposition:"vor",reason:"separable-particle",explanationAr:"vor في liegen … vor هو بادئة الفعل المنفصل vorliegen، لا حرف جر مستقل." }),
  decision({ lessonId:"b2-01",normalizedVerb:"reichen",preposition:"aus",reason:"separable-particle",explanationAr:"aus جزء الفعل المنفصل ausreichen في Die Daten reichen nicht aus؛ لا يمثل إطار reichen + aus." }),
  decision({ lessonId:"b2-01",normalizedVerb:"reichen",preposition:"um",reason:"purpose-clause",explanationAr:"um يفتتح جملة الغاية um … zu ولا تحكمه صيغة ausreichen السابقة." }),
  decision({ lessonId:"b2-18",normalizedVerb:"ziehen",preposition:"in",reason:"locative-adjunct",explanationAr:"في «in Betracht ziehen» ليس in حرف جر يحكمه الفعل: التركيب يجري بأفعال خفيفة أخرى: «in Betracht ziehen» و«das kommt nicht in Betracht» — فلو كان in محكومًا بالفعل لتبدّل مع تبدّله؛ وهو هنا ظرف ثابت مع اسم بلا مقال، ولا حالة تُلاحَظ لأن المقال غائب." }),
  decision({ lessonId:"b2-18",normalizedVerb:"kommen",preposition:"in",reason:"locative-adjunct",explanationAr:"في «in Frage kommen» العبارة ظرفية ثابتة مثل «in Betracht»: الفعل يتبدّل («etwas in Frage stellen» و«in Frage kommen») والجارّة تبقى كما هي، فلا إطار «kommen + in» يُلزَم بحالة." }),
];

export function lexicalFrameExclusionFor(lessonId: string, normalizedVerb: string, preposition: string) {
  return lexicalFrameExclusionDecisions.find((item) => item.lessonId === lessonId && item.normalizedVerb === normalizedVerb && item.preposition === preposition);
}
