import { academicLessonList } from "@/data/academic-lessons";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { lexicalFrameExclusionDecisions, lexicalFrameExclusionFor, type LexicalFrameExclusionDecision } from "@/data/lexical-target-decisions";
import type { FullLesson, PracticeExercise, Question } from "@/types/lesson-content";
import type { GermanCase } from "@/types/lexical-grammar";

export const LEXICAL_TARGET_AUDIT_VERSION = "lexical-target-gap-v1" as const;

export type LexicalCandidateStatus = "covered" | "pending-human" | "not-target";
export type LexicalCandidateRole = "anchor" | "authored-target" | "context-only" | "reviewed-exclusion";
export type LexicalSourceStrength = "target" | "context" | "registry";

export type LexicalEvidenceSource = {
  path: string;
  stage: string;
  surface: string;
  strength: LexicalSourceStrength;
};

export type NounTargetGapRow = {
  id: string;
  lessonId: string;
  level: FullLesson["level"];
  lemmaCandidate: string;
  normalizedLemma: string;
  role: LexicalCandidateRole;
  status: LexicalCandidateStatus;
  anchorIds: string[];
  sources: LexicalEvidenceSource[];
};

export type VerbFrameGapRow = {
  id: string;
  lessonId: string;
  level: FullLesson["level"];
  infinitiveCandidate: string;
  normalizedVerb: string;
  preposition: string;
  role: LexicalCandidateRole;
  status: LexicalCandidateStatus;
  observedCases: Array<GermanCase | "ambiguous" | "unknown">;
  anchorIds: string[];
  sources: LexicalEvidenceSource[];
  exclusionDecision?: LexicalFrameExclusionDecision;
};

type Surface = LexicalEvidenceSource & { text: string };
type MutableNounCandidate = Omit<NounTargetGapRow, "id" | "sources"> & { sources: Map<string, LexicalEvidenceSource> };
type MutableFrameCandidate = Omit<VerbFrameGapRow, "id" | "sources" | "observedCases"> & {
  sources: Map<string, LexicalEvidenceSource>;
  observedCases: Set<VerbFrameGapRow["observedCases"][number]>;
};

const PREPOSITIONS = new Set(["an", "auf", "aus", "bei", "für", "gegen", "in", "mit", "nach", "über", "um", "von", "vor", "zu"]);
const NON_VERB_EN_WORDS = new Set([
  "allen", "anderen", "bleiben", "denn", "diesen", "dürfen", "eigenen", "einen", "ersten", "gegen", "haben",
  "ihnen", "ihren", "jeden", "keinen", "können", "letzten", "meinen", "mögen", "müssen", "nächsten", "neuen",
  "offenen", "seinen", "sieben", "sollen", "sondern", "tun", "unseren", "vielen", "welchen", "wenn", "wen",
  "werden", "wollen", "zwischen",
]);
const GE_INFINITIVE_ALLOWLIST = new Set(["geben", "gefallen", "gehen", "gehören", "gelingen", "genießen", "gestalten", "gewinnen"]);
const ARTICLES = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "mein", "meine", "meinen", "meinem", "meiner", "dein", "deine", "deinen", "deinem", "deiner",
  "sein", "seine", "seinen", "seinem", "seiner", "ihr", "ihre", "ihren", "ihrem", "ihrer",
  "unser", "unsere", "unseren", "unserem", "unserer", "kein", "keine", "keinen", "keinem", "keiner",
]);

const ARTICLE_NOUN_PATTERN = /\b(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|mein|meine|meinen|meinem|meiner|dein|deine|deinen|deinem|deiner|sein|seine|seinen|seinem|seiner|ihr|ihre|ihren|ihrem|ihrer|unser|unsere|unseren|unserem|unserer|kein|keine|keinen|keinem|keiner)\s+(?:(?:[a-zäöüß][\p{L}-]*\s+){0,3})([\p{Lu}ÄÖÜ][\p{L}ÄÖÜäöüß-]*)/gu;
const TOKEN_PATTERN = /[\p{L}ÄÖÜäöüß]+(?:-[\p{L}ÄÖÜäöüß]+)*/gu;

function normalize(value: string) {
  return value.normalize("NFC").toLocaleLowerCase("de-DE").replace(/[„“”"'’.,;:!?()[\]{}…]/g, "").trim();
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function evidenceKey(source: LexicalEvidenceSource) {
  return `${source.path}\u0000${source.surface}\u0000${source.strength}`;
}

function source(path: string, stage: string, text: string, strength: LexicalSourceStrength): Surface {
  return { path, stage, text, surface: text.replace(/\s+/g, " ").trim(), strength };
}

function questionSurfaces(prefix: string, stage: string, questions: Question[]) {
  return questions.flatMap((question, questionIndex) => [
    source(`${prefix}[${questionIndex}].promptDe`, stage, question.promptDe, "context"),
    ...question.options.map((option, optionIndex) => source(`${prefix}[${questionIndex}].options[${optionIndex}]`, stage, option, "context")),
  ]);
}

function exerciseSurfaces(exercise: PracticeExercise, index: number): Surface[] {
  const prefix = `exercises[${index}]`;
  if (exercise.type === "multiple-choice") {
    return [
      ...(exercise.promptDe ? [source(`${prefix}.promptDe`, "controlled", exercise.promptDe, "context")] : []),
      ...exercise.options.map((option, optionIndex) => source(`${prefix}.options[${optionIndex}]`, "controlled", option, "context")),
    ];
  }
  if (exercise.type === "fill-blank") {
    return [source(`${prefix}.template`, "controlled", exercise.template, "context"), ...exercise.acceptedAnswers.map((answer, answerIndex) => source(`${prefix}.acceptedAnswers[${answerIndex}]`, "controlled", answer, "context"))];
  }
  if (exercise.type === "word-ordering") {
    return [...exercise.words.map((word, wordIndex) => source(`${prefix}.words[${wordIndex}]`, "controlled", word, "context")), ...exercise.acceptedAnswers.map((answer, answerIndex) => source(`${prefix}.acceptedAnswers[${answerIndex}]`, "controlled", answer, "context"))];
  }
  if (exercise.type === "error-correction") {
    return [source(`${prefix}.sentence`, "controlled", exercise.sentence, "context"), ...exercise.acceptedAnswers.map((answer, answerIndex) => source(`${prefix}.acceptedAnswers[${answerIndex}]`, "controlled", answer, "context"))];
  }
  return exercise.pairs.flatMap((pair, pairIndex) => [
    source(`${prefix}.pairs[${pairIndex}].left`, "controlled", pair.left, "context"),
    source(`${prefix}.pairs[${pairIndex}].right`, "controlled", pair.right, "context"),
  ]);
}

function collectSurfaces(lesson: FullLesson): Surface[] {
  return [
    ...lesson.phrases.map((phrase, index) => source(`phrases[${index}].de`, "vocabulary", phrase.de, "target")),
    ...lesson.flashcards.map((card, index) => source(`flashcards[${index}].frontDe`, "vocabulary", card.frontDe, "target")),
    ...lesson.entry.dialogue.map((line, index) => source(`entry.dialogue[${index}].de`, "entry", line.de, "context")),
    ...lesson.discovery.examples.map((example, index) => source(`discovery.examples[${index}]`, "discover", example, "context")),
    ...lesson.theory.flatMap((block, blockIndex) => [
      ...(block.formula ? [source(`theory[${blockIndex}].formula`, "rule", block.formula, "context")] : []),
      ...block.examples.map((example, exampleIndex) => source(`theory[${blockIndex}].examples[${exampleIndex}].de`, "rule", example.de, "context")),
    ]),
    ...lesson.exercises.flatMap(exerciseSurfaces),
    source("reading.textDe", "reading", lesson.reading.textDe, "context"),
    ...questionSurfaces("reading.questions", "reading", lesson.reading.questions),
    source("listening.transcriptDe", "listening", lesson.listening.transcriptDe, "context"),
    ...questionSurfaces("listening.questions", "listening", lesson.listening.questions),
    ...lesson.pronunciation.items.map((item, index) => source(`pronunciation.items[${index}].de`, "pronunciation", item.de, "context")),
    source("writing.promptDe", "writing", lesson.writing.promptDe, "context"),
    source("writing.modelDe", "writing", lesson.writing.modelDe, "context"),
    source("speaking.promptDe", "speaking", lesson.speaking.promptDe, "context"),
    ...lesson.speaking.usefulPhrases.map((phrase, index) => source(`speaking.usefulPhrases[${index}]`, "speaking", phrase, "context")),
    source("mediation.sourceDe", "mediation", lesson.mediation.sourceDe, "context"),
    ...lesson.mistakes.flatMap((mistake, index) => [
      source(`mistakes[${index}].wrong`, "errors", mistake.wrong, "context"),
      source(`mistakes[${index}].correct`, "errors", mistake.correct, "context"),
    ]),
    ...questionSurfaces("miniTest", "test", lesson.miniTest),
    ...lesson.flashcards.map((card, index) => source(`flashcards[${index}].exampleDe`, "vocabulary", card.exampleDe, "context")),
  ].filter((item) => item.surface.length > 0);
}

export function extractArticleMarkedNouns(text: string) {
  const nouns: string[] = [];
  for (const match of text.matchAll(ARTICLE_NOUN_PATTERN)) nouns.push(match[1]);
  return [...new Set(nouns)];
}

function looksLikeInfinitive(token: string, previous: string | undefined, next: string | undefined) {
  const lower = normalize(token);
  if (!token || token[0] !== token[0].toLocaleLowerCase("de-DE")) return false;
  if (PREPOSITIONS.has(lower) || ARTICLES.has(lower) || NON_VERB_EN_WORDS.has(lower)) return false;
  if (lower.startsWith("ge") && !GE_INFINITIVE_ALLOWLIST.has(lower)) return false;
  if (next && next[0] === next[0].toLocaleUpperCase("de-DE") && next[0] !== next[0].toLocaleLowerCase("de-DE")) return false;
  if (previous && ARTICLES.has(normalize(previous))) return false;
  return lower === "sein" || /(?:en|eln|ern)$/.test(lower);
}

function observedCase(tokens: string[], prepositionIndex: number): GermanCase | "ambiguous" | "unknown" {
  const following = tokens.slice(prepositionIndex + 1, prepositionIndex + 5).map(normalize);
  const article = following.find((token) => ARTICLES.has(token) || ["einem", "einer", "einen", "dem", "der", "die", "das", "den"].includes(token));
  if (!article) return "unknown";
  if (["dem", "einem", "einer", "meinem", "meiner", "deinem", "deiner", "seinem", "seiner", "ihrem", "ihrer", "unserem", "unserer", "keinem", "keiner"].includes(article)) return "dative";
  if (["einen", "eine", "die", "das", "meinen", "meine", "deinen", "deine", "seinen", "seine", "ihren", "ihre", "unseren", "unsere", "keinen", "keine"].includes(article)) return "accusative";
  return "ambiguous";
}

export function extractInfinitivePrepositionPairs(text: string) {
  const tokens = text.match(TOKEN_PATTERN) ?? [];
  const pairs: Array<{ infinitive: string; normalizedVerb: string; preposition: string; observedCase: GermanCase | "ambiguous" | "unknown" }> = [];
  for (let verbIndex = 0; verbIndex < tokens.length; verbIndex += 1) {
    const token = tokens[verbIndex];
    if (!looksLikeInfinitive(token, tokens[verbIndex - 1], tokens[verbIndex + 1])) continue;
    if (normalize(tokens[verbIndex - 1] ?? "") === "zu" && tokens.slice(0, verbIndex - 1).some((part) => normalize(part) === "um")) continue;
    for (let prepositionIndex = 0; prepositionIndex < tokens.length; prepositionIndex += 1) {
      const prepositionToken = tokens[prepositionIndex];
      const preposition = normalize(prepositionToken);
      const startsLowercase = prepositionToken[0] === prepositionToken[0].toLocaleLowerCase("de-DE");
      if (!startsLowercase || !PREPOSITIONS.has(preposition) || Math.abs(prepositionIndex - verbIndex) > 7) continue;
      if (preposition === "zu" && prepositionIndex === verbIndex - 1) continue;
      const reflexive = tokens.some((part, index) => normalize(part) === "sich" && Math.abs(index - verbIndex) <= 7);
      pairs.push({
        infinitive: `${reflexive ? "sich " : ""}${token}`,
        normalizedVerb: normalize(token),
        preposition,
        observedCase: observedCase(tokens, prepositionIndex),
      });
    }
  }
  return [...new Map(pairs.map((pair) => [`${pair.normalizedVerb}|${pair.preposition}|${pair.observedCase}`, pair])).values()];
}

function nounAliases(entry: (typeof nounGrammarEntries)[number]) {
  const aliases = [entry.lemma, entry.plural.form, entry.plural.dativeForm, ...Object.values(entry.caseForms).map((form) => form.split(/\s+/).slice(1).join(" "))].filter((value): value is string => Boolean(value));
  return new Set(aliases.map(normalize));
}

function frameHead(infinitive: string) {
  return normalize(infinitive).split(/\s+/).at(-1) ?? normalize(infinitive);
}

function roleAndStatus(hasAnchor: boolean, hasTargetSource: boolean): { role: LexicalCandidateRole; status: LexicalCandidateStatus } {
  if (hasAnchor) return { role: "anchor", status: "covered" };
  if (hasTargetSource) return { role: "authored-target", status: "pending-human" };
  return { role: "context-only", status: "not-target" };
}

export function buildLexicalTargetGapAudit() {
  const nounRows: NounTargetGapRow[] = [];
  const frameRows: VerbFrameGapRow[] = [];
  const appliedFrameExclusionIds = new Set<string>();

  for (const lesson of academicLessonList) {
    const lessonNouns = nounGrammarEntries.filter((entry) => entry.lessonId === lesson.id);
    const lessonFrames = verbPrepositionFrames.filter((entry) => entry.lessonId === lesson.id);
    const nouns = new Map<string, MutableNounCandidate>();
    const frames = new Map<string, MutableFrameCandidate>();

    const addNoun = (lemmaCandidate: string, evidence: LexicalEvidenceSource, anchorIds: string[] = []) => {
      const normalizedLemma = normalize(lemmaCandidate);
      const matchedAnchors = lessonNouns.filter((entry) => nounAliases(entry).has(normalizedLemma)).map((entry) => entry.id);
      const allAnchorIds = [...new Set([...anchorIds, ...matchedAnchors])].sort();
      const key = normalizedLemma;
      const existing = nouns.get(key);
      const sourceMap = existing?.sources ?? new Map<string, LexicalEvidenceSource>();
      sourceMap.set(evidenceKey(evidence), evidence);
      const hasTargetSource = [...sourceMap.values()].some((item) => item.strength === "target");
      const classification = roleAndStatus(allAnchorIds.length > 0, hasTargetSource);
      nouns.set(key, {
        lessonId: lesson.id,
        level: lesson.level,
        lemmaCandidate: existing?.lemmaCandidate ?? lemmaCandidate,
        normalizedLemma,
        ...classification,
        anchorIds: allAnchorIds,
        sources: sourceMap,
      });
    };

    for (const entry of lessonNouns) {
      addNoun(entry.lemma, { path: `lexicalRegistry.${entry.id}`, stage: "vocabulary", surface: `${entry.article} ${entry.lemma}`, strength: "registry" }, [entry.id]);
    }

    for (const [glossaryIndex, item] of lesson.reading.glossary.entries()) {
      if (/^[\p{Lu}ÄÖÜ]/u.test(item.lemma)) {
        addNoun(item.lemma, { path: `reading.glossary[${glossaryIndex}].lemma`, stage: "reading", surface: item.lemma, strength: "target" });
      }
    }

    const surfaces = collectSurfaces(lesson);
    for (const surface of surfaces) {
      for (const lemma of extractArticleMarkedNouns(surface.text)) addNoun(lemma, surface);
    }

    const addFrame = (
      infinitiveCandidate: string,
      preposition: string,
      caseValue: VerbFrameGapRow["observedCases"][number],
      evidence: LexicalEvidenceSource,
      anchorIds: string[] = [],
    ) => {
      const normalizedVerb = frameHead(infinitiveCandidate);
      const matchedAnchors = lessonFrames.filter((entry) => frameHead(entry.infinitive) === normalizedVerb && normalize(entry.preposition) === normalize(preposition)).map((entry) => entry.id);
      const allAnchorIds = [...new Set([...anchorIds, ...matchedAnchors])].sort();
      const key = `${normalizedVerb}|${normalize(preposition)}`;
      const existing = frames.get(key);
      const sourceMap = existing?.sources ?? new Map<string, LexicalEvidenceSource>();
      sourceMap.set(evidenceKey(evidence), evidence);
      const cases = existing?.observedCases ?? new Set<VerbFrameGapRow["observedCases"][number]>();
      cases.add(caseValue);
      const hasTargetSource = [...sourceMap.values()].some((item) => item.strength === "target");
      const classification = roleAndStatus(allAnchorIds.length > 0, hasTargetSource);
      frames.set(key, {
        lessonId: lesson.id,
        level: lesson.level,
        infinitiveCandidate: existing?.infinitiveCandidate ?? infinitiveCandidate,
        normalizedVerb,
        preposition: normalize(preposition),
        ...classification,
        observedCases: cases,
        anchorIds: allAnchorIds,
        sources: sourceMap,
      });
    };

    for (const entry of lessonFrames) {
      addFrame(entry.infinitive, entry.preposition, entry.governedCase, { path: `lexicalRegistry.${entry.id}`, stage: "vocabulary", surface: entry.chunkDe, strength: "registry" }, [entry.id]);
    }
    for (const surface of surfaces) {
      for (const pair of extractInfinitivePrepositionPairs(surface.text)) {
        addFrame(pair.infinitive, pair.preposition, pair.observedCase, surface);
      }
    }

    nounRows.push(...[...nouns.values()].map((row) => ({
      ...row,
      id: `lex-n-${lesson.id}-${stableHash(`${lesson.id}|${row.normalizedLemma}`)}`,
      sources: [...row.sources.values()].sort((left, right) => left.path.localeCompare(right.path)),
    })));
    frameRows.push(...[...frames.values()].map((row) => {
      const exclusionDecision = lexicalFrameExclusionFor(lesson.id, row.normalizedVerb, row.preposition);
      const excluded = Boolean(exclusionDecision && row.status === "pending-human");
      if (excluded && exclusionDecision) appliedFrameExclusionIds.add(exclusionDecision.id);
      return {
        ...row,
        ...(excluded ? { role:"reviewed-exclusion" as const,status:"not-target" as const,exclusionDecision } : {}),
        id: `lex-v-${lesson.id}-${stableHash(`${lesson.id}|${row.normalizedVerb}|${row.preposition}`)}`,
        observedCases: [...row.observedCases].sort(),
        sources: [...row.sources.values()].sort((left, right) => left.path.localeCompare(right.path)),
      };
    }));
  }

  nounRows.sort((left, right) => left.lessonId.localeCompare(right.lessonId) || left.normalizedLemma.localeCompare(right.normalizedLemma));
  frameRows.sort((left, right) => left.lessonId.localeCompare(right.lessonId) || left.normalizedVerb.localeCompare(right.normalizedVerb) || left.preposition.localeCompare(right.preposition));

  const summarize = <T extends { level: FullLesson["level"]; status: LexicalCandidateStatus; role: LexicalCandidateRole }>(rows: T[]) => ({
    totalCandidates: rows.length,
    covered: rows.filter((row) => row.status === "covered").length,
    pendingHuman: rows.filter((row) => row.status === "pending-human").length,
    contextualNotTarget: rows.filter((row) => row.status === "not-target").length,
    authoredTargets: rows.filter((row) => row.role === "authored-target" || row.role === "anchor").length,
    byLevel: Object.fromEntries((["A1", "A2", "B1", "B2"] as const).map((level) => [level, {
      totalCandidates: rows.filter((row) => row.level === level).length,
      covered: rows.filter((row) => row.level === level && row.status === "covered").length,
      pendingHuman: rows.filter((row) => row.level === level && row.status === "pending-human").length,
      contextualNotTarget: rows.filter((row) => row.level === level && row.status === "not-target").length,
    }])),
  });

  const decisionIds = lexicalFrameExclusionDecisions.map((item) => item.id);
  const decisionKeys = lexicalFrameExclusionDecisions.map((item) => `${item.lessonId}|${item.normalizedVerb}|${item.preposition}`);
  const unusedExclusionDecisionIds = lexicalFrameExclusionDecisions.filter((item) => !appliedFrameExclusionIds.has(item.id)).map((item) => item.id);
  const issues = [
    ...(new Set(decisionIds).size === decisionIds.length ? [] : ["duplicate lexical frame exclusion ID"]),
    ...(new Set(decisionKeys).size === decisionKeys.length ? [] : ["duplicate lexical frame exclusion key"]),
    ...unusedExclusionDecisionIds.map((id) => `unused lexical frame exclusion: ${id}`),
  ];

  return {
    version: LEXICAL_TARGET_AUDIT_VERSION,
    lessonCount: academicLessonList.length,
    nounAnchorCount: nounGrammarEntries.length,
    verbFrameAnchorCount: verbPrepositionFrames.length,
    nounSummary: summarize(nounRows),
    verbFrameSummary: summarize(frameRows),
    nounRows,
    verbFrameRows: frameRows,
    exclusionDecisionCount: lexicalFrameExclusionDecisions.length,
    pendingIndependentExclusionReview: lexicalFrameExclusionDecisions.filter((item) => item.reviewStatus === "authored-review-pending").length,
    exclusionDecisions: lexicalFrameExclusionDecisions,
    issues,
    boundary: "Target means an existing anchor, an uppercase reading-glossary lemma, or an article-marked noun / infinitive-preposition pair on an authored vocabulary phrase or flashcard front. Theory, texts, mistakes, and task surfaces are scanned as context-only signals. Sentence-initial capitalization alone is never used. Uncovered targets remain pending-human unless an explicit versioned structural exclusion identifies a locative/condition adjunct, separable particle, or purpose clause. Exclusions remain authored-review-pending and do not replace independent German review; the audit never invents gender, plural, governed case, or a lexical record.",
  };
}
