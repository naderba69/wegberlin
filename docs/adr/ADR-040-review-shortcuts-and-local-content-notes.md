# ADR-040 — Review shortcuts and local content notes

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `review-keyboard-shortcuts-v1`, `local-content-note-v1`
- Closes: P1-338, P1-341

## Context

The Review page required pointer interaction to reveal and grade every card. A fast keyboard path must not bypass reveal, duplicate a ReviewEvent, or fire while a learner is typing in another control.

Lessons and library resources also lacked learner-owned bookmarks and notes. A note must resolve to published content rather than accepting arbitrary internal IDs, remain local and portable, and never auto-copy an answer key into personal data.

## Decision

### 1. Review keyboard contract

The Review page displays and declares these shortcuts:

- `Space`: reveal or hide the current card;
- `1`: forgot;
- `3`: difficult;
- `4`: good;
- `5`: easy.

Grade shortcuts are accepted only after reveal. `resolveReviewShortcut` rejects missing cards, key-repeat events, Ctrl/Alt/Meta combinations, shifted shortcuts, and events originating from input, textarea, select, button, link, or contenteditable targets. Unsupported keys such as 2 do nothing.

All pointer and keyboard grades call the same existing `applyReviewGrade` path. A grading Ref locks the current card immediately and resets only when the queued card ID changes, preventing two fast key events from creating duplicate ReviewEvents. The visible guide and controls publish `aria-keyshortcuts`.

### 2. Versioned content reference registry

`local-content-note-v1` resolves exactly 394 published references:

- 85 lessons;
- 160 reading/listening library items;
- 150 provider-owned exam tasks.

A reference supplies its canonical title and route. Save rejects an unknown kind/ID pair before state mutation. The learner never types or sees an internal database key.

### 3. Bookmark and note record

A `ContentNote` stores:

- stable ID derived from kind and content ID;
- kind and validated content ID;
- bookmark state;
- learner note up to 600 characters;
- created and updated timestamps;
- `personal-note-no-answer-key-mastery-or-ai`.

Control characters and Unicode Bidi overrides/isolates are removed, line endings are normalized, and excessive blank lines collapse. React renders the note as text. Bookmark-only records are valid with an empty note. An unbookmarked empty record is removed.

No answer, correction, score, mastery, API key, provider, or full content body is auto-populated. Notes are excluded from the global learning search and all AI payloads.

### 4. Product surfaces and lifecycle

A compact bookmark/note control is available on every lesson and every library item. Settings lists resolved notes with canonical contextual links, note excerpts, update date, individual deletion, and full deletion.

The state schema defaults old v3 records to an empty list. DWNB preserves notes. Merge resolves a shared stable record by its latest `updatedAt`; invalid stale references remain schema data if imported but are omitted from learner-facing resolved lists. Profile isolation follows the existing per-profile LearningState.

## Acceptance evidence

Automated tests verify:

- Space and grades 1/3/4/5 mapping;
- no grade before reveal and no unsupported grade 2;
- editable-target, modifier, repeat, and no-card suppression;
- visible shortcut help, ARIA key hints, shared grade path, and duplicate guard;
- all 394 canonical references and rejection of unknown content IDs;
- 600-character bound, Bidi/control stripping, timestamp preservation, bookmark-only and delete behavior;
- latest-update merge, unresolved-display filtering, strict schema, old-v3 default, DWNB, and unchanged mastery;
- lesson/library controls plus Settings individual/full deletion;
- Desktop/Mobile keyboard reveal/grade, one ReviewEvent, note persistence, contextual return, and responsive/axe coverage.

## Consequences and limits

- P1-338 and P1-341 close as product/software workflows.
- Shortcuts apply only on the Review route and do not become undocumented global hotkeys.
- Keyboard grading still represents learner self-grading under the existing SRS policy; it is not a language score.
- Notes are private learner text, not teacher feedback, searchable corpus, or evidence of correctness.
- A user can manually type an answer into a note, but the product never inserts an answer key automatically.
- Automated keyboard tests do not replace physical Switch Control, screen-reader, or alternative keyboard-layout review.
