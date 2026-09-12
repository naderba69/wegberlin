# ADR-016 — Deduplicated polite status announcements

Date: 2026-09-05  
Status: accepted; physical assistive-technology review remains separate

## Context

Exercise and quiz feedback already used polite atomic live regions, but result messages across diagnostic, gates, labs, error repair, and exam flows used inconsistent combinations of visual insertion, `aria-live`, or no live semantics. Adding `role=status` to every visual container would risk repeated or overly long announcements when a component rerenders.

## Decision

Adopt `status-announcement-v1` through one shared `StatusAnnouncement` component:

- visible feedback remains ordinary visible text;
- one visually hidden node owns `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`;
- whitespace is normalized before announcement;
- a mounted channel remembers its previous normalized message;
- unchanged rerenders do not increment the announcement sequence or rewrite the live node;
- a changed result increments the sequence once;
- each surface supplies a stable channel ID for audit/debugging.

The policy is applied to:

1. adaptive diagnostic result;
2. A1/A2/B1/B2 gate results;
3. module review result;
4. error-clinic and individual repair results;
5. writing, speaking, and mediation labs;
6. targeted matching/choice/listening/writing/speaking results;
7. continuous-exam task submission;
8. Review, Today warm-up, and Settings action feedback.

Per-question exercise and quiz feedback retains its existing polite atomic contract because each card already owns an isolated result node.

## Acceptance evidence

Tests verify:

- exactly one polite atomic live node per shared announcement;
- the visible text remains outside the live node;
- an unchanged rerender keeps sequence `1`;
- a changed message advances to sequence `2`;
- every diagnostic/gate/lab/repair/exam result source imports the shared component;
- existing exercise feedback remains polite and atomic;
- production Chromium tests inspect shared policy attributes in representative diagnostic, writing, speaking, and continuous-exam flows.

## Consequences and boundary

P0-256 is closed at the product and automated-acceptance level. P0-255 remains partial: automated DOM/axe/keyboard checks do not replace hands-on testing with NVDA, VoiceOver, TalkBack, Switch Control, Firefox, Safari, or physical devices. Polite announcements reduce interruption but cannot guarantee identical speech timing in every assistive-technology/browser pair.
