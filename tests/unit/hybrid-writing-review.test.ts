// @vitest-environment node
import { afterEach,describe,expect,it,vi } from "vitest";
import { askGeminiWritingReview,parseWritingReviewPayload,WRITING_REVIEW_PROMPT_VERSION } from "@/core/ai/client";
import { createWritingAIReviewEvidence,HYBRID_WRITING_REVIEW_POLICY,localWritingReviewBoundary,WRITING_REVIEW_BOUNDARY } from "@/core/writing/hybrid-review";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";
import { exportArchive,importArchive } from "@/core/portability/backup";
import { readFileSync } from "node:fs";

const text="Guten Tag! Ich kommen aus Tunesien. Ich lerne Deutsch in Berlin.";
const payload={summaryAr:"النص يحقق بداية واضحة، وتوجد نقطة صرف مؤكدة مع جوانب تحتاج حكمًا سياقيًا.",issues:[{category:"grammar" as const,excerpt:"Ich kommen aus Tunesien.",explanationAr:"بعد ich نحتاج الفعل المصرف.",suggestionDe:"Ich komme aus Tunesien.",confidence:"high" as const}],unresolvedAr:["مدى طبيعية النبرة في سياق المؤسسة"]};
const context={taskId:"a1-01",level:"A1",taskPromptDe:"Schreiben Sie eine kurze Nachricht.",localPatternIds:["ich-infinitive"]};
afterEach(()=>vi.unstubAllGlobals());

describe("honest hybrid self-study writing teacher",()=>{
  it("keeps the deterministic local tutor primary and names residual uncertainty honestly",()=>{
    expect(localWritingReviewBoundary(1)).toEqual({policyVersion:HYBRID_WRITING_REVIEW_POLICY,role:"primary-honest-self-study-tutor",deterministicPatternCount:1,residualUncertaintyAr:["دقة المعنى المقصود والسياق","الطبيعية والاختيار الاصطلاحي","قوة الحجة وتنفيذ التفاصيل الدقيقة"],canClaimErrorFree:false,canReplaceOfficialTeacherAssessment:false});
  });

  it("requires fresh consent before any Gemini writing request",async()=>{const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);await expect(askGeminiWritingReview({provider:"gemini",model:"gemini-2.5-flash",key:"secret"},text,{context,now:new Date("2026-09-08T12:00:00Z")})).rejects.toThrow("تأكيد مستقل");expect(fetchMock).not.toHaveBeenCalled()});

  it("refuses OpenRouter/Ollama/disabled for the doubt-review path before fetch",async()=>{const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);for(const provider of ["disabled","openrouter","local"] as const)await expect(askGeminiWritingReview({provider,model:provider==="openrouter"?"openrouter/free":"",key:"x"},text,{context,consentGranted:true,now:new Date("2026-09-08T12:00:00Z")})).rejects.toThrow("Gemini BYOK فقط");expect(fetchMock).not.toHaveBeenCalled()});

  it("accepts strict Gemini JSON only when every issue quotes the approved text",()=>{expect(parseWritingReviewPayload(JSON.stringify(payload),text)).toEqual(payload);expect(()=>parseWritingReviewPayload(JSON.stringify({...payload,issues:[{...payload.issues[0],excerpt:"Nicht im Text"}]}),text)).toThrow("جزءًا فعليًا");expect(()=>parseWritingReviewPayload(JSON.stringify({...payload,officialScore:90}),text)).toThrow("عقد مراجعة الكتابة")});

  it("sends one minimized Gemini payload and returns no score or teacher-replacement claim",async()=>{const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(payload)}]}}]}),{status:200}));vi.stubGlobal("fetch",fetchMock);const answer=await askGeminiWritingReview({provider:"gemini",model:"gemini-2.5-flash",key:"session-secret"},text,{context,consentGranted:true,now:new Date("2026-09-08T12:00:00Z")});expect(answer).toMatchObject({...payload,provider:"gemini",model:"gemini-2.5-flash",promptVersion:WRITING_REVIEW_PROMPT_VERSION});expect(fetchMock).toHaveBeenCalledTimes(1);const body=JSON.parse(fetchMock.mock.calls[0][1].body);const sent=JSON.parse(body.contents[0].parts[0].text);expect(sent).toEqual({source:"learner-writing",text});expect(JSON.stringify(sent)).not.toMatch(/mastery|profile|answerKey|session-secret/);expect(body.systemInstruction.parts[0].text).toContain("teacher-replacement claim")});

  it("persists hashed provenance without key, score, or mastery and remains portable",async()=>{const evidence=await createWritingAIReviewEvidence({sourceText:text,sourceSubmissionId:"w2",taskId:"a1-01",sourceVersion:2,model:"gemini-2.5-flash",...payload,now:new Date("2026-09-08T12:00:00Z")});expect(evidence).toMatchObject({policyVersion:HYBRID_WRITING_REVIEW_POLICY,sourceSubmissionId:"w2",sourceVersion:2,provider:"gemini",consent:"explicit",evaluationBoundary:WRITING_REVIEW_BOUNDARY});expect(evidence.sourceTextSha256).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(evidence)).not.toMatch(/apiKey|officialScore|masteryDelta/);const parsed=learningStateSchema.parse({...defaultState,writingAIReviews:[evidence]});expect(parsed.mastery).toEqual(defaultState.mastery);const archive=await exportArchive(parsed,{includeMedia:false});expect((await importArchive(archive)).state.writingAIReviews).toEqual([evidence]);expect(mergeLearningStates(defaultState,parsed).writingAIReviews).toEqual([evidence])});

  it("renders local-first boundaries and an independent consent dialog",()=>{const source=readFileSync("src/components/hybrid-writing-review.tsx","utf8");for(const marker of ["المعلّم الذاتي الأساسي والصادق","لا يدعي أن غياب النمط يعني غياب كل خطأ","اسأل Gemini عند الشك","موافقة مستقلة لإرسال نص الكتابة","أوافق وأرسل هذه النسخة مرة واحدة","لا درجة رسمية، لا mastery","لا بديل مضمون عن مدرس"] )expect(source).toContain(marker)});
});
