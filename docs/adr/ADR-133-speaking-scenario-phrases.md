# ADR-133: Phrases for the speaking scenario of transfer tasks 9–24 (م39 remainder)

- Status: accepted, 2026-10-18 (v241)
- Policy ID: `after-commit-transfer-support-v1` (unchanged; same after-commit rule, wider coverage).
- Evidence tier: agent-authored content under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). Not reviewed by a human linguist.

## Context

ADR-130 gave the speaking lab a «عبارات للمحاولة التالية» panel only for tasks 1–8 of each level (32 tasks). Their speaking scenario parallels the written task, so the written-task phrases fit.

Tasks 9–24 (64 tasks) use a different speaking situation. For example, the written task for a1-03 is a message to the school, while the speaking task is a phone call that needs spelling and two requests for repetition. Offering the written phrases there would have trained the wrong situation, so ADR-130 offered nothing. Ledger row م39 recorded this as an open gap.

## Decision

1. **New map `speakingScenarioPhrases`** in `src/data/independent-transfer-support.ts`, keyed by source lesson.
   - It has five chunks per task for exactly the 64 tasks at positions 9–24: 16 per level.
   - Each set was written for that task's **speaking** prompt. It covers the moves the prompt demands, such as spelling and asking for repetition at A1, Perfekt with separable verbs at A2 (a2-02), `je … desto` at B1 (b1-07), and twice `doch`, once `ja` and once `halt` at B2 (b2-19).
   - Phrases stay at the task's level and use `…` where the learner inserts their own content. They contain no pork or alcohol words.
2. **`speakingTransferPhrases`**:
   - Tasks 1–8 keep the written-task phrases, unchanged.
   - Tasks 9–24 now return their scenario phrases.
   - A missing task id or source lesson still returns nothing.
3. **Same independence rule.** The panel opens only after a saved attempt. Opening it records an after-commit `hint` event, and any later recording of the task counts as guided, not independent (`afterCommitSpeakingSupportSeen`). Nothing about evidence changes.

## Budget

The curriculum source gzip rises by about 4 KB and stays under the 1,275,000 safety ceiling. The ceiling was not raised. B1/B2 written models stay deferred, as ADR-130 says, because the remaining reserve still does not hold them.

## Consequences

- All 96 independent transfer tasks now have a speaking aid that matches the situation being spoken.
- `tests/unit/after-commit-transfer-support.test.ts` checks the following:
  - tasks 1–8 still equal the written set;
  - tasks 9–24 have exactly 64 entries, keyed by their source lessons;
  - every task has five distinct phrases;
  - no phrase repeats the written set;
  - phrases contain no Arabic script and no excluded food words.
- **Stated limits:**
  - The phrases are agent-written to level norms, not checked by a human linguist.
  - There is no learner data yet on whether after-attempt phrases improve the next attempt for this group of learners.
