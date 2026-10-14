// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PRONUNCIATION_CONSISTENCY_BOUNDARY,
  PRONUNCIATION_CONSISTENCY_POLICY,
  buildPronunciationConsistencyAudit,
  checkLessonPronunciation,
} from "@/core/german/pronunciation-consistency";
import { academicLessonList, academicLessons } from "@/data/academic-lessons";
import type { FullLesson } from "@/types/lesson-content";

function lessonWith(items: Array<{ de: string; ipa: string; ar: string }>): FullLesson {
  return { ...(academicLessonList[0] as FullLesson), pronunciation: { ...(academicLessonList[0] as FullLesson).pronunciation, items } } as FullLesson;
}

describe("German ch transcription consistency", () => {
  it("flags a back-vowel ch written with the ich-Laut and a front-vowel ch written with [x]", () => {
    const audit = checkLessonPronunciation(lessonWith([{ de: "BErücksichtigung braucht Raum", ipa: "[bɛˈʁʏkˌzɪçtɪɡʊŋ bʁaʊ̯çt ˈʁaʊ̯m]", ar: "" }]));
    expect(audit.issues.map((issue) => issue.kind)).toContain("ch-back-but-coronal");
    const front = checkLessonPronunciation(lessonWith([{ de: "ich lese", ipa: "[ɪx ˈleːzə]", ar: "" }]));
    expect(front.issues.map((issue) => issue.kind)).toContain("ch-front-but-x");
  });

  it("accepts the correct sounds, the euch vowel spelling and the bisschen diminutive", () => {
    const good = checkLessonPronunciation(lessonWith([
      { de: "doch auch", ipa: "[dɔx aʊ̯x]", ar: "" },
      { de: "Ihr fühlt euch gut", ipa: "[iːɐ̯ fyːlt ɔʏ̯ç ɡuːt]", ar: "" },
      { de: "ein bisschen", ipa: "[aɪ̯n ˈbɪsçən]", ar: "" },
      { de: "durch", ipa: "[dʊʁç]", ar: "" },
    ]));
    expect(good.issues).toEqual([]);
    expect(good.aligned).toBe(4);
  });

  it("keeps the whole curriculum clean and re-reads the three corrections", () => {
    const audit = buildPronunciationConsistencyAudit();
    expect(audit.issues).toEqual([]);
    expect(audit.alignedItems).toBeGreaterThan(300);
    expect(audit.skippedItems + audit.alignedItems).toBe(audit.items);
    expect(audit.policyVersion).toBe(PRONUNCIATION_CONSISTENCY_POLICY);
    expect(audit.boundary).toBe(PRONUNCIATION_CONSISTENCY_BOUNDARY);
    const b2Six = academicLessons["b2-19"] as unknown as FullLesson;
    const items = JSON.stringify(b2Six.pronunciation);
    expect(items).toContain("[dɔx ˈoːdɐ dɔx]");
    expect(items).toContain("«sch» فيه [ʃ]");
    expect(items).not.toContain("dɔç");
    expect(items).not.toContain("صوتًا أماميًّا [ç] في النطق المعياري");
    expect(items).toContain("صوتًا خلفيًّا [x] في النطق المعياري");
    const source = readFileSync("src/data/lessons-b2-module6.ts", "utf8");
    expect(source).not.toContain("bʁaʊ̯çt");
    expect(source).not.toContain("ɔɪ̯ç");
    expect(source).not.toContain("„ich“-Laut in „doch“");
  });

  it("keeps the check wired into prebuild with a written report", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.prebuild).toContain("pronunciation:consistency");
    expect(pkg.scripts["pronunciation:consistency"]).toBe("tsx scripts/audit-pronunciation-consistency.ts");
    expect(readFileSync("reports/pronunciation-consistency-audit.json", "utf8")).toContain("ch-grapheme-ipa-consistency-v1");
  });
});
