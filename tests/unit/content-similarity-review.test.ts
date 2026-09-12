// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildContentSimilarityReviewAudit, auditSimilarityEntries, normalizeSimilarityText, similarityScore, type SimilarityCorpusEntry } from "@/core/content-validation/content-similarity-review";

const entry = (id:string,contextId:string,text:string):SimilarityCorpusEntry=>({id,contextId,scope:"test",kind:"closed-question",text});
const liveAudit=buildContentSimilarityReviewAudit();

describe("internal near-duplicate and independent review-state governance",()=>{
  it("normalizes German punctuation and Arabic diacritics deterministically",()=>{
    expect(normalizeSimilarityText("  WÄHLEN—Sie: السُّؤال!  ")).toBe("wählen sie السؤال");
  });

  it("detects exact duplicates across different content contexts",()=>{
    const audit=auditSimilarityEntries([entry("a","one","Welche Alternative bleibt für Personen ohne Internetzugang?"),entry("b","two","Welche Alternative bleibt für Personen ohne Internetzugang?")]);
    expect(audit).toMatchObject({entryCount:2,comparedPairCount:1,suspiciousPairCount:1,issueCount:1});
    expect(audit.pairs[0]).toMatchObject({score:1,status:"issue"});
  });

  it("detects a close lexical paraphrase but ignores short generic wording",()=>{
    const close=similarityScore("Welche digitale Alternative bleibt für Personen ohne stabilen Internetzugang während der Anmeldung verfügbar?","Welche digitale Alternative bleibt für Personen ohne stabilen Internetzugang während der Anmeldung weiterhin verfügbar?");
    expect(close.score).toBeGreaterThanOrEqual(0.84);
    expect(auditSimilarityEntries([entry("a","x","Was ist richtig?"),entry("b","y","Was ist richtig?")]).issueCount).toBe(0);
  });

  it("records same-context instructional recycling instead of hiding the pair",()=>{
    const text="Welche konkrete Alternative bleibt für Personen ohne digitalen Zugang verfügbar?";
    const audit=auditSimilarityEntries([entry("a","lesson-1",text),entry("b","lesson-1",text)]);
    expect(audit).toMatchObject({suspiciousPairCount:1,exemptSameContextCount:1,issueCount:0});
    expect(audit.pairs[0].reason).toContain("teach→practice→assessment");
  });

  it("accepts only a named explicit pair exemption with reviewer provenance",()=>{
    const text="Welche konkrete Alternative bleibt für Personen ohne digitalen Zugang verfügbar?";
    const audit=auditSimilarityEntries([entry("a","one",text),entry("b","two",text)],[{leftId:"b",rightId:"a",reason:"Reviewed reusable legal label",reviewedBy:"Reviewer",reviewedAt:"2026-09-07"}]);
    expect(audit.pairs[0]).toMatchObject({status:"exempt-reviewed",reason:"Reviewed reusable legal label"});
    expect(audit.issueCount).toBe(0);
  });

  it("scans the complete live closed/productive corpus with no unexempt pair",()=>{
    const audit=liveAudit;
    expect(audit.similarity).toMatchObject({policyVersion:"content-near-duplicate-v1",entryCount:3020,comparedPairCount:4558690,suspiciousPairCount:10,exemptSameContextCount:10,exemptReviewedCount:0,issueCount:0});
    expect(audit.p1Status).toEqual({"92":"partial","293":"implemented","295":"implemented"});
  });

  it("keeps German, Arabic, CEFR, and copyright states separate on every object",()=>{
    const audit=liveAudit;
    expect(audit.reviewState).toMatchObject({policyVersion:"content-review-state-v1",rowCount:3020});
    for(const dimension of ["german","arabic","cefr","copyright"] as const){
      expect(audit.reviewState.reviewCounts[dimension]).toEqual({total:3020,automatedPassHumanPending:3020,independentlyReviewed:0});
      expect(audit.reviewState.rows.every((row)=>row[dimension].status==="automated-pass-human-pending")).toBe(true);
    }
    expect(audit.externalReferenceCorpusCount).toBe(0);
    expect(audit.copyrightClearance).toBe("pending-authorized-corpus-and-independent-review");
  });

  it("commits synchronized machine/readable reports with explicit copyright limits",()=>{
    const machine=JSON.parse(readFileSync("reports/content-similarity-review-audit.json","utf8"));
    const markdown=readFileSync("docs/generated/CONTENT_SIMILARITY_REVIEW_REPORT.md","utf8");
    expect(markdown).toContain(machine.contentSha256);
    expect(markdown).toContain("4,558,690 deterministic pairs");
    expect(markdown).toContain("External authorized reference corpora: 0");
    expect(markdown).toContain("not embedding equivalence, plagiarism detection, copyright clearance");
  });
});
