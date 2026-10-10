import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";

const DRAFT_DIR = join(process.cwd(), "reports", "drafts");
const DRAFT_FILES = readdirSync(DRAFT_DIR).filter((f) => /^library-.*-explanations\.draft\.json$/.test(f));

/** المسودات لا تُطبَّق قبل موافقة المالك، لكن كل اقتباس فيها يجب أن يرد حرفيًا في نص بنده. */
describe("library explanation drafts", () => {
  const textById = new Map<string, string>();
  for (const item of [...readingLibrary, ...listeningLibrary] as { textDe: string; questions: { id: string }[] }[]) {
    for (const q of item.questions) textById.set(q.id, item.textDe);
  }

  it("has draft files to check", () => {
    expect(DRAFT_FILES.length).toBeGreaterThan(0);
  });

  for (const file of DRAFT_FILES) {
    describe(file, () => {
      const draft = JSON.parse(readFileSync(join(DRAFT_DIR, file), "utf8"));

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
  }
});
