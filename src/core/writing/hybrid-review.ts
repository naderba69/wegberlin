import type { WritingAIReviewEvidence,WritingAIReviewIssue } from "@/types/learning";

export const HYBRID_WRITING_REVIEW_POLICY="hybrid-writing-review-v1" as const;
export const WRITING_REVIEW_PROMPT_VERSION="writing-review-v1" as const;
export const WRITING_REVIEW_BOUNDARY="advisory-writing-review-no-official-score-or-mastery" as const;

async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return[...new Uint8Array(digest)].map((byte)=>byte.toString(16).padStart(2,"0")).join("");}

export async function createWritingAIReviewEvidence(input:{sourceText:string;sourceSubmissionId:string;taskId:string;sourceVersion:number;model:string;summaryAr:string;issues:WritingAIReviewIssue[];unresolvedAr:string[];now?:Date}):Promise<WritingAIReviewEvidence>{
  if(!input.sourceSubmissionId||!input.taskId||input.sourceVersion<1)throw new Error("لا يمكن ربط مراجعة Gemini دون نسخة كتابة محفوظة.");
  return{id:`writing-ai-review:${crypto.randomUUID()}`,policyVersion:HYBRID_WRITING_REVIEW_POLICY,sourceSubmissionId:input.sourceSubmissionId,sourceTextSha256:await sha256(input.sourceText),taskId:input.taskId,sourceVersion:input.sourceVersion,provider:"gemini",model:input.model,promptVersion:WRITING_REVIEW_PROMPT_VERSION,consent:"explicit",summaryAr:input.summaryAr,issues:input.issues,unresolvedAr:input.unresolvedAr,evaluationBoundary:WRITING_REVIEW_BOUNDARY,createdAt:(input.now??new Date()).toISOString()};
}

export function localWritingReviewBoundary(patternCount:number){return{policyVersion:HYBRID_WRITING_REVIEW_POLICY,role:"primary-honest-self-study-tutor" as const,deterministicPatternCount:patternCount,residualUncertaintyAr:["دقة المعنى المقصود والسياق","الطبيعية والاختيار الاصطلاحي","قوة الحجة وتنفيذ التفاصيل الدقيقة"],canClaimErrorFree:false,canReplaceOfficialTeacherAssessment:false};}
