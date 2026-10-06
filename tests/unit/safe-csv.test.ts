// @vitest-environment node
import { describe, expect, it } from "vitest";
import { encodeCsvCell, encodeCsvRow, serializeCsv } from "@/core/content-validation/safe-csv";

describe("spreadsheet-safe CSV serialization", () => {
  it("quotes delimiters, quotes, missing values, and embedded line breaks", () => {
    expect(encodeCsvRow([null, 'a,"b"', "first\nsecond\tcolumn"])).toBe('"","a,""b""","first second column"');
    expect(serializeCsv(["header"], [["value"]])).toBe('"header"\n"value"\n');
  });

  it("neutralizes formula prefixes, including control and Unicode whitespace prefixes", () => {
    expect([
      encodeCsvCell("=1+1"),
      encodeCsvCell("+SUM(A1:A2)"),
      encodeCsvCell("-1+2"),
      encodeCsvCell("@SUM(A1:A2)"),
      encodeCsvCell("\t=1+1"),
      encodeCsvCell("\uFEFF@SUM(A1:A2)"),
    ]).toEqual([
      '"\'=1+1"',
      '"\'+SUM(A1:A2)"',
      '"\'-1+2"',
      '"\'@SUM(A1:A2)"',
      '"\' =1+1"',
      '"\'\uFEFF@SUM(A1:A2)"',
    ]);
  });

  it("leaves ordinary text intact and adds a text marker only to formula-like cells", () => {
    expect(encodeCsvCell("Guten Morgen")).toBe('"Guten Morgen"');
    expect(encodeCsvCell("  ordinary text")).toBe('"  ordinary text"');
  });
});
