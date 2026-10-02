import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeaningFirstCasePanel } from "@/components/meaning-first-case-panel";
import { meaningFirstCaseContracts } from "@/data/case-teaching-registry";
import { buildMeaningFirstCaseAudit } from "@/core/content-validation/meaning-first-case";

const audit=buildMeaningFirstCaseAudit();

describe("P0 meaning-first case teaching",()=>{
  it("covers every explicit case signal with zero structural gaps",()=>{
    expect(audit.ok,audit.issues.join("\n")).toBe(true);
    expect(audit).toMatchObject({version:"meaning-first-case-audit-v1",contractCount:19,lessonCount:19,theoryReferenceCount:23,controlledReferenceCount:57,assessmentReferenceCount:44,discoveredSignals:{theory:20,controlled:20,assessment:20},byLevel:{A1:6,A2:4,B1:4,B2:5}});
  });

  it("forces the sequence meaning then role then form",()=>{
    for(const contract of meaningFirstCaseContracts){
      expect(contract.sequence,contract.id).toEqual(["meaning","role","form"]);
      expect(contract.semanticQuestionAr,contract.id).not.toMatch(/Akkusativ|Dativ|Genitiv|Nominativ|Kasus|نهاي|أداة/u);
      expect(contract.roleChoicesAr.length,contract.id).toBeGreaterThanOrEqual(2);
      expect(contract.formRuleAr,contract.id).toMatch(/Akkusativ|Dativ|Genitiv|Nominativ|نهاي|أداة|ضمير/u);
    }
  });

  it("maps every contract to teaching, controlled practice, and assessment IDs",()=>{
    for(const contract of meaningFirstCaseContracts){
      expect(contract.theoryIds.length,contract.id).toBeGreaterThan(0);
      expect(contract.controlledExerciseIds.length,contract.id).toBeGreaterThan(0);
      expect(contract.assessmentIds.length,contract.id).toBeGreaterThan(0);
      expect(new Set([...contract.theoryIds,...contract.controlledExerciseIds,...contract.assessmentIds]).size,contract.id).toBe(contract.theoryIds.length+contract.controlledExerciseIds.length+contract.assessmentIds.length);
    }
  });

  it("covers Nominativ, Akkusativ, Dativ, and Genitiv across A1-B2",()=>{
    expect(new Set(meaningFirstCaseContracts.flatMap((item)=>item.governedCases))).toEqual(new Set(["nominative","accusative","dative","genitive"]));
  });

  it("renders the German-first three-step panel before forms",()=>{
    render(createElement(MeaningFirstCasePanel,{lessonId:"a1-14"}));
    expect(screen.getByText("Bedeutung → Rolle → Form")).toBeTruthy();
    expect(screen.getByText("Bedeutung verstehen")).toBeTruthy();
    expect(screen.getByText("Rolle bestimmen")).toBeTruthy();
    expect(screen.getByText("Form prüfen")).toBeTruthy();
    expect(screen.getByText(/هل نصف مكان الشيء الآن/)).toBeTruthy();
    expect(screen.getByText(/مكان ثابت يجيب عن Wo/)).toBeTruthy();
    expect(screen.getByText(/في أمثلة المكان الثابت هنا اختر Dativ/)).toBeTruthy();
  });

  it("stays absent in lessons without a case-teaching contract",()=>{
    const {container}=render(createElement(MeaningFirstCasePanel,{lessonId:"a1-01"}));
    expect(container.childElementCount).toBe(0);
  });
});
