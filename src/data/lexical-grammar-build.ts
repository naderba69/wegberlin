import type { GermanGender, LexicalSourceVersion, NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";

/** [lemma, gender, plural (null = لا جمع مستعمل), meaningAr, obliqueSingular (للأسماء الضعيفة)] */
export type NounSeed = readonly [lemma: string, gender: GermanGender, plural: string | null, meaningAr: string, obliqueSingular?: string];

export type FrameSeed = Omit<VerbPrepositionFrame, "id" | "lessonId" | "firstStructuredStage" | "sourceVersion">;

const articleByGender = { masculine: "der", feminine: "die", neuter: "das" } as const;
const accusativeArticleByGender = { masculine: "den", feminine: "die", neuter: "das" } as const;
const dativeArticleByGender = { masculine: "dem", feminine: "der", neuter: "dem" } as const;

const genitiveArticleByGender = { masculine: "des", feminine: "der", neuter: "des" } as const;

/**
 * شواذ Genitiv المفرد المؤلفة يدويًا. القاعدة العامة (أدناه) تغطي معظم الأسماء،
 * لكن هذه المجموعة تحتاج قرارًا لغويًا صريحًا لا تخمينًا آليًا:
 *   - الأسماء الأحادية المقطع (Land/Kind/Buch/Bad/Feld/Zug/Weg/Kopf/Arzt/Grund) تُعلَّم عادةً بـ -es.
 *   - Bus/Fernbus تضاعف السين (des Busses)، وZyklus من أصل لاتيني لا يأخذ لاحقة (des Zyklus).
 *   - Einstufungstest مركّب طويل، والصيغة الشائعة des Einstufungstests لا des Einstufungstestes.
 */
const GENITIVE_OVERRIDES: Record<string, string> = {
  Land: "Landes",
  Kind: "Kindes",
  Buch: "Buches",
  Bad: "Bades",
  Feld: "Feldes",
  Zug: "Zuges",
  Weg: "Weges",
  Kopf: "Kopfes",
  Arzt: "Arztes",
  Grund: "Grundes",
  Bus: "Busses",
  Fernbus: "Fernbusses",
  Zyklus: "Zyklus",
  Einstufungstest: "Einstufungstests",
};

/** أسماء مذكرة تنتهي بـ -e وتأخذ Genitiv بـ -ns (des Namens) بدل -n فقط (des Kollegen). */
const NS_GENITIVE_LEMMAS = new Set(["Name", "Buchstabe", "Gedanke", "Glaube", "Wille", "Friede"]);

const SIBILANT_ENDINGS = ["ß", "x", "z", "sch", "st", "tz", "s"] as const;

/** يشكل صيغة Genitiv المفرد بدون الأداة؛ الأداة تُحسب من الجنس. */
export function deriveGenitiveStem(lemma: string, gender: GermanGender, obliqueSingular: string): string {
  const override = GENITIVE_OVERRIDES[lemma];
  if (override) return override;
  if (gender === "feminine") return lemma;
  if (obliqueSingular !== lemma) {
    // التصريف الضعيف (N-Deklination): Genitiv يتبع الصيغة المائلة.
    return lemma.endsWith("e") && NS_GENITIVE_LEMMAS.has(lemma) ? `${obliqueSingular}s` : obliqueSingular;
  }
  if (lemma.endsWith("nis")) return `${lemma}ses`;
  if (SIBILANT_ENDINGS.some((ending) => lemma.endsWith(ending))) return `${lemma}es`;
  return `${lemma}s`;
}

/** جمع المجرور: den + الجمع، مع إضافة n عندما لا ينتهي الجمع بـ n أو s. */
export function deriveDativePlural(plural: string | null): string | null {
  if (plural === null) return null;
  const suffix = plural.endsWith("n") || plural.endsWith("s") ? "" : "n";
  return `den ${plural}${suffix}`;
}

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
        genitive: `${genitiveArticleByGender[gender]} ${deriveGenitiveStem(lemma, gender, oblique)}`,
      },
      dativePlural: {
        form: deriveDativePlural(plural),
        noteAr: deriveDativePlural(plural)
          ? `جمع المجرور: ${deriveDativePlural(plural)} — الصيغة التي تحتاجها بعد in, mit, bei, von, zu في الجمع.`
          : `لا جمع مستعمل، لذلك لا توجد صيغة جمع مجرور في هذا المعنى داخل ${levelLabel}.`,
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
