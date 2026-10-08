import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extendedGlossaryGrammar } from "@/data/extended-comprehension-grammar";

// Tracks which grammar labels have a recorded source check. "verifiziert" means a dictionary entry
// matched the label at check time. It is NOT a human linguistic review.
const record = readFileSync("docs/GRAMMAR_LABEL_VERIFICATION.md", "utf8");
const rows = record
  .split("\n")
  .filter((line) => line.startsWith("| ") && !line.startsWith("| Stichwort") && !line.startsWith("| ---"))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));

describe("grammar label verification record (P2-401)", () => {
  it("lists every glossary headword exactly once with the label currently in code", () => {
    const keys = Object.keys(extendedGlossaryGrammar);
    expect(rows.map(([key]) => key).sort()).toEqual([...keys].sort());
    for (const [key, label] of rows.map((row) => [row[0], row[1]] as const)) {
      expect(extendedGlossaryGrammar[key], key).toBe(label);
    }
  });

  it("requires a source for every row marked verified, and none for unverified rows", () => {
    for (const [key, , status, source] of rows) {
      if (status === "verifiziert") expect(source, key).not.toBe("—");
      else expect(status, key).toBe("nicht verifiziert");
    }
  });

  it("keeps the verified count at the recorded figure until a new check is written down", () => {
    expect(rows.filter(([, , status]) => status === "verifiziert")).toHaveLength(20);
  });
});
