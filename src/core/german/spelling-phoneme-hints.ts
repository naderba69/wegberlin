/**
 * `german-spelling-hints-v1` — letter-level pronunciation hints for German.
 *
 * Why this module exists instead of a hand-written full transducer: a
 * rule-based grapheme-to-phoneme engine produces a *whole word* transcription,
 * and any wrong symbol in it becomes a wrong claim about how German sounds.
 * These hints are deliberately narrow: each one reads a local spelling pattern,
 * states the standard rule for that pattern, and names the single sound
 * contrast the learner should practise. Nothing here inspects audio, so nothing
 * here can say whether the learner produced the sound.
 *
 * Every hint carries `authoritative: false`: it explains spelling, it does not
 * measure speech, and it is never an error count or a score.
 */

export const GERMAN_SPELLING_HINT_POLICY_VERSION = "german-spelling-hints-v1" as const;
export const GERMAN_SPELLING_HINT_BOUNDARY =
  "spelling-to-sound-hint-not-acoustic-measurement-not-a-pronunciation-score" as const;

export type SpellingHint = {
  id: string;
  /** The orthographic trigger that fired, verbatim from the word. */
  letters: string;
  at: number;
  /** IPA symbols the pattern stands for. */
  ipa: string[];
  /** What the learner should do with the mouth, in Arabic. */
  guidanceAr: string;
  /** Named rule family, so tests and the UI can reason about it. */
  family:
    | "ich-laut"
    | "ach-laut"
    | "sp-st-onset"
    | "z-affricate"
    | "final-devoicing"
    | "suffix-ig"
    | "umlaut"
    | "vowel-length"
    | "sharp-s"
    | "silent-h"
    | "sch"
    | "tsch"
    | "qu"
    | "v"
    | "w"
    | "syllabic-n";
  /** True only when the spelling alone decides the pattern. */
  deterministic: boolean;
  authoritative: false;
  boundary: typeof GERMAN_SPELLING_HINT_BOUNDARY;
};

const FRONT_VOWEL_LETTERS = ["i", "e", "ä", "ö", "ü", "y"];
const BACK_VOWEL_LETTERS = ["a", "o", "u"];

function previousVowelRun(word: string, index: number): string {
  let cursor = index - 1;
  while (cursor >= 0 && !/[aeiouäöüy]/u.test(word[cursor]!)) cursor -= 1;
  let run = "";
  while (cursor >= 0 && /[aeiouäöüy]/u.test(word[cursor]!)) {
    run = `${word[cursor]}${run}`;
    cursor -= 1;
  }
  return run;
}

function lettersAt(word: string, index: number, length: number): string {
  return word.slice(index, index + length);
}

function hint(partial: Omit<SpellingHint, "boundary" | "authoritative">): SpellingHint {
  return { ...partial, authoritative: false, boundary: GERMAN_SPELLING_HINT_BOUNDARY };
}

/**
 * Returns every hint that applies to a word, in the order the letters appear.
 * Unknown or irregular spellings simply produce no hint — absence of a hint is
 * never reported as a pronunciation problem.
 */
export function spellingPhonemeHints(word: string): SpellingHint[] {
  const clean = word.normalize("NFC").toLocaleLowerCase("de-DE").replace(/[^a-zäöüß-]/gu, "");
  const hints: SpellingHint[] = [];

  for (let index = 0; index < clean.length; index += 1) {
    const two = lettersAt(clean, index, 2);
    const three = lettersAt(clean, index, 3);
    const vowelRun = previousVowelRun(clean, index);
    const isWordStart = index === 0;
    const afterConsonant = clean[index + two.length] !== undefined && !/[aeiouäöüy]/u.test(clean[index + two.length]!);

    if (three === "sch") {
      hints.push(
        hint({
          id: `sch-${index}`,
          letters: three,
          at: index,
          ipa: ["ʃ"],
          family: "sch",
          deterministic: true,
          guidanceAr: "sch صوت واحد مثل الشين؛ لا تفصل الحروف الثلاثة ولا تبدلها بـس.",
        }),
      );
      index += 2;
      continue;
    }
    if (three === "tsch") {
      hints.push(
        hint({
          id: `tsch-${index}`,
          letters: three,
          at: index,
          ipa: ["tʃ"],
          family: "tsch",
          deterministic: true,
          guidanceAr: "tsch صوت مركّب واحد (ت+ش في نفس النبضة) كما في Deutsch.",
        }),
      );
      index += 2;
      continue;
    }
    if (two === "ch") {
      const back = BACK_VOWEL_LETTERS.some((letter) => vowelRun.includes(letter) && !/[äöü]/u.test(vowelRun));
      const front = FRONT_VOWEL_LETTERS.some((letter) => vowelRun.includes(letter));
      const liquid = /[rl]$/u.test(vowelRun);
      if (back) {
        hints.push(
          hint({
            id: `ach-${index}`,
            letters: two,
            at: index,
            ipa: ["x"],
            family: "ach-laut",
            deterministic: vowelRun.length > 0,
            guidanceAr: "بعد a أو o أو u يكون ch احتكاكًا خلفيًا [x] من أعلى الحلق، كما في Bach.",
          }),
        );
      } else if (front || liquid || vowelRun.length === 0) {
        hints.push(
          hint({
            id: `ich-${index}`,
            letters: two,
            at: index,
            ipa: ["ç"],
            family: "ich-laut",
            deterministic: front || liquid,
            guidanceAr: "بعد i أو e أو ä أو ö أو ü أو بعد l/r يكون ch وسط اللسان [ç] كما في ich، وليس شينًا.",
          }),
        );
      }
      index += 1;
      continue;
    }
    if ((two === "sp" || two === "st") && isWordStart) {
      hints.push(
        hint({
          id: `sp-st-${index}`,
          letters: two,
          at: index,
          ipa: two === "sp" ? ["ʃ", "p"] : ["ʃ", "t"],
          family: "sp-st-onset",
          deterministic: true,
          guidanceAr: `في بداية الكلمة تُنطق ${two} بشين قبلها: [ʃ${two[1]}]، مثل ${two === "sp" ? "sprechen" : "Stadt"}.`,
        }),
      );
      index += 1;
      continue;
    }
    if (clean[index] === "z") {
      hints.push(
        hint({
          id: `z-${index}`,
          letters: "z",
          at: index,
          ipa: ["ts"],
          family: "z-affricate",
          deterministic: true,
          guidanceAr: "z الألماني [ts] وليس زايًا: تاء قصيرة تتبعها سين بلا فاصل، مثل zwei.",
        }),
      );
      continue;
    }
    if (clean[index] === "ß") {
      hints.push(
        hint({
          id: `sharp-s-${index}`,
          letters: "ß",
          at: index,
          ipa: ["s"],
          family: "sharp-s",
          deterministic: true,
          guidanceAr: "ß سين مهموسة صرفة [s] بعد حركة طويلة، ولا تُنطق z.",
        }),
      );
      continue;
    }
    if (clean[index] === "v") {
      hints.push(
        hint({
          id: `v-${index}`,
          letters: "v",
          at: index,
          ipa: ["f"],
          family: "v",
          deterministic: true,
          guidanceAr: "v في بداية الكلمة الألمانية تُنطق [f] كما في Vater وvon.",
        }),
      );
      continue;
    }
    if (clean[index] === "w") {
      hints.push(
        hint({
          id: `w-${index}`,
          letters: "w",
          at: index,
          ipa: ["v"],
          family: "w",
          deterministic: true,
          guidanceAr: "w تُنطق [v] بالشفة والأسنان، مثل Wein — وليست واوًا.",
        }),
      );
      continue;
    }
    if (clean[index] === "qu") {
      hints.push(
        hint({
          id: `qu-${index}`,
          letters: "qu",
          at: index,
          ipa: ["k", "v"],
          family: "qu",
          deterministic: true,
          guidanceAr: "qu = [kv]: كاف يتبعها مباشرة صوت [v] بالشفة والأسنان، مثل Quelle.",
        }),
      );
      index += 1;
      continue;
    }
    if (/[äöü]/u.test(clean[index]!)) {
      const letter = clean[index]!;
      const long = lettersAt(clean, index + 1, 1) === "h" || lettersAt(clean, index, 2) === `${letter}${letter}`;
      hints.push(
        hint({
          id: `umlaut-${index}`,
          letters: letter,
          at: index,
          ipa: letter === "ä" ? ["ɛ"] : letter === "ö" ? ["œ"] : ["ʏ"],
          family: "umlaut",
          deterministic: true,
          guidanceAr:
            letter === "ä"
              ? "ä حركة أمامية مفتوحة [ɛ]، لا a خالصة."
              : letter === "ö"
                ? "ö = شفتان مستديرتان مثل o لكن اللسان أمامي كما في e. لا تبدلها بـo."
                : "ü = شفتان مستديرتان مثل u لكن اللسان أمامي كما في i. لا تبدلها بـu.",
        }),
      );
      if (long) {
        hints.push(
          hint({
            id: `length-${index}`,
            letters: lettersAt(clean, index, 2),
            at: index,
            ipa: ["ː"],
            family: "vowel-length",
            deterministic: true,
            guidanceAr: "النقطتان مع h بعدها تعنيان مدًّا: الحركة طويلة، والمد جزء من الكلمة لا زينة.",
          }),
        );
      }
      continue;
    }
    if (lettersAt(clean, index, 2) === "ie") {
      hints.push(
        hint({
          id: `ie-${index}`,
          letters: "ie",
          at: index,
          ipa: ["iː"],
          family: "vowel-length",
          deterministic: afterConsonant || clean.length === index + 2,
          guidanceAr: "ie حركة طويلة واحدة [iː] كما في Liebe، ولا تُنقطع مقطعين.",
        }),
      );
      index += 1;
      continue;
    }
    if (/[aeiou]/u.test(clean[index]!) && lettersAt(clean, index + 1, 1) === "h" && clean[index + 2] !== undefined && !/[aeiouäöü]/u.test(clean[index + 2]!)) {
      hints.push(
        hint({
          id: `dehnungs-h-${index}`,
          letters: lettersAt(clean, index, 2),
          at: index,
          ipa: [clean[index]!, "ː"],
          family: "silent-h",
          deterministic: true,
          guidanceAr: "h هنا لا يُنطق: وظيفتها مدّ الحركة قبلها، مثل Uhr وfahren.",
        }),
      );
      index += 1;
      continue;
    }
    if (/[aeiouäöü]/u.test(clean[index]!) && lettersAt(clean, index + 1, 2)[0] === lettersAt(clean, index + 1, 2)[1] && lettersAt(clean, index + 1, 2).length === 2 && /[bdfgklmnprt]/u.test(clean[index + 1]!)) {
      hints.push(
        hint({
          id: `closed-${index}`,
          letters: lettersAt(clean, index, 3),
          at: index,
          ipa: ["ɪ̆"],
          family: "vowel-length",
          deterministic: true,
          guidanceAr: "الحرف المكرر بعد الحركة يجعلها قصيرة ومقطوعة: لا تمدّها.",
        }),
      );
    }
  }

  const finalLetter = clean.at(-1);
  if (finalLetter === "d") {
    hints.push(
      hint({
        id: "auslaut-d",
        letters: "d",
        at: clean.length - 1,
        ipa: ["t"],
        family: "final-devoicing",
        deterministic: true,
        guidanceAr: "في نهاية الكلمة يُنطق d مثل [t] (Auslautverhärtung): Rad تُسمع مثل Rat.",
      }),
    );
  }
  if (finalLetter === "b") {
    hints.push(
      hint({
        id: "auslaut-b",
        letters: "b",
        at: clean.length - 1,
        ipa: ["p"],
        family: "final-devoicing",
        deterministic: true,
        guidanceAr: "في نهاية الكلمة يُنطق b مثل [p] بلا جهر، مثل ab وJob.",
      }),
    );
  }
  if (finalLetter === "g") {
    hints.push(
      hint({
        id: "auslaut-g",
        letters: "g",
        at: clean.length - 1,
        ipa: ["k"],
        family: "final-devoicing",
        deterministic: true,
        guidanceAr: "في نهاية الكلمة يُنطق g مثل [k]، مثل Berg.",
      }),
    );
  }
  if (clean.endsWith("ig")) {
    hints.push(
      hint({
        id: "suffix-ig",
        letters: "ig",
        at: Math.max(0, clean.length - 2),
        ipa: ["ɪ", "ç"],
        family: "suffix-ig",
        deterministic: true,
        guidanceAr: "اللاحقة -ig تُنطق [ɪç] مثل richtig، وليست [ɪk].",
      }),
    );
  }
  if (/[^aeiouäöü]en$/u.test(clean)) {
    hints.push(
      hint({
        id: "syllabic-n",
        letters: "en",
        at: Math.max(0, clean.length - 2),
        ipa: ["n̩"],
        family: "syllabic-n",
        deterministic: false,
        guidanceAr: "في النهاية لا تُضاف حركة كاملة قبل n: المقطع يبقى خفيفًا مثل [ˈʃpʁɛçn̩].",
      }),
    );
  }

  return hints;
}

/** Contrast families the owner asked to prioritise, mapped to the hint ids. */
export const PRIORITY_HINT_FAMILIES = [
  "umlaut",
  "vowel-length",
  "ich-laut",
  "ach-laut",
  "sp-st-onset",
  "z-affricate",
  "final-devoicing",
  "suffix-ig",
  "silent-h",
  "sch",
] as const;

export type PriorityHintFamily = (typeof PRIORITY_HINT_FAMILIES)[number];

export function priorityHints(hints: SpellingHint[]): SpellingHint[] {
  return hints.filter((hintEntry) => (PRIORITY_HINT_FAMILIES as readonly string[]).includes(hintEntry.family));
}
