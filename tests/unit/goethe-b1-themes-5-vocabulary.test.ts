import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { goetheCoreNounEntries, nounGrammarEntries, originalP098NounEntries } from "@/data/lexical-grammar-registry";

// ADR-154 / v263: the B1 project lesson b1-24 was the last B1 lesson without a vocabulary e8. It now teaches the
// project-work words of the Goethe-Zertifikat B1 list that no lesson used (research, ideas, preparation, the state of
// things, reach, evaluation) and brings back the four words that the v257 rewrites had removed from every lesson
// (übrigens, ärgerlich, beruhigen, der Einfluss). Every word is a vocabulary phrase and a review card with an example
// sentence, most of them set in the book swap of the lesson's free-production task (appended, so no stored ID moves),
// practised in one matching e8.
const lesson = academicLessonList.find((item) => item.id === "b1-24")!;
const anchors = goetheCoreNounEntries.filter((entry) => entry.lessonId === "b1-24");
const vocabularyText = [...lesson.phrases.map((phrase) => phrase.de), ...lesson.flashcards.map((card) => card.frontDe)].join(" \n ");

describe("Goethe B1 project-work vocabulary in b1-24 (ADR-154)", () => {
  it("teaches the words as phrase and as card with a German example sentence", () => {
    const words = ["die Recherche", "der Einfall", "einfallen", "die Anleitung", "ankündigen", "auffordern", "die Aufforderung", "besorgen", "anschaffen", "vergrößern", "der Zustand", "ordentlich", "durcheinander", "zahlreich", "weltweit", "regional", "populär", "die Tradition", "kürzlich", "nochmals", "übrigens", "ärgerlich", "beruhigen", "der Einfluss"];
    const phrases = new Set(lesson.phrases.map((phrase) => phrase.de));
    for (const word of words) {
      expect(phrases.has(word), `phrase ${word}`).toBe(true);
      const card = lesson.flashcards.find((item) => item.frontDe === word);
      expect(card, `card ${word}`).toBeDefined();
      expect(card!.exampleDe, `example ${word}`).toMatch(/^[„A-ZÄÖÜ].*[.?!“]$/u);
    }
    // the original 18 phrases stay first, the new words follow
    expect(lesson.phrases.length - 18).toBe(words.length);
    expect(lesson.phrases.slice(18).map((phrase) => phrase.de)).toEqual(words);
  });

  it("brings back the four words lost in the v257 rewrites", () => {
    for (const word of ["übrigens", "ärgerlich", "beruhigen", "der Einfluss"]) {
      expect(lesson.flashcards.some((card) => card.frontDe === word), word).toBe(true);
    }
    const report = JSON.parse(readFileSync("reports/goethe-reference-alignment.json", "utf8")) as { levels: { B1: { absentFromAllLessonsList: string[]; firstAppearsLaterList: string[] } } };
    const listed = [...report.levels.B1.absentFromAllLessonsList, ...report.levels.B1.firstAppearsLaterList.map((item) => item.split(" → ")[0])];
    for (const word of ["übrigens", "ärgerlich", "beruhigen", "der Einfluss", "die Recherche", "ankündigen", "auffordern"]) expect(listed, word).not.toContain(word);
  });

  it("anchors every new noun outside the original P0-98 scope and keeps it source-verified", () => {
    expect(anchors.map((entry) => entry.lemma).filter((lemma) => lemma !== "Suchzeit")).toEqual(expect.arrayContaining(["Recherche", "Einfall", "Anleitung", "Aufforderung", "Zustand", "Tradition", "Einfluss"]));
    const added = anchors.filter((entry) => ["Recherche", "Einfall", "Anleitung", "Aufforderung", "Zustand", "Tradition", "Einfluss"].includes(entry.lemma));
    expect(added.length).toBe(7);
    const p098 = new Set(originalP098NounEntries.map((entry) => entry.id));
    for (const entry of added) {
      expect(nounGrammarEntries.some((item) => item.id === entry.id)).toBe(true);
      expect(p098.has(entry.id), entry.id).toBe(false);
      expect(vocabularyText.includes(entry.lemma), `${entry.id} ${entry.lemma}`).toBe(true);
    }
    expect(added.find((entry) => entry.lemma === "Einfluss")!.plural.form).toBe("Einflüsse");
    const lines = readFileSync("reports/lexical-review-packet/source-verification-goethe-b1-themes-5-nouns-2026-10-21.csv", "utf8").trimEnd().split("\n");
    expect(lines[0]).toBe('"anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"');
    const rows = new Map(lines.slice(1).map((line) => {
      const cells = line.slice(1, -1).split('","');
      return [cells[0]!, cells] as const;
    }));
    expect(rows.size).toBe(added.length);
    for (const entry of added) {
      const cells = rows.get(entry.id);
      expect(cells, entry.id).toBeDefined();
      expect([cells![2], cells![3], cells![4], cells![5]], entry.id).toEqual([entry.lemma, entry.gender, entry.caseForms.nominative, entry.plural.form ?? ""]);
      expect(cells![6], entry.id).toMatch(/^confirmed-wiktionary/u);
    }
  });

  it("practises the words in one matching exercise, only after teaching them, quoting the cards verbatim", () => {
    const exercise = lesson.exercises.find((item) => item.id === "b1-24-e8");
    expect(exercise?.type).toBe("matching");
    if (exercise?.type !== "matching") return;
    expect(exercise.pairs.length).toBe(5);
    for (const pair of exercise.pairs) {
      expect(vocabularyText.includes(pair.left), pair.left).toBe(true);
      // the right side is the gloss the card teaches
      expect(lesson.flashcards.find((card) => card.frontDe === pair.left)?.backAr, pair.left).toBe(pair.right);
    }
    expect(new Set(exercise.pairs.map((pair) => pair.right)).size).toBe(5);
    const examples = lesson.flashcards.map((card) => card.exampleDe).join(" \n ");
    for (const quoted of ["Mir ist eine bessere Lösung eingefallen.", "in einem guten Zustand"]) {
      expect(exercise.explanationAr, quoted).toContain(quoted);
      expect(examples, quoted).toContain(quoted);
    }
  });
});
