import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const register = readFileSync("docs/OER_LICENSE_REGISTER.md", "utf8");
const rows = register
  .split("\n")
  .filter((line) => /^\| OER-\d+ \|/.test(line))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));

describe("OER license register (P2-357 prerequisite)", () => {
  it("lists every entry with a source URL, a license, a check date and an attribution rule", () => {
    expect(rows.length).toBeGreaterThanOrEqual(5);
    for (const [id, , url, license, checkedOn, attribution] of rows) {
      expect(url, id).toMatch(/^https:\/\//);
      expect(license, id).not.toBe("");
      expect(checkedOn, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(attribution, id).not.toBe("");
    }
  });

  it("never marks a non-commercial license as importable", () => {
    for (const [id, , , license, , , status] of rows) {
      if (/NC/.test(license)) expect(status, id).toMatch(/مستبعد/);
    }
  });

  it("records no imported content: every entry is registered or excluded, none imported", () => {
    for (const [id, , , , , , status] of rows) {
      expect(status, id).not.toMatch(/^مستورد|تم الاستيراد/);
    }
  });
});
