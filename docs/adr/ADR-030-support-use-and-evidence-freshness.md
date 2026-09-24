# ADR-030 — Support-use provenance and age-adjusted evidence confidence

- Status: Accepted
- Date: 2026-09-07
- Policies: `support-usage-v1`, `evidence-freshness-v1`
- Closes: P1-65 and P1-66

## Context

The product offered two-step hints, delayed reading translations, listening and Shadowing transcripts, and post-attempt writing/mediation models. It did not persist when these supports were opened. Evidence reports exposed the latest timestamp but a large old sample retained the same confidence label indefinitely.

Support use is useful planning context, but treating it as a wrong answer would punish learners for asking for help. Evidence age should lower confidence in a claim without rewriting history, deleting evidence, or silently reducing the recorded score.

## Decision

`LearningState.supportUsageEvents` stores append-only, versioned events for:

```text
hint
reading-translation
listening-transcript
writing-model
mediation-model
library-transcript
shadowing-transcript
```

Each event records surface, stable content ID, optional lesson and hint level, whether a learning attempt was already committed, timestamp, and the boundary `support-context-no-correctness-or-mastery`. It has no correctness or mastery field. Duplicate IDs are ignored. Lesson hints, lesson/library/Shadowing transcripts, reading translation, and post-feedback writing/mediation models emit the same contract. Settings can delete the complete support log without deleting attempts or mastery.

`evidence-freshness-v1` derives age from the latest evidence for each skill:

| Age | Band | Confidence factor | Confidence cap |
|---|---|---:|---|
| 0–30 days | fresh | 1.00 | high |
| 31–90 days | recent | 0.85 | medium |
| 91–180 days | aging | 0.65 | low |
| >180 days | stale | 0.40 | low |

The factor is a displayed confidence/provenance signal only. Skill score, attempt rows, mastery, completion, and source timestamps remain unchanged. `/progress` shows support category counts, post-commit count, base-versus-adjusted confidence, age band, factor, and the non-punitive boundary.

## Portability and compatibility

Zod defaults an older schema-v3 record to an empty support log. DWNB export/import preserves events. Merge unions them by event ID. New-profile import keeps them inside the isolated learner state. No database version increase is needed.

## Automated acceptance

Unit tests cover event boundaries, ID deduplication, category summary, old schema-v3 defaults, Merge, DWNB, all four freshness bands, and confidence reduction without score/mastery/attempt mutation. Desktop and mobile Playwright commit one hint and one delayed reading translation, verify IndexedDB and Progress output against stale reading evidence, then delete only the support log.

## Boundaries

The thresholds are a transparent planning policy, not psychometric validation, CEFR decay, or a forgetting-curve claim. Opening support does not prove misunderstanding, and not opening support does not prove independence. Human review remains necessary before using these signals for consequential decisions.
