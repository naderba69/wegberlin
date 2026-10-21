import { describe, expect, it } from "vitest";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import {
  buildLexicalTargetGapAudit,
  extractArticleMarkedNouns,
  extractInfinitivePrepositionPairs,
  LEXICAL_TARGET_AUDIT_VERSION,
} from "@/core/content-validation/lexical-target-gap";

const audit = buildLexicalTargetGapAudit();

describe("lexical target-gap inventory", () => {
  it("inventories all lessons and preserves the authored anchor baseline", () => {
    expect(audit.version).toBe(LEXICAL_TARGET_AUDIT_VERSION);
    expect(audit.lessonCount).toBe(96);
    expect(audit.nounAnchorCount).toBe(2117);
    expect(audit.verbFrameAnchorCount).toBe(134);

    const representedNounAnchors = new Set(audit.nounRows.flatMap((row) => row.anchorIds));
    const representedFrameAnchors = new Set(audit.verbFrameRows.flatMap((row) => row.anchorIds));
    expect(representedNounAnchors).toEqual(new Set(nounGrammarEntries.map((entry) => entry.id)));
    expect(representedFrameAnchors).toEqual(new Set(verbPrepositionFrames.map((entry) => entry.id)));
  });

  // v231: the 54 rewritten Mini-Test items add contextual (non-target) candidates only; covered and pendingHuman are unchanged.
  // v236: six simplified A1 reading texts (ADR-128) drop 10 contextual noun and 3 contextual verb candidates; targets are unchanged.
  // v243: ADR-135 adds 105 lesson-scoped noun anchors for question-critical reading words; 118 candidates become covered, pendingHuman is unchanged.
  // v245: ADR-137 rewrites 229 options in 211 reading/listening items (17 keys shortened, the rest distractors lengthened); new words are contextual candidates only (+19 nouns, +15 verb pairs); covered and pendingHuman are unchanged.
  // v246: ADR-138 rewrites the distractors of 143 mini-test/exercise items (five keys shortened); +4 noun and +5 verb-pair contextual candidates; covered and pendingHuman are unchanged.
  // v248: ADR-139 adds 144 lesson-scoped noun anchors for the Goethe-Zertifikat A1 core vocabulary taught on the new A1 phrases and cards; every new authored target is covered (A1 pendingHuman stays 0), new example and explanation words add +13 noun and +6 verb-pair contextual candidates.
  // v250: ADR-141 adds 144 lesson-scoped noun anchors for the Goethe-Zertifikat A2 words taught on the new A2 phrases and cards; covered +148, +24 noun and +12 verb-pair contextual candidates from the new examples; pendingHuman is unchanged (A2 stays 0).
  // v251: ADR-142 adds 43 lesson-scoped noun anchors for the Goethe-Zertifikat B1 food and perception words on the new B1 phrases and cards; covered +45, +27 noun and +9 verb-pair contextual candidates; pendingHuman is unchanged ("achten" is taught without a frame target so no new verb-frame item waits for review).
  // v252: ADR-143 rewrote the a2-19 rechnen example ("Lernzeit" left), −1 contextual noun candidate.
  // v253: ADR-144 completed 46 card examples in B1/B2 (and a few A1/A2); +8 contextual noun and +3 verb-pair candidates, nothing new pending.
  // v254: ADR-145 corrected 77 exercise items (for example the wrong «sodann» connector block in b2-14); −4 contextual verb-pair candidates, nouns and pending unchanged.
  // v255: ADR-146 audited all 576 reading/listening questions and replaced off-topic b2-08-rq2 / duplicate b2-17-rq1 options; −1 contextual noun and +1 verb-pair candidate, nothing new pending.
  // v256: ADR-147 audited all 272 theory blocks and 392 common mistakes; b1-18 «die Prüfung» → «den Prüfungserfolg» (noun swap), b2-22-mk3 now starts with a capital «Die» (the article scan skips sentence starts), and the b1-10 mistake no longer pairs «wegzuwerfen = zu wegwerfen»; −1 contextual noun and −1 verb-pair candidate, nothing new pending.
  // v257: ADR-148 audited all 96 writing/speaking/mediation tasks (padding after the closing removed, models reordered and corrected); −10 contextual noun and +5 verb-pair candidates; covered, pendingHuman and authoredTargets unchanged (the a2-15 plural «die Tabletten» stays in the model).
  it("commits deterministic v1 candidate and gap counters", () => {
    expect(audit.nounSummary).toMatchObject({
      totalCandidates: 6007,
      covered: 2234,
      pendingHuman: 89,
      contextualNotTarget: 3684,
      authoredTargets: 2323,
    });
    expect(audit.verbFrameSummary).toMatchObject({
      totalCandidates: 1402,
      covered: 134,
      pendingHuman: 1,
      contextualNotTarget: 1267,
      authoredTargets: 135,
    });
  });

  it("classifies every row explicitly and keeps stable IDs unique", () => {
    const allRows = [...audit.nounRows, ...audit.verbFrameRows];
    expect(new Set(allRows.map((row) => row.id)).size).toBe(allRows.length);

    for (const row of allRows) {
      expect(["covered", "pending-human", "not-target"]).toContain(row.status);
      if (row.status === "covered") expect(row.anchorIds.length).toBeGreaterThan(0);
      if (row.status === "pending-human") {
        expect(row.anchorIds).toHaveLength(0);
        expect(row.sources.some((item) => item.strength === "target")).toBe(true);
      }
      if (row.status === "not-target") {
        expect(row.anchorIds).toHaveLength(0);
        if (row.role === "context-only") expect(row.sources.every((item) => item.strength === "context")).toBe(true);
        if (row.role === "reviewed-exclusion") {
          expect("exclusionDecision" in row && row.exclusionDecision?.reviewStatus).toBe("authored-review-pending");
          expect(row.sources.some((item) => item.strength === "target")).toBe(true);
        }
      }
    }
  });

  it("surfaces real lesson-scoped target decisions instead of claiming four anchors are exhaustive", () => {
    expect(audit.nounRows.find((row) => row.lessonId === "a1-01" && row.lemmaCandidate === "Name")?.status).toBe("covered");
    const reviewedNoun = audit.nounRows.find((row) => row.lessonId === "a1-01" && row.lemmaCandidate === "Karte");
    expect(reviewedNoun?.status).toBe("covered");
    expect(reviewedNoun?.anchorIds).toEqual(["a1-01-noun-5"]);
    const pluralOnlyNoun = audit.nounRows.find((row) => row.lessonId === "a1-04" && row.lemmaCandidate === "Eltern");
    expect(pluralOnlyNoun?.status).toBe("covered");
    expect(pluralOnlyNoun?.anchorIds).toEqual(["a1-04-noun-6"]);
    const recycledPlural = audit.nounRows.find((row) => row.lessonId === "a1-11" && row.lemmaCandidate === "Äpfel");
    expect(recycledPlural?.status).toBe("covered");
    expect(recycledPlural?.anchorIds).toEqual(["a1-11-noun-5"]);
    const dativePlural = audit.nounRows.find((row) => row.lessonId === "a1-14" && row.lemmaCandidate === "Stühlen");
    expect(dativePlural?.status).toBe("covered");
    expect(dativePlural?.anchorIds).toEqual(["a1-14-noun-2"]);
    const germanLanguage = audit.nounRows.find((row) => row.lessonId === "a1-02" && row.lemmaCandidate === "Deutsch");
    expect(germanLanguage?.status).toBe("covered");
    expect(germanLanguage?.anchorIds).toEqual(["a1-02-noun-16"]);
    expect(audit.nounSummary.byLevel.A1.pendingHuman).toBe(0);
    expect(audit.nounSummary.byLevel.A2.pendingHuman).toBe(0);
    expect(audit.nounSummary.byLevel.B1.pendingHuman).toBe(0);
    expect(audit.nounSummary.byLevel.B2.pendingHuman).toBe(89);
    const reviewedPaymentFrame = audit.verbFrameRows.find((row) => row.lessonId === "a1-11" && row.normalizedVerb === "bezahlen" && row.preposition === "mit");
    expect(reviewedPaymentFrame?.status).toBe("covered");
    expect(reviewedPaymentFrame?.anchorIds).toEqual(["a1-11-verb-frame-2"]);
    const locativeExclusion = audit.verbFrameRows.find((row) => row.lessonId === "a1-21" && row.normalizedVerb === "umsteigen" && row.preposition === "in");
    expect(locativeExclusion).toMatchObject({status:"not-target",role:"reviewed-exclusion",exclusionDecision:{reason:"locative-adjunct",reviewStatus:"authored-review-pending"}});
    expect(audit.exclusionDecisionCount).toBe(11);
    expect(audit.pendingIndependentExclusionReview).toBe(11);
    const reviewedFrame = audit.verbFrameRows.find((row) => row.lessonId === "b2-09" && row.normalizedVerb === "abhängen" && row.preposition === "von");
    expect(reviewedFrame?.status).toBe("covered");
    expect(reviewedFrame?.anchorIds).toEqual(["b2-09-verb-frame-2"]);
  });

  it("does not treat sentence-initial capitalization alone as noun evidence", () => {
    expect(extractArticleMarkedNouns("Berlin ist groß. Morgen lernen wir weiter.")).toEqual([]);
    expect(extractArticleMarkedNouns("Wir prüfen die klar definierte Funktion und einen überprüfbaren Beleg.")).toEqual(["Funktion", "Beleg"]);
  });

  it("records visible infinitive/preposition evidence without inventing purpose clauses", () => {
    expect(extractInfinitivePrepositionPairs("sich an eine Regel halten")).toContainEqual({
      infinitive: "sich halten",
      normalizedVerb: "halten",
      preposition: "an",
      observedCase: "accusative",
    });
    expect(extractInfinitivePrepositionPairs("um Deutsch zu üben").some((row) => row.normalizedVerb === "üben")).toBe(false);
  });
});
