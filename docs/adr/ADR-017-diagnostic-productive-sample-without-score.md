# ADR-017 — Diagnostic productive sample without fabricated grading

Date: 2026-09-05  
Status: accepted

## Context

The adaptive diagnostic measured grammar, vocabulary, reading, and listening but had no independent productive evidence. Automatically grading open writing or speech with local string rules would create false linguistic precision, while forcing a new absolute beginner to produce German would repeat the discouraging entry problem already fixed.

## Decision

Adopt `diagnostic-productive-sample-v1` after the adaptive closed-question boundary and only on the diagnostic route used by learners with prior or uncertain experience.

The step uses one German-first prompt with Arabic support:

```text
Stellen Sie sich in ein bis drei Sätzen vor. Sagen Sie auch, warum Sie Deutsch lernen.
```

The learner may:

- write at least three German words;
- record a local 3–45 second sample, with a displayed target around 20 seconds;
- provide both;
- or explicitly choose `not-yet` with no production and no penalty.

One required self-assessment records `independent`, `with-help`, or `not-yet`. The stored contract contains text/word count, optional media ID/duration, mode, self-assessment, prompt/policy version, and this fixed boundary:

```text
self-evidence-no-automated-language-score
```

The sample never contains a score or estimated level and never changes the receptive diagnostic result. A `not-yet` record cannot coexist with typed/recorded content. Claimed independent/assisted production requires at least three written words or a three-second recording.

Diagnostic audio remains in IndexedDB, participates in encrypted/optional-media DWNB backup, is namespaced during import-as-new-profile, and is included in immediate recording deletion while duration/self-evidence remains.

## Acceptance evidence

- Pure unit tests cover writing, speaking, mixed, `not-yet`, contradictory/empty rejection, schema v3 round-trip, no score property, and media namespacing.
- Production Playwright completes the adaptive A1 boundary, enters a German writing sample, selects independent production, submits it, and verifies the persisted no-score contract.
- The absolute-beginner onboarding test still bypasses diagnostic and isolated writing.

## Consequences and boundary

P0-26 is closed. This is a learner-owned sample, not a human or AI language assessment. It does not claim grammatical correctness, pronunciation, fluency, CEFR productive level, or official placement. A teacher may inspect exported material separately, but the application itself does not fabricate that judgment.
