# Content Completeness and Empty-Asset Audit

Last verified: 2026-09-03

## Scope

This audit checks the runtime-authored content that a learner can encounter:

- 84 academic lessons and every nested stage object;
- 588 controlled exercises;
- 924 lesson reading/listening/Mini-Test questions;
- 80 reading-library and 80 listening-library items;
- 320 library questions;
- 32 adaptive-diagnostic questions;
- 150 provider-scoped exam tasks and twelve full-simulation dashboards;
- Goethe/telc profiles and source references;
- curriculum-derived SRS cards;
- 260 physical MP3 files and 90 logical exam clips;
- Offline route/cache contracts.

## Automated empty-content checks

`tests/unit/complete-runtime-content-audit.test.ts` recursively traverses every imported published content tree and fails on:

- an empty or whitespace-only authored string;
- a non-finite numeric value;
- a lesson/library question without a German prompt;
- a question without Arabic support;
- an empty or duplicate option;
- an empty explanation;
- a controlled exercise without a renderable type-specific German instruction;
- release placeholder markers such as `TODO`, `FIXME`, `TBD`, `Lorem ipsum`, fake audio keys, or invalid example URLs.

Current result:

```text
Empty authored runtime strings: 0
Invalid numeric values: 0
Lesson questions without German prompt: 0/924
Library questions without German prompt: 0/320
Controlled exercises without visible surface: 0/588
Published exam tasks with empty nested content: 0/150
Release placeholder markers in published data: 0
```

## Strict academic schema and traceability gate

`npm run content:audit` now runs during every `prebuild` and validates:

```text
Strict Zod schema families: 12
Top-level academic objects: 2,809/2,809
A1 structured noun anchors: 96/96 across 24/24 A1 lessons
A2 structured noun anchors: 96/96 across 24/24 A2 lessons
A1 verb-preposition-case frames: 24/24 across 24/24 A1 lessons (one per lesson)
A2 verb-preposition-case frames: 48/48 across 24/24 A2 lessons (two per lesson)
B1/B2 structured lexical anchors: 0 — not authored yet
Closed-answer records linked to answer and evidence: 2,584/2,584
Productive no-single-answer/model-after-commit contracts: 348/348
Unapproved direct prompt leaks: 0
Explicit type-aware exemptions: 3
Lesson objectives with teaching→practice→assessment map: 336/336
Structural objective gaps: 0
```

Generated artifacts:

```text
docs/generated/ACADEMIC_SCHEMA_REPORT.md
docs/generated/ANSWER_INTEGRITY_REPORT.md
docs/generated/OBJECTIVE_COVERAGE_REPORT.md
reports/academic-content-audit.json
```

All four share content SHA-256:

```text
b72117cac5f3aa97e2013ec9fb81d7a292f8f20786d06d9ca1beabc6e256cb4d
```

The answer audit is type-aware: visible options, ordering tokens, and matching columns are authorized banks, while keyed targets and delayed models remain hidden until commitment. Three reviewed exemptions cover two authentic repeated-greeting responses and one editing task that intentionally retains a neutral clause while removing an unsupported opinion.

The objective report is structural at lesson scope. It proves that each objective has teaching, practice, and Mini-Test surfaces, but does not claim that automation has independently verified the best semantic alignment for each item.

The lexical grammar registry currently covers four authored anchor nouns and one verb-preposition frame in each A1 lesson. It validates article/gender agreement, plural policy, three case forms, frame case, chunk, example, and source version. This is not yet a claim that every target noun or every A2–B2 frame has been annotated.

## Exercise rendering defect found and fixed

The authored data for `a1-01-e1` was complete, but the component did not render its `promptDe`, leaving only options visible. Internal IDs and raw type slugs also distracted the learner, and `___` could look like a missing UI fragment.

The shared runner now guarantees:

- German-first instruction for all five types;
- Arabic support directly below it;
- German MCQ stem rendering when authored;
- a bordered `?` slot for every `___` gap;
- explicit answer-field labels;
- Arabic exercise-type labels;
- no visible internal IDs such as `a1-01-e7`.

Representative fixed surfaces:

```text
Wählen Sie die richtige Antwort.
اختر الصيغة الصحيحة:
□ heiße Mariam.

Ergänzen Sie die Lücke.
أكمل الرد:
Danke, [?].
جوابك بالألمانية
```

## Audio verification

`tests/unit/mp3-bitstream.test.ts` and `tests/unit/exam-audio-assets.test.ts` verify:

- 260/260 files exist and match manifest byte size and SHA-256;
- valid MPEG Layer III frame chains;
- parsed duration close to manifest duration;
- nontrivial payload variation;
- all eight diagnostic files exceed ten seconds;
- all 90 logical exam clips have complete ordered segments;
- transcript character/word density stays within conservative speech bounds;
- reported Full 02 source endings remain present and durations are not suspiciously short.

Current result:

```text
Physical MP3: 260/260 structurally valid
Diagnostic MP3: 8/8 > 10 seconds
Exam listening tasks: 42/42 complete
Exam logical clips: 90/90 complete
Partial task coverage: 0
Missing task coverage: 0
```

The resilient onboarding/diagnostic player also waits for positive browser metadata and provides Browser TTS plus retry instead of leaving a permanent `0:00` display. Service Worker runtime cache v4 excludes Range/206 partial responses.

## Honest boundaries

This audit can prove structural completeness, source strings, answer mappings, checksums, frame duration, and tested browser rendering. It cannot prove by itself:

- that every German/Arabic explanation is pedagogically ideal;
- that every automatically selected reading evidence sentence is semantically the best one;
- that every spoken phoneme matches the script word-for-word;
- human voice diversity or exam-grade acoustics;
- behavior on every physical browser/device/screen reader;
- official Goethe/telc validity or endorsement.

Those remain human academic, linguistic, acoustic, accessibility, and rights-review tasks. Automated completeness must not be described as independent expert review.
