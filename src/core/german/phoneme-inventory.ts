/**
 * Authoritative phoneme inventory for the deterministic German transducer.
 *
 * Every symbol here is chosen so that the G2P engine can reproduce the human
 * authored IPA already published in
 * `src/data/arabic-learner-pronunciation-inventory.ts`. The inventory is
 * therefore checked against that authored ground truth by unit tests, not
 * invented alongside it.
 */

export const GERMAN_PHONEME_INVENTORY_POLICY = "german-phoneme-inventory-v1" as const;

export type PhonemeClass =
  | "stop"
  | "affricate"
  | "fricative"
  | "nasal"
  | "lateral"
  | "rhotic"
  | "glide"
  | "front-round-vowel"
  | "front-vowel"
  | "central-vowel"
  | "back-vowel"
  | "diphthong";

export type GermanPhoneme = {
  /** IPA symbol without a length mark. */
  base: string;
  /** Whether this phoneme can carry a German long/short contrast. */
  lengthful: boolean;
  class: PhonemeClass;
  voiced: boolean;
};

/**
 * Stops, affricates, and fricatives. `p t k b d ɡ` plus the two German
 * affricates `ts pf`. Auslautverhärtung maps `b d ɡ v` to `p t k f` word
 * finally, so the voicing flag is what the alignment cost model relies on.
 */
const consonants: GermanPhoneme[] = [
  { base: "p", lengthful: false, class: "stop", voiced: false },
  { base: "t", lengthful: false, class: "stop", voiced: false },
  { base: "k", lengthful: false, class: "stop", voiced: false },
  { base: "b", lengthful: false, class: "stop", voiced: true },
  { base: "d", lengthful: false, class: "stop", voiced: true },
  { base: "ɡ", lengthful: false, class: "stop", voiced: true },
  { base: "ʔ", lengthful: false, class: "stop", voiced: false },
  { base: "ts", lengthful: false, class: "affricate", voiced: false },
  { base: "pf", lengthful: false, class: "affricate", voiced: false },
  { base: "f", lengthful: false, class: "fricative", voiced: false },
  { base: "v", lengthful: false, class: "fricative", voiced: true },
  { base: "s", lengthful: false, class: "fricative", voiced: false },
  { base: "z", lengthful: false, class: "fricative", voiced: true },
  { base: "ʃ", lengthful: false, class: "fricative", voiced: false },
  { base: "ʒ", lengthful: false, class: "fricative", voiced: true },
  { base: "ç", lengthful: false, class: "fricative", voiced: false },
  { base: "x", lengthful: false, class: "fricative", voiced: false },
  { base: "h", lengthful: false, class: "fricative", voiced: false },
  { base: "m", lengthful: false, class: "nasal", voiced: true },
  { base: "n", lengthful: false, class: "nasal", voiced: true },
  { base: "ŋ", lengthful: false, class: "nasal", voiced: true },
  // Syllabic consonants appear in the authored curriculum IPA (`offen`
  // [ˈɔfn̩], `sprechen` [ˈʃpʁɛçn̩]); they are nuclei, not a vowel plus a nasal.
  { base: "n̩", lengthful: false, class: "nasal", voiced: true },
  { base: "m̩", lengthful: false, class: "nasal", voiced: true },
  { base: "l̩", lengthful: false, class: "lateral", voiced: true },
  { base: "l", lengthful: false, class: "lateral", voiced: true },
  { base: "ʁ", lengthful: false, class: "rhotic", voiced: true },
  { base: "ʀ", lengthful: false, class: "rhotic", voiced: true },
  // The uvular and alveolar trill are both attested in the authored rows
  // (`rot` is published as [ʁoːt] and as [roːt]), so both belong in the
  // inventory rather than being reported as unknown symbols.
  { base: "r", lengthful: false, class: "rhotic", voiced: true },
  { base: "j", lengthful: false, class: "glide", voiced: true },
];

const vowels: GermanPhoneme[] = [
  { base: "a", lengthful: true, class: "central-vowel", voiced: true },
  { base: "ɛ", lengthful: true, class: "front-vowel", voiced: true },
  { base: "e", lengthful: true, class: "front-vowel", voiced: true },
  { base: "ɪ", lengthful: true, class: "front-vowel", voiced: true },
  { base: "i", lengthful: true, class: "front-vowel", voiced: true },
  { base: "ɔ", lengthful: true, class: "back-vowel", voiced: true },
  { base: "o", lengthful: true, class: "back-vowel", voiced: true },
  { base: "ʊ", lengthful: true, class: "back-vowel", voiced: true },
  { base: "u", lengthful: true, class: "back-vowel", voiced: true },
  { base: "ø", lengthful: true, class: "front-round-vowel", voiced: true },
  { base: "œ", lengthful: true, class: "front-round-vowel", voiced: true },
  // The short close front rounded vowel is what the priority `u/ü` contrast
  // actually contains in the authored curriculum ([fʏnf], [ˈkʏçə], [ˈœfnən]
  // style rows), so it cannot be an "unknown symbol" in our own inventory.
  { base: "ʏ", lengthful: false, class: "front-round-vowel", voiced: true },
  // The voiceless affricate of `Deutsch`/`nichts` is a single phoneme; without
  // a row here it would be reported as an unrecognised symbol.
  { base: "tʃ", lengthful: false, class: "affricate", voiced: false },
  { base: "y", lengthful: true, class: "front-round-vowel", voiced: true },
  { base: "ə", lengthful: false, class: "central-vowel", voiced: true },
  { base: "ɐ", lengthful: false, class: "central-vowel", voiced: true },
  // Vocalized coda r after a long vowel, published as [tyːɐ̯] and [uːɐ̯].
  { base: "ɐ̯", lengthful: false, class: "central-vowel", voiced: true },
];

const diphthongs: GermanPhoneme[] = [
  { base: "aɪ̯", lengthful: false, class: "diphthong", voiced: true },
  { base: "aʊ̯", lengthful: false, class: "diphthong", voiced: true },
  { base: "ɔʏ̯", lengthful: false, class: "diphthong", voiced: true },
];

export const germanPhonemes: GermanPhoneme[] = [...consonants, ...vowels, ...diphthongs];

const phonemeByBase = new Map(germanPhonemes.map((phoneme) => [phoneme.base, phoneme]));

export function phonemeInfo(symbol: string): GermanPhoneme | undefined {
  return phonemeByBase.get(symbol.replace("ː", ""));
}

export function isVowelSymbol(symbol: string): boolean {
  const info = phonemeInfo(symbol);
  return Boolean(info && (info.class.includes("vowel") || info.class === "diphthong"));
}

export function isLengthful(symbol: string): boolean {
  return phonemeInfo(symbol)?.lengthful === true;
}

/**
 * Length is a separate axis: the aligner compares the `ː` mark itself, so the
 * long/short pairs are listed as notes rather than as substitutions.
 */
export const vowelLengthContrasts: { id: string; base: string; inventoryRowId: string | null; noteAr: string }[] = [
  { id: "length-a", base: "a", inventoryRowId: "ar-pron-vowel-length-a", noteAr: "«Stadt» و«Staat» — المد وحده يغيّر الكلمة." },
  { id: "length-ɛ", base: "ɛ", inventoryRowId: "ar-pron-final-devoicing", noteAr: "طول الحركة في «Räder» مقابل القصر في صور أخرى." },
  { id: "length-o", base: "o", inventoryRowId: "ar-pron-vowel-open-o", noteAr: "«offen» بقصر وانفتاح مقابل «Ofen» بطول." },
  { id: "length-u", base: "u", inventoryRowId: "ar-pron-y-u", noteAr: "الطول في «Tür» و«Tour» جزء من الكلمة لا زينة." },
];

/**
 * Arabic-learner confusion classes. Each entry names the two phonemes a
 * learner may substitute for each other, and carries the exact inventory row
 * from `arabic-learner-pronunciation-inventory.ts` that justifies it, so the
 * cost model is bound to authored material rather than to a stereotype.
 */
export type PhonemeConfusion = {
  id: string;
  left: string;
  right: string;
  kind: "voicing" | "place" | "rounding" | "length" | "devoicing" | "affrication" | "rhotic-variant";
  /** Substituting this pair changes a word, so alignment must treat it as severe. */
  meaningChanging: boolean;
  inventoryRowId: string | null;
  noteAr: string;
};

export const phonemeConfusions: PhonemeConfusion[] = [
  { id: "p-b", left: "p", right: "b", kind: "voicing", meaningChanging: true, inventoryRowId: "ar-pron-p-b", noteAr: "الفرق هو الجهر فقط؛ «Pack» و«Back» كلمتان مختلفتان." },
  { id: "f-v", left: "f", right: "v", kind: "voicing", meaningChanging: true, inventoryRowId: "ar-pron-f-v", noteAr: "«fein» و«Wein» يفترقان بجهر الشفتين." },
  { id: "t-d", left: "t", right: "d", kind: "voicing", meaningChanging: true, inventoryRowId: null, noteAr: "الجهر يغيّر الكلمة، وهو نفس الفرق الذي يظهر في نهاية الكلمة الألمانية." },
  { id: "k-ɡ", left: "k", right: "ɡ", kind: "voicing", meaningChanging: true, inventoryRowId: null, noteAr: "الطاء والكاف المهموسة مقابل المجهورة تغيّر المعنى." },
  { id: "s-z", left: "s", right: "z", kind: "voicing", meaningChanging: true, inventoryRowId: "ar-pron-ts-z", noteAr: "«seit» يبدأ بـ[z] المجهورة، بينما «Zeit» تبدأ بـ[ts] المهموسة." },
  { id: "ts-s", left: "ts", right: "s", kind: "affrication", meaningChanging: true, inventoryRowId: "ar-pron-ts-z", noteAr: "مرحلة الإغلاق القصيرة في [ts] جزء من الكلمة، ليست حلية." },
  { id: "pf-f", left: "pf", right: "f", kind: "affrication", meaningChanging: true, inventoryRowId: "ar-pron-pf-f", noteAr: "اختصار [pf] إلى [f] يحوّل «Pfund» إلى «Fund»." },
  { id: "ʃ-ç", left: "ʃ", right: "ç", kind: "place", meaningChanging: true, inventoryRowId: "ar-pron-ich-sch", noteAr: "«Kirche» و«Kirsche» تختلفان بموضع الاحتكاك فقط." },
  { id: "s-ç", left: "s", right: "ç", kind: "place", meaningChanging: true, inventoryRowId: "ar-pron-ich-s", noteAr: "«Licht» و«List» تفترقان بين وسط الفم والأسنان." },
  { id: "x-ç", left: "x", right: "ç", kind: "place", meaningChanging: false, inventoryRowId: "ar-pron-ach-ch", noteAr: "الاختلاف هنا سياقي بعد الحركات؛ لا يغيّر المعنى وحده لكنه علامة طبيعية." },
  { id: "u-y", left: "u", right: "y", kind: "rounding", meaningChanging: true, inventoryRowId: "ar-pron-y-u", noteAr: "«Tür» و«Tour» — اللسان أمامي مع تدوير الشفتين." },
  { id: "o-ø", left: "o", right: "ø", kind: "rounding", meaningChanging: true, inventoryRowId: "ar-pron-oe-o", noteAr: "«schon» و«schön» — الفرق تقدّم اللسان مع بقاء التدوير." },
  { id: "ɔ-o", left: "ɔ", right: "o", kind: "length", meaningChanging: true, inventoryRowId: "ar-pron-vowel-open-o", noteAr: "الانفتاح مقابل الطول في «offen» و«Ofen»." },
  { id: "ʊ-u", left: "ʊ", right: "u", kind: "length", meaningChanging: true, inventoryRowId: "ar-pron-vowel-open-o", noteAr: "القصر والانفتاح يصنعان فرق «offen» مقابل «Ofen»." },
  { id: "ʁ-ʀ", left: "ʁ", right: "ʀ", kind: "rhotic-variant", meaningChanging: false, inventoryRowId: "ar-pron-r-variants", noteAr: "تنويعان ألمانيان مقبولان للراء؛ لا يُعدّ أحدهما خطأ." },
  { id: "d-t-final", left: "d", right: "t", kind: "devoicing", meaningChanging: false, inventoryRowId: "ar-pron-final-devoicing", noteAr: "نزع الجهر في النهاية هو النطق القياسي لـ«Rad»." },
];

const confusionPairs = new Set(
  phonemeConfusions.flatMap((confusion) => [
    `${confusion.left}|${confusion.right}`,
    `${confusion.right}|${confusion.left}`,
  ]),
);

const severePairs = new Set(
  phonemeConfusions
    .filter((confusion) => confusion.meaningChanging)
    .flatMap((confusion) => [
      `${confusion.left}|${confusion.right}`,
      `${confusion.right}|${confusion.left}`,
    ]),
);

export function isKnownConfusion(left: string, right: string): boolean {
  return confusionPairs.has(`${left}|${right}`);
}

export function isMeaningChangingConfusion(left: string, right: string): boolean {
  return severePairs.has(`${left}|${right}`);
}

export function confusionFor(left: string, right: string): PhonemeConfusion | undefined {
  return phonemeConfusions.find(
    (confusion) =>
      (confusion.left === left && confusion.right === right) ||
      (confusion.left === right && confusion.right === left),
  );
}
