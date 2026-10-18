import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LexicalGrammarPanel } from "@/components/lexical-grammar-panel";
import { academicLessonList } from "@/data/academic-lessons";
import { nounsByLesson, verbFramesByLesson } from "@/data/lexical-grammar-registry";
import { VOCABULARY_STAGE_BASELINE_NOUN_ANCHORS, VOCABULARY_STAGE_POLICY, nounOccursIn, splitNounAnchors, vocabularyStageVisibleTexts } from "@/core/lesson/vocabulary-stage";
import { createLexicalLoadContext, isFunctionWord, measureReadingLoad } from "@/core/content-validation/lexical-load";
import { foldGerman, lemmaCandidates } from "@/core/german/lemmatizer";
import { germanLemmaDictionary } from "@/data/german-lemma-dictionary";

// ADR-127 (P2-401): the vocabulary stage shows openly the documented noun anchors that the lesson's
// own reading text uses, and the lexical-load audit counts exactly what is shown.
const lesson = (id: string) => academicLessonList.find((entry) => entry.id === id)!;

describe("reading-anchored noun visibility (ADR-127)", () => {
  it("keeps the first four anchors and splits the rest by the reading text", () => {
    expect(VOCABULARY_STAGE_POLICY).toBe("reading-anchored-noun-visibility-v1");
    expect(VOCABULARY_STAGE_BASELINE_NOUN_ANCHORS).toBe(4);
    const nouns = nounsByLesson["a1-10"]!;
    const split = splitNounAnchors(nouns, lesson("a1-10").reading.textDe);
    expect(split.baseline).toEqual(nouns.slice(0, 4));
    expect(split.forReading.map((noun) => noun.lemma)).toContain("Wasser");
    expect(split.further.map((noun) => noun.lemma)).toContain("Apfel");
    expect(split.forReading.length + split.further.length).toBe(nouns.length - 4);
    expect(splitNounAnchors(nouns, "").forReading).toHaveLength(0);
  });

  it("matches plural, dative plural and genitive forms but not a substring", () => {
    const stuhl = nounsByLesson["a1-14"]!.find((noun) => noun.lemma === "Stuhl")!;
    const tokens = (text: string) => new Set(foldGerman(text).split(/[^a-z]+/).filter(Boolean));
    expect(nounOccursIn(stuhl, tokens("Zwei Stühle stehen hier."))).toBe(true);
    expect(nounOccursIn(stuhl, tokens("auf den Stühlen"))).toBe(true);
    expect(nounOccursIn(stuhl, tokens("die Farbe des Stuhls"))).toBe(true);
    expect(nounOccursIn(stuhl, tokens("Der Stuhlkreis beginnt."))).toBe(false);
  });

  it("counts lemma and plural of visible anchors plus every frame infinitive", () => {
    const texts = vocabularyStageVisibleTexts(nounsByLesson["a1-10"]!, verbFramesByLesson["a1-10"] ?? [], lesson("a1-10").reading.textDe);
    expect(texts).toContain("Wasser");
    expect(texts).not.toContain("Apfel");
    for (const frame of verbFramesByLesson["a1-10"] ?? []) expect(texts).toContain(frame.infinitive);
  });

  it("renders the reading anchors openly and leaves only the rest in the closed disclosure", () => {
    const view = render(createElement(LexicalGrammarPanel, { lessonId: "a1-10", readingText: lesson("a1-10").reading.textDe }));
    const split = splitNounAnchors(nounsByLesson["a1-10"]!, lesson("a1-10").reading.textDe);
    const readingBlock = view.container.querySelector(".reading-noun-anchors")!;
    expect(readingBlock.textContent).toContain(`ستقابلها في نص القراءة · ${split.forReading.length}`);
    expect(readingBlock.querySelectorAll(".reading-noun-list > li")).toHaveLength(split.forReading.length);
    expect(readingBlock.textContent).toContain("das Wasser");
    const extras = screen.getByText("Weitere Zielnomen").closest("details")!;
    expect(extras.hasAttribute("open")).toBe(false);
    expect(extras.textContent).toContain(`أسماء هدف إضافية موثقة · ${split.further.length}`);
    fireEvent.click(screen.getByText("Weitere Zielnomen"));
    expect(extras.textContent).toContain("der Apfel");
    expect(extras.textContent).not.toContain("das Wasser");
    view.unmount();
  });
});

describe("lexical-load v2 definitions (ADR-127)", () => {
  const context = createLexicalLoadContext({ dictionary: germanLemmaDictionary, stopWords: ["werden", "haben", "können", "möchten", "und"], properNames: [], stem: (word) => word });

  it("treats irregular forms of stop-listed verbs as function words, through the dictionary only", () => {
    for (const word of ["wurde", "hast", "konnte", "möchte"]) expect(isFunctionWord(foldGerman(word).trim(), context), word).toBe(true);
    expect(isFunctionWord("kannte", context)).toBe(false);
    expect(isFunctionWord("haus", context)).toBe(false);
  });

  it("maps participle I adjectives and nouns to the infinitive", () => {
    expect(lemmaCandidates("wartende", germanLemmaDictionary)).toContain("warten");
    expect(lemmaCandidates("entstehenden", germanLemmaDictionary)).toContain("entstehen");
  });

  it("adds the vocabulary stage to the current lesson's support only", () => {
    const [first, second] = academicLessonList;
    const withStage = measureReadingLoad([first!, second!], context, (id) => (id === first!.id ? ["Zauberwort"] : []));
    const without = measureReadingLoad([first!, second!], context);
    expect(withStage[0]!.pct).toBeLessThanOrEqual(without[0]!.pct);
    expect(withStage).toHaveLength(2);
  });
});
