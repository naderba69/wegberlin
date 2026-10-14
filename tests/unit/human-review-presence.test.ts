// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { encodeCsvRow } from "@/core/content-validation/safe-csv";
import {
  auditGeneratedArtifactSignatures,
  auditReviewPacketDecisionPresence,
  REVIEW_PACKET_SIGNATURE_FIELDS,
} from "@/core/content-validation/human-review-presence";

const HEADER = ["sheet", "row", "contentId", "scope", "level", "artifactOwner", "sourceFile", "contentToRead", "qualityFlags", ...REVIEW_PACKET_SIGNATURE_FIELDS];

function sheet(number: number, contentIds: string[], patch?: (cells: string[], index: number) => void) {
  const rows = contentIds.map((contentId, index) => {
    const cells = [`sheet-${number}`, String(index + 1), contentId, "lesson", "A1", "lesson-a1-01", "src/data/lessons-a1-module1.ts", "اقرأ النص كاملًا", "", "", "", "", ""];
    patch?.(cells, index);
    return cells;
  });
  return { name: `review-sheet-${String(number).padStart(2, "0")}.csv`, content: [HEADER, ...rows].map(encodeCsvRow).join("\n") + "\n" };
}

const errors = (run: () => unknown) => {
  try { run(); return ""; } catch (error) { return error instanceof Error ? error.message : String(error); }
};

describe("review packet decision presence", () => {
  it("counts a committed sheet as unsigned without opening any decision", () => {
    const presence = auditReviewPacketDecisionPresence([sheet(1, ["a", "b", "c"])], { expectedRowCount: 3 });
    expect(presence).toEqual({
      sheetCount: 1,
      rowCount: 3,
      fullySignedRowCount: 0,
      unsignedRowCount: 3,
      signedSignatureCells: 0,
      signatureCellsExpected: 12,
      sheets: [{ name: "review-sheet-01.csv", rows: 3, fullySignedRows: 0, unsignedRows: 3 }],
      evidenceContentsInspected: false,
      reviewDecisionContentsInterpreted: false,
      humanReviewClosureAsserted: false,
    });
  });

  it("counts a complete signature and refuses a partial one", () => {
    const signed = sheet(1, ["a", "b"], (cells, index) => {
      if (index !== 1) return;
      cells[9] = "accept";
      cells[10] = "مراجع مستقل";
      cells[11] = "2026-10-07";
      cells[12] = "قرأت الدرس كاملًا وثبّتت الملاحظات.";
    });
    const presence = auditReviewPacketDecisionPresence([signed], { expectedRowCount: 2 });
    expect(presence.fullySignedRowCount).toBe(1);
    expect(presence.unsignedRowCount).toBe(1);
    expect(presence.signedSignatureCells).toBe(4);

    const partial = sheet(1, ["a", "b"], (cells, index) => {
      if (index !== 1) return;
      cells[9] = "accept";
      cells[10] = "مراجع مستقل";
    });
    expect(errors(() => auditReviewPacketDecisionPresence([partial], { expectedRowCount: 2 })))
      .toContain("partial signature (2/4 fields) on record b");
  });

  it("fails closed on duplicate content IDs, wrong sheet labels, and row-count drift", () => {
    expect(errors(() => auditReviewPacketDecisionPresence([sheet(1, ["a", "b"]), sheet(2, ["b", "c"])], { expectedRowCount: 4 })))
      .toContain("duplicate content ID (b)");
    const single = sheet(1, ["a"]);
    const wrongLabel = single.content.replace('"sheet-1"', '"sheet-9"');
    expect(errors(() => auditReviewPacketDecisionPresence([{ name: single.name, content: wrongLabel }], { expectedRowCount: 1 })))
      .toContain("instead of sheet-1");
    expect(errors(() => auditReviewPacketDecisionPresence([sheet(1, ["a", "a"])], { expectedRowCount: 2 })))
      .toContain("duplicate content ID");
    expect(errors(() => auditReviewPacketDecisionPresence([sheet(1, ["a"])], { expectedRowCount: 5 })))
      .toContain("expected 5 governed rows");
    expect(errors(() => auditReviewPacketDecisionPresence([sheet(2, ["a"])], { expectedRowCount: 1 })))
      .toContain("not numbered contiguously");
  });

  it("refuses any reviewer input inside generated artifacts and reports zero across the committed set", () => {
    const lexical = ["structural-exclusions", "frame-quality-targets", "noun-anchors", "verb-frames", "unresolved-candidates"];
    const files = [
      ...lexical.map((name) => ({
        path: `reports/lexical-review-packet/${name}.csv`,
        content: readFileSync(`reports/lexical-review-packet/${name}.csv`, "utf8"),
        columns: name === "structural-exclusions"
          ? ["reviewEvidenceName", "reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"]
          : ["reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"],
      })),
      ...Array.from({ length: 17 }, (_, index) => {
        const name = `review-sheet-${String(index + 1).padStart(2, "0")}.csv`;
        return { path: `reports/review-packet/${name}`, content: readFileSync(`reports/review-packet/${name}`, "utf8"), columns: ["decision", "reviewerName", "reviewDate", "note"] };
      }),
    ];
    const report = auditGeneratedArtifactSignatures(files);
    expect(report.artifactCount).toBe(22);
    expect(report.rowCount).toBe(4935);
    expect(report.expectedCellCount).toBe(21409);
    expect(report.filledCellCount).toBe(0);
    expect(report.artifacts.every((artifact) => artifact.filledCells === 0 && artifact.filledRowIds.length === 0)).toBe(true);
    expect(report.humanReviewClosureAsserted).toBe(false);

    const header = ["sheet", "row", "contentId", "scope", "level", "artifactOwner", "sourceFile", "contentToRead", "qualityFlags", "decision", "reviewerName", "reviewDate", "note"];
    const synthetic = [{
      path: "reports/review-packet/review-sheet-01.csv",
      content: [header, ["sheet-1", "1", "synthetic-row", "lesson", "A1", "owner", "src/data/lessons-a1-module1.ts", "اقرأ النص", "", "accept", "", "", ""]]
        .map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n") + "\n",
      columns: ["decision", "reviewerName", "reviewDate", "note"],
    }];
    const withSignature = auditGeneratedArtifactSignatures(synthetic);
    expect(withSignature.filledCellCount).toBe(1);
    expect(withSignature.artifacts[0].filledRowIds).toEqual(["synthetic-row"]);
    expect(errors(() => auditGeneratedArtifactSignatures(files.map((file) => ({ ...file, columns: [...file.columns, "missingColumn"] })))))
      .toContain("exactly one missingColumn column");
    expect(errors(() => auditGeneratedArtifactSignatures([]))).toContain("at least one artifact");
  });

  it("reads the committed packet as 3,277 unsigned rows across 17 sheets", () => {
    const names = Array.from({ length: 17 }, (_, index) => `review-sheet-${String(index + 1).padStart(2, "0")}.csv`);
    const presence = auditReviewPacketDecisionPresence(
      names.map((name) => ({ name, content: readFileSync(`reports/review-packet/${name}`, "utf8") })),
      { expectedRowCount: 3277 },
    );
    expect(presence.sheetCount).toBe(17);
    expect(presence.rowCount).toBe(3277);
    expect(presence.fullySignedRowCount).toBe(0);
    expect(presence.signedSignatureCells).toBe(0);
    expect(presence.signatureCellsExpected).toBe(13108);
    expect(presence.humanReviewClosureAsserted).toBe(false);
    const audit = JSON.parse(readFileSync("reports/human-review-audit.json", "utf8")) as { reviewPacketPresence: { rowCount: number; fullySignedRowCount: number } };
    expect(audit.reviewPacketPresence.rowCount).toBe(presence.rowCount);
    expect(audit.reviewPacketPresence.fullySignedRowCount).toBe(0);
  });
});
