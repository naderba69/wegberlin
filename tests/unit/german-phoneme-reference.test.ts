// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { arabicLearnerPronunciationInventory } from "@/data/arabic-learner-pronunciation-inventory";
import {
  createPhonemeReferenceLexicon,
  GERMAN_PHONEME_REFERENCE_BOUNDARY,
  GERMAN_PHONEME_REFERENCE_POLICY,
  authoredReadings,
  lookupPhonemeReference,
  splitIpaIntoPhonemes,
} from "@/core/german/phoneme-reference";
import { GERMAN_SPELLING_HINT_POLICY_VERSION, priorityHints, PRIORITY_HINT_FAMILIES, spellingPhonemeHints } from "@/core/german/spelling-phoneme-hints";
import { GERMAN_PHONEME_INVENTORY_POLICY, germanPhonemes, isMeaningChangingConfusion, phonemeConfusions, vowelLengthContrasts } from "@/core/german/phoneme-inventory";

const wordLevelRows = arabicLearnerPronunciationInventory.filter((row) => /^\[[^\s…↘↗]+\]$/u.test(row.leftIpa) && /^\[[^\s…↘↗]+\]$/u.test(row.rightIpa));

describe("German phoneme reference is anchored to authored curriculum IPA", () => {
  it("resolves every human-authored contrast word with the exact published IPA", () => {
    expect(wordLevelRows.length).toBeGreaterThanOrEqual(14);
    for (const row of wordLevelRows) {
      for (const [side, ipa] of [[row.leftDe, row.leftIpa], [row.rightDe, row.rightIpa]] as const) {
        const lookup = lookupPhonemeReference(side);
        expect(lookup.state, `${side} must come from the authored lexicon`).toBe("authored-reference");
        if (lookup.state !== "authored-reference") continue;
        // Same spelling with a different stress (UMfahren vs umFAHren) keeps
        // both authored readings instead of letting one shadow the other.
        expect(authoredReadings(lookup.entry).map((variant) => variant.ipa), side).toContain(ipa);
        expect(lookup.entry.authoring).toBe("human-authored");
        expect(lookup.entry.source.startsWith("inventory:")).toBe(true);
      }
    }
    const stress = lookupPhonemeReference("umfahren");
    if (stress.state === "authored-reference") {
      expect(stress.multipleReadings).toBe(true);
      expect(authoredReadings(stress.entry)).toHaveLength(2);
    }
  });

  it("never invents a transcription for a word the curriculum has not authored", () => {
    const lookup = lookupPhonemeReference("Xylophonmuseum");
    expect(lookup.state).toBe("no-authored-reference");
    if (lookup.state === "no-authored-reference") {
      expect(lookup.reasonAr).toContain("لا يُعرض أي تخمين");
      expect((lookup as unknown as { entry?: unknown }).entry).toBeUndefined();
    }
    expect(lookup.gradeable).toBe(false);
    expect(lookup.policyVersion).toBe(GERMAN_PHONEME_REFERENCE_POLICY);
    expect(lookup.boundary).toBe(GERMAN_PHONEME_REFERENCE_BOUNDARY);
  });

  it("splits authored IPA into phoneme tokens that stay inside the declared inventory", () => {
    const inventory = new Set(germanPhonemes.map((phoneme) => phoneme.base));
    for (const row of wordLevelRows) {
      for (const ipa of [row.leftIpa, row.rightIpa]) {
        const phonemes = splitIpaIntoPhonemes(ipa);
        expect(phonemes.length, ipa).toBeGreaterThan(1);
        for (const symbol of phonemes) {
          const bare = symbol.replace("ː", "");
          expect(inventory.has(bare) || /^(?:ɐ|ə|ŋ|̆)$/.test(bare), `${symbol} in ${ipa}`).toBe(true);
        }
      }
    }
  });

  it("accepts lesson pronunciation items as additional authored references without duplicating keys", () => {
    const extended = createPhonemeReferenceLexicon([
      { de: "Schwester", ipa: "[ˈʃvɛstɐ]", source: "lesson:a1-m2" },
      { de: "Stadt", ipa: "[ʃtat]", source: "duplicate-must-be-ignored" },
      { de: "Satz mit Leerzeichen", ipa: "[zats]", source: "rejected-not-a-word" },
    ]);
    expect(extended.policyVersion).toBe(GERMAN_PHONEME_REFERENCE_POLICY);
    expect(extended.entries.get("schwester")?.source).toBe("lesson:a1-m2");
    expect(extended.entries.get("stadt")?.source).toBe("inventory:ar-pron-vowel-length-a:left");
    expect(extended.entries.has("satzmitleerzeichen")).toBe(false);
    // Compared against a fresh inventory-only baseline: the shipped default now
    // also carries the 207 generated curriculum rows, so it is not the yardstick
    // for "exactly one entry was added".
    expect(extended.size).toBe(createPhonemeReferenceLexicon([]).size + 1);
  });

  it("publishes the inventory policy id so the aligner and the ledger cannot drift apart", () => {
    expect(GERMAN_PHONEME_INVENTORY_POLICY).toBe("german-phoneme-inventory-v1");
    const inventory = new Set(germanPhonemes.map((phoneme) => phoneme.base));
    expect(phonemeConfusions.every((confusion) => inventory.has(confusion.left) && inventory.has(confusion.right))).toBe(true);
    expect(phonemeConfusions.filter((confusion) => confusion.meaningChanging).length).toBeGreaterThanOrEqual(10);
    expect(vowelLengthContrasts.every((entry) => inventory.has(entry.base))).toBe(true);
    expect(isMeaningChangingConfusion("p", "b")).toBe(true);
    expect(isMeaningChangingConfusion("ʁ", "ʀ")).toBe(false);
    expect(isMeaningChangingConfusion("ʁ", "ʁ")).toBe(false);
  });
});

describe("Spelling-to-sound hints read letters only", () => {
  it("explains ich-Laut, ach-Laut, and the word-initial sp/st cluster", () => {
    const families = (word: string) => spellingPhonemeHints(word).map((hint) => hint.family);
    expect(families("Kirche")).toContain("ich-laut");
    expect(families("Kirsche")).toContain("sch");
    expect(families("Bach")).toContain("ach-laut");
    expect(families("Stadt")).toContain("sp-st-onset");
    expect(families("List")).not.toContain("sp-st-onset");
    expect(families("Zeit")).toContain("z-affricate");
    expect(families("Rad")).toContain("final-devoicing");
    expect(families("richtig")).toContain("suffix-ig");
    expect(families("schön")).toContain("umlaut");
    expect(families("Uhr")).toContain("silent-h");
    expect(families("heißen")).toContain("sharp-s");
  });

  it("labels every hint as non-authoritative and returns the priority families list", () => {
    const hints = spellingPhonemeHints("Brücke");
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.every((hint) => hint.authoritative === false && hint.boundary === "spelling-to-sound-hint-not-acoustic-measurement-not-a-pronunciation-score")).toBe(true);
    expect(priorityHints(hints).every((hint) => (PRIORITY_HINT_FAMILIES as readonly string[]).includes(hint.family))).toBe(true);
    expect(GERMAN_SPELLING_HINT_POLICY_VERSION).toBe("german-spelling-hints-v1");
  });

  it("keeps hint ids unique and the guidance free of raw bidi controls", () => {
    for (const word of ["Sprache", "Küche", "Straße", "Zeitung", "Hund", "Tag"]) {
      const hints = spellingPhonemeHints(word);
      expect(new Set(hints.map((hint) => hint.id)).size).toBe(hints.length);
      for (const hint of hints) {
        expect(/[\u202A-\u202E\u2066-\u2069]/u.test(hint.guidanceAr)).toBe(false);
        expect(hint.ipa.length).toBeGreaterThan(0);
      }
    }
  });

  it("produces no hint for a word with no teachable pattern instead of guessing", () => {
    const hints = spellingPhonemeHints("Mmm");
    expect(hints.filter((hint) => hint.family === "vowel-length" || hint.family === "umlaut")).toHaveLength(0);
  });

  it("is used as a reference component that never renders a score", () => {
    const component = readFileSync("src/components/phoneme-word-reference.tsx", "utf8");
    for (const marker of ["data-phoneme-reference", "data-phoneme-readiness", "PHONEME_ENGINE_STATUS_LINE_AR", "dir=\"ltr\"", "data-bidi-scope=\"technical\""]) {
      expect(component).toContain(marker);
    }
    expect(component).not.toMatch(/score| Prozent|درجة نطق/);
  });
});
