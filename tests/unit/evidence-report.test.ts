import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { buildEvidenceReport } from "@/core/evidence/report";
import { defaultState } from "@/core/portability/db";
import { applySuccessfulErrorRepair } from "@/core/errors/remediation";

const now = new Date("2026-08-30T12:00:00.000Z");
const lesson = academicLessons["a1-01"];

describe("learner evidence report", () => {
  it("shows no fabricated skill percentages before evidence exists", () => {
    const report = buildEvidenceReport(defaultState, now);
    expect(report.skills.every((skill) => skill.score === null)).toBe(true);
    expect(report.overallScore).toBeNull();
    expect(report.dueReviews).toBe(0);
    expect(report.errorsPer100CheckedItems).toBeNull();
    expect(report.nextAction.titleAr).toContain("أول دليل");
  });

  it("uses the latest unique receptive attempt instead of counting retries", () => {
    const question = lesson.reading.questions[0];
    const state = {
      ...defaultState,
      exerciseAttempts: [
        { id:"old",lessonId:lesson.id,exerciseId:question.id,answer:"old",correct:true,createdAt:"2026-08-29T10:00:00Z" },
        { id:"new",lessonId:lesson.id,exerciseId:question.id,answer:"new",correct:false,createdAt:"2026-08-30T10:00:00Z" },
      ],
    };
    const reading = buildEvidenceReport(state, now).skills.find((skill) => skill.key === "reading")!;
    expect(reading.evidenceCount).toBe(1);
    expect(reading.correctCount).toBe(0);
    expect(reading.score).toBe(0);
  });

  it("derives productive indicators from saved submissions without claiming language quality", () => {
    const state = {
      ...defaultState,
      writingSubmissions: [
        { id:"w1",taskId:"a1-01",text:"Hallo",wordCount:1,version:1,status:"submitted" as const,feedback:[],createdAt:"2026-08-30T09:00:00Z",updatedAt:"2026-08-30T09:00:00Z" },
        { id:"w2",taskId:"a1-01",text:"Hallo Berlin",wordCount:2,version:2,status:"revised" as const,feedback:[],createdAt:"2026-08-30T10:00:00Z",updatedAt:"2026-08-30T10:00:00Z" },
      ],
      speakingAttempts: [{ id:"s1",taskId:"a1-01",durationSeconds:45,selfScore:4,reflection:"",createdAt:"2026-08-30T11:00:00Z" }],
    };
    const report = buildEvidenceReport(state, now);
    const writing = report.skills.find((skill) => skill.key === "writing")!;
    const speaking = report.skills.find((skill) => skill.key === "speaking")!;
    expect(writing.detailAr).toContain("1 مهام");
    expect(writing.detailAr).toContain("1 منقحة");
    expect(writing.boundaryAr).toContain("لا جودة اللغة");
    expect(speaking.detailAr).toContain("1 تسجيلات");
    expect(speaking.boundaryAr).toContain("لا يقيس النطق");
  });

  it("prioritizes actual due cards and repeated unresolved errors", () => {
    const state = {
      ...defaultState,
      completedLessonIds: ["a1-01", "a1-02"],
      errors: [{ id:"e1",type:"grammar" as const,wrong:"Wie du heißt?",correct:"Wie heißt du?",explanationAr:"ترتيب",occurrences:2,lastSeenAt:"2026-08-30T10:00:00Z",resolved:false }],
    };
    const report = buildEvidenceReport(state, now);
    expect(report.dueReviews).toBeGreaterThanOrEqual(20);
    expect(report.repeatedErrors).toBe(1);
    expect(report.nextAction.skill).toBe("review");
    expect(report.risks.some((risk) => risk.id === "errors")).toBe(true);
  });

  it("promotes three similar error occurrences into one clinic risk",()=>{const clustered={...defaultState,errors:[{id:"cluster",type:"word-order" as const,wrong:"weil ich habe Zeit",correct:"weil ich Zeit habe",explanationAr:"ترتيب",occurrences:3,lastSeenAt:"2026-08-30T10:00:00Z",resolved:false}]};const report=buildEvidenceReport(clustered,now);expect(report.risks.some((risk)=>risk.id==="error-clinic")).toBe(true);expect(report.risks.some((risk)=>risk.id==="errors")).toBe(false);expect(report.nextAction.titleAr).toContain("عيادة")});

  it("does not prioritize an error while its delayed retest is still waiting", () => {
    const error = applySuccessfulErrorRepair({ id:"e2",type:"grammar",wrong:"x",correct:"y",explanationAr:"",occurrences:2,lastSeenAt:"2026-08-30T09:00:00Z",resolved:false }, now);
    const waiting = buildEvidenceReport({ ...defaultState, errors:[error] }, new Date("2026-08-30T18:00:00Z"));
    const due = buildEvidenceReport({ ...defaultState, errors:[error] }, new Date("2026-08-31T09:00:00Z"));
    expect(waiting.pendingErrorReviews).toBe(1);
    expect(waiting.risks.some((risk) => risk.id === "error-retests")).toBe(false);
    expect(due.dueErrorReviews).toBe(1);
    expect(due.nextAction.titleAr).toContain("التأخير");
  });

  it("reports wrong checks per 100 recorded items with an explicit denominator", () => {
    const question = lesson.reading.questions[0];
    const attempts = [true, true, true, false].map((correct, index) => ({ id:`rate-${index}`,lessonId:lesson.id,exerciseId:question.id,answer:String(index),correct,createdAt:`2026-08-30T10:0${index}:00Z` }));
    const report = buildEvidenceReport({ ...defaultState, exerciseAttempts: attempts }, now);
    expect(report.checkedItemCount).toBe(4);
    expect(report.wrongCheckedItemCount).toBe(1);
    expect(report.errorsPer100CheckedItems).toBe(25);
  });

  it("calculates a real consecutive-day streak from study history", () => {
    const state = { ...defaultState, studyHistory: [{date:"2026-08-29",minutes:10,evidenceCount:1},{date:"2026-08-30",minutes:15,evidenceCount:2}] };
    expect(buildEvidenceReport(state, now).studyStreakDays).toBe(2);
  });
});
