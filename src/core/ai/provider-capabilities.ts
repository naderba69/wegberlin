import { costRegistry, getAICostDecision } from "@/config/cost-registry";
import { webGPUModelRegistry } from "@/config/webgpu-model-registry";
import { getWebGPUModelSourceDecision } from "@/core/ai/webgpu-model";
import type { AIProvider } from "@/types/learning";

export const AI_PROVIDER_CAPABILITY_POLICY = "ai-provider-capability-matrix-v1" as const;

export type AIProviderCapabilityId = AIProvider | "browser-webgpu";
export type AIFeatureCapability = "available" | "limited" | "not-available";
export type AIProviderFeatureId = "tutor" | "tutor-commands" | "speaking-follow-up" | "writing-ai";

export type AIProviderCapabilityRow = {
  id: AIProviderCapabilityId;
  labelAr: string;
  model: string;
  selected: boolean;
  setupStatus: "ready" | "session-credential-required" | "device-check-required" | "blocked";
  setupAr: string;
  features: Record<AIProviderFeatureId, { status: AIFeatureCapability; detailAr: string }>;
  networkAr: string;
  consentAr: string;
  privacyAr: string;
  quotaAr: string;
  liveQuotaAvailable: false;
  freeBoundaryAr: string;
  sourceStatus: "local" | "fresh" | "due-soon" | "stale" | "clock-error";
  sourceDueAt?: string;
  sourceAr: string;
  fallbackAr: string;
};

const noWriting = {
  status: "not-available" as const,
  detailAr: "لا يوجد مسار كتابة AI موصول بهذا المزود؛ يبقى تحليل الكتابة الحتمي المحلي فقط.",
};
const tutor = { status: "available" as const, detailAr: "سؤال منظم: تلميح ثم شرح وأمثلة وتمرين صغير." };
const commands = { status: "available" as const, detailAr: "Einfacher / Noch ein Beispiel / Auf Arabisch مرتبطة بآخر جواب." };
const speaking = { status: "available" as const, detailAr: "سؤال متابعة من نص ألماني كتبه المتعلم؛ لا يُرسل الصوت ولا توجد دعوى STT." };

function configuredModel(id: AIProviderCapabilityId, selectedProvider: AIProvider, selectedModel: string) {
  if (id === selectedProvider && selectedModel.trim()) return selectedModel.trim();
  if (id === "disabled") return "local-rules-v2 + local-rules-command-v1";
  if (id === "gemini") return "gemini-2.5-flash";
  if (id === "openrouter") return "openrouter/free";
  if (id === "local") return "qwen2.5:3b";
  return webGPUModelRegistry.modelId;
}

export function getAIProviderCapabilityMatrix(options: {
  selectedProvider: AIProvider;
  selectedModel: string;
  hasSessionCredential: boolean;
  now?: Date;
}): AIProviderCapabilityRow[] {
  const now = options.now ?? new Date();
  const remoteRow = (id: "gemini" | "openrouter"): AIProviderCapabilityRow => {
    const model = configuredModel(id, options.selectedProvider, options.selectedModel);
    const decision = getAICostDecision(id, model, now);
    const service = id === "gemini" ? costRegistry[1] : costRegistry[2];
    const credentialReady = options.selectedProvider === id && options.hasSessionCredential;
    return {
      id,
      labelAr: id === "gemini" ? "Gemini BYOK" : "OpenRouter Free-only",
      model,
      selected: options.selectedProvider === id,
      setupStatus: decision.allowed ? (credentialReady ? "ready" : "session-credential-required") : "blocked",
      setupAr: decision.allowed
        ? credentialReady ? "المفتاح موجود لهذه الجلسة فقط." : "يحتاج مفتاحًا جلسيًا يقدمه المتعلم."
        : decision.reasonAr,
      features: { tutor, "tutor-commands": commands, "speaking-follow-up": speaking, "writing-ai": id === "gemini" ? { status:"available",detailAr:"مراجعة استشارية عند الشك بعد الفحص المحلي وموافقة مستقلة؛ لا درجة أو بديل مضمون عن مدرس." } : noWriting },
      networkAr: "إرسال شبكي واحد إلى المزود عند كل طلب مقبول.",
      consentAr: "موافقة صريحة جديدة لكل سؤال أو أمر أو نص متابعة أو مراجعة كتابة مدعومة.",
      privacyAr: service.privacyAr,
      quotaAr: `${service.quotaAr} لا تستطيع المنصة قراءة الحصة اللحظية لحساب المزود.` ,
      liveQuotaAvailable: false,
      freeBoundaryAr: id === "gemini"
        ? "0 USD فقط: gemini-2.5-flash أو gemini-2.5-flash-lite؛ أي موديل غير متحقق محظور."
        : "0 USD فقط: openrouter/free أو Model ID ينتهي بـ :free؛ لا رصيد ولا Paid fallback.",
      sourceStatus: decision.freshness,
      sourceDueAt: decision.dueAt,
      sourceAr: decision.freshness === "fresh" || decision.freshness === "due-soon"
        ? `مصادر السعر/الحدود متحققة حتى ${decision.dueAt}.`
        : decision.reasonAr,
      fallbackAr: service.fallbackAr,
    };
  };

  const webGPUDecision = getWebGPUModelSourceDecision(now);
  return [
    {
      id: "disabled",
      labelAr: "القواعد المحلية المدمجة",
      model: configuredModel("disabled", options.selectedProvider, options.selectedModel),
      selected: options.selectedProvider === "disabled",
      setupStatus: "ready",
      setupAr: "جاهز دون مفتاح أو تنزيل.",
      features: {
        tutor,
        "tutor-commands": commands,
        "speaking-follow-up": { ...speaking, detailAr: "سؤال حتمي من النص المكتوب فقط، بلا شبكة أو نموذج مولد." },
        "writing-ai": noWriting,
      },
      networkAr: "لا شبكة.",
      consentAr: "لا موافقة شبكية مطلوبة لأنه لا يوجد إرسال.",
      privacyAr: costRegistry[0].privacyAr,
      quotaAr: costRegistry[0].quotaAr,
      liveQuotaAvailable: false,
      freeBoundaryAr: "محلي بالكامل و0 USD؛ لا حساب ولا بطاقة.",
      sourceStatus: "local",
      sourceAr: "كود محلي إصدارِي؛ لا يعتمد على حصة مزود.",
      fallbackAr: costRegistry[0].fallbackAr,
    },
    remoteRow("gemini"),
    remoteRow("openrouter"),
    {
      id: "local",
      labelAr: "Local / Ollama",
      model: configuredModel("local", options.selectedProvider, options.selectedModel),
      selected: options.selectedProvider === "local",
      setupStatus: options.selectedProvider === "local" && options.hasSessionCredential ? "ready" : "session-credential-required",
      setupAr: options.selectedProvider === "local" && options.hasSessionCredential
        ? "عنوان Ollama موجود لهذه الجلسة فقط."
        : "يحتاج عنوان Ollama جلسيًا ونموذجًا محليًا مثبتًا؛ لا تفترض المنصة أنه يعمل.",
      features: { tutor, "tutor-commands": commands, "speaking-follow-up": speaking, "writing-ai": noWriting },
      networkAr: "طلب HTTP واحد إلى عنوان Ollama الذي يختاره المتعلم؛ قد يكون localhost أو جهازًا على شبكته.",
      consentAr: "موافقة جديدة لكل سؤال أو أمر أو نص متابعة، حتى عند localhost.",
      privacyAr: costRegistry[3].privacyAr,
      quotaAr: `${costRegistry[3].quotaAr} لا تعرض المنصة حصة مصطنعة.` ,
      liveQuotaAvailable: false,
      freeBoundaryAr: "لا مزود مدفوع؛ كلفة العتاد والطاقة على جهاز المتعلم، ولا Paid fallback.",
      sourceStatus: "local",
      sourceAr: "لا تحقق سعر بعيد؛ جاهزية النموذج والعنوان تختبر محليًا عند الطلب.",
      fallbackAr: costRegistry[3].fallbackAr,
    },
    {
      id: "browser-webgpu",
      labelAr: "Browser WebGPU",
      model: configuredModel("browser-webgpu", options.selectedProvider, options.selectedModel),
      selected: false,
      setupStatus: webGPUDecision.allowed ? "device-check-required" : "blocked",
      setupAr: webGPUDecision.allowed
        ? "يتطلب فحص WebGPU والذاكرة والمساحة ثم تنزيلًا صريحًا؛ لا ندعي أنه مثبت."
        : webGPUDecision.reasonAr,
      features: {
        tutor: { status: "not-available", detailAr: "ليس مرشدًا مولدًا ولا يجيب عن أسئلة عامة." },
        "tutor-commands": { status: "not-available", detailAr: "لا ينفذ أوامر المرشد؛ القواعد المحلية تبقى البديل." },
        "speaking-follow-up": { status: "limited", detailAr: "يرتب أسئلة متابعة مؤلفة مسبقًا من النص المكتوب؛ لا يفهم التسجيل." },
        "writing-ai": noWriting,
      },
      networkAr: "شبكة لتنزيل الأوزان أول مرة فقط؛ الاستدلال اللاحق داخل Web Worker على الجهاز.",
      consentAr: "موافقة تنزيل صريحة؛ لا موافقة شبكة لكل استدلال محلي بعد التثبيت.",
      privacyAr: costRegistry[4].privacyAr,
      quotaAr: costRegistry[4].quotaAr,
      liveQuotaAvailable: false,
      freeBoundaryAr: "نموذج Apache-2.0 محلي و0 USD؛ لا API ولا WASM/Paid fallback صامت.",
      sourceStatus: webGPUDecision.status,
      sourceDueAt: webGPUDecision.dueAt,
      sourceAr: webGPUDecision.reasonAr,
      fallbackAr: costRegistry[4].fallbackAr,
    },
  ];
}
