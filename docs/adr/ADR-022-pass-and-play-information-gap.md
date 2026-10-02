# ADR-022 — Pass-and-play two-person information gap

Date: 2026-09-06  
Status: accepted

## Decision

Adopt `two-party-information-gap-v1` inside the existing Speaking Lab. Role A and Role B receive non-overlapping private facts and questions. Each role card must be hidden before the device is handed over. The joint exchange runs with both cards hidden, requires four confirmed turns, and accepts evidence only after the pair reaches the constraint-compatible decision.

A learner must explicitly confirm that a second person is present. Solo role rotation is allowed only as rehearsal and cannot be saved as two-party evidence. The saved record contains duration, four-turn completion, partner confirmation, and the joint decision; it does not claim language quality, acoustic scoring, or an online/live partner supplied by the application.

## Acceptance

Unit tests verify private-role separation, the decision rule, four-turn threshold, and the prohibition on solo evidence. Desktop and mobile Playwright pass the device through A → hidden handover → B → hidden exchange, verify that private facts never appear together, reach the joint decision, and save evidence.

This closes P0-159 as a genuine same-device two-person information-gap path. P0-160 remains architecturally separate and is now closed by `content-grounded-follow-up-v1`: follow-up is grounded in a learner-typed transcript, never in a claim that the application understood the recording. See ADR-023.
