// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  alignPhonemeSequences,
  ALIGNMENT_CONFIDENCE_FLOOR,
  CALIBRATED_THRESHOLD_REVISION,
  judgeSentencePhonemes,
  judgeWordPhonemes,
  PHONEME_ALIGNMENT_BOUNDARY,
  PHONEME_ALIGNMENT_POLICY,
  type WordPhonemeJudgement,
} from "@/core/german/phoneme-alignment";
import { defaultPhonemeReferenceLexicon, lookupPhonemeReference } from "@/core/german/phoneme-reference";

function reference(word: string) {
  const lookup = lookupPhonemeReference(word, defaultPhonemeReferenceLexicon);
  if (lookup.state !== "authored-reference") throw new Error(`${word} has no authored reference in this fixture`);
  return lookup.entry;
}

function wordJudgement(overrides: Partial<Parameters<typeof judgeWordPhonemes>[0]> = {}): WordPhonemeJudgement {
  return judgeWordPhonemes({
    reference: reference("Stadt"),
    observedPhonemes: ["ʃ", "t", "a", "t"],
    wordConfirmed: true,
    attemptId: "attempt-1",
    providerPhonemeGradeable: true,
    ...overrides,
  });
}

describe("phoneme alignment of observed symbols against the authored target", () => {
  it("confirms an exact match and marks every row confirmed", () => {
    const alignment = alignPhonemeSequences(reference("Stadt").phonemes, reference("Stadt").phonemes);
    expect(alignment.edits).toBe(0);
    expect(alignment.similarity).toBe(1);
    expect(alignment.rows.every((row) => row.status === "confirmed")).toBe(true);
    expect(alignment.policyVersion).toBe(PHONEME_ALIGNMENT_POLICY);
    expect(alignment.boundary).toBe(PHONEME_ALIGNMENT_BOUNDARY);
  });

  it("treats a vowel-length swap as a meaning-changing failure, not a near miss", () => {
    // The learner's `Stadt` carries the long vowel of `Staat`; the inventory row
    // ar-pron-vowel-length-a is exactly this contrast.
    const judgement = wordJudgement({ observedPhonemes: reference("Staat").phonemes });
    expect(judgement.state).toBe("phoneme-mismatch");
    expect(judgement.criticalFailures.join(" ")).toContain("طول الحركة");
    expect(judgement.canClaimPronunciationAccuracy).toBe(false);
  });

  it("accepts a tolerated r-variant as a confirmed row, not a substitution", () => {
    const judgement = judgeWordPhonemes({
      reference: reference("rot"),
      observedPhonemes: ["r", "oː", "t"],
      wordConfirmed: true,
      attemptId: "attempt-1",
      providerPhonemeGradeable: true,
    });
    const rRow = judgement.rows.find((row) => row.target === "ʁ");
    expect(rRow?.status).toBe("confirmed");
    expect(rRow?.severe).toBe(false);
    // The word is still not certified, but only because thresholds are not
    // calibrated — never because an accepted r variant was read as an error.
    expect(judgement.criticalFailures).toEqual([expect.stringContaining("لم تُعاير")]);
  });

  it("reports a deleted essential phoneme as critical, and a reduced schwa as not critical", () => {
    const deleted = wordJudgement({ observedPhonemes: ["ʃ", "a", "t"] });
    // drops the first [t] of the coda cluster: an essential deletion
    expect(deleted.state).toBe("phoneme-mismatch");
    expect(deleted.criticalFailures.join(" ")).toContain("حذف");
    const schwaOnly = judgeWordPhonemes({
      reference: reference("offen"),
      observedPhonemes: ["ɔ", "f", "n"],
      wordConfirmed: true,
      attemptId: "attempt-1",
      providerPhonemeGradeable: true,
    });
    expect(schwaOnly.rows.filter((row) => row.severe && row.status === "deleted")).toHaveLength(0);
  });

  it("never turns a missing observation into a pronunciation error", () => {
    const noProvider = wordJudgement({ providerPhonemeGradeable: false });
    expect(noProvider.state).toBe("technical-unverifiable");
    expect(noProvider.criticalFailures).toHaveLength(0);
    expect(noProvider.rows).toHaveLength(0);

    const noObservation = wordJudgement({ observedPhonemes: null });
    expect(noObservation.state).toBe("technical-unverifiable");

    const unconfirmedWord = wordJudgement({ wordConfirmed: false });
    expect(unconfirmedWord.state).toBe("word-not-confirmed");
    expect(unconfirmedWord.explanationAr).toContain("خطأ تعرّف");
  });

  it("confirms a sentence only when every word passes in the same attempt", () => {
    const passing = (word: string): WordPhonemeJudgement => ({
      ...wordJudgement({ observedPhonemes: reference(word).phonemes, reference: reference(word) }),
      word,
      state: "phoneme-confirmed",
      criticalFailures: [],
    });
    const confirmed = judgeSentencePhonemes({
      words: [passing("Stadt"), passing("rad")],
      targetWordCount: 2,
    });
    expect(confirmed.state).toBe("confirmed");
    expect(confirmed.sameAttempt).toBe(true);
    expect(confirmed.compositeScore).toBeNull();
    expect(confirmed.canClaimPhonemeAccuracy).toBe(false);
    expect(confirmed.gateExplanationAr).toContain("حدود المحرك");

    const mixedAttempts = judgeSentencePhonemes({
      words: [passing("Stadt"), { ...passing("rad"), attemptId: "attempt-2" }],
      targetWordCount: 2,
    });
    expect(mixedAttempts.state).toBe("technical-unverifiable");
    expect(mixedAttempts.sameAttempt).toBe(false);
    expect(mixedAttempts.gateExplanationAr).toContain("محاولات مختلفة");

    const oneFailing = judgeSentencePhonemes({
      words: [passing("Stadt"), wordJudgement({ observedPhonemes: reference("Staat").phonemes })],
      targetWordCount: 2,
    });
    expect(oneFailing.state).toBe("needs-retry");
    expect(oneFailing.criticalFailures.length).toBeGreaterThan(0);
    expect(oneFailing.unconfirmedWords).toContain("Stadt");
  });

  it("keeps the confidence floor explicit and records that no calibration exists yet", () => {
    expect(ALIGNMENT_CONFIDENCE_FLOOR).toBeGreaterThan(0.5);
    expect(ALIGNMENT_CONFIDENCE_FLOOR).toBeLessThan(1);
    expect(CALIBRATED_THRESHOLD_REVISION).toBeNull();
    // Without a calibration revision, a superficially perfect alignment still
    // cannot be certified, because the accept threshold itself is unverified.
    const uncertified = judgeWordPhonemes({
      reference: reference("Stadt"),
      observedPhonemes: reference("Stadt").phonemes,
      wordConfirmed: true,
      attemptId: "attempt-1",
      providerPhonemeGradeable: true,
    });
    expect(uncertified.state).toBe("phoneme-mismatch");
    expect(uncertified.criticalFailures.join(" ")).toContain("لم تُعاير");
  });

  it("does not average phonemes into any aggregate field", () => {
    const judgement = judgeWordPhonemes({
      reference: reference("offen"),
      observedPhonemes: ["ɔ", "f", "n̩"],
      wordConfirmed: true,
      attemptId: "attempt-1",
      providerPhonemeGradeable: true,
    });
    const sentence = judgeSentencePhonemes({ words: [judgement], targetWordCount: 1 });
    const serialized = JSON.stringify(sentence);
    expect(serialized).not.toMatch(/"(?:average|mean|percent|composite|fluency)[A-Za-z]*"\s*:\s*[0-9]/);
    expect(sentence.compositeScore).toBeNull();
    expect(sentence.words.reduce((total, word) => total + word.confidence, 0)).toBeGreaterThan(0);
    expect((sentence as unknown as Record<string, unknown>).score).toBeUndefined();
  });
});
