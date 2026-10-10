import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";

const DRAFT_DIR = join(process.cwd(), "reports", "drafts");
const DRAFT_FILES = [
  "exam-bank-listening-b2-explanations.draft.json",
  "exam-bank-reading-b2-explanations.draft.json",
  "exam-bank-language-elements-b2-explanations.draft.json",
];
const NOT_DRAFTED_FILE = "exam-bank-not-drafted-2026-10-10.json";
/** حالة المسودات بعد موافقة المالك على تطبيقها (2026-10-10). */
const APPLIED_STATUS = "applied-owner-approved-2026-10-10";
/** حد الشرح القصير المستخدم في التدقيق. */
const SHORT_LIMIT = 20;

type ExamItem = { id: string; explanationAr?: string };
type ExamTask = {
  id: string;
  texts?: { textDe?: string }[];
  clips?: { transcriptDe?: string }[];
  items?: ExamItem[];
};

/** يطابق المصدر بعد إزالة علامات [Lücke N] و[NN] ومسافات زائدة. */
function normalize(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const tasks = allPublishedExamTasks as unknown as ExamTask[];
const itemById = new Map<string, { task: ExamTask; item: ExamItem }>();
const sourceByTaskId = new Map<string, string>();
for (const task of tasks) {
  const source = [
    ...(task.texts ?? []).map((t) => normalize(t.textDe ?? "")),
    ...(task.clips ?? []).map((c) => normalize(c.transcriptDe ?? "")),
  ].join(" ");
  sourceByTaskId.set(task.id, source);
  for (const item of task.items ?? []) itemById.set(item.id, { task, item });
}

const shortItemIds = [...itemById.values()]
  .filter(({ item }) => (item.explanationAr ?? "").length < SHORT_LIMIT)
  .map(({ item }) => item.id);

function readJson(file: string) {
  return JSON.parse(readFileSync(join(DRAFT_DIR, file), "utf8"));
}

describe("exam bank explanation drafts", () => {
  const notDrafted = readJson(NOT_DRAFTED_FILE);

  it("covers every exam item exactly once: applied drafts, or listed as not drafted", () => {
    const drafted: string[] = [];
    for (const file of DRAFT_FILES) {
      for (const entry of readJson(file).items as { id: string }[]) drafted.push(entry.id);
    }
    const notDraftedIds = [
      ...(notDrafted.blocked.items as { id: string }[]),
      ...(notDrafted.flagged.items as { id: string }[]),
    ].map((e) => e.id);

    expect(new Set(drafted).size).toBe(drafted.length);
    expect(new Set(notDraftedIds).size).toBe(notDraftedIds.length);
    // لا يتداخل المكتوب مع غير المكتوب
    for (const id of notDraftedIds) expect(drafted.includes(id), id).toBe(false);
    // البنود القصيرة المتبقية في البيانات الحية هي بالضبط غير المكتوبة
    expect([...shortItemIds].sort()).toEqual([...notDraftedIds].sort());
    expect(drafted.length + notDraftedIds.length).toBe(526);
  });

  it("keeps the not-drafted list in explicit reason groups", () => {
    expect(notDrafted.blocked.items.length).toBe(90);
    expect(notDrafted.flagged.items.length).toBe(12);
    expect(notDrafted.blocked.reason).toContain("no passage");
    expect(notDrafted.flagged.reason).toContain("doubtful");
  });

  for (const file of DRAFT_FILES) {
    describe(file, () => {
      const draft = readJson(file);

      it("is marked as applied by the owner", () => {
        expect(draft.status).toBe(APPLIED_STATUS);
      });

      it("points each entry at a live item in the registry", () => {
        for (const entry of draft.items as { id: string }[]) {
          expect(itemById.has(entry.id), entry.id).toBe(true);
        }
      });

      it("the live data carries the approved explanation", () => {
        for (const entry of draft.items as { id: string; explanationAr: string }[]) {
          expect(itemById.get(entry.id)?.item.explanationAr, entry.id).toBe(entry.explanationAr);
        }
      });

      it("quotes only verbatim text from the item's own task", () => {
        for (const entry of draft.items as { id: string; explanationAr: string }[]) {
          const ref = itemById.get(entry.id);
          expect(ref, entry.id).toBeDefined();
          const source = sourceByTaskId.get(ref!.task.id) ?? "";
          const quotes = [...entry.explanationAr.matchAll(/«([^»]+)»/g)].map((m) => m[1]);
          expect(quotes.length, entry.id).toBeGreaterThan(0);
          for (const quote of quotes) {
            expect(source.includes(normalize(quote)), `${entry.id}: ${quote}`).toBe(true);
          }
        }
      });
    });
  }
});
