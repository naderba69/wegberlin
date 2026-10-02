import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import {
  adaptiveWritingGoal,
  completedFourSkillPhraseIndexes,
  fourSkillPhraseAttemptId,
  validateAdaptiveWriting,
} from "@/core/lessons/four-skill-cycle";
import type { ExerciseAttempt } from "@/types/learning";

describe("adaptive four-skill vocabulary cycle", () => {
  it("has a non-empty phrase target set in every published lesson", () => {
    expect(academicLessonList).toHaveLength(96);
    expect(academicLessonList.every((lesson) => lesson.phrases.length > 0)).toBe(true);
  });

  it("uses automatic local word checking and terminal completion instead of modulo or self-report", () => {
    const ui = readFileSync("src/components/four-skill-vocabulary-cycle.tsx", "utf8");
    const checker = readFileSync("src/components/phrase-pronunciation-check.tsx", "utf8");
    const runner = readFileSync("src/components/lesson-runner.tsx", "utf8");
    for (const token of [
      "Lesen · Hören · Schreiben · Sprechen",
      "PhrasePronunciationCheck",
      "completedPhraseIndexes",
      "onPhraseAttempt",
      "onComplete",
      "انتقال تلقائي",
    ]) expect(ui).toContain(token);
    expect(ui).not.toContain("%lesson.phrases.length");
    expect(ui).not.toContain("setSpoken(true)}");
    expect(checker).toContain("transcribeGermanLocally");
    expect(checker).toContain("matchExpectedGermanPhrase");
    expect(checker).toContain("لا يُحفظ الصوت");
    expect(runner).toContain("onComplete={()=>go(3)}");
  });

  it("creates adaptive writing goals by level and phrase shape", () => {
    expect(adaptiveWritingGoal("auch", "A1")).toMatchObject({ minimumWords: 3, completeTargetSentence: false });
    expect(adaptiveWritingGoal("Ich komme aus Tunesien.", "A1")).toMatchObject({ minimumWords: 4, completeTargetSentence: true });
    expect(adaptiveWritingGoal("eine begründete Entscheidung treffen", "B2").minimumWords).toBe(6);
    expect(validateAdaptiveWriting("Ich lerne auch Deutsch.", "auch", "A1")).toMatchObject({ containsTarget: true, enoughContext: true, valid: true });
    expect(validateAdaptiveWriting("vielleicht auch", "auch", "A1")).toMatchObject({ containsTarget: true, enoughContext: false, valid: false });
    expect(validateAdaptiveWriting("Ich komme Tunesien.", "Ich komme aus Tunesien.", "A1").valid).toBe(false);
  });

  it("persists terminal phrase progress through stable exercise attempts", () => {
    const lessonId = "a1-01";
    const attempts: ExerciseAttempt[] = [0, 2].map((index) => ({
      id: `attempt-${index}`,
      lessonId,
      exerciseId: fourSkillPhraseAttemptId(lessonId, index),
      answer: "confirmed transcript",
      correct: true,
      createdAt: "2026-09-12T12:00:00.000Z",
    }));
    attempts.push({
      id: "attempt-failed",
      lessonId,
      exerciseId: fourSkillPhraseAttemptId(lessonId, 1),
      answer: "partial transcript",
      correct: false,
      createdAt: "2026-09-12T12:01:00.000Z",
    });
    expect(completedFourSkillPhraseIndexes(lessonId, 4, attempts)).toEqual([0, 2]);
  });
});
