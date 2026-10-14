// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHUNK_PROMPT_BOUNDARY, CHUNK_PROMPT_POLICY, chunkPromptFor, summarizeChunkPromptCoverage } from "@/core/srs/chunk-prompts";
import type { LessonSrsCard } from "@/core/srs/lesson-cards";
import { reviewCards } from "@/data/review-cards";

function card(front: string, hint = ""): LessonSrsCard {
  return { id: `test:${front}`, front, back: "معنى", hint, tags: ["A1"] };
}

describe("collocation-first review prompts", () => {
  it("turns a single noun into a gap in an authored chunk instead of an isolated word", () => {
    const prompt = chunkPromptFor(card("einreichen"));
    expect(prompt, "einreichen must resolve from the authored collocation network").not.toBeNull();
    expect(prompt!.source).toBe("collocation-network");
    expect(prompt!.gappedDe).toBe("einen Antrag ___");
    expect(prompt!.chunkDe).toBe("einen Antrag einreichen");
    expect(prompt!.answerDe).toBe("einreichen");
    expect(prompt!.askAr).toContain("أكمل التركيب");
  });

  it("falls back to the lesson's own sentence for words without a network entry", () => {
    const prompt = chunkPromptFor(card("pünktlich", "مثال: Der Bus ist pünktlich."));
    expect(prompt?.source).toBe("card-example");
    expect(prompt?.gappedDe).toBe("Der Bus ist ___.");
    expect(chunkPromptFor(card("pünktlich", "بلا مثال"))).toBeNull();
  });

  it("never matches a word inside a longer word", () => {
    // hängen must not be resolved from «abhängen», eins must not resolve from «eine/einsetzen»
    expect(chunkPromptFor(card("eins"))).toBeNull();
    expect(chunkPromptFor(card("hängen"))).toBeNull();
    expect(chunkPromptFor(card("die Entscheidung"))).toBeNull(); // multi-word cards stay untouched
  });

  it("reports the real coverage of the authored card deck without hiding gaps", () => {
    const coverage = summarizeChunkPromptCoverage(reviewCards as unknown as LessonSrsCard[]);
    expect(coverage.cards).toBeGreaterThan(2000);
    expect(coverage.singleWordCards).toBeGreaterThan(50);
    expect(coverage.withChunk).toBeLessThanOrEqual(coverage.singleWordCards);
    expect(coverage.coveragePct).toBeGreaterThan(50);
    expect(coverage.coveragePct).toBeLessThan(100);
    expect(coverage.boundary).toBe(CHUNK_PROMPT_BOUNDARY);
    expect(coverage.policyVersion).toBe(CHUNK_PROMPT_POLICY);
  });

  it("is wired into the review card with an explicit policy attribute", () => {
    const page = readFileSync("src/app/review/page.tsx", "utf8");
    expect(page).toContain("const chunkPrompt = useMemo(() => (card ? chunkPromptFor(card) : null), [card]);");
    expect(page).toContain("data-chunk-prompt={CHUNK_PROMPT_POLICY}");
    expect(page).toContain("استرجاع التركيب");
    expect(page).toContain("أكمل الفراغ بالكلمة المستهدفة ثم انقر للكشف");
  });
});
