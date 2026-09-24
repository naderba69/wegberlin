import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { arabicLearnerConfusions, registerExamples, wordFamilies } from "@/data/lexical-strategy-registry";
import { arabicLearnerConfusionSchema, buildLexicalStrategyAudit, registerExampleSchema, wordFamilySchema } from "@/core/content-validation/lexical-strategy";
import { buildModuleReviewQuestionPlan, lessonIsBeforeModule, moduleRecyclingSummaries } from "@/core/lexical-strategy/recycling";
import { LexicalStrategyExplorer } from "@/components/lexical-strategy-explorer";
import { LearningProvider } from "@/components/learning-provider";
import { ModuleReview } from "@/components/module-review";

describe("P1 calculated recycling and lexical strategy registry",()=>{
  it("keeps 32 authored families and 128 explicit members balanced across A1-B2",()=>{
    expect(wordFamilies).toHaveLength(32);expect(wordFamilies.reduce((sum,item)=>sum+item.members.length,0)).toBe(128);
    for(const level of ["A1","A2","B1","B2"])expect(wordFamilies.filter((item)=>item.level===level)).toHaveLength(8);
    expect(wordFamilies.every((item)=>wordFamilySchema.safeParse(item).success)).toBe(true);
  });

  it("rejects unknown family fields rather than silently accepting generated morphology",()=>{
    expect(wordFamilySchema.safeParse({...wordFamilies[0],inventedPlural:"must fail"}).success).toBe(false);
  });

  it("covers formal, neutral, colloquial, and professional with two examples per level and register",()=>{
    expect(registerExamples).toHaveLength(32);
    for(const level of ["A1","A2","B1","B2"] as const)for(const register of ["formal","neutral","colloquial","professional"] as const)expect(registerExamples.filter((item)=>item.level===level&&item.register===register)).toHaveLength(2);
    expect(registerExamples.every((item)=>registerExampleSchema.safeParse(item).success)).toBe(true);
  });

  it("requires an explicit regional and relationship boundary for colloquial examples",()=>{
    const example=registerExamples.find((item)=>item.register==="colloquial")!;const withoutBoundary:Partial<typeof example>={...example};delete withoutBoundary.regionalBoundaryAr;
    expect(registerExampleSchema.safeParse(withoutBoundary).success).toBe(false);
  });

  it("provides six bounded confusion records per level without diagnosing every Arabic speaker",()=>{
    expect(arabicLearnerConfusions).toHaveLength(24);expect(arabicLearnerConfusions.every((item)=>item.notUniversal&&arabicLearnerConfusionSchema.safeParse(item).success)).toBe(true);
    for(const level of ["A1","A2","B1","B2"])expect(arabicLearnerConfusions.filter((item)=>item.level===level)).toHaveLength(6);
    expect(new Set(arabicLearnerConfusions.map((item)=>item.source))).toEqual(new Set(["arabic-transfer","english-mediation","french-mediation"]));
  });

  it("builds exactly thirty ten-question module plans with versioned 0/20/30/40 ratios",()=>{
    expect(moduleRecyclingSummaries).toHaveLength(30);
    for(const summary of moduleRecyclingSummaries){const plan=buildModuleReviewQuestionPlan(summary.moduleId);expect(plan).toHaveLength(10);expect(new Set(plan.map((item)=>item.question.id)).size).toBe(10);expect(plan.filter((item)=>item.scope==="recycled")).toHaveLength(summary.recycledCount);expect(summary.recycledPercent).toBe(summary.level==="A1"?(summary.module===1?0:20):summary.level==="B2"?40:30);}
  });

  it("takes every recycled item from an earlier module and mixes vocabulary with grammar",()=>{
    for(const summary of moduleRecyclingSummaries.filter((item)=>item.recycledCount>0)){const recycled=buildModuleReviewQuestionPlan(summary.moduleId).filter((item)=>item.scope==="recycled");expect(recycled.every((item)=>lessonIsBeforeModule(item.sourceLessonId,summary.moduleId))).toBe(true);expect(recycled.some((item)=>item.contentKind==="vocabulary-retrieval")).toBe(true);expect(recycled.some((item)=>item.contentKind==="grammar-retrieval")).toBe(true);}
  });

  it("retains an honest zero-recycling baseline for the first module",()=>{
    const first=moduleRecyclingSummaries[0];expect(first).toMatchObject({moduleId:"A1.1",recycledCount:0,recycledPercent:0,currentCount:10,currentPercent:100,evidenceBoundary:"review-composition-ratio-no-automatic-mastery-or-cefr"});expect(buildModuleReviewQuestionPlan("A1.1").every((item)=>item.scope==="current")).toBe(true);
  });

  it("passes the combined strict audit with no internal lesson id in learner-visible registry copy",()=>{
    const audit=buildLexicalStrategyAudit();expect(audit).toMatchObject({ok:true,counts:{wordFamilies:32,wordFamilyMembers:128,registerExamples:32,arabicLearnerConfusions:24,moduleRecyclingPlans:30},issues:[]});expect(audit.registryRows.wordFamilies).toEqual(wordFamilies);
  });

  it("renders a German-first explorer without exposing content IDs",()=>{
    const html=renderToStaticMarkup(createElement(LexicalStrategyExplorer));expect(html).toContain('data-lexical-strategy-policy="lexical-strategy-registry-v1"');expect(html).toContain("Wortfamilien");expect(html).toContain("wohnen");expect(html).toContain("عائلات الكلمات");expect(html).not.toMatch(/a1-\d{2}-(?:e|m|rq|lq)\d/i);
  });

  it("renders a calculated module ratio and provenance labels in the real review UI",()=>{
    const lessons=academicLessonList.filter((lesson)=>lesson.level==="A2"&&lesson.module===1);const html=renderToStaticMarkup(createElement(LearningProvider,null,createElement(ModuleReview,{moduleId:"A2.1",titleAr:"الماضي",titleDe:"Erlebnisse",lessons,projectTitle:"مشروع",projectCopy:"مهمة نقل"})));
    expect(html).toContain('data-recycling-policy="module-recycling-ratio-v1"');expect(html).toContain("30%");expect(html).toContain("استرجاع من وحدات سابقة");expect((html.match(/data-recycling-scope="recycled"/g)??[])).toHaveLength(3);expect((html.match(/data-recycling-scope="current"/g)??[])).toHaveLength(7);const firstPlan=buildModuleReviewQuestionPlan("A2.1")[0].question;expect(html.indexOf(firstPlan.promptDe)).toBeLessThan(html.indexOf(firstPlan.promptAr));
  });
});
