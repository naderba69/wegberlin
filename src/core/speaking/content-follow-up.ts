import type { CEFRLevel, SpeakingContentFollowUpEvidence, SpeakingFollowUpCueCategory, SpeakingFollowUpProvider } from "@/types/learning";

export const CONTENT_FOLLOW_UP_POLICY_VERSION = "content-grounded-follow-up-v1" as const;
export const CONTENT_FOLLOW_UP_BOUNDARY = "text-grounded-question-no-stt-no-language-score" as const;
export const LOCAL_FOLLOW_UP_MODEL = "local-rules-content-follow-up-v1" as const;
export const MAX_FOLLOW_UP_SOURCE_LENGTH = 600;

export type ContentFollowUpDraft = {
  questionDe: string;
  supportAr: string;
  sourceCue: string;
  cueCategory: SpeakingFollowUpCueCategory;
};

export type ContentFollowUpGeneration =
  | { status: "ready"; draft: ContentFollowUpDraft }
  | { status: "unavailable"; reason: "empty" | "too-short" | "no-german-content"; messageAr: string };
export type ContentFollowUpCandidateGeneration =
  | { status: "ready"; drafts: ContentFollowUpDraft[] }
  | Extract<ContentFollowUpGeneration, { status: "unavailable" }>;

const connectorBoundary = /\b(?:und|aber|weil|denn|dann|oder|sondern)\b/iu;
const fallbackStopWords = new Set([
  "aber", "als", "also", "am", "an", "auf", "aus", "bei", "bin", "das", "dass", "dem", "den", "der", "die", "ein", "eine", "einen", "einer", "es", "für", "habe", "haben", "ich", "im", "in", "ist", "mit", "mein", "meine", "möchte", "nach", "nicht", "oder", "sein", "sind", "und", "von", "war", "weil", "werde", "wie", "wir", "wohne", "zu",
]);

export function normalizeFollowUpTranscript(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, MAX_FOLLOW_UP_SOURCE_LENGTH);
}

function boundedCue(value: string): string {
  return value
    .split(connectorBoundary)[0]
    .replace(/^[\s:–—,-]+|[\s:–—,-]+$/gu, "")
    .replace(/[„“”"]/gu, "")
    .slice(0, 80)
    .trim();
}

function capture(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  if (!match?.[1]) return undefined;
  const cue = boundedCue(match[1]);
  return cue.length >= 2 ? cue : undefined;
}

function simpleByLevel(level: CEFRLevel, simple: string, advanced: string) {
  return level === "A1" || level === "A2" ? simple : advanced;
}

function fallbackKeyword(text: string) {
  const tokens = text.match(/[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß'-]{2,}/gu) ?? [];
  return tokens
    .filter((token) => !fallbackStopWords.has(token.toLocaleLowerCase("de-DE")))
    .sort((left, right) => right.length - left.length)[0]
    ?.slice(0, 40);
}

export function generateLocalContentFollowUp(sourceText: string, level: CEFRLevel): ContentFollowUpGeneration {
  const text = normalizeFollowUpTranscript(sourceText);
  if (!text) return { status: "unavailable", reason: "empty", messageAr: "اكتب أولًا خلاصة ألمانية قصيرة لما قلته؛ التسجيل نفسه لا يُحوَّل إلى نص." };
  const words = text.match(/\p{L}[\p{L}'’-]*/gu) ?? [];
  if (words.length < 3) return { status: "unavailable", reason: "too-short", messageAr: "اكتب ثلاث كلمات ألمانية على الأقل حتى يكون سؤال المتابعة مرتبطًا بمضمون واضح." };
  if (!/[A-Za-zÄÖÜäöüß]/u.test(text)) return { status: "unavailable", reason: "no-german-content", messageAr: "أدخل خلاصة ألمانية قصيرة. الدعم العربي للشرح فقط، ولا نفترض مضمون التسجيل." };

  const origin = capture(text, /\bich\s+(?:komme|stamme)\s+aus\s+([^,.!?;]+)/iu);
  if (origin) return { status: "ready", draft: { sourceCue: origin, cueCategory: "location", questionDe: simpleByLevel(level, `Was mögen Sie an ${origin} besonders?`, `Was gefällt Ihnen an ${origin} besonders, und warum?`), supportAr: "سؤال المتابعة مرتبط بالمكان الذي ذكرته في النص المكتوب." } };

  const residence = capture(text, /\bich\s+(?:wohne|lebe)\s+in\s+([^,.!?;]+)/iu);
  if (residence) return { status: "ready", draft: { sourceCue: residence, cueCategory: "location", questionDe: simpleByLevel(level, `Was machen Sie gern in ${residence}?`, `Was schätzen Sie am Leben in ${residence} besonders?`), supportAr: "السؤال يستعمل مكان السكن الذي كتبته أنت." } };

  const role = capture(text, /\bich\s+arbeite\s+als\s+([^,.!?;]+?)(?=\s+(?:im|in|bei|für|und|aber|weil)\b|[,.!?;]|$)/iu);
  if (role) return { status: "ready", draft: { sourceCue: role, cueCategory: "work-study", questionDe: simpleByLevel(level, `Was machen Sie als ${role}?`, `Was ist Ihnen bei Ihrer Arbeit als ${role} besonders wichtig?`), supportAr: "المتابعة مبنية على المهنة المذكورة في خلاصتك." } };

  const employer = capture(text, /\bich\s+arbeite\s+bei\s+([^,.!?;]+)/iu);
  if (employer) return { status: "ready", draft: { sourceCue: employer, cueCategory: "work-study", questionDe: `Was machen Sie bei ${employer} genau?`, supportAr: "المتابعة مرتبطة بمكان العمل الذي كتبته." } };

  const studiedSubject = capture(text, /\bich\s+studiere\s+([^,.!?;]+?)(?=\s+(?:für|um|weil|und|aber)\b|[,.!?;]|$)/iu);
  if (studiedSubject) return { status: "ready", draft: { sourceCue: studiedSubject, cueCategory: "work-study", questionDe: simpleByLevel(level, `Warum studieren Sie ${studiedSubject}?`, `Mit welchem Ziel studieren Sie ${studiedSubject}?`), supportAr: "السؤال يتابع موضوع الدراسة المذكور في النص." } };

  const learnedSubject = capture(text, /\bich\s+lerne\s+([^,.!?;]+?)(?=\s+(?:für|um|weil|und|aber)\b|[,.!?;]|$)/iu);
  if (learnedSubject) return { status: "ready", draft: { sourceCue: learnedSubject, cueCategory: "work-study", questionDe: simpleByLevel(level, `Warum lernen Sie ${learnedSubject}?`, `Welches Ziel möchten Sie mit ${learnedSubject} erreichen?`), supportAr: "السؤال يتابع موضوع التعلم المذكور في النص." } };

  const preference = capture(text, /\bich\s+(?:mag|liebe|bevorzuge)\s+([^,.!?;]+)/iu);
  if (preference) return { status: "ready", draft: { sourceCue: preference, cueCategory: "preference", questionDe: `Warum mögen Sie ${preference} besonders?`, supportAr: "المتابعة تطلب سبب التفضيل الذي ذكرته." } };

  const planCue = text.match(/\b(morgen|am\s+Wochenende|nächste\s+Woche|am\s+(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag))\b/iu)?.[1];
  if (planCue) return { status: "ready", draft: { sourceCue: planCue, cueCategory: "plan-time", questionDe: simpleByLevel(level, `Was möchten Sie ${planCue} zuerst machen?`, `Was machen Sie, wenn Ihr Plan für ${planCue} nicht funktioniert?`), supportAr: "السؤال يتابع الوقت أو الخطة التي وردت في جوابك المكتوب." } };

  const reason = capture(text, /\bweil\s+([^,.!?;]+)/iu);
  if (reason) return { status: "ready", draft: { sourceCue: reason, cueCategory: "reason-opinion", questionDe: simpleByLevel(level, "Können Sie dafür ein Beispiel nennen?", "Welches konkrete Beispiel unterstützt diesen Grund?"), supportAr: `أشرت إلى السبب «${reason}»؛ السؤال يطلب دليلًا أو مثالًا عليه.` } };

  const opinion = capture(text, /\b(?:ich\s+denke|ich\s+glaube|meiner\s+Meinung\s+nach)\s*,?\s*(?:dass\s+)?([^,.!?;]+)/iu);
  if (opinion) return { status: "ready", draft: { sourceCue: opinion, cueCategory: "reason-opinion", questionDe: simpleByLevel(level, "Warum denken Sie das?", "Welches Beispiel unterstützt Ihre Meinung?"), supportAr: `المتابعة مرتبطة بالرأي «${opinion}» الذي كتبته.` } };

  const keyword = fallbackKeyword(text);
  if (!keyword) return { status: "unavailable", reason: "no-german-content", messageAr: "لم نجد كلمة محتوى ألمانية آمنة لبناء سؤال مرتبط. أضف مكانًا أو عملًا أو خطة أو سببًا." };
  return { status: "ready", draft: { sourceCue: keyword, cueCategory: "keyword", questionDe: `Was möchten Sie über „${keyword}“ noch genauer sagen?`, supportAr: "لم نخمّن معنى التسجيل؛ استعملنا كلمة محتوى واضحة من النص الذي كتبته." } };
}

export function generateContentFollowUpCandidates(sourceText: string, level: CEFRLevel): ContentFollowUpCandidateGeneration {
  const local = generateLocalContentFollowUp(sourceText, level);
  if (local.status === "unavailable") return local;
  const cue = local.draft.sourceCue;
  const variants = [
    local.draft,
    { ...local.draft, questionDe: `Welche Erfahrung verbinden Sie mit „${cue}“?`, supportAr: "النموذج المحلي يقارن هذا السؤال دلاليًا بالنص المكتوب، ولا يحلل التسجيل." },
    { ...local.draft, questionDe: `Warum ist „${cue}“ für Sie wichtig?`, supportAr: "المتابعة تعمّق إشارة موجودة فعلًا في خلاصتك المكتوبة." },
    { ...local.draft, questionDe: `Was möchten Sie zu „${cue}“ noch genauer erklären?`, supportAr: "السؤال يطلب تفصيلًا إضافيًا حول العبارة التي كتبتها أنت." },
  ];
  return { status: "ready", drafts: [...new Map(variants.map((draft) => [draft.questionDe, draft])).values()] };
}

function containsCue(sourceText: string, cue: string) {
  return normalizeFollowUpTranscript(sourceText).toLocaleLowerCase("de-DE").includes(normalizeFollowUpTranscript(cue).toLocaleLowerCase("de-DE"));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSpeakingContentFollowUpEvidence(input: {
  sourceText: string;
  questionDe: string;
  supportAr: string;
  sourceCue: string;
  cueCategory: SpeakingFollowUpCueCategory;
  provider: SpeakingFollowUpProvider;
  model: string;
  consent: "not-required" | "explicit";
  fallbackEvidence?: SpeakingContentFollowUpEvidence["fallbackEvidence"];
  generatedAt?: string;
}): Promise<SpeakingContentFollowUpEvidence> {
  const sourceText = normalizeFollowUpTranscript(input.sourceText);
  const questionDe = normalizeFollowUpTranscript(input.questionDe).slice(0, 240);
  const supportAr = normalizeFollowUpTranscript(input.supportAr).slice(0, 500);
  const sourceCue = boundedCue(input.sourceCue);
  if (!sourceText || !questionDe.endsWith("?") || !supportAr || !sourceCue || !containsCue(sourceText, sourceCue)) throw new Error("تعذر إثبات أن سؤال المتابعة مرتبط بالنص المكتوب.");
  const localProvider = input.provider === "disabled" || input.provider === "browser-webgpu";
  if (localProvider && input.consent !== "not-required") throw new Error("المحرك المحلي لا يحتاج موافقة شبكية لكل استدلال.");
  if (!localProvider && input.consent !== "explicit") throw new Error("المزود الاختياري يحتاج موافقة صريحة لكل إرسال.");
  return {
    policyVersion: CONTENT_FOLLOW_UP_POLICY_VERSION,
    source: "typed-transcript",
    sourceExcerpt: sourceText.slice(0, 180),
    sourceTextSha256: await sha256(sourceText),
    sourceCue,
    cueCategory: input.cueCategory,
    questionDe,
    supportAr,
    provider: input.provider,
    model: input.model,
    consent: input.consent,
    evaluationBoundary: CONTENT_FOLLOW_UP_BOUNDARY,
    fallbackEvidence: input.fallbackEvidence,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}
