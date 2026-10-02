# ADR-039 — Evidence-derived achievements and fully optional gamification

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `evidence-derived-achievement-v1`, `gamification-visibility-v1`
- Closes: P1-271, P1-272

## Context

The product already showed factual progress, a continuity streak, and behavior-specific praise. It did not have an explicit achievement system. Adding badges for page visits, clicks, or raw minutes would contradict the product's evidence-first learning boundary. At the same time, learners who dislike streaks, praise, or decorative motivation need a fully quiet interface without losing tasks, feedback, or evidence.

## Decision

### 1. Achievements are derived, never awarded by clicks

`deriveEvidenceAchievements` recalculates six achievements from the current LearningState:

1. first lesson completed through the existing four-part lesson evidence gate;
2. four unique successful delayed lesson-card reviews;
3. a Writing revision linked to an earlier source version;
4. a Speaking attempt saved after listen-back and learner reflection;
5. all 24 distinct A1 lessons completed;
6. one provider-scoped full simulation completed with all its tasks.

Initial review events, personal-error review cards, drafts, plain submissions, incomplete Speaking attempts, active/partial simulations, mission-block clicks, Tutor interactions, raw study minutes, and page visits do not unlock these achievements.

Each achievement exposes title, explanation, evidence kind, current/target progress, and the IDs of the evidence used internally. Learner-facing cards show the evidence category and counts but do not expose internal IDs. The shared boundary is:

```text
derived-display-only-no-mastery-cefr-or-reward
```

No achievement record or separate badge is persisted. If the underlying evidence is deleted, the achievement disappears on the next derivation. Achievements cannot add mastery, gate evidence, points, CEFR status, exam score, or material reward.

### 2. Progress surface

The Progress page renders all six achievements when motivation is visible. Locked cards display their exact threshold and current count; unlocked cards identify the factual evidence category. The panel states that it uses evidence rather than clicks and that it is internal motivation, not a certificate.

### 3. One complete visibility preference

`MotivationPreferences` contains:

```text
policyVersion=gamification-visibility-v1
gamificationVisible=true|false
```

Settings offers two explicit choices: a motivational interface and a fully quiet interface. Quiet mode suppresses:

- the achievement panel;
- the study-streak/Flame display;
- the journey-day counter;
- decorative route art;
- grace-return praise;
- praise-only review, writing, and targeted-exam notices.

Mixed notices remain functional. Warm-up completion, session completion, Speaking save, and continuous-exam submission use factual text without praise when quiet mode is active. Tasks, lesson gates, scores, review schedules, safety warnings, exam clocks, evidence reports, and accessibility status messages remain visible.

The AppShell publishes `data-gamification-visible` and CSS provides a defensive `.gamification-surface` hide rule. Components with mixed functional/praise content branch on the same preference rather than hiding the whole notice.

### 4. Persistence and reset

The preference defaults to visible for existing behavior, receives a strict old-schema-v3 default, applies immediately, and persists through IndexedDB, DWNB, profile switching, and newer-snapshot merge. Settings can restore the visible default. Toggling or resetting does not create, delete, or modify any learning evidence.

## Acceptance evidence

Automated tests verify:

- all six achievements start locked without evidence;
- page visits, mission clicks, Tutor history, and raw minutes do not unlock anything;
- every achievement's exact positive and negative evidence conditions;
- delayed-review deduplication and exclusion of personal-error repair;
- full A1 and full-simulation boundaries without official CEFR/exam claims;
- pure derivation without LearningState mutation or reward/mastery fields;
- strict preference schema, old-v3 default, merge, and DWNB round-trip;
- static coverage of all behavior-praise call sites and mixed functional messages;
- root attribute and defensive CSS;
- Desktop/Mobile evidence unlock, quiet-mode persistence, achievement/streak/praise suppression, functional Today/Progress content, reset, responsive layout, and axe smoke coverage.

## Consequences and limits

- P1-271 and P1-272 close as product/software workflows.
- These achievements are motivational summaries of existing evidence, not new evidence themselves.
- A completed internal A1 path is not an official CEFR certificate; a completed simulation is not a Goethe or telc result.
- Quiet mode is not a data-deletion mode. It only changes presentation and wording.
- The continuity engine still computes factual scheduling data in quiet mode because Today planning may need it; only gamified presentation is removed.
- Automated tests do not establish that every learner will find the visible mode motivating or the quiet mode psychologically optimal. Human UX review remains separate.
