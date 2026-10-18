import { describe, expect, it } from "vitest";
import { academicLessonList, academicLessons } from "@/data/academic-lessons";
import { ARTICULATION_PROFILE_ASSIGNMENT_POLICY, articulationProfileByLesson } from "@/data/articulation-profile-assignments";
import { arabicLearnerPronunciationInventory } from "@/data/arabic-learner-pronunciation-inventory";
import { getArticulationGuide, getArticulationProfileId } from "@/core/pronunciation/articulation";

const profileOf = (id: string) => getArticulationGuide(academicLessons[id]).profileId;

describe("ADR-125 authored articulation profile per lesson", () => {
  it("assigns exactly one authored profile to every curriculum lesson and nothing else", () => {
    expect(ARTICULATION_PROFILE_ASSIGNMENT_POLICY).toBe("authored-articulation-profile-per-lesson-v1");
    const lessonIds = academicLessonList.map((lesson) => lesson.id).sort();
    expect(Object.keys(articulationProfileByLesson).sort()).toEqual(lessonIds);
    for (const lesson of academicLessonList) expect(getArticulationProfileId(lesson)).toBe(articulationProfileByLesson[lesson.id]);
  });

  it("uses the authored map instead of the keyword heuristic for mis-mapped foci", () => {
    expect(academicLessons["a2-11"].pronunciation.focus).toContain("ʏ");
    expect(profileOf("a2-11")).toBe("rounded");
    expect(profileOf("b2-21")).toBe("vowelLength");
    for (const id of ["b2-19", "b2-20"]) expect(profileOf(id)).toBe("achLaut");
    for (const id of ["a1-08", "a1-17", "a1-24", "a2-01", "a2-07", "a2-08", "a2-14", "a2-17", "a2-20", "b1-13", "b2-14", "b2-15", "b2-17", "b2-23"]) expect(profileOf(id)).toBe("wordStress");
  });

  it("keeps the generic statement/question prosody profile a minority and sentence-level foci on it", () => {
    const counts = new Map<string, number>();
    for (const lesson of academicLessonList) counts.set(getArticulationGuide(lesson).profileId, (counts.get(getArticulationGuide(lesson).profileId) ?? 0) + 1);
    expect(counts.get("prosody")).toBe(55);
    expect(counts.get("wordStress")).toBe(14);
    expect(counts.get("achLaut")).toBe(2);
    expect(counts.size).toBe(9);
    for (const id of ["a2-02", "a2-06", "a2-12", "b1-01", "b2-24"]) expect(profileOf(id)).toBe("prosody");
  });

  it("gives the new profiles honest, TTS-distinguishable contrasts and an appropriate diagram zone", () => {
    const stress = getArticulationGuide(academicLessons["a1-08"]);
    expect(stress.zone).toBe("rhythm");
    expect(stress.pairs.map((pair) => pair.id)).toEqual(["stress-umfahren", "stress-kaffee-cafe"]);
    const ach = getArticulationGuide(academicLessons["b2-19"]);
    expect(ach.zone).toBe("velum");
    expect(ach.pairs.map((pair) => pair.id)).toEqual(["ach-buch-buecher", "ach-dach-daecher"]);
    for (const pair of [...stress.pairs, ...ach.pairs]) {
      expect(pair.left.de).not.toBe(pair.right.de);
      expect(pair.left.ipa).not.toBe(pair.right.ipa);
    }
    for (const pair of ach.pairs) {
      expect(pair.left.ipa).toContain("x");
      expect(pair.right.ipa).toContain("ç");
    }
  });

  it("makes the word-stress and ach-Laut inventory rows interactive through lessons that really show the pair", () => {
    const interactive = arabicLearnerPronunciationInventory.filter((row) => row.interactivePairId);
    expect(interactive).toHaveLength(13);
    for (const row of interactive) {
      const shown = row.lessonIds.some((id) => getArticulationGuide(academicLessons[id]).pairs.some((pair) => pair.id === row.interactivePairId));
      expect(shown, row.id).toBe(true);
    }
    const ach = arabicLearnerPronunciationInventory.find((row) => row.id === "ar-pron-ach-ch");
    expect(ach).toMatchObject({ diagramProfileId: "achLaut", articulationZone: "velum", interactivePairId: "ach-dach-daecher", evidenceMode: "synthetic-discrimination" });
    const stress = arabicLearnerPronunciationInventory.find((row) => row.id === "ar-pron-word-stress");
    expect(stress).toMatchObject({ diagramProfileId: "wordStress", interactivePairId: "stress-umfahren", evidenceMode: "synthetic-discrimination" });
  });

  it("links every inventory row to lessons that really teach its sound and dates the row by its earliest lesson", () => {
    const levelOrder = ["A1", "A2", "B1", "B2"];
    for (const row of arabicLearnerPronunciationInventory) {
      const levels = row.lessonIds.map((id) => academicLessons[id].level);
      expect(row.level, row.id).toBe(levels.sort((a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b))[0]);
      const profiles = row.lessonIds.map((id) => getArticulationGuide(academicLessons[id]).profileId);
      if (row.category !== "prosody" && row.id !== "ar-pron-r-variants" && row.id !== "ar-pron-final-devoicing") expect(profiles, row.id).toContain(row.diagramProfileId);
    }
    expect(arabicLearnerPronunciationInventory.find((row) => row.id === "ar-pron-consonant-cluster")?.lessonIds).toEqual(["a1-06", "a1-16"]);
    expect(academicLessons["b2-18"].pronunciation.explanationAr).toContain("[p]");
  });
});
