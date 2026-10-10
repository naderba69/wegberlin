import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";

/** مسودة إعادة صياغة الجملتين للفجوتين 36 و37 في نصوص Sprachbausteine (بانتظار موافقة المالك). */
const DRAFT = join(process.cwd(), "reports", "drafts", "exam-bank-gap-rewrites-2026-10-10.draft.json");

type Draft = {
  status: string;
  texts: { id: string; oldTextDe: string; newTextDe: string }[];
  items: { id: string; textId: string; explanationAr: string }[];
};

/** يطابق النص بعد إزالة علامات الفجوات ومسافات زائدة، كما في فحص الاقتباس الحرفي. */
function normalize(text: string): string {
  return text.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
}

const draft = JSON.parse(readFileSync(DRAFT, "utf8")) as Draft;

describe("gap rewrites draft (Sprachbausteine 36/37)", () => {
  it("is still pending owner approval", () => {
    expect(draft.status).toBe("draft-owner-approval-required");
  });

  it("covers the ten flagged gap items, two per text", () => {
    expect(draft.items.length).toBe(10);
    expect(draft.texts.length).toBe(5);
  });

  for (const t of draft.texts) {
    it(`${t.id}: keeps gap markers [31]..[40] in order`, () => {
      const marks = [...t.newTextDe.matchAll(/\[(\d+)\]/g)].map((m) => m[1]);
      expect(marks).toEqual(Array.from({ length: 10 }, (_, i) => String(31 + i)));
    });
  }

  it("quotes only verbatim text from the NEW text", () => {
    const byId = new Map(draft.texts.map((t) => [t.id, t.newTextDe]));
    for (const item of draft.items) {
      const source = normalize(byId.get(item.textId) ?? "");
      const quotes = [...item.explanationAr.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
      expect(quotes.length, item.id).toBeGreaterThan(0);
      for (const quote of quotes) expect(source.includes(normalize(quote)), `${item.id}: ${quote}`).toBe(true);
    }
  });

  it("is not applied to the live exam data yet", () => {
    const live = new Map<string, string>();
    for (const task of allPublishedExamTasks as unknown as { id: string; texts?: { id: string; textDe?: string }[] }[]) {
      for (const tx of task.texts ?? []) live.set(tx.id, tx.textDe ?? "");
    }
    for (const t of draft.texts) expect(live.get(t.id), t.id).toBe(t.oldTextDe);
  });
});
