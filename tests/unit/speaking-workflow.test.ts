import { describe, expect, it } from "vitest";
import { canSaveSpeakingReview, speakingDurationBand, speakingPreparationSeconds, speakingTargetSeconds } from "@/core/speaking/workflow";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";

describe("P0 speaking evidence workflow",()=>{
  it("extracts explicit second ranges and uses their upper bound",()=>{expect(speakingTargetSeconds("Sprechen Sie 20–30 Sekunden über Ihre Arbeit.","A1")).toBe(30);expect(speakingTargetSeconds("Sprechen Sie 45 Sekunden.","A2")).toBe(45)});
  it("extracts numeric and German-word minute targets",()=>{expect(speakingTargetSeconds("Sprechen Sie 2 Minuten.","B1")).toBe(120);expect(speakingTargetSeconds("Vertreten Sie drei Minuten lang einen Standpunkt.","B2")).toBe(180)});
  it("uses bounded preparation defaults by level",()=>{expect(["A1","A2","B1","B2"].map((level)=>speakingPreparationSeconds(level as "A1"|"A2"|"B1"|"B2"))).toEqual([15,30,45,60])});
  it("reports duration bands without pretending to score pronunciation",()=>{expect(speakingDurationBand(15,30)).toBe("short");expect(speakingDurationBand(25,30)).toBe("within-range");expect(speakingDurationBand(40,30)).toBe("long")});
  it("requires full playback and a specific reflection before saving",()=>{expect(canSaveSpeakingReview({listenedBack:false,reflection:"فجوة واضحة"})).toBe(false);expect(canSaveSpeakingReview({listenedBack:true,reflection:"فجوة واضحة"})).toBe(true);expect(canSaveSpeakingReview({listenedBack:true,reflection:"  "})).toBe(false)});
  it("validates persisted self-review evidence and retry provenance",()=>{const parsed=learningStateSchema.parse({...defaultState,speakingAttempts:[{id:"s2",taskId:"a1-01",mediaId:"m2",durationSeconds:28,selfScore:4,reflection:"سأحسن ترتيب السؤال",selfReview:{listenedBack:true,achievedCriteria:["طرحت سؤالًا"],clarityScore:4,turnTaking:true,repairUsed:false,preparationNotes:["Name","Frage"]},targetSeconds:30,preparationSeconds:12,retryOf:"s1",createdAt:"2026-08-31T10:00:00Z"}]});expect(parsed.speakingAttempts[0].selfReview?.listenedBack).toBe(true);expect(parsed.speakingAttempts[0].retryOf).toBe("s1")});
});
