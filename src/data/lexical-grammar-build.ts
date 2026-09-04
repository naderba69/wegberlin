import type { GermanGender, LexicalSourceVersion, NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

/** [lemma, gender, plural (null = لا جمع مستعمل), meaningAr, obliqueSingular (للأسماء الضعيفة)] */
export type NounSeed = readonly [lemma: string, gender: GermanGender, plural: string | null, meaningAr: string, obliqueSingular?: string];

export type FrameSeed = Omit<VerbPrepositionFrame, "id" | "lessonId" | "firstStructuredStage" | "sourceVersion">;

const articleByGender = { masculine: "der", feminine: "die", neuter: "das" } as const;
const accusativeArticleByGender = { masculine: "den", feminine: "die", neuter: "das" } as const;
const dativeArticleByGender = { masculine: "dem", feminine: "der", neuter: "dem" } as const;

export function buildNounEntries(lessonId: string, seeds: readonly NounSeed[], sourceVersion: LexicalSourceVersion, levelLabel: string): NounGrammarEntry[] {
  return seeds.map(([lemma, gender, plural, meaningAr, obliqueSingular], index) => {
    const article = articleByGender[gender];
    const oblique = obliqueSingular ?? lemma;
    return {
      id: `${lessonId}-noun-${index + 1}`,
      lessonId,
      lemma,
      article,
      gender,
      meaningAr,
      plural: {
        form: plural,
        noteAr: plural
          ? `الجمع: die ${plural}`
          : `لا يُستعمل له جمع عادي في هذا المعنى داخل ${levelLabel}.`,
      },
      caseForms: {
        nominative: `${article} ${lemma}`,
        accusative: `${accusativeArticleByGender[gender]} ${oblique}`,
        dative: `${dativeArticleByGender[gender]} ${oblique}`,
      },
      firstStructuredStage: "vocabulary",
      sourceVersion,
    } satisfies NounGrammarEntry;
  });
}

export function buildVerbFrames(lessonId: string, seeds: readonly FrameSeed[], sourceVersion: LexicalSourceVersion): VerbPrepositionFrame[] {
  return seeds.map((frame, index) => ({
    id: `${lessonId}-verb-frame-${index + 1}`,
    lessonId,
    ...frame,
    firstStructuredStage: "vocabulary",
    sourceVersion,
  } satisfies VerbPrepositionFrame));
}

export function groupByLesson<T extends { lessonId: string }>(items: readonly T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.lessonId] = [...(groups[item.lessonId] ?? []), item];
    return groups;
  }, {});
}
