// @vitest-environment node
import { describe, expect, it } from "vitest";
import { encodeCsvCell, encodeCsvRow, hasNonEmptyCsvFields, parseCsv, serializeCsv } from "@/core/content-validation/safe-csv";

describe("spreadsheet-safe CSV serialization", () => {
  it("quotes delimiters, quotes, missing values, and embedded line breaks", () => {
    expect(encodeCsvRow([null, 'a,"b"', "first\nsecond\tcolumn"])).toBe('"","a,""b""","first second column"');
    expect(serializeCsv(["header"], [["value"]])).toBe('"header"\n"value"\n');
  });

  it("parses escaped quotes, CRLF rows, and quoted multiline cells", () => {
    expect(parseCsv('"id","note"\r\n"1","He said ""ja""."\r\n"2","line one\nline two"\r\n')).toEqual([
      ["id", "note"],
      ["1", 'He said "ja".'],
      ["2", "line one\nline two"],
    ]);
  });

  it("detects reviewer data by named columns and rejects malformed rows", () => {
    const headers = ["id", "decision", "reviewerName", "reviewDate", "note"];
    expect(hasNonEmptyCsvFields(serializeCsv(headers, [["1", "", "", "", ""]]), ["decision", "reviewerName", "reviewDate", "note"])).toBe(false);
    expect(hasNonEmptyCsvFields(serializeCsv(headers, [["1", "accept", "", "", ""]]), ["decision", "reviewerName", "reviewDate", "note"])).toBe(true);
    expect(() => hasNonEmptyCsvFields('"id","decision"\n"1"\n', ["decision"])).toThrow("does not match the header width");
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
