import { collocationNetworks } from "@/data/collocation-networks";
import { verbPrepositionFrames } from "@/data/lexical-grammar-registry";
import type { LessonSrsCard } from "./lesson-cards";

/**
 * استرجاع التركيب بدل الكلمة المفردة (البند P1-15 من تدقيق الطريقة).
 *
 * المشكلة المقيسة: بطاقة المراجعة تعرض كلمة مفردة في الوجه الأمامي («Termin»)، فيسترجع
 * المتعلّم المعنى العربي ولا يسترجع أبدًا الفعل الذي يُستعمل معها — وهذا هو الخطأ الذي يظهر
 * في الكتابة الحقيقية («einen Termin machen»). الحل هنا عرض **فراغ داخل تركيب معروف**:
 * الوجه الأمامي يصبح «einen Termin ___» والجواب «vereinbaren»، فيصير الاسترجاع عن التركيب.
 *
 * المصادر مرتّبة: أُطر الفعل مع حرف الجر (المسجَّلة)، ثم شبكة التراكيب الموضوعية، ثم مثال البطاقة
 * نفسها. وإن لم يُوجد تركيب موثوق نبقي البطاقة كما هي — لا نخترع تركيبًا.
 */
export const CHUNK_PROMPT_POLICY = "collocation-first-review-prompt-v1" as const;
export const CHUNK_PROMPT_BOUNDARY = "prompt-shaping-from-authored-collocation-sources-no-invented-chunks-no-mastery-effect" as const;

export type ChunkPromptSource = "verb-preposition-frame" | "collocation-network" | "card-example";

export type ChunkPrompt = {
  policyVersion: typeof CHUNK_PROMPT_POLICY;
  source: ChunkPromptSource;
  /** التركيب الكامل كما هو مؤلَّف. */
  chunkDe: string;
  /** التركيب مع فراغ مكان الكلمة المسؤولة. */
  gappedDe: string;
  /** ما يجب أن يخرج من فم المتعلّم. */
  answerDe: string;
  /** توجيه عربي قصير يوضّح ما يُطلب. */
  askAr: string;
  /** ملاحظة المصدر (مثال ألماني أو شرح) تظهر مع الجواب. */
  evidenceAr?: string;
};

const SINGLE_WORD = /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*$/;

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/[^a-zäöüß]+/gu, " ").trim();
}

/** بحث بحدود الكلمة: «hängen» ليست داخل «abhängen»، و«eins» ليست داخل «eine». */
function containsWord(text: string, word: string): boolean {
  if (!word) return false;
  const pattern = new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu");
  return pattern.test(text);
}

function gapOut(chunk: string, word: string): string | null {
  const pattern = new RegExp(`(^|[^\\p{L}])(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})([^\\p{L}]|$)`, "iu");
  if (!pattern.test(chunk)) return null;
  return chunk.replace(pattern, (_all, before: string, _hit: string, after: string) => `${before}___${after}`).replace(/\s+/g, " ").trim();
}

/**
 * يعيد تركيبًا قابلًا للاسترجاع لبطاقة وجهها كلمة واحدة، أو null إن لم يوجد مصدر مؤلَّف.
 * لا يستنتج تراكيب من النص الحرّ ولا يولّد لغة.
 */
export function chunkPromptFor(card: LessonSrsCard): ChunkPrompt | null {
  const front = card.front.trim();
  if (!SINGLE_WORD.test(front)) return null;
  const key = normalize(front);

  const frame = verbPrepositionFrames.find((entry) => containsWord(entry.chunkDe, front));
  if (frame) {
    const gapped = gapOut(frame.chunkDe, front.replace(/[^\p{L}]/gu, "")) ?? frame.chunkDe;
    return {
      policyVersion: CHUNK_PROMPT_POLICY,
      source: "verb-preposition-frame",
      chunkDe: frame.chunkDe,
      gappedDe: gapped,
      answerDe: front,
      askAr: `أكمل التركيب: أيّ فعل/حرف جر يأتي مع «${front}»؟`,
      evidenceAr: `${frame.exampleDe} — ${frame.contrastAr}`,
    };
  }

  for (const network of collocationNetworks) {
    const headword = typeof (network as { headwordDe?: string }).headwordDe === "string" ? (network as { headwordDe: string }).headwordDe : "";
    const node = network.nodes.find((item) => containsWord(item.phraseDe, front)) ?? (normalize(headword) === key && containsWord(network.nodes[0].phraseDe, front) ? network.nodes[0] : undefined);
    if (!node) continue;
    const gapped = gapOut(node.phraseDe, front.replace(/[^\p{L}]/gu, "")) ?? `${headword || front} — ${node.phraseDe.replace(/\s+/g, " ").trim()}`;
    return {
      policyVersion: CHUNK_PROMPT_POLICY,
      source: "collocation-network",
      chunkDe: node.phraseDe,
      gappedDe: gapped,
      answerDe: front,
      askAr: `أكمل التركيب الشائع: ${node.meaningAr}`,
      evidenceAr: `${node.exampleDe} — ${node.contrastAr}`,
    };
  }

  const example = card.hint.match(/(?:مثال:|Beispiel:)\s*([^\n]+)/u)?.[1]?.trim();
  if (example) {
    const gapped = gapOut(example, front.replace(/[^\p{L}]/gu, ""));
    if (gapped) {
      return {
        policyVersion: CHUNK_PROMPT_POLICY,
        source: "card-example",
        chunkDe: example,
        gappedDe: gapped,
        answerDe: front,
        askAr: `أكمل الجملة المأخوذة من الدرس بالكلمة المستهدفة.`,
      };
    }
  }
  return null;
}

export type ChunkPromptCoverage = {
  policyVersion: typeof CHUNK_PROMPT_POLICY;
  boundary: typeof CHUNK_PROMPT_BOUNDARY;
  cards: number;
  singleWordCards: number;
  withChunk: number;
  coveragePct: number;
  bySource: Record<ChunkPromptSource, number>;
};

export function summarizeChunkPromptCoverage(cards: readonly LessonSrsCard[]): ChunkPromptCoverage {
  const bySource: Record<ChunkPromptSource, number> = { "verb-preposition-frame": 0, "collocation-network": 0, "card-example": 0 };
  let singleWordCards = 0;
  let withChunk = 0;
  for (const card of cards) {
    if (SINGLE_WORD.test(card.front.trim())) singleWordCards += 1;
    const prompt = chunkPromptFor(card);
    if (prompt) {
      withChunk += 1;
      bySource[prompt.source] += 1;
    }
  }
  return {
    policyVersion: CHUNK_PROMPT_POLICY,
    boundary: CHUNK_PROMPT_BOUNDARY,
    cards: cards.length,
    singleWordCards,
    withChunk,
    coveragePct: singleWordCards ? Math.round((withChunk / singleWordCards) * 1000) / 10 : 0,
    bySource,
  };
}
