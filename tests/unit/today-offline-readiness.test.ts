import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { composeTodayMission, getCoachTarget } from "@/core/coach/coach";
import { buildTodayOfflineRequirements, TODAY_OFFLINE_READINESS_VERSION } from "@/core/offline/today-readiness";
import { defaultState } from "@/core/portability/db";
import type { LearningState } from "@/types/learning";

const beginnerState:LearningState={...defaultState,profile:{name:"Nadia",targetExam:"goethe-b2",dailyMinutes:20,arabicSupport:"modern-standard-arabic",currentLevel:"A1",priorExperience:"none",createdAt:"2026-09-08T08:00:00.000Z"}};

describe("P1 Today Offline readiness",()=>{
  it("derives only the current mission routes and exact lesson audio without downloading anything",()=>{
    const now=new Date("2026-09-08T09:00:00.000Z");const mission=composeTodayMission(beginnerState,now);const target=getCoachTarget(beginnerState,now);const requirements=buildTodayOfflineRequirements(beginnerState,mission,target);
    expect(requirements.policyVersion).toBe(TODAY_OFFLINE_READINESS_VERSION);
    expect(requirements.routes).toContain("/today");expect(requirements.routes).toContain("/lernen/a1-01");expect(requirements.routes).not.toContain("/lernen/a1-02");
    expect(requirements.audioAssets).toEqual(["/audio/lessons/a1-01.mp3"]);
  });

  it("does not invent a lesson-audio requirement for a diagnostic-only session",()=>{
    const state:LearningState={...beginnerState,profile:{...beginnerState.profile!,priorExperience:"some"}};const now=new Date("2026-09-08T09:00:00.000Z");const target=getCoachTarget(state,now);const requirements=buildTodayOfflineRequirements(state,composeTodayMission(state,now),target);
    expect(target.href).toBe("/diagnostic");expect(requirements.routes).toEqual(expect.arrayContaining(["/today","/diagnostic"]));expect(requirements.audioAssets).toEqual([]);
  });

  it("checks completed and shell caches through the controlling worker and never auto-downloads",async()=>{
    const worker=await readFile("public/sw.js","utf8");const handler=worker.slice(worker.indexOf('if (type === "DWNB_TODAY_READINESS_CHECK")'),worker.indexOf('if (type === "DWNB_OFFLINE_PACK_STATUS")'));
    expect(worker).toContain('const PACK_CACHE = "dwnb-full-pack-v161"');expect(worker).toContain('const PACK_STAGING_CACHE = "dwnb-full-pack-staging-v160"');expect(worker).toContain("async function checkTodayReadiness");expect(worker).toContain("caches.open(SHELL_CACHE)");expect(worker).toContain("caches.open(PACK_CACHE)");expect(handler).toContain("checkTodayReadiness");expect(handler).not.toContain("downloadSelectedPack");
  });
});
