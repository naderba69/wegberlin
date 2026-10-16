import { describe, expect, it } from "vitest";
import { academicLessons } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";

// v215: the lesson list (curriculum seeds) and the lesson page (academic lessons) showed 27 different
// titles for the same lesson. The authored lesson is the single source; the seeds must mirror it.
describe("curriculum title parity", () => {
  it("shows the same German and Arabic title in the lesson list and on the lesson page", () => {
    const drift = curriculum.flatMap((meta) => {
      const lesson = academicLessons[meta.id];
      if (!lesson) return [`${meta.id}: no authored lesson`];
      const issues: string[] = [];
      if (meta.titleDe !== lesson.titleDe) issues.push(`${meta.id} titleDe ${meta.titleDe} ≠ ${lesson.titleDe}`);
      if (meta.titleAr !== lesson.titleAr) issues.push(`${meta.id} titleAr ${meta.titleAr} ≠ ${lesson.titleAr}`);
      if (meta.module !== lesson.module) issues.push(`${meta.id} module ${meta.module} ≠ ${lesson.module}`);
      return issues;
    });
    expect(drift).toEqual([]);
  });

  it("keeps every Arabic lesson title unique so two lessons are never confused in lists", () => {
    const titles = curriculum.map((meta) => meta.titleAr);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
