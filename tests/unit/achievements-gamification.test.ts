// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { ACHIEVEMENT_EVIDENCE_BOUNDARY,achievementSummary,deriveEvidenceAchievements,EVIDENCE_ACHIEVEMENT_POLICY } from "@/core/coach/achievements";
import { DEFAULT_MOTIVATION_PREFERENCES,functionalMessageWithOptionalPraise,GAMIFICATION_VISIBILITY_POLICY,motivationPreferencesAreDefault } from "@/core/coach/motivation-preferences";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";
import { exportArchive,importArchive } from "@/core/portability/backup";

describe("P1 evidence-derived achievements",()=>{
  it("publishes six explicit achievements that start locked without evidence",()=>{
    const summary=achievementSummary(defaultState);
    expect(summary).toMatchObject({policyVersion:EVIDENCE_ACHIEVEMENT_POLICY,unlocked:0,total:6});
    expect(summary.achievements.every((achievement)=>achievement.current===0&&!achievement.unlocked&&achievement.evidenceIds.length===0)).toBe(true);
    expect(summary.achievements.every((achievement)=>achievement.evidenceBoundary===ACHIEVEMENT_EVIDENCE_BOUNDARY)).toBe(true);
  });

  it("never unlocks from page visits, mission clicks, tutor interactions, or raw study minutes",()=>{
    const state={...defaultState,completedBlockIds:["2026-09-08:lesson","2026-09-08:reflection"],studyHistory:[{date:"2026-09-08",minutes:300,evidenceCount:0}],tutorInteractions:[]};
    expect(achievementSummary(state).unlocked).toBe(0);
  });

  it("unlocks the first-lesson achievement only from a completed lesson ID",()=>{
    const result=deriveEvidenceAchievements({...defaultState,completedLessonIds:["a1-01"]}).find((item)=>item.id==="first-complete-lesson")!;
    expect(result).toMatchObject({unlocked:true,current:1,target:1,evidenceKind:"completed-lesson",evidenceIds:["a1-01"]});
  });

  it("requires four unique successful delayed lesson-card reviews and excludes personal repair",()=>{
    const event=(id:string,cardId:string,scope:"lesson-card"|"personal-error-remediation",grade:number)=>({id,cardId,lessonId:"a1-01",grade,evidenceKind:"delayed" as const,evidenceScope:scope,scheduledFor:"2026-09-01T00:00:00Z",reviewedAt:"2026-09-08T00:00:00Z",masteryDelta:scope==="lesson-card"?4:0});
    const reviews=[event("r1","c1","lesson-card",4),event("r2","c2","lesson-card",3),event("r3","c3","lesson-card",5),event("r4","c4","lesson-card",4),event("r5","personal","personal-error-remediation",5),event("r6","c1","lesson-card",5)];
    const result=deriveEvidenceAchievements({...defaultState,reviewEvents:reviews}).find((item)=>item.id==="delayed-retention")!;
    expect(result).toMatchObject({unlocked:true,current:4,target:4});
    expect(result.evidenceIds).toEqual(["r6","r2","r3","r4"]);
    expect(result.evidenceIds).not.toContain("r5");
  });

  it("requires a real linked writing revision rather than any draft or submission",()=>{
    const base={id:"w1",taskId:"a1-01",text:"Text",wordCount:1,version:1,status:"submitted" as const,feedback:[],createdAt:"2026-09-08T00:00:00Z",updatedAt:"2026-09-08T00:00:00Z"};
    const locked=deriveEvidenceAchievements({...defaultState,writingSubmissions:[base]}).find((item)=>item.id==="writing-revision")!;
    const revised={...base,id:"w2",version:2,status:"revised" as const,sourceVersion:1};
    const unlocked=deriveEvidenceAchievements({...defaultState,writingSubmissions:[base,revised]}).find((item)=>item.id==="writing-revision")!;
    expect(locked.unlocked).toBe(false);expect(unlocked).toMatchObject({unlocked:true,current:1,evidenceIds:["w2"]});
  });

  it("requires listened-back speaking evidence with a learner reflection",()=>{
    const attempt={id:"s1",taskId:"a1-01",durationSeconds:30,selfScore:3,reflection:"سأوضح الفكرة",selfReview:{listenedBack:true,achievedCriteria:[],clarityScore:3 as const,turnTaking:false,repairUsed:false,preparationNotes:[]},createdAt:"2026-09-08T00:00:00Z"};
    const result=deriveEvidenceAchievements({...defaultState,speakingAttempts:[attempt]}).find((item)=>item.id==="speaking-self-review")!;
    expect(result).toMatchObject({unlocked:true,current:1,evidenceIds:["s1"]});
    expect(deriveEvidenceAchievements({...defaultState,speakingAttempts:[{...attempt,reflection:""}]}).find((item)=>item.id==="speaking-self-review")?.unlocked).toBe(false);
  });

  it("requires all 24 distinct A1 lessons without claiming an official CEFR certificate",()=>{
    const lessons=Array.from({length:24},(_,index)=>`a1-${String(index+1).padStart(2,"0")}`);
    const result=deriveEvidenceAchievements({...defaultState,completedLessonIds:[...lessons,"a1-01"]}).find((item)=>item.id==="a1-path-complete")!;
    expect(result).toMatchObject({unlocked:true,current:24,target:24});
    expect(result.descriptionAr).toContain("ليس شهادة CEFR رسمية");
  });

  it("accepts only a fully completed provider-scoped simulation session",()=>{
    const session={simulationId:"goethe-b2-full-01",provider:"goethe-b2" as const,mode:"continuous-timed" as const,status:"completed" as const,startedAt:"2026-09-08T08:00:00Z",deadlineAt:"2026-09-08T12:00:00Z",taskIds:["a","b"],completedTaskIds:["a","b"],currentTaskId:null,taskDrafts:{},completedAt:"2026-09-08T10:00:00Z"};
    const result=deriveEvidenceAchievements({...defaultState,examSessions:{[session.simulationId]:session}}).find((item)=>item.id==="full-exam-simulation")!;
    expect(result).toMatchObject({unlocked:true,current:1,evidenceIds:[session.simulationId]});
    const partial={...session,status:"active" as const,completedTaskIds:["a"],currentTaskId:"b",completedAt:undefined};
    expect(deriveEvidenceAchievements({...defaultState,examSessions:{[session.simulationId]:partial}}).find((item)=>item.id==="full-exam-simulation")?.unlocked).toBe(false);
  });

  it("derives without mutating learning state or writing any reward/mastery delta",()=>{
    const state={...defaultState,completedLessonIds:["a1-01"]};const before=structuredClone(state);const achievements=deriveEvidenceAchievements(state);
    expect(state).toEqual(before);
    expect(JSON.stringify(achievements)).not.toMatch(/masteryDelta|rewardPoints|officialScore/);
  });
});

describe("P1 fully optional gamification visibility",()=>{
  it("defaults to visible while allowing an exact functional-only message",()=>{
    expect(defaultState.motivationPreferences).toEqual(DEFAULT_MOTIVATION_PREFERENCES);
    expect(motivationPreferencesAreDefault(defaultState.motivationPreferences)).toBe(true);
    expect(functionalMessageWithOptionalPraise(false,"تم الحفظ.","أحسنت!")).toBe("تم الحفظ.");
    expect(functionalMessageWithOptionalPraise(true,"تم الحفظ.","مدح سلوكي.")).toBe("مدح سلوكي. تم الحفظ.");
  });

  it("defaults old schema-v3 records and rejects unknown preference values",()=>{
    const old=structuredClone(defaultState) as unknown as Record<string,unknown>;delete old.motivationPreferences;
    expect(learningStateSchema.parse(old).motivationPreferences).toEqual(DEFAULT_MOTIVATION_PREFERENCES);
    expect(()=>learningStateSchema.parse({...defaultState,motivationPreferences:{policyVersion:GAMIFICATION_VISIBILITY_POLICY,gamificationVisible:"sometimes"}})).toThrow();
  });

  it("uses the newer snapshot preference during merge without deleting evidence",()=>{
    const quiet={...defaultState,motivationPreferences:{policyVersion:GAMIFICATION_VISIBILITY_POLICY,gamificationVisible:false},completedLessonIds:["a1-01"],updatedAt:"2026-09-08T12:00:00Z"};
    const older={...defaultState,updatedAt:"2026-09-07T12:00:00Z"};
    const merged=mergeLearningStates(older,quiet);
    expect(merged.motivationPreferences.gamificationVisible).toBe(false);
    expect(merged.completedLessonIds).toEqual(["a1-01"]);
  });

  it("round-trips the quiet preference through DWNB",async()=>{
    const quiet={policyVersion:GAMIFICATION_VISIBILITY_POLICY,gamificationVisible:false} as const;
    const archive=await exportArchive({...defaultState,motivationPreferences:quiet},{includeMedia:false});
    expect((await importArchive(archive)).state.motivationPreferences).toEqual(quiet);
  });

  it("marks every praise-only surface and keeps mixed functional notices preference-aware",()=>{
    const files={coach:readFileSync("src/components/coach-dashboard.tsx","utf8"),review:readFileSync("src/app/review/page.tsx","utf8"),writing:readFileSync("src/components/writing-lab.tsx","utf8"),choice:readFileSync("src/components/targeted-choice-simulation.tsx","utf8"),targetWriting:readFileSync("src/components/targeted-writing-simulation.tsx","utf8"),speaking:readFileSync("src/components/speaking-lab.tsx","utf8"),continuous:readFileSync("src/components/continuous-exam-session.tsx","utf8")};
    for(const key of ["review","writing","choice","targetWriting"] as const)expect(files[key],key).toContain("gamification-surface");
    expect(files.coach).toContain("gamificationVisible");expect(files.coach).toContain("gamification-surface");
    expect(files.speaking).toContain("state.motivationPreferences.gamificationVisible");
    expect(files.continuous).toContain("state.motivationPreferences.gamificationVisible");
  });

  it("applies one root attribute and CSS rule while preserving functional content",()=>{
    const shell=readFileSync("src/components/app-shell.tsx","utf8");const css=readFileSync("src/app/globals.css","utf8");const settings=readFileSync("src/components/motivation-preferences-control.tsx","utf8");
    expect(shell).toContain("data-gamification-visible");
    expect(css).toContain('.app-frame[data-gamification-visible="false"] .gamification-surface');
    for(const marker of ["واجهة هادئة بالكامل","تخفي الإنجازات والسلسلة والمدح","لا يحذف الأدلة","لا عقوبة ولا Dark pattern"])expect(settings).toContain(marker);
  });
});
