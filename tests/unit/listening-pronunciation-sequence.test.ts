// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { appendListeningProcessEvent, buildLessonListeningSequence, createListeningProcessEvent, deriveListeningSequenceProgress, LISTENING_FOCUS_OPTIONS, LISTENING_SEQUENCE_POLICY } from "@/core/listening/sequence";
import { ARTICULATION_CONTRAST_POLICY, createPronunciationContrastAttempt, getArticulationGuide, upsertPronunciationContrastAttempt } from "@/core/pronunciation/articulation";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";

describe("P1 three-pass lesson listening sequence", () => {
  it("gives all 96 lessons a before, one gist, and after-detail contract tied to their authored questions", () => {
    const sequences = academicLessonList.map(buildLessonListeningSequence);
    expect(sequences).toHaveLength(96);
    for (const [index, sequence] of sequences.entries()) {
      const lesson = academicLessonList[index];
      expect(sequence.policyVersion).toBe(LISTENING_SEQUENCE_POLICY);
      expect(sequence.before.promptDe).toContain(lesson.listening.titleDe);
      expect(sequence.during.question.id).toBe(lesson.listening.questions[0].id);
      expect(sequence.after.questions.map((question) => question.id)).toEqual(lesson.listening.questions.slice(1).map((question) => question.id));
      expect(sequence.after.questions.length).toBeGreaterThanOrEqual(1);
      expect(sequence.transcriptUnlockQuestionIds).toEqual(lesson.listening.questions.map((question) => question.id));
    }
  });

  it("uses German-first focus choices as planning only, not as an answer key", () => {
    expect(LISTENING_FOCUS_OPTIONS.map((option) => option.id)).toEqual(["people-roles", "place-time", "message-result"]);
    expect(LISTENING_FOCUS_OPTIONS.every((option) => option.de && option.ar)).toBe(true);
    expect(JSON.stringify(LISTENING_FOCUS_OPTIONS)).not.toMatch(/correct|answer|score|mastery/i);
  });

  it("locks gist until playback, details until gist commitment, and transcript until every question is committed", () => {
    const lesson = academicLessonList[0];
    const sequence = buildLessonListeningSequence(lesson);
    const focus = createListeningProcessEvent({ lessonId:lesson.id,event:"focus-committed",focusId:"message-result",now:new Date("2026-09-08T10:00:00Z") });
    const play = createListeningProcessEvent({ lessonId:lesson.id,event:"playback-started",now:new Date("2026-09-08T10:01:00Z") });
    expect(deriveListeningSequenceProgress(sequence, [], [])).toMatchObject({ preparationComplete:false,playbackStarted:false,gistCommitted:false,transcriptUnlocked:false });
    expect(deriveListeningSequenceProgress(sequence, [focus], [])).toMatchObject({ preparationComplete:true,playbackStarted:false });
    expect(deriveListeningSequenceProgress(sequence, [focus,play], [])).toMatchObject({ playbackStarted:true,gistCommitted:false });
    const gistAttempt = { id:"a1",lessonId:lesson.id,exerciseId:sequence.during.question.id,answer:"x",correct:false,createdAt:"2026-09-08T10:02:00Z" };
    expect(deriveListeningSequenceProgress(sequence,[focus,play],[gistAttempt])).toMatchObject({ gistCommitted:true,detailCommitted:0,transcriptUnlocked:false });
    const all = sequence.transcriptUnlockQuestionIds.map((exerciseId,index)=>({id:`a${index}`,lessonId:lesson.id,exerciseId,answer:"x",correct:false,createdAt:"2026-09-08T10:03:00Z"}));
    expect(deriveListeningSequenceProgress(sequence,[focus,play],all)).toMatchObject({gistCommitted:true,detailCommitted:sequence.after.questions.length,transcriptUnlocked:true});
  });

  it("keeps old listening attempts usable while still requiring all commitments before transcript reveal", () => {
    const lesson = academicLessonList[0];
    const sequence = buildLessonListeningSequence(lesson);
    const legacy = [{ id:"legacy",lessonId:lesson.id,exerciseId:sequence.during.question.id,answer:"x",correct:true,createdAt:"2026-09-01T00:00:00Z" }];
    expect(deriveListeningSequenceProgress(sequence,[],legacy)).toMatchObject({preparationComplete:true,playbackStarted:true,gistCommitted:true,transcriptUnlocked:false});
  });

  it("persists deduplicated phase provenance without correctness, score, or mastery", () => {
    const event = createListeningProcessEvent({lessonId:"a1-01",event:"focus-committed",focusId:"people-roles",now:new Date("2026-09-08T10:00:00Z")});
    expect(event).toMatchObject({phase:"before",policyVersion:"three-pass-listening-sequence-v1",evidenceBoundary:"listening-process-only-no-score-or-mastery"});
    expect(Object.keys(event)).not.toContain("correct");
    expect(appendListeningProcessEvent([event],event)).toHaveLength(1);
    expect(()=>createListeningProcessEvent({lessonId:"a1-01",event:"gist-committed"})).toThrow("question ID");
  });
});

describe("P1 original articulation SVG and meaningful contrast practice", () => {
  it("maps every lesson focus to an articulation guide with two meaningful authored contrasts", () => {
    const guides = academicLessonList.map(getArticulationGuide);
    expect(guides).toHaveLength(96);
    expect(new Set(guides.map((guide) => guide.profileId)).size).toBeGreaterThanOrEqual(6);
    for (const guide of guides) {
      expect(guide.policyVersion).toBe(ARTICULATION_CONTRAST_POLICY);
      expect(guide.pairs).toHaveLength(2);
      expect(guide.pairs.every((pair) => pair.left.de !== pair.right.de && pair.left.ar !== pair.right.ar)).toBe(true);
      expect(guide.pairs.every((pair) => ["minimal-pair","meaningful-sound-contrast","meaningful-prosody-contrast"].includes(pair.kind))).toBe(true);
    }
  });

  it("uses level-independent real German contrasts and labels strict minimal pairs separately from prosody", () => {
    const pairs = academicLessonList.flatMap((lesson) => getArticulationGuide(lesson).pairs);
    expect(pairs.some((pair) => pair.id === "ch-kirche-kirsche" && pair.kind === "minimal-pair")).toBe(true);
    expect(pairs.some((pair) => pair.id === "yu-tuer-tour" && pair.kind === "minimal-pair")).toBe(true);
    expect(pairs.some((pair) => pair.kind === "meaningful-prosody-contrast" && pair.left.de.replace(/[.?]/g,"") === pair.right.de.replace(/[.?]/g,""))).toBe(true);
    expect(pairs.every((pair) => pair.left.ipa.startsWith("[") && pair.right.ipa.startsWith("[") && pair.noteAr.length > 20)).toBe(true);
  });

  it("renders one inline accessible original SVG with named mouth, tongue, teeth, airflow, and active-zone layers", () => {
    const source = readFileSync("src/components/pronunciation-articulation-lab.tsx","utf8");
    for (const marker of ["<svg", "role=\"img\"", "<title", "<desc", "head-outline", "tongue", "teeth", "airflow", "active-zone"]) expect(source).toContain(marker);
    expect(source).not.toMatch(/<img|https?:\/\/|data:image/);
  });

  it("records only synthetic stimulus discrimination and derives correctness from the hidden target", () => {
    const correct = createPronunciationContrastAttempt({lessonId:"a1-02",pairId:"ch-kirche-kirsche",targetSide:"left",selectedSide:"left",now:new Date("2026-09-08T11:00:00Z")});
    const retry = createPronunciationContrastAttempt({lessonId:"a1-02",pairId:"ch-kirche-kirsche",targetSide:"right",selectedSide:"left",now:new Date("2026-09-08T11:01:00Z")});
    expect(correct).toMatchObject({correct:true,stimulusSource:"browser-tts-synthetic",evidenceBoundary:"synthetic-discrimination-only-no-pronunciation-or-mastery-score"});
    expect(retry.correct).toBe(false);
    expect(Object.keys(correct)).not.toContain("pronunciationScore");
    expect(upsertPronunciationContrastAttempt([correct],{...correct,selectedSide:"right",correct:false})).toEqual([{...correct,selectedSide:"right",correct:false}]);
  });

  it("keeps listening and pronunciation process evidence schema-valid and outside mastery", () => {
    const listening = createListeningProcessEvent({lessonId:"a1-01",event:"playback-started",now:new Date("2026-09-08T10:00:00Z")});
    const pronunciation = createPronunciationContrastAttempt({lessonId:"a1-01",pairId:"h-eis-heiss",targetSide:"left",selectedSide:"left",now:new Date("2026-09-08T10:02:00Z")});
    const parsed = learningStateSchema.parse({...defaultState,listeningProcessEvents:[listening],pronunciationContrastAttempts:[pronunciation]});
    expect(parsed.mastery).toEqual(defaultState.mastery);
    expect(parsed.listeningProcessEvents[0]).toEqual(listening);
    expect(parsed.pronunciationContrastAttempts[0]).toEqual(pronunciation);
    expect(()=>learningStateSchema.parse({...defaultState,pronunciationContrastAttempts:[{...pronunciation,correct:false}]})).toThrow("synthetic target match");
  });

  it("merges process evidence by stable ID without changing mastery", () => {
    const listening = createListeningProcessEvent({lessonId:"a1-01",event:"playback-started",now:new Date("2026-09-08T10:00:00Z")});
    const pronunciation = createPronunciationContrastAttempt({lessonId:"a1-01",pairId:"h-eis-heiss",targetSide:"left",selectedSide:"left",now:new Date("2026-09-08T10:02:00Z")});
    const merged = mergeLearningStates({...defaultState,listeningProcessEvents:[listening]},{...defaultState,pronunciationContrastAttempts:[pronunciation]});
    expect(merged.listeningProcessEvents).toEqual([listening]);
    expect(merged.pronunciationContrastAttempts).toEqual([pronunciation]);
    expect(merged.mastery).toEqual(defaultState.mastery);
  });
});
