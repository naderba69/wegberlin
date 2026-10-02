// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PHONEME_CLAIM_FRAGMENTS,
  localWordMatchPhonemeProvider,
  PHONEME_ENGINE_STATUS_DATA,
  PHONEME_ENGINE_STATUS_TEXT_AR,
  PHONEME_POLICY_VERSION,
  phonemeAssessmentClaim,
  phonemeEngineEvidenceSteps,
  phonemeEngineGate,
  phonemeObservationProviders,
  phonemeReadinessFlags,
  wav2vec2PhonemeCandidate,
  gradeablePhonemeProviders,
} from "@/core/german/phoneme-policy";
import { defaultPhonemeReferenceLexicon } from "@/core/german/phoneme-reference";
import { arabicLearnerPronunciationInventory } from "@/data/arabic-learner-pronunciation-inventory";

describe("phoneme observation provider port stays honest", () => {
  it("ships exactly one provider and it cannot grade phonemes", () => {
    expect(phonemeObservationProviders.map((provider) => provider.id)).toEqual([
      "local-whisper-word-match",
      "wav2vec2-commonphone-candidate",
    ]);
    expect(localWordMatchPhonemeProvider.phonemeGradeable).toBe(false);
    expect(localWordMatchPhonemeProvider.kind).toBe("asr-word-match");
    expect(wav2vec2PhonemeCandidate.runtimeStatus).toBe("not-installed");
    expect(wav2vec2PhonemeCandidate.phonemeGradeable).toBe(false);
    expect(gradeablePhonemeProviders()).toHaveLength(0);
  });

  it("refuses per-phoneme grading through the word-match provider", () => {
    const claim = phonemeAssessmentClaim({
      provider: localWordMatchPhonemeProvider,
      rowCount: 0,
      plannedText: ["الكلمات المؤكدة ثلاث من خمس."],
    });
    expect(claim.allowed).toBe(false);
    expect(claim.verdict).toBe("cannot-verify");
    expect(claim.reasonAr).toContain("لا يستطيع إصدار أحكام على الفونيمات");
  });

  it("refuses invented rows even from a provider that claims the capability", () => {
    const claim = phonemeAssessmentClaim({
      provider: { ...wav2vec2PhonemeCandidate, phonemeGradeable: true },
      rowCount: 5,
      plannedText: ["فلنقل إن الفونيمات مطابقة."],
    });
    expect(claim.allowed).toBe(false);
    expect(claim.verdict).toBe("cannot-verify");
  });

  it("blocks the wording that would promise accent, fluency, or an official score", () => {
    for (const fragment of ["لهجتك ألمانية مثالية", "طلاقتك ممتازة", "Pronunciation score: 88", "لا درجة طلاقة هنا", "نطقك سليم 100%"]) {
      const claim = phonemeAssessmentClaim({
        provider: { ...localWordMatchPhonemeProvider, phonemeGradeable: true },
        rowCount: 0,
        plannedText: [fragment],
      });
      expect(claim.verdict, fragment).toBe(
        FORBIDDEN_PHONEME_CLAIM_FRAGMENTS.some((candidate) => fragment.toLocaleLowerCase("de-DE").includes(candidate.toLocaleLowerCase("de-DE")))
          ? "forbidden-wording"
          : expect.any(String),
      );
      if (claim.verdict === "forbidden-wording") expect(claim.allowed).toBe(false);
    }
  });

  it("keeps every readiness flag closed while evidence is missing", () => {
    expect(phonemeReadinessFlags).toEqual({
      phonemeAssessment: false,
      perPhonemeFeedback: false,
      accentScore: false,
      fluencyScore: false,
      officialExamPronunciationScore: false,
    });
    const gate = phonemeEngineGate();
    expect(gate.open).toBe(false);
    expect(gate.pendingSteps).toHaveLength(phonemeEngineEvidenceSteps.length);
    expect(gate.satisfiedSteps).toHaveLength(0);
    expect(gate.blockerAr).toContain("مغلقة");
    expect(phonemeEngineEvidenceSteps.length).toBe(9);
  });

  it("forbids marking a step satisfied without naming a real artefact", () => {
    for (const step of phonemeEngineEvidenceSteps) {
      if (step.status === "satisfied") {
        // The ledger is only honest if a claimed artefact can be opened.
        expect(step.evidence, step.id).toMatch(/^\S+$/u);
        readFileSync(step.evidence as string, "utf8");
      } else {
        expect(step.evidence, step.id).toBeNull();
      }
      expect(step.requirementAr.length).toBeGreaterThan(10);
    }
  });

  it("exposes the closed state to the UI as data, not as a hidden constant", () => {
    expect(PHONEME_ENGINE_STATUS_DATA).toMatchObject({
      policyVersion: PHONEME_POLICY_VERSION,
      providerId: "local-whisper-word-match",
      phonemeGradeable: false,
      gateOpen: false,
    });
    expect(PHONEME_ENGINE_STATUS_DATA.flags.perPhonemeFeedback).toBe(false);
  });

  it("never lets the phoneme layer touch exam grades or the review-pending inventory", () => {
    const policy = readFileSync("src/core/german/phoneme-policy.ts", "utf8");
    // The invariant that matters: no readiness flag is open, and no wording
    // claims a verified accent, fluency, or guaranteed outcome.
    expect(policy).not.toMatch(/(?:accentScore|fluencyScore|phonemeAssessment|perPhonemeFeedback|officialExamPronunciationScore):\s*true/);
    expect(policy).toContain("FORBIDDEN_PHONEME_CLAIM_FRAGMENTS");
    // The strings this module actually shows a learner must be clean: a ban
    // list is worthless if the shipped copy still contains a banned claim.
    const shownText = Object.values(PHONEME_ENGINE_STATUS_TEXT_AR).flat().join(" ");
    for (const fragment of FORBIDDEN_PHONEME_CLAIM_FRAGMENTS) {
      expect(shownText.toLocaleLowerCase("de-DE"), fragment).not.toContain(fragment.toLocaleLowerCase("de-DE"));
    }
    expect(shownText).toContain("غير مُفعَّل");
    expect(shownText).toContain("لا نتيجة فونيمية");
    expect(shownText).toContain("ولا رقم للنطق");
    expect(PHONEME_ENGINE_STATUS_TEXT_AR.wordRepairIntro.join(" ")).toContain("Whisper");
    expect(policy).toContain("phonemeAssessment: false");
    expect(arabicLearnerPronunciationInventory.every((row) => row.reviewStatus === "authored-review-pending")).toBe(true);
    expect(defaultPhonemeReferenceLexicon.size).toBeGreaterThan(20);
  });
});
