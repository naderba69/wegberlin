import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { getArticulationGuide } from "@/core/pronunciation/articulation";
import { arabicLearnerPronunciationInventory } from "@/data/arabic-learner-pronunciation-inventory";
import { arabicLearnerPronunciationClaimSources, pronunciationSources } from "@/core/pronunciation/arabic-learner-claim-sources";
import { IPA_SOURCE_DICTIONARY, IPA_SOURCE_VERIFICATION_CSV, ipaVerificationKey, manualIpaDecisions } from "@/core/german/ipa-source-verification";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.trim().split("\n")) {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quoted && char === '"' && line[index + 1] === '"') { current += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(current); current = ""; }
      else current += char;
    }
    cells.push(current);
    rows.push(cells);
  }
  return rows;
}

const [header, ...rows] = parseCsv(readFileSync(IPA_SOURCE_VERIFICATION_CSV, "utf8"));
const byKey = new Map(rows.map((row) => [ipaVerificationKey(row[1] ?? "", row[2] ?? ""), row]));

function curriculumTranscriptions(): Array<{ source: string; de: string; ipa: string }> {
  const list: Array<{ source: string; de: string; ipa: string }> = [];
  for (const lesson of academicLessonList) {
    for (const item of lesson.pronunciation.items) list.push({ source: `lesson:${lesson.id}`, de: item.de, ipa: item.ipa });
    for (const pair of getArticulationGuide(lesson).pairs) for (const side of [pair.left, pair.right]) list.push({ source: `pair:${pair.id}`, de: side.de, ipa: side.ipa });
  }
  for (const item of arabicLearnerPronunciationInventory) {
    list.push({ source: `inventory:${item.id}`, de: item.leftDe, ipa: item.leftIpa });
    list.push({ source: `inventory:${item.id}`, de: item.rightDe, ipa: item.rightIpa });
  }
  return list;
}

describe("ADR-134 IPA source verification", () => {
  it("records the dictionary provenance", () => {
    expect(header).toEqual(["source", "de", "ipa", "status", "dictionary_ipa", "decision", "note_ar"]);
    expect(IPA_SOURCE_DICTIONARY.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(IPA_SOURCE_DICTIONARY.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("covers every transcription currently shown to learners (edits must be re-verified)", () => {
    const missing = curriculumTranscriptions().filter((item) => !byKey.has(ipaVerificationKey(item.de, item.ipa)));
    expect(missing).toEqual([]);
  });

  it("leaves no unresolved mismatch: each one carries a recorded manual decision", () => {
    const unresolved = rows.filter((row) => (row[3] === "mismatch" || row[3] === "not-in-dictionary") && row[5] === "accepted-dictionary-match");
    expect(unresolved).toEqual([]);
    for (const row of rows.filter((item) => item[5] !== "accepted-dictionary-match")) {
      expect(manualIpaDecisions[ipaVerificationKey(row[1] ?? "", row[2] ?? "")]).toBeDefined();
      expect((row[6] ?? "").length).toBeGreaterThan(10);
    }
  });

  it("verifies every contrast pair and inventory transcription against the dictionary", () => {
    const scoped = rows.filter((row) => /^(pair|inventory):/.test(row[0] ?? ""));
    expect(scoped.length).toBeGreaterThanOrEqual(50);
    const segmental = scoped.filter((row) => row[5] !== "out-of-scope-intonation-notation");
    expect(segmental.every((row) => row[3] !== "mismatch")).toBe(true);
  });

  it("does not reintroduce the transcription errors corrected in v242", () => {
    const shown = curriculumTranscriptions().map((item) => item.ipa).join("\n");
    for (const wrong of ["noˈtsiːʁə", "jɛˈdɔx", "ˈalzoː", "ˈkoma ", "deːs bəˈʃaɪ̯ts", "ˈaʊ̯sɡəvɛʁtət", "ˈalɐdɪŋs", "ʊnˈzɪçɐ", "teleˈfoːn", "telefoˈniː", "tsɛntrʊm", "ʔɔrdnʊŋ", "fɔrdərʊŋ"]) {
      expect(shown.includes(wrong), wrong).toBe(false);
    }
  });

  it("checks each of the 18 Arabic-learner claims against named published sources without upgrading review status", () => {
    const ids = arabicLearnerPronunciationInventory.map((row) => row.id).sort();
    expect(Object.keys(arabicLearnerPronunciationClaimSources).sort()).toEqual(ids);
    for (const [id, entry] of Object.entries(arabicLearnerPronunciationClaimSources)) {
      expect(entry.sources.length, id).toBeGreaterThan(0);
      for (const ref of entry.sources) expect(pronunciationSources[ref]?.url, `${id}:${ref}`).toMatch(/^https:\/\//);
      expect(entry.noteAr.length, id).toBeGreaterThan(10);
    }
    const counts = Object.values(arabicLearnerPronunciationClaimSources).reduce<Record<string, number>>((acc, entry) => ({ ...acc, [entry.support]: (acc[entry.support] ?? 0) + 1 }), {});
    expect(counts).toEqual({ supported: 10, "partially-supported": 3, "revised-to-positive-transfer": 2, "general-daf-not-arabic-specific": 3 });
    expect(arabicLearnerPronunciationInventory.every((row) => row.reviewStatus === "authored-review-pending")).toBe(true);
  });

  it("keeps the source-backed positive-transfer wording for h and vowel length", () => {
    const text = (id: string) => arabicLearnerPronunciationInventory.find((row) => row.id === id)?.possibleArabicLearnerConfusionAr ?? "";
    expect(text("ar-pron-h-zero")).toContain("الهمزة");
    expect(text("ar-pron-vowel-length-a")).toContain("مألوف");
    expect(text("ar-pron-r-variants")).toContain("غين");
  });
});
