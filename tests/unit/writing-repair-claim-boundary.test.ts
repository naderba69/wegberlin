// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { academicLessonList,academicLessons } from "@/data/academic-lessons";
import { analyzeWriting } from "@/core/writing/analyze";
import { buildWritingRepairExercises,createWritingRepairAttempt,detectWritingErrorPatterns,evaluateWritingRepair,WRITING_ERROR_PRACTICE_POLICY } from "@/core/writing/error-practice";
import { buildLessonClaimBoundary,CLAIM_BOUNDARY_POLICY } from "@/core/governance/claim-boundary";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";

describe("P1 micro practice from actual learner writing errors",()=>{
  it.each([
    ["Ich bin heißen Sami.","bin-heissen","Ich heiße Sami."],
    ["Ich kommen aus Tunesien.","ich-infinitive","Ich komme aus Tunesien."],
    ["Du wohnen in Berlin.","du-infinitive","Du wohnst in Berlin."],
    ["Er sprechen Deutsch.","third-person-infinitive","Er spricht Deutsch."],
    ["Ich bleibe zu Hause, weil ich bin krank.","weil-copula-order","Ich bleibe zu Hause, weil ich krank bin."],
    ["Ich habe nach Berlin gefahren.","movement-perfect-auxiliary","Ich bin nach Berlin gefahren."],
    ["ich lerne Deutsch.","sentence-capitalization","Ich lerne Deutsch."],
  ])("detects %s as %s and proposes only the deterministic local correction",(text,pattern,corrected)=>{
    expect(detectWritingErrorPatterns(text)).toContainEqual(expect.objectContaining({patternId:pattern,sourceExcerpt:text,correctedExcerpt:corrected,detector:"deterministic-local-pattern"}));
  });

  it("derives exercises only from literal bounded excerpts in a real submitted text",()=>{
    const text="Guten Tag! Ich kommen aus Tunesien. Ich bleibe hier, weil ich bin neu. Viele Grüße";
    const exercises=buildWritingRepairExercises({text,taskId:"a1-01",sourceSubmissionId:"writing-2",sourceVersion:2});
    expect(exercises).toHaveLength(2);
    expect(exercises.every((exercise)=>text.includes(exercise.sourceExcerpt)&&exercise.sourceExcerpt.length<=180)).toBe(true);
    expect(exercises.every((exercise)=>exercise.policyVersion===WRITING_ERROR_PRACTICE_POLICY&&exercise.sourceSubmissionId==="writing-2"&&exercise.sourceVersion===2)).toBe(true);
    expect(exercises.every((exercise)=>!("provider" in exercise)&&!("apiKey" in exercise)&&!("masteryDelta" in exercise))).toBe(true);
  });

  it("returns no fabricated exercise when no supported pattern was actually detected",()=>{
    const text="Guten Tag! Ich komme aus Tunesien. Ich lerne Deutsch. Viele Grüße";
    expect(detectWritingErrorPatterns(text)).toEqual([]);
    expect(buildWritingRepairExercises({text,taskId:"a1-01",sourceSubmissionId:"writing-ok",sourceVersion:1})).toEqual([]);
  });

  it("keeps correction hidden in the contract until a learner answer is committed",()=>{
    const exercise=buildWritingRepairExercises({text:"Ich kommen aus Tunis.",taskId:"a1-01",sourceSubmissionId:"writing-2",sourceVersion:2})[0];
    expect(exercise.promptDe).toBe("Korrigieren Sie den Satz aus Ihrem eigenen Text.");
    expect(evaluateWritingRepair(exercise,"Ich komme aus Tunis.")).toBe(true);
    expect(evaluateWritingRepair(exercise,"Ich kommen aus Tunis.")).toBe(false);
  });

  it("persists personal repair provenance without changing mastery or a level gate",()=>{
    const exercise=buildWritingRepairExercises({text:"Ich kommen aus Tunis.",taskId:"a1-01",sourceSubmissionId:"writing-2",sourceVersion:2})[0];
    const attempt=createWritingRepairAttempt(exercise,"Ich komme aus Tunis.",new Date("2026-09-08T12:00:00Z"));
    expect(attempt).toMatchObject({correct:true,patternId:"ich-infinitive",sourceSubmissionId:"writing-2",sourceVersion:2,evidenceBoundary:"personal-writing-repair-no-mastery-or-gate"});
    const parsed=learningStateSchema.parse({...defaultState,writingRepairAttempts:[attempt]});
    expect(parsed.mastery).toEqual(defaultState.mastery);
    expect(parsed.writingRepairAttempts).toEqual([attempt]);
  });

  it("makes a detected actual pattern fail only the limited grammar indicator",()=>{
    const analysis=analyzeWriting("Guten Tag! Ich kommen aus Tunesien. Ich lerne Deutsch, weil ich in Berlin arbeite. Viele Grüße",{minWords:10,taskPointsCompleted:1,taskPointsTotal:1});
    expect(analysis.errorPatterns).toHaveLength(1);
    expect(analysis.dimensions.find((dimension)=>dimension.key==="grammar")).toMatchObject({passed:false,evidenceQuote:"Ich kommen aus Tunesien."});
    expect(analysis.feedback.join(" ")).toContain("نمط محلي محدود");
  });

  it("merges repair attempts by evidence ID and never derives mastery from them",()=>{
    const exercise=buildWritingRepairExercises({text:"Du wohnen in Berlin.",taskId:"a1-01",sourceSubmissionId:"writing-2",sourceVersion:2})[0];
    const attempt=createWritingRepairAttempt(exercise,"Du wohnst in Berlin.",new Date("2026-09-08T12:00:00Z"));
    const merged=mergeLearningStates({...defaultState,writingRepairAttempts:[attempt]},{...defaultState,writingRepairAttempts:[attempt]});
    expect(merged.writingRepairAttempts).toEqual([attempt]);
    expect(merged.mastery).toEqual(defaultState.mastery);
  });

  it("renders a German-first delayed repair surface with a no-AI and no-mastery boundary",()=>{
    const source=readFileSync("src/components/writing-repair-practice.tsx","utf8");
    for(const marker of ["Aus Ihrem eigenen Text","exercise.promptDe","لا يُرسل نصك إلى AI","التصحيح قبل تثبيت محاولة","لا يرفع mastery"])expect(source).toContain(marker);
  });
});

describe("P1 language, common-practice, and official-rule boundary",()=>{
  it("classifies exactly three non-overlapping claim kinds in all 96 lessons",()=>{
    const boundaries=academicLessonList.map(buildLessonClaimBoundary);
    expect(boundaries).toHaveLength(96);
    for(const boundary of boundaries){
      expect(boundary.policyVersion).toBe(CLAIM_BOUNDARY_POLICY);
      expect(boundary.cards.map((card)=>card.kind)).toEqual(["language-rule","common-practice","official-requirement"]);
      expect(boundary.cards.map((card)=>card.authority)).toEqual(["authored-curriculum","context-dependent-practice","not-claimed"]);
      expect(boundary.evidenceBoundary).toBe("classification-guidance-not-legal-advice");
    }
  });

  it("anchors the language rule to the lesson but never turns common practice into law",()=>{
    const lesson=academicLessons["a1-01"];
    const boundary=buildLessonClaimBoundary(lesson);
    expect(boundary.cards.map((card)=>card.labelDe)).toEqual(["Sprachregel","Übliche Praxis","Offizielle Vorgabe / Gesetz"]);
    expect(boundary.cards[0]).toMatchObject({kind:"language-rule",sourceStatus:"lesson-owned",sourceRef:lesson.theory[0].id});
    expect(boundary.cards[1]).toMatchObject({kind:"common-practice",authority:"context-dependent-practice",sourceStatus:"not-applicable-no-official-claim"});
    expect(boundary.cards[1].statementAr).toContain("ليس إلزامًا قانونيًا");
  });

  it("flags administrative, housing, work, deadline, or health contexts for external verification",()=>{
    const flagged=academicLessonList.filter((lesson)=>buildLessonClaimBoundary(lesson).officialVerificationRequired);
    expect(flagged.length).toBeGreaterThanOrEqual(20);
    const housing=buildLessonClaimBoundary(academicLessons["b1-08"]);
    expect(housing.officialVerificationRequired).toBe(true);
    expect(housing.cards[2]).toMatchObject({kind:"official-requirement",authority:"not-claimed",sourceStatus:"not-applicable-no-official-claim"});
    expect(housing.cards[2].statementAr).toContain("تحقق من الجهة الرسمية");
  });

  it("does not fabricate an official source, legal deadline, document, or right",()=>{
    for(const lesson of academicLessonList){const official=buildLessonClaimBoundary(lesson).cards[2];expect(official.sourceRef).toBeUndefined();expect(official.authority).toBe("not-claimed");}
  });

  it("renders all three German-first labels and an explicit no-legal-advice boundary",()=>{
    const source=readFileSync("src/components/claim-boundary-panel.tsx","utf8");
    for(const marker of ["CLAIM_BOUNDARY_POLICY","card.labelDe","data-claim-kind","ليس استشارة قانونية","تحقق خارجي مطلوب"])expect(source).toContain(marker);
  });
});
