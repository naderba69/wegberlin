"use client";

import { Coffee, Timer } from "lucide-react";
import { blockForMinute, buildSessionBlocks, SESSION_BLOCKS_POLICY } from "@/core/coach/session-blocks";
import { studyDayKey } from "@/core/coach/session-signals";
import { useLearning } from "./learning-provider";

/**
 * شريط هندسة الجلسة (البند P1-18): يرى المتعلّم أن وقته كتل وراحات مخطّطة،
 * لا سباقًا واحدًا ينتهي بالإنهاك.
 */
export function SessionBlocksStrip() {
  const { state } = useLearning();
  const plan = buildSessionBlocks(state.profile?.dailyMinutes ?? 30);
  const activeSeconds = state.dailySessions[studyDayKey()]?.activeSeconds ?? 0;
  const position = activeSeconds > 0 ? blockForMinute(plan, Math.floor(activeSeconds / 60)) : null;
  return (
    <section className="session-blocks-card" data-session-blocks={SESSION_BLOCKS_POLICY} aria-label="هندسة جلسة اليوم">
      <header><Timer size={16} /><strong>جلسة اليوم ككتل</strong><small>{plan.noteAr}</small></header>
      {position && <p className="session-blocks-position" data-session-block-position={`${position.block.index}${position.inBreak ? "-break" : ""}`}>{position.inBreak ? `أنت في راحة بعد الكتلة ${position.block.index} — الراحة جزء من الجلسة.` : `أنت الآن في الكتلة ${position.block.index} من ${plan.blocks.length}: ${position.block.labelAr}.`}</p>}
      <ol>
        {plan.blocks.map((block) => (
          <li key={block.index}>
            <span>{block.index}</span>
            <b>{block.minutes} د</b>
            <em>{block.labelAr}</em>
            {block.breakAfterMinutes ? <i><Coffee size={12} /> راحة {block.breakAfterMinutes} د</i> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
