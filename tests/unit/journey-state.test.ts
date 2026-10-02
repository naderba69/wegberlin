import { describe, expect, it } from "vitest";
import { deriveJourneyState, JOURNEY_STATE_POLICY_VERSION, journeyPhases } from "@/core/coach/journey-state";
import { verifiedThrough,evidenceTestNow as now } from "../helpers/verified-learning-state";
import { defaultState } from "@/core/portability/db";
import { curriculum } from "@/data/curriculum";

const profile={name:"Nadia",targetExam:"goethe-b2" as const,dailyMinutes:45 as const,arabicSupport:"modern-standard-arabic" as const,currentLevel:"A1" as const,priorExperience:"some" as const,createdAt:"2026-09-01T00:00:00Z"};
const diagnosticResult={estimatedLevel:"A1" as const,score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},completedAt:"2026-09-01T10:00:00Z"};

describe("P1 explicit journey state machine",()=>{
  it("owns five ordered phases and one stable policy version",()=>{expect(JOURNEY_STATE_POLICY_VERSION).toBe("journey-state-machine-v1");expect(journeyPhases.map((phase)=>phase.id)).toEqual(["orientation","foundation","growth","consolidation","exam-readiness"])});
  it("keeps a learner in orientation until onboarding and the appropriate starting decision exist",()=>{expect(deriveJourneyState(defaultState)).toMatchObject({phaseId:"orientation",phaseIndex:0,progressPercent:0});expect(deriveJourneyState({...defaultState,profile})).toMatchObject({phaseId:"orientation",progressPercent:50});expect(deriveJourneyState({...defaultState,profile:{...profile,priorExperience:"none"}}).phaseId).toBe("foundation")});
  it("derives foundation from A1/A2 evidence instead of browser navigation",()=>{const state={...defaultState,profile,diagnosticResult,completedLessonIds:curriculum.filter((lesson)=>lesson.level==="A1").slice(0,12).map((lesson)=>lesson.id)};const phase=deriveJourneyState(state);expect(phase.phaseId).toBe("foundation");expect(phase.progressPercent).toBe(24);expect(phase.nextTransitionAr).toContain("بوابتي الأدلة")});
  it("enters growth only after the A2 gate and tracks B1/B2 completion",()=>{const base=verifiedThrough(["A1","A2"],now);const b1=curriculum.filter(l=>l.level==="B1").slice(0,14).map(l=>l.id);const phase=deriveJourneyState({...base,completedLessonIds:[...base.completedLessonIds,...b1]},now);expect(phase).toMatchObject({phaseId:"growth",phaseIndex:2});expect(phase.progressPercent).toBeGreaterThan(25)});
  it("uses consolidation after all lessons until a fresh internal B2 evidence gate",()=>{const base=verifiedThrough(["A1","A2","B1"],now);const phase=deriveJourneyState({...base,completedLessonIds:curriculum.map(l=>l.id)},now);expect(phase).toMatchObject({phaseId:"consolidation",phaseIndex:3});expect(phase.evidenceBoundaryAr).toContain("ليست حكم CEFR")});
  it("enters provider-scoped exam readiness only after independent B2 evidence, not a legacy cache",()=>{const base=verifiedThrough(["A1","A2","B1","B2"],now);const phase=deriveJourneyState({...base,profile:{...base.profile!,targetExam:"telc-deutsch-b2"}},now);expect(phase).toMatchObject({phaseId:"exam-readiness",phaseIndex:4,progressPercent:0});expect(phase.reasonAr).toContain("telc");expect(phase.nextTransitionAr).toContain("5/5")});
});
