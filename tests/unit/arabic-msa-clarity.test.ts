import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * P2-384 (v226): Arabic explanations outside the opt-in Tunisian mode must stay Modern Standard Arabic so they
 * are clear in Tunisia and in the rest of the Arab world. The scan rejects unmistakable dialect markers
 * (Tunisian/Maghrebi, Egyptian, Levantine, Gulf) in every Arabic string under src/data; the Tunisian notes
 * registry is the only exempt file because it is delivered exclusively in arabicSupport="tunisian-supported".
 * Ambiguous MSA homographs (e.g. «نحب»، «فما عليك إلا») are intentionally not listed.
 */
const DIALECT_MARKERS: Record<string, readonly string[]> = {
  "tunisian-maghrebi": ["برشا", "برشة", "توا", "باهي", "زادة", "موش", "ماهوش", "كيفاش", "شنوة", "شنوّة", "شنيّة", "ياسر", "باش", "شكون", "وقتاش", "قدّاش", "قداش", "ياخي", "ماكش", "ماهيش", "متاع", "متاعي"],
  egyptian: ["إزاي", "ازاي", "عايز", "عاوز", "دلوقتي", "كده", "بتاع", "مفيش", "ازيك"],
  levantine: ["هلق", "هلأ", "منيح", "هيك", "لهلق"],
  gulf: ["وايد", "شلون", "ابغى", "أبغى", "يبغى", "چذي"],
};
const EXEMPT = /tunisian-support-registry\.ts$/;
const letter = "\\u0600-\\u06ff";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|json)$/.test(name) && !EXEMPT.test(path)) out.push(path);
  }
  return out;
}

describe("P2-384 pan-Arab MSA clarity", () => {
  it("keeps every Arabic explanation outside Tunisian mode free of dialect markers", () => {
    const words = Object.values(DIALECT_MARKERS).flat();
    const pattern = new RegExp(`(?<![${letter}])(${words.join("|")})(?![${letter}])`, "u");
    const hits: string[] = [];
    let arabicStrings = 0;
    for (const file of walk("src/data")) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
        const value = match[1];
        if (!/[\u0600-\u06ff]/u.test(value)) continue;
        arabicStrings += 1;
        const hit = pattern.exec(value);
        if (hit) hits.push(`${file}: «${hit[1]}» in ${value.slice(0, 80)}`);
      }
    }
    expect(arabicStrings).toBeGreaterThan(20000);
    expect(hits).toEqual([]);
  });

  it("uses one month-name system throughout the Arabic explanations", () => {
    const maghrebi = /(?<![\u0600-\u06ff])(جانفي|فيفري|أفريل|جوان|جويلية|أوت)(?![\u0600-\u06ff])/u;
    const levantine = /(?<![\u0600-\u06ff])(كانون|شباط|آذار|نيسان|أيار|حزيران|تموز|أيلول|تشرين)(?![\u0600-\u06ff])/u;
    const offenders = walk("src/data").filter((file) => { const source = readFileSync(file, "utf8"); return maghrebi.test(source) || levantine.test(source); });
    expect(offenders).toEqual([]);
  });
});
