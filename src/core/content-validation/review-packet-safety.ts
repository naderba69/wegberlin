import { hasNonEmptyCsvFields } from "./safe-csv";

export type ExistingReviewPacketEntry = {
  name: string;
  isFile: boolean;
  content: string;
};

const REVIEW_SIGNATURE_FIELDS = ["decision", "reviewerName", "reviewDate", "note"] as const;
const GENERATED_README_HEADER = "# حزمة المراجعة البشرية المستقلة — Der Weg nach Berlin";
const GENERATED_B2_HEADER = "# قائمة فحص دروس B2 — يملؤها مراجع بشري مسمّى (لا يملؤها السكربت)";

export function reviewCsvOverwriteBlocker(content: string, fields: readonly string[]) {
  try {
    return hasNonEmptyCsvFields(content, fields) ? "contains a decision, reviewer identity, named evidence, date, or note" : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `cannot be safely inspected (${message})`;
  }
}

function refuseReplacement(reason: string): never {
  throw new Error(`Refusing to replace reports/review-packet: ${reason} Preserve reviewer work before regenerating.`);
}

function assertB2ChecklistHasNoDecisions(markdown: string) {
  if (!markdown.startsWith(GENERATED_B2_HEADER)) {
    refuseReplacement("the B2 checklist is not a recognized generated file");
  }

  let inspectedRows = 0;
  for (const line of markdown.split(/\r?\n/u)) {
    if (!/^\|\s*`b2-/u.test(line)) continue;
    const cells = line.split("|");
    if (cells.length !== 9) refuseReplacement("a B2 checklist row cannot be safely inspected");
    inspectedRows += 1;
    if (cells.at(-2)?.trim()) refuseReplacement("the B2 checklist contains a reviewer decision");
  }
  if (inspectedRows !== 24) refuseReplacement(`expected 24 B2 checklist rows, found ${inspectedRows}`);
}

/** Refuses destructive regeneration when reviewer inputs or unknown files are present. */
export function assertReviewPacketSafeToReplace(entries: readonly ExistingReviewPacketEntry[]) {
  for (const entry of entries) {
    if (!entry.isFile) refuseReplacement(`found a non-file entry (${entry.name})`);

    if (entry.name === "README.md") {
      if (!entry.content.startsWith(GENERATED_README_HEADER) || !entry.content.includes("scripts/generate-human-review-packet.ts")) {
        refuseReplacement("README.md is not a recognized generated file");
      }
      continue;
    }

    if (entry.name === "b2-lesson-checklist.md") {
      assertB2ChecklistHasNoDecisions(entry.content);
      continue;
    }

    if (/^review-sheet-\d+\.csv$/u.test(entry.name)) {
      const blocker = reviewCsvOverwriteBlocker(entry.content, REVIEW_SIGNATURE_FIELDS);
      if (blocker) refuseReplacement(`${entry.name} ${blocker}`);
      continue;
    }

    refuseReplacement(`found an unrecognized file (${entry.name})`);
  }
}
