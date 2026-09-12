import { describe, expect, it } from "vitest";
import offlineManifest from "../../public/offline-routes.json";
import { curriculum } from "@/data/curriculum";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { fullExamSimulations } from "@/data/full-exam-simulations";

describe("full offline route manifest", () => {
  const routes = new Set(offlineManifest.routes);

  it("is deterministic, unique, safe, and limited to A1-B2", () => {
    expect(offlineManifest.format).toBe("dwnb-offline-routes");
    expect(offlineManifest.version).toBe(2);
    expect(offlineManifest.routeCount).toBe(306);
    expect(routes.size).toBe(offlineManifest.routeCount);
    for (const route of routes) {
      expect(route).toMatch(/^\/[a-z0-9./-]*$/);
      expect(route).not.toMatch(/\.\.|\\|\/c[12](?:-|\/)/i);
    }
  });

  it("publishes isolated A1/A2/B1/B2 choices plus the full pack",()=>{
    expect(offlineManifest.defaultPackId).toBe("full");
    expect(offlineManifest.packs.map((pack)=>[pack.id,pack.routeCount,pack.audioScope])).toEqual([
      ["a1",58,"a1"],["a2",58,"a2"],["b1",58,"b1"],["b2",207,"b2"],["full",306,"all"],
    ]);
    for(const pack of offlineManifest.packs)expect(new Set(pack.routes).size,pack.id).toBe(pack.routeCount);
    expect(offlineManifest.packs.find((pack)=>pack.id==="full")?.routes).toEqual(offlineManifest.routes);
  });

  it("prevents lower-level packs from silently including another level or B2 exams",()=>{
    for(const level of ["a1","a2","b1"] as const){
      const pack=offlineManifest.packs.find((item)=>item.id===level)!;
      expect(pack.routes).toContain(`/assessment/${level}`);
      expect(pack.routes.some((route)=>route.startsWith(`/lernen/${level}-`))).toBe(true);
      expect(pack.routes.some((route)=>/^\/lernen\/(?!a1-|a2-|b1-|b2-)/.test(route))).toBe(false);
      expect(pack.routes.some((route)=>route.startsWith("/exams"))).toBe(false);
      for(const other of ["a1","a2","b1","b2"].filter((item)=>item!==level))expect(pack.routes.some((route)=>route.startsWith(`/lernen/${other}-`)),`${level} leaked ${other}`).toBe(false);
    }
    const b2=offlineManifest.packs.find((item)=>item.id==="b2")!;
    expect(b2.routes.filter((route)=>route.startsWith("/exams/")).length).toBe(162);
  });

  it("contains all 84 published lessons, 30 modules, and four assessments", () => {
    const publishedLessons = curriculum.filter((lesson) => lesson.status === "published");
    expect(publishedLessons).toHaveLength(84);
    for (const lesson of publishedLessons) {
      const level = lesson.level.toLowerCase();
      expect(routes.has(`/lernen/${lesson.id}`)).toBe(true);
      expect(routes.has(`/module/${level}-${lesson.module}`)).toBe(true);
      expect(routes.has(`/assessment/${level}`)).toBe(true);
    }
    expect(new Set(publishedLessons.map((lesson) => `${lesson.level}-${lesson.module}`)).size).toBe(30);
  });

  it("contains all 150 provider-scoped exam tasks without mixing routes", () => {
    expect(allPublishedExamTasks).toHaveLength(150);
    const taskRoutes = allPublishedExamTasks.map((task) => `/exams/${task.provider}/${task.id}`);
    expect(new Set(taskRoutes)).toHaveLength(150);
    for (const route of taskRoutes) expect(routes.has(route)).toBe(true);
  });

  it("contains all twelve full simulation dashboards and essential shell pages", () => {
    expect(fullExamSimulations).toHaveLength(12);
    for (const simulation of fullExamSimulations) {
      expect(routes.has(`/exams/${simulation.provider}/full/${simulation.id}`)).toBe(true);
    }
    for (const route of ["/today", "/path", "/library", "/mediation", "/shadowing", "/exams", "/settings", "/progress"]) {
      expect(routes.has(route)).toBe(true);
    }
  });
});
