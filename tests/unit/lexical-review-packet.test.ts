// @vitest-environment node
import { describe, expect, it } from "vitest";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import {
  assertOriginalP098NounReviewScope,
  assertOriginalP099QualityTargetDistribution,
  buildLexicalReviewPacketArtifacts,
  frameTargetsByLevel,
  ORIGINAL_P098_NOUN_TARGET_COUNT,
  ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT,
  ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL,
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
    expect(exclusions.slice(1).every((row) => row[6] === "authored-review-pending")).toBe(true);
    assertBlankSignatures(candidates);
    assertBlankSignatures(exclusions);
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
    expect(readme).toContain("يحرس `content:audit` نطاق P0-98 (1,297 سجلًا و89 مرشح اسم) وتوزيع P0-99");
    expect(readme).toContain("test-content-sha256");
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
