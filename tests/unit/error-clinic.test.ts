import { describe, expect, it } from "vitest";
import { buildErrorClinics, ERROR_CLINIC_TRIGGER } from "@/core/errors/clinic";
import { matchesErrorCorrection } from "@/core/errors/remediation";
import type { ErrorRecord } from "@/types/learning";

const error=(id:string,type:ErrorRecord["type"],occurrences=1,resolved=false):ErrorRecord=>({id,type,wrong:`wrong-${id}`,correct:`correct-${id}`,explanationAr:"شرح",occurrences,lastSeenAt:`2026-08-${20+Number(id.replace(/\D/g,"")||0)}T10:00:00Z`,resolved,repairCount:0});

describe("P0 clustered error clinic",()=>{
  it("opens only after three active pieces of similar error evidence",()=>{expect(ERROR_CLINIC_TRIGGER).toBe(3);expect(buildErrorClinics([error("1","word-order",2)])).toEqual([]);const clinics=buildErrorClinics([error("1","word-order",3)]);expect(clinics).toHaveLength(1);expect(clinics[0]).toMatchObject({id:"error-clinic:word-order",evidenceCount:3})});
  it("groups distinct records of the same type instead of treating each question alone",()=>{const clinic=buildErrorClinics([error("1","case"),error("2","case"),error("3","case")])[0];expect(clinic.sourceErrorIds).toEqual(["3","2","1"]);expect(clinic.evidenceCount).toBe(3)});
  it("excludes resolved evidence from active clinic thresholds",()=>{expect(buildErrorClinics([error("1","grammar",2),error("2","grammar",1,true)])).toEqual([])});
  it("links every clinic to a rule, prevention trick, model correction, and transfer drill",()=>{for(const type of ["article","case","word-order","vocabulary","spelling","tense","grammar"] as const){const clinic=buildErrorClinics([error("1",type,3)])[0];expect(clinic.ruleAr.length).toBeGreaterThan(20);expect(clinic.trickAr.length).toBeGreaterThan(10);expect(clinic.modelWrong).not.toBe(clinic.modelCorrect);expect(clinic.followUpPromptAr.length).toBeGreaterThan(10);expect(matchesErrorCorrection(clinic.followUpAnswer,clinic.followUpAnswer)).toBe(true)}});
  it("prioritizes the cluster with more repeated evidence",()=>{const clinics=buildErrorClinics([error("1","vocabulary",3),error("2","word-order",5)]);expect(clinics.map(clinic=>clinic.type)).toEqual(["word-order","vocabulary"])});
});
