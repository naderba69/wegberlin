// @vitest-environment node
import { describe, expect, it } from "vitest";
import { nounGrammarEntries, verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import { buildLexicalReviewPacketArtifacts } from "@/core/content-validation/lexical-review-packet";
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

    expect(nounRows).toHaveLength(1298);
    expect(frameRows).toHaveLength(135);
    expect(new Set(nounRows.slice(1).map((row) => row[0]))).toEqual(new Set(nounGrammarEntries.map((entry) => entry.id)));
    expect(new Set(frameRows.slice(1).map((row) => row[0]))).toEqual(new Set(verbPrepositionFrames.map((entry) => entry.id)));
    expect(nounRows[0]).toContain("targetOrRegistryReferences");
    expect(frameRows[0]).toContain("machineObservedCaseSignalsNotValidation");
    expect(nounRows.slice(1).every((row) => row[13].length > 0)).toBe(true);
    assertBlankSignatures(nounRows);
    assertBlankSignatures(frameRows);
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
    expect(readme).toContain("مراجعة جودة الإطارات الـ126");
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
    expect(rows[1][3]).toBe("'=1+1");
    expect(rows[1].length).toBe(rows[0].length);
  });
});
