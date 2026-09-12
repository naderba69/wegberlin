import type { EvidenceConfidence } from "./report";

export const EVIDENCE_FRESHNESS_POLICY = "evidence-freshness-v1" as const;
export type EvidenceFreshnessBand = "unavailable" | "fresh" | "recent" | "aging" | "stale";

const DAY_MS = 86_400_000;
const confidenceRank: Record<EvidenceConfidence, number> = { none: 0, low: 1, medium: 2, high: 3 };
const rankConfidence: EvidenceConfidence[] = ["none", "low", "medium", "high"];

export function evidenceFreshness(latestAt: string | undefined, baseConfidence: EvidenceConfidence, now = new Date()) {
  if (!latestAt || baseConfidence === "none") return {
    policyVersion: EVIDENCE_FRESHNESS_POLICY,
    band: "unavailable" as const,
    ageDays: null,
    factor: 0,
    adjustedConfidence: "none" as const,
    labelAr: "لا توجد عينة مؤرخة",
  };
  const timestamp = Date.parse(latestAt);
  if (!Number.isFinite(timestamp)) return {
    policyVersion: EVIDENCE_FRESHNESS_POLICY,
    band: "unavailable" as const,
    ageDays: null,
    factor: 0,
    adjustedConfidence: "none" as const,
    labelAr: "تاريخ الدليل غير صالح",
  };
  const ageDays = Math.max(0, Math.floor((now.getTime() - timestamp) / DAY_MS));
  const band: Exclude<EvidenceFreshnessBand, "unavailable"> = ageDays <= 30 ? "fresh" : ageDays <= 90 ? "recent" : ageDays <= 180 ? "aging" : "stale";
  const factor = band === "fresh" ? 1 : band === "recent" ? 0.85 : band === "aging" ? 0.65 : 0.4;
  const confidenceCap = band === "fresh" ? 3 : band === "recent" ? 2 : 1;
  const adjustedConfidence = rankConfidence[Math.min(confidenceRank[baseConfidence], confidenceCap)];
  const labelAr = band === "fresh" ? `حديث · ${ageDays} يوم` : band === "recent" ? `يحتاج تجديدًا قريبًا · ${ageDays} يوم` : band === "aging" ? `دليل متقادم · ${ageDays} يوم` : `دليل قديم جدًا · ${ageDays} يوم`;
  return { policyVersion: EVIDENCE_FRESHNESS_POLICY, band, ageDays, factor, adjustedConfidence, labelAr };
}
