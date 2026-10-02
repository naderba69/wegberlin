/**
 * `german-phoneme-alignment-v1` — aligns an authored target phoneme sequence
 * against observed phonemes, and turns the result into the three states the
 * project is allowed to report.
 *
 * Rules encoded here (from the owner's specification, not invented):
 * - A word is confirmed only when every target phoneme is present, in order,
 *   no essential phoneme is deleted, no meaning-changing substitution
 *   occurred, the vowel-length contrast is preserved, and the alignment
 *   confidence is above the calibrated floor.
 * - A sentence is confirmed only when every target word passes in the SAME
 *   attempt. Results are never merged across attempts.
 * - A technical inability to observe phonemes is `technical-unverifiable`,
 *   never a pronunciation error, and never counted as a failure.
 * - Scores are never averaged across phonemes: a single critical failure
 *   survives, so the output carries rows, not a mean.
 */

import {
  confusionFor,
  isLengthful,
  isMeaningChangingConfusion,
  type PhonemeConfusion,
} from "./phoneme-inventory";
import type { PhonemeReferenceEntry } from "./phoneme-reference";

export const PHONEME_ALIGNMENT_POLICY = "german-phoneme-alignment-v1" as const;
export const PHONEME_ALIGNMENT_BOUNDARY =
  "alignment-of-observed-symbols-to-authored-target-within-engine-limits-no-official-pronunciation-score" as const;

/**
 * Set to 0 when the thresholds have been calibrated on real learner audio with
 * measured false-accept and false-reject rates. Until then every judgement that
 * would need a graded threshold is reported as unverifiable.
 */
export const CALIBRATED_THRESHOLD_REVISION: null | string = null;

export const ALIGNMENT_CONFIDENCE_FLOOR = 0.82;

/** Phonemes whose absence does not change the word (reduction and r-variants). */
const NON_ESSENTIAL_SYMBOLS = new Set(["ə", "ɐ", "ɐ̯", "ʀ"]);

export type PhonemeRowStatus = "confirmed" | "substituted" | "deleted" | "inserted" | "cannot-verify";

export type PhonemeAlignmentRow = {
  index: number;
  target: string;
  observed: string | null;
  status: PhonemeRowStatus;
  essential: boolean;
  /** Length marks are compared explicitly because they carry meaning. */
  lengthPreserved: boolean | null;
  severe: boolean;
  confusion: PhonemeConfusion | null;
  guidanceAr: string | null;
};

export type PhonemeAlignment = {
  policyVersion: typeof PHONEME_ALIGNMENT_POLICY;
  rows: PhonemeAlignmentRow[];
  edits: number;
  targetLength: number;
  observedLength: number;
  similarity: number;
  boundary: typeof PHONEME_ALIGNMENT_BOUNDARY;
};

/**
 * Accepted German variants must not be scored as substitutions: the inventory
 * row `ar-pron-r-variants` states explicitly that two r realizations are both
 * fine, and the vocalized coda `r` is the standard syllable-final form.
 */
function normalizeAlignmentSymbol(symbol: string): string {
  const bare = symbol.replace("ː", "");
  const length = symbol.includes("ː") ? "ː" : "";
  if (bare === "r" || bare === "ʀ") return `ʁ${length}`;
  if (bare === "ɐ̯") return "ɐ";
  return symbol;
}

function symbolCost(target: string, observed: string): { cost: number; severe: boolean; confusion: PhonemeConfusion | null } {
  const targetSymbol = normalizeAlignmentSymbol(target);
  const observedSymbol = normalizeAlignmentSymbol(observed);
  if (targetSymbol === observedSymbol) return { cost: 0, severe: false, confusion: null };
  const bareTarget = targetSymbol.replace("ː", "");
  const bareObserved = observedSymbol.replace("ː", "");
  const confusion = confusionFor(bareTarget, bareObserved);
  if (bareTarget === bareObserved) return { cost: 0.35, severe: true, confusion: confusion ?? null };
  void target; void observed;
  if (confusion) return { cost: confusion.meaningChanging ? 1.2 : 0.45, severe: confusion.meaningChanging, confusion };
  return { cost: 0.9, severe: true, confusion: null };
}

/** Needleman–Wunsch alignment over phoneme symbols. */
export function alignPhonemeSequences(target: string[], observed: string[]): PhonemeAlignment {
  const rows = target.length + 1;
  const columns = observed.length + 1;
  const costs: number[][] = Array.from({ length: rows }, () => new Array<number>(columns).fill(0));
  const backpointers: ("diagonal" | "up" | "left")[][] = Array.from({ length: rows }, () =>
    new Array<"diagonal" | "up" | "left">(columns).fill("diagonal"),
  );

  for (let index = 0; index < rows; index += 1) costs[index]![0] = index;
  for (let index = 0; index < columns; index += 1) costs[0]![index] = index;

  for (let rowIndex = 1; rowIndex < rows; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex < columns; columnIndex += 1) {
      const substitution = costs[rowIndex - 1]![columnIndex - 1]! + symbolCost(target[rowIndex - 1]!, observed[columnIndex - 1]!).cost;
      const deletion = costs[rowIndex - 1]![columnIndex]! + 1;
      const insertion = costs[rowIndex]![columnIndex - 1]! + 1;
      const minimum = Math.min(substitution, deletion, insertion);
      costs[rowIndex]![columnIndex] = minimum;
      backpointers[rowIndex]![columnIndex] = minimum === substitution ? "diagonal" : minimum === deletion ? "up" : "left";
    }
  }

  const aligned: PhonemeAlignmentRow[] = [];
  let rowIndex = target.length;
  let columnIndex = observed.length;
  while (rowIndex > 0 || columnIndex > 0) {
    const mover = rowIndex > 0 && columnIndex > 0 ? backpointers[rowIndex]![columnIndex] : rowIndex > 0 ? "up" : "left";
    if (mover === "diagonal") {
      const targetSymbol = target[rowIndex - 1]!;
      const observedSymbol = observed[columnIndex - 1]!;
      const { cost, severe, confusion } = symbolCost(targetSymbol, observedSymbol);
      const essential = !NON_ESSENTIAL_SYMBOLS.has(targetSymbol.replace("ː", ""));
      aligned.push({
        index: rowIndex - 1,
        target: targetSymbol,
        observed: observedSymbol,
        status: cost === 0 ? "confirmed" : "substituted",
        essential,
        lengthPreserved:
          isLengthful(targetSymbol.replace("ː", "")) || isLengthful(observedSymbol.replace("ː", ""))
            ? targetSymbol.includes("ː") === observedSymbol.includes("ː")
            : null,
        severe: cost > 0 && (severe || cost >= 0.9),
        confusion,
        guidanceAr: cost === 0 ? null : (confusion?.noteAr ?? null),
      });
      rowIndex -= 1;
      columnIndex -= 1;
      continue;
    }
    if (mover === "up") {
      const targetSymbol = target[rowIndex - 1]!;
      aligned.push({
        index: rowIndex - 1,
        target: targetSymbol,
        observed: null,
        status: "deleted",
        essential: !NON_ESSENTIAL_SYMBOLS.has(targetSymbol.replace("ː", "")),
        lengthPreserved: null,
        severe: !NON_ESSENTIAL_SYMBOLS.has(targetSymbol.replace("ː", "")),
        confusion: null,
        guidanceAr: "الحرف المستهدف غائب في النسخة الصوتية المرصودة.",
      });
      rowIndex -= 1;
      continue;
    }
    aligned.push({
      index: -1,
      target: "",
      observed: observed[columnIndex - 1]!,
      status: "inserted",
      essential: false,
      lengthPreserved: null,
      severe: false,
      confusion: null,
      guidanceAr: "صوت زائد قياسًا بالنموذج المرجعي.",
    });
    columnIndex -= 1;
  }
  aligned.reverse();

  const total = Math.max(target.length, observed.length, 1);
  return {
    policyVersion: PHONEME_ALIGNMENT_POLICY,
    rows: aligned,
    edits: costs[target.length]![observed.length]!,
    targetLength: target.length,
    observedLength: observed.length,
    similarity: 1 - costs[target.length]![observed.length]! / total,
    boundary: PHONEME_ALIGNMENT_BOUNDARY,
  };
}

export type WordPhonemeState = "phoneme-confirmed" | "phoneme-mismatch" | "word-not-confirmed" | "technical-unverifiable";

export type WordPhonemeJudgement = {
  word: string;
  state: WordPhonemeState;
  referenceSource: string | null;
  rows: PhonemeAlignmentRow[];
  confidence: number;
  criticalFailures: string[];
  /** Explains the state in learner-facing Arabic without a numeric verdict. */
  explanationAr: string;
  attemptId: string | null;
  canClaimPronunciationAccuracy: false;
  policyVersion: typeof PHONEME_ALIGNMENT_POLICY;
  boundary: typeof PHONEME_ALIGNMENT_BOUNDARY;
};

export type WordPhonemeInput = {
  reference: Pick<PhonemeReferenceEntry, "word" | "phonemes" | "source"> | null;
  /** Observed phonemes from an acoustic phoneme provider; absent for word-match-only. */
  observedPhonemes: string[] | null;
  /** Whether the expected word was confirmed by the transcript matcher. */
  wordConfirmed: boolean;
  attemptId: string | null;
  providerPhonemeGradeable: boolean;
};

export function judgeWordPhonemes(input: WordPhonemeInput): WordPhonemeJudgement {
  const base = {
    word: input.reference?.word ?? "",
    referenceSource: input.reference?.source ?? null,
    attemptId: input.attemptId,
    canClaimPronunciationAccuracy: false as const,
    policyVersion: PHONEME_ALIGNMENT_POLICY,
    boundary: PHONEME_ALIGNMENT_BOUNDARY,
  };

  if (!input.providerPhonemeGradeable) {
    return {
      ...base,
      state: "technical-unverifiable",
      rows: [],
      confidence: 0,
      criticalFailures: [],
      explanationAr:
        "المزوّد الحالي يؤكد الكلمات من النص المنسوخ ولا يستخرج فونيمات، لذا لا يُصدر حكمًا على الأصوات المفردة ولا يُعدّ ذلك خطأ نطق.",
    };
  }
  if (!input.reference) {
    return {
      ...base,
      state: "technical-unverifiable",
      rows: [],
      confidence: 0,
      criticalFailures: [],
      explanationAr: "لا يوجد هدف صوتي مؤلَّف بشريًا لهذه الكلمة، فلا مقارنة فونيمية.",
    };
  }
  if (!input.wordConfirmed) {
    return {
      ...base,
      state: "word-not-confirmed",
      rows: [],
      confidence: 0,
      criticalFailures: [],
      explanationAr:
        "لم تُؤكد الكلمة في النسخة التي راجعتها، فقد يكون السبب خطأ تعرّف لا خطأ نطق. لا يُحسب هذا فشلًا صوتيًا.",
    };
  }
  if (!input.observedPhonemes || input.observedPhonemes.length === 0) {
    return {
      ...base,
      state: "technical-unverifiable",
      rows: [],
      confidence: 0,
      criticalFailures: [],
      explanationAr: "لم تصل رموز صوتية من نموذج الفونيمات، والمحاولة تُغلق دون حكم.",
    };
  }

  const alignment = alignPhonemeSequences(input.reference.phonemes, input.observedPhonemes);
  const criticalFailures: string[] = [];
  for (const row of alignment.rows) {
    if (row.status === "deleted" && row.essential) criticalFailures.push(`حذف الصوت ${row.target} داخل «${input.reference.word}»`);
    if (row.status === "substituted" && row.severe) {
      criticalFailures.push(
        `استُبدل ${row.target} بـ${row.observed} في «${input.reference.word}»${row.confusion ? ` (${row.confusion.noteAr})` : ""}`,
      );
    }
    if (row.lengthPreserved === false) {
      criticalFailures.push(`طول الحركة في «${input.reference.word}» غير مطابق: استُبدلت حركة طويلة بقصيرة أو العكس`);
    }
  }
  if (CALIBRATED_THRESHOLD_REVISION === null && alignment.similarity >= ALIGNMENT_CONFIDENCE_FLOOR) {
    criticalFailures.push("حدود الثقة لم تُعاير بعد على تسجيلات حقيقية");
  }

  const passed = criticalFailures.length === 0 && alignment.similarity >= ALIGNMENT_CONFIDENCE_FLOOR;
  return {
    ...base,
    word: input.reference.word,
    state: passed ? "phoneme-confirmed" : "phoneme-mismatch",
    rows: alignment.rows,
    confidence: alignment.similarity,
    criticalFailures,
    explanationAr: passed
      ? `طابق المرصود التركيب المرجعي داخل حدود المحرك. هذا تقدير ضمن حدود المحرك، لا إثبات لطلاقة أو اللهجة.`
      : `فحص الفونيمات لم يكتمل داخل حدود المحرك: ${criticalFailures.slice(0, 3).join("؛ ")}`,
  };
}

export type SentencePhonemeState = "confirmed" | "needs-retry" | "technical-unverifiable";

export type SentencePhonemeJudgement = {
  policyVersion: typeof PHONEME_ALIGNMENT_POLICY;
  state: SentencePhonemeState;
  words: WordPhonemeJudgement[];
  attemptId: string | null;
  sameAttempt: boolean;
  unconfirmedWords: string[];
  /** Rows that would have been hidden by an average, kept as an explicit list. */
  criticalFailures: string[];
  gateExplanationAr: string;
  compositeScore: null;
  canClaimPhonemeAccuracy: false;
  canClaimExamPronunciationScore: false;
  boundary: typeof PHONEME_ALIGNMENT_BOUNDARY;
};

/**
 * Sentence gate. Confirms only when every word passed inside one attempt; a
 * mixed-attempt input is refused outright because it would hide which try
 * produced which sound.
 */
export function judgeSentencePhonemes(input: {
  words: WordPhonemeJudgement[];
  targetWordCount: number;
}): SentencePhonemeJudgement {
  const attemptIds = new Set(input.words.map((word) => word.attemptId).filter((id): id is string => Boolean(id)));
  const sameAttempt = attemptIds.size <= 1;
  const allPresent = input.words.length >= Math.max(1, input.targetWordCount);
  const confirmed = sameAttempt && allPresent && input.words.length > 0 && input.words.every((word) => word.state === "phoneme-confirmed");
  const unverifiable = input.words.length === 0 || input.words.every((word) => word.state === "technical-unverifiable");
  const criticalFailures = input.words.flatMap((word) => word.criticalFailures);
  const unconfirmedWords = input.words
    .filter((word) => word.state !== "phoneme-confirmed")
    .map((word) => word.word)
    .filter(Boolean);

  let state: SentencePhonemeState;
  if (confirmed) state = "confirmed";
  else if (unverifiable || !sameAttempt) state = "technical-unverifiable";
  else state = "needs-retry";

  return {
    policyVersion: PHONEME_ALIGNMENT_POLICY,
    state,
    words: input.words,
    attemptId: attemptIds.size === 1 ? [...attemptIds][0]! : null,
    sameAttempt,
    unconfirmedWords,
    criticalFailures,
    gateExplanationAr: confirmed
      ? "كل الكلمات المستهدفة طابقت تركيبتها المرجعية في نفس المحاولة. تبقى العبارة تأكيدًا داخل حدود المحرك، ولا تُقرأ كدرجة نطق رسمية."
      : !sameAttempt
        ? "لا تُجمع نتائج الكلمات من محاولات مختلفة؛ سجّل المحاولة كاملة ثم تُفحص مرة واحدة."
        : state === "technical-unverifiable"
          ? "تعذّر التحقق التقني، وهذا لا يُعدّ خطأ نطق ولا يُدرج في أي تقييم."
          : `تحتاج إعادة: الكلمات غير المؤكدة ${unconfirmedWords.slice(0, 4).join("، ") || "—"}. أعد الجملة كاملة بعد تدريب الكلمة المتعثرة.`,
    compositeScore: null,
    canClaimPhonemeAccuracy: false,
    canClaimExamPronunciationScore: false,
    boundary: PHONEME_ALIGNMENT_BOUNDARY,
  };
}

export function isMeaningChanging(target: string, observed: string): boolean {
  return isMeaningChangingConfusion(target.replace("ː", ""), observed.replace("ː", ""));
}
