import { readFileSync } from "node:fs";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { academicLessonList, academicLessons } from "@/data/academic-lessons";
import { reviewCards } from "@/data/review-cards";
import { readingLexiconSeed } from "@/data/reading-lexicon-seeds";
import { CURRICULUM_STOP_WORDS, curriculumLexicalContext, curriculumStem } from "@/core/german/curriculum-lexical-context";
import { foldGerman } from "@/core/german/lemmatizer";
import {
  LEARNER_LEXICAL_KNOWLEDGE_POLICY,
  decodeCardRef,
  encodeCardRef,
  encodeLessonMask,
  exactLemmaKeys,
  maskIntersects,
  profileReadingForLearner,
  statusFrom,
  textLemmaKeys,
  type ReadingLexiconSeed,
} from "@/core/evidence/learner-lexical-knowledge";
import { LearnerReadingProfile } from "@/components/learner-reading-profile";
import type { ExerciseAttempt, ReviewEvent } from "@/types/learning";

// ADR-132 (م17): per-learner, per-lemma evidence for the reading text, derived from the learner's
// own review events and correct answers. No new state field; a build-time seed per lesson page.

const context = curriculumLexicalContext();
const lessonOrder = academicLessonList.map((lesson) => lesson.id);
const lessonIndex = new Map(lessonOrder.map((id, index) => [id, index]));

function review(cardId: string, grade: number, evidenceKind: "initial" | "delayed", reviewedAt: string, evidenceScope: ReviewEvent["evidenceScope"] = "lesson-card"): ReviewEvent {
  return { id: `${cardId}-${reviewedAt}`, cardId, lessonId: cardId.slice(0, 5), grade, evidenceKind, evidenceScope, scheduledFor: reviewedAt, reviewedAt, masteryDelta: 0 };
}
function attempt(answer: string, correct: boolean, createdAt: string): ExerciseAttempt {
  return { id: `${answer}-${createdAt}`, lessonId: "a1-01", exerciseId: "x", answer, correct, createdAt };
}
const empty = { reviewEvents: [], exerciseAttempts: [], completedLessonIds: [] };

describe("shared curriculum lexical context", () => {
  it("keeps the audit's stop list and legacy stemmer unchanged", () => {
    expect(CURRICULUM_STOP_WORDS).toHaveLength(77);
    expect(CURRICULUM_STOP_WORDS[0]).toBe("der");
    expect(CURRICULUM_STOP_WORDS.at(-1)).toBe("möchten");
    expect(curriculumStem("wohnungen")).toBe("wohn");
    expect(curriculumStem("kindchen")).toBe("kind");
    expect(curriculumStem("arbeit")).toBe("arbe");
    expect(curriculumLexicalContext()).toBe(context);
    const script = readFileSync("scripts/generate-lesson-quality-audit.ts", "utf8");
    expect(script).toContain("const STOP = new Set(CURRICULUM_STOP_WORDS);");
    expect(script).toContain("const stem = curriculumStem;");
  });
});

describe("seed encoding", () => {
  it("round-trips lesson masks and card refs for every word-level card", () => {
    const mask = encodeLessonMask([0, 5, 95], 96);
    expect(maskIntersects(mask, new Set([5]))).toBe(true);
    expect(maskIntersects(mask, new Set([95]))).toBe(true);
    expect(maskIntersects(mask, new Set([1, 6, 94]))).toBe(false);
    expect(encodeLessonMask([], 96)).toBe("");
    for (const card of reviewCards.filter((item) => item.tags.includes("authored") || item.tags.includes("phrase"))) {
      expect(decodeCardRef(encodeCardRef(card.id, lessonIndex), lessonOrder)).toBe(card.id);
    }
    expect(decodeCardRef(encodeCardRef("custom-id", lessonIndex), lessonOrder)).toBe("custom-id");
  });

  it("builds a seed for every lesson whose words, surfaces and card refs are faithful to the data", () => {
    const fronts = new Map(reviewCards.map((card) => [card.id, card.front]));
    for (const lesson of academicLessonList) {
      const seed = readingLexiconSeed(lesson.id)!;
      expect(seed.policyVersion).toBe(LEARNER_LEXICAL_KNOWLEDGE_POLICY);
      expect(seed.lessonOrder).toEqual(lessonOrder);
      expect(seed.words.length).toBeGreaterThan(0);
      const folded = foldGerman(lesson.reading.textDe);
      for (const [word, surface, , , refs] of seed.words) {
        expect(folded).toContain(word);
        if (surface) expect(lesson.reading.textDe).toContain(surface);
        for (const ref of refs ? refs.split(" ") : []) {
          const front = fronts.get(decodeCardRef(ref, seed.lessonOrder));
          expect(front, `${lesson.id}:${word}:${ref}`).toBeDefined();
          const keys = textLemmaKeys(front!, context);
          expect(exactLemmaKeys(word, context).some((key) => keys.has(key))).toBe(true);
        }
      }
    }
    expect(readingLexiconSeed("missing")).toBeNull();
  });
});

describe("learner profile", () => {
  const seed = readingLexiconSeed("a1-03")!;
  const withCard = seed.words.find(([, , , , refs]) => refs.length > 0)!;
  const cardId = decodeCardRef(withCard[4].split(" ")[0], seed.lessonOrder);
  const statusOf = (profile: ReturnType<typeof profileReadingForLearner>) => profile.words.find((word) => word.word === withCard[0])!.status;

  it("without evidence, only reports what the current lesson taught before the reading", () => {
    const profile = profileReadingForLearner(seed, empty, context);
    expect(profile.hasWordEvidence).toBe(false);
    expect(profile.counts.retrieved + profile.counts.practised + profile.counts.struggling).toBe(0);
    expect(profile.counts["taught-only"]).toBe(seed.words.filter(([, , , before]) => before === 1).length);
    expect(profile.contentWords).toBe(seed.words.length);
  });

  it("follows the most recent observation and requires a delayed success for 'retrieved'", () => {
    expect(statusOf(profileReadingForLearner(seed, { ...empty, reviewEvents: [review(cardId, 4, "initial", "2026-10-01T10:00:00.000Z")] }, context))).toBe("practised");
    const delayed = [review(cardId, 4, "initial", "2026-10-01T10:00:00.000Z"), review(cardId, 5, "delayed", "2026-10-05T10:00:00.000Z")];
    expect(statusOf(profileReadingForLearner(seed, { ...empty, reviewEvents: delayed }, context))).toBe("retrieved");
    const failedLast = [...delayed, review(cardId, 1, "delayed", "2026-10-12T10:00:00.000Z")];
    const profile = profileReadingForLearner(seed, { ...empty, reviewEvents: failedLast }, context);
    expect(statusOf(profile)).toBe("struggling");
    expect(profile.hasWordEvidence).toBe(true);
    // Input order does not matter; time does.
    expect(statusOf(profileReadingForLearner(seed, { ...empty, reviewEvents: [...failedLast].reverse() }, context))).toBe("struggling");
  });

  it("ignores personal error-remediation reviews", () => {
    const profile = profileReadingForLearner(seed, { ...empty, reviewEvents: [review(cardId, 1, "delayed", "2026-10-12T10:00:00.000Z", "personal-error-remediation")] }, context);
    expect(statusOf(profile)).not.toBe("struggling");
  });

  it("credits correct answers, never wrong ones, and never through the legacy stem", () => {
    const synthetic: ReadingLexiconSeed = { policyVersion: LEARNER_LEXICAL_KNOWLEDGE_POLICY, lessonId: "t", properNames: 0, lessonOrder, words: [["wohnung", "Wohnung", "", 0, ""], ["wohnen", "", "", 0, ""]] };
    const status = (attempts: ExerciseAttempt[]) => Object.fromEntries(profileReadingForLearner(synthetic, { ...empty, exerciseAttempts: attempts }, context).words.map((word) => [word.word, word.status]));
    expect(status([attempt("Ich wohne in Tunis.", true, "2026-10-01T10:00:00.000Z")])).toEqual({ wohnung: "new", wohnen: "practised" });
    expect(status([attempt("Ich wohne in Tunis.", false, "2026-10-01T10:00:00.000Z")])).toEqual({ wohnung: "new", wohnen: "new" });
  });

  it("marks a word taught when a completed lesson covers it", () => {
    const later = seed.words.find(([, , mask, before]) => before === 0 && mask.length > 0)!;
    const index = [...Array(lessonOrder.length).keys()].find((i) => maskIntersects(later[2], new Set([i])))!;
    const profile = profileReadingForLearner(seed, { ...empty, completedLessonIds: [lessonOrder[index]] }, context);
    expect(profile.words.find((word) => word.word === later[0])!.status).toBe("taught-only");
  });

  it("statusFrom keeps the documented order of precedence", () => {
    expect(statusFrom([], false)).toBe("new");
    expect(statusFrom([], true)).toBe("taught-only");
    expect(statusFrom([{ at: "2", success: true, delayed: false }, { at: "1", success: true, delayed: true }], false)).toBe("retrieved");
    expect(statusFrom([{ at: "1", success: true, delayed: true }, { at: "2", success: false, delayed: true }], true)).toBe("struggling");
  });

  it("renders counts and German word chips without meanings", () => {
    render(createElement(LearnerReadingProfile, { seed, reviewEvents: [review(cardId, 1, "delayed", "2026-10-12T10:00:00.000Z")], exerciseAttempts: [], completedLessonIds: [] }));
    const aside = document.querySelector("[data-learner-lexical-policy]")!;
    expect(aside.getAttribute("data-learner-lexical-policy")).toBe(LEARNER_LEXICAL_KNOWLEDGE_POLICY);
    expect(screen.getByText(/وليس اختبار مفردات/)).toBeTruthy();
    const chip = aside.querySelector('[data-word-status="struggling"] li')!;
    expect(chip.getAttribute("lang")).toBe("de");
    expect(chip.textContent).toBe(withCard[1] || withCard[0]);
  });

  it("keeps the curriculum and card list out of the browser components", () => {
    for (const file of ["src/components/learner-reading-profile.tsx", "src/components/lesson-runner.tsx", "src/core/evidence/learner-lexical-knowledge.ts"]) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("@/data/academic-lessons");
      expect(source).not.toContain("@/data/review-cards");
      expect(source).not.toContain("@/data/reading-lexicon-seeds");
    }
    expect(readFileSync("src/app/lernen/[lessonId]/page.tsx", "utf8")).toContain("readingLexicon={readingLexiconSeed(lessonId)}");
    expect(academicLessons["a1-03"]).toBeDefined();
  });
});
