import type { CEFRLevel } from "@/types/learning";

export const GUIDED_MEDIATION_POLICY = "guided-mediation-from-understanding-to-free-v1" as const;

export type MediationStarter = {
  goalAr: string;
  audience: string;
  purpose: string;
  keyFacts: string[];
  guided: boolean;
};

const lessonStarters: Record<string, MediationStarter> = {
  "a1-01": {
    goalAr: "ستفهم ما تريده المعلمة، ثم تساعد صديقك على الرد بجملة ألمانية قصيرة.",
    audience: "صديق يريد فهم كلام المعلمة",
    purpose: "يعرف أن المعلمة تسأل عن اسمه وتطلب منه كتابته",
    keyFacts: [
      "المعلمة تلقي تحية صباحية",
      "تسأل الصديق عن اسمه",
      "تطلب منه كتابة اسمه هنا",
    ],
    guided: true,
  },
};

export function mediationStarter(taskId: string, level: CEFRLevel): MediationStarter {
  const authored = lessonStarters[taskId];
  if (authored) return { ...authored, keyFacts: [...authored.keyFacts] };
  return {
    goalAr: level === "A1"
      ? "ستفهم أهم ما في النص الألماني، ثم تساعد شخصًا آخر على معرفة ما يجب فعله."
      : "ستنقل المقصد والمعلومات الضرورية إلى المتلقي بصياغة مناسبة، ثم تراجع ما قد يكون ناقصًا.",
    audience: "",
    purpose: "",
    keyFacts: ["", "", ""],
    guided: false,
  };
}
