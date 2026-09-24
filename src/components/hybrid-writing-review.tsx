"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot,Check,Cloud,ShieldCheck,Trash2,TriangleAlert } from "lucide-react";
import { askGeminiWritingReview } from "@/core/ai/client";
import { createWritingAIReviewEvidence,HYBRID_WRITING_REVIEW_POLICY,localWritingReviewBoundary } from "@/core/writing/hybrid-review";
import type { WritingErrorPatternId } from "@/types/learning";
import { useLearning } from "./learning-provider";
import { AccessibleDialog } from "./accessible-dialog";

export function HybridWritingReview({sourceText,sourceSubmissionId,taskId,sourceVersion,level,taskPromptDe,localPatternIds}:{sourceText:string;sourceSubmissionId:string;taskId:string;sourceVersion:number;level:string;taskPromptDe:string;localPatternIds:WritingErrorPatternId[]}){
  const{state,update}=useLearning();
  const[pending,setPending]=useState(false);
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  const boundary=localWritingReviewBoundary(localPatternIds.length);
  const review=[...state.writingAIReviews].reverse().find((item)=>item.sourceSubmissionId===sourceSubmissionId);
  const geminiReady=state.aiSettings.provider==="gemini";
  async function confirm(){setPending(false);setBusy(true);setMessage("");try{const answer=await askGeminiWritingReview({provider:state.aiSettings.provider,model:state.aiSettings.model,key:sessionStorage.getItem("dwnb-ai-key")??""},sourceText,{context:{taskId,level,taskPromptDe,localPatternIds},consentGranted:true});const evidence=await createWritingAIReviewEvidence({sourceText,sourceSubmissionId,taskId,sourceVersion,model:answer.model,summaryAr:answer.summaryAr,issues:answer.issues,unresolvedAr:answer.unresolvedAr,needsHumanReview:answer.needsHumanReview});update((current)=>({...current,writingAIReviews:[...current.writingAIReviews,evidence]}));setMessage("حُفظت مراجعة Gemini الاستشارية محليًا. لم تتغير الدرجة أو الإتقان.")}catch(error){setMessage(error instanceof Error?error.message:"تعذرت مراجعة Gemini؛ بقي الفحص المحلي متاحًا.")}finally{setBusy(false)}}
  function remove(){update((current)=>({...current,writingAIReviews:current.writingAIReviews.filter((item)=>item.sourceSubmissionId!==sourceSubmissionId)}));setMessage("حُذفت مراجعة Gemini لهذه النسخة، وبقي النص والفحص المحلي.")}
  return <section className="hybrid-writing-review" data-writing-review-policy={HYBRID_WRITING_REVIEW_POLICY}>
    <header><span><Bot size={19}/></span><div><small lang="de" dir="ltr">Primärer ehrlicher Selbstlernlehrer</small><h3>المعلّم الذاتي الأساسي والصادق</h3><p>الفحص المحلي يعمل دائمًا. يرصد الأنماط التي يستطيع إثباتها، ولا يدعي أن غياب النمط يعني غياب كل خطأ.</p></div></header>
    <div className="local-review-boundary"><ShieldCheck size={17}/><div><strong>{boundary.deterministicPatternCount?`رُصد ${boundary.deterministicPatternCount} نمط محلي موثوق.`:"لم يُرصد نمط محلي موثوق في هذه النسخة."}</strong><p>يبقى الشك في: {boundary.residualUncertaintyAr.join("، ")}.</p><small>ليس تقييم مدرس رسميًا ولا حكم CEFR.</small></div></div>
    {geminiReady?<button className="gemini-review-button" disabled={busy} onClick={()=>setPending(true)}><Cloud size={16}/>{busy?"Gemini يراجع النص الموافق عليه…":review?"أعد سؤال Gemini بموافقة جديدة":"اسأل Gemini عند الشك — بموافقة مستقلة"}</button>:<div className="gemini-review-unavailable"><TriangleAlert size={16}/><p>للاستعانة بـGemini عند الشك، اختر Gemini BYOK من <Link href="/settings">الإعدادات</Link>. لن يُرسل النص تلقائيًا.</p></div>}
    {review&&<article className="gemini-writing-result"><header><span><Check size={15}/></span><div><strong>مراجعة Gemini استشارية</strong><small>{review.model} · {review.promptVersion} · موافقة مستقلة</small></div><button aria-label="حذف مراجعة Gemini" onClick={remove}><Trash2 size={14}/></button></header><p>{review.summaryAr}</p>{review.issues.length?<div>{review.issues.map((issue,index)=><section key={`${issue.category}-${index}`}><header><span>{issue.category}</span><b>{issue.confidence==="high"?"ثقة عالية":"ثقة متوسطة"}</b></header><blockquote lang="de" dir="ltr">{issue.excerpt}</blockquote><p>{issue.explanationAr}</p>{issue.ruleDe&&<p className="gemini-review-rule"><span>القاعدة كما أوردها المزود</span><code lang="de" dir="ltr">{issue.ruleDe}</code></p>}{issue.suggestionDe&&<code lang="de" dir="ltr">{issue.suggestionDe}</code>}{issue.remediationAr&&<p className="gemini-review-drill">{issue.remediationAr}</p>}</section>)}</div>:<p>لم يُرجع Gemini مشكلة محددة بعقده؛ لا يعني ذلك أن النص خالٍ من الأخطاء.</p>}{review.unresolvedAr.length>0&&<aside><strong>ما بقي غير محسوم</strong>{review.unresolvedAr.map((item)=><span key={item}>{item}</span>)}</aside>}<footer>لا درجة رسمية، لا mastery، ولا بديل مضمون عن مدرس بشري للحالات المعقدة.</footer>{review.needsHumanReview!==false&&<p className="gemini-review-human">هذه المراجعة تحتاج نظرة بشرية: تركها الفحص المحلي أو المزود نفسه بنقاط مفتوحة. لا تُبنَ قرار مستوى على ما هنا.</p>}</article>}
    {message&&<p className="hybrid-writing-status" role="status">{message}</p>}
    {pending&&<AccessibleDialog labelledBy="writing-gemini-consent-title" describedBy="writing-gemini-consent-description" onClose={()=>setPending(false)}><span><Cloud size={24}/></span><h2 id="writing-gemini-consent-title">موافقة مستقلة لإرسال نص الكتابة</h2><p id="writing-gemini-consent-description">سيُرسل نص هذه النسخة وعدد حروفه {sourceText.length} مع هدف المهمة وأنماط الفحص المحلي إلى Gemini عبر مفتاحك الجلسي. لن يُرسل تقدمك أو تسجيلاتك أو المفتاح داخل النص.</p><blockquote lang="de" dir="ltr">{sourceText.slice(0,300)}{sourceText.length>300?"…":""}</blockquote><div><button className="secondary-button" onClick={()=>setPending(false)}>إلغاء</button><button className="primary-button" onClick={()=>void confirm()}>أوافق وأرسل هذه النسخة مرة واحدة</button></div></AccessibleDialog>}
  </section>;
}
