import { buildAnswerIntegrityAudit, type AnswerAuditRow, type ProductiveTaskAuditRow } from "./answer-integrity";
import {
  authorizedExternalReferenceCorpora,
  CONTENT_REVIEW_STATE_POLICY,
  CONTENT_SIMILARITY_POLICY,
  contentReviewOverrides,
  similarityExemptions,
  type ContentReviewOverride,
  type ReviewDimension,
  type SimilarityExemption,
} from "@/config/content-originality-review-registry";

export type SimilarityCorpusEntry = {
  id: string;
  contextId: string;
  scope: string;
  kind: "closed-question" | "productive-task";
  text: string;
};

const instructionStopTokens = new Set([
  "اختر", "أكمل", "رتب", "صحح", "السؤال", "الصحيح", "الصحيحة", "الجواب", "الإجابة",
  "wählen", "wählen sie", "richtige", "richtigen", "antwort", "ergänzen", "ordnen", "korrigieren", "satz",
]);

export function normalizeSimilarityText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("de-DE")
    .replace(/[\u064B-\u065F\u0670]/gu, "")
    .replace(/_{2,}|\[?lücke\s*\d*\]?/giu, " ")
    .replace(/[^\p{L}\p{N}ßäöü]+/gu, " ")
    .trim().replace(/\s+/g, " ");
}

function contentTokens(value: string) {
  return normalizeSimilarityText(value).split(" ").filter((token) => token.length > 1 && !instructionStopTokens.has(token));
}

function setJaccard(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function bigrams(tokens: string[]) {
  return new Set(tokens.slice(0, -1).map((token, index) => `${token} ${tokens[index + 1]}`));
}

function stablePair(leftId: string, rightId: string) {
  return [leftId, rightId].sort().join("::");
}

export function similarityScore(leftText: string, rightText: string) {
  const leftTokens = contentTokens(leftText);
  const rightTokens = contentTokens(rightText);
  const tokenScore = setJaccard(new Set(leftTokens), new Set(rightTokens));
  const orderScore = setJaccard(bigrams(leftTokens), bigrams(rightTokens));
  const score = tokenScore * 0.6 + orderScore * 0.4;
  return {
    score: Math.round(score * 10_000) / 10_000,
    tokenScore: Math.round(tokenScore * 10_000) / 10_000,
    orderScore: Math.round(orderScore * 10_000) / 10_000,
    leftTokenCount: leftTokens.length,
    rightTokenCount: rightTokens.length,
  };
}

export function auditSimilarityEntries(entries: SimilarityCorpusEntry[], exemptions: SimilarityExemption[] = []) {
  const explicit = new Map(exemptions.map((item) => [stablePair(item.leftId, item.rightId), item]));
  const signatures = entries.map((entry) => ({ entry, normalized:normalizeSimilarityText(entry.text), tokens:contentTokens(entry.text) }));
  const pairs: Array<{
    leftId:string;rightId:string;leftScope:string;rightScope:string;score:number;tokenScore:number;orderScore:number;
    status:"issue"|"exempt-same-context"|"exempt-reviewed";reason?:string;
  }> = [];
  for (let leftIndex = 0; leftIndex < signatures.length; leftIndex += 1) {
    const left = signatures[leftIndex];
    if (left.tokens.length < 5) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < signatures.length; rightIndex += 1) {
      const right = signatures[rightIndex];
      if (right.tokens.length < 5) continue;
      const lengthRatio = Math.min(left.tokens.length, right.tokens.length) / Math.max(left.tokens.length, right.tokens.length);
      if (lengthRatio < 0.68) continue;
      const metrics = similarityScore(left.entry.text, right.entry.text);
      const exact = left.normalized === right.normalized;
      const near = metrics.score >= 0.84 && metrics.tokenScore >= 0.82 && metrics.orderScore >= 0.65;
      if (!exact && !near) continue;
      const reviewed = explicit.get(stablePair(left.entry.id, right.entry.id));
      const sameContext = left.entry.contextId === right.entry.contextId;
      pairs.push({
        leftId:left.entry.id,rightId:right.entry.id,leftScope:left.entry.scope,rightScope:right.entry.scope,
        score:exact?1:metrics.score,tokenScore:exact?1:metrics.tokenScore,orderScore:exact?1:metrics.orderScore,
        status:reviewed?"exempt-reviewed":sameContext?"exempt-same-context":"issue",
        reason:reviewed?.reason??(sameContext?"same authored context: deliberate teach→practice→assessment recycling":undefined),
      });
    }
  }
  return {
    policyVersion: CONTENT_SIMILARITY_POLICY,
    entryCount: entries.length,
    comparedPairCount: (entries.length * (entries.length - 1)) / 2,
    suspiciousPairCount: pairs.length,
    exemptSameContextCount: pairs.filter((pair)=>pair.status==="exempt-same-context").length,
    exemptReviewedCount: pairs.filter((pair)=>pair.status==="exempt-reviewed").length,
    issueCount: pairs.filter((pair)=>pair.status==="issue").length,
    pairs,
    issues:pairs.filter((pair)=>pair.status==="issue").map((pair)=>`${pair.leftId} ↔ ${pair.rightId}: near-duplicate ${pair.score}`),
    boundary:"Deterministic normalized token/bigram similarity scans the internal project corpus only. It is a lexical-semantic proxy, not embedding equivalence, plagiarism detection, copyright clearance, or comparison with Menschen/Hueber/official exam source text.",
  };
}

function contextId(row: AnswerAuditRow | ProductiveTaskAuditRow) {
  const lesson = row.id.match(/^[ab][12]-\d{2}/i)?.[0];
  if (lesson) return lesson.toLowerCase();
  if ("evidenceRef" in row) return row.evidenceRef.split(":")[0];
  return row.id.split(":")[0];
}

export function buildSimilarityCorpus(): SimilarityCorpusEntry[] {
  const audit = buildAnswerIntegrityAudit();
  return [
    ...audit.rows.map((row)=>({id:row.id,contextId:contextId(row),scope:row.scope,kind:"closed-question" as const,text:row.prompt})),
    ...audit.productiveTasks.map((row)=>({id:row.id,contextId:contextId(row),scope:row.scope,kind:"productive-task" as const,text:row.prompt})),
  ].sort((left,right)=>left.id.localeCompare(right.id));
}

function reviewState(id: string, dimension: ReviewDimension, overrides: ContentReviewOverride[]) {
  const override = overrides.find((item)=>item.contentId===id&&item.dimension===dimension);
  if (override) return override;
  const evidence = dimension === "german" ? "schema/language-boundary structural pass; independent German review pending"
    : dimension === "arabic" ? "schema/Bidi structural pass; independent Arabic review pending"
    : dimension === "cefr" ? "authored level tag and objective map present; independent CEFR review pending"
    : "originalContent author claim + internal near-duplicate scan; authorized external comparison and rights review pending";
  return {contentId:id,dimension,status:"automated-pass-human-pending" as const,evidence};
}

export function buildContentSimilarityReviewAudit() {
  const corpus = buildSimilarityCorpus();
  const similarity = auditSimilarityEntries(corpus, similarityExemptions);
  const reviewRows = corpus.map((entry)=>({
    contentId:entry.id,contextId:entry.contextId,scope:entry.scope,kind:entry.kind,
    german:reviewState(entry.id,"german",contentReviewOverrides),
    arabic:reviewState(entry.id,"arabic",contentReviewOverrides),
    cefr:reviewState(entry.id,"cefr",contentReviewOverrides),
    copyright:reviewState(entry.id,"copyright",contentReviewOverrides),
  }));
  const dimensions = ["german","arabic","cefr","copyright"] as const;
  const reviewCounts = Object.fromEntries(dimensions.map((dimension)=>[dimension,{
    total:reviewRows.length,
    automatedPassHumanPending:reviewRows.filter((row)=>row[dimension].status==="automated-pass-human-pending").length,
    independentlyReviewed:reviewRows.filter((row)=>row[dimension].status==="independently-reviewed").length,
  }]));
  return {
    format:"dwnb-content-similarity-review-audit",
    version:"content-similarity-review-audit-v1",
    generatedAt:"2026-09-07",
    similarity,
    reviewState:{policyVersion:CONTENT_REVIEW_STATE_POLICY,rowCount:reviewRows.length,reviewCounts,rows:reviewRows},
    externalReferenceCorpusCount:authorizedExternalReferenceCorpora.length,
    copyrightClearance:"pending-authorized-corpus-and-independent-review" as const,
    p1Status:{"92":"partial","293":similarity.issueCount===0?"implemented":"partial","295":"implemented"} as const,
    boundary:"P1-293 closes only when the complete internal corpus has zero unexempt near-duplicate issues. P1-295 tracks four independent states per content object even when human review is pending. P1-92 remains partial while external authorized comparison and independent copyright review are absent.",
  };
}
