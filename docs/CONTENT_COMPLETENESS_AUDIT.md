# Content Completeness and Empty-Asset Audit

Sync batch: v161 · 2026-09-23 · re-verified in full against pack `dwnb-full-pack-v161`.

Last verified: 2026-09-20 against `v138` (structural counts below re-read from `reports/academic-content-audit.json`)

## Scope

This audit checks the runtime-authored content that a learner can encounter:

- 96 academic lessons and every nested stage object;
- 677 controlled exercises;
- 1,056 lesson reading/listening/Mini-Test questions;
- 80 reading-library and 80 listening-library items;
- 320 library questions;
- 32 adaptive-diagnostic questions;
- 150 provider-scoped exam tasks and twelve full-simulation dashboards;
- Goethe/telc profiles and source references;
- curriculum-derived SRS cards;
- 272 physical MP3 files (plus 272 Ogg Opus alternatives) and 90 logical exam clips;
- Offline route/cache contracts;
- 17 conditional MSA/Tunisian contrast notes linked to published lesson theory.

## Automated empty-content checks

`tests/unit/complete-runtime-content-audit.test.ts` recursively traverses every imported published content tree and fails on:

- an empty or whitespace-only authored string;
- a non-finite numeric value;
- a lesson/library question without a German prompt;
- a question without Arabic support;
- an empty or duplicate option;
- an empty explanation;
- a controlled exercise without a renderable type-specific German instruction;
- empty or placeholder text inside the conditional Tunisian-support registry;
- release placeholder markers such as `TODO`, `FIXME`, `TBD`, `Lorem ipsum`, fake audio keys, or invalid example URLs.

Current result:

```text
Empty authored runtime strings: 0
Invalid numeric values: 0
Lesson questions without German prompt: 0/1,056
Library questions without German prompt: 0/320
Controlled exercises without visible surface: 0/677
Published exam tasks with empty nested content: 0/150
Release placeholder markers in published data: 0
```

## Strict academic schema and traceability gate

`npm run content:audit` now runs during every `prebuild` and validates:

```text
Strict Zod schema families: 16
Top-level academic objects: 4,292/4,292
A1–B2 structured noun anchors: 1,244 entries across 96/96 lessons
A1–B2 verb-preposition-case frames: 134 entries across 96/96 lessons
Conditional Tunisian-support notes: 17 entries across 17 lessons
Closed-answer records linked to answer and evidence: 2,805/2,805
Productive no-single-answer/model-after-commit contracts: 384/384
Unapproved direct prompt leaks: 0
Explicit type-aware exemptions: 3
Lesson objectives with teaching→practice→assessment map: 389/389
Structural objective gaps: 0
```

Generated artifacts:

```text
docs/generated/ACADEMIC_SCHEMA_REPORT.md
docs/generated/ANSWER_INTEGRITY_REPORT.md
docs/generated/OBJECTIVE_COVERAGE_REPORT.md
docs/generated/LEXICAL_TARGET_GAP_REPORT.md
reports/academic-content-audit.json
```

All five share content SHA-256:

```text
fb2683dc185e742fccb86634ef0c4f6b266cbef3efc4e6e0e6b71a92050ad7b6
```

The answer audit is type-aware: visible options, ordering tokens, and matching columns are authorized banks, while keyed targets and delayed models remain hidden until commitment. Three reviewed exemptions cover two authentic repeated-greeting responses and one editing task that intentionally retains a neutral clause while removing an unsupported opinion.

The objective report is structural at lesson scope. It proves that each objective has teaching, practice, and Mini-Test surfaces, but does not claim that automation has independently verified the best semantic alignment for each item.

The lexical grammar registry now contains 1,297 noun records and 134 frames. The A1–B2 machine queues are **not** zero after the four final B2 lessons: nouns 4,802 = 1,380 covered / 89 pending-human / 3,333 context-only, and verbs 1,233 = 134 covered / 4 unclassified / 1,095 not-target, with eight versioned structural exclusions still awaiting independent confirmation. Pending rows are open review work, not approved content. Six frame exclusions remain `authored-review-pending`. Independent German review is still mandatory before P0-98/99 close.

## Meaning-first case sequence

`case:audit` is a separate prebuild gate for `meaning-first-case-v1`:

```text
Case-teaching contracts: 19/19
Theory references: 23
Controlled exercise references: 57
Mini-Test references: 44
Explicit case signals without an owner: 0
Required sequence: meaning → role → form
```

The generated artifacts are `docs/generated/MEANING_FIRST_CASE_REPORT.md` and `reports/case-teaching-audit.json`. They share case-content SHA-256 `1c0b3dfda2e73df0528ccd029444a3c9f355ae6af6f88f5c328b97bb874a8b6d`. This proves authored order and references, not independent linguistic approval of every explanation.

## Language and Bidi boundary audit

`language:audit` scans all 179 TSX files and 6,990 opening tags during `prebuild`. Current evidence includes 399 explicit German `lang=de/dir=ltr` fragments, 45 technical/numeric/secret scopes, 10 adaptive answer-bank renderers, and 233 Arabic+Latin static text nodes under plaintext/isolate containment, with zero pairing or raw-control issues. The generated artifacts are `docs/generated/LANGUAGE_BOUNDARY_REPORT.md` and `reports/language-boundary-audit.json`, sharing SHA-256 `cca1586eda10f7c95d559ab4ca843d9e07d6201bab7ba8224b0f14643eb09ed4`. Physical screen-reader speech-order review remains deferred.

## Conditional Tunisian support audit

`tunisian:audit` now runs during `prebuild` and verifies `tunisian-support-v1`:

```text
Optional authored notes: 17
Published lessons with notes: 17
Linked theory blocks: 17
A1 / A2 / B1 / B2: 6 / 5 / 4 / 2
Contrast categories: 15
Independent reviews recorded: 0
Authored notes pending independent review: 17
Structural issues: 0
```

The onboarding choice now has a real runtime effect: the rule stage renders a separate MSA bridge, Tunisian approximation, comprehension risk, and German anchor only in `tunisian-supported` mode. The generated artifacts are `docs/generated/TUNISIAN_SUPPORT_REPORT.md` and `reports/tunisian-support-audit.json`, sharing SHA-256 `769c3276791f02734ca5082a33b3b24cebabcfad9b2fd6ff886ae0a1069bef3d`.

All notes are explicitly `authored-review-pending`. This structural and conditional-delivery evidence is not an independent Tunisian/MSA linguistic review; P0-373/376 remain partial until the final human review records reviewer/date evidence.

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

## Two-person information-gap acceptance

`two-party-information-gap-v1` is embedded in Speaking. It keeps Role A/B facts private through explicit hidden handovers, requires a real second-person confirmation, four turns, and a correct joint decision. Solo role rotation cannot be saved as two-party evidence. Automated tests prove state separation and persistence boundaries, not linguistic quality or an app-provided live partner.

## Educational listening-speed coverage

`learning-playback-speed-v1` provides one bounded control across every authored listening surface:

```text
Rates: 0.75× / 1× / 1.15×
Resilient onboarding/diagnostic: covered
Lesson listening: covered
Listening library: covered
Guided exam listening and ordered segments: covered
Shadowing model: covered
Continuous timed exam rehearsal: locked at 1×
Learner recording playback: intentionally unchanged
```

Native audio receives `playbackRate`, `defaultPlaybackRate`, and `preservesPitch=true`; Browser TTS receives the selected numeric rate. Unit tests verify the policy and adoption, while production-browser tests inspect real rate/pitch properties in onboarding, lesson, library, guided exam, and Shadowing flows.

This is structural/runtime evidence, not a human acoustic finding. P0-135 remains partial until a person checks 0.75× and 1.15× across representative physical devices and Browser TTS voices for artifacts, intelligibility, names, and numbers.

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

## Internal similarity and separate review states

`content-near-duplicate-v1` scans all 2,932 closed/productive prompt objects through 4,296,846 deterministic normalized token/bigram pairs. The first run exposed 24 cross-context pairs; visible lesson, library, and full-exam prompts were rewritten to preserve their actual context. The current result keeps 10 same-context teach→practice→assessment pairs visible as structural exemptions and has 0 unexempt internal near-duplicate issues.

`content-review-state-v1` emits a row for every one of the 2,932 objects with four independent dimensions: German, Arabic, CEFR, and copyright. Every dimension currently has 2,932 `automated-pass-human-pending` and 0 independently reviewed rows. The machine and readable artifacts are `reports/content-similarity-review-audit.json` and `docs/generated/CONTENT_SIMILARITY_REVIEW_REPORT.md`, sharing SHA-256 `9b0e34489aee98128edb52d24cac2202d08b23f44721e23147570c0a3972fd5b`.

No Menschen/Hueber or official exam source corpus is copied, fetched, or compared. Authorized external reference corpora = 0, so P1-92 and copyright clearance remain partial even though P1-293 internal scanning and P1-295 separate state tracking are implemented.

## Honest boundaries

This audit can prove structural completeness, source strings, answer mappings, checksums, deterministic lexical candidate classification, frame duration, and tested browser rendering. It cannot prove by itself:

- that every German/Arabic explanation is pedagogically ideal;
- that every automatically selected reading evidence sentence is semantically the best one;
- that every spoken phoneme matches the script word-for-word;
- human voice diversity or exam-grade acoustics;
- that the 17 authored Tunisian approximations represent every Tunisian region or have passed independent Tunisian/MSA review;
- behavior on every physical browser/device/screen reader;
- official Goethe/telc validity or endorsement.

Those remain human academic, linguistic, acoustic, accessibility, and rights-review tasks. Automated completeness must not be described as independent expert review.
