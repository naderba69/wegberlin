import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";
import { GOETHE_B1_THEMES_6_KEYS, isGoetheB1Themes6Entry } from "@/core/content-validation/lexical-review-packet";

// ADR-155 / v264: first batch of the complete-levels roadmap. 102 Goethe-Zertifikat B1 words that no lesson used
// (household and repairs in b1-08, travel and transport in b1-11, feelings and relationships in b1-19, body and
// health in b1-20) are appended to the phrases and cards of lessons that already had an e8, so each lesson gets a
// second matching exercise, e9. Appended only, so no stored ID moves. das Herz is deferred: its dative „dem Herzen“
// cannot be expressed by the one-oblique-form seed, and a wrong form is worse than a missing anchor.
const WORDS: Record<string, readonly string[]> = {"b1-20": ["die Nase", "der Finger", "die Lippe", "die Brust", "der Nerv", "die Pille", "die Therapie", "die Schwangerschaft", "der Kranke", "die Krankenschwester", "der Pfleger / die Pflegerin", "blass", "schlank", "mager", "schminken", "die Frisur", "der Bart", "beißen", "stechen", "betrunken", "die Droge", "das Suchtmittel", "der Raucher / die Raucherin", "der Nichtraucher / die Nichtraucherin"], "b1-08": ["die Badewanne", "das Kissen", "die Kerze", "der Spiegel", "schief", "die Zahnbürste", "die Bürste", "die Couch", "der Hammer", "der Nagel", "die Zange", "das Loch", "kleben", "der Kasten", "staubsaugen", "das Waschmittel", "reinigen", "trocknen", "abwaschen", "der Dreck", "die Hausmeisterin", "die Vermietung", "die Garderobe", "gießen", "das Zuhause", "der Wohnsitz"], "b1-11": ["der Passagier / die Passagierin", "die Landung", "das Visum", "das Konsulat", "der Aufenthalt", "die Kabine", "der Speisewagen", "die Rundfahrt", "das Souvenir", "der Steward / die Stewardess", "die Eisenbahn", "das Boot", "das Kraftfahrzeug", "das Kennzeichen", "der Laster", "überfahren", "die Radfahrerin", "der Transport", "der Tourismus", "zelten", "die Hütte", "der Zuschlag", "die Eile", "eilen", "aufwärts", "abwärts", "die Metropole"], "b1-19": ["einsam", "fröhlich", "dankbar", "vermissen", "die Träne", "küssen", "der Kuss", "umarmen", "gemütlich", "winken", "schütteln", "begegnen", "duzen", "klagen", "wahnsinnig", "unheimlich", "menschlich", "äußerlich", "entgegenkommen", "zurechtkommen", "wieso", "neulich", "vorhin", "dauernd", "das Geschlecht"]};
const NOUNS: Record<string, readonly string[]> = {"b1-20": ["Nase", "Finger", "Lippe", "Brust", "Nerv", "Pille", "Therapie", "Schwangerschaft", "Kranke", "Krankenschwester", "Pfleger", "Pflegerin", "Frisur", "Bart", "Droge", "Suchtmittel", "Raucher", "Raucherin", "Nichtraucher", "Nichtraucherin"], "b1-08": ["Badewanne", "Kissen", "Kerze", "Spiegel", "Zahnbürste", "Bürste", "Couch", "Hammer", "Nagel", "Zange", "Loch", "Kasten", "Waschmittel", "Dreck", "Hausmeisterin", "Vermietung", "Garderobe", "Zuhause", "Wohnsitz"], "b1-11": ["Passagier", "Passagierin", "Landung", "Visum", "Konsulat", "Aufenthalt", "Kabine", "Speisewagen", "Rundfahrt", "Souvenir", "Steward", "Stewardess", "Eisenbahn", "Boot", "Kraftfahrzeug", "Kennzeichen", "Laster", "Radfahrerin", "Transport", "Tourismus", "Hütte", "Zuschlag", "Eile", "Metropole"], "b1-19": ["Träne", "Kuss", "Geschlecht"]};
const QUOTED: Record<string, readonly string[]> = {"b1-20": ["Im Sommer hat mich eine Biene gestochen.", "Der ständige Lärm geht mir auf die Nerven."], "b1-08": ["Das Bild hängt schief, kannst du es gerade machen?", "Kannst du im Urlaub meine Blumen gießen?"], "b1-11": ["Für den schnellen Zug muss man einen Zuschlag bezahlen."], "b1-19": ["Im Team duzen sich alle, auch die Chefin.", "Ich vermisse meine Familie in Tunis."]};

describe("Goethe B1 absent words, batch 1 of the complete-levels roadmap (ADR-155)", () => {
  for (const [lessonId, words] of Object.entries(WORDS)) {
    const lesson = academicLessonList.find((item) => item.id === lessonId)!;
    const vocabularyText = [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");

    it(`${lessonId}: appends every word as phrase and card with a German example sentence`, () => {
      expect(lesson.phrases.slice(-words.length).map((phrase) => phrase.de)).toEqual(words);
      expect(lesson.flashcards.slice(-words.length).map((card) => card.frontDe)).toEqual(words);
      for (const word of words) {
        const card = lesson.flashcards.find((item) => item.frontDe === word)!;
        expect(card.backAr, word).toBe(lesson.phrases.find((phrase) => phrase.de === word)!.ar);
        expect(card.exampleDe, `example ${word}`).toMatch(/^[„A-ZÄÖÜ].*[.?!“]$/u);
      }
    });

    it(`${lessonId}: practises five of the words in e9, after e8, quoting the cards verbatim`, () => {
      const ids = lesson.exercises.map((item) => item.id);
      expect(ids.indexOf(`${lessonId}-e9`)).toBe(ids.indexOf(`${lessonId}-e8`) + 1);
      expect(ids.at(-1)).toBe(`${lessonId}-e9`);
      const exercise = lesson.exercises.find((item) => item.id === `${lessonId}-e9`);
      expect(exercise?.type).toBe("matching");
      if (exercise?.type !== "matching") return;
      expect(exercise.pairs.length).toBe(5);
      for (const pair of exercise.pairs) {
        expect(words, pair.left).toContain(pair.left);
        expect(lesson.flashcards.find((card) => card.frontDe === pair.left)?.backAr, pair.left).toBe(pair.right);
      }
      expect(new Set(exercise.pairs.map((pair) => pair.right)).size).toBe(5);
      const examples = lesson.flashcards.map((card) => card.exampleDe).join(" \n ");
      for (const quoted of QUOTED[lessonId]!) {
        expect(exercise.explanationAr, quoted).toContain(quoted);
        expect(examples, quoted).toContain(quoted);
      }
    });

    it(`${lessonId}: anchors every new noun after the older anchors, outside P0-98`, () => {
      const anchors = goetheCoreNounEntries.filter((entry) => entry.lessonId === lessonId);
      const added = anchors.filter(isGoetheB1Themes6Entry);
      expect(added.map((entry) => entry.lemma)).toEqual(NOUNS[lessonId]);
      expect(anchors.slice(-added.length)).toEqual(added);
      const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
      for (const entry of added) {
        expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
        expect(p098.has(entry.id), entry.id).toBe(false);
        expect(vocabularyText.includes(entry.lemma), `${entry.id} ${entry.lemma}`).toBe(true);
      }
    });
  }

  it("keys the new scope by lesson and lemma and keeps every anchor source-verified", () => {
    const added = goetheCoreNounEntries.filter(isGoetheB1Themes6Entry);
    expect(added.length).toBe(GOETHE_B1_THEMES_6_KEYS.size);
    expect(added.length).toBe(66);
    expect(added.find((entry) => entry.lemma === "Kranke")!.caseForms).toEqual({ nominative: "der Kranke", accusative: "den Kranken", dative: "dem Kranken" });
    expect(added.find((entry) => entry.lemma === "Visum")!.plural.form).toBe("Visa");
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-b1-themes-6-nouns-2026-10-21.csv", "utf8").trimEnd().split("\n");
    expect(lines[0]).toBe('"anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"');
    const rows = new Map(lines.slice(1).map((line) => {
      const cells = line.slice(1, -1).split('","');
      return [cells[0]!, cells] as const;
    }));
    expect(rows.size).toBe(added.length);
    for (const entry of added) {
      const cells = rows.get(entry.id);
      expect(cells, entry.id).toBeDefined();
      expect([cells![1], cells![2], cells![3], cells![4], cells![5]], entry.id).toEqual([entry.lessonId, entry.lemma, entry.gender, entry.caseForms.nominative, entry.plural.form ?? ""]);
      expect(cells![6], entry.id).toMatch(/^confirmed-wiktionary/u);
    }
  });

  it("takes the words only from the B1 list's absent words and removes them from it", () => {
    const report = JSON.parse(readFileSync("reports/goethe-reference-alignment.json", "utf8")) as { levels: { B1: { absentFromAllLessonsList: string[] } } };
    const absent = new Set(report.levels.B1.absentFromAllLessonsList);
    for (const word of ["die Badewanne", "das Visum", "einsam", "die Nase", "staubsaugen", "zelten", "vermissen", "stechen"]) expect(absent.has(word), word).toBe(false);
  });
});
