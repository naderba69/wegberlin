# ADR-059 — Beginner-readable completion and guided production

Date: 2026-09-10 — Africa/Tunis

## Context

A real first-time learner reported three connected failures in the production UI: the default type was tiring, lesson completion exposed internal evidence notation such as `0/1 مطلوب · 3 متاح`, and the first A1 speaking/mediation tasks described assessment mechanics before teaching the learner how to act. The speaking lab also hid all phrases during recording, which made the first lesson feel like an unsupported test.

## Decision

Adopt four bounded contracts without changing correctness or mastery thresholds:

1. `beginner-readable-completion-v1` converts the existing four lesson thresholds into one explicit next action plus a plain checklist. Internal achieved/required notation and “repair now” wording are removed from the learner surface.
2. The default typography tokens become the comfortable reading profile. Compact, comfortable, and larger profiles remain learner-controlled in Settings and in a persistent top-bar control. Existing `fontScale: default` records migrate semantically to comfortable without a database rewrite; `compact` is added to the strict schema.
3. The first A1 speaking task becomes a scaffolded 5–10 second attempt. Synthetic phrase models are available before recording, the preparation timer is removed for `a1-01`, and phrases stay visible by default. The learner may hide them, but support visibility is persisted with the attempt.
4. `guided-mediation-from-understanding-to-free-v1` gives `a1-01` a source-grounded starter and replaces abstract workflow terms with understand, help, review, feedback, and improve. Later un-authored tasks receive no invented facts.

## Evidence separation

A recording made while phrases are visible is useful guided practice but is not independent speaking evidence. `speakingAttemptIsIndependent` excludes it from level-gate counts and the independent speaking metric. Older attempts that were recorded under the previous hidden-support contract remain independent because the optional field is absent.

## Privacy and claim boundaries

The phrase model is browser synthetic speech, labeled as such. At this ADR's acceptance, this change did not implement STT, word matching, phoneme scoring, or the planned standard local pronunciation model. ADR-060 now supersedes only the first two absences with optional local expected-word matching; phoneme scoring remains absent. A recording is persisted only after the learner explicitly saves it. The final physical-device, Arabic-learner phonetics, screen-reader, and comprehension review remains pending.

## Acceptance

- A default learner can change size from the top bar and can choose compact, comfortable, or larger in Settings.
- The lesson gate exposes one concrete next action and never displays `0/1 مطلوب` or an unexplained dash.
- `a1-01` speaking starts with listen/read, keeps support visible by default, targets at most ten seconds, and records support provenance.
- `a1-01` mediation opens with an aligned goal, audience, purpose, and three task-specific facts.
- Guided speaking cannot satisfy an independent speaking count.
- Unit, desktop, mobile, language/Bidi, content, portability, and build checks remain green.
