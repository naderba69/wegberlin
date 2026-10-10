# ADR-110: Pair the intake production sample with a four-week comparison

**Status:** Accepted

**Date:** 2026-10-04
**Priority item:** P1-19 in `CURRICULUM_METHOD_AUDIT_2026-10-04_AR.md`

## Context

The adaptive placement diagnostic collects a short optional writing sample, local speaking recording, and learner-selected self-assessment for learners with prior experience. However, absolute beginners who choose “start from zero” deliberately bypass the diagnostic and German-production prompt. Nesting the comparison under `diagnosticResult` therefore excluded a full onboarding path. The state needs one top-level comparison record that can hold either the beginner's explicit no-writing self-report or the post-placement sample, without inventing a diagnostic result.

## Decision

- The comparison is a top-level `LearningState.productiveSampleComparison`, independent of `diagnosticResult`. A learner who explicitly continues from “start from zero” receives a baseline from that choice alone: `not-yet`, zero words, no recording, timestamped with profile creation. No German production, diagnostic, or microphone permission is required. Other learners receive the same optional productive prompt after initial placement; completing it creates their baseline.
- The writing/audio task prompt remains identical at follow-up. A beginner who is still not ready may choose `not-yet` again, with no writing or recording requirement.
- Follow-up opens at **exactly 28 elapsed days** after the baseline timestamp (`28 × 24 hours`), not at an estimated or backdated calendar month. Earlier submissions are rejected by both the UI policy and portable schema.
- The `/progress` panel offers an optional follow-up after the due time. It never blocks lessons, changes the receptive diagnostic result, adds mastery, or creates a level gate. Legacy profiles with an older sample use that sample's recorded timestamp; profiles without one may create a clearly dated new baseline, never a fabricated intake record.
- The paired view shows only visible quantities (writing word count and available recording duration) plus the learner's own three-way self-assessment. It may show each learner-authored text for direct comparison. It does **not** assess grammatical accuracy, pronunciation, accent, fluency, or CEFR, and identical follow-up answers remain acceptable evidence.
- Both samples and local media references survive DWNB/schema-v3 round trips, profile namespace remapping, and merge. The existing settings action that deletes recordings clears both paired media references without deleting the text or the comparison metadata.

## Consequences

The learner gains a repeatable self-observation point after four weeks. The comparison is not a learning-gain estimate and cannot establish causality or language quality: it records two task instances, counts, and self-report only. A reviewer or study with real learners would be required to evaluate quality or effectiveness.

## Verification

- `tests/unit/productive-sample-comparison.test.ts`: exact due boundary, early/duplicate rejection, merge preservation, legacy baseline handling, and schema constraints.
- `tests/unit/diagnostic-productive-sample.test.ts`: both paired recording references are namespaced on isolated-profile import.
- `tests/e2e/critical-flows.spec.ts`: the absolute-beginner route stores `not-yet` without a writing task, while the diagnostic and four-week UI flows preserve the original placement level and score.
- The final measured unit/integrity, lint, TypeScript, build, language-boundary, contrast, and handoff results are recorded in `PROJECT_STATUS.md` after the run; browser execution in this sandbox remains subject to the repository's documented Chromium availability boundary.
