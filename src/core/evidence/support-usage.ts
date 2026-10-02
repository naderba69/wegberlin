import type { SupportUsageEvent, SupportUsageKind, SupportUsageSurface } from "@/types/learning";

export const SUPPORT_USAGE_POLICY = "support-usage-v1" as const;
export const SUPPORT_USAGE_BOUNDARY = "support-context-no-correctness-or-mastery" as const;

type SupportUsageInput = {
  kind: SupportUsageKind;
  surface: SupportUsageSurface;
  contentId: string;
  lessonId?: string;
  supportLevel?: 1 | 2;
  afterCommit: boolean;
};

export function createSupportUsageEvent(input: SupportUsageInput, now = new Date(), id = `support-${crypto.randomUUID()}`): SupportUsageEvent {
  return {
    id,
    policyVersion: SUPPORT_USAGE_POLICY,
    ...input,
    evidenceBoundary: SUPPORT_USAGE_BOUNDARY,
    createdAt: now.toISOString(),
  };
}

export function appendSupportUsageEvent(events: SupportUsageEvent[], event: SupportUsageEvent): SupportUsageEvent[] {
  return events.some((item) => item.id === event.id) ? events : [...events, event];
}

export function summarizeSupportUsage(events: SupportUsageEvent[]) {
  const latestAt = [...events].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0]?.createdAt;
  return {
    policyVersion: SUPPORT_USAGE_POLICY,
    total: events.length,
    distinctContent: new Set(events.map((event) => event.contentId)).size,
    hints: events.filter((event) => event.kind === "hint").length,
    translations: events.filter((event) => event.kind === "reading-translation").length,
    transcripts: events.filter((event) => event.kind.endsWith("transcript")).length,
    models: events.filter((event) => event.kind.endsWith("model")).length,
    afterCommit: events.filter((event) => event.afterCommit).length,
    latestAt,
    evidenceBoundary: SUPPORT_USAGE_BOUNDARY,
  };
}
