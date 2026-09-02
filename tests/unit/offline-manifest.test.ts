import { describe, expect, it } from "vitest";
import offlineManifest from "../../public/offline-routes.json";
import { curriculum } from "@/data/curriculum";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { fullExamSimulations } from "@/data/full-exam-simulations";

describe("full offline route manifest", () => {
  const routes = new Set(offlineManifest.routes);

  it("is deterministic, unique, safe, and limited to A1-B2", () => {
    expect(offlineManifest.format).toBe("dwnb-offline-routes");
    expect(offlineManifest.version).toBe(1);
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
