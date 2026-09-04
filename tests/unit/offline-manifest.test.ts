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
    expect(offlineManifest.routeCount).toBe(298);
    expect(routes.size).toBe(offlineManifest.routeCount);
    for (const route of routes) {
      expect(route).toMatch(/^\/[a-z0-9./-]*$/);
      expect(route).not.toMatch(/\.\.|\\|\/c[12](?:-|\/)/i);
    }
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

describe("per-level Offline packs", () => {
  const levelPacks = offlineManifest.levelPacks as unknown as Record<string, { routeCount: number; routes: string[] }>;

  it("exposes one full scope and one scope per published level", () => {
    expect(Object.keys(levelPacks).sort()).toEqual(["A1", "A2", "B1", "B2", "full"]);
    expect(offlineManifest.version).toBe(2);
    expect(levelPacks.full.routeCount).toBe(298);
    expect(levelPacks.full.routes).toEqual(offlineManifest.routes);
  });

  it("keeps every level pack a superset of the shared core routes", () => {
    const fullRoutes = new Set(offlineManifest.routes);
    const levelSets = {
      A1: new Set(levelPacks.A1.routes),
      A2: new Set(levelPacks.A2.routes),
      B1: new Set(levelPacks.B1.routes),
      B2: new Set(levelPacks.B2.routes),
    };
    for (const route of levelPacks.A1.routes) {
      if (!levelSets.A2.has(route)) continue;
      expect(["/", "/today", "/path", "/library", "/exams", "/settings", "/progress", "/search", "/shadowing", "/mediation", "/practice", "/review", "/tutor", "/errors", "/writing", "/speaking", "/diagnostic", "/manifest.webmanifest"], route).toContain(route);
    }
    for (const [level, routes] of Object.entries(levelSets)) {
      expect(routes.size, level).toBe(levelPacks[level as keyof typeof levelPacks].routeCount);
      for (const route of routes) expect(fullRoutes.has(route), `${level}: ${route}`).toBe(true);
    }
    for (const route of ["/today", "/path", "/library", "/settings", "/progress", "/search"]) {
      for (const level of ["A1", "A2", "B1", "B2"]) expect(levelSets[level as keyof typeof levelSets].has(route), `${level}: ${route}`).toBe(true);
    }
  });

  it("assigns every lesson, module, and gate route to its own level pack only", () => {
    const publishedLessons = curriculum.filter((lesson) => lesson.status === "published");
    for (const lesson of publishedLessons) {
      const level = lesson.level;
      const lessonRoute = `/lernen/${lesson.id}`;
      expect(levelPacks[level].routes, lessonRoute).toContain(lessonRoute);
      for (const other of ["A1", "A2", "B1", "B2"].filter((item) => item !== level)) {
        expect(levelPacks[other].routes, `${other} must not own ${lessonRoute}`).not.toContain(lessonRoute);
      }
    }
    for (const level of ["A1", "A2", "B1", "B2"]) {
      expect(levelPacks[level].routes).toContain(`/assessment/${level.toLowerCase()}`);
    }
  });

  it("keeps B2 the only level pack that carries exam task routes", () => {
    const examRoutes = offlineManifest.routes.filter((route) => route.startsWith("/exams/"));
    expect(examRoutes).toHaveLength(162);
    for (const route of examRoutes) {
      expect(levelPacks.B2.routes, route).toContain(route);
      expect(levelPacks.A1.routes, route).not.toContain(route);
      expect(levelPacks.B1.routes, route).not.toContain(route);
    }
    expect(levelPacks.A1.routeCount).toBe(51);
    expect(levelPacks.A2.routeCount).toBe(51);
    expect(levelPacks.B1.routeCount).toBe(51);
    expect(levelPacks.B2.routeCount).toBe(199);
  });

  it("never leaks C1/C2 routes into any pack scope", () => {
    for (const scope of Object.values(levelPacks)) {
      for (const route of scope.routes) expect(route).not.toMatch(/\/c[12](?:-|\/)/i);
    }
  });
});
