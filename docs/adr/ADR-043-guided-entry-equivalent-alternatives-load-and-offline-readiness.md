# ADR-043 — Guided entry, equivalent mission alternatives, learner-controlled load reduction, and Today Offline readiness

- Status: accepted
- Date: 2026-09-08
- Policies: `prior-experience-context-v1`, `equivalent-mission-alternative-v1`, `automatic-load-reduction-offer-v1`, `today-session-offline-readiness-v1`
- Closes product cycles: P1-17, P1-41, P1-43, P1-44

## Context

A guidance-first product cannot infer a level from a named textbook, force an absolute beginner to write German, treat declining a task as completion, silently lower the plan after errors, or claim Offline readiness merely because a pack button exists.

## Decision

### Optional starting context

Onboarding may collect structured prior-learning sources, an optional 160-character course/book note in any learner language, and structured concerns. These statements are local planning context only. They cannot set CEFR, correctness, mastery, or a gate. The first concern may add a supportive explanation to the Today rationale; it is not a diagnosis.

Boundary: `learner-stated-planning-context-no-level-or-mastery`.

### Equivalent mission substitution

Eligible Today blocks can be declined with `لا يناسبني الآن`. The replacement freezes the original objective, evidence kind, and minute budget. It receives its own block id and preserves provenance to the original. Selecting it does not complete either block and does not change mastery, attempts, lesson evidence, or gates. The learner may later complete only the alternative planning block.

Boundary: `planning-substitution-no-completion-mastery-or-correctness`.

### One load offer, controlled by the learner

Visible active time is accumulated in 30-second intervals only while the document is visible, across application routes after check-in. A load offer may be created after either three consecutive incorrect exercise attempts since check-in or an active-time overrun of at least 25% and five minutes. Only one offer is stored per daily session. Accepting recomposes to the shortest valid budget while protecting completed blocks and closure; declining retains the plan. Neither path deletes evidence or penalizes errors.

Boundary: `learner-controlled-planning-offer-no-penalty-mastery-or-deletion`.

### Verified Today Offline readiness

Today derives only the routes and exact authored lesson MP3 needed by the current mission. The controlling Service Worker checks the completed pack cache and shell cache and reports missing routes/audio. An uncontrolled worker, unsupported browser, timeout, or malformed reply is never labeled ready. The control links to manual pack installation; it never starts a download.

Cache generation moves atomically to `dwnb-full-pack-v103` and `dwnb-full-pack-staging-v103`.

## Persistence and portability

The onboarding context is an optional strict nested profile contract. Mission substitutions, active time, and the one-time offer live in the daily session. New records are strict Zod objects. Existing schema-v3 records remain valid because all additions are optional. DWNB replace/new-profile carries the records directly; merge unions substitutions/adaptations, keeps maximum active time, and resolves the latest offer decision.

## Rejected alternatives

- Inferring CEFR from a book or course name.
- Requiring German writing during beginner onboarding.
- Marking the original mission complete when it is declined.
- Automatically lowering workload without a learner decision.
- Counting elapsed background-tab wall time as active study.
- Auto-downloading today's resources.
- Treating `navigator.onLine`, pack metadata alone, or an active-but-uncontrolled worker as proof of Offline readiness.

## Verification

Unit/integrity coverage checks strict context, concern boundaries, objective/evidence/minute equivalence, no completion/mastery mutation, one-time error/time triggers, accept/decline decisions, merge behavior, exact route/audio derivation, cache generation, and no readiness-triggered download. Playwright covers onboarding persistence, mission substitution, repeated-error decline, Today readiness UI, and Service Worker cache verification after a manual full-pack install.
