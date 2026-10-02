// @vitest-environment node
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { CURRICULUM_PHONEME_REFERENCE_ROWS } from "@/config/curriculum-phoneme-reference.generated";
import { germanPhonemes } from "@/core/german/phoneme-inventory";
import {
  createPhonemeReferenceLexicon,
  defaultPhonemeReferenceLexicon,
  lookupPhonemeReference,
  splitIpaIntoPhonemes,
} from "@/core/german/phoneme-reference";

type PronunciationItem = { de: string; ipa: string; ar: string };

function lessonItems(): { lessonId: string; item: PronunciationItem }[] {
  const rows: { lessonId: string; item: PronunciationItem }[] = [];
  for (const lesson of academicLessonList) {
    const items = (lesson as { pronunciation?: { items?: PronunciationItem[] } }).pronunciation?.items ?? [];
    for (const item of items) rows.push({ lessonId: (lesson as { id: string }).id, item });
  }
  return rows;
}

/**
 * The curriculum, not an idealised phonology, decides which symbols this engine
 * may claim to know. If an authored row introduces a symbol the inventory has
 * no entry for, the reference panel would show it as a bare chip with no
 * Arabic note and no near-sound pair — so the drift is a test failure.
 */
describe("the declared phoneme inventory covers the whole authored corpus", () => {
  const rows = lessonItems();
  const inventory = new Set(germanPhonemes.map((phoneme) => phoneme.base));

  it("scans a real corpus, not a fixture", () => {
    expect(rows.length).toBeGreaterThan(450);
    expect(new Set(rows.map((row) => row.lessonId)).size).toBe(96);
  });

  it("emits only symbols that have an inventory row", () => {
    const unknown: string[] = [];
    for (const { lessonId, item } of rows) {
      for (const symbol of splitIpaIntoPhonemes(item.ipa)) {
        const bare = symbol.replace("ː", "").replace(/\u032f/gu, "");
        if (!inventory.has(symbol) && !inventory.has(bare)) {
          unknown.push(`${lessonId}:${item.de}->'${symbol}'`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it("never turns a space or a stray combining mark into a phoneme", () => {
    for (const { lessonId, item } of rows) {
      for (const symbol of splitIpaIntoPhonemes(item.ipa)) {
        expect(symbol.length > 0 && !/^\s+$/.test(symbol), `${lessonId}:${item.de} -> '${symbol}'`).toBe(true);
        expect(/^[\u0300-\u036f]+$/.test(symbol), `${lessonId}:${item.de} -> ${symbol}`).toBe(false);
      }
    }
    // A word a learner can practise must never carry a placeholder-only
    // transcription; sentence rows may show only the stressed fragment.
    const placeholderWords = rows.filter(
      (row) => !/\s/u.test(row.item.de.trim()) && !/\p{L}/u.test(row.item.ipa.replace(/[\[\]]/gu, "")),
    );
    expect(placeholderWords.map((row) => `${row.lessonId}:${row.item.de}`)).toEqual([]);
  });

  it("keeps every word-level row usable as an authored reference", () => {
    const wordRows = rows.filter((row) => !/\s/u.test(row.item.de.trim()));
    expect(wordRows.length).toBeGreaterThan(150);
    const lexicon = createPhonemeReferenceLexicon(wordRows.map((row) => ({ ...row.item, source: `lesson:${row.lessonId}` })));
    const unresolved = wordRows.filter(
      (row) => lookupPhonemeReference(row.item.de, lexicon).state !== "authored-reference",
    );
    expect(unresolved.map((row) => `${row.lessonId}:${row.item.de}`)).toEqual([]);
    // 19 inventory words plus the distinct lesson spellings, deduplicated.
    expect(lexicon.entries.size).toBeGreaterThanOrEqual(wordRows.filter((row, index, all) => all.findIndex((other) => other.item.de.toLowerCase() === row.item.de.toLowerCase()) === index).length);
    expect(lexicon.entries.size).toBeGreaterThan(200);
  });

  it("resolves every authored word row through the checked-in curriculum lexicon", () => {
    // The generated module IS the wiring; without it the panel covered 6 of 207
    // curriculum words. The rows are rebuilt here from the lesson data, so a
    // curriculum change that skips `npm run phoneme:lexicon:generate` fails.
    const rebuilt = rows
      .filter((row) => !/\s/u.test(row.item.de.trim()))
      .filter((row) => /^\[[^\]]+\]$/u.test(row.item.ipa.trim()))
      .filter((row) => /\p{L}/u.test(row.item.ipa.trim().slice(1, -1)))
      .map((row) => `${row.item.de}|${row.item.ipa.trim()}|lesson:${row.lessonId}`);
    expect(CURRICULUM_PHONEME_REFERENCE_ROWS.map((row) => `${row.de}|${row.ipa}|${row.source}`).join("\n")).toBe(
      rebuilt.join("\n"),
    );

    const wordRows = rows.filter((row) => !/\s/u.test(row.item.de.trim()));
    const unresolved = wordRows.filter(
      (row) => lookupPhonemeReference(row.item.de, defaultPhonemeReferenceLexicon).state !== "authored-reference",
    );
    expect(unresolved.map((row) => `${row.lessonId}:${row.item.de}`)).toEqual([]);
    // Nothing is sourceless: every entry can be traced back to its lesson.
    const orphan = [...defaultPhonemeReferenceLexicon.entries.values()]
      .filter((entry) => typeof entry.source !== "string" || entry.source.length < 4)
      .map((entry) => entry.word);
    expect(orphan).toEqual([]);
    // `anrufen` is authored twice with different stress marking; both readings
    // must survive instead of one silently winning.
    expect(defaultPhonemeReferenceLexicon.entries.get("anrufen")?.variants?.length ?? 0).toBeGreaterThan(0);
  });

  it("keeps the Arabic gloss present for every authored pronunciation row", () => {
    const thin = rows.filter((row) => row.item.de.trim().length > 0 && row.item.ar.trim().length < 2 && !/^[A-ZÄÖÜË]$/.test(row.item.de.trim()));
    expect(thin.map((row) => `${row.lessonId}:${row.item.de}`)).toEqual([]);
  });
});
