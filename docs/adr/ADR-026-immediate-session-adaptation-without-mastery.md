# ADR-026 — Immediate session adaptation without mastery effects

Date: 2026-09-07  
Status: accepted

## Context

A fixed Today plan becomes frustrating when the learner suddenly has less time or finds the current load too easy or too difficult. P1-7/8 require immediate adaptation, but subjective difficulty must not fabricate correctness, mastery, or lesson evidence.

## Decision

Adopt `session-adaptation-v1` after the daily Check-in with three explicit actions:

- **Less time:** select the nearest valid lower session budget from 10/20/30/45/60/90, but never below already completed block minutes plus a closing reflection.
- **Too easy:** keep the total budget and transfer at most three minutes from unfinished guided practice to unfinished independent production.
- **Too hard:** choose a conservative budget up to 20 minutes when compatible with already completed blocks; otherwise preserve the current budget and show why it cannot safely shrink.

Each action stores reason, before/after minutes, completed block IDs at the moment of adaptation, timestamp, and the fixed boundary `planning-signal-no-mastery-or-correctness`. It never writes exercise attempts, mastery, lesson completion, or artificial study evidence.

The record is optional on `DailySessionRecord`, preserving schema-v3 backward compatibility. DWNB round-trip and daily-session merge retain unique adaptation records.

## Acceptance

Unit tests verify valid budget selection, the hard-load cap, bounded easy-load reallocation, exact total minutes, protected completed blocks, untouched mastery/correctness, schema portability, DWNB round-trip, and deterministic merge. Desktop and mobile Playwright exercise all three controls, verify the visible 60→45→20 recomposition and guided-practice transfer, then inspect persisted provenance.

This closes P1-7 and P1-8 without turning a learner feeling into a language score.