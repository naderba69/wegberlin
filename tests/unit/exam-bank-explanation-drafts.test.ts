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
/** حالة المسودات قبل موافقة المالك. عند الموافقة تُحدَّث الحالة وتُطبَّق الشروح. */
const PENDING_STATUS = "draft-owner-approval-required";
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

  it("covers every short exam explanation exactly once (drafted or listed as not drafted)", () => {
    const covered: string[] = [];
    for (const file of DRAFT_FILES) {
      for (const entry of readJson(file).items as { id: string }[]) covered.push(entry.id);
    }
    for (const entry of notDrafted.blocked.items as { id: string }[]) covered.push(entry.id);
    for (const entry of notDrafted.flagged.items as { id: string }[]) covered.push(entry.id);

    expect(new Set(covered).size).toBe(covered.length);
    expect([...new Set(covered)].sort()).toEqual([...shortItemIds].sort());
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

      it("is still pending owner approval", () => {
        expect(draft.status).toBe(PENDING_STATUS);
      });

      it("points each entry at a live item in the registry", () => {
        for (const entry of draft.items as { id: string }[]) {
          expect(itemById.has(entry.id), entry.id).toBe(true);
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
