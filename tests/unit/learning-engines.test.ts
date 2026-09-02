import { describe,expect,it } from "vitest";
import { calculateSM2,newReviewItem } from "@/core/srs/sm2";
import { evaluateDiagnostic } from "@/core/diagnostic/evaluate";
import { diagnosticForms } from "@/data/diagnostic";
import { analyzeWriting } from "@/core/writing/analyze";

describe("SM-2",()=>{
  it("schedules first successful recall after one day",()=>{const item=calculateSM2(newReviewItem("x"),4,new Date("2026-08-26T18:00:00Z"));expect(item.repetitions).toBe(1);expect(item.interval).toBe(1);expect(item.nextReviewDate).toBe("2026-08-27T00:00:00.000Z")});
  it("resets repetitions after failure",()=>{const base={...newReviewItem("x"),repetitions:4,interval:20};const item=calculateSM2(base,2,new Date("2026-08-26T00:00:00Z"));expect(item.repetitions).toBe(0);expect(item.interval).toBe(1)});
  it("rejects an invalid grade",()=>expect(()=>calculateSM2(newReviewItem("x"),6)).toThrow(RangeError));
});

describe("diagnostic",()=>{
  it("places a fully correct learner at B2",()=>{const answers=Object.fromEntries(diagnosticForms.A.map((question)=>[question.id,question.correctIndex]));expect(evaluateDiagnostic(answers,"A").result.estimatedLevel).toBe("B2")});
  it("records useful errors",()=>{const answers=Object.fromEntries(diagnosticForms.A.map((question)=>[question.id,0]));expect(evaluateDiagnostic(answers,"A").errors.length).toBeGreaterThan(0)});
});

describe("writing analysis",()=>{
  it("counts words and requests revision",()=>{const result=analyzeWriting("ich ali");expect(result.wordCount).toBe(2);expect(result.feedback.length).toBeGreaterThan(0)});
  it("passes structural checks for a suitable short introduction",()=>{const result=analyzeWriting("Hallo! Ich heiße Ali und ich komme aus Tunesien. Ich wohne jetzt in Tunis. Ich lerne Deutsch, weil ich in Deutschland studieren möchte. Wie heißt du und wo wohnst du? Viele Grüße von Ali.");expect(result.wordCount).toBeGreaterThanOrEqual(30);expect(result.checks.filter((c)=>c.passed).length).toBeGreaterThanOrEqual(4)});
});
