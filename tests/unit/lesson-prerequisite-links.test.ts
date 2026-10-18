import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { grammarNodesByLesson } from "@/data/grammar-progression-registry";
import { lessonPrerequisiteLinks } from "@/data/lesson-prerequisite-links";
import { curriculumPosition, lessonIdOfTheory, LESSON_PREREQUISITE_POLICY, resolveLessonPrerequisites, validateLessonPrerequisiteLinks } from "@/core/lesson/lesson-prerequisites";
import { lessonTeachingContract } from "@/core/lesson/teaching-contract";
import { LessonPrerequisitePanel } from "@/components/lesson-prerequisite-panel";

describe("ADR-124 authored lesson prerequisite links", () => {
  it("passes the structural validator with zero issues", () => {
    expect(LESSON_PREREQUISITE_POLICY).toBe("authored-lesson-prerequisite-links-v1");
    expect(validateLessonPrerequisiteLinks()).toEqual([]);
  });

  it("covers every lesson that has no authored grammar node with parents, except the very first lesson", () => {
    const uncovered = academicLessonList
      .filter((lesson) => !(grammarNodesByLesson[lesson.id] ?? []).some((node) => node.prerequisiteIds.length > 0))
      .filter((lesson) => !lessonPrerequisiteLinks[lesson.id])
      .map((lesson) => lesson.id);
    expect(uncovered).toEqual(["a1-01"]);
    expect(Object.keys(lessonPrerequisiteLinks)).toHaveLength(72);
    expect(Object.values(lessonPrerequisiteLinks).flat()).toHaveLength(136);
  });

  it("only points backwards in the curriculum and to existing theory blocks", () => {
    for (const [lessonId, links] of Object.entries(lessonPrerequisiteLinks)) {
      expect(resolveLessonPrerequisites(lessonId)).toHaveLength(links.length);
      for (const link of links) expect(curriculumPosition(lessonIdOfTheory(link.theoryId)), `${lessonId} → ${link.theoryId}`).toBeLessThan(curriculumPosition(lessonId));
    }
  });

  it("rejects forward links, unknown blocks, Latin in the Arabic reason, and short reasons", () => {
    const issues = validateLessonPrerequisiteLinks({
      "a1-05": [{ theoryId: "a1-07-t1", reasonAr: "رابط إلى درس لاحق لا يصح أن يكون متطلبًا سابقًا لهذا الدرس أبدًا." }],
      "a1-06": [{ theoryId: "a1-01-t9", reasonAr: "كتلة شرح غير موجودة في الدرس الأول ولا يمكن الرجوع إليها." }],
      "a1-07": [{ theoryId: "a1-03-t2", reasonAr: "يحتاج هذا الدرس إلى Zahlen حتى الستين قبل قراءة الساعة بدقة." }],
      "a1-10": [{ theoryId: "a1-04-t1", reasonAr: "قصير جدًا." }],
    });
    expect(issues.join("\n")).toContain("a1-05: a1-07-t1 is not from an earlier lesson");
    expect(issues.join("\n")).toContain("a1-06: unknown theory block a1-01-t9");
    expect(issues.join("\n")).toContain("a1-07: reason for a1-03-t2 contains Latin letters");
    expect(issues.join("\n")).toContain("a1-10: reason for a1-04-t1 has");
  });

  it("answers contract question 2 with the authored link instead of curriculum order", () => {
    const lesson = academicLessonList.find((item) => item.id === "b2-14")!;
    const contract = lessonTeachingContract(lesson);
    expect(contract.gaps).toEqual([]);
    expect(contract.answers.prerequisites.ok).toBe(true);
    expect(contract.answers.prerequisites.valueAr).toContain("رابط مؤلَّف إلى شرح سابق بعينه");
    expect(contract.answers.prerequisites.valueAr).toContain("b2-11-t2");
  });

  it("renders the links in the rule stage as review pointers, not locks", () => {
    render(createElement(LessonPrerequisitePanel, { lessonId: "a1-19" }));
    expect(screen.getByRole("heading", { name: "يبني هذا الدرس على" })).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/lernen/a1-14", "/lernen/a1-10"]);
    expect(screen.getByText(/لا شرط إتقان ولا قفل/u)).toBeTruthy();
  });

  it("renders nothing for a lesson without authored links", () => {
    const { container } = render(createElement(LessonPrerequisitePanel, { lessonId: "a1-01" }));
    expect(container.innerHTML).toBe("");
  });
});
