// @vitest-environment node
import { describe, expect, it } from "vitest";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { serializeCsv } from "@/core/content-validation/safe-csv";
import {
  assertOriginalP098NounReviewScope,
  auditP099ExclusionReviewSlots,
  assertOriginalP099QualityTargetDistribution,
  buildLexicalReviewPacketArtifacts,
  frameTargetsByLevel,
  ORIGINAL_P098_NOUN_TARGET_COUNT,
  ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT,
  ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL,
  buildP099ExclusionReviewDossier,
  isP099PlaceholderEvidenceReference,
  P099_EXCLUSION_EVIDENCE_NAME_COLUMN,
  P099_EXCLUSION_REVIEW_DOSSIER_PATH,
  P099_ORIGINAL_QUALITY_TARGET_COUNT,
  summarizeP099ExclusionEvidenceReferences,
} from "@/core/content-validation/lexical-review-packet";
import { buildLexicalTargetGapAudit } from "@/core/content-validation/lexical-target-gap";

type CsvRow = string[];

function parseCsv(content: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (quoted && char === '"' && content[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  expect(quoted).toBe(false);
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const audit = buildLexicalTargetGapAudit();
const artifacts = buildLexicalReviewPacketArtifacts({
  audit,
  nounEntries: nounGrammarEntries,
  verbFrames: verbPrepositionFrames,
  contentHash: "test-content-sha256",
});
const byPath = new Map(artifacts.map((artifact) => [artifact.path, artifact.content]));
const signatureColumns = ["reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"];

function assertBlankSignatures(rows: CsvRow[]) {
  const header = rows[0];
  const indexes = signatureColumns.map((column) => header.indexOf(column));
  expect(indexes.every((index) => index >= 0)).toBe(true);
  for (const row of rows.slice(1)) {
    for (const index of indexes) expect(row[index]).toBe("");
  }
}

describe("unsigned independent German lexical review packet", () => {
  it("covers every authored noun and verb-frame anchor exactly once", () => {
    const nounRows = parseCsv(byPath.get("reports/lexical-review-packet/noun-anchors.csv")!);
    const frameRows = parseCsv(byPath.get("reports/lexical-review-packet/verb-frames.csv")!);

    const nounAnchorIndex = nounRows[0].indexOf("anchorId");
    const targetReferenceIndex = nounRows[0].indexOf("targetOrRegistryReferences");
    expect(nounRows).toHaveLength(1298);
    expect(frameRows).toHaveLength(135);
    expect(nounRows[0][0]).toBe("reviewScope");
    expect(new Set(nounRows.slice(1).map((row) => row[0]))).toEqual(new Set(["P0-98-original-1297-noun-target"]));
    expect(new Set(nounRows.slice(1).map((row) => row[nounAnchorIndex]))).toEqual(new Set(nounGrammarEntries.map((entry) => entry.id)));
    expect(new Set(frameRows.slice(1).map((row) => row[0]))).toEqual(new Set(verbPrepositionFrames.map((entry) => entry.id)));
    expect(nounRows[0]).toContain("targetOrRegistryReferences");
    expect(frameRows[0]).toContain("machineObservedCaseSignalsNotValidation");
    expect(nounRows.slice(1).every((row) => row[targetReferenceIndex].length > 0)).toBe(true);
    expect(ORIGINAL_P098_NOUN_TARGET_COUNT).toBe(1297);
    expect(ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT).toBe(89);
    expect(assertOriginalP098NounReviewScope(nounGrammarEntries, 89)).toBeUndefined();
    expect(() => assertOriginalP098NounReviewScope(nounGrammarEntries.slice(1), 89)).toThrow("Original P0-98 noun scope drifted");
    expect(() => assertOriginalP098NounReviewScope(nounGrammarEntries, 88)).toThrow("Original P0-98 noun scope drifted");
    assertBlankSignatures(nounRows);
    assertBlankSignatures(frameRows);
  });

  it("separates the original 126-frame quality target worklist from 134 context references", () => {
    const references = parseCsv(byPath.get("reports/lexical-review-packet/verb-frames.csv")!);
    const targets = parseCsv(byPath.get("reports/lexical-review-packet/frame-quality-targets.csv")!);
    const targetIds = targets.slice(1).map((row) => row[1]);
    const expectedIds = verbPrepositionFrames
      .filter((entry) => {
        const level = entry.lessonId.slice(0, 2).toLocaleUpperCase("en-US");
        const lessonNumber = Number(entry.lessonId.split("-")[1]);
        return ["A1", "A2", "B1"].includes(level) || (level === "B2" && Number.isInteger(lessonNumber) && lessonNumber >= 1 && lessonNumber <= 20);
      })
      .map((entry) => entry.id);
    const countsByLevel = Object.fromEntries(["A1", "A2", "B1", "B2"].map((level) => [
      level,
      targets.slice(1).filter((row) => row[2] === level).length,
    ]));

    expect(references).toHaveLength(135);
    expect(targets).toHaveLength(127);
    expect(targets[0][0]).toBe("reviewScope");
    expect(targets.slice(1).every((row) => row[0] === "P0-99-original-126-quality-target")).toBe(true);
    expect(new Set(targetIds)).toEqual(new Set(expectedIds));
    expect(new Set(targetIds).size).toBe(126);
    expect(countsByLevel).toEqual({ A1: 25, A2: 30, B1: 31, B2: 40 });
    expect(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL).toEqual({ A1: 25, A2: 30, B1: 31, B2: 40 });
    expect(frameTargetsByLevel(verbPrepositionFrames)).toEqual({ A1: 25, A2: 30, B1: 31, B2: 40 });
    expect(assertOriginalP099QualityTargetDistribution(verbPrepositionFrames)).toEqual({ A1: 25, A2: 30, B1: 31, B2: 40 });
    expect(() => assertOriginalP099QualityTargetDistribution(verbPrepositionFrames.slice(1))).toThrow("Original P0-99 quality scope drifted");
    expect(targets.slice(1).every((row) => !/^b2-(2[1-4])-/u.test(row[1]))).toBe(true);
    assertBlankSignatures(targets);
  });

  it("exposes exactly the unresolved inventory and signed-pending exclusions without deciding them", () => {
    const candidates = parseCsv(byPath.get("reports/lexical-review-packet/unresolved-candidates.csv")!);
    const exclusions = parseCsv(byPath.get("reports/lexical-review-packet/structural-exclusions.csv")!);

    expect(candidates).toHaveLength(94);
    expect(candidates.slice(1).filter((row) => row[1] === "noun")).toHaveLength(89);
    expect(candidates.slice(1).filter((row) => row[1] === "verb-preposition-frame")).toHaveLength(4);
    expect(candidates.slice(1).every((row) => row[5] === "pending-human")).toBe(true);
    expect(exclusions).toHaveLength(9);
    expect(exclusions[0]).toContain(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);
    const evidenceNameIndex = exclusions[0].indexOf(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);
    expect(exclusions.slice(1).every((row) => row[evidenceNameIndex] === "")).toBe(true);
    expect(exclusions.slice(1).every((row) => row[6] === "authored-review-pending")).toBe(true);
    assertBlankSignatures(candidates);
    assertBlankSignatures(exclusions);
  });

  it("summarizes reference-name presence without implying evidence verification or review", () => {
    const artifactPath = "reports/lexical-review-packet/structural-exclusions.csv";
    const csv = byPath.get(artifactPath)!;
    const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
    const blankInventory = summarizeP099ExclusionEvidenceReferences(csv, expectedDecisionIds);
    expect(blankInventory).toEqual({
      exclusionCount: 8,
      namedReferenceCount: 0,
      missingDecisionIds: expectedDecisionIds,
      evidenceContentsInspected: false,
      reviewDecisionCellsInspected: false,
      p099ClosureAsserted: false,
    });

    const rows = parseCsv(csv);
    const decisionIdIndex = rows[0].indexOf("decisionId");
    const evidenceNameIndex = rows[0].indexOf(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);
    const namedCsv = serializeCsv(rows[0], rows.slice(1).map((row, index) => {
      const next = [...row];
      next[evidenceNameIndex] = `test-only-reference-${index + 1}`;
      return next;
    }));
    const namedInventory = summarizeP099ExclusionEvidenceReferences(namedCsv, expectedDecisionIds);
    expect(namedInventory.namedReferenceCount).toBe(8);
    expect(namedInventory.missingDecisionIds).toEqual([]);
    expect(namedInventory.evidenceContentsInspected).toBe(false);
    expect(namedInventory.reviewDecisionCellsInspected).toBe(false);
    expect(namedInventory.p099ClosureAsserted).toBe(false);
    expect(rows.slice(1).map((row) => row[decisionIdIndex])).toEqual(expectedDecisionIds);
  });

  it("fails closed if reference inventory rows or protected headings drift", () => {
    const csv = byPath.get("reports/lexical-review-packet/structural-exclusions.csv")!;
    const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
    const rows = parseCsv(csv);
    const duplicatedEvidenceHeader = serializeCsv(
      [...rows[0], P099_EXCLUSION_EVIDENCE_NAME_COLUMN],
      rows.slice(1).map((row) => [...row, ""]),
    );
    const unknownDecisionId = serializeCsv(rows[0], rows.slice(1).map((row, index) => {
      const next = [...row];
      if (index === 0) next[0] = "unexpected-exclusion-id";
      return next;
    }));
    expect(() => summarizeP099ExclusionEvidenceReferences(duplicatedEvidenceHeader, expectedDecisionIds)).toThrow("exactly one reviewEvidenceName column");
    expect(() => summarizeP099ExclusionEvidenceReferences(unknownDecisionId, expectedDecisionIds)).toThrow("IDs do not match");
  });

  it("separates missing, placeholder, and named P0-99 evidence slots without asserting review", () => {
    const csv = byPath.get("reports/lexical-review-packet/structural-exclusions.csv")!;
    const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
    const blank = auditP099ExclusionReviewSlots(csv, expectedDecisionIds);
    expect(blank.namedReferenceCount).toBe(0);
    expect(blank.missingReferenceCount).toBe(8);
    expect(blank.placeholderReferenceCount).toBe(0);
    expect(blank.signatureCellsExpected).toBe(40);
    expect(blank.signatureCellsFilled).toBe(0);
    expect(blank.readyForIndependentReviewCount).toBe(0);
    expect(blank.missingReferenceDecisionIds).toEqual(expectedDecisionIds);
    expect(blank.slots.every((slot) => slot.evidenceReferenceState === "missing"
      && slot.reviewStatus === "authored-review-pending"
      && slot.signatureCellsFilled === 0
      && !slot.readyForIndependentReview)).toBe(true);
    expect(blank.evidenceContentsInspected).toBe(false);
    expect(blank.reviewDecisionContentsInterpreted).toBe(false);
    expect(blank.p099ClosureAsserted).toBe(false);

    const rows = parseCsv(csv);
    const decisionIdIndex = rows[0].indexOf("decisionId");
    const evidenceNameIndex = rows[0].indexOf(P099_EXCLUSION_EVIDENCE_NAME_COLUMN);
    const statusIndex = rows[0].indexOf("reviewStatus");
    const reviewerNameIndex = rows[0].indexOf("reviewerName");
    const rewrite = (headers: CsvRow, dataRows: CsvRow[]) => serializeCsv(headers, dataRows);
    const fillEveryRow = (mutate: (row: CsvRow, index: number) => void) => {
      const nextRows = rows.slice(1).map((row, index) => {
        const next = [...row];
        mutate(next, index);
        return next;
      });
      return rewrite(rows[0], nextRows);
    };

    const placeholderCsv = fillEveryRow((row) => { row[evidenceNameIndex] = "TODO"; });
    const placeholders = auditP099ExclusionReviewSlots(placeholderCsv, expectedDecisionIds);
    expect(placeholders.placeholderReferenceCount).toBe(8);
    expect(placeholders.namedReferenceCount).toBe(0);
    expect(placeholders.missingReferenceCount).toBe(0);
    expect(placeholders.placeholderDecisionIds).toEqual(expectedDecisionIds);
    expect(placeholders.readyForIndependentReviewCount).toBe(0);
    expect(isP099PlaceholderEvidenceReference("")).toBe(false);
    expect(isP099PlaceholderEvidenceReference("n/a")).toBe(true);
    expect(isP099PlaceholderEvidenceReference("<دليل المراجعة>")).toBe(true);
    expect(isP099PlaceholderEvidenceReference("قيد الانتظار")).toBe(true);
    expect(isP099PlaceholderEvidenceReference("reports/evidence/p099-a1-21-review.pdf")).toBe(false);

    const namedCsv = fillEveryRow((row) => { row[evidenceNameIndex] = "reports/evidence/p099-a1-21-review.pdf"; });
    const named = auditP099ExclusionReviewSlots(namedCsv, expectedDecisionIds);
    expect(named.namedReferenceCount).toBe(8);
    expect(named.missingReferenceCount).toBe(0);
    expect(named.readyForIndependentReviewCount).toBe(8);
    expect(named.p099ClosureAsserted).toBe(false);

    const signedWhilePending = parseCsv(namedCsv);
    signedWhilePending[1][reviewerNameIndex] = "test-reviewer";
    expect(() => auditP099ExclusionReviewSlots(rewrite(signedWhilePending[0], signedWhilePending.slice(1)), expectedDecisionIds))
      .toThrow("while still marked authored-review-pending");

    const statusChanged = parseCsv(namedCsv);
    statusChanged[1][statusIndex] = "review-complete";
    statusChanged[1][reviewerNameIndex] = "test-reviewer";
    const filed = auditP099ExclusionReviewSlots(rewrite(statusChanged[0], statusChanged.slice(1)), expectedDecisionIds);
    expect(filed.signatureCellsFilled).toBe(1);
    expect(filed.readyForIndependentReviewCount).toBe(7);
    expect(rows.slice(1).map((row) => row[decisionIdIndex])).toEqual(expectedDecisionIds);

    const signatureWithoutName = parseCsv(namedCsv);
    signatureWithoutName[1][evidenceNameIndex] = "";
    signatureWithoutName[1][statusIndex] = "review-complete";
    signatureWithoutName[1][reviewerNameIndex] = "test-reviewer";
    expect(() => auditP099ExclusionReviewSlots(rewrite(signatureWithoutName[0], signatureWithoutName.slice(1)), expectedDecisionIds))
      .toThrow("without a named evidence reference");
  });

  it("states that the packet is unsigned and cannot close P0-98/P0-99", () => {
    const readme = byPath.get("reports/lexical-review-packet/README.md")!;
    expect(readme).toContain("ليست مراجعة، ولا توقيعًا، ولا دليل اعتماد");
    expect(readme).toContain("لا يغلق وجود هذه الحزمة P0-98 أو P0-99");
    expect(readme).toContain("ورقة عمل P0-98 للنطاق الأصلي");
    expect(readme).toContain("في P0-98، راجع سجلات الاسم الـ1,297");
    expect(readme).toContain("يرفض `npm run content:audit:write` إعادة كتابة CSV");
    expect(readme).toContain("هذا الحارس يمنع فقد البيانات فقط ولا يثبت مراجعة");
    expect(readme).toContain("عمود توقيع مطلوب مفقود أو مكرر");
    expect(readme).toContain("frame-quality-targets.csv");
    expect(readme).toContain("مراجعة جودة صفوف");
    expect(readme).toContain("الإطارات الثمانية في B2-21…B2-24 مراجع سياقية خارج هدف الجودة الأصلي");
    expect(readme).toContain("reviewEvidenceName");
    expect(readme).toContain("يجب تسمية الدليل والتحقق منه قبل الانتقال إلى مراجعة جودة الأهداف الـ126");
    expect(readme).toContain("npm run p099:evidence:status");
    expect(readme).toContain("تبقى المراجعة المستقلة مطلوبة حتى لو امتلأت الأسماء الثمانية");
    expect(readme).toContain("يفصل الفاحص نفسه بين غياب الاسم واسم نائب");
    expect(readme).toContain("docs/generated/P099_EXCLUSION_REVIEW_DOSSIER.md");
    expect(readme).toContain("يوقف الفاحص بدل أن يُقرأ كإغلاق");
    expect(readme).toContain("يحرس `content:audit` نطاق P0-98 (1,297 سجلًا و89 مرشح اسم) وتوزيع P0-99");
    expect(readme).toContain("test-content-sha256");
  });

  it("ships a readable per-exclusion dossier built from the same rows and bounded to presence", () => {
    const artifactPath = "reports/lexical-review-packet/structural-exclusions.csv";
    const csv = byPath.get(artifactPath)!;
    const dossier = byPath.get(P099_EXCLUSION_REVIEW_DOSSIER_PATH)!;
    expect(byPath.has(P099_EXCLUSION_REVIEW_DOSSIER_PATH)).toBe(true);

    const rows = parseCsv(csv);
    const expectedDecisionIds = audit.exclusionDecisions.map((decision) => decision.id);
    const sections = [...dossier.matchAll(/^## (\d+)\. `([^`]+)`$/gmu)];
    expect(sections.map((match) => match[2])).toEqual(expectedDecisionIds);
    expect(sections.map((match) => Number(match[1]))).toEqual(expectedDecisionIds.map((_, index) => index + 1));
    const dossierRows = sections.map((match) => match[2]);
    expect(dossierRows).toEqual(rows.slice(1).map((row) => row[0]));

    expect(dossier).toContain("لا يمنح اعتمادًا ولا يغلق P0-99");
    expect(dossier).toContain("لا يُفتح دليل، ولا يُطبع محتوى قرار مراجع");
    expect(dossier).toContain(`الأهداف الـ${P099_ORIGINAL_QUALITY_TARGET_COUNT}`);
    expect(dossier).toContain("لا يوجد في هذا الملف قرار بشري");
    expect(dossier).toContain("**0/8**");
    expect(dossier).toContain("**0/40**");
    expect(dossier).toContain("بوابة المرحلة الثانية: مغلقة");
    for (const decision of audit.exclusionDecisions) expect(dossier).toContain(decision.explanationAr);

    const namedCsv = serializeCsv(rows[0], rows.slice(1).map((row) => {
      const next = [...row];
      next[rows[0].indexOf(P099_EXCLUSION_EVIDENCE_NAME_COLUMN)] = "reports/evidence/p099-review.pdf";
      next[0] = next[0];
      return next;
    }));
    const namedRows = parseCsv(namedCsv);
    const namedDossier = buildP099ExclusionReviewDossier({ headers: namedRows[0], rows: namedRows.slice(1), contentHash: "test-content-sha256" });
    expect(namedDossier).toContain("**8/8**");
    expect(namedDossier).toContain("بوابة المرحلة الثانية: تُفتح بعد تسجيل الأسماء الثمانية");
    expect(namedDossier).toContain("reports/evidence/p099-review.pdf");
    expect(namedDossier).not.toContain("test-reviewer");
    expect(() => buildP099ExclusionReviewDossier({ headers: namedRows[0], rows: namedRows.slice(2), contentHash: "test" }))
      .toThrow("requires exactly 8 exclusion rows");
  });

  it("quotes CSV fields and neutralizes spreadsheet formulas in authored text", () => {
    const seeded = buildLexicalReviewPacketArtifacts({
      audit,
      nounEntries: [{ ...nounGrammarEntries[0], lemma: "=1+1" }],
      verbFrames: [],
      contentHash: "test",
    });
    const rows = parseCsv(seeded.find((artifact) => artifact.path.endsWith("noun-anchors.csv"))!.content);
    const emptyQualityTargets = parseCsv(seeded.find((artifact) => artifact.path.endsWith("frame-quality-targets.csv"))!.content);
    expect(rows[1][rows[0].indexOf("lemma")]).toBe("'=1+1");
    expect(rows[1][0]).toBe("P0-98-original-1297-noun-target");
    expect(rows[1].length).toBe(rows[0].length);
    expect(emptyQualityTargets).toHaveLength(1);
    expect(emptyQualityTargets[0][0]).toBe("reviewScope");
  });
});
