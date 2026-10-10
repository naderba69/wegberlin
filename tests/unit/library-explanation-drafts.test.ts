import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readingLibrary } from "@/data/library-registry";

/** المسودات لا تُطبَّق قبل موافقة المالك، لكن كل اقتباس فيها يجب أن يرد حرفيًا في نص بنده. */
describe("library explanation drafts", () => {
  const draft = JSON.parse(readFileSync("reports/drafts/library-reading-a1-explanations.draft.json", "utf8"));
  const textById = new Map<string, string>();
  for (const item of readingLibrary as { textDe: string; questions: { id: string }[] }[]) {
    for (const q of item.questions) textById.set(q.id, item.textDe);
  }

  it("is marked as not applied", () => {
    expect(draft.status).toBe("draft-not-applied");
  });

  it("quotes only verbatim text from its own item", () => {
    for (const entry of draft.items as { id: string; explanationAr: string }[]) {
      const text = textById.get(entry.id);
      expect(text, entry.id).toBeDefined();
      const quotes = [...entry.explanationAr.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
      expect(quotes.length, entry.id).toBeGreaterThan(0);
      for (const quote of quotes) expect(text!.includes(quote), `${entry.id}: ${quote}`).toBe(true);
    }
  });
});
