export const DWNB_DEPRECATION_POLICY_VERSION = "dwnb-deprecation-policy-v1" as const;
export const DWNB_DEPRECATION_ANNOUNCED_AT = "2026-09-09" as const;
export const DWNB_V1_SUPPORT_ENDS_AT = "2027-03-31" as const;
export const DWNB_CURRENT_MINIMUM_SUPPORT_UNTIL = "2027-09-30" as const;

export type DwnbFormatVersion = 1 | 2 | 3;
export type DwnbFormatLifecycle = "deprecated-supported" | "current" | "expired" | "unknown";

export type DwnbFormatSupportDecision = {
  policyVersion: typeof DWNB_DEPRECATION_POLICY_VERSION;
  formatVersion: number;
  lifecycle: DwnbFormatLifecycle;
  importSupported: boolean;
  exportProduced: boolean;
  encrypted: boolean | null;
  announcedAt: string;
  supportEndsAt: string | null;
  minimumSupportUntil: string | null;
  warningAr: string | null;
  evidenceBoundary: "format-compatibility-only-no-data-integrity-or-semantic-equivalence-claim";
};

export type DwnbFormatPolicyRow = {
  formatVersion: DwnbFormatVersion;
  lifecycle: "deprecated-supported" | "current";
  importSupported: true;
  exportProduced: boolean;
  encrypted: boolean;
  supportEndsAt: string | null;
  minimumSupportUntil: string;
  migrationPathAr: string;
};

export const dwnbFormatPolicyMatrix: readonly DwnbFormatPolicyRow[] = [
  {
    formatVersion: 1,
    lifecycle: "deprecated-supported",
    importSupported: true,
    exportProduced: false,
    encrypted: false,
    supportEndsAt: DWNB_V1_SUPPORT_ENDS_AT,
    minimumSupportUntil: DWNB_V1_SUPPORT_ENDS_AT,
    migrationPathAr: "استيراد قراءة فقط حتى نهاية المهلة، ثم تصدير نسخة DWNB v2 أو v3 جديدة.",
  },
  {
    formatVersion: 2,
    lifecycle: "current",
    importSupported: true,
    exportProduced: true,
    encrypted: false,
    supportEndsAt: null,
    minimumSupportUntil: DWNB_CURRENT_MINIMUM_SUPPORT_UNTIL,
    migrationPathAr: "صيغة التصدير الحالية دون تشفير؛ يمكن إعادة تصديرها مشفرة كـDWNB v3.",
  },
  {
    formatVersion: 3,
    lifecycle: "current",
    importSupported: true,
    exportProduced: true,
    encrypted: true,
    supportEndsAt: null,
    minimumSupportUntil: DWNB_CURRENT_MINIMUM_SUPPORT_UNTIL,
    migrationPathAr: "صيغة التصدير الحالية المشفرة بـAES-GCM وPBKDF2-SHA-256.",
  },
] as const;

function localDateStamp(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function dwnbFormatSupportDecision(formatVersion: number, now = new Date()): DwnbFormatSupportDecision {
  const row = dwnbFormatPolicyMatrix.find((item) => item.formatVersion === formatVersion);
  const boundary = "format-compatibility-only-no-data-integrity-or-semantic-equivalence-claim" as const;
  if (!row) {
    return {
      policyVersion: DWNB_DEPRECATION_POLICY_VERSION,
      formatVersion,
      lifecycle: "unknown",
      importSupported: false,
      exportProduced: false,
      encrypted: null,
      announcedAt: DWNB_DEPRECATION_ANNOUNCED_AT,
      supportEndsAt: null,
      minimumSupportUntil: null,
      warningAr: `إصدار DWNB v${formatVersion} غير معروف لهذا التطبيق؛ لم تُغيّر أي بيانات محلية.`,
      evidenceBoundary: boundary,
    };
  }
  const expired = row.supportEndsAt !== null && localDateStamp(now) > row.supportEndsAt;
  if (expired) {
    return {
      policyVersion: DWNB_DEPRECATION_POLICY_VERSION,
      formatVersion,
      lifecycle: "expired",
      importSupported: false,
      exportProduced: row.exportProduced,
      encrypted: row.encrypted,
      announcedAt: DWNB_DEPRECATION_ANNOUNCED_AT,
      supportEndsAt: row.supportEndsAt,
      minimumSupportUntil: row.minimumSupportUntil,
      warningAr: `انتهت مهلة استيراد DWNB v${formatVersion} في ${row.supportEndsAt}. افتح الملف بإصدار يدعم v${formatVersion} ثم أعد تصديره كـv2 أو v3؛ لم تُغيّر أي بيانات محلية.`,
      evidenceBoundary: boundary,
    };
  }
  return {
    policyVersion: DWNB_DEPRECATION_POLICY_VERSION,
    formatVersion,
    lifecycle: row.lifecycle,
    importSupported: true,
    exportProduced: row.exportProduced,
    encrypted: row.encrypted,
    announcedAt: DWNB_DEPRECATION_ANNOUNCED_AT,
    supportEndsAt: row.supportEndsAt,
    minimumSupportUntil: row.minimumSupportUntil,
    warningAr: row.lifecycle === "deprecated-supported"
      ? `DWNB v${formatVersion} قديم لكنه مدعوم حتى ${row.supportEndsAt}. بعد الاستيراد صدّر نسخة v2 أو v3 جديدة؛ لن نرفض نسخة مدعومة بصمت.`
      : null,
    evidenceBoundary: boundary,
  };
}

export function assertDwnbFormatSupported(formatVersion: number, now = new Date()) {
  const decision = dwnbFormatSupportDecision(formatVersion, now);
  if (!decision.importSupported) throw new Error(decision.warningAr ?? "إصدار DWNB غير مدعوم.");
  return decision;
}
