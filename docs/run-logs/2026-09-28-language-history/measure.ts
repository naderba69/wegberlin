/**
 * مسبار P2-119: يقيس جرد الإثراء اللغوي والافتراضيّ والسقف والوسوم.
 * التشغيل: npx tsx docs/run-logs/2026-09-28-language-history/measure.ts
 * لا شبكة: الأرقام من البيانات المؤلَّفة المشحونة.
 */
import {
  DEFAULT_LANGUAGE_HISTORY_ENABLED,
  LANGUAGE_HISTORY_MAX_PER_SESSION,
  assertLanguageHistoryIntegrity,
  getLanguageHistorySource,
  languageHistoryNotes,
  languageHistorySources,
  languageHistorySummary,
  selectLanguageHistorySession,
} from "@/core/vocabulary/language-history-enrichment";

const summary = languageHistorySummary();
console.log("notes authored:", summary.notes);
console.log("declared sources:", summary.sources, "→", languageHistorySources.map((s) => s.key).join(" · "));
console.log("default enabled:", DEFAULT_LANGUAGE_HISTORY_ENABLED);
console.log("per level:", summary.byLevel.map((row) => `${row.level} ${row.notes}`).join(" · "));
console.log("claim strengths:", JSON.stringify(languageHistoryNotes.reduce<Record<string, number>>((acc, note) => { acc[note.claimStrength] = (acc[note.claimStrength] ?? 0) + 1; return acc; }, {})));
console.log("refuted on record:", languageHistoryNotes.filter((n) => n.claimStrength === "refuted-folk-etymology").map((n) => n.headword).join(", "));
const off = selectLanguageHistorySession({ enabled: false, level: "B1" });
const on = selectLanguageHistorySession({ enabled: true, level: "B1" });
const next = selectLanguageHistorySession({ enabled: true, level: "B1", alreadySeen: on.noteIds, limit: 1 });
console.log("off → visible:", off.noteIds.length, "| on (limit", LANGUAGE_HISTORY_MAX_PER_SESSION, ") → visible:", on.noteIds.length, "| next unseen →", next.noteIds.join(", "));
assertLanguageHistoryIntegrity({ enabled: true, selection: on });
console.log("every note resolves its source:", languageHistoryNotes.every((n) => Boolean(getLanguageHistorySource(n.sourceKey))));
console.log("notes per lesson are level-pure:", languageHistoryNotes.every((note) => note.lessonIds.length > 0));
