// @vitest-environment node
import { describe,expect,it } from "vitest";
import { strFromU8,strToU8,unzipSync,zipSync } from "fflate";
import { buildWeeklyPlan,WEEKLY_TIME_COMPARISON_POLICY_VERSION } from "@/core/coach/weekly-plan";
import { buildExamReadiness,READINESS_FORECAST_POLICY_VERSION } from "@/core/exams/readiness";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { defaultState } from "@/core/portability/db";
import { exportArchive,importArchive } from "@/core/portability/backup";
import { DWNB_DEPRECATION_POLICY_VERSION,DWNB_V1_SUPPORT_ENDS_AT,dwnbFormatPolicyMatrix,dwnbFormatSupportDecision } from "@/core/portability/deprecation";
import { contentSecurityPolicyDirectives,securityHeaderExceptions,securityHeaders,serializeContentSecurityPolicy } from "@/config/security-headers";
import { endpointFrom } from "@/core/ai/client";
import type { LearningState } from "@/types/learning";

const profile={name:"Nadia",targetExam:"goethe-b2" as const,dailyMinutes:45 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"B2" as const,createdAt:"2026-08-20T08:00:00Z"};
const stateWithProfile:LearningState={...defaultState,profile};
const fixedNow=new Date(2026,8,9,12);

async function sha256(value:string){return[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map((byte)=>byte.toString(16).padStart(2,"0")).join("")}
async function legacyV1Archive(){
  const original=await exportArchive(defaultState);
  const entries=unzipSync(new Uint8Array(await original.arrayBuffer()));
  const oldState={...JSON.parse(strFromU8(entries["progress.json"])),schemaVersion:1,completedLessonIds:["a1-01"]};
  const payload=JSON.stringify(oldState);
  entries["progress.json"]=strToU8(payload);
  const manifest={...JSON.parse(strFromU8(entries["manifest.json"])),formatVersion:1,appVersion:"0.0.1",checksum:await sha256(payload)};
  entries["manifest.json"]=strToU8(JSON.stringify(manifest));
  return new Blob([new Uint8Array(zipSync(entries))]);
}

describe("P1 no-blame weekly planned-versus-recorded comparison",()=>{
  it("compares only the elapsed Monday-to-today plan with recorded study minutes",()=>{
    const state={...stateWithProfile,studyHistory:[{date:"2026-09-07",minutes:30,evidenceCount:2},{date:"2026-09-08",minutes:20,evidenceCount:1}]};
    const comparison=buildWeeklyPlan(state,fixedNow).timeComparison;
    expect(comparison).toMatchObject({policyVersion:WEEKLY_TIME_COMPARISON_POLICY_VERSION,throughDate:"2026-09-09",plannedToDateMinutes:135,actualRecordedMinutes:50,differenceMinutes:-85,status:"less-recorded"});
    expect(comparison.messageAr).toContain("بلا عقوبة أو دين تلقائي");
    expect(comparison.evidenceBoundary).toContain("no-blame");
  });
  it("uses a visible flexibility range and never changes mastery",()=>{
    const state={...stateWithProfile,studyHistory:[{date:"2026-09-07",minutes:125,evidenceCount:2}]};
    const plan=buildWeeklyPlan(state,fixedNow);
    expect(plan.timeComparison.status).toBe("within-range");
    expect(plan.timeComparison.toleranceMinutes).toBe(20);
    expect(state.mastery).toEqual(defaultState.mastery);
  });
});

describe("P1 evidence-velocity readiness range",()=>{
  it("refuses a forecast when recent evidence cadence is insufficient",()=>{
    const forecast=buildExamReadiness(stateWithProfile,"goethe-b2",fixedNow).forecast;
    expect(forecast).toMatchObject({policyVersion:READINESS_FORECAST_POLICY_VERSION,status:"insufficient-data",minimumWeeks:null,maximumWeeks:null});
    expect(forecast.messageAr).toContain("لا تكفي الوتيرة");
  });
  it("produces a bounded week range from active evidence days and a provider-scoped gap",()=>{
    const dates=["2026-08-21","2026-08-25","2026-08-29","2026-09-02","2026-09-05","2026-09-08"];
    const state={...stateWithProfile,studyHistory:dates.map((date)=>({date,minutes:30,evidenceCount:2}))};
    const forecast=buildExamReadiness(state,"goethe-b2",fixedNow).forecast;
    expect(forecast.status).toBe("range");
    expect(forecast.activeEvidenceDays).toBe(6);
    expect(forecast.minimumWeeks).toBeGreaterThan(0);
    expect(forecast.maximumWeeks).toBeGreaterThan(forecast.minimumWeeks!);
    expect(forecast.messageAr).toContain("ليس موعد نجاح");
    expect(forecast).not.toHaveProperty("passDate");
  });
  it("stops forecasting dates once every provider module has strong internal evidence",()=>{
    const reading=allPublishedExamTasks.filter((task)=>task.provider==="goethe-b2"&&task.skill==="reading").slice(0,5);
    const listening=allPublishedExamTasks.filter((task)=>task.provider==="goethe-b2"&&task.skill==="listening").slice(0,4);
    const writing=allPublishedExamTasks.filter((task)=>task.provider==="goethe-b2"&&task.skill==="writing").slice(0,3);
    const speaking=allPublishedExamTasks.filter((task)=>task.provider==="goethe-b2"&&task.skill==="speaking").slice(0,3);
    const mastery=Object.fromEntries([...reading,...listening].map((task)=>[`exam-target-${task.id}`,90]));
    const writingSubmissions=writing.map((task,index)=>({id:`w-${index}`,taskId:task.id,text:"Text",wordCount:1,version:1,status:(index===0?"revised":"submitted") as "revised"|"submitted",feedback:[],createdAt:"2026-09-01T10:00:00Z",updatedAt:"2026-09-01T10:00:00Z"}));
    const speakingAttempts=[...speaking.map((task,index)=>({id:`s-${index}`,taskId:task.id,durationSeconds:60,selfScore:3,reflection:"",createdAt:"2026-09-01T10:00:00Z"})),{id:"s-repeat",taskId:speaking[0].id,durationSeconds:60,selfScore:3,reflection:"",createdAt:"2026-09-02T10:00:00Z"}];
    const forecast=buildExamReadiness({...stateWithProfile,mastery,writingSubmissions,speakingAttempts},"goethe-b2",fixedNow).forecast;
    expect(forecast).toMatchObject({status:"evidence-threshold-met",remainingEvidenceUnits:0,minimumWeeks:null,maximumWeeks:null});
    expect(forecast.messageAr).toContain("لا نعرض تاريخ نجاح");
  });
});

describe("P1 audited narrow CSP and local Ollama origin",()=>{
  it("ships CSP and defense headers without a global wildcard or generic unsafe-eval",()=>{
    const csp=serializeContentSecurityPolicy();
    expect(securityHeaders.find((header)=>header.key==="Content-Security-Policy")?.value).toBe(csp);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://generativelanguage.googleapis.com");
    expect(csp).toContain("https://openrouter.ai");
    expect(csp).toContain("https://huggingface.co");
    expect(csp).not.toMatch(/(?:^|\s|;)\*(?:\s|;|$)/);
    expect(contentSecurityPolicyDirectives["script-src"]).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicyDirectives["script-src"]).toContain("'wasm-unsafe-eval'");
    expect(securityHeaderExceptions).toHaveLength(3);
  });
  it("accepts only CSP-allowlisted loopback Ollama origins",()=>{
    expect(endpointFrom({provider:"local",model:"qwen2.5:3b",key:"http://localhost:11434/"})).toBe("http://localhost:11434");
    expect(endpointFrom({provider:"local",model:"qwen2.5:3b",key:"https://127.0.0.1:11434"})).toBe("https://127.0.0.1:11434");
    expect(()=>endpointFrom({provider:"local",model:"qwen2.5:3b",key:"http://192.168.1.2:11434"})).toThrow("Loopback");
    expect(()=>endpointFrom({provider:"local",model:"qwen2.5:3b",key:"http://localhost:11434/custom"})).toThrow("دون مسار");
  });
});

describe("P1 explicit DWNB deprecation and migration window",()=>{
  it("publishes a three-version matrix with more than 180 days of v1 notice",()=>{
    expect(dwnbFormatPolicyMatrix.map((row)=>row.formatVersion)).toEqual([1,2,3]);
    const noticeDays=(Date.parse(`${DWNB_V1_SUPPORT_ENDS_AT}T00:00:00Z`)-Date.parse("2026-09-09T00:00:00Z"))/86_400_000;
    expect(noticeDays).toBeGreaterThanOrEqual(180);
    expect(dwnbFormatSupportDecision(1,new Date("2027-03-31T12:00:00Z"))).toMatchObject({policyVersion:DWNB_DEPRECATION_POLICY_VERSION,lifecycle:"deprecated-supported",importSupported:true});
    expect(dwnbFormatSupportDecision(1,new Date("2027-04-01T12:00:00Z"))).toMatchObject({lifecycle:"expired",importSupported:false});
    expect(dwnbFormatSupportDecision(4,fixedNow)).toMatchObject({lifecycle:"unknown",importSupported:false});
  });
  it("imports and migrates supported v1 with a visible warning, then rejects it explicitly after the deadline",async()=>{
    const archive=await legacyV1Archive();
    const imported=await importArchive(archive,undefined,new Date("2026-09-09T12:00:00Z"));
    expect(imported.state.schemaVersion).toBe(3);
    expect(imported.state.completedLessonIds).toEqual(["a1-01"]);
    expect(imported.compatibility.lifecycle).toBe("deprecated-supported");
    expect(imported.compatibility.warningAr).toContain("مدعوم حتى 2027-03-31");
    await expect(importArchive(archive,undefined,new Date("2027-04-01T12:00:00Z"))).rejects.toThrow("انتهت مهلة استيراد DWNB v1");
  });
});
