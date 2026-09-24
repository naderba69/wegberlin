# ADR-058 — Learner-selected daily focus tools without coach override

Status: accepted · 2026-09-10 · Africa/Tunis  
Policies: `learner-pinned-task-v1`, `learner-selected-morning-evening-mode-v1`, `weakest-target-five-minute-practice-v1`, `exam-countdown-12-8-4-1-v1`, `local-extra-thirty-minutes-what-if-v1`, `level-end-backup-reminder-v1`  
Closes: P2-45, P2-47, P2-201, P2-239, P2-286, P2-347. Existing voice selection and print answer sheet also close P2-153 and P2-203.

## Decision

Today keeps the coach recommendation authoritative and visible, while allowing the learner to choose a bounded entry mode, pin one linked mission, or open a five-minute version of the weakest current evidence. Pinning never completes, reorders, or changes mastery. Morning mode points to the five-minute route; evening mode points to calm retrieval. Neither creates time debt.

A target date yields calendar-only 12/8/4/1-week guidance. The +30-minute scenario divides the same remaining planning estimate by a larger weekly budget but does not mutate the profile or predict a pass date. After a level gate reaches 100, a DWNB reminder remains visible until `lastBackupAt` is newer than the gate event; it never blocks progression or uploads anything.

## Persistence and merge

Pinned task and routine mode use strict schema-v3 records, IndexedDB, DWNB, and newer-state Merge. The export action stamps `lastBackupAt` only after the browser has created the archive and initiated its download.

## Boundaries

These are navigation and planning controls, not completion, correctness, CEFR, official readiness, pass probability, or a promise that extra time causes proportional learning. Tests cover exact five-minute allocation, date bands, no-mutation what-if, backup recency, schema, and merge.
