import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { academicLessonList as lessons } from "../src/data/academic-lessons";
import type { PracticeExercise } from "../src/types/lesson-content";
import { ACCEPTED_ANSWER_HYGIENE_VERSION, NO_OP_VARIANT_POLICY, distinctAcceptedForms, noOpAcceptedVariants } from "../src/core/content-validation/accepted-answer-hygiene";

/**
 * Lesson-quality audit — measures what the structural gates do not:
 * answer-position fairness, longest-option cue, model-answer length vs the range the
 * task itself states, accepted-answer breadth, feedback substance, objective traceability,
 * listening stamina and pronunciation coverage.
 * Run: `npm run lesson:quality` (report) · `npm run lesson:quality:audit` (--strict, fails on breach).
 */

const REPORT = "reports/lesson-quality-audit.json";
const thresholds = {
  writingModelRangeViolations: 0,
  maxPositionSharePct: 40,
  minPositionSharePct: 15,
  longestOptionCuePctMax: 40,
  singleVariantSharePctMax: 25,
  noOpAcceptedVariantsMax: 0,
  explanationMedianCharsMin: 60,
};

const STOP = new Set("der die das und oder aber für mit von zu im am an ein eine einen einer einem des dem den ich du er sie es wir ihr sie nicht kein keine alle jeder jede wenn als auch noch schon sehr mehr weniger man uns euch ihnen ihm sein ihre ihrem diesem dieser dieses bei nach aus über unter vor hinter zwischen um ohne innerhalb außerhalb kann werde werden wird hat haben hatte sollte müssen will möchten".split(" "));
// Measurement defect found 2026-09-19: NFKD first decomposes every umlaut into base + combining
// mark, so the ä/ö/ü/ß replacements below were dead code and the strip step turned "Produktivität"
// into two tokens ("produktivita" + "t"). That inflated the reading unknown-word load and split
// objectives keys. Fix: compose first, fold the umlauts explicitly, then strip. Numeric tokens are
// not vocabulary, so pure-digit tokens are excluded too. Both definitions are reported below so the
// correction is auditable; no threshold was moved.
const foldLegacy = (value: string) => String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9 ]/g, " ");
const fold = (value: string) => String(value ?? "").normalize("NFC").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9 ]/g, " ");
const isVocabulary = (word: string) => !/^\d+$/.test(word);
const wordsWith = (value: string, folder: (input: string) => string) => [...new Set(folder(String(value ?? "")).split(/\s+/).filter((word) => word.length > 2 && isVocabulary(word) && !STOP.has(word)))];
const words = (value: string) => wordsWith(value, fold);
const stem = (word: string) => word.replace(/(chen|lein|ungen|ung|keiten|keit|heiten|heit|ieren|ieren|erte|ern|en|em|es|e|s)$/, "").slice(0, Math.max(4, word.length - 2));
const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0; };
const countWords = (value: string) => (String(value ?? "").match(/\S+/g) ?? []).length;

type ScoredItem = { id: string; options: readonly string[]; correctIndex: number; explanationAr: string };
const mcqOf = (lesson: (typeof lessons)[number]): ScoredItem[] => [
  ...lesson.exercises.filter((exercise): exercise is Extract<PracticeExercise, { type: "multiple-choice" }> => exercise.type === "multiple-choice"),
  ...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest,
].map((item) => ({ id: item.id, options: item.options, correctIndex: item.correctIndex, explanationAr: item.explanationAr }));

const positions = [0, 0, 0, 0]; let itemTotal = 0, longestCue = 0;
const allFeedbackLengths: number[] = [];
for (const lesson of lessons) {
  const texts: string[] = [];
  for (const exercise of lesson.exercises) texts.push(String((exercise as { explanationAr?: string }).explanationAr ?? "").trim());
  for (const question of [...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest]) texts.push(String(question.explanationAr ?? "").trim());
  for (const text of texts) allFeedbackLengths.push(text.length);
}
const shortExplanations: string[] = [], explanationLengths: number[] = [];
type Violation = { lessonId: string; modelWords: number; statedMin: number; statedMax: number };
const writingViolations: Violation[] = [], singleVariant: string[] = [], noOpVariantItems: string[] = [], untraceable: string[] = [];
const lessonsWithoutD: string[] = []; const listeningWords: number[] = []; const pronunciationCoverage: number[] = [];
let productiveTotal = 0;

// Definition v2 (2026-09-19): a word is "not yet taught" only when no lesson at this level OR
// BELOW it teaches it. The v1 definition compared a B2 text against B2 material alone, so every A1
// verb the learner had already studied was counted as unknown. Both numbers stay in the report so
// the correction is visible; thresholds were not moved, and this metric is still reported-only.
const LEVEL_ORDER = ["A1", "A2", "B1", "B2"];
const taughtByLevelLegacy = new Map<string, Set<string>>();
const taughtByLevel = new Map<string, Set<string>>();
const collect = (bag: Set<string>, lesson: (typeof lessons)[number], folder: (v: string) => string, stemmer: (w: string) => string) => {
  for (const phrase of lesson.phrases) wordsWith(phrase.de, folder).map(stemmer).forEach((word) => bag.add(word));
  for (const card of lesson.flashcards) wordsWith(card.frontDe, folder).map(stemmer).forEach((word) => bag.add(word));
  for (const entry of lesson.reading.glossary) { wordsWith(entry.surfaceForm, folder).map(stemmer).forEach((word) => bag.add(word)); wordsWith(entry.lemma, folder).map(stemmer).forEach((word) => bag.add(word)); }
};
for (const level of LEVEL_ORDER) {
  const upto = LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(level) + 1);
  const bag = new Set<string>();
  for (const lesson of lessons.filter((item) => upto.includes(item.level))) collect(bag, lesson, fold, stem);
  taughtByLevel.set(level, bag);

  const legacyBag = new Set<string>();
  const legacyStem = (word: string) => word.replace(/(chen|lein|ungen|ung|keiten|keit|heiten|heit|ieren|erte|ern|en|em|es|e|s)$/, "").slice(0, Math.max(4, word.length - 2));
  for (const lesson of lessons.filter((item) => item.level === level)) collect(legacyBag, lesson, foldLegacy, legacyStem);
  taughtByLevelLegacy.set(level, legacyBag);
}
const unknownLoad: number[] = [];
// Per-lesson unknown list, so a high load is actionable: which exact words a glossary entry has to cover.
const unknownWordsByLesson: Array<{ lessonId: string; level: string; pct: number; unknown: string[] }> = [];
const unknownLoadByLevel = new Map<string, number[]>(LEVEL_ORDER.map((level) => [level, []]));
const unknownLoadLegacy: number[] = [];

for (const lesson of lessons) {
  const items = mcqOf(lesson);
  if (!items.some((item) => item.correctIndex === 3)) lessonsWithoutD.push(lesson.id);
  for (const item of items) {
    itemTotal++; positions[item.correctIndex]++;
    const lengths = item.options.map((option: string) => String(option).trim().replace(/[.!?]$/, "").length);
    const longest = Math.max(...lengths);
    if (lengths[item.correctIndex] === longest && lengths.filter((length: number) => length === longest).length === 1) longestCue++;
    const size = String(item.explanationAr ?? "").trim().length;
    explanationLengths.push(size);
    if (size < 40) shortExplanations.push(`${lesson.id}:${item.id}`);
  }
  const stated = String(lesson.writing.promptDe).match(/(\d{2,3})\s*(?:bis|-|–)\s*(\d{2,3})\s*Wörter/i);
  if (stated) {
    const model = countWords(lesson.writing.modelDe);
    if (model < Number(stated[1]) || model > Number(stated[2])) writingViolations.push({ lessonId: lesson.id, modelWords: model, statedMin: Number(stated[1]), statedMax: Number(stated[2]) });
  }
  for (const exercise of lesson.exercises) {
    if (exercise.type === "multiple-choice" || exercise.type === "matching") continue;
    productiveTotal++;
    // Breadth is counted on DISTINCT NORMALIZED forms, not on the number of listed strings:
    // `normalizeGermanText` already folds case and strips punctuation, so a variant that only adds a
    // full stop is unreachable and must never buy a place in this metric (accepted-answer-hygiene-v1).
    if (noOpAcceptedVariants(exercise.acceptedAnswers).length) noOpVariantItems.push(`${lesson.id}:${exercise.id}`);
    if (distinctAcceptedForms(exercise.acceptedAnswers).length <= 1) singleVariant.push(`${lesson.id}:${exercise.id}`);
  }
  const corpus = fold(JSON.stringify([lesson.theory, lesson.exercises, lesson.reading, lesson.listening, lesson.writing, lesson.speaking, lesson.mediation, lesson.mistakes, lesson.phrases, lesson.flashcards, lesson.pronunciation, lesson.entry]));
  lesson.objectives.forEach((objective, index) => {
    // Covered if ANY content word of the German can-do appears in the lesson (whole word or stem).
    // Objectives themselves are excluded from the corpus so a lesson cannot vouch for itself.
    const keys = words(objective.de);
    if (keys.length && !keys.some((key) => corpus.includes(key) || (key.length > 3 && corpus.includes(stem(key))))) untraceable.push(`${lesson.id}#${index} ${objective.de}`);
  });
  listeningWords.push(countWords(lesson.listening.transcriptDe));
  pronunciationCoverage.push(100 * lesson.pronunciation.items.length / Math.max(1, lesson.phrases.length));
  const taught = taughtByLevel.get(lesson.level)!;
  const contentWords = words(lesson.reading.textDe);
  const unknownWords = contentWords.filter((word) => !taught.has(stem(word)));
  const pct = (100 * unknownWords.length) / Math.max(1, contentWords.length);
  unknownWordsByLesson.push({ lessonId: lesson.id, level: lesson.level, pct: Number(pct.toFixed(1)), unknown: unknownWords.slice(0, 16) });
  unknownLoad.push(pct); unknownLoadByLevel.get(lesson.level)!.push(pct);
  const legacyWords = wordsWith(lesson.reading.textDe, foldLegacy);
  unknownLoadLegacy.push(100 * legacyWords.filter((word) => !taughtByLevelLegacy.get(lesson.level)!.has(stem(word))).length / Math.max(1, legacyWords.length));
}

const shares = positions.map((count) => (100 * count) / Math.max(1, itemTotal));
const issues: string[] = [];
if (writingViolations.length > thresholds.writingModelRangeViolations) issues.push(`writing model answers outside their own stated range: ${writingViolations.length} (allowed ${thresholds.writingModelRangeViolations})`);
const overPosition = shares.findIndex((share) => share > thresholds.maxPositionSharePct);
const underPosition = shares.findIndex((share) => share < thresholds.minPositionSharePct);
if (overPosition >= 0) issues.push(`answer position ${"ABCD"[overPosition]} carries ${shares[overPosition].toFixed(1)}% (max ${thresholds.maxPositionSharePct}%)`);
if (underPosition >= 0) issues.push(`answer position ${"ABCD"[underPosition]} carries ${shares[underPosition].toFixed(1)}% (min ${thresholds.minPositionSharePct}%)`);
const cuePct = (100 * longestCue) / Math.max(1, itemTotal);
if (cuePct > thresholds.longestOptionCuePctMax) issues.push(`longest option is the key in ${cuePct.toFixed(1)}% of items (max ${thresholds.longestOptionCuePctMax}%)`);
const singleShare = (100 * singleVariant.length) / Math.max(1, productiveTotal);
if (singleShare > thresholds.singleVariantSharePctMax) issues.push(`productive exercises with one accepted string: ${singleShare.toFixed(1)}% (max ${thresholds.singleVariantSharePctMax}%)`);
if (noOpVariantItems.length > thresholds.noOpAcceptedVariantsMax) issues.push(`productive exercises listing an unreachable accepted variant: ${noOpVariantItems.length} (max ${thresholds.noOpAcceptedVariantsMax})`);
const explanationMedian = median(explanationLengths);
if (explanationMedian < thresholds.explanationMedianCharsMin) issues.push(`median explanation length ${explanationMedian} chars (min ${thresholds.explanationMedianCharsMin})`);

const report = {
  format: "dwnb-lesson-quality-audit", version: "lesson-quality-v1", generatedAt: "2026-09-17",
  lessons: lessons.length, thresholds,
  multipleChoice: { items: itemTotal, positions: { A: positions[0], B: positions[1], C: positions[2], D: positions[3] }, sharePct: shares.map((share) => Number(share.toFixed(2))), lessonsWithoutPositionD: lessonsWithoutD.length, longestOptionIsKeyPct: Number(cuePct.toFixed(2)) },
  writing: { statedRangeTasks: lessons.filter((lesson) => /(\d{2,3})\s*(?:bis|-|–)\s*(\d{2,3})\s*Wörter/i.test(String(lesson.writing.promptDe))).length, violations: writingViolations.length, violationList: writingViolations },
  productive: {
    total: productiveTotal,
    singleAcceptedString: singleVariant.length,
    sharePct: Number(singleShare.toFixed(2)),
    broadenedExercises: productiveTotal - singleVariant.length,
    acceptedAnswerHygieneVersion: ACCEPTED_ANSWER_HYGIENE_VERSION,
    noOpVariants: noOpVariantItems.length,
    noOpVariantItems,
    hygienePolicy: NO_OP_VARIANT_POLICY,
    countingRule: "An exercise counts as broadened only when it lists at least two DISTINCT normalized forms; sentence-initial capitalization or a trailing full stop is never a second form (P1-398 ceiling <=25% is evaluated on this basis).",
  },
  feedback: {
    allItems: allFeedbackLengths.length,
    allMedianChars: median(allFeedbackLengths),
    allUnder60Chars: allFeedbackLengths.filter((size) => size < 60).length,
    allMissing: allFeedbackLengths.filter((size) => size === 0).length, explanationMedianChars: explanationMedian, under40Chars: shortExplanations.length, ofItems: itemTotal },
  objectives: {
    total: lessons.reduce((sum, lesson) => sum + lesson.objectives.length, 0),
    lexicalReviewPrompts: untraceable.length,
    reviewPromptList: untraceable,
    rule: "A can-do is flagged when none of its German content words (or stems) occur in the lesson body. This is a review prompt, not a defect count: 8 of the currently flagged objectives were inspected by hand (b2-22#4, a1-20#0, a1-11#2, b1-09#3, a1-04#0, a1-18#1, a1-10#2, a1-19#3) and all eight are taught and assessed through instances (Mutter/Vater/Bruder, Wetter/Regen/Sonne, Fahrkarte/Zug, b2-22-e8 plus theory t4) rather than the objective wording. The check is therefore reported, not enforced.",
  },
  listening: { medianWords: median(listeningWords), minWords: Math.min(...listeningWords), maxWords: Math.max(...listeningWords), medianSecondsAt175wpm: Math.round((median(listeningWords) / 175) * 60) },
  reading: {
    definition: "cumulative-taught-v2 · fixed fold · numeric tokens excluded",
    medianUnknownWordPct: Number(median(unknownLoad).toFixed(1)),
    medianByLevel: Object.fromEntries(LEVEL_ORDER.map((lvl) => { const sub = unknownLoadByLevel.get(lvl)!; return [lvl, Number(median(sub).toFixed(1))]; })),
    lessonsOver45Pct: unknownLoad.filter((pct) => pct > 45).length,
    maxUnknownWordPct: Number(Math.max(...unknownLoad).toFixed(1)),
    measurementNote: "Unknown = a German content word in the reading text that no phrase, flashcard front, or reading glossary entry teaches anywhere at this level or below (stemmed comparison). Reported, not thresholded: the stemmer cannot unify strong-verb changes (spricht/sprechen) or plural umlauts (Satz/Sätze) without a lemma dictionary, and proper names count as unknown, so the figure is a conservative upper bound. Turning it into a gate requires a lemmatizer first.",
    legacyFoldMedianUnknownWordPct: Number(median(unknownLoadLegacy).toFixed(1)),
    worstLessons: [...unknownLoad.entries()].map(([index, pct]) => ({ id: lessons[index]!.id, pct: Number(pct.toFixed(1)) })).sort((a, b) => b.pct - a.pct).slice(0, 12),
    // Only lessons above the 25% median target are listed; the arrays are capped, so the report stays small.
    // Every over-threshold lesson is listed on purpose: the cap at 16 hid exactly the
    // near-threshold band that a median-targeted batch has to work on.
    unknownByLesson: unknownWordsByLesson
      .filter((entry) => entry.pct > 25)
      .sort((a, b) => b.pct - a.pct),
  },
  pronunciation: { medianCoveragePct: Number(median(pronunciationCoverage).toFixed(1)) },
  policyNotes: [
    "Exact-match grading with explicit orthographic variants only is a tested policy (tests/unit/content-integrity.test.ts:77-78); the remedy is more acceptedAnswers in data plus ADR-078, not comparator folding.",
    "Accepted-answer breadth is measured after normalization (accepted-answer-hygiene-v1). On 2026-09-23 the tree listed 150 variants that normalized onto a form already listed, which made this metric read 50.9% while the grader actually accepted exactly one string in 87.3% of productive exercises; the padding was removed and the same batch added `noOpVariants` as a hard gate at 0, so breadth can no longer be bought with a capital letter or a full stop.",
    "Feedback length is measured twice: over the 1,250 multiple-choice items (thresholded) and over every scored item including fill-blank, word-ordering, error-correction and matching (reported, not thresholded yet, so raising the authoring bar cannot silently hide behind a narrower scope).",
    "Objective traceability is lexical by design. Under the previous stricter rule (keys >4 chars, entry/dialogue excluded) 37 objectives were flagged; after widening the corpus and accepting any content word, the count is recomputed here. Four flagged cases were also inspected by hand and are taught and assessed: b2-22#4 (b2-22-e8 + theory t4), a1-20#0 (Weg/links/rechts/geradeaus in phrases and dialogue), a1-11#2 (möchte/bestellen), b1-09#3 (Pilotversuch/vorschlagen). A lexical flag is a prompt to look, not proof of a gap.",
    "This audit measures item quality, not human pedagogical review; a green run here never licenses an official-course claim.",
  ],
  status: issues.length ? "fail" : "pass", issues,
} as const;

await mkdir(join(process.cwd(), "reports"), { recursive: true });
if (process.argv.includes("--write")) { await writeFile(join(process.cwd(), REPORT), JSON.stringify(report, null, 2) + "\n", "utf8"); console.log(`Wrote ${REPORT}.`); }
const line = `Lesson quality: ${report.multipleChoice.items} scored items · answer mix ${report.multipleChoice.sharePct.join("/")} · longest-key cue ${report.multipleChoice.longestOptionIsKeyPct}% · writing-range violations ${report.writing.violations} · single-string productive items ${report.productive.sharePct}% · unreachable accepted variants ${report.productive.noOpVariants} · explanation median ${report.feedback.explanationMedianChars} · objective review-prompts ${report.objectives.lexicalReviewPrompts} · listening median ${report.listening.medianWords} words (~${report.listening.medianSecondsAt175wpm}s).`;
if (process.argv.includes("--strict")) {
  if (issues.length) { console.error(`${line}\nLesson quality gate failed:\n- ${issues.join("\n- ")}`); process.exitCode = 1; }
  else console.log(`Lesson quality gate passed: ${issues.length} issues. ${line}`);
} else console.log(line);
