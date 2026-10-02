/**
 * `german-grammar-signals-v1` — the local deterministic writing checker.
 *
 * This is the primary teacher in the free-writing lane: it runs offline, costs
 * nothing, and every finding points at an exact excerpt of the learner's own
 * text. Three properties are deliberate:
 *
 * 1. `unresolved` is first-class. When the local engine cannot decide, it says
 *    so, and that list is what the optional Gemini lane is asked about. Silence
 *    is never presented as correctness.
 * 2. `proven` findings are produced only where spelling plus the authored
 *    curriculum lexicon decide the matter: a taught noun with a known gender,
 *    a preposition that always governs one case, a verb form in the conjugation
 *    table, or a clause that runs to the sentence end.
 * 3. Precision is measured, not claimed: the unit test runs every authored
 *    model answer in the curriculum through these rules and requires zero
 *    `proven` findings, because a false correction is worse than no correction.
 */

import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";

export const GERMAN_GRAMMAR_SIGNALS_POLICY = "german-grammar-signals-v1" as const;
export const GERMAN_GRAMMAR_SIGNALS_BOUNDARY =
  "local-deterministic-signals-with-explicit-unresolved-channel-no-error-free-claim-no-official-rule-verification" as const;

export type GrammarSignalId =
  | "subordinate-verb-final"
  | "comma-before-subordinate-conjunction"
  | "noun-capitalization"
  | "article-case-after-preposition"
  | "modal-plus-zu-infinitive"
  | "separable-prefix-position"
  | "w-question-verb-second"
  | "inversion-after-adverbial"
  | "dass-vs-das";

export type GrammarSignalFamily = "word-order" | "morphology" | "orthography" | "case" | "punctuation";

export type GrammarSignalFinding = {
  key: string;
  signalId: GrammarSignalId;
  family: GrammarSignalFamily;
  /** `proven` = spelling plus the authored lexicon decides it. */
  certainty: "proven" | "probable";
  /** Verbatim slice of the learner text, so grounding can be re-verified. */
  excerpt: string;
  suggestionDe: string | null;
  explanationAr: string;
  ruleSource: "authored-lesson-lexicon" | "authored-verb-frames" | "authored-detector-table";
  detector: "deterministic-local-pattern";
};

export type GrammarSignalUnresolved = {
  key: string;
  excerpt: string;
  reasonAr: string;
  kind: "unknown-verb-form" | "adjective-inflection" | "nested-clause" | "meaning-ambiguity";
};

export type GrammarSignalReport = {
  policyVersion: typeof GERMAN_GRAMMAR_SIGNALS_POLICY;
  findings: GrammarSignalFinding[];
  unresolved: GrammarSignalUnresolved[];
  coverage: {
    sentences: number;
    settledSentences: number;
    words: number;
    lexiconNouns: number;
    verbFrames: number;
  };
  /** Fixed false: a pattern list can never certify a text as correct. */
  canClaimErrorFree: false;
  /** The rule list is authored here, not certified against a printed grammar. */
  authority: "authored-local-detectors-unverified-against-official-reference";
  boundary: typeof GERMAN_GRAMMAR_SIGNALS_BOUNDARY;
};

type GermanCase = "nominative" | "accusative" | "dative";
type Gender = "masculine" | "feminine" | "neuter" | "plural-only";

/** Only prepositions that always govern one case are checked. */
const ALWAYS_DATIVE = new Set(["aus", "bei", "mit", "nach", "seit", "von", "zu"]);
const ALWAYS_ACCUSATIVE = new Set(["für", "ohne", "gegen", "um", "durch"]);
/** Two-way prepositions take dative for place and accusative for direction. */
const WECHSEL_PREPOSITIONS = new Set(["in", "an", "auf", "über", "unter", "vor", "hinter", "neben", "zwischen"]);

/**
 * Definite article that is correct for a case and a gender. Built from the same
 * authored table the curriculum lessons teach, so a mismatch is decidable.
 */
const DEFINITE_ARTICLE: Record<GermanCase, Record<Gender, string>> = {
  nominative: { masculine: "der", feminine: "die", neuter: "das", "plural-only": "die" },
  accusative: { masculine: "den", feminine: "die", neuter: "das", "plural-only": "die" },
  dative: { masculine: "dem", feminine: "der", neuter: "dem", "plural-only": "den" },
};
const ALL_DEFINITE_ARTICLES = new Set(Object.values(DEFINITE_ARTICLE).flatMap((row) => Object.values(row)));

const SUBORDINATE_CONJUNCTIONS = [
  "weil", "dass", "obwohl", "wenn", "ob", "indem", "bevor", "nachdem", "seitdem", "falls",
];
const SUBJECT_PRONOUNS = ["ich", "du", "er", "sie", "es", "wir", "ihr", "Sie"];
const FINITE_VERB_FORMS = new Set(
  `bin bist ist sind seid war warst waren wäre würde würden
   habe hast hat haben habt hatte hatten
   werde wirst wird werden wurde wurden
   kann kannst können könnt konnte konnten
   muss musst müssen müsst musste mussten
   soll sollst sollen sollt sollte sollten
   will willst wollen wollt wollte wollten
   darf darfst dürfen dürft durfte durften
   möchte möchtest möchten möchtet
   komme kommst kommt kommen kam kamen
   wohne wohnst wohnt wohnen wohnte
   lerne lernst lernt lernen lernte
   arbeite arbeitest arbeitet arbeiten arbeitete
   spreche sprichst spricht sprechen sprach
   mache machst macht machen machte
   gehe gehst geht gehen ging
   fahre fährst fährt fahren fuhr
   heiße heißt heißen
   sehe siehst sieht sehen sah
   esse isst esst essen aß
   trinke trinkst trinkt trinken
   kaufe kaufst kauft kaufen
   spiele spielst spielt spielen
   höre hörst hört hören
   lese liest lest lesen
   schreibe schreibst schreibt schreiben
   suche suchst sucht suchen
   brauche brauchst braucht brauchen
   finde findest findet finden
   denke denkst denkt denken
   glaube glaubst glauben
   treffe triffst trifft treffen
   bestelle bestellst bestellt bestellen
   bezahle bezahlst bezahlt bezahlen
   besuche besuchst besucht besuchen
   bleibe bleibst bleibt bleiben
   hole holst holt holen
   bringe bringst bringt bringen
   zeige zeigst zeigt zeigen
   rufe rufst ruft rufen
   stehe stehst steht stehen
   laufe läufst läuft laufen
   frage fragst fragt fragen
   antworte antwortest antwortet antworten
   brauche`
    .split(/\s+/u)
    .filter(Boolean),
);
const KNOWN_INFINITIVES = new Set(
  `kommen gehen machen lernen arbeiten sprechen wohnen sehen essen trinken kaufen
   bestellen bezahlen fahren bleiben spielen hören lesen schreiben anfangen
   einkaufen anrufen aufstehen fernsehen mitkommen einziehen treffen besuchen
   vorbereiten mitbringen abholen aufräumen anmelden einladen funktionieren
   interessieren gefallen brauchen dauern kosten heißen heißen`
    .split(/\s+/u),
);
const INFINITIVES_FROM_FRAMES = new Set(
  verbPrepositionFrames.map((frame) => frame.infinitive.toLocaleLowerCase("de-DE")),
);
const SEPARABLE_VERBS = [
  "aufstehen", "anrufen", "einkaufen", "fernsehen", "mitkommen", "anfangen", "einziehen",
  "aufwachen", "abfahren", "ankommen", "aussteigen", "einsteigen", "vorstellen",
  "mitbringen", "abholen", "aufräumen", "anmelden", "einladen", "mitnehmen", "vorlesen",
];
const SEPARABLE_PREFIXES = ["auf", "an", "aus", "ein", "mit", "vor", "nach", "ab", "fern", "los", "heim", "zu"];
/**
 * Builds the glued surface forms a learner produces for a separable verb, e.g.
 * `aufstehen` → `auf(stehen|stehe|stehst|steht|…)`. Irregular verbs are flagged
 * so no wrong conjugation is ever suggested for `du/er/sie/es`.
 */
const IRREGULAR_STEM_CHANGE = new Set(["anfangen", "abfahren", "fernsehen", "mitnehmen", "vorlesen", "einschlafen"]);

function separableForms(verb: string): { pattern: string; prefix: string; base: string; irregular: boolean } | null {
  const prefix = SEPARABLE_PREFIXES.find((candidate) => verb.startsWith(candidate) && verb.length > candidate.length + 3);
  if (!prefix) return null;
  const base = verb.slice(prefix.length).replace(/en$/u, "");
  if (base.length < 2) return null;
  const endings = [`${base}en`, `${base}e`, `${base}st`, `${base}t`, `${base}est`, `${base}et`, base];
  const forms = [...new Set(endings)].sort((a, b) => b.length - a.length);
  return {
    pattern: `${prefix}(${forms.join("|")})`,
    prefix,
    base,
    irregular: IRREGULAR_STEM_CHANGE.has(verb),
  };
}

const SEPARABLE_PATTERNS = SEPARABLE_VERBS.map((verb) => ({ verb, ...separableForms(verb)! })).filter((entry) => Boolean(entry.pattern));

const ADVERBIAL_OPENERS = [
  "heute", "morgen", "gestern", "jetzt", "dann", "danach", "zuerst", "später", "vielleicht",
  "leider", "natürlich", "hoffentlich", "gerne", "deshalb", "trotzdem", "außerdem", "anschließend",
];
const W_WORDS = ["wie", "wo", "woher", "wohin", "was", "wer", "wann", "warum", "wieso", "welche", "welcher", "welches", "wem", "wen"];
const ADJECTIVES = new Set(
  `gut gute guten neu neue neuen alt alte alten klein kleine kleinen groß große großen
   billig billige teuer teure schön schöne wichtig wichtige erste letzten nächste beste
   deutsch deutsche tunesisch tunesische viele vielen mehrere eigene eigene klare klare
   sicher sichere möglich mögliche notwendig notwendige aktuell aktuelle`
    .split(/\s+/u),
);
const DETERMINERS = new Set([
  ...ALL_DEFINITE_ARTICLES,
  "ein", "eine", "einen", "einem", "einer", "eines",
  "kein", "keine", "keinen", "keinem", "keiner",
  "mein", "meine", "meinen", "meinem", "meiner",
  "dein", "deine", "deinen", "deinem", "deiner",
  "sein", "seine", "seinen", "seinem", "seiner",
  "ihr", "ihre", "ihren", "ihrem", "ihrer",
  "unser", "unsere", "euer", "eure",
  "dieser", "diese", "dieses", "diesen", "diesem", "derer",
  "jeder", "jede", "jedes", "welcher", "welche", "welches",
]);

/**
 * Infinitives are excluded: `Heute ich lernen Deutsch` must not be "corrected"
 * to a wrong conjugation, and `Wo Sie arbeiten?` is already checked by the
 * personal-ending detector. Only genuinely conjugated forms count here.
 */
const FINITE_ONLY = new Set(
  [...FINITE_VERB_FORMS].filter(
    (form) => !KNOWN_INFINITIVES.has(form) && !INFINITIVES_FROM_FRAMES.has(form) && !/^(?:kommen|gehen|machen|lernen|arbeiten|sprechen|wohnen|sehen|essen|trinken|kaufen|bestellen|bezahlen|bleiben|spielen|hören|lesen|schreiben|besuchen|brauchen|glauben|denken|finden|suchen|holen|bringen|zeigen|rufen|stehen|fahren|laufen|fragen|antworten|heißen)$/u.test(form),
  ),
);

const nounByLemma = new Map<string, (typeof nounGrammarEntries)[number]>();
for (const entry of nounGrammarEntries) {
  const key = entry.lemma.toLocaleLowerCase("de-DE");
  if (!nounByLemma.has(key)) nounByLemma.set(key, entry);
}

/** Sorted once so the alternation is deterministic and compiled once per module. */
const VERB_ALTERNATION = [...FINITE_ONLY].sort((a, b) => b.length - a.length).join("|");
const SUBJUNCTION_ALTERNATION = [...SUBORDINATE_CONJUNCTIONS].sort((a, b) => b.length - a.length).join("|");
/** One clause per match: conjunction, subject, misplaced finite verb, tail. */
const SUBORDINATE_MISPLACED_VERB = new RegExp(
  `(^|[\\s,])(${SUBJUNCTION_ALTERNATION})\\s+(\\p{L}+)\\s+(${VERB_ALTERNATION})\\s+([^.!?]{1,70})(?=[.!?…]*\\s*$)`,
  "iu",
);
const COORDINATORS = /\b(?:und|aber|oder|denn|sondern)\b/iu;
const GLUED_SEPARABLE_VERB = new RegExp(
  `\\b(${SUBJECT_PRONOUNS.join("|")})\\s+(${SEPARABLE_PATTERNS.map((entry) => entry.pattern).join("|")})\\b`,
  "iu",
);
/** Multi-word conjunctions put the comma before the whole phrase, not before `dass`. */
const COMPLEX_CONJUNCTION_PRECEDERS = new Set([
  "ohne", "anstatt", "statt", "je", "selbst", "als", "und", "oder", "aber", "denn", "sondern", "bzw", "nämlich", "zumal",
]);
const DASS_VERSUS_DAS = /,[\s\u00A0]*das\s+\p{L}+(?:\s+\p{L}+){0,8}\s+(?:ist|sind|hat|haben|kommt|macht|funktioniert|klappt|beginnt|anfängt)\s*[.!?…]?$/iu;

function stripBidi(text: string): string {
  return text.replace(/[\u202A-\u202E\u2066-\u2069]/gu, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\-]/gu, "\\$&");
}

function cleanWord(token: string): string {
  return token.normalize("NFKC").replace(/[\p{P}\p{S}]/gu, "").toLocaleLowerCase("de-DE");
}

function splitSentences(text: string): string[] {
  return (stripBidi(text).match(/[^.!?…]+[.!?…]?/gu) ?? []).map((sentence) => sentence.trim()).filter(Boolean);
}

function tokensOf(sentence: string): { raw: string; clean: string; start: number }[] {
  const out: { raw: string; clean: string; start: number }[] = [];
  const pattern = /[\p{L}][\p{L}'’-]*/gu;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sentence)) !== null) {
    const clean = cleanWord(match[0]);
    if (clean) out.push({ raw: match[0], clean, start: match.index });
  }
  return out;
}

function isFiniteVerb(token: string | undefined): boolean {
  return token !== undefined && FINITE_ONLY.has(token);
}

/**
 * Any verb-shaped form, infinitives included. Word-order rules may fire on
 * these, but the suggestion is withheld when the form is not a conjugated one:
 * `Wie Sie heißen?` needs reordering only, while `Heute ich arbeiten nicht`
 * also needs a personal ending, and inventing one is not this engine's job.
 */
function isVerbLike(token: string | undefined): boolean {
  return token !== undefined && FINITE_VERB_FORMS.has(token);
}

function reorderIsComplete(verb: string | undefined, subject: string | undefined): boolean {
  // Reordering never conjugates anything, so it is safe to show. The one case it
  // would mislead is a form that cannot belong to this subject at all: with
  // `Heute ich arbeiten nicht` the permutation still says `arbeiten ich`, and
  // presenting that as the fix would imply the ending is already right. We
  // therefore withhold the suggestion instead of inventing `arbeite`, while
  // `Wie Sie heißen?` keeps it because -en is a valid form with `Sie`/`wir`/`sie`.
  if (!verb || !subject) return false;
  const v = verb.toLocaleLowerCase("de-DE");
  const s = subject.toLocaleLowerCase("de-DE");
  if (!v.endsWith("en")) return true;
  return s === "sie" || s === "wir";
}

function startsUppercase(token: string): boolean {
  const first = Array.from(token)[0] ?? "";
  return first !== "" && first === first.toLocaleUpperCase("de-DE") && first !== first.toLocaleLowerCase("de-DE");
}

function excerptAt(sentence: string, index: number, length: number): string {
  const start = Math.max(0, Math.min(sentence.length - 1, index));
  return sentence.slice(start, Math.min(sentence.length, start + length)).replace(/\s+/gu, " ").trim();
}

/** Conjugates a stripped verb base for the separable-verb suggestion. */
function conjugatePresent(subject: string, stem: string): string {
  const key = subject.toLocaleLowerCase("de-DE");
  if (key === "ich") return `${stem}e`;
  if (key === "du") return /[dt]$/u.test(stem) ? `${stem}est` : `${stem}st`;
  if (key === "er" || key === "sie" || key === "es") return /[dt]$/u.test(stem) ? `${stem}et` : `${stem}t`;
  if (key === "ihr") return `${stem}t`;
  return stem;
}

export type GrammarSignalInput = {
  text: string;
};

/** `Ich aufstehe um sieben Uhr.` → `Ich stehe um sieben Uhr auf.` */
function buildSeparableSuggestion(
  sentence: string,
  matchStart: number,
  matchLength: number,
  subject: string,
  conjugated: string,
  prefix: string,
): string {
  const tail = sentence.slice(matchStart + matchLength).replace(/\s+/gu, " ").trim();
  const terminator = (tail.match(/[.!?…]$/u) ?? [""])[0] ?? "";
  const middle = tail.replace(/[.!?…]+$/u, "").trim();
  return `${subject} ${conjugated}${middle ? ` ${middle}` : ""} ${prefix}${terminator}`.replace(/\s+/gu, " ").trim();
}

/** Runs every local rule. Order is stable, so the first finding is predictable. */
export function analyzeGermanGrammarSignals(input: GrammarSignalInput): GrammarSignalReport {
  const text = stripBidi(input.text).normalize("NFC").slice(0, 4000);
  const sentences = splitSentences(text).slice(0, 60);
  const findings: GrammarSignalFinding[] = [];
  const unresolved: GrammarSignalUnresolved[] = [];
  const seen = new Set<string>();
  let settledSentences = 0;

  const push = (candidate: Omit<GrammarSignalFinding, "detector">) => {
    const key = `${candidate.signalId}:${candidate.excerpt.toLocaleLowerCase("de-DE")}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ ...candidate, detector: "deterministic-local-pattern" });
  };

  for (const sentence of sentences) {
    const tokens = tokensOf(sentence);
    const lowerSentence = sentence.toLocaleLowerCase("de-DE");
    const subordinators = SUBORDINATE_CONJUNCTIONS.filter((conjunction) => new RegExp(`(^|[\\s,])${conjunction}\\b`, "u").test(lowerSentence));
    let settledThisSentence = false;

    // 1 — verb final in a subordinate clause. Anchored to the sentence end: a
    // finite verb sitting in second position with material after it that is not
    // a verb is a decided error. Clauses whose verb is already final never match.
    SUBORDINATE_MISPLACED_VERB.lastIndex = 0;
    const subordinateMatch = SUBORDINATE_MISPLACED_VERB.exec(sentence);
    if (subordinateMatch) {
      const [, , conjunctionText, subjectText, verb, tail] = subordinateMatch;
      const tailRaw = (tail ?? "").trim();
      const coordinatorIndex = tailRaw.search(COORDINATORS);
      const tailWords = (coordinatorIndex > 0 ? tailRaw.slice(0, coordinatorIndex) : tailRaw)
        .trim()
        .split(/\s+/u)
        .filter(Boolean);
      const lastTail = (tailWords.at(-1) ?? "").toLocaleLowerCase("de-DE");
      const looksLikeParticiple = /(?:ge[\p{L}]+t|ge[\p{L}]+en|iert|ier)$/u.test(lastTail);
      if (tailWords.length && !isFiniteVerb(lastTail) && !looksLikeParticiple) {
        const suggestion = `${conjunctionText} ${subjectText} ${tailWords.join(" ")} ${verb}`.replace(/\s+/gu, " ").trim();
        push({
          key: `${conjunctionText}-verb-final`,
          signalId: "subordinate-verb-final",
          family: "word-order",
          certainty: "proven",
          excerpt: excerptAt(sentence, subordinateMatch.index, Math.min(150, subordinateMatch[0].length)),
          suggestionDe: isFiniteVerb(verb.toLocaleLowerCase("de-DE")) ? suggestion : null,
          explanationAr: isFiniteVerb(verb.toLocaleLowerCase("de-DE"))
          ? `في الجملة التابعة بعد «${conjunctionText}» ينتقل الفعل المصرف إلى النهاية، فتصبح: «${suggestion}». هذا رصد محلي على نصّك، ولا يعني أن بقية النص سليمة.`
          : `في الجملة التابعة بعد «${conjunctionText}» يذهب الفعل إلى النهاية، لكن «${verb}» هنا ليس مصروفًا فلا نكتب لك جملة جاهزة: صحّح التصريف أولًا ثم انقل الفعل إلى النهاية.`,
          ruleSource: "authored-detector-table",
        });
        settledThisSentence = true;
      }
    }

    // 2 — comma before a subordinate conjunction, checked positionally so an
    // existing comma elsewhere in the sentence cannot excuse a missing one.
    for (const conjunction of SUBORDINATE_CONJUNCTIONS) {
      const finder = new RegExp(`(^|[\\s,])${conjunction}\\b`, "iu");
      const found = finder.exec(sentence);
      if (!found) continue;
      const at = found.index + found[1].length;
      const before = sentence.slice(0, at).replace(/\s+$/u, "");
      const lastBefore = before.slice(-1);
      if (at === 0 || lastBefore === "," || lastBefore === ":" || lastBefore === ";") continue;
      if (!/\p{L}/u.test(lastBefore)) continue;
      if (!before.trim()) continue;
      // Multi-word conjunctions take the comma before the whole phrase, and a
      // coordinator already separates the clauses, so neither is a missing comma.
      const previousWord = (before.match(/[\p{L}äöüß]+$/u) ?? [""])[0]!.toLocaleLowerCase("de-DE");
      if (COMPLEX_CONJUNCTION_PRECEDERS.has(previousWord)) continue;
      push({
        key: `comma-${conjunction}-${at}`,
        signalId: "comma-before-subordinate-conjunction",
        family: "punctuation",
        certainty: "proven",
        excerpt: excerptAt(sentence, Math.max(0, at - 40), Math.min(120, at + 20)),
        suggestionDe: `${before}, ${sentence.slice(at)}`.replace(/\s+/gu, " ").trim(),
        explanationAr: `تُفصل الجملة التابعة بفاصلة قبل «${conjunction}». اكتب «…، ${conjunction} …».`,
        ruleSource: "authored-detector-table",
      });
      settledThisSentence = true;
      break;
    }

    // 3 — noun capitalization, proven only right after a determiner.
    for (let index = 1; index < tokens.length; index += 1) {
      const token = tokens[index]!;
      const entry = nounByLemma.get(token.clean);
      if (!entry || startsUppercase(token.raw)) continue;
      if (INFINITIVES_FROM_FRAMES.has(token.clean) || KNOWN_INFINITIVES.has(token.clean)) continue;
      if (isFiniteVerb(token.clean) || ADJECTIVES.has(token.clean)) continue;
      const nextToken = tokens[index + 1]?.clean ?? "";
      if (nextToken && (startsUppercase(tokens[index + 1]!.raw) || nounByLemma.has(nextToken))) continue;
      const previous = tokens[index - 1]!.clean;
      if (!DETERMINERS.has(previous) && !ADJECTIVES.has(previous)) continue;
      if (!DETERMINERS.has(previous)) {
        const twoBack = tokens[index - 2]?.clean ?? "";
        if (!DETERMINERS.has(twoBack)) continue;
      }
      const capitalized = `${token.raw[0]!.toLocaleUpperCase("de-DE")}${token.raw.slice(1)}`;
      push({
        key: `capital-${token.clean}`,
        signalId: "noun-capitalization",
        family: "orthography",
        certainty: "proven",
        excerpt: excerptAt(sentence, tokens[index - 1]!.start, Math.min(90, sentence.length)),
        suggestionDe: sentence.replace(new RegExp(`\\b${escapeRegExp(token.raw)}\\b`, "u"), capitalized),
        explanationAr: `«${entry.lemma}» اسم مُدرَّس في المنهج بأداة ${entry.article}، والأسماء في الألمانية تبدأ بحرف كبير: «${capitalized}».`,
        ruleSource: "authored-lesson-lexicon",
      });
      settledThisSentence = true;
    }

    // 4 — definite article case after a preposition that always governs one case.
    for (let index = 0; index + 2 < tokens.length; index += 1) {
      const preposition = tokens[index]!.clean;
      const article = tokens[index + 1]!.clean;
      const nounToken = tokens[index + 2]!;
      if (WECHSEL_PREPOSITIONS.has(preposition)) continue;
      const required: GermanCase | null = ALWAYS_DATIVE.has(preposition)
        ? "dative"
        : ALWAYS_ACCUSATIVE.has(preposition)
          ? "accusative"
          : null;
      if (!required) continue;
      const entry = nounByLemma.get(nounToken.clean);
      if (!entry) continue;
      if (!ALL_DEFINITE_ARTICLES.has(article)) continue;
      const expected = DEFINITE_ARTICLE[required][entry.gender];
      if (article === expected) continue;
      const isWrongCaseForSomeGender = Object.values(DEFINITE_ARTICLE).some((row) => Object.values(row).includes(article));
      if (!isWrongCaseForSomeGender) continue;
      const corrected = `${preposition} ${expected} ${entry.lemma}`;
      push({
        key: `case-${preposition}-${nounToken.clean}`,
        signalId: "article-case-after-preposition",
        family: "case",
        certainty: "proven",
        excerpt: excerptAt(sentence, tokens[index]!.start, Math.min(90, sentence.length)),
        suggestionDe: sentence.replace(
          new RegExp(`\\b${escapeRegExp(preposition)}\\s+${escapeRegExp(article)}\\s+${escapeRegExp(nounToken.raw)}`, "iu"),
          corrected,
        ),
        explanationAr: `في أمثلة المنهج «${preposition}» يطلب ${required === "dative" ? "Dativ" : "Akkusativ"}، و«${entry.lemma}» ${entry.gender === "feminine" ? "مؤنث" : entry.gender === "neuter" ? "محايد" : entry.gender === "plural-only" ? "جمع" : "مذكر"}، فيُكتب: «${corrected}». المصدر أمثلة المنهج، لا تحقق بشري من مرجع نحوي رسمي.`,
        ruleSource: "authored-lesson-lexicon",
      });
      settledThisSentence = true;
    }

    // 5 — modal plus `zu` before the infinitive.
    const modalZu = /\b(möchte|möchten|will|willst|wollen|kann|kannst|können|muss|müssen|soll|sollen|darf|dürfen)\s+zu\s+([\p{Ll}äöüß]+)\b/iu;
    const modalMatch = modalZu.exec(sentence);
    if (modalMatch && KNOWN_INFINITIVES.has(modalMatch[2]!.toLocaleLowerCase("de-DE"))) {
      const [, modal, infinitive] = modalMatch;
      push({
        key: "modal-zu",
        signalId: "modal-plus-zu-infinitive",
        family: "morphology",
        certainty: "proven",
        excerpt: excerptAt(sentence, modalMatch.index, Math.min(110, modalMatch[0]!.length)),
        suggestionDe: sentence.replace(modalZu, `${modal} ${infinitive}`),
        explanationAr: "بعد الفعل الناقص يأتي المصدر مباشرة بدون zu: «… möchte gehen»، لا «… zu gehen».",
        ruleSource: "authored-detector-table",
      });
      settledThisSentence = true;
    }

    // 6 — separable prefix still glued to a conjugated verb in a main clause.
    if (subordinators.length === 0) {
      GLUED_SEPARABLE_VERB.lastIndex = 0;
      const match = GLUED_SEPARABLE_VERB.exec(sentence);
      if (match) {
        const glued = match[2]!.toLocaleLowerCase("de-DE");
        const entry = SEPARABLE_PATTERNS.find((candidate) => new RegExp(`^${candidate.pattern}$`, "iu").test(glued));
        if (entry) {
          const subject = match[1]!;
          const unsafePerson = entry.irregular && /^(?:du|er|sie|es)$/iu.test(subject);
          push({
            key: `separable-${entry.verb}`,
            signalId: "separable-prefix-position",
            family: "word-order",
            certainty: "proven",
            excerpt: excerptAt(sentence, match.index, Math.min(110, match[0].length)),
            suggestionDe: unsafePerson
              ? null
              : buildSeparableSuggestion(sentence, match.index, match[0].length, subject, conjugatePresent(subject, entry.base), entry.prefix),
            explanationAr: unsafePerson
              ? `في الجملة الرئيسية ينفصل الجزء المنبور ويذهب إلى النهاية: «${subject} … ${entry.prefix}». هذا الفعل يغيّر حركة الجذر مع du/er/sie/es، فاكتب تصريفه من درس الأفعال ولا تعتمد على اقتراح آلي.`
              : `في الجملة الرئيسية ينفصل الجزء المنبور: الفعل المصروف في الموقع الثاني والبادئة في النهاية، مثل «${subject} ${conjugatePresent(subject, entry.base)} … ${entry.prefix}». ضع بقية المعلومات بينهما.`,
            ruleSource: "authored-detector-table",
          });
          settledThisSentence = true;
        }
      }
    }

    // 7 — W-question with the verb out of second position.
    const questionPattern = new RegExp(`^(${W_WORDS.join("|")})\\s+(${SUBJECT_PRONOUNS.join("|")})\\s+([\\p{L}äöüß]+)\\b`, "iu");
    const questionMatch = questionPattern.exec(sentence.trim());
    if (questionMatch && isVerbLike(questionMatch[3]!.toLocaleLowerCase("de-DE"))) {
      const [, word, subject, verb] = questionMatch;
      const safeRestatement = reorderIsComplete(verb, subject);
      push({
        key: "w-question-order",
        signalId: "w-question-verb-second",
        family: "word-order",
        certainty: "proven",
        excerpt: excerptAt(sentence, sentence.indexOf(word!), Math.min(110, sentence.length)),
        // Permuting words is safe; conjugating a form we cannot parse is not.
        // `Wie Sie heißen?` therefore gets the reorder, while a token that is
        // not provably finite is diagnosed without an invented replacement
        // (same rule the other detectors already apply).
        suggestionDe: safeRestatement ? sentence.replace(questionPattern, `${word} ${verb} ${subject}`) : null,
        explanationAr: `في السؤال الذي يبدأ بـ«${word}» يأتي الفعل مباشرة بعدها ثم الفاعل: «${word} ${verb} ${subject} …؟».`,
        ruleSource: "authored-detector-table",
      });
      settledThisSentence = true;
    }

    // 8 — inversion after a fronted adverbial.
    const inversionPattern = new RegExp(`^(${ADVERBIAL_OPENERS.join("|")})\\s+(${SUBJECT_PRONOUNS.join("|")})\\s+([\\p{L}äöüß]+)\\b`, "iu");
    const inversionMatch = inversionPattern.exec(sentence.trim());
    if (inversionMatch && isVerbLike(inversionMatch[3]!.toLocaleLowerCase("de-DE"))) {
      const [, opener, subject, verb] = inversionMatch;
      const safeInversion = reorderIsComplete(verb, subject);
      push({
        key: `inversion-${opener}`,
        signalId: "inversion-after-adverbial",
        family: "word-order",
        certainty: "proven",
        excerpt: excerptAt(sentence, 0, Math.min(110, inversionMatch[0]!.length)),
        suggestionDe: safeInversion ? sentence.replace(inversionPattern, `${opener} ${verb} ${subject}`) : null,
        explanationAr: `بعد «${opener}» في المقدمة يأتي الفعل مباشرة ثم الفاعل: «${opener} ${verb} ${subject} …».`,
        ruleSource: "authored-detector-table",
      });
      settledThisSentence = true;
    }

    // 9 — `das` after a comma where a conjunction is expected. Probable only:
    // the decision depends on whether the rest is a clause.
    DASS_VERSUS_DAS.lastIndex = 0;
    const dasClause = DASS_VERSUS_DAS.exec(sentence);
    if (dasClause) {
      push({
        key: "dass-vs-das",
        signalId: "dass-vs-das",
        family: "orthography",
        certainty: "probable",
        excerpt: excerptAt(sentence, dasClause.index, Math.min(140, dasClause[0]!.length)),
        suggestionDe: sentence.replace(/,\s*das\s+/iu, ", dass "),
        explanationAr: "بعد الفاصلة وقبل جملة فعلها في النهاية تُكتب الحرفية dass بضع سينات. راجعها بنفسك: إذا كان «das» يشير إلى شيء مذكور (هذا/الذي) فهو صحيح ولا يُغيَّر.",
        ruleSource: "authored-detector-table",
      });
    }

    if (settledThisSentence) settledSentences += 1;
    else {
      if (subordinators.length > 1) {
        unresolved.push({
          key: `nested-clause-${tokens[0]?.clean ?? "x"}`,
          excerpt: excerptAt(sentence, 0, 140),
          reasonAr: "أكثر من جملة تابعة في نفس الجملة: ترتيب الأفعال المتداخلة لا يحسمه الفحص المحلي.",
          kind: "nested-clause",
        });
      }
      const relativeClause = /\b(?:der|die|das)\s+(?:\p{L}+\s+){1,8}?(?:wohnt|kommt|macht|ist|hat|arbeitet|lernt|steht|hängt|liegt)\b/iu.test(sentence);
      if (relativeClause) {
        unresolved.push({
          key: `relative-clause-${tokens[0]?.clean ?? "x"}`,
          excerpt: excerptAt(sentence, 0, 140),
          reasonAr: "جملة موصولة محتملة: صلاحية الضمير وترتيب الفعل داخلها لا يغطيهما الفحص المحلي.",
          kind: "nested-clause",
        });
      }
      const unknownVerbLike = tokens.find(
        (token) =>
          token.clean.length >= 5 &&
          /(?:est|et|ierst|iert|ete|ten)$/u.test(token.clean) &&
          !isFiniteVerb(token.clean) &&
          !INFINITIVES_FROM_FRAMES.has(token.clean) &&
          !KNOWN_INFINITIVES.has(token.clean) &&
          !nounByLemma.has(token.clean) &&
          !ADJECTIVES.has(token.clean),
      );
      if (unknownVerbLike) {
        unresolved.push({
          key: `unknown-verb-${unknownVerbLike.clean}`,
          excerpt: excerptAt(sentence, unknownVerbLike.start, 90),
          reasonAr: `لم يتعرف الفحص المحلي على صيغة «${unknownVerbLike.raw}» لأن جدول التصريف لدينا محدود؛ لا نصحّح ما لا نعرفه، ولا نسكت عنه كأنه سليم.`,
          kind: "unknown-verb-form",
        });
      }
      if (/\b(?:gute|neue|alte|kleine|große|billige|teure|schöne|wichtige|erste|nächste|klare)\s+[\p{L}]+\b/iu.test(sentence)) {
        unresolved.push({
          key: `adjective-inflection-${tokens[0]?.clean ?? "x"}`,
          excerpt: excerptAt(sentence, 0, 140),
          reasonAr: "ملحق الصفة يعتمد على الجنس والحالة ونوع المحدد؛ لا يدّعي الفحص المحلي تغطية هذا.",
          kind: "adjective-inflection",
        });
      }
      if (relativeClause || unknownVerbLike || /\b(?:gute|neue|alte|kleine|große|billige|teure|schöne|wichtige|erste|nächste|klare)\s+[\p{L}]+\b/iu.test(sentence) || subordinators.length > 1) {
        continue;
      }
      unresolved.push({
        key: `meaning-${tokens[0]?.clean ?? "x"}`,
        excerpt: excerptAt(sentence, 0, 140),
        reasonAr: "لم يرصد الفحص المحلي نمطًا معروفًا في هذه الجملة، وهذا لا يثبت صحتها: المعنى المقصود وطبيعية الاختيار ودقة الحروف الجر لا يحسمها الفحص المحلي.",
        kind: "meaning-ambiguity",
      });
    }
  }

  return {
    policyVersion: GERMAN_GRAMMAR_SIGNALS_POLICY,
    findings,
    unresolved,
    coverage: {
      sentences: sentences.length,
      settledSentences,
      words: tokensOf(text).length,
      lexiconNouns: nounByLemma.size,
      verbFrames: verbPrepositionFrames.length,
    },
    canClaimErrorFree: false,
    authority: "authored-local-detectors-unverified-against-official-reference",
    boundary: GERMAN_GRAMMAR_SIGNALS_BOUNDARY,
  };
}

/** Only `proven` findings with a deterministic suggestion may drive a repair. */
export function gradeableFindings(report: GrammarSignalReport): GrammarSignalFinding[] {
  // Certainty alone decides what may be presented as a finding. A withheld
  // suggestion is a missing fix, not a weaker diagnosis: folding the two
  // together would demote a proven word-order problem to "probable" merely
  // because the engine refuses to conjugate for the learner.
  return report.findings.filter((entry) => entry.certainty === "proven");
}

/** What the optional remote lane may be asked about. */
export function unresolvedExcerpts(report: GrammarSignalReport): string[] {
  return report.unresolved.map((entry) => entry.excerpt);
}

export const GERMAN_GRAMMAR_SIGNALS_LEXICON_SIZE = nounGrammarEntries.length;
