import { describe, expect, it } from "vitest";
import { canCompleteInformationGap, evaluateInformationGap, INFORMATION_GAP_POLICY, INFORMATION_GAP_SCENARIO } from "@/core/speaking/information-gap";

describe("P0 genuine two-party information gap",()=>{
  it("keeps non-overlapping private facts for two roles",()=>{expect(INFORMATION_GAP_POLICY).toBe("two-party-information-gap-v1");expect(INFORMATION_GAP_SCENARIO.roleA.factsDe).not.toEqual(INFORMATION_GAP_SCENARIO.roleB.factsDe);expect(INFORMATION_GAP_SCENARIO.roleA.questionsDe).toHaveLength(3);expect(INFORMATION_GAP_SCENARIO.roleB.questionsDe).toHaveLength(3)});
  it("derives the joint decision from the exchanged constraints",()=>{expect(evaluateInformationGap("beta")).toBe(true);expect(evaluateInformationGap("alpha")).toBe(false)});
  it("requires a real partner, four turns, and the correct joint decision",()=>{expect(canCompleteInformationGap({partnerConfirmed:false,completedTurns:4,decision:"beta"})).toBe(false);expect(canCompleteInformationGap({partnerConfirmed:true,completedTurns:3,decision:"beta"})).toBe(false);expect(canCompleteInformationGap({partnerConfirmed:true,completedTurns:4,decision:"alpha"})).toBe(false);expect(canCompleteInformationGap({partnerConfirmed:true,completedTurns:4,decision:"beta"})).toBe(true)});
  it("never treats solo role rotation as two-party evidence",()=>{expect(canCompleteInformationGap({partnerConfirmed:false,completedTurns:99,decision:"beta"})).toBe(false)});
});
