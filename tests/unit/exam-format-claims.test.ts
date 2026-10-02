// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync("src/config/exam-format-claims.json", "utf8")) as {
  policyVersion: string;
  surfaces: string[];
  forbiddenClaimPatterns: { id: string; pattern: string }[];
  boundaryFragments: string[];
  negationMarkers: string[];
};
const audit = JSON.parse(readFileSync("reports/official-exam-format-claims-audit.json", "utf8")) as {
  format: string;
  version: string;
  ok: boolean;
  surfaceCount: number;
  boundarySurfaceCount: number;
  violationCount: number;
  claimsAboutOfficialFormat: boolean;
  claimsFormatUnchanged: boolean;
};

const CLAUSE_BREAK = new RegExp("[\\u060c\\u061b.\\u00b7!?\\n\\u007b\\u007d\\u0022\\u0027\\u0060]", "u");

function violationIn(text: string): string[] {
  // Same clause-level negation rule the audit script uses: a denial is not a claim.
  const edge = "[\\s\\u00bb\\u00ab\\u201c\\u201d\\u0027\\u0060\\u007b]";
  const denied = new RegExp("(" + edge + "|^)(" + config.negationMarkers.join("|") + ")", "iu");
  return config.forbiddenClaimPatterns
    .filter((entry) => {
      const regex = new RegExp(entry.pattern, "giu");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text))) {
        const clause = text.slice(Math.max(0, match.index - 120), match.index);
        const cut = clause.search(CLAUSE_BREAK);        const fragment = cut >= 0 ? clause.slice(cut + 1) : clause;
        if (denied.test(fragment)) continue;
        return true;
      }
      return false;
    })
    .map((entry) => entry.id);
}

describe("exam surfaces never claim an official grade, pass, certificate, or readiness", () => {
  it("audits every exam-facing surface listed in the config", () => {
    expect(config.surfaces.length).toBeGreaterThanOrEqual(8);
    for (const path of config.surfaces) expect(existsSync(path), path).toBe(true);
  });

  it("finds no forbidden claim in the shipped surfaces", () => {
    for (const path of config.surfaces) {
      expect(violationIn(readFileSync(path, "utf8")), path).toEqual([]);
    }
  });

  it("still bites on the assertions it exists to catch", () => {
    expect(violationIn("Wir garantieren dir das Bestehen der Prüfung.")).toContain("guaranteed-pass");
    expect(violationIn("Dein Prüfungsergebnis: bestanden. Prüfungsnote ist 2.")).toContain("official-grade");
    expect(violationIn("This app issues a certificate for your B2 level. Certified B2.")).toEqual(
      expect.arrayContaining(["certificate-issued", "level-certified"]),
    );
    expect(violationIn("أنت جاهزًا للدخول للامتحان رسميًا.")).toContain("exam-readiness-certified");
  });

  it("does not mistake a disclaimer for a claim", () => {
    expect(violationIn("لا تاريخ نجاح قطعي · لا نتيجة رسمية · لا خلط بين الصيغ.")).toEqual([]);
    expect(violationIn("تعرض المحتوى لكنها ليست جلسة مراقبة رسمية، ولا تُنشئ شهادة أو نتيجة رسمية.")).toEqual([]);
    expect(violationIn("دون تحويلها إلى نتيجة رسمية")).toEqual([]);
  });

  it("records the boundary count and refuses both official claims in its own artifact", () => {
    expect(audit.format).toBe("dwnb-official-exam-format-claims-audit");
    expect(audit.version).toBe(config.policyVersion);
    expect(audit.ok).toBe(true);
    expect(audit.surfaceCount).toBe(config.surfaces.length);
    expect(audit.violationCount).toBe(0);
    expect(audit.boundarySurfaceCount).toBeGreaterThan(0);
    expect(audit.claimsAboutOfficialFormat).toBe(false);
    expect(audit.claimsFormatUnchanged).toBe(false);
  });

  it("keeps the guard wired into the build and the artifacts current", () => {
    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<string, string>;
    expect(scripts.prebuild).toContain("exam:format-claims:audit");
    expect(scripts["exam:format-claims:audit"]).toContain("--check");
    expect(readFileSync("docs/generated/OFFICIAL-EXAM-FORMAT-CLAIMS.md", "utf8")).toContain("Official exam-format claim guard");
  });
});
