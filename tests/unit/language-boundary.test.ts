// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detectFragmentLanguage, fragmentLanguageAttributes, LANGUAGE_BOUNDARY_VERSION } from "@/core/i18n/language-boundary";
import report from "../../reports/language-boundary-audit.json";

describe("P0 exhaustive language and Bidi boundaries",()=>{
  it("classifies Arabic, German, mixed, and technical fragments deterministically",()=>{
    expect(LANGUAGE_BOUNDARY_VERSION).toBe("language-boundary-v1");
    expect(detectFragmentLanguage("اختر الجواب")).toBe("ar");
    expect(detectFragmentLanguage("Wie heißt du?")).toBe("de");
    expect(detectFragmentLanguage("Goethe نتيجة داخلية")).toBe("mixed");
    expect(detectFragmentLanguage("12:30")).toBe("technical");
  });

  it("returns paired lang/dir or an explicit isolated scope",()=>{
    expect(fragmentLanguageAttributes("مرحبا")).toEqual({lang:"ar",dir:"rtl"});
    expect(fragmentLanguageAttributes("Guten Tag")).toEqual({lang:"de",dir:"ltr"});
    expect(fragmentLanguageAttributes("B2 مستوى")).toEqual({dir:"auto","data-bidi-scope":"mixed"});
    expect(fragmentLanguageAttributes("2026-09-05")).toEqual({dir:"ltr","data-bidi-scope":"technical"});
  });

  it("audits every TSX opening tag with zero pairing or control-character issues",()=>{
    expect(report).toMatchObject({format:"dwnb-language-boundary-audit",version:"language-boundary-audit-v1",ok:true,tsxFiles:175,openingTagCount:6877,germanTagCount:388,technicalScopeCount:33,adaptiveConsumerCount:10,mixedStaticCount:235,issues:[]});
    expect(report.ltrTagCount).toBeGreaterThanOrEqual(report.germanTagCount);
  });

  it("keeps all generic answer-bank renderers on adaptive language attributes",()=>{
    const files=["exercise-card","diagnostic-view","library-view","module-review","a1-level-assessment","a2-level-assessment","b1-level-assessment","b2-level-assessment","targeted-choice-simulation","targeted-listening-simulation"];
    for(const file of files)expect(readFileSync(`src/components/${file}.tsx`,"utf8"),file).toContain("fragmentLanguageAttributes");
  });

  it("enforces Arabic plaintext containment and explicit fragment isolation in CSS",()=>{
    const css=readFileSync("src/app/globals.css","utf8");
    expect(css).toContain('html[lang="ar"][dir="rtl"] :where(');
    expect(css).toContain("unicode-bidi:plaintext");
    expect(css).toContain('[lang="de"][dir="ltr"],[data-bidi-scope],bdi{unicode-bidi:isolate!important}');
  });

  it("commits a readable report with the same content hash and honest manual boundary",()=>{
    const markdown=readFileSync("docs/generated/LANGUAGE_BOUNDARY_REPORT.md","utf8");
    expect(markdown).toContain(report.contentSha256);
    expect(markdown).toContain("235");
    expect(markdown).toContain("do not replace physical browser/screen-reader review");
  });
});
