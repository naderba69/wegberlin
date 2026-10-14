import type { LearnerProfile } from "@/types/learning";

/**
 * هندسة الجلسة: 4 كتل × ~20 دقيقة مع راحة 3 دقائق بينها.
 *
 * الفجوة المقيسة (تدقيق الطريقة 2026-10-04، البند P1-18): الوقت اليومي يُختار ككتلة واحدة
 * («45 دقيقة») بلا تقسيم انتباه ولا راحة مخطّطة، فالجلسة الطويلة تنهار جودتها في آخر ثلثها
 * بينما المتعلّم يحسبها «ساعة كاملة». هذه الوحدة تقسّم الوقت المختار إلى كتل متساوية مع راحات
 * قصيرة، وتقول بصراحة إن الراحة جزء من الخطة لا ترف.
 */
export const SESSION_BLOCKS_POLICY = "session-blocks-v1" as const;
export const SESSION_BLOCK_COUNT = 4 as const;
export const SESSION_BREAK_MINUTES = 3 as const;
export const SESSION_BLOCK_BOUNDARY = "attention-hygiene-plan-cue-not-a-timer-or-a-mastery-signal" as const;

export type SessionBlock = {
  index: number;
  minutes: number;
  labelAr: string;
  breakAfterMinutes?: number;
};

export type SessionBlocksPlan = {
  policyVersion: typeof SESSION_BLOCKS_POLICY;
  boundary: typeof SESSION_BLOCK_BOUNDARY;
  dailyMinutes: number;
  blocks: SessionBlock[];
  breakTotalMinutes: number;
  focusMinutes: number;
  noteAr: string;
};

const BLOCK_LABELS = ["كتلة الحفظ والاسترجاع", "كتلة القاعدة والتمارين", "كتلة الاستماع والقراءة", "كتلة الإنتاج والمراجعة"] as const;

export function buildSessionBlocks(dailyMinutes: LearnerProfile["dailyMinutes"] | number, blockCount = SESSION_BLOCK_COUNT): SessionBlocksPlan {
  const minutes = Math.max(10, Math.min(180, Math.round(dailyMinutes)));
  const breaks = Math.max(0, blockCount - 1);
  const focusMinutes = Math.max(blockCount * 5, minutes - breaks * SESSION_BREAK_MINUTES);
  const base = Math.floor(focusMinutes / blockCount);
  const remainder = focusMinutes - base * blockCount;
  const blocks: SessionBlock[] = Array.from({ length: blockCount }, (_unused, index) => ({
    index: index + 1,
    minutes: base + (index < remainder ? 1 : 0),
    labelAr: BLOCK_LABELS[index % BLOCK_LABELS.length],
    ...(index < breaks ? { breakAfterMinutes: SESSION_BREAK_MINUTES } : {}),
  }));
  return {
    policyVersion: SESSION_BLOCKS_POLICY,
    boundary: SESSION_BLOCK_BOUNDARY,
    dailyMinutes: minutes,
    blocks,
    breakTotalMinutes: breaks * SESSION_BREAK_MINUTES,
    focusMinutes,
    noteAr:
      minutes < 20
        ? `وقتك ${minutes} دقيقة: كتلتان قصيرتان بلا راحة تكفيان للتعرّض اليومي، ولا نطلب جلسة طويلة.`
        : `قسّمنا ${minutes} دقيقة إلى ${blockCount} كتل مع راحة ${SESSION_BREAK_MINUTES} دقائق بينها؛ مجموع التركيز ${focusMinutes} دقيقة. الراحة جزء من الخطة لا ترف، والقفزة في آخر الجلسة ليست إنتاجًا.`,
  };
}

/** كتلة اليوم التي يقع فيها الدقيقة المعطاة (لعرض «أنت في الكتلة 2 من 4»). */
export function blockForMinute(plan: SessionBlocksPlan, elapsedMinutes: number): { block: SessionBlock; inBreak: boolean } {
  let cursor = 0;
  for (const block of plan.blocks) {
    if (elapsedMinutes < cursor + block.minutes) return { block, inBreak: false };
    cursor += block.minutes;
    if (block.breakAfterMinutes) {
      if (elapsedMinutes < cursor + block.breakAfterMinutes) return { block, inBreak: true };
      cursor += block.breakAfterMinutes;
    }
  }
  return { block: plan.blocks.at(-1)!, inBreak: false };
}
