# ADR-041 — Safe personal vocabulary import and local content-error reports

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `personal-vocabulary-import-v1`, `local-content-error-report-v1`
- Closes: P1-344, P1-366

## Context

Learners need to bring a bounded personal vocabulary list without turning arbitrary files into curriculum, SRS cards, or mastery evidence. Import must be preview-first and protect against malformed rows, spreadsheet formulas, markup, Bidi controls, duplicates, and oversized payloads.

The product also needs a useful way to prepare a linguistic/content error report tied to the exact published resource. The platform has no server, issue tracker token, or required account. A report must therefore remain an explicitly unsubmitted local draft until the learner manually copies or downloads it.

## Decision

### 1. Strict TSV import contract

The personal vocabulary importer accepts UTF-8 TSV with this exact header:

```text
German<TAB>Arabic<TAB>Example<TAB>Tags
```

The file is limited to 256 KiB and 500 data rows. Every row must contain exactly four columns. German and Arabic are required; the German field must contain German/Latin letters without Arabic script, the Arabic field must contain Arabic script, and an optional example must be German rather than Arabic. Tags are optional comma-separated short tokens, deduplicated and limited to six.

Rows beginning with spreadsheet formula characters (`=`, `+`, `-`, `@`) or containing angle brackets are rejected. Empty required cells, invalid language boundaries, excessive lengths, bad tags, malformed columns, and duplicates are rejected with row-level reasons. Unicode control/Bidi characters are removed and surfaced as a cleaning warning.

### 2. Preview and explicit commit

Selecting a file only creates `PersonalVocabularyPreview`; LearningState remains unchanged. The preview shows accepted, rejected, duplicate, and cleaning counts, up to ten accepted examples, and the first row-level issues. The learner explicitly confirms import of accepted rows only.

Each accepted item stores normalized German/Arabic, optional example, tags, a stable content-derived ID, import batch, timestamp, `source=user-tsv`, and:

```text
personal-vocabulary-no-srs-mastery-or-cefr
```

Imported items remain separate from published curriculum and global search. They create no ReviewItem, ReviewEvent, SRS card, exercise attempt, mastery, CEFR estimate, or gate evidence. Settings lists and deletes items individually or as a full personal list. A valid sample TSV is downloadable locally.

### 3. Portability

`personalVocabulary` has a strict schema and an empty old-v3 default. DWNB includes the list with the profile. Merge deduplicates stable item IDs. Importing a DWNB as a new profile follows the existing profile isolation. No API or cloud storage is used.

### 4. Metadata-only error report

A report can be prepared from a lesson or library resource; the underlying canonical registry also resolves exam-task references. `buildContentErrorReportDraft` validates the kind/ID pair and attaches only:

- content kind and ID;
- canonical route and German/Arabic title;
- issue category;
- learner description up to 1000 characters;
- optional suggested correction up to 600 characters;
- app version;
- local unsubmitted status and timestamp after save.

The form does not auto-attach an answer key, current answer, learner progress, diagnostic result, writing/speaking text, API key, audio, or screenshot. Text controls and Bidi overrides are removed.

### 5. No false submission claim

The flow is explicitly preview-first. Saving creates:

```text
status=local-draft-not-submitted
evidenceBoundary=report-metadata-only-no-answer-key-progress-or-network
```

There is no `fetch`, GitHub API call, email, webhook, or background sync. A standalone JSON envelope states `not-submitted-send-manually` and can be copied or downloaded. Settings lists local drafts with contextual links and individual/full deletion. The UI never says a report was sent.

## Acceptance evidence

Automated tests cover:

- exact header, UTF-8/text limits, 500-row limit, and four-column parsing;
- formula, HTML-like, empty, language, length, tag, and duplicate rejection;
- visible Bidi/control cleaning warnings;
- preview non-mutation, accepted-only commit, stable dedupe, deletion, sample validity, and no SRS/mastery changes;
- strict schema, old-v3 defaults, DWNB, merge, and new-profile import;
- canonical report metadata, unknown-ID and short-description rejection, length/Bidi cleaning;
- explicitly unsubmitted save state and a standalone export with no answer/progress/key fields;
- absence of network submission code, manual copy/download, manager deletion;
- Desktop/Mobile file selection, preview, rejected row, explicit import, DWNB profile round-trip, report preview/save/download, responsive layout, and axe coverage.

## Consequences and limits

- P1-344 and P1-366 close as product/software workflows. P1 now has zero `not-implemented` rows, while its 39 partial rows remain partial.
- The vocabulary validator checks shape and script boundaries, not whether a translation is semantically correct or CEFR-appropriate.
- Formula/markup rejection is intentionally conservative; a legitimate word beginning with a blocked character must be edited before import.
- Personal vocabulary is not automatically taught or scheduled. A future opt-in promotion flow would need its own learning evidence contract.
- A saved report is not submitted and has no maintainer response SLA. The learner must manually send the exported JSON through a channel outside this app.
- Automated tests do not replace human review of imported translations or reported linguistic issues.
