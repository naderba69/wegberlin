import { normalizeSimilarityText, similarityScore } from "./content-similarity-review";

/**
 * P1-92 — comparison of the project's German text against an external reference corpus
 * (e.g. publisher sample pages or a copy the owner lawfully holds).
 *
 * The reference text is read only from a directory outside the repository and is never
 * returned by these functions: results carry our own segment IDs, reference segment
 * indices, and scores. Copies made for the comparison fall under § 44b UrhG (text and data
 * mining of lawfully accessible works) and must be deleted when no longer needed.
 */
export const EXTERNAL_REFERENCE_COMPARISON_POLICY = "external-reference-comparison-v1" as const;

export const EXTERNAL_COMPARISON_THRESHOLDS = {
  minTokens: 5,
  minLengthRatio: 0.68,
  nearScore: 0.84,
  nearTokenScore: 0.82,
  nearOrderScore: 0.65,
  verbatimRunTokens: 7,
} as const;

export type ComparisonSegment = { id: string; text: string };
export type ExternalMatch = {
  ourId: string;
  referenceFile: string;
  referenceIndex: number;
  kind: "exact" | "near" | "verbatim-run";
  score: number;
  tokenScore: number;
  orderScore: number;
  sharedRunTokens: number;
  tokenCount: number;
};

const ARABIC_RUN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/gu;

function tokens(text: string) {
  return normalizeSimilarityText(text).split(" ").filter((token) => token.length > 0);
}

/** Split a string into German sentence-like segments; Arabic runs act as boundaries. */
export function segmentGermanText(value: string): string[] {
  return value
    .replace(ARABIC_RUN, "\n")
    .split(/(?<=[.!?…])\s+|\n+|\s+[–—]\s+|\s\/\s/u)
    .map((part) => part.trim())
    .filter((part) => tokens(part).length >= EXTERNAL_COMPARISON_THRESHOLDS.minTokens);
}

function shingles(list: string[], size: number) {
  const out = new Set<string>();
  for (let index = 0; index + size <= list.length; index += 1) out.add(list.slice(index, index + size).join(" "));
  return out;
}

function longestSharedRun(left: string[], right: string[]) {
  let best = 0;
  const previous = new Array<number>(right.length + 1).fill(0);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = 0;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = left[i - 1] === right[j - 1] ? diagonal + 1 : 0;
      if (previous[j] > best) best = previous[j];
      diagonal = above;
    }
  }
  return best;
}

export function compareWithReference(
  ours: ComparisonSegment[],
  reference: Array<{ file: string; segments: string[] }>,
) {
  const t = EXTERNAL_COMPARISON_THRESHOLDS;
  const refEntries = reference.flatMap((source) => source.segments.map((text, index) => ({
    file: source.file, index, text, tokens: tokens(text), normalized: normalizeSimilarityText(text),
  })));
  const byToken = new Map<string, number[]>();
  refEntries.forEach((entry, position) => {
    for (const token of new Set(entry.tokens)) {
      const list = byToken.get(token) ?? [];
      list.push(position);
      byToken.set(token, list);
    }
  });
  const refShingles = refEntries.map((entry) => shingles(entry.tokens, t.verbatimRunTokens));
  const matches: ExternalMatch[] = [];
  let comparedPairs = 0;
  const seen = new Set<string>();
  const closest = new Map<number, { ourId: string; score: number }>();
  for (const segment of ours) {
    const ourTokens = tokens(segment.text);
    if (ourTokens.length < t.minTokens) continue;
    const ourNormalized = ourTokens.join(" ");
    const ourShingles = shingles(ourTokens, t.verbatimRunTokens);
    const candidates = new Set<number>();
    for (const token of new Set(ourTokens)) for (const position of byToken.get(token) ?? []) candidates.add(position);
    for (const position of candidates) {
      const ref = refEntries[position];
      comparedPairs += 1;
      const key = `${segment.id}::${ref.file}::${ref.index}`;
      if (seen.has(key)) continue;
      const exact = ref.normalized === ourNormalized;
      let sharedVerbatim = false;
      for (const shingle of ourShingles) if (refShingles[position].has(shingle)) { sharedVerbatim = true; break; }
      const lengthRatio = Math.min(ourTokens.length, ref.tokens.length) / Math.max(ourTokens.length, ref.tokens.length);
      const metrics = similarityScore(segment.text, ref.text);
      if (lengthRatio >= t.minLengthRatio && metrics.score > (closest.get(position)?.score ?? 0)) closest.set(position, { ourId: segment.id, score: metrics.score });
      const near = lengthRatio >= t.minLengthRatio && metrics.score >= t.nearScore
        && metrics.tokenScore >= t.nearTokenScore && metrics.orderScore >= t.nearOrderScore;
      if (!exact && !near && !sharedVerbatim) continue;
      seen.add(key);
      matches.push({
        ourId: segment.id,
        referenceFile: ref.file,
        referenceIndex: ref.index,
        kind: exact ? "exact" : near ? "near" : "verbatim-run",
        score: exact ? 1 : metrics.score,
        tokenScore: exact ? 1 : metrics.tokenScore,
        orderScore: exact ? 1 : metrics.orderScore,
        sharedRunTokens: longestSharedRun(ourTokens, ref.tokens),
        tokenCount: ourTokens.length,
      });
    }
  }
  matches.sort((left, right) => right.score - left.score || left.ourId.localeCompare(right.ourId));
  return {
    policyVersion: EXTERNAL_REFERENCE_COMPARISON_POLICY,
    thresholds: t,
    ourSegmentCount: ours.length,
    referenceSegmentCount: refEntries.length,
    comparedPairCount: comparedPairs,
    matchCount: matches.length,
    matches,
    closestBelowThreshold: [...closest.entries()]
      .map(([position, best]) => ({ referenceFile: refEntries[position].file, referenceIndex: refEntries[position].index, ourId: best.ourId, score: best.score }))
      .sort((left, right) => right.score - left.score || left.ourId.localeCompare(right.ourId))
      .slice(0, 12),
  };
}
