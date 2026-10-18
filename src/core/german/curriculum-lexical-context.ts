import { createLexicalLoadContext, type LexicalLoadContext } from "@/core/content-validation/lexical-load";
import { germanLemmaDictionary } from "@/data/german-lemma-dictionary";
import { curriculumPersonNames, curriculumPlaceNames } from "@/data/curriculum-proper-names";

/**
 * The one lexical context shared by the build-time lexical-load audit (ADR-126) and the learner's
 * per-lemma evidence (ADR-132). Before ADR-132 the stop list and the legacy stemmer lived inline in
 * scripts/generate-lesson-quality-audit.ts; they moved here unchanged so the audit's numbers and the
 * learner view can never disagree about what counts as a content word.
 */
export const CURRICULUM_LEXICAL_CONTEXT_POLICY = "curriculum-lexical-context-v1" as const;

export const CURRICULUM_STOP_WORDS: readonly string[] = Object.freeze("der die das und oder aber für mit von zu im am an ein eine einen einer einem des dem den ich du er sie es wir ihr sie nicht kein keine alle jeder jede wenn als auch noch schon sehr mehr weniger man uns euch ihnen ihm sein ihre ihrem diesem dieser dieses bei nach aus über unter vor hinter zwischen um ohne innerhalb außerhalb kann werde werden wird hat haben hatte sollte müssen will möchten".split(" "));

/** Legacy suffix stemmer of the audit. Kept byte-identical so earlier load figures stay comparable. */
export function curriculumStem(word: string): string {
  return word.replace(/(chen|lein|ungen|ung|keiten|keit|heiten|heit|ieren|ieren|erte|ern|en|em|es|e|s)$/, "").slice(0, Math.max(4, word.length - 2));
}

let cachedContext: LexicalLoadContext | null = null;

export function curriculumLexicalContext(): LexicalLoadContext {
  cachedContext ??= createLexicalLoadContext({ dictionary: germanLemmaDictionary, stopWords: CURRICULUM_STOP_WORDS, properNames: [...curriculumPersonNames, ...curriculumPlaceNames], stem: curriculumStem });
  return cachedContext;
}
