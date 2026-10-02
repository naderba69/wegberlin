import { describe, expect, it } from "vitest";
import { composeTodayMission, missionRationale } from "@/core/coach/coach";
import { applyImmediateSessionAdaptation, chooseMissionAlternative, decideLoadReductionOffer, detectLoadReductionTrigger, effectiveSessionMinutes, LOAD_REDUCTION_OFFER_BOUNDARY, localSessionDate, MISSION_ALTERNATIVE_BOUNDARY, nextFocusLabel, recordLoadReductionOffer, recordVisibleSessionActivity, SESSION_ADAPTATION_BOUNDARY, SESSION_ADAPTATION_VERSION, saveDailyCheckIn, saveDailyReflection } from "@/core/coach/session-signals";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import type { LearnerProfile, LearningState } from "@/types/learning";

const profile = (dailyMinutes: LearnerProfile["dailyMinutes"]): LearnerProfile => ({
  name: "Nadia", targetExam: "goethe-b2", dailyMinutes, arabicSupport: "modern-standard-arabic", currentLevel: "A1", createdAt: "2026-08-01T00:00:00Z",
});
const diagnosticResult = { estimatedLevel:"A1" as const, score:3, maxScore:4, levelScores:{A1:3,A2:0,B1:0,B2:0}, completedAt:"2026-08-31T08:00:00Z" };
const stateFor = (dailyMinutes: LearnerProfile["dailyMinutes"]): LearningState => ({ ...defaultState, profile: profile(dailyMinutes), diagnosticResult, completedLessonIds:["a1-01"] });

describe("P0 daily session check-in and reflection", () => {
  it("stores a local-date check-in and caps low-energy load at twenty minutes", () => {
    const now = new Date(2026, 7, 31, 9, 0, 0);
    const checked = saveDailyCheckIn(stateFor(60), { availableMinutes: 45, energyBefore: 2 }, now);
    const key = localSessionDate(now);
    expect(checked.dailySessions[key]).toMatchObject({ date:key, availableMinutes:45, energyBefore:2 });
    expect(effectiveSessionMinutes(checked, now)).toBe(20);
  });

  it("respects the learner's real available time when energy is sufficient", () => {
    const now = new Date(2026, 7, 31, 9, 0, 0);
    const checked = saveDailyCheckIn(stateFor(90), { availableMinutes: 60, energyBefore: 4 }, now);
    expect(effectiveSessionMinutes(checked, now)).toBe(60);
  });

  it("carries a previous lighter-load decision into the next day until a new check-in overrides it", () => {
    const firstDay = new Date(2026, 7, 30, 20, 0, 0);
    const secondDay = new Date(2026, 7, 31, 9, 0, 0);
    const reflected = saveDailyReflection(stateFor(45), { difficultyAfter:5, confidenceAfter:2, reflection:"مرهقة", nextFocus:"lighter" }, firstDay);
    expect(effectiveSessionMinutes(reflected, secondDay)).toBe(20);
    const overridden = saveDailyCheckIn(reflected, { availableMinutes:45, energyBefore:4 }, secondDay);
    expect(effectiveSessionMinutes(overridden, secondDay)).toBe(45);
  });

  it("stores bounded reflection evidence and a clear next decision", () => {
    const now = new Date(2026, 7, 31, 20, 0, 0);
    const reflected = saveDailyReflection(stateFor(45), { difficultyAfter:4, confidenceAfter:2, reflection:`  ${"x".repeat(1100)}  `, nextFocus:"review" }, now);
    const record = reflected.dailySessions[localSessionDate(now)];
    expect(record.reflection).toHaveLength(1000);
    expect(record.nextFocus).toBe("review");
    expect(nextFocusLabel(record.nextFocus!)).toContain("المراجعة");
  });

  it("builds exact 10/20/30/45/60/90-minute sessions with check-in, production, and reflection", () => {
    for (const minutes of [10,20,30,45,60,90] as const) {
      const mission = composeTodayMission(stateFor(minutes), new Date(2026,7,31,9));
      expect(mission.reduce((sum, block) => sum + block.minutes, 0)).toBe(minutes);
      expect(mission.some((block) => block.kind === "check-in")).toBe(true);
      expect(mission.some((block) => block.kind === "production")).toBe(true);
      expect(mission.some((block) => block.kind === "reflection")).toBe(true);
    }
  });

  it("uses a real no-score retrieval warm-up before the first SRS card", () => {
    const state = { ...stateFor(20), completedLessonIds: [], reviewItems: [], dueReviews: 0 };
    const mission = composeTodayMission(state, new Date(2026,7,31,9));
    expect(mission.some((block) => block.kind === "review")).toBe(false);
    expect(mission.find((block) => block.kind === "warmup")).toMatchObject({ minutes:4, titleDe:"Abruf-Warm-up" });
    expect(mission.reduce((sum, block) => sum + block.minutes, 0)).toBe(20);
  });

  it("recomposes a shorter valid session without deleting completed evidence or changing mastery",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(45),{availableMinutes:45,energyBefore:4},now);const mission=composeTodayMission(checked,now);const state={...checked,completedBlockIds:[`${localSessionDate(now)}:check-in`]};const beforeMastery=structuredClone(state.mastery);const outcome=applyImmediateSessionAdaptation(state,mission,"less-time",now,"adapt-less");
    expect(outcome).toMatchObject({changed:true,record:{policyVersion:SESSION_ADAPTATION_VERSION,reason:"less-time",beforeMinutes:45,afterMinutes:30,completedBlockIdsBefore:["check-in"],evidenceBoundary:SESSION_ADAPTATION_BOUNDARY}});expect(outcome.state.completedBlockIds).toEqual(state.completedBlockIds);expect(outcome.state.mastery).toEqual(beforeMastery);expect(composeTodayMission(outcome.state,now).reduce((sum,block)=>sum+block.minutes,0)).toBe(30);
  });

  it("treats too-hard as a planning signal and caps the remaining plan without correctness evidence",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(60),{availableMinutes:60,energyBefore:4},now);const outcome=applyImmediateSessionAdaptation(checked,composeTodayMission(checked,now),"too-hard",now,"adapt-hard");
    expect(outcome.record.afterMinutes).toBe(20);expect(outcome.state.dailySessions[localSessionDate(now)].planningSignal).toBe("too-hard");expect(effectiveSessionMinutes(outcome.state,now)).toBe(20);expect(outcome.state.exerciseAttempts).toEqual(checked.exerciseAttempts);
  });

  it("moves bounded time from guided practice to production when the learner reports too-easy",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(45),{availableMinutes:45,energyBefore:4},now);const before=composeTodayMission(checked,now);const outcome=applyImmediateSessionAdaptation(checked,before,"too-easy",now,"adapt-easy");const after=composeTodayMission(outcome.state,now);
    expect(outcome.record).toMatchObject({beforeMinutes:45,afterMinutes:45,evidenceBoundary:"planning-signal-no-mastery-or-correctness"});expect(after.find((block)=>block.id==="practice")?.minutes).toBe((before.find((block)=>block.id==="practice")?.minutes??0)-3);expect(after.find((block)=>block.id==="production")?.minutes).toBe((before.find((block)=>block.id==="production")?.minutes??0)+3);expect(after.reduce((sum,block)=>sum+block.minutes,0)).toBe(45);
  });

  it("never shortens below already completed blocks plus the closing reflection",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(45),{availableMinutes:45,energyBefore:4},now);const mission=composeTodayMission(checked,now);const date=localSessionDate(now);const protectedState={...checked,completedBlockIds:mission.filter((block)=>block.id!=="reflection").map((block)=>`${date}:${block.id}`)};const outcome=applyImmediateSessionAdaptation(protectedState,mission,"less-time",now,"adapt-protected");expect(outcome.changed).toBe(false);expect(outcome.record.afterMinutes).toBe(45);expect(outcome.state.completedBlockIds).toEqual(protectedState.completedBlockIds);
  });

  it("uses a learner-stated concern only as a supportive planning note, never as a level claim",()=>{const state={...stateFor(20),profile:{...profile(20),onboardingContext:{policyVersion:"prior-experience-context-v1" as const,priorLearningSources:["book" as const],concerns:["speaking" as const],evidenceBoundary:"learner-stated-planning-context-no-level-or-mastery" as const}}};expect(missionRationale(state)).toContain("الكلام يقلقك");expect(missionRationale(state)).not.toContain("مستواك هو")});

  it("substitutes a declined mission with the same objective, evidence kind, and minutes without completing the original",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(45),{availableMinutes:45,energyBefore:4},now);const before=composeTodayMission(checked,now);const original=before.find((block)=>block.id==="practice")!;const mastery=structuredClone(checked.mastery);const outcome=chooseMissionAlternative(checked,before,"practice",now,"alternative-choice-1");
    expect(outcome.record).toMatchObject({policyVersion:"equivalent-mission-alternative-v1",originalBlockId:"practice",alternativeBlockId:"alternative-practice",objectiveSnapshot:original.objective,evidenceKind:original.evidenceKind,minutes:original.minutes,originalCompletedAtSelection:false,evidenceBoundary:MISSION_ALTERNATIVE_BOUNDARY});
    expect(outcome.state.completedBlockIds).toEqual(checked.completedBlockIds);expect(outcome.state.mastery).toEqual(mastery);
    const after=composeTodayMission(outcome.state,now);const alternative=after.find((block)=>block.id==="alternative-practice");expect(alternative).toMatchObject({alternativeForId:"practice",objective:original.objective,evidenceKind:original.evidenceKind,minutes:original.minutes});expect(after.some((block)=>block.id==="practice")).toBe(false);
    expect(learningStateSchema.safeParse(outcome.state).success).toBe(true);
  });

  it("offers one learner-controlled reduction after three consecutive session errors and preserves all evidence",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(45),{availableMinutes:45,energyBefore:4},now);const attempted:{state:LearningState}={state:{...checked,exerciseAttempts:[1,2,3].map((value)=>({id:`wrong-${value}`,lessonId:"a1-02",exerciseId:`e-${value}`,answer:"x",correct:false,createdAt:new Date(2026,7,31,9,value).toISOString()}))}};const mission=composeTodayMission(attempted.state,now);const signal=detectLoadReductionTrigger(attempted.state,mission,new Date(2026,7,31,9,5))!;
    expect(signal).toMatchObject({trigger:"consecutive-errors",consecutiveErrorCount:3,plannedSeconds:2700});
    const offered=recordLoadReductionOffer(attempted.state,signal,new Date(2026,7,31,9,5),"load-offer-1");expect(offered.dailySessions[localSessionDate(now)].loadReductionOffer).toMatchObject({status:"pending",offeredOnce:true,evidenceBoundary:LOAD_REDUCTION_OFFER_BOUNDARY});expect(detectLoadReductionTrigger(offered,mission,new Date(2026,7,31,9,6))).toBeNull();
    const beforeAttempts=structuredClone(offered.exerciseAttempts);const beforeMastery=structuredClone(offered.mastery);const decision=decideLoadReductionOffer(offered,mission,true,new Date(2026,7,31,9,7));expect(decision.adaptationRecord).toMatchObject({reason:"load-suggestion",afterMinutes:20});expect(decision.state.dailySessions[localSessionDate(now)].loadReductionOffer?.status).toBe("accepted");expect(decision.state.exerciseAttempts).toEqual(beforeAttempts);expect(decision.state.mastery).toEqual(beforeMastery);expect(learningStateSchema.safeParse(decision.state).success).toBe(true);
  });

  it("counts only bounded visible activity and accepts a no-penalty decline after a real active-time overrun",()=>{
    const now=new Date(2026,7,31,9);const checked=saveDailyCheckIn(stateFor(45),{availableMinutes:45,energyBefore:4},now);const counted=recordVisibleSessionActivity(checked,900,new Date(2026,7,31,9,2));expect(counted.dailySessions[localSessionDate(now)].activeSeconds).toBe(120);
    const overrun={...counted,dailySessions:{...counted.dailySessions,[localSessionDate(now)]:{...counted.dailySessions[localSessionDate(now)],activeSeconds:3400}}};const mission=composeTodayMission(overrun,now);const signal=detectLoadReductionTrigger(overrun,mission,new Date(2026,7,31,10))!;expect(signal.trigger).toBe("active-time-overrun");const offered=recordLoadReductionOffer(overrun,signal,new Date(2026,7,31,10),"load-offer-time");const decision=decideLoadReductionOffer(offered,mission,false,new Date(2026,7,31,10,1));expect(decision.adaptationRecord).toBeUndefined();expect(decision.state.dailySessions[localSessionDate(now)].loadReductionOffer).toMatchObject({status:"declined",decidedAt:expect.any(String)});expect(decision.state.completedBlockIds).toEqual(overrun.completedBlockIds);expect(decision.state.mastery).toEqual(overrun.mastery);
  });
});
