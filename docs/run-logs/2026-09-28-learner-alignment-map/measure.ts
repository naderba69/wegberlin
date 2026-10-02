/**
 * مسبار P2-93: يقيس خريطة المواءمة الخاصة على فهرس يملكه المتعلّم.
 * التشغيل: npx tsx docs/run-logs/2026-09-28-learner-alignment-map/measure.ts
 *
 * لا يفتح شبكة ولا يقرأ كتابًا: كل المدخلات اصطناعية مكتوبة هنا.
 */
import {
  ALIGNMENT_PASTED_INDEX_MAX_CHARS,
  alignmentContactReferences,
  alignmentCoverageByLevel,
  alignmentSummary,
  buildLearnerAlignmentMap,
  containsReproductionLikeText,
  listPastedIndexLines,
  sanitizeAlignmentMapForStorage,
} from "@/core/alignment/learner-alignment-map";

const pastedIndex = [
  "الوحدة 1 — ص 11",
  "الوحدة 2 — ص 24",
  "الوحدة 3 — ص 42",
  "Kapitel 4, Seite 55",
  "Kapitel 5, Seite 71",
].join("\n");

const now = new Date("2026-09-28T10:00:00.000Z").toISOString();
const contacts = alignmentContactReferences.slice(0, 5).map((reference, index) => ({
  lessonId: reference.lessonId,
  indexHint: `ص ${11 + index * 13}`,
}));

const built = buildLearnerAlignmentMap({
  acknowledge: true,
  draft: {
    sourceLabel: "فهرست كتابي الخاص",
    pastedIndex,
    ownershipAcknowledged: true,
    entries: contacts,
    createdAt: now,
    updatedAt: now,
  },
});

if (!built.ok) {
  console.log("BUILD FAILED:", built.reason, built.messageAr);
  process.exit(1);
}

const stored = sanitizeAlignmentMapForStorage(built.map);
const summary = alignmentSummary(stored);
const lines = listPastedIndexLines(pastedIndex);

console.log("policy:", built.map.policyVersion);
console.log("claim boundary:", built.map.claimBoundary);
console.log("contact lessons (ours):", summary.contactLessonCount);
console.log("mapped rows written by the learner:", summary.mappedLessonCount);
console.log("levels carrying rows:", summary.mappingLevelCount);
console.log("unmapped (ours, no hint yet):", summary.unmappedLessonCount);
console.log("coverage rows:", alignmentCoverageByLevel(stored).map((row) => `${row.level} ${row.mappedCount}/${row.totalCount}`).join(" · "));
console.log("pasted index chars (cleaned):", built.map.pastedIndex.length, "of cap", ALIGNMENT_PASTED_INDEX_MAX_CHARS);
console.log("pasted index lines offered for selection:", lines.length);
console.log("stored pastedIndex length after sanitize:", stored.pastedIndex.length, "(must be 0)");
console.log("stored summary.pastedIndexStored:", summary.pastedIndexStored, "(must be false)");
console.log("reproduction refused (book text):", containsReproductionLikeText("نص الكتاب كاملًا من الوحدة 3"));
console.log("reproduction refused (OCR):", containsReproductionLikeText("استخراج النص عبر OCR"));
console.log("page/unit hint accepted:", !containsReproductionLikeText("Kapitel 4, Seite 55"));
console.log("refusal without acknowledgement:", (() => {
  const refused = buildLearnerAlignmentMap({ acknowledge: false, draft: { ...built.map, pastedIndex } });
  return refused.ok ? "NO (wrong)" : refused.reason;
})());
