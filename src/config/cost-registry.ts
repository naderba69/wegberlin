import { summarizeSourceFreshness, type SourceFreshnessStatus } from "@/core/governance/source-freshness";

export const HARD_BUDGET_USD = 0 as const;
export const costPolicy = {
  hardBudgetUsd: HARD_BUDGET_USD,
  allowPaidModels: false,
  allowAutomaticPaidFallback: false,
  requireVerifiedZeroPrice: true,
  onUnknownPrice: "block",
  onQuotaExceeded: "fallback-deterministic",
} as const;

export const costRegistry = [
  {
    id: "core-local",
    purposeAr: "المنهج، التقدم، SRS، الاختبارات، الصوت الاحتياطي والنسخ المحلية",
    mandatory: true,
    costStatus: "local-zero-cost",
    paymentCardRequired: false,
    sourceIds: [],
    quotaAr: "لا توجد حصة شبكة؛ حدود الجهاز والتخزين المحلي فقط.",
    fallbackAr: "ملف DWNB وحزمة PWA محلية.",
    privacyAr: "لا يغادر تقدم المتعلم الجهاز.",
    owner: "project-maintainer",
  },
  {
    id: "gemini",
    purposeAr: "مرشد اختياري بمفتاح المستخدم",
    mandatory: false,
    costStatus: "verified-free-tier-only",
    paymentCardRequired: false,
    sourceIds: ["gemini-api-pricing-2026-09", "gemini-api-limits-2026-09"],
    allowedModelIds: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    quotaAr: "الحصة تتغير حسب المشروع والموديل وتُقرأ في AI Studio؛ 429 يوقف الإرسال.",
    fallbackAr: "المرشد الحتمي المحلي دون شبكة.",
    privacyAr: "Free Tier قد تستخدم المدخلات لتحسين منتجات Google وفق شروطها؛ الموافقة مطلوبة لكل إرسال.",
    owner: "project-maintainer",
  },
  {
    id: "openrouter",
    purposeAr: "مرشد اختياري عبر موجّه أو موديل مجاني فقط",
    mandatory: false,
    costStatus: "verified-free-variant-only",
    paymentCardRequired: false,
    sourceIds: ["openrouter-free-variant-2026-09", "openrouter-free-router-2026-09", "openrouter-rate-limits-2026-09"],
    allowedExactModelIds: ["openrouter/free"],
    allowedModelSuffixes: [":free"],
    quotaAr: "حدود النماذج المجانية منخفضة ومتغيرة؛ 402 أو 429 يعني العودة إلى الوضع المحلي.",
    fallbackAr: "المرشد الحتمي المحلي دون شراء رصيد.",
    privacyAr: "يمر النص إلى OpenRouter ومزود النموذج بعد موافقة مستقلة لكل إرسال.",
    owner: "project-maintainer",
  },
  {
    id: "ollama",
    purposeAr: "مرشد اختياري على جهاز المستخدم",
    mandatory: false,
    costStatus: "user-local-zero-cost",
    paymentCardRequired: false,
    sourceIds: [],
    quotaAr: "لا توجد حصة خارجية؛ الأداء تابع لجهاز المستخدم.",
    fallbackAr: "المرشد الحتمي المحلي.",
    privacyAr: "يبقى الطلب على العنوان المحلي الذي اختاره المستخدم.",
    owner: "learner",
  },
  {
    id: "vercel-hobby",
    purposeAr: "استضافة شخصية غير تجارية اختيارية",
    mandatory: false,
    costStatus: "verified-free-personal-only",
    paymentCardRequired: false,
    sourceIds: ["vercel-hobby-2026-09"],
    quotaAr: "Hobby محدود؛ عند تجاوز معظم الحدود تتوقف الميزة حتى تجدد الحصة.",
    fallbackAr: "PWA محلية أو أي استضافة Static مجانية متوافقة.",
    privacyAr: "لا تُخزن بيانات التعلم أو مفاتيح AI في Vercel.",
    owner: "project-maintainer",
  },
  {
    id: "github-actions",
    purposeAr: "CI للمستودع العام على Standard runners",
    mandatory: false,
    costStatus: "verified-free-public-repository",
    paymentCardRequired: false,
    sourceIds: ["github-actions-public-2026-09"],
    quotaAr: "Standard runners مجانية للمستودعات العامة؛ Larger runners ممنوعة.",
    fallbackAr: "تشغيل npm run check وPlaywright محليًا.",
    privacyAr: "CI لا يستخدم مفاتيح مزودي AI أو نسخ المتعلمين.",
    owner: "project-maintainer",
  },
] as const;

export type RemoteAIProvider = "gemini" | "openrouter";
export type AICostDecision = {
  allowed: boolean;
  provider: "disabled" | "local" | RemoteAIProvider;
  model: string;
  freshness: SourceFreshnessStatus | "local";
  verifiedAt?: string;
  dueAt?: string;
  reasonAr: string;
};

export function getCostService(id: (typeof costRegistry)[number]["id"]) {
  const service = costRegistry.find((candidate) => candidate.id === id);
  if (!service) throw new Error(`Unknown cost service ${id}`);
  return service;
}

export function getAICostDecision(provider: AICostDecision["provider"], model: string, now = new Date()): AICostDecision {
  if (provider === "disabled") return { allowed: true, provider, model: "local-rules-v2", freshness: "local", reasonAr: "الوضع الحتمي المحلي لا يرسل شيئًا ولا يستهلك حصة." };
  if (provider === "local") return { allowed: true, provider, model, freshness: "local", reasonAr: "Ollama يعمل على العنوان المحلي الذي اختاره المستخدم دون مزود مدفوع." };

  const service = provider === "gemini" ? costRegistry[1] : costRegistry[2];
  const freshness = summarizeSourceFreshness(service.sourceIds, now);
  if (freshness.status === "stale" || freshness.status === "clock-error") {
    return {
      allowed: false,
      provider,
      model,
      freshness: freshness.status,
      verifiedAt: freshness.oldestVerifiedAt,
      dueAt: freshness.dueAt,
      reasonAr: freshness.status === "clock-error"
        ? "حُظر الإرسال لأن ساعة الجهاز أقدم من سجل التحقق، فلا يمكن إثبات المجانية الآن."
        : `حُظر الإرسال لأن توثيق مجانية ${provider === "gemini" ? "Gemini" : "OpenRouter"} تجاوز مدة 30 يومًا. يلزم تحديث سجل المصادر أولًا.`,
    };
  }

  const modelAllowed = provider === "gemini"
    ? costRegistry[1].allowedModelIds.includes(model as (typeof costRegistry)[1]["allowedModelIds"][number])
    : costRegistry[2].allowedExactModelIds.includes(model as (typeof costRegistry)[2]["allowedExactModelIds"][number]) || costRegistry[2].allowedModelSuffixes.some((suffix) => model.endsWith(suffix));
  if (!modelAllowed) {
    return {
      allowed: false,
      provider,
      model,
      freshness: freshness.status,
      verifiedAt: freshness.oldestVerifiedAt,
      dueAt: freshness.dueAt,
      reasonAr: provider === "gemini"
        ? "حُظر النموذج لأن أهليته للطبقة المجانية ليست ضمن القائمة المتحققة. استخدم Gemini 2.5 Flash أو Flash-Lite فقط."
        : "حُظر النموذج لأنه ليس Free-only: يجب أن يكون openrouter/free أو يحمل اللاحقة :free.",
    };
  }

  return {
    allowed: true,
    provider,
    model,
    freshness: freshness.status,
    verifiedAt: freshness.oldestVerifiedAt,
    dueAt: freshness.dueAt,
    reasonAr: freshness.status === "due-soon"
      ? `المجانية متحققة حاليًا، لكن إعادة التحقق مستحقة في ${freshness.dueAt}.`
      : `حارس 0 USD فعّال؛ المصدر متحقق حتى ${freshness.dueAt} ولا توجد عودة مدفوعة.`,
  };
}

export function assertAIZeroCost(provider: AICostDecision["provider"], model: string, now = new Date()) {
  const decision = getAICostDecision(provider, model, now);
  if (!decision.allowed) throw new Error(decision.reasonAr);
  return decision;
}
