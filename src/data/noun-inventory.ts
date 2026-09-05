/**
 * P0-98: جرد أسماء مسرد القراءة.
 *
 * التعريف المعلن للاسم الهدف: **كل اسم يظهر في `reading.glossary` في درس منشور**.
 * المسرد هو قائمة مفردات مؤلفة داخل الدرس نفسه (lemma + الصيغة الظاهرة في النص + معنى
 * عربي)، فلا نخترع قائمة من الخارج ولا نستنتج الاسم من النص بتخمين. يُستبعد ما ليس
 * اسمًا (الأفعال والصفات والظروف والحروف) بعلامة الحرف الكبير مع قائمة قصيرة للأسماء
 * التي يكتبها المتعلّم كبيرة بطبيعتها (أيام الأسبوع وأسماء البلدان).
 *
 * القياس: كل اسم هدف يجب أن يملك سجلًا في **درسه نفسه** — مرساة مؤلفة أو سجلًا مشتقًا
 * من الجرد. الفارق بين الاثنين يُعرض رقمًا، ولا يُغلق إلا بتأليف السجل الناقص.
 *
 * المصدر الثاني: الأسماء التي تظهر **كعبارة اسمية مستقلة** في بطاقات الدرس أو عباراته
 * (`die Speisekarte`، `das Wohnzimmer`، `der Vorname`): الأداة هنا مرفوعة لا مجرورة،
 * والكلمة معرّفة بمعناها العربي في البطاقة نفسها، فهي جرد مؤلف ثانٍ من داخل المادة.
 * المستبعد منه معلن: الأسماء التي لا مفرد لها في الاستعمال (`PLURALIA_TANTUM`)،
 * وصيغ الجمع المعروفة (`Kinder`، `Augen`) لأن سجل الطبقة مبني على المفرد المرفوع.
 */
import { academicLessonList } from "./academic-lessons";
import { a1NounGrammarEntries } from "./lexical-grammar-a1";
import { a2NounGrammarEntries } from "./lexical-grammar-a2";
import { b1NounGrammarEntries } from "./lexical-grammar-b1";
import { b2NounGrammarEntries } from "./lexical-grammar-b2";
import { buildNounEntries } from "./lexical-grammar-build";
import {
  nounInventorySeedsByLemma,
  phraseNounSeedsByLemma,
  PLURALIA_TANTUM,
} from "./noun-inventory-seeds";
import type { LexicalSourceVersion, NounGrammarEntry } from "@/types/lexical-grammar";

/** أسماء تظهر كبيرة في المسرد ولا يحتاج المتعلّم إلى قاعدة للتحقق منها. */
const ALWAYS_CAPITALIZED = new Set([
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag",
  "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember",
]);

const isNounLike = (lemma: string) => /^[A-ZÄÖÜ][a-zäöüß]+$/.test(lemma) || ALWAYS_CAPITALIZED.has(lemma);

export type GlossaryNounTarget = {
  lemma: string;
  surfaceForm: string;
  meaningAr: string;
};

/** الأسماء الهدف لكل درس كما يقرّها مسرد قراءته. */
export const lessonNounTargets: Record<string, GlossaryNounTarget[]> = Object.fromEntries(
  academicLessonList.map((lesson) => {
    const glossary = (lesson.reading as { glossary?: Array<{ lemma: string; surfaceForm?: string; ar: string }> }).glossary ?? [];
    const seen = new Set<string>();
    const targets: GlossaryNounTarget[] = [];
    for (const item of glossary) {
      const lemma = item.lemma.trim();
      if (!isNounLike(lemma) || seen.has(lemma)) continue;
      seen.add(lemma);
      targets.push({ lemma, surfaceForm: (item.surfaceForm ?? lemma).trim(), meaningAr: item.ar.trim() });
    }
    return [lesson.id, targets];
  }),
);

const anchoredNouns = [
  ...a1NounGrammarEntries,
  ...a2NounGrammarEntries,
  ...b1NounGrammarEntries,
  ...b2NounGrammarEntries,
];

const anchoredByLesson = new Map<string, Set<string>>();
const anchoredMorphology = new Map<string, { gender: "masculine" | "feminine" | "neuter"; plural: string | null; oblique: string }>();
for (const noun of anchoredNouns) {
  const set = anchoredByLesson.get(noun.lessonId) ?? new Set<string>();
  set.add(noun.lemma);
  anchoredByLesson.set(noun.lessonId, set);
  // صرف الاسم المؤلف في درس آخر يُعاد استخدامه هنا بدل تأليف ثانٍ لنفس الكلمة:
  // المرسى مصدر واحد للحقيقة، وسجل الجرد يرثه ويضيف إليه معنى مسرد الدرس نفسه.
  if (!anchoredMorphology.has(noun.lemma)) {
    anchoredMorphology.set(noun.lemma, {
      gender: noun.gender,
      plural: noun.plural.form,
      oblique: noun.caseForms.accusative.split(" ").slice(1).join(" "),
    });
  }
}

export type PhraseNounTarget = {
  lemma: string;
  /** الأداة كما ظهرت في العبارة: هنا مرفوعة، فهي مصدر الجنس. */
  article: string;
  meaningAr: string;
};

/** عبارة اسمية ألمانية مستقلة: أداة مرفوعة + اسم، ولا شيء بعدها. */
const NOUN_PHRASE = /^(der|die|das)\s+([A-Z\u00c4\u00d6\u00dc][A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df-]{2,})$/;

/** صيغ الجمع المعروفة في المادة كلها: المفرد هو وحدة السجل، لا صيغة الجمع. */
const knownPluralForms = new Set<string>();

/** صيغ الجمع من المراسى المؤلفة ومن جداول البذور: تُستبعد من أهداف العبارات الاسمية. */
for (const noun of anchoredNouns) if (noun.plural.form) knownPluralForms.add(noun.plural.form);
for (const seed of nounInventorySeedsByLemma.values()) if (seed[2]) knownPluralForms.add(seed[2]);
for (const seed of phraseNounSeedsByLemma.values()) if (seed[2]) knownPluralForms.add(seed[2]);

/**
 * الأسماء الهدف من بطاقات الدرس وعباراته: عبارة اسمية كاملة بمعنى عربي.
 * تُستبعد الأسماء التي لا مفرد لها، وصيغ الجمع، وما هو مرسى مؤلف في الدرس نفسه.
 */
export const lessonPhraseNounTargets: Record<string, PhraseNounTarget[]> = Object.fromEntries(
  academicLessonList.map((lesson) => {
    const flashcards = (lesson as { flashcards?: Array<{ frontDe?: string; backAr?: string }> }).flashcards ?? [];
    const phrases = (lesson as { phrases?: Array<{ de?: string; ar?: string }> }).phrases ?? [];
    const seen = new Set<string>();
    const targets: PhraseNounTarget[] = [];
    const add = (de: string | undefined, ar: string | undefined) => {
      const match = NOUN_PHRASE.exec((de ?? "").trim());
      if (!match) return;
      const lemma = match[2];
      if (seen.has(lemma) || PLURALIA_TANTUM.has(lemma) || knownPluralForms.has(lemma)) return;
      seen.add(lemma);
      targets.push({ lemma, article: match[1], meaningAr: (ar ?? "").trim() });
    };
    for (const card of flashcards) add(card.frontDe, card.backAr);
    for (const phrase of phrases) add(phrase.de, phrase.ar);
    return [lesson.id, targets];
  }),
);

/** هدف واحد لكل اسم: مسرد القراءة أولًا، ثم عبارة البطاقة. */
export type NounTarget = { lemma: string; meaningAr: string; source: "glossary" | "phrase" };

export const lessonAllNounTargets: Record<string, NounTarget[]> = Object.fromEntries(
  academicLessonList.map((lesson) => {
    const seen = new Set<string>();
    const targets: NounTarget[] = [];
    for (const target of lessonNounTargets[lesson.id] ?? []) {
      seen.add(target.lemma);
      targets.push({ lemma: target.lemma, meaningAr: target.meaningAr, source: "glossary" });
    }
    for (const target of lessonPhraseNounTargets[lesson.id] ?? []) {
      if (seen.has(target.lemma)) continue;
      seen.add(target.lemma);
      targets.push({ lemma: target.lemma, meaningAr: target.meaningAr, source: "phrase" });
    }
    return [lesson.id, targets];
  }),
);


const sourceVersionFor = (lessonId: string): LexicalSourceVersion =>
  `${lessonId.slice(0, 2).toLowerCase()}-lexical-grammar-v1` as LexicalSourceVersion;

const levelLabelOf = (lessonId: string) => lessonId.slice(0, 2).toUpperCase();

/**
 * سجلات الجرد: كل اسم هدف في مسرد الدرس ليس مرسى مؤلفًا فيه.
 * الجنس والجمع مؤلفان في `noun-inventory-seeds`، والمعنى من مسرد الدرس نفسه،
 * وGenitiv وجمع المجرور مشتقان بقواعد معلنة.
 */
export const inventoryNounsByLesson: Record<string, NounGrammarEntry[]> = Object.fromEntries(
  academicLessonList.map((lesson) => {
    const anchored = anchoredByLesson.get(lesson.id) ?? new Set<string>();
    const seeds = (lessonAllNounTargets[lesson.id] ?? [])
      .filter((target) => !anchored.has(target.lemma))
      .map((target) => {
        const seed = nounInventorySeedsByLemma.get(target.lemma) ?? phraseNounSeedsByLemma.get(target.lemma);
        if (seed) return [seed[0], seed[1], seed[2], target.meaningAr, seed[3]] as const;
        const borrowed = anchoredMorphology.get(target.lemma);
        if (borrowed) return [target.lemma, borrowed.gender, borrowed.plural, target.meaningAr, borrowed.oblique] as const;
        return null;
      })
      .filter((seed): seed is readonly [string, "masculine" | "feminine" | "neuter", string | null, string, string | undefined] => seed !== null);
    return [
      lesson.id,
      buildNounEntries(lesson.id, seeds, sourceVersionFor(lesson.id), levelLabelOf(lesson.id), "inventory", 1000),
    ];
  }),
);

export const inventoryNouns: NounGrammarEntry[] = Object.values(inventoryNounsByLesson).flat();

/** أسماء هدف لا يملك لها المشروع صرفًا: لا بذرة مؤلفة ولا مرسى في درس آخر. يجب أن تبقى فارغة. */
export const targetNounsWithoutSeed: string[] = [
  ...new Set(
    Object.values(lessonAllNounTargets)
      .flat()
      .filter(
        (target) =>
          !nounInventorySeedsByLemma.has(target.lemma) &&
          !phraseNounSeedsByLemma.has(target.lemma) &&
          !anchoredMorphology.has(target.lemma),
      )
      .map((target) => target.lemma),
  ),
].sort();

export type NounInventoryRow = {
  lessonId: string;
  level: string;
  targets: string[];
  covered: string[];
  gaps: string[];
};

function buildRows(): Record<string, NounInventoryRow> {
  const rows: Record<string, NounInventoryRow> = {};
  for (const lesson of academicLessonList) {
    const glossary = (lessonNounTargets[lesson.id] ?? []).map((target) => target.lemma);
    const phrases = (lessonPhraseNounTargets[lesson.id] ?? [])
      .map((target) => target.lemma)
      .filter((lemma) => !glossary.includes(lemma));
    const targets = [...glossary, ...phrases];
    const anchored = anchoredByLesson.get(lesson.id) ?? new Set<string>();
    const covered = targets.filter((lemma) => anchored.has(lemma));
    const gaps = targets.filter((lemma) => !anchored.has(lemma));
    rows[lesson.id] = { lessonId: lesson.id, level: lesson.id.slice(0, 2).toUpperCase(), targets, covered, gaps };
  }
  return rows;
}

export const lessonNounInventory = buildRows();

export type NounInventorySummary = {
  lessonCount: number;
  lessonsWithTargets: number;
  lessonsWithGaps: number;
  totalTargets: number;
  totalCoveredByAnchors: number;
  totalGaps: number;
  inventoryRecords: number;
  seedTableSize: number;
  phraseSeedTableSize: number;
  /** أهداف من عبارات البطاقات (المصدر الثاني) بعد استبعاد المكرر مع المسرد. */
  totalPhraseTargets: number;
  /** أسماء مستبعدة بلا مفرد في الاستعمال (`PLURALIA_TANTUM`). */
  uniquePluraliaTantum: number;
  targetsWithoutSeed: number;
  uniqueNoPlural: number;
  byLevel: Record<string, { lessons: number; targets: number; covered: number; gaps: number }>;
};

export function buildNounInventorySummary(): NounInventorySummary {
  const rows = Object.values(lessonNounInventory);
  const byLevel: NounInventorySummary["byLevel"] = {};
  for (const row of rows) {
    byLevel[row.level] ??= { lessons: 0, targets: 0, covered: 0, gaps: 0 };
    byLevel[row.level].lessons += 1;
    byLevel[row.level].targets += row.targets.length;
    byLevel[row.level].covered += row.covered.length;
    byLevel[row.level].gaps += row.gaps.length;
  }
  return {
    lessonCount: rows.length,
    lessonsWithTargets: rows.filter((row) => row.targets.length > 0).length,
    lessonsWithGaps: rows.filter((row) => row.gaps.length > 0).length,
    totalTargets: rows.reduce((sum, row) => sum + row.targets.length, 0),
    totalCoveredByAnchors: rows.reduce((sum, row) => sum + row.covered.length, 0),
    totalGaps: rows.reduce((sum, row) => sum + row.gaps.length, 0),
    inventoryRecords: inventoryNouns.length,
    seedTableSize: nounInventorySeedsByLemma.size,
    phraseSeedTableSize: phraseNounSeedsByLemma.size,
    totalPhraseTargets: rows.reduce(
      (sum, row) =>
        sum +
        (lessonPhraseNounTargets[row.lessonId] ?? []).filter(
          (target) => !(lessonNounTargets[row.lessonId] ?? []).some((glossary) => glossary.lemma === target.lemma),
        ).length,
      0,
    ),
    uniquePluraliaTantum: PLURALIA_TANTUM.size,
    targetsWithoutSeed: targetNounsWithoutSeed.length,
    uniqueNoPlural: new Set(inventoryNouns.filter((noun) => noun.plural.form === null).map((noun) => noun.lemma)).size,
    byLevel,
  };
}

export const nounInventorySummary = buildNounInventorySummary();
