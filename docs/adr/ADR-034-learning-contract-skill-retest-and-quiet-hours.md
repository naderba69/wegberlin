# ADR-034 — Fourteen-day learning contract, single-skill retest, and quiet hours

- Status: Accepted
- Date: 2026-09-07
- Policies: `fourteen-day-learning-contract-v1`, `single-skill-diagnostic-v1`, `quiet-hours-local-v1`
- Closes: P1-20, P1-32, P1-54

## Decision

Settings creates an inclusive 14-day planning contract with start/end, goal, daily minutes, and selected weekdays. Editing never overwrites history: each revision has a new ID, incremented revision, and `previousContractId`. Today shows the latest contract. Contracts are planning commitments and cannot alter correctness, mastery, or a level gate.

Learners with an existing diagnostic can reopen `/diagnostic` and choose Grammatik, Wortschatz, Lesen, or Hören. A single-skill sample alternates Form A/B against the latest attempt for that skill and asks exactly one item at A1, A2, B1, and B2. It stores four per-level booleans and a recommended focus level under `skill-sample-planning-only-no-level-change`; the original diagnostic, profile level, productive sample, and mastery remain untouched. Full retest stays available explicitly.

Quiet hours store enabled/start/end/IANA timezone locally. Overnight and daytime windows are supported. Noncritical study/review nudges are suppressed while active; an already-running continuous-exam deadline remains a safety exception because its clock does not stop. The project does not request Notification permission, register Push, or send external reminders.

## Portability and acceptance

All three records are schema-v3 backward-compatible defaults, DWNB portable, and merged by stable IDs/newer settings. Unit tests cover inclusive date math, revisions, invalid input, quiet-window boundaries, deadline exemption, per-skill form alternation, four-level evaluation, no-level-change evidence, old records, Merge, and DWNB. Desktop/mobile Playwright creates two contract revisions, activates quiet hours, verifies Today suppression/summary, completes a four-question grammar retest, and proves the original diagnostic/profile/mastery stay unchanged.

## Boundaries

A contract is not a promise of achievement. Four questions are a planning sample, not a CEFR subscore. Quiet hours govern only app-authored noncritical nudges and cannot control browser, calendar, operating-system, or third-party notifications.
