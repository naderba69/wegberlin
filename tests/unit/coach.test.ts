import { describe, expect, it } from "vitest";
import { composeTodayMission, getCoachTarget } from "@/core/coach/coach";
import { curriculum } from "@/data/curriculum";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { defaultState } from "@/core/portability/db";

const diagnosticResult = { estimatedLevel:"A1" as const, score:3, maxScore:12, levelScores:{A1:3,A2:0,B1:0,B2:0}, completedAt:"2026-08-26T00:00:00.000Z" };

describe("coach session composer", () => {
  it("prioritizes diagnosis before ordinary lessons when prior experience is unknown", () => {
    expect(composeTodayMission(defaultState)[0].kind).toBe("diagnostic");
  });
  it("routes a declared absolute beginner directly to A1-01 without diagnosis or production pressure",()=>{const state={...defaultState,profile:{name:"Beginner",targetExam:"goethe-b2" as const,dailyMinutes:45 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"A1" as const,priorExperience:"none" as const,createdAt:"2026-09-02T00:00:00Z"}};expect(getCoachTarget(state)).toMatchObject({kind:"lesson",href:"/lernen/a1-01"});const mission=composeTodayMission(state);expect(mission.map((item)=>item.kind)).toEqual(["check-in","lesson","reflection"]);expect(mission.reduce((sum,item)=>sum+item.minutes,0)).toBe(30);expect(mission.some((item)=>item.kind==="diagnostic"||item.kind==="production")).toBe(false)});
  it("keeps the adaptive diagnostic for learners with some or uncertain prior knowledge",()=>{for(const priorExperience of ["some","unsure"] as const){const state={...defaultState,profile:{name:"Learner",targetExam:"goethe-b2" as const,dailyMinutes:30 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"A1" as const,priorExperience,createdAt:"2026-09-02T00:00:00Z"}};expect(getCoachTarget(state).kind).toBe("diagnostic")}});
  it("builds a bounded 10-minute rescue session", () => {
    const state = { ...defaultState, diagnosticResult, profile: { name:"Test",targetExam:"goethe-b2" as const,dailyMinutes:10 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"A1" as const,createdAt:"2026-08-26T00:00:00.000Z" } };
    const mission=composeTodayMission(state);
    expect(mission.reduce((sum,item)=>sum+item.minutes,0)).toBeLessThanOrEqual(15);
    expect(mission.some((item)=>item.kind==="production")).toBe(true);
  });
  it("keeps production in a standard session", () => {
    const state={...defaultState,diagnosticResult,profile:{name:"Test",targetExam:"telc-deutsch-b2" as const,dailyMinutes:45 as const,arabicSupport:"minimal-arabic" as const,currentLevel:"A1" as const,createdAt:"2026-08-26T00:00:00.000Z"}};
    expect(composeTodayMission(state).some((item)=>item.kind==="production")).toBe(true);
  });
  it("uses a non-exam learner goal to contextualize daily production",()=>{
    const state={...defaultState,diagnosticResult,profile:{name:"Test",targetExam:"goethe-b2" as const,dailyMinutes:45 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"A1" as const,goals:["exam" as const,"work" as const],deviceReadiness:{audio:"ready" as const,microphone:"skipped" as const},createdAt:"2026-08-26T00:00:00.000Z"}};
    expect(composeTodayMission(state).find((item)=>item.kind==="production")?.objective).toContain("موقف مهني");
  });
  it("sends a learner who completed A1 to the evidence gate",()=>{
    const completedLessonIds=curriculum.filter((lesson)=>lesson.level==="A1").map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0};
    expect(getCoachTarget(state).href).toBe("/assessment/a1");
  });
  it("recommends the first A2 lesson only after the A1 gate",()=>{
    const completedLessonIds=curriculum.filter((lesson)=>lesson.level==="A1").map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100}};
    expect(getCoachTarget(state).href).toBe("/lernen/a2-01");
  });
  it("sends a learner who completed A2 to the A2 evidence gate",()=>{
    const completedLessonIds=curriculum.filter((lesson)=>["A1","A2"].includes(lesson.level)).map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100}};
    expect(getCoachTarget(state).href).toBe("/assessment/a2");
  });
  it("recommends B1 only after both lower-level gates",()=>{
    const completedLessonIds=curriculum.filter((lesson)=>["A1","A2"].includes(lesson.level)).map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100}};
    expect(getCoachTarget(state).href).toBe("/lernen/b1-01");
  });
  it("sends a learner who completed B1 to the B1 evidence gate",()=>{
    const completedLessonIds=curriculum.filter((lesson)=>["A1","A2","B1"].includes(lesson.level)).map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100}};
    expect(getCoachTarget(state).href).toBe("/assessment/b1");
  });
  it("recommends B2 only after all three lower-level gates",()=>{
    const completedLessonIds=curriculum.filter((lesson)=>["A1","A2","B1"].includes(lesson.level)).map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100}};
    expect(getCoachTarget(state).href).toBe("/lernen/b2-01");
  });
  it("sends a learner who completed B2 to the final B2 evidence gate",()=>{
    const completedLessonIds=curriculum.map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100}};
    expect(getCoachTarget(state).href).toBe("/assessment/b2");
  });
  it("routes a B2-gated learner to the weakest provider-owned exam module",()=>{
    const completedLessonIds=curriculum.map((lesson)=>lesson.id);
    const state={...defaultState,diagnosticResult,completedLessonIds,dueReviews:0,profile:{name:"Test",targetExam:"goethe-b2" as const,dailyMinutes:45 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"B2" as const,createdAt:"2026-08-01T00:00:00Z"},mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100,"level-b2-ready":100}};
    const target=getCoachTarget(state);
    expect(target.kind).toBe("exam");
    expect(target.href).toMatch(/^\/exams\/goethe-b2\//);
    expect(target.reasonAr).toContain("القراءة");
  });
  it("keeps accumulated SRS ahead of exam readiness",()=>{const state={...defaultState,diagnosticResult,completedLessonIds:curriculum.map((lesson)=>lesson.id),dueReviews:20,mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100,"level-b2-ready":100}};expect(getCoachTarget(state).kind).toBe("review")});
  it("keeps due delayed errors and three-occurrence clinics ahead of exam readiness",()=>{const base={...defaultState,diagnosticResult,completedLessonIds:curriculum.map((lesson)=>lesson.id),dueReviews:0,mastery:{...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100,"level-b2-ready":100}};const due={id:"due",type:"grammar" as const,wrong:"x",correct:"y",explanationAr:"",occurrences:1,lastSeenAt:"2026-08-30T00:00:00Z",resolved:false,repairCount:1,nextReviewAt:"2026-08-31T00:00:00Z"};expect(getCoachTarget({...base,errors:[due]},new Date("2026-09-01T10:00:00Z")).kind).toBe("errors");const cluster={...due,id:"cluster",occurrences:3,repairCount:0,nextReviewAt:undefined};expect(getCoachTarget({...base,errors:[cluster]},new Date("2026-09-01T10:00:00Z")).kind).toBe("errors")});
  it("opens the evidence profile only after every provider module has strong training evidence",()=>{
    const provider="goethe-b2" as const;const providerTasks=allPublishedExamTasks.filter((task)=>task.provider===provider);const receptive=providerTasks.filter((task)=>["reading","listening"].includes(task.skill));const writing=providerTasks.filter((task)=>task.skill==="writing").slice(0,3);const speaking=providerTasks.filter((task)=>task.skill==="speaking").slice(0,3);const mastery={...defaultState.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100,"level-b2-ready":100,...Object.fromEntries(receptive.map((task)=>[`exam-target-${task.id}`,90]))};const writingSubmissions=writing.map((task,index)=>({id:`w-${index}`,taskId:task.id,text:"Text",wordCount:1,version:1,status:(index===0?"revised":"submitted") as "revised"|"submitted",feedback:[],createdAt:"2026-08-31T10:00:00Z",updatedAt:"2026-08-31T10:00:00Z"}));const speakingAttempts=[...speaking.map((task,index)=>({id:`s-${index}`,taskId:task.id,durationSeconds:60,selfScore:3,reflection:"",createdAt:"2026-08-31T10:00:00Z"})),{id:"s-retry",taskId:speaking[0].id,durationSeconds:70,selfScore:4,reflection:"إعادة",createdAt:"2026-08-31T11:00:00Z"}];const state={...defaultState,diagnosticResult,completedLessonIds:curriculum.map((lesson)=>lesson.id),dueReviews:0,profile:{name:"Test",targetExam:provider,dailyMinutes:45 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"B2" as const,createdAt:"2026-08-01T00:00:00Z"},mastery,writingSubmissions,speakingAttempts};expect(getCoachTarget(state).href).toBe("/progress");
  });
});
