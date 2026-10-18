/**
 * Curriculum lemmatizer (ADR-126, P2-401).
 *
 * Measures lexical load. It is not a general German morphology engine. It maps a folded word
 * form (ä→ae, ö→oe, ü→ue, ß→ss, lower case) to the citation forms it could belong to:
 *
 * 1. an authored irregular-form dictionary (strong and mixed verbs, modal verbs, umlaut
 *    plurals, irregular comparatives), passed in by the caller;
 * 2. conservative regular rules: weak present and preterite endings, ge- participles with
 *    an optional separable prefix, zu-infinitives, -innen plurals, and adjective or noun
 *    endings.
 *
 * Every rule only proposes candidates. A word counts as supported only when one of its
 * candidates is also a candidate of a word the learner has already met. The audits report this
 * as curricular exposure, never as proof that the learner knows the word.
 */

export const GERMAN_LEMMATIZER_POLICY = "german-curriculum-lemmatizer-v1" as const;

export function foldGerman(value: string): string {
  return String(value ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    // Other accents (Café, Señor) lose only their mark, not the letter.
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ");
}

/** Separable and inseparable-style prefixes that can sit before -ge- or -zu-. */
export const GERMAN_VERB_PREFIXES = [
  "zurueck", "zusammen", "vorbei", "weiter", "wieder", "heraus", "herein", "hinaus", "voran", "vorweg",
  "nach", "fest", "frei", "hoch", "statt", "teil", "fern", "ueber", "unter", "durch", "um", "los", "weg",
  "dar", "ein", "aus", "auf", "mit", "vor", "bei", "ab", "an", "zu", "her", "hin", "",
] as const;

export const INSEPARABLE_PREFIXES = ["be", "emp", "ent", "er", "ge", "miss", "ver", "zer", "hinter", "ueber", "unter", "wider"] as const;

export type LemmaDictionary = ReadonlyMap<string, readonly string[]>;

/** Builds a folded lookup from authored entries written in normal German spelling. */
export function buildLemmaDictionary(entries: Iterable<readonly [form: string, lemma: string]>): LemmaDictionary {
  const map = new Map<string, string[]>();
  for (const [form, lemma] of entries) {
    const key = foldGerman(form).trim();
    const value = foldGerman(lemma).trim();
    if (!key || !value || key.includes(" ") || value.includes(" ")) throw new Error(`Lemma entry must be one word: ${form} → ${lemma}`);
    const list = map.get(key) ?? [];
    if (!list.includes(value)) list.push(value);
    map.set(key, list);
  }
  return map;
}

const MIN_BASE = 3;

/** All candidate citation forms for one folded token, including the token itself. */
export function lemmaCandidates(word: string, dictionary: LemmaDictionary): string[] {
  const out = new Set<string>([word]);
  const add = (value: string) => { if (value.length >= MIN_BASE + 1) out.add(value); };
  for (const lemma of dictionary.get(word) ?? []) out.add(lemma);

  // Participle II: (prefix)ge + base + (e)t | en → (prefix) base en
  for (const prefix of GERMAN_VERB_PREFIXES) {
    if (!word.startsWith(`${prefix}ge`)) continue;
    const rest = word.slice(prefix.length + 2);
    for (const ending of ["et", "t", "en"]) {
      if (rest.endsWith(ending) && rest.length - ending.length >= MIN_BASE) add(`${prefix}${rest.slice(0, -ending.length)}en`);
    }
    // An inflected participle used as an adjective: geschlossene, gebuchten …
    for (const ending of ["ete", "eten", "etem", "eter", "etes", "te", "ten", "tem", "ter", "tes", "ene", "enen", "enem", "ener", "enes"]) {
      if (rest.endsWith(ending) && rest.length - ending.length >= MIN_BASE) add(`${prefix}${rest.slice(0, -ending.length)}en`);
    }
  }
  // zu-infinitive with a separable prefix: anzumelden → anmelden
  for (const prefix of GERMAN_VERB_PREFIXES) {
    if (!prefix || !word.startsWith(`${prefix}zu`)) continue;
    const rest = word.slice(prefix.length + 2);
    if (rest.endsWith("en") && rest.length >= MIN_BASE + 2) add(`${prefix}${rest}`);
  }
  // Weak preterite and present endings → infinitive
  for (const ending of ["eten", "etet", "etest", "ete", "test", "ten", "tet", "te", "est", "st", "et", "t", "e"]) {
    if (word.endsWith(ending) && word.length - ending.length >= MIN_BASE) {
      const base = word.slice(0, -ending.length);
      add(`${base}en`);
      if (base.endsWith("el") || base.endsWith("er")) add(`${base}n`);
    }
  }
  // Feminine -in / -innen and noun or adjective endings
  if (word.endsWith("innen") && word.length > 7) add(word.slice(0, -3));
  for (const ending of ["sten", "ster", "stem", "stes", "ste", "ern", "en", "em", "er", "es", "e", "n", "s"]) {
    if (word.endsWith(ending) && word.length - ending.length >= MIN_BASE) add(word.slice(0, -ending.length));
  }
  // Second pass on every candidate so far:
  //  - a dictionary hit after stripping an ending: büchern → bücher → buch;
  //  - a compound or prefixed form whose tail is a dictionary form (≥ 4 letters):
  //    arbeitsplätze → arbeits + platz, verstand → ver + stehen, anrief → an + rufen;
  //  - an inseparable-prefix participle without ge-: verstanden → (ge)standen → verstehen.
  for (const candidate of [...out]) {
    for (const lemma of dictionary.get(candidate) ?? []) out.add(lemma);
    for (let index = 2; index <= candidate.length - 4; index += 1) {
      const head = candidate.slice(0, index);
      const tail = candidate.slice(index);
      for (const lemma of dictionary.get(tail) ?? []) add(`${head}${lemma}`);
      if ((INSEPARABLE_PREFIXES as readonly string[]).includes(head)) for (const lemma of dictionary.get(`ge${tail}`) ?? []) add(`${head}${lemma}`);
    }
  }
  return [...out];
}

/**
 * The keys both sides are compared on: the exact candidates, plus the audit's legacy stem of the
 * surface word, so nothing the old measurement matched is lost. Candidates are not stemmed
 * again: stemming a stripped candidate (schluss → schlus → schl) would collide with unrelated
 * short words (schlug).
 */
export function lemmaKeys(word: string, dictionary: LemmaDictionary, stem: (value: string) => string): string[] {
  return [...new Set([...lemmaCandidates(word, dictionary), `~${stem(word)}`])];
}
