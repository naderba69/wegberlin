import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as diagnostic from "@/data/diagnostic";

/** مسودة الشروح العربية للتشخيص (32 بندًا). تبقى مسودة حتى يعتمدها المالك. */
const DRAFT = join(process.cwd(), "reports", "drafts", "diagnostic-explanations-ar-2026-10-10.draft.json");

type DraftItem = {
  id: string;
  explanationAr: string;
  correctOption: string;
  audioItemId?: string;
  audioTranscriptDe?: string;
};
type Draft = { status: string; items: DraftItem[] };

const draft = JSON.parse(readFileSync(DRAFT, "utf8")) as Draft;
const liveItems = Object.values(diagnostic as Record<string, unknown>)
  .flat()
  .filter((x): x is { id: string; prompt: string; contextDe?: string; options: string[]; correctIndex: number; audioItemId?: string; explanationAr?: string } =>
    typeof x === "object" && x !== null && "formId" in x,
  );

/** يطابق المصدر بعد توحيد المسافات. */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

describe("diagnostic explanation drafts (Arabic, review only)", () => {
  it("is still a draft awaiting owner approval", () => {
    expect(draft.status).toBe("draft-not-applied");
  });

  it("covers every diagnostic item exactly once", () => {
    const ids = draft.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(liveItems.map((i) => i.id).sort());
    expect(ids.length).toBe(32);
  });

  it("names the same correct option as the live item", () => {
    for (const item of draft.items) {
      const live = liveItems.find((l) => l.id === item.id);
      expect(live, item.id).toBeDefined();
      expect(item.correctOption, item.id).toBe(live!.options[live!.correctIndex]);
    }
  });

  it("quotes only verbatim text from the item (prompt, context, options, or transcript)", () => {
    for (const item of draft.items) {
      const live = liveItems.find((l) => l.id === item.id)!;
      const source = norm([live.prompt, live.contextDe ?? "", ...live.options, item.audioTranscriptDe ?? ""].join(" "));
      const quotes = [...item.explanationAr.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
      for (const quote of quotes) expect(source.includes(norm(quote)), `${item.id}: ${quote}`).toBe(true);
    }
  });

  it("has an audio transcript for every listening item", () => {
    for (const live of liveItems.filter((l) => l.audioItemId)) {
      const item = draft.items.find((i) => i.id === live.id)!;
      expect(item.audioTranscriptDe, live.id).toBeTruthy();
    }
  });
});
