import{describe,expect,it}from"vitest";
import{defaultState}from"@/core/portability/db";
import type{LearningState,LearnerProfile}from"@/types/learning";
import{dailyReviewQuota,reviewBacklogPlan}from"@/core/review/daily-quota";
import{buildDueReviewQueue}from"@/core/srs/review-queue";
import{buildExamTargetForecast}from"@/core/coach/exam-target-forecast";

/**
 * ADR-107 · م5: كومة المراجعة تُسمّى ولا تُخفى، وتقدير الامتحان لا يحمّلها دينًا.
 * كل التواريخ بمكوّنات محلية (درس م41): «يوم الدراسة» محلي لا UTC.
 */
const now=new Date(2026,8,10,12);
const profile=(dailyMinutes:LearnerProfile["dailyMinutes"],targetDate:string):LearnerProfile=>({name:"Nadia",targetExam:"goethe-b2",targetDate,dailyMinutes,arabicSupport:"modern-standard-arabic",currentLevel:"A1",priorExperience:"none",createdAt:"2026-09-01T00:00:00Z"});
const withLessons=(dailyMinutes:LearnerProfile["dailyMinutes"],targetDate:string,lessons:string[]):LearningState=>({...defaultState,profile:profile(dailyMinutes,targetDate),completedLessonIds:lessons});
const LESSONS=["a1-01","a1-02","a1-03","a1-04"];
function breakdownOf(forecast:ReturnType<typeof buildExamTargetForecast>){
  if(!forecast.breakdown)throw new Error("تقدير بلا تاريخ هدف لا يحمل breakdown");
  return forecast.breakdown;
}

describe("review backlog honesty (ADR-107)",()=>{
 it("reads the same queue the coach and the report read, and hides nothing",()=>{
  const state=withLessons(10,"2026-12-20",LESSONS.slice(0,2));
  const plan=reviewBacklogPlan(state,now);
  expect(plan.due).toBe(buildDueReviewQueue(state,now).length);
  expect(plan.due).toBeGreaterThan(20);
  expect(plan.perDay).toBe(dailyReviewQuota(state,now).required);
  expect(plan.studyDaysToClear).toBe(Math.ceil(plan.due/plan.perDay));
  expect(plan.boundary).toBe("linear-drain-estimate-no-commitment-no-hidden-cards");
 });

 it("counts only what the learner's declared daily capacity can reach before the target",()=>{
  const state=withLessons(10,"2026-09-16",LESSONS); // ستة أيام متبقية × 3 بطاقات = 18
  const plan=reviewBacklogPlan(state,now);
  const forecast=buildExamTargetForecast(state,now);
  const breakdown=breakdownOf(forecast);
  const reviewable=Math.min(plan.due,18);
  expect(breakdown.reviewQueueCount).toBe(plan.due);
  expect(breakdown.reviewCapacityPerDay).toBe(3);
  expect(breakdown.dueReviewMinutes).toBe(Math.ceil(reviewable*45/60));
  expect(breakdown.reviewsDeferredCount).toBe(plan.due-reviewable);
  expect(breakdown.reviewsDeferredCount).toBeGreaterThan(0);
  expect(breakdown.dueReviewMinutes).toBeLessThan(Math.ceil(plan.due*45/60));
 });

 it("names the deferred pile as deferred, not as debt owed",()=>{
  const forecast=buildExamTargetForecast(withLessons(10,"2026-09-16",LESSONS),now);
  const joined=forecast.solutionsAr?.join(" ")??"";
  expect(joined).toContain("لا تُحتسب دينًا");
  expect(joined).toMatch(/في طابور المراجعة \d+ بطاقة/);
 });

 it("keeps the old full estimate when the pile genuinely fits before the target",()=>{
  const state=withLessons(60,"2027-09-10",LESSONS); // عام من الأيام بسقف 10 بطاقات/يوم
  const plan=reviewBacklogPlan(state,now);
  const forecast=buildExamTargetForecast(state,now);
  const breakdown=breakdownOf(forecast);
  expect(breakdown.reviewsDeferredCount).toBe(0);
  expect(breakdown.dueReviewMinutes).toBe(Math.ceil(plan.due*45/60));
 });

 it("never invents review minutes for a learner without a target date",()=>{
  const forecast=buildExamTargetForecast({...withLessons(10,"2026-09-16",LESSONS),profile:{...profile(10,"2026-09-16"),targetDate:undefined}},now);
  expect(forecast.status).toBe("no-date");
 });
});
