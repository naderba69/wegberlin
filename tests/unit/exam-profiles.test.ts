import { describe, expect, it } from "vitest";
import { examProfiles, examSources } from "@/data/exam-profiles";
import { targetedExamSimulations } from "@/data/exam-simulations";
import { targetedListeningSimulations } from "@/data/exam-listening-simulations";
import { targetedWritingSimulations } from "@/data/exam-writing-simulations";
import { allPublishedExamTasks, publishedTargetedExamSimulations } from "@/data/exam-simulation-registry";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { targetedChoiceSimulations } from "@/data/exam-choice-simulations";
import { targetedSpeakingSimulations } from "@/data/exam-speaking-simulations";

describe("strict provider-specific exam profiles", () => {
  it("keeps one verified profile for each supported provider", () => {
    expect(Object.keys(examProfiles).sort()).toEqual(["goethe-b2", "telc-deutsch-b2"]);
    expect(Object.values(examProfiles).every((profile) => profile.status === "verified")).toBe(true);
  });

  it("models the current Goethe module structure without telc scoring", () => {
    const profile = examProfiles["goethe-b2"];
    expect(profile.modules.map((module) => [module.id, module.parts, module.minutes])).toEqual([
      ["lesen", 5, 65],
      ["hoeren", 4, 40],
      ["schreiben", 2, 75],
      ["sprechen", 2, 15],
    ]);
    expect(profile.passingRuleAr).toContain("60 من 100");
    expect(profile.passingRuleAr).not.toContain("135");
  });

  it("models telc written and oral scoring separately", () => {
    const profile = examProfiles["telc-deutsch-b2"];
    expect(profile.modules.map((module) => module.parts)).toEqual([3, 2, 3, 1, 3]);
    expect(profile.modules.reduce((sum, module) => sum + (module.maxPoints ?? 0), 0)).toBe(300);
    expect(profile.passingRuleAr).toContain("135");
    expect(profile.passingRuleAr).toContain("45");
    expect(profile.passingRuleAr).not.toContain("60 من 100 في كل وحدة");
  });

  it("keeps every profile source traceable and uniquely identified", () => {
    const sourceIds = examSources.map((source) => source.id);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    for (const profile of Object.values(examProfiles)) {
      expect(profile.sourceRefs.length).toBeGreaterThanOrEqual(2);
      for (const sourceId of profile.sourceRefs) expect(sourceIds).toContain(sourceId);
    }
  });
});

describe("published targeted exam simulations", () => {
  it("publishes six counted matching simulations plus one Goethe full-only part", () => {
    expect(targetedExamSimulations).toHaveLength(7);
    expect(targetedExamSimulations.filter((simulation) => simulation.countTowardTargeted !== false)).toHaveLength(6);
    expect(targetedExamSimulations.filter((simulation) => simulation.provider === "goethe-b2")).toHaveLength(4);
    expect(targetedExamSimulations.filter((simulation) => simulation.provider === "telc-deutsch-b2")).toHaveLength(3);
    expect(targetedExamSimulations.filter((simulation) => simulation.countTowardTargeted === false).map((simulation) => simulation.id)).toEqual(["goethe-b2-full-01-reading-05"]);
    expect(targetedExamSimulations.every((simulation) => simulation.originalContent && simulation.contentStatus === "published")).toBe(true);
  });

  it("uses valid unique ids and keyed answers", () => {
    const ids = targetedExamSimulations.flatMap((simulation) => [
      simulation.id,
      ...simulation.texts.map((text) => text.id),
      ...simulation.items.map((item) => item.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const simulation of targetedExamSimulations) {
      const optionIds = simulation.options.map((option) => option.id);
      expect(new Set(optionIds).size).toBe(optionIds.length);
      expect(new Set(simulation.items.map((item) => item.id)).size).toBe(simulation.items.length);
      for (const item of simulation.items) expect(optionIds).toContain(item.correctOptionId);
    }
  });

  it("preserves part-specific option reuse rules", () => {
    const goethePart1 = targetedExamSimulations.find((simulation) => simulation.id === "goethe-b2-reading-01");
    const goethePart2 = targetedExamSimulations.find((simulation) => simulation.id === "goethe-b2-reading-02");
    const telcReading = targetedExamSimulations.find((simulation) => simulation.id === "telc-b2-reading-01");
    const telcLanguage = targetedExamSimulations.find((simulation) => simulation.id === "telc-b2-language-02");
    expect(goethePart1?.allowOptionReuse).toBe(true);
    expect(goethePart2?.allowOptionReuse).toBe(false);
    expect(telcReading?.allowOptionReuse).toBe(false);
    expect(telcLanguage?.allowOptionReuse).toBe(false);
    expect(new Set(goethePart2?.items.map((item) => item.correctOptionId)).size).toBe(goethePart2?.items.length);
    expect(new Set(telcLanguage?.items.map((item) => item.correctOptionId)).size).toBe(telcLanguage?.items.length);
  });
});

describe("listening and writing targeted simulations", () => {
  it("publishes the contracted 24 strictly provider-scoped targeted simulations", () => {
    expect(publishedTargetedExamSimulations).toHaveLength(24);
    expect(publishedTargetedExamSimulations.filter((simulation) => simulation.provider === "goethe-b2").map((simulation) => simulation.skill).sort()).toEqual(["listening", "listening", "listening", "listening", "reading", "reading", "reading", "reading", "speaking", "speaking", "writing", "writing"]);
    expect(publishedTargetedExamSimulations.filter((simulation) => simulation.provider === "telc-deutsch-b2").map((simulation) => simulation.skill).sort()).toEqual(["language-elements", "language-elements", "listening", "listening", "listening", "reading", "reading", "reading", "speaking", "speaking", "speaking", "writing"]);
    expect(new Set(publishedTargetedExamSimulations.map((simulation) => simulation.id)).size).toBe(24);
  });

  it("keeps listening items keyed to valid clips and answers", () => {
    expect(targetedListeningSimulations).toHaveLength(7);
    for (const simulation of targetedListeningSimulations) {
      const clipIds = simulation.clips.map((clip) => clip.id);
      expect(["browser-tts-only","generated-file-with-browser-tts-fallback"]).toContain(simulation.audioStatus);
      for (const item of simulation.items) {
        expect(clipIds).toContain(item.clipId);
        expect(item.options.length).toBeGreaterThanOrEqual(2);
        expect(item.options.length).toBeLessThanOrEqual(4);
        expect(new Set(item.options).size).toBe(item.options.length);
        expect(item.correctIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctIndex).toBeLessThan(item.options.length);
      }
    }
    expect(targetedListeningSimulations.every((simulation)=>simulation.audioStatus==="generated-file-with-browser-tts-fallback")).toBe(true);
  });

  it("preserves listening-part playback and item rules", () => {
    const byId = Object.fromEntries(targetedListeningSimulations.map((simulation) => [simulation.id, simulation]));
    expect(byId["goethe-b2-listening-01"].clips.every((clip) => clip.playLimit === 1)).toBe(true);
    expect(byId["goethe-b2-listening-01"].items).toHaveLength(10);
    expect(byId["goethe-b2-listening-02"].clips[0].playLimit).toBe(2);
    expect(byId["goethe-b2-listening-02"].items).toHaveLength(6);
    expect(byId["goethe-b2-listening-03"].clips[0].playLimit).toBe(1);
    expect(byId["goethe-b2-listening-03"].items).toHaveLength(6);
    expect(byId["goethe-b2-listening-04"].clips[0].playLimit).toBe(2);
    expect(byId["goethe-b2-listening-04"].items).toHaveLength(8);
    expect(byId["telc-b2-listening-01"].items).toHaveLength(5);
    expect(byId["telc-b2-listening-02"].items).toHaveLength(10);
    expect(byId["telc-b2-listening-03"].clips).toHaveLength(5);
    expect(byId["telc-b2-listening-03"].items).toHaveLength(5);
  });

  it("keeps provider-specific writing timing and choice structure", () => {
    expect(targetedWritingSimulations).toHaveLength(3);
    const goethePart1 = targetedWritingSimulations.find((simulation) => simulation.id === "goethe-b2-writing-01");
    const goethePart2 = targetedWritingSimulations.find((simulation) => simulation.id === "goethe-b2-writing-02");
    const telc = targetedWritingSimulations.find((simulation) => simulation.provider === "telc-deutsch-b2");
    expect(goethePart1?.practiceMinutes).toBe(50);
    expect(goethePart1?.minimumWordsForPractice).toBe(150);
    expect(goethePart2?.practiceMinutes).toBe(25);
    expect(goethePart2?.minimumWordsForPractice).toBe(100);
    expect(goethePart2?.choices).toHaveLength(1);
    expect(telc?.practiceMinutes).toBe(30);
    expect(telc?.choices).toHaveLength(2);
    expect(telc?.wordTargetNoteAr).toContain("هدف تدريبي داخلي");
  });

  it("validates telc language-element and detail-reading choice banks", () => {
    expect(targetedChoiceSimulations).toHaveLength(3);
    const language = targetedChoiceSimulations.find((simulation) => simulation.id === "telc-b2-language-01");
    const telcReading = targetedChoiceSimulations.find((simulation) => simulation.id === "telc-b2-reading-02");
    const goetheReading = targetedChoiceSimulations.find((simulation) => simulation.id === "goethe-b2-reading-03");
    expect(language?.items).toHaveLength(10);
    expect(telcReading?.items).toHaveLength(5);
    expect(goetheReading?.items).toHaveLength(6);
    for (const simulation of targetedChoiceSimulations) {
      for (const item of simulation.items) {
        expect(item.options).toHaveLength(3);
        expect(new Set(item.options).size).toBe(3);
        expect(item.correctIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctIndex).toBeLessThan(3);
      }
    }
  });

  it("preserves the distinct Goethe and telc speaking shapes", () => {
    expect(targetedSpeakingSimulations).toHaveLength(5);
    const goethePart1 = targetedSpeakingSimulations.find((simulation) => simulation.id === "goethe-b2-speaking-01");
    const goethePart2 = targetedSpeakingSimulations.find((simulation) => simulation.id === "goethe-b2-speaking-02");
    const telcPart1 = targetedSpeakingSimulations.find((simulation) => simulation.id === "telc-b2-speaking-01");
    const telcPart2 = targetedSpeakingSimulations.find((simulation) => simulation.id === "telc-b2-speaking-02");
    const telcPart3 = targetedSpeakingSimulations.find((simulation) => simulation.id === "telc-b2-speaking-03");
    expect(goethePart1?.preparationMinutes).toBe(15);
    expect(goethePart1?.responseSeconds).toBe(240);
    expect(goethePart1?.choices).toHaveLength(2);
    expect(goethePart2?.responseSeconds).toBe(180);
    expect(telcPart1?.preparationMinutes).toBe(0);
    expect(telcPart1?.responseSeconds).toBe(90);
    expect(telcPart1?.choices).toHaveLength(7);
    expect(telcPart2?.preparationMinutes).toBe(20);
    expect(telcPart2?.responseSeconds).toBe(180);
    expect(telcPart3?.preparationMinutes).toBe(20);
    expect(telcPart3?.choices).toHaveLength(1);
  });

  it("builds Goethe Lesen Teil 2 with six unique gaps and two distractors", () => {
    const simulation = targetedExamSimulations.find((item) => item.id === "goethe-b2-reading-02");
    expect(simulation?.items).toHaveLength(6);
    expect(simulation?.options).toHaveLength(8);
    expect(simulation?.allowOptionReuse).toBe(false);
    expect(new Set(simulation?.items.map((item) => item.correctOptionId)).size).toBe(6);
    for (let gap = 1; gap <= 6; gap += 1) expect(simulation?.texts[0].textDe).toContain(`[Lücke ${gap}]`);
  });

  it("builds telc Sprachbausteine Teil 2 with ten gaps and five distractors", () => {
    const simulation = targetedExamSimulations.find((item) => item.id === "telc-b2-language-02");
    expect(simulation?.items).toHaveLength(10);
    expect(simulation?.options).toHaveLength(15);
    expect(simulation?.allowOptionReuse).toBe(false);
    expect(new Set(simulation?.items.map((item) => item.correctOptionId)).size).toBe(10);
    for (let gap = 31; gap <= 40; gap += 1) expect(simulation?.texts[0].textDe).toContain(`[${gap}]`);
  });

  it("builds Goethe Lesen Teil 4 with an unavailable example and one unused opinion", () => {
    const simulation = targetedExamSimulations.find((item) => item.id === "goethe-b2-reading-04");
    expect(simulation?.texts).toHaveLength(8);
    expect(simulation?.options).toHaveLength(7);
    expect(simulation?.items).toHaveLength(6);
    expect(simulation?.options.some((option) => option.labelDe.startsWith("a"))).toBe(false);
    expect(new Set(simulation?.items.map((item) => item.correctOptionId)).size).toBe(6);
  });

  it("builds telc Leseverstehen Teil 3 with ten matches and two distractors", () => {
    const simulation = targetedExamSimulations.find((item) => item.id === "telc-b2-reading-03");
    expect(simulation?.texts).toHaveLength(12);
    expect(simulation?.options).toHaveLength(12);
    expect(simulation?.items).toHaveLength(10);
    expect(simulation?.allowOptionReuse).toBe(false);
    expect(new Set(simulation?.items.map((item) => item.correctOptionId)).size).toBe(10);
  });

  it("keeps all new nested content ids unique", () => {
    const ids = [
      ...targetedChoiceSimulations.flatMap((simulation) => [simulation.id, ...simulation.items.map((item) => item.id)]),
      ...targetedSpeakingSimulations.flatMap((simulation) => [simulation.id, ...simulation.choices.map((choice) => choice.id)]),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("first complete provider-specific simulation manifests", () => {
  const taskById = Object.fromEntries(allPublishedExamTasks.map((task) => [task.id, task]));
  const receptiveItems = (taskIds: string[]) => taskIds.reduce((sum, id) => {
    const task = taskById[id];
    return sum + (task.kind === "writing" || task.kind === "speaking" ? 0 : task.items.length);
  }, 0);

  it("publishes six original full simulations for each provider", () => {
    expect(fullExamSimulations).toHaveLength(12);
    expect(fullExamSimulations.filter((simulation) => simulation.provider === "goethe-b2")).toHaveLength(6);
    expect(fullExamSimulations.filter((simulation) => simulation.provider === "telc-deutsch-b2")).toHaveLength(6);
    expect(fullExamSimulations.every((simulation) => simulation.originalContent && simulation.contentStatus === "published")).toBe(true);
    expect(allPublishedExamTasks).toHaveLength(150);
    expect(publishedTargetedExamSimulations).toHaveLength(24);
  });

  it("references only existing tasks from the same provider", () => {
    for (const simulation of fullExamSimulations) {
      const taskIds = simulation.modules.flatMap((module) => module.taskIds);
      expect(new Set(taskIds).size).toBe(taskIds.length);
      for (const taskId of taskIds) {
        expect(taskById[taskId]).toBeDefined();
        expect(taskById[taskId].provider).toBe(simulation.provider);
      }
    }
  });

  it("completes the Goethe 5/4/2/2 part structure and receptive item counts", () => {
    const simulations = fullExamSimulations.filter((item) => item.provider === "goethe-b2");
    expect(simulations).toHaveLength(6);
    for (const simulation of simulations) {
      expect(simulation.modules.map((module) => module.taskIds.length)).toEqual([5, 4, 2, 2]);
      expect(receptiveItems(simulation.modules[0].taskIds)).toBe(30);
      expect(receptiveItems(simulation.modules[1].taskIds)).toBe(30);
      expect(simulation.modules.map((module) => module.officialMinutes)).toEqual([65, 40, 75, 15]);
    }
  });

  it("completes the telc written/oral structure without Goethe rules", () => {
    const simulations = fullExamSimulations.filter((item) => item.provider === "telc-deutsch-b2");
    expect(simulations).toHaveLength(6);
    for (const simulation of simulations) {
      expect(simulation.modules.map((module) => module.taskIds.length)).toEqual([5, 3, 1, 3]);
      expect(receptiveItems(simulation.modules[0].taskIds)).toBe(40);
      expect(receptiveItems(simulation.modules[1].taskIds)).toBe(20);
      expect(simulation.modules.map((module) => module.officialMinutes)).toEqual([90, 20, 30, 15]);
      expect(simulation.modules[0].resultRuleAr).toContain("90 دقيقة مشتركة");
    }
  });

  it("keeps every full-simulation task bank independent within its provider", () => {
    for (const provider of ["goethe-b2", "telc-deutsch-b2"] as const) {
      const simulations = fullExamSimulations.filter((item) => item.provider === provider);
      for (let left = 0; left < simulations.length; left += 1) {
        const leftIds = new Set(simulations[left].modules.flatMap((module) => module.taskIds));
        for (let right = left + 1; right < simulations.length; right += 1) {
          expect(simulations[right].modules.flatMap((module) => module.taskIds).every((taskId) => !leftIds.has(taskId))).toBe(true);
        }
      }
    }
  });
});
