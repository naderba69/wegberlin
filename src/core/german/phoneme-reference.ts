/**
 * `german-phoneme-reference-v1` — the only source of word transcriptions in
 * this project: human-authored IPA that already exists in the curriculum.
 *
 * Why not a rule transducer: a hand-written grapheme-to-phoneme engine was
 * measured against the 53 human-authored strings published in this repository
 * and reproduced 35 of them exactly. The misses were real German words
 * (`ofen`, `sprechen`, `Straße`), so an invented transcription would put wrong
 * IPA in front of a learner who cannot check it. This module therefore returns
 * authored data or nothing at all, and the spelling-hint layer carries the
 * explanatory load.
 */

import { arabicLearnerPronunciationInventory } from "@/data/arabic-learner-pronunciation-inventory";
import { GERMAN_SPELLING_HINT_POLICY_VERSION, spellingPhonemeHints, type SpellingHint } from "./spelling-phoneme-hints";
import { CURRICULUM_PHONEME_REFERENCE_ROWS } from "@/config/curriculum-phoneme-reference.generated";

export const GERMAN_PHONEME_REFERENCE_POLICY = "german-phoneme-reference-v1" as const;
export const GERMAN_PHONEME_REFERENCE_BOUNDARY =
  "human-authored-curriculum-ipa-only-no-invented-transcription-no-pronunciation-score" as const;

export type PhonemeReferenceVariant = { ipa: string; source: string; labelAr?: string };

export type PhonemeReferenceEntry = {
  word: string;
  ipa: string;
  phonemes: string[];
  /** Where the authored string came from, so a reviewer can re-open it. */
  source: string;
  authoring: "human-authored";
  /** Other authored readings of the same spelling, e.g. a shifted word stress. */
  variants?: PhonemeReferenceVariant[];
};

export type PhonemeReferenceLexicon = {
  policyVersion: typeof GERMAN_PHONEME_REFERENCE_POLICY;
  entries: Map<string, PhonemeReferenceEntry>;
  size: number;
  boundary: typeof GERMAN_PHONEME_REFERENCE_BOUNDARY;
};

export type PhonemeReferenceLookup =
  | {
      state: "authored-reference";
      word: string;
      entry: PhonemeReferenceEntry;
      /** True when the curriculum authored more than one reading for this spelling. */
      multipleReadings: boolean;
      hints: SpellingHint[];
      gradeable: false;
      policyVersion: typeof GERMAN_PHONEME_REFERENCE_POLICY;
      boundary: typeof GERMAN_PHONEME_REFERENCE_BOUNDARY;
    }
  | {
      state: "no-authored-reference";
      word: string;
      multipleReadings: false;
      /** Letter-level guidance is still safe to show, because it reads spelling. */
      hints: SpellingHint[];
      reasonAr: string;
      gradeable: false;
      policyVersion: typeof GERMAN_PHONEME_REFERENCE_POLICY;
      boundary: typeof GERMAN_PHONEME_REFERENCE_BOUNDARY;
    };

/**
 * Longest-match clusters that are a *single* phoneme. Consonant sequences such
 * as `ʃt`, the `-ig` spelling, and a vowel plus a following r-coloring are
 * deliberately not listed: aligning at phoneme granularity is the whole point,
 * and merging two phonemes into one token would hide a deletion.
 */
const IPA_MULTI_SYMBOLS = [
  "aɪ̯", "aʊ̯", "ɔʏ̯", "tʃ", "dʒ", "pf", "ts", "n̩", "l̩", "m̩", "ŋ", "ɐ̯", "ʁ", "ʀ", "ɕ", "ç", "x",
];

/** Splits an IPA string into phoneme tokens with a longest-match table. */
export function splitIpaIntoPhonemes(ipa: string): string[] {
  const body = Array.from(
    ipa
      .normalize("NFC")
      .replace(/[[\]]/gu, "")
      .replace(/[ˈˌ.·…]/gu, "")
      // A space in an IPA string separates words, never marks a phoneme. The
      // aligner is word-scoped by contract, so whitespace is dropped here
      // instead of becoming a phantom token with no inventory row.
      .replace(/\s+/gu, "")
      // One authored row types ASCII `g`; the inventory base is the IPA script
      // g (`ɡ`). Folding the codepoint is a spelling tolerance, not a phoneme
      // claim: both stand for the same German sound.
      .replace(/g/gu, "\u0261")
      .trim(),
  );
  const symbols: string[] = [];
  let index = 0;
  while (index < body.length) {
    const rest = body.slice(index).join("");
    const cluster = IPA_MULTI_SYMBOLS.find((candidate) => rest.startsWith(candidate));
    if (cluster) {
      symbols.push(cluster);
      index += Array.from(cluster).length;
      continue;
    }
    const current = body[index]!;
    const following = body[index + 1];
    if (following === "ː") {
      symbols.push(`${current}ː`);
      index += 2;
      continue;
    }
    if (/[aeiouɛɪɔʊʏyøœ]/u.test(current) && following === "ɪ̯") {
      symbols.push(`${current}ɪ̯`);
      index += 2;
      continue;
    }
    symbols.push(current);
    index += 1;
  }
  // A combining mark that lost its base (a stray `̯`/̯ in one authored row)
  // is folded back onto the previous symbol instead of becoming a phantom
  // phoneme that the learner would be scored against.
  const merged: string[] = [];
  for (const symbol of symbols) {
    if (/^[\u0300-\u036f]+$/.test(symbol)) {
      if (merged.length) merged[merged.length - 1] += symbol;
      continue;
    }
    merged.push(symbol);
  }
  return merged;
}

export function normalizeGermanKey(word: string): string {
  return word
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/[^\p{Ll}]/gu, "");
}

function looksLikeSingleWordIpa(ipa: string): boolean {
  return /^\[[^\s…↘↗]+\]$/u.test(ipa.trim());
}

export function createPhonemeReferenceLexicon(
  extra: Array<{ de: string; ipa: string; source: string }> = [],
  base?: PhonemeReferenceLexicon,
): PhonemeReferenceLexicon {
  const entries = new Map(base?.entries ?? []);
  const add = (word: string, ipa: string, source: string) => {
    const key = normalizeGermanKey(word);
    // A key must identify one word. Multi-word entries would collapse into the
    // same normalized key as their first token and silently shadow it.
    if (!key || /\s/u.test(word.trim()) || !looksLikeSingleWordIpa(ipa)) return;
    const existing = entries.get(key);
    if (existing) {
      // Same spelling, different IPA: German stress and vowel length can be
      // contrastive (`UMfahren` vs `umFAHren`), so both variants are kept and
      // labelled instead of one silently winning.
      const known = [existing.ipa, ...(existing.variants ?? []).map((variant) => variant.ipa)];
      if (!known.includes(ipa.trim())) {
        entries.set(key, { ...existing, variants: [...(existing.variants ?? []), { ipa: ipa.trim(), source }] });
      }
      return;
    }
    entries.set(key, {
      word: word.trim(),
      ipa: ipa.trim(),
      phonemes: splitIpaIntoPhonemes(ipa),
      source,
      authoring: "human-authored",
    });
  };

  for (const row of arabicLearnerPronunciationInventory) {
    add(row.leftDe, row.leftIpa, `inventory:${row.id}:left`);
    add(row.rightDe, row.rightIpa, `inventory:${row.id}:right`);
  }
  for (const item of extra) add(item.de, item.ipa, item.source);

  return {
    policyVersion: GERMAN_PHONEME_REFERENCE_POLICY,
    entries,
    size: entries.size,
    boundary: GERMAN_PHONEME_REFERENCE_BOUNDARY,
  };
}

/**
 * Default lexicon: the Arabic-learner contrast inventory only. Lesson pages
 * extend it with their own pronunciation items so no learner is shown an
 * invented transcription, and no page has to import every lesson in the
 * curriculum to display two words.
 */
/**
 * The lexicon the learner-facing surfaces use.
 *
 * With the inventory rows alone this covered 6 of the 207 authored word-level
 * curriculum rows (3%), so a learner practising `fünf` or `Stadt` was told there
 * was no authored reference while the curriculum does have one. The generated
 * module below carries exactly the curriculum's own {de, ipa, source} rows -
 * no rule, no invented symbol, and every entry still names its lesson so a
 * reviewer can reopen the source. Rebuild with `npm run phoneme:lexicon:generate`;
 * tests/unit/german-phoneme-corpus.test.ts fails if the two ever drift apart.
 */
export const curriculumPhonemeReferenceLexicon = createPhonemeReferenceLexicon([
  ...CURRICULUM_PHONEME_REFERENCE_ROWS,
]);

export const defaultPhonemeReferenceLexicon = curriculumPhonemeReferenceLexicon;

export function lookupPhonemeReference(
  word: string,
  lexicon: PhonemeReferenceLexicon = defaultPhonemeReferenceLexicon,
): PhonemeReferenceLookup {
  const hints = spellingPhonemeHints(word);
  const entry = lexicon.entries.get(normalizeGermanKey(word));
  if (entry) {
    return {
      state: "authored-reference",
      word,
      entry,
      multipleReadings: Boolean(entry.variants?.length),
      hints,
      gradeable: false,
      policyVersion: GERMAN_PHONEME_REFERENCE_POLICY,
      boundary: GERMAN_PHONEME_REFERENCE_BOUNDARY,
    };
  }
  return {
    state: "no-authored-reference",
    word,
    multipleReadings: false,
    hints,
    reasonAr:
      "لا يوجد نسخ صوتي بشري المراجعة لهذه الكلمة في المنهج، فلا يُعرض أي تخمين لتركيبها الصوتي. التلميحات أدناه تقرأ الكتابة فقط.",
    gradeable: false,
    policyVersion: GERMAN_PHONEME_REFERENCE_POLICY,
    boundary: GERMAN_PHONEME_REFERENCE_BOUNDARY,
  };
}

/** The primary authored reading first, then any additional authored readings. */
export function authoredReadings(entry: PhonemeReferenceEntry): PhonemeReferenceVariant[] {
  return [{ ipa: entry.ipa, source: entry.source, labelAr: entry.word }, ...(entry.variants ?? [])];
}

export function lexiconWords(lexicon: PhonemeReferenceLexicon): string[] {
  return [...lexicon.entries.values()].map((entry) => entry.word);
}

export const GERMAN_SPELLING_HINT_VERSION_EXPORTED = GERMAN_SPELLING_HINT_POLICY_VERSION;
