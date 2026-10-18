# ADR-130: After-commit support for the 96 independent transfer tasks (م39)

- Status: accepted, 2026-10-18 (v238)
- Policy ID: `after-commit-transfer-support-v1` (new). Existing policies are unchanged: `productive-independence-v1`, `support-usage-v1`.
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **The German phrases and models are not a human linguistic review.**

## Context

ADR-106 phase C gave every lesson an independent transfer task (96 tasks, 24 per level). To keep the evidence clean, these tasks show nothing before the attempt: `usefulPhrases: []` and the writing `modelDe` says that no model exists. The ledger row م39 said what was still missing: after the attempt, the learner got no model and no reusable phrases. The only thing they could do was revise their own text without any target to compare it with.

Research on output followed by models supports showing a model **after** a committed attempt:

- **Hanaoka (2007)**, *Language Teaching Research* 11(4), 459–479. Learners first wrote, then compared their text with native models. They noticed mainly the gaps their own attempt had revealed, and they used those features in later rewrites.
- **Coyle & Roca de Larios (2014)**, *Studies in Second Language Acquisition* 36(3), 451–485. Models given after writing led to more noticing of lexical and content features than error correction did. Error correction did more for form accuracy.

The order matters: the model comes after the attempt. The independence evidence must therefore stay honest once the model has been seen.

While auditing this, a real loophole turned up in `writingIsIndependent`. A model reveal only invalidated a submission if it happened **within the same round** (`event.createdAt >= draftStartedAt`). So a learner could submit a weak attempt, open the model, start a "new independent attempt" and have it counted as independent.

## Decision

1. **New data module `src/data/independent-transfer-support.ts`.** It is keyed by `sourceLessonId` and imported only by the writing and speaking labs.
   - Five reusable phrases for each of the 96 tasks.
   - A full model for every **A1** task (30–50 words) and every **A2** task (80–110 words). Each model sits inside its own task's word range, counted with the app's own `analyzeWriting`.
   - Names are invented and phone numbers are placeholders (`0000 …`). There are no pork words, and A2 models use no B1 constructions.
2. **Writing lab.** After an independent task has been checked, a closed `<details>` panel appears: «عبارات ونموذج بعد التسليم» («عبارات مفيدة بعد التسليم» for B1/B2).
   - Opening it records the existing `writing-model` support event (`afterCommit: true`).
   - The panel says in Arabic that any later attempt at the same task no longer counts as independent writing.
   - The warning before the task now says that help appears only after the check.
3. **Loophole closed.** Two places changed:
   - `writingIsIndependent` now treats **any** model reveal for that task before the submission as support, regardless of round.
   - The writing lab's `supportUsedBeforeDraft` no longer starts counting at the current round.
   - A genuinely new round without any reveal still counts, as before. Re-submitting the same text still does not count twice.
4. **Speaking lab.** After a saved independent attempt, a closed panel appears: «عبارات للمحاولة التالية». Each phrase has a play button that uses the existing synthetic model voice.
   - Opening it records a `hint` event on the new surface `speaking-lab`, with content ID `${taskId}:after-attempt-phrases` and `afterCommit: true`.
   - Every later recording of that task stores `supportVisibleDuringRecording: true`.
   - `uniqueRecentSpeakingTasks` also refuses any attempt recorded after such an event (`afterCommitSpeakingSupportSeen`).
   - The phrases appear only for the **first eight tasks of each level (32 tasks)**. Those are the only tasks whose speaking scenario matches the written one. In the other 64, speaking uses a different situation, so the written-task phrases would mislead.
5. **Portability.** The support-usage `surface` enum gains `speaking-lab`. This is an additive value, so older exports still import.

## Budget and what is deferred

- The curriculum source gzip went from 1,249,948 to **1,263,887**, still under the 15% safety ceiling of 1,275,000.
- Client JS went from 2,077,060 to **2,091,375** gzip, still under the 2,125,000 ceiling. No dynamic import was added (ADR-111).
- Full **B1 (140–180 words) and B2 (180–230 words) models** for 48 tasks would need about 20–25 KB gzip more, and that does not fit inside the reserve.
  - The ceiling is not relaxed.
  - The data is not moved out of `src/data` to dodge the measurement.
  - **B1/B2 therefore get phrases only.** A test pins `model === undefined` for them, so adding models later is an explicit change.
- The speaking panel for the 64 tasks with a different speaking scenario needs scenario-specific phrases. That is not authored yet.

## Consequences

- No score, no mastery and no new learner-state field.
- Independence evidence gets stricter, never looser: a reveal can only remove independence.
- **م39 becomes «منجز برمجيًا مع حدود معلنة».** What is still missing:
  - B1/B2 models;
  - speaking phrases for 64 tasks;
  - a human linguistic review of the 96 phrase sets and 48 models;
  - evidence from real learners that post-attempt models help this population.
