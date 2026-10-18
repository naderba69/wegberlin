/**
 * Which documented noun anchors the vocabulary stage shows openly (ADR-127, P2-401).
 *
 * The first four anchors of a lesson are always visible. Further anchors used to sit behind a closed
 * «Weitere Zielnomen» disclosure even when the reading text of the same lesson needs them, so the
 * learner first met them inside the text. Now the anchors that occur in the lesson's own reading
 * text are shown openly under «ستقابلها في نص القراءة». Only anchors that the reading does not use
 * stay in the disclosure. The panel and the lexical-load audit both use this module, so the audit
 * counts exactly what the learner sees.
 */
import { foldGerman } from "@/core/german/lemmatizer";
import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

export const VOCABULARY_STAGE_POLICY = "reading-anchored-noun-visibility-v1" as const;
export const VOCABULARY_STAGE_BASELINE_NOUN_ANCHORS = 4;

type NounLike = Pick<NounGrammarEntry, "lemma" | "plural" | "caseForms">;

function tokens(text: string): Set<string> {
  return new Set(foldGerman(text).split(/[^a-z]+/).filter(Boolean));
}

/** Folded word forms of a noun: lemma, plural, dative plural and the noun part of every case form. */
export function nounSurfaceForms(noun: NounLike): string[] {
  const forms = [noun.lemma, noun.plural.form ?? "", noun.plural.dativeForm ?? "", ...Object.values(noun.caseForms).map((form) => form?.split(/\s+/).at(-1) ?? "")];
  return [...new Set(forms.map((form) => foldGerman(form).replace(/[^a-z]/g, "")).filter(Boolean))];
}

/** True when the noun occurs in the text: an exact folded form, or that form with a genitive -s/-es. */
export function nounOccursIn(noun: NounLike, textTokens: ReadonlySet<string>): boolean {
  return nounSurfaceForms(noun).some((form) => textTokens.has(form) || textTokens.has(`${form}s`) || textTokens.has(`${form}es`));
}

export function splitNounAnchors<T extends NounLike>(nouns: readonly T[], readingText: string): { baseline: T[]; forReading: T[]; further: T[] } {
  const textTokens = tokens(readingText);
  const rest = nouns.slice(VOCABULARY_STAGE_BASELINE_NOUN_ANCHORS);
  return {
    baseline: nouns.slice(0, VOCABULARY_STAGE_BASELINE_NOUN_ANCHORS),
    forReading: rest.filter((noun) => nounOccursIn(noun, textTokens)),
    further: rest.filter((noun) => !nounOccursIn(noun, textTokens)),
  };
}

/**
 * German text the vocabulary stage shows openly besides phrases and cards: lemma and plural of the
 * baseline and reading anchors, plus every verb-preposition frame infinitive. Case forms sit in a
 * closed disclosure on each card and are not counted.
 */
export function vocabularyStageVisibleTexts(nouns: readonly NounLike[], frames: readonly Pick<VerbPrepositionFrame, "infinitive">[], readingText: string): string[] {
  const { baseline, forReading } = splitNounAnchors(nouns, readingText);
  return [...[...baseline, ...forReading].flatMap((noun) => [noun.lemma, noun.plural.form ?? ""]), ...frames.map((frame) => frame.infinitive)].filter(Boolean);
}
