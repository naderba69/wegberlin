// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPartialCanonical, DICTATION_EVIDENCE_BOUNDARY, DICTATION_POLICY, dictationBank, dictationItemsForLevel } from "@/data/dictation-bank";
import { createDictationAttempt, evaluateFullDictation, evaluatePartialDictation, tokenizeDictation } from "@/core/listening/dictation";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";

const levels = ["A1", "A2", "B1", "B2"] as const;

describe("P2 adaptive partial and full dictation", () => {
  it("provides four original German-first tasks per A1-B2 level with an explicit progression", () => {
    expect(dictationBank).toHaveLength(16);
    for (const level of levels) expect(dictationItemsForLevel(level)).toHaveLength(4);
    expect(dictationItemsForLevel("A1").every((item) => item.mode === "partial")).toBe(true);
    expect(dictationItemsForLevel("A2").map((item) => item.mode)).toEqual(["partial", "partial", "partial", "full"]);
    expect(dictationItemsForLevel("B1").map((item) => item.mode)).toEqual(["partial", "full", "full", "full"]);
    expect(dictationItemsForLevel("B2").every((item) => item.mode === "full")).toBe(true);
    expect(dictationBank.every((item) => item.policyVersion === DICTATION_POLICY && item.source === "original-authored-dictation-bank" && item.audioSource === "browser-tts-synthetic" && item.examGrade === false)).toBe(true);
  });

  it("reconstructs every partial template exactly and gives each placeholder one unique slot", () => {
    for (const item of dictationBank.filter((candidate) => candidate.mode === "partial")) {
      expect(buildPartialCanonical(item)).toBe(item.canonicalText);
      const placeholders = [...item.partialTemplate!.matchAll(/\{\{(\d+)\}\}/gu)].map((match) => Number(match[1]));
      expect(placeholders).toEqual(item.slots!.map((slot) => slot.index));
      expect(new Set(placeholders).size).toBe(placeholders.length);
    }
  });

  it("checks partial spelling and capitalization without accepting ss for authored ß", () => {
    const item = dictationBank.find((candidate) => candidate.id === "dict-a1-greeting")!;
    const correct = evaluatePartialDictation(item, { 1: "Tag", 2: "heiße" });
    const spelling = evaluatePartialDictation(item, { 1: "tag", 2: "heisse" });
    expect(correct).toMatchObject({ exact: true, wordAccuracyPercent: 100, errorCount: 0, mismatches: [] });
    expect(spelling).toMatchObject({ exact: false, wordAccuracyPercent: 0, errorCount: 2 });
    expect(spelling.mismatches).toEqual([
      { kind: "substitution", expected: "Tag", actual: "tag" },
      { kind: "substitution", expected: "heiße", actual: "heisse" },
    ]);
  });

  it("separates word mismatch feedback from capitalization and punctuation-only feedback", () => {
    const canonical = "Die Ergebnisse lassen sich nicht verallgemeinern, weil Branchen abweichen.";
    const exact = evaluateFullDictation(canonical, canonical);
    const surface = evaluateFullDictation("die Ergebnisse lassen sich nicht verallgemeinern weil Branchen abweichen", canonical);
    const lexical = evaluateFullDictation("Die Resultate lassen sich verallgemeinern, weil Branchen abweichen.", canonical);
    expect(exact).toMatchObject({ exact: true, wordAccuracyPercent: 100, errorCount: 0 });
    expect(surface).toMatchObject({ exact: false, wordAccuracyPercent: 100, surfaceOnlyDifference: true, mismatchCount: 0, errorCount: 1 });
    expect(lexical.exact).toBe(false);
    expect(lexical.wordAccuracyPercent).toBeLessThan(100);
    expect(lexical.mismatches.some((mismatch) => mismatch.kind === "substitution")).toBe(true);
    expect(tokenizeDictation("U-Bahn, E-Mail und Größe.")).toEqual(["U-Bahn", "E-Mail", "und", "Größe"]);
  });

  it("persists only bounded attempt summaries and rejects answer text or inconsistent exactness", () => {
    const item = dictationBank[0];
    const evaluation = evaluatePartialDictation(item, { 1: "Tag", 2: "heiße" });
    const attempt = createDictationAttempt({ item, evaluation, playbackCount: 2, now: new Date("2026-09-11T10:00:00Z"), id: "dictation-1" });
    expect(attempt).toMatchObject({ policyVersion: DICTATION_POLICY, level: "A1", mode: "partial", exact: true, playbackCount: 2, evidenceBoundary: DICTATION_EVIDENCE_BOUNDARY });
    expect(attempt).not.toHaveProperty("answer");
    expect(attempt).not.toHaveProperty("canonicalText");
    expect(learningStateSchema.safeParse({ ...defaultState, dictationAttempts: [attempt] }).success).toBe(true);
    expect(learningStateSchema.safeParse({ ...defaultState, dictationAttempts: [{ ...attempt, answerText: "secret" }] }).success).toBe(false);
    expect(learningStateSchema.safeParse({ ...defaultState, dictationAttempts: [{ ...attempt, exact: false }] }).success).toBe(false);
    expect(() => createDictationAttempt({ item, evaluation, playbackCount: 0 })).toThrow("playback");
  });

  it("merges unique summaries through DWNB state without changing mastery", () => {
    const item = dictationBank[0];
    const evaluation = evaluatePartialDictation(item, { 1: "Tag", 2: "heiße" });
    const first = createDictationAttempt({ item, evaluation, playbackCount: 1, id: "d1" });
    const second = createDictationAttempt({ item, evaluation, playbackCount: 2, retryOf: "d1", id: "d2" });
    const merged = mergeLearningStates({ ...defaultState, dictationAttempts: [first] }, { ...defaultState, dictationAttempts: [second] });
    expect(merged.dictationAttempts).toEqual([first, second]);
    expect(merged.mastery).toEqual(defaultState.mastery);
  });

  it("renders a guided listen-write-compare-retry contract with no pre-attempt model", () => {
    const source = readFileSync("src/components/dictation-lab.tsx", "utf8");
    for (const marker of ["Vorbereiten", "Hören", "Schreiben", "Vergleichen", "Jetzt hören", "أخفِ النموذج وأعد", "data-dictation-policy"]) expect(source).toContain(marker);
    expect(source.indexOf("dictation-editor-lock")).toBeLessThan(source.indexOf("dictation-result"));
    expect(source).toContain("لا نحفظ النص الذي كتبته");
    expect(source).toContain("ليس اختبار CEFR");
    expect(source).not.toMatch(/pronunciationScore|fluencyScore|officialScore/);
  });
});
