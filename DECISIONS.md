# Architecture Decisions

## ADR-001 — Local-first learner state
IndexedDB is the canonical durable store. Vercel hosts the application but never stores learner progress.

## ADR-002 — Guidance-first home
Returning learners land on `/today`. The curriculum path is secondary and does not grant mastery through browsing.

## ADR-003 — Zero mandatory cost
Core course features work without AI. Gemini/OpenRouter Free-only are optional BYOK enhancements; Ollama-compatible local chat is implemented, and an in-browser WebGPU model remains future work.

## ADR-004 — Portable learner ownership
The app exports/imports a versioned `.dwnb` archive. API secrets are never exported.

## ADR-005 — Honest curriculum status
Only academically populated lessons are marked `published`; mapped but unwritten lessons are `planned`.

## ADR-006 — Audited continuation handoff
`PROFESSIONAL_CONTINUATION_PROMPT_AR.md` is the pasteable recovery prompt, but it cannot override the code or source-of-truth documents. `npm run handoff:check` must fail when backlog counts, P0 status, audio/Offline counters, framework versions, cache version, or documented test counters drift.

## ADR-007 — Monthly source freshness and fail-closed remote AI
Official exam formats, AI free-tier rules, Vercel Hobby terms, and GitHub Actions billing are registered with stable IDs and a 30-day human-review clock. `npm run check` fails on stale records, a monthly workflow opens a maintenance Issue, and unverified/stale remote AI is blocked before `fetch` while local learning remains available. HTTP reachability is never treated as semantic verification. See `docs/adr/ADR-007-source-freshness-and-zero-cost-guard.md`.

## ADR-008 — Build-time academic governance
Twelve strict Zod families validate every runtime academic root and nested object during `prebuild`. A type-aware answer registry links every closed item to its answer and evidence, productive work remains no-single-answer, and every lesson objective receives a teaching→practice→assessment map. Markdown and machine reports share one SHA-256 and stale artifacts fail the build. Structural automation is not represented as human linguistic review. See `docs/adr/ADR-008-build-time-academic-governance.md`.

## ADR-009 — Novelty-weighted mastery and zoned review days
Initial lesson mastery weights unseen transfer above guided practice and counts only the latest same-item retry at 0.25, preventing click inflation. SM-2 v2 adds intervals in an injected IANA local calendar before converting to UTC, records the calendar policy/timezone, and preserves legacy v1 records. Stable item-ID novelty and local-day scheduling are deterministic but not psychometric calibration or retroactive timezone migration. See `docs/adr/ADR-009-novelty-weighting-and-zoned-review-days.md`.

## ADR-010 — Progressive structured lexical grammar
Versioned A1, A2, B1, and B2 registries author four noun anchors and at least one verb-preposition-case frame per lesson, render them through one German-first panel with collapsed case tables, and validate every record during `prebuild`. Six noun batches expand 336 anchors to 685 and reduce both A1 and A2 machine noun queues to zero. The model distinguishes count plurals, no-usual-plural meanings, weak masculine forms, `plural-only`, and optional authored Dativ-plural forms such as `Stühle → Stühlen`. Two frame batches expand 84 to 104 (25/30/31/18); exhaustive coverage stays partial. See `docs/adr/ADR-010-progressive-lexical-grammar-layer.md`.

## ADR-011 — Full CI browser matrix with bounded retry
After remote run 3 passed `check`/Build but failed desktop e2e, CI now runs both desktop and mobile projects, uses Actions v5, forbids focused tests, and permits one retry only under `CI`; local runs remain retry-free. The runner selects full Chromium's new headless channel after repeatable legacy headless-shell SIGSEGV crashes, and fresh local runs passed 64/64 after the WebGPU control/ranking flow was added. P0-302 closes only after a pushed remote run is green. See `docs/adr/ADR-011-ci-full-browser-matrix-and-bounded-retry.md`.

## ADR-012 — Deterministic lexical target-gap inventory
`lexical-target-gap-v1` compares every lesson's anchor registry with explicit glossary, vocabulary-phrase, and flashcard target signals; scans theory/text/task surfaces as context only; never uses sentence-initial capitalization alone; and never invents gender, plural, or governed case. Stable covered/pending-human/not-target rows enter the hashed academic report and `prebuild`. Two frame batches added 20 records above baseline and six noun batches added 349; the current 360 B1/B2 noun decisions and six versioned frame exclusions keep P0-98/99 partial. `lexical-frame-exclusions-v1` classifies the six obvious locative/separable/adjunct/purpose false positives while retaining `authored-review-pending` for independent confirmation. See `docs/adr/ADR-012-lexical-target-gap-inventory.md`.

## ADR-013 — Pre-SRS retrieval, visible grace, and behavioral praise
`pre-srs-retrieval-warmup-v1` preserves a real three-item delayed-reveal retrieval block when no SRS card exists; `weekly-grace-v1` visibly bridges one missed day without inventing evidence or recovery debt; a Sunday rest stays zero-budget unless an explicit check-in turns it into a bounded voluntary session; and `behavioral-praise-v1` names observable behavior across Today, Review, Writing, Speaking, and exams while tests ban generic applause. See `docs/adr/ADR-013-retrieval-grace-and-behavioral-praise.md`.

## ADR-014 — Local, pre-commit, and full-history secret gate
`secret-audit-v1` scans current text during `npm run check`, requires full Git history in CI, activates a versioned pre-commit hook in the safe Termux flow, and redacts every finding. A public clone at `be56463e` produced zero findings across 15 commits and 43,401 changed text lines. This does not replace provider-side credential rotation after a real exposure. See `docs/adr/ADR-014-secret-history-and-precommit-gate.md`.

## ADR-015 — Independent level Offline packs and build-size evidence
Offline route manifest v2 exposes A1/A2/B1/B2/full packs with 50/50/50/199/298 routes and filters optional audio to 40/48/48/124/260 files. `postbuild` measures generated route HTML and unique Next static assets, records deterministic gzip bytes plus a build fingerprint, and the UI shows that estimate before download while preserving actual post-install Cache Storage measurement. See `docs/adr/ADR-015-level-offline-packs-and-build-size-manifest.md`.

## ADR-016 — Deduplicated polite status announcements
`status-announcement-v1` separates visible feedback from one hidden polite atomic live node, normalizes messages, and suppresses unchanged rerenders. Diagnostic, all level gates, module/error results, productive labs, targeted exam types, continuous submission, Review, Today, and Settings share the component; physical screen-reader validation remains separate P0-255 work. See `docs/adr/ADR-016-deduplicated-polite-status-announcements.md`.

## ADR-017 — Diagnostic productive sample without a score
`diagnostic-productive-sample-v1` asks experienced/uncertain learners for a three-word written or 3–45 second local spoken sample, both, or an explicit no-penalty `not-yet`. It stores self-evidence and optional media but has no score and cannot change the receptive placement result; absolute beginners still bypass diagnosis. See `docs/adr/ADR-017-diagnostic-productive-sample-without-score.md`.

## ADR-018 — Meaning and role before case form
`meaning-first-case-v1` inserts Bedeutung → Rolle → Form before case theory/practice in 17 lessons and maps 21 theory blocks, 54 controlled exercises, and 40 Mini-Test items. `case:audit` owns every explicit case-name signal and rejects form terminology in the semantic-first question. Independent wording review remains deferred to the final whole-project review. See `docs/adr/ADR-018-meaning-first-case-sequencing.md`.

## ADR-019 — Language and Bidi fragment governance
`language-boundary-v1` pairs German/Arabic language and direction, accepts regional language tags such as `ar-TN`, scopes technical LTR values, adaptively classifies generic answer strings, forbids raw bidi controls, and applies plaintext/isolate CSS containment. `language:audit` currently covers 161 TSX files, 5,951 opening tags, 313 explicit German fragments, 10 answer-bank consumers, and 216 mixed static nodes with zero issues. Physical assistive-technology review remains deferred P0-255 work. See `docs/adr/ADR-019-language-and-bidi-fragment-governance.md`.

## ADR-020 — Conditional Tunisian support with honest review state
`tunisian-support-v1` makes the onboarding choice materially affect the rule stage through 17 separate MSA bridge + Tunisian approximation + comprehension-risk + German-anchor records across A1/A2/B1/B2 = 6/5/4/2. The generated audit verifies 17 lesson/theory references, exclusive `tunisian-supported` visibility, 15 contrast categories, and review-evidence consistency. Every note remains `authored-review-pending`; P0-373/376 stay partial until independent Tunisian/MSA review is recorded in the final whole-project review. See `docs/adr/ADR-020-conditional-tunisian-support-governance.md`.

## ADR-021 — Shared educational listening speeds with continuous-mode lock
`learning-playback-speed-v1` standardizes 0.75×/1×/1.15× across resilient onboarding/diagnostic audio, lessons, library, guided exam listening, and Shadowing. Native playback requests pitch preservation, TTS uses the selected numeric rate, ordered exam segments inherit it, and continuous timed rehearsal remains fixed at 1×. Learner recordings are untouched. P0-135 stays partial until human distortion review on physical devices in the final whole-project round. See `docs/adr/ADR-021-educational-listening-speed-policy.md`.

## ADR-022 — Same-device two-person information gap
`two-party-information-gap-v1` separates private A/B facts, forces hidden handovers and four spoken turns, and saves a joint decision only after explicit second-person confirmation. Solo role rotation cannot produce two-party evidence. This closes P0-159 without claiming an app-provided live partner. P0-160 is now implemented separately through `content-grounded-follow-up-v1`: after listening back, the learner may type a German summary/transcript and receive a deterministic Offline question grounded in a verified cue. Gemini/OpenRouter Free-only/Ollama remain optional behind a fresh preview-and-consent modal; the audio Blob is never sent, and neither path may claim STT, recording understanding, pronunciation scoring, or fluency scoring. See `docs/adr/ADR-023-text-grounded-speaking-follow-up.md`; the separate information-gap decision remains in `docs/adr/ADR-022-pass-and-play-information-gap.md`.

`browser-webgpu-model-v1` closes P0-219 with one bounded model task rather than a second free-form tutor. A pinned q8 multilingual MiniLM model runs feature extraction in a dedicated Web Worker and ranks authored follow-up candidates. Installation is 130–150 MB Opt-in after secure-context/adapter/memory/buffer/storage/source checks; weights are excluded from Git/ZIP/default Offline packs, and failure or deletion removes the dedicated Cache. The Transformers plaintext is materialized from a packed tracked payload after dual SHA-256 checks and ignored by Git to avoid an upstream-minified GitHub Mistral-key false positive; ONNX runtime artifacts and Apache/MIT notices remain directly vendored. Unused Node dependencies are not installed. There is no silent WASM/paid fallback or STT/acoustic/CEFR claim. See `docs/adr/ADR-024-opt-in-browser-webgpu-embedding-model.md` and `docs/WEBGPU_MODEL.md`.

`journey-state-machine-v1` closes P1-5 with five explicit derived phases on Today: orientation, foundation, growth, consolidation, and provider-scoped exam readiness. Transitions use onboarding/diagnostic evidence, lesson completion, level gates, and exam-module readiness; browsing cannot advance them.

`session-adaptation-v1` closes P1-7/8 with three post-check-in actions: less time selects a safe lower valid budget, too easy transfers bounded unfinished practice time to production, and too hard caps load when completed blocks allow it. Provenance is durable under `planning-signal-no-mastery-or-correctness`; no mastery, correctness, or completed evidence is created or deleted. See ADR-026.

`reading-comprehension-benchmark-v1` closes P1-126: WPM is local, visible-timer-only, capped, and omitted unless two comprehension checks are correct. A qualified result splits—not enlarges—the Today lesson budget into a 5/6/8/10-minute reading block. `writing-device-benchmark-v1` completes P1-18 by measuring an accurate manual copy inside the beginner-safe Writing Lab, never language quality, and carving a 5/8/10/12-minute block from the existing practice/production pool. See ADR-027 and ADR-028.

`accessibility-preferences-v1` closes P1-19/258 with a Settings preview and durable large-text, high-contrast, and reduced-motion controls. Shared typography tokens provide explicit compact, comfortable-default, and larger reflow values; root theme attributes apply immediately; OS reduced-motion is respected even when the local toggle is off; Zod, DWNB, Merge, reload, Reset, responsive, axe, desktop, and mobile tests cover the software contract. P0-255 remains partial until physical assistive-technology/device review. See ADR-029.

`support-usage-v1` closes P1-65 by recording help as non-punitive planning context across hints, translations, transcripts, and post-attempt models, with independent privacy deletion and DWNB/Merge portability. `evidence-freshness-v1` closes P1-66 by capping displayed confidence through transparent 30/90/180-day bands while preserving every score, attempt, mastery value, and timestamp. These are planning policies, not psychometric or CEFR decay. See ADR-030.

`error-pattern-classification-v1` closes P1-78/79 with optional German-first confidence, high-confidence wrong prioritization, and bounded slip/pattern/misconception-risk labels. Two failed treatments return to the captured source Rule stage, closing P1-80 without guessing a dependency. `confirmed-error-srs-v1` closes P1-77 only after initial plus delayed successful repair; normalized duplicates collapse, review scope is personal remediation, and mastery stays zero. See ADR-031.

`content-near-duplicate-v1` closes P1-293 with a fail-closed 3,020-object/4,558,690-pair internal token+bigram scan; 24 initial cross-context prompts were rewritten and 10 same-context progression pairs remain visible. `content-review-state-v1` closes P1-295 with separate German/Arabic/CEFR/copyright states on every object, all honestly human-pending. External authorized corpora remain zero, so P1-92 and copyright clearance stay partial. See ADR-032.

`local-study-exports-v1` closes P1-53/281/339/340 with preview-first local ICS, semantic print, Canvas/JPEG PDF, and formula-safe UTF-8 Anki TSV. Name is opt-in; media, keys, tutor payloads, and free learner text are excluded; DWNB remains the only restore format. PDF is printable but not tagged/selectable. See ADR-033.

`fourteen-day-learning-contract-v1` keeps append-only 14-day planning revisions on Settings/Today; `single-skill-diagnostic-v1` alternates a four-item A1–B2 sample without replacing the overall diagnosis; `quiet-hours-local-v1` suppresses noncritical in-app nudges without Push/Notification and preserves deadline safety. They close P1-20/32/54 with no mastery/gate effect. See ADR-034.

`ai-resilient-fallback-v1` closes P1-223/330 with one AbortController-bounded Gemini/OpenRouter/Ollama attempt, explicit rate-limit/timeout/network/http/malformed classification, deterministic local fallback, persisted no-key provenance, and mandatory renewed consent before retry. No automatic or paid second request occurs. See ADR-035.

`tutor-follow-up-command-v1` closes P1-210 through three German-first commands linked to the immediately previous answer and lesson. Disabled runs them locally; every Gemini/OpenRouter/Ollama command requires a new consent and sends no active errors or exercise answer key. Command/parent/provider/model/consent provenance is portable under a no-mastery/correctness boundary. `ai-provider-capability-matrix-v1` closes P1-222 without inventing live quota: five provider rows expose model, connected features, setup, privacy, quota wording, zero-cost/source boundary, and fallback; writing AI is explicitly not connected and WebGPU remains a limited local ranker. P1-224 closes with successful mocks for every connected Tutor/command/typed-Speaking provider and a WebGPU Worker mock. See ADR-036.

`three-pass-listening-sequence-v1` closes P1-139 across all 84 lessons by gating player, authored gist question, authored detail questions, and transcript in order while preserving old attempts. Deduplicated process events carry no answer/score/mastery and are portable/deletable. `articulation-contrast-practice-v1` closes P1-150/151 through an original accessible inline SVG mapped to the lesson focus, honestly typed minimal/sound/prosody contrasts, and hidden Browser TTS discrimination. Stored matching describes the synthetic target only, not learner pronunciation. See ADR-037.

`writing-error-micro-practice-v1` closes P1-175 with up to three delayed-correction exercises sourced only from seven deterministic patterns in the learner's actual reviewed submission. Attempts link submission/version/task/pattern and remain no-mastery/no-gate, portable, and deletable with their source. `practice-law-language-boundary-v1` closes P1-186 by separating lesson-owned Sprachregel, context-dependent Übliche Praxis, and not-claimed Offizielle Vorgabe/Gesetz on every Rule stage; high-risk living contexts demand external verification without fabricated official facts. See ADR-038.

`evidence-derived-achievement-v1` closes P1-271 with six recomputed, threshold-visible achievements sourced only from completed lessons, delayed lesson reviews, linked Writing revisions, listened-back Speaking reflections, a complete A1 path, or a complete provider-owned simulation. It persists no badge and creates no mastery/CEFR/reward. `gamification-visibility-v1` closes P1-272 with a root-level, old-v3/DWNB/merge-compatible quiet mode that hides achievements, streaks, decorative motivation, and praise while preserving functional tasks, evidence, gates, clocks, feedback, and warnings. See ADR-039.

`review-keyboard-shortcuts-v1` closes P1-338 with visible and ARIA-declared Space/1/3/4/5 shortcuts that ignore editable controls/modifiers/repeats, require reveal, share `applyReviewGrade`, and lock duplicate events. `local-content-note-v1` closes P1-341 with 394 validated lesson/library/exam references, bookmark-only or sanitized 600-character notes, lesson/library controls, a Settings manager, strict old-v3/DWNB/latest-merge persistence, and no automatic answer/search/AI/mastery use. See ADR-040.

`personal-vocabulary-import-v1` closes P1-344 with Preview-first strict UTF-8 TSV, 256 KiB/500-row limits, formula/markup/script/shape/duplicate guards, explicit accepted-only commit, and a deletable personal list that never creates SRS/mastery/CEFR. `local-content-error-report-v1` closes P1-366 with validated canonical metadata, bounded local preview, explicit unsubmitted draft status, manual safe JSON copy/download, no network, and no automatic answer/progress/key attachment. See ADR-041.

The owner selected an honest primary self-study teacher rather than a false “complete corrector” guarantee. `hybrid-writing-review-v1` keeps local task/dimension/pattern/repair feedback primary, makes residual semantic/idiomatic/argument uncertainty explicit, and permits Gemini BYOK only as an optional second review after fresh per-version consent. `writing-review-v1` requires strict JSON, verbatim source excerpts, confidence, unresolved questions, a minimized payload, and hashed no-key provenance; it cannot create mastery, CEFR, official score, or a guaranteed teacher replacement. ADR-042 supersedes ADR-036 only for the Gemini Writing capability row.

`prior-experience-context-v1` closes P1-17 without textbook-based placement or beginner German writing. `equivalent-mission-alternative-v1` closes P1-41 by preserving objective, evidence kind, and minutes while keeping the declined original incomplete. `automatic-load-reduction-offer-v1` closes P1-43 with visible active-time plus consecutive-error triggers and exactly one learner-controlled accept/decline decision without penalty. `today-session-offline-readiness-v1` closes P1-44 only after the controlling Service Worker verifies current routes and lesson audio in completed shell/pack caches; it never auto-downloads. Strict optional schema-v3 records, DWNB, merge, and the v103 cache generation preserve the contracts. See ADR-043.

`module-recycling-ratio-v1` closes P1-91 with thirty deterministic ten-question review plans: A1.1 is an honest no-history baseline, then 20%/30%/30%/40% old material for A1/A2/B1/B2, always mixing earlier vocabulary and grammar where history exists. The percentage composes review and has no automatic mastery/CEFR effect. `lexical-strategy-registry-v1` closes P1-101/102/103 with 32 authored word families and 128 explicitly typed relations, 32 register examples balanced across formal/neutral/colloquial/professional, and 24 bounded Arabic-learner confusions whose `notUniversal:true` prevents population diagnosis. Search exposes the German-first explorer; `lexical-strategy-audit-v1` is strict and fail-closed in prebuild across all registries and 30 module plans. See ADR-044.

`grammar-progression-map-v1` closes P1-113/114/115 with 24 canonical rule nodes, six per level, 31 acyclic backward prerequisites, progressive now/limit/deferred layers, explicit boundaries/exceptions, and exact theory→controlled→lesson-owned production references. The visible `/path` graph and Rule-stage panels create no mastery and are not an official CEFR grammar order. `comprehension-question-taxonomy-v1` closes P1-125 by labeling all 504 reading/listening items as gist/detail/stance/inference/structure, preserving the 84 first-listening gist contracts and enforcing a level balance envelope. QuestionQuiz is German-first; labels never affect correctness or score. `learning-architecture-audit-v1` is strict and fail-closed while remaining honestly deterministic, not independent human semantic review. See ADR-045.

`easy-vs-exam-reading-v1` closes P1-127 with mode-scoped answers and no assistance carry-over. `unknown-word-and-compound-strategy-v1` closes P1-128 by requiring a hypothesis and context check before revealing only an authored registry meaning; compound splitting is conservative and coverage is 63/80 texts. `unified-listening-usage-evidence-v1` closes P1-137 with strict playback ordinal/source and transcript timing across seven listening surfaces, portable under a no-score boundary. `prosody-rhythm-progression-v1` closes P1-138 with 16 synthetic-model steps across word stress, sentence focus, rhythm, and hesitation/repair; it cannot listen to or score the learner. See ADR-046.

`partial-study-sections-export-v1` closes P1-235 without pretending selective JSON is a backup; `offline-recovery-page-v1` closes P1-246 through a cached recovery route before Today fallback; checksum-verified resource-level staging resume closes P1-247 without a Range Resume claim; and `js-budget-v1` closes P1-248 through fail-closed postbuild Gzip limits. See ADR-049.

`weekly-planned-actual-no-blame-v1` closes P1-282 with an elapsed-plan versus recorded-activity comparison, explicit flexibility band, and no penalty/debt/mastery consequence. `evidence-velocity-readiness-range-v1` closes P1-284 with provider-scoped evidence-gap ranges or insufficient-data, never a pass date. `vercel-csp-headers-v1` closes P1-318 with 15 centralized directives, seven headers, exact remote/loopback allowlists, documented Next/WASM exceptions, and a fail-closed generated audit. `dwnb-deprecation-policy-v1` closes P1-365 with a v1/v2/v3 matrix, more than 180 days of v1 support through 2027-03-31, runtime migration warning, old-state migration before strict validation, and explicit pre-mutation expiry/unknown rejection. See ADR-050, `docs/SECURITY_HEADERS.md`, and `docs/DWNB_DEPRECATION_POLICY.md`.

`independent-curriculum-version-v1` closes P1-367 by storing `dwnb-a1-b2-2026.09-v1` independently from app `0.1.0` in state, DWNB, migration, Merge, and import preview. `content-accountability-lifecycle-v1` closes P1-368/389 with owner/reviewer role separation across 3,020 content rows, 16 Draft→Validated→Published families, 18 sources, and 12 runtime learner-risk types. Published remains explicitly separate from independent-review completion. `general-consular-legal-claims-v1` adds 12 safe not-claimed contexts but keeps P1-377 partial for specialist review. `arabic-learner-pronunciation-inventory-v1` adds 18 not-universal rows with lesson/diagram/evidence mapping; 11 exact TTS pairs exist, so seven pairs plus independent phonetics review keep P1-380 partial. See ADR-051.

`P2_AUDIT.md` is the conservative source of truth for all 140 P2 proposals: 118 implemented, 2 partial, 20 not implemented, and 0 blocked as of 2026-09-11. A closure sprint moved all 44 technically closable partial rows to implemented only after adding named UI/state/audit contracts and tests. P2-264 remains partial for real WCAG/assistive-technology testing; P2-384 remains partial for independent Arabic regional review. P2 counts never close P0/P1 human-review items.

`event-derived-mastery-v1` closes P2-72/237 by making every new runtime mastery mutation pass through one central set/increment/delete event capture and by treating `mastery` as a rematerialized cache. Merge unions stable event IDs, accumulates distinct concurrent delayed-review increments, deduplicates the same evidence, honors later lower set results and deletes, then recalculates. Old keys receive no invented history and remain visible Legacy fallback until new evidence. The strict no-answer-text event log is portable through IndexedDB/DWNB/partial export/Merge. See ADR-052.

`guided-independent-support-separation-v1` closes P2-70/287 by classifying latest unique controlled attempts as guided and reading/listening/Mini-Test attempts as transfer, then separating direct same-item pre-commit-assisted evidence from independent evidence. Post-commit support and support on another item never contaminate a prior answer. Progress shows factual bucket counts/accuracies without answer text, productive-language scoring, punishment, or mastery mutation. See ADR-053.

`bounded-attempt-process-v1` closes P2-33/34 with visible per-item response time excluding hidden-page duration, discrete committed selection changes, and optional German-first learner attribution as knowledge recall, guess, or unclear instructions. Text entry starts timing but never logs keystrokes or intermediate drafts. Strict capped metadata is portable and summarized only as planning context; it creates no cognitive diagnosis, correctness change, CEFR result, or mastery. See ADR-054.

`explainable-plan-change-timeline-v1` closes P2-48 by deriving a newest-first Today history from bounded check-in changes, session adaptations, equivalent alternatives, accepted/declined load offers, structured next-focus choices, and contract revisions. It does not create a second mutable log or copy answers/free reflection text, and it creates no mastery, completion, blame, or synthetic change. See ADR-055.

`learner-selected-intensity-presets-v1` closes P2-57 with explicit Light (base capped at 20), Balanced (latest contract/profile base), and Intensive (one valid budget step higher) choices. Balanced is default and Intensive never activates automatically. Check-in, low energy, previous lighter focus, and reduction actions remain higher priority. The root preference is Zod/DWNB/Merge compatible, changes no mastery, and appears in the plan-change timeline after explicit selection. See ADR-056.


## ADR-058 — Daily focus tools preserve the coach recommendation
`guidance-focus-tools-v1` closes P2-45/47/201/239/286/347 with persisted morning/evening entry modes, a single learner-pinned mission, exact five-minute weakest-evidence practice, calendar-only 12/8/4/1 guidance, a no-mutation +30-minute scenario, and a level-gate backup reminder cleared only by a newer local DWNB export. Existing voice selection closes P2-153 and the print answer sheet closes P2-203. None creates completion, mastery, pass probability, or time debt. See `docs/adr/ADR-058-guidance-focus-tools-and-level-backup.md`.

## ADR-057 — Pairwise migration and P2 partial-closure sprint
`supported-pairwise-migration-matrix-v1` tests all seven historically valid DWNB/state-schema pairs through the real importer. The broader P2 sprint closes 44 formerly partial software rows using independently named bounded contracts: weekly reflection and planning, library production/adversarial controls, portfolio and error tools, Opus/low-data/audio preferences, raw privacy/export/rollback, deployment/budget/threat gates, practical day and unified concept map. 260 Opus files accompany 260 MP3 fallbacks; active/staging/previous pack caches are now v118. Manual WCAG and independent Arabic review remain explicitly open as P2-264/384. See `docs/adr/ADR-057-pairwise-migration-matrix.md`, `P2_AUDIT.md`, and the feature-specific tests.

## 2026-09-10 — Beginner-readable defaults and guided A1 production

`beginner-readable-completion-v1` replaces raw lesson evidence fractions and “repair now” wording with one concrete next action plus a plain four-part checklist. The comfortable typography profile is now the default, with compact/comfortable/larger controls in both Settings and the persistent top bar. `a1-01` speaking is a 5–10 second listen→phrase→guided-record cycle; support stays visible by default and its provenance prevents guided recordings from counting as independent evidence. `guided-mediation-from-understanding-to-free-v1` gives the first mediation task a source-grounded starter and learner-facing steps. These changes do not claim local STT or pronunciation correction; the standard local pronunciation model remains a separate implementation. See ADR-059.

## 2026-09-11 — Standard local German word matching precedes phoneme claims

`local-german-word-matching-v1` adds one explicit-download q8 Whisper tiny pack in a dedicated WebGPU Worker. Short recordings are decoded and resampled locally to 16 kHz, transcribed in German from the completed cache, and compared only with authored target words. `local-microphone-signal-check-v1` blocks silence, low level, or clipping before ASR without diagnosing a noise source; `local-word-repair-loop-v1` gives each unconfirmed word a listen→record→playback→recheck→retry cycle. The UI emits at most three corrections, ignores personal extra words, persists no transcript/result, sends no audio, and produces no pronunciation/accent/fluency/CEFR score. This is a real local word-recognition and repair cycle, not yet phoneme correction. P1-380 and P0-255 remain partial pending independent phonetics and physical-device evidence. See ADR-060 and `docs/LOCAL_PRONUNCIATION_MODEL.md`.

## 2026-09-11 — Error history is factual, learner-controlled, and print-private

`actual-attempt-weekly-error-trend-v1` derives an eight-week incorrect-attempt rate from real dated attempts and leaves empty weeks unknown. `learner-declared-time-pressure-error-v1` records the learner's own “known rule, not under time” context without diagnosis or mastery. `learner-sensitive-error-print-redaction-v1` hides exact marked records and linked intervention events only in print while preserving IndexedDB/DWNB/Merge truth. `derived-error-intervention-timeline-v1` orders error appearance, repair, delayed review, clinic, and personal review outcomes without answer text or a causal-effect claim. These contracts close P2-81/82/83/285 at software level. See ADR-061.

## 2026-09-11 — Navigation serves guidance before catalog breadth

`professional-guidance-navigation-v1` groups desktop destinations into daily learning and resources/tools, gives the top bar a route-specific context, and replaces the incomplete four-item mobile bar with four frequent destinations plus an accessible “More” bottom sheet containing every main route. The sheet traps focus, closes with Escape, restores focus, labels the current route, and states that browsing does not mutate progress. Visual hierarchy, 48 px actions, responsive overflow, contrast, and reduced motion remain test contracts. See ADR-062.

## 2026-09-11 — German input and terminology stay inside the learning flow

`virtual-german-character-keyboard-v1` appears only for editable German fields and inserts `ä ö ü ß Ä Ö Ü` at the selection without reading, storing, correcting, or submitting the value. `bilingual-grammar-glossary-v1` adds 24 authored terms balanced 6/6/6/6 across A1–B2 with Arabic definitions and German examples inside Search. Neither surface changes progress or mastery. These contracts close P2-381/383. See ADR-063.

## 2026-09-11 — الإملاء يخفف الحمل أولًا ثم يطلب إعادة البناء

`adaptive-partial-full-dictation-v1` يغلق P2-142 ببنك أصلي من 16 مهمة: A1 جزئي، A2 جزئي ثم كامل، B1 جسر إلى الكامل، وB2 كامل. دورة الاستعداد→السماع→الكتابة→المقارنة لا تكشف النموذج قبل الالتزام، وتفصل فرق الكلمات عن الحروف الكبيرة/الترقيم، ثم تسمح بإخفاء النموذج والإعادة بلا عقوبة. يحفظ `dictationAttempts` ملخص الشكل والتشغيل فقط دون نص المتعلم أو mastery؛ Browser TTS موسوم اصطناعيًا وغير امتحاني ولا يرسل إلى AI. أضيف المسار إلى حزم Offline وصعدت Cache إلى v118. راجع ADR-064.

## 2026-09-11 — المحادثة المتفرعة محاكاة قرار وليست شريكًا حيًا

`offline-branching-conversation-v1` يغلق P2-354 بثماني أشجار أصلية محلية موزعة 2/2/2/2 عبر A1–B2. الهدف ظاهر قبل الاختيار، والرد الألماني يغير العاقبة التالية بين التقدم والإصلاح والإعادة. الوضع الموجه يعرض المقصد العربي، والتحدي يؤجله، والنتيجة تتبعها مهمة Transfer بلا خيارات. التحقق يمنع Cycle والسلسلة المزورة، ويحفظ `branchingConversationAttempts` Choice IDs/Outcome/Support count فقط دون نص حر أو AI أو ادعاء شريك حي أو mastery/CEFR. أضاف المسار Route إلى كل حزمة، فصارت 58/58/58/207/306 وCache v118. راجع ADR-065.

## 2026-09-11 — التراكيب تُختبر بالمقصد لا بتشابه الكلمات

`contextual-collocation-network-v1` يغلق P2-108 عبر 16 شبكة و48 وصلة أصلية متوازنة A1–B2. لا تُعرض كمرادفات: كل فعل يغير الإجراء والسياق والسجل. يجب استكشاف الروابط الثلاثة قبل اختبار ثلاثة مقاصد German-first، مع guided/challenge ثم Transfer. يحفظ `collocationNetworkAttempts` IDs والعدد فقط دون نص حر أو SRS تلقائي أو AI/mastery/CEFR. المسار الجديد رفع الحزم إلى 58/58/58/207/306 وCache v118. راجع ADR-066.

## 2026-09-12 — خصائص Seed/Shrink توسع الاختبار ولا ترخي الحدود

`deterministic-generative-properties-v1` يغلق P2-335 عبر Harness حتمي قابل لإعادة Seed مع Counterexample وShrink bounded. ثمانية اختبارات تنفذ 8,301 حالة للتطبيع والمقارنة وإدخال الحروف وMerge وCollocations ومسارات المحادثة وZod. اكتشاف `Straße→STRASSE` أدى إلى توثيق ß/ss strict، لا تعديل المحرك كي يوافق فرضية خاطئة. لا تدعي الخصائص برهانًا أو مراجعة بشرية. راجع ADR-067.

## 2026-09-12 — توثيق فقط يمكن أن يتخطى Vercel، والشك يبني

`vercel-docs-only-build-skip-v1` يغلق P2-310: ignoreCommand يتخطى فقط Markdown المؤلف في الجذر أو docs، بينما Runtime/package/public/tests/workflows/config وdocs/generated تبني دائمًا. Diff مفقود أو Path غير آمن أو Git error كلها fail-open إلى Build، وmain يبقى مفعّلًا. لا ادعاء بتطبيق الإعداد البعيد قبل Push. راجع ADR-068.

## 2026-09-12 — Release Candidate ليس Production
`pre-production-release-candidate-v1` يغلق P2-369: workflow يدوي يفحص الأسرار وcheck وE2E ويرفع Attestation مرتبطة بالـcommit، بلا أي خطوة نشر. الترقية فعل منفصل ولا ندعي Run بعيدًا قبل Push. راجع ADR-069.

## 2026-09-12 — مقارنة Offline قبل التحديث
`pre-update-curriculum-pack-diff-v2` يفصل curriculum/build/scope/route delta قبل التثبيت، بلا Diff دلالية أو تثبيت تلقائي. راجع ADR-070.

## 2026-09-12 — Terminal four-skill word confirmation and spaced pronunciation

`adaptive-four-skill-cycle-v2` replaces the in-memory modulo/self-report loop with level- and phrase-shaped writing goals, successful playback evidence, transient signal validation, ordered local ASR word confirmation, stable IndexedDB completion events, and terminal Vocabulary→Discover navigation. Selected SM-2 cards reuse the same all-words-confirmed interaction and can be deferred without false credit. Responsive reflow keeps mobile context visible and tests clipping/overlap across compact/default/large at 320/360/768. This remains expected-word matching, not phoneme/accent/fluency scoring. See ADR-071.

## 2026-09-12 — Zero-cost local review reminders

`local-review-reminder-v1` uses the actual due SM-2 queue, a learner-selected local time, IANA-zone quiet hours, and persisted once-per-day markers. In-app delivery is primary; Notification API is requested only by a direct Settings action and can notify only while the app is open. Denial or unsupported browsers retain the in-app path. There is no push, paid scheduler, background guarantee, mastery credit, or penalty. See ADR-072.

## 2026-09-12 — Single-source runtime curriculum identity

`src/config/curriculum-version.json` is now the authored version registry. `runtime:materialize` validates it and generates both the TypeScript runtime module and marked Service Worker constant during prepare/prebuild. Tests fail on drift. `pre-update-curriculum-pack-diff-v2` also treats old completed packs without a curriculum identity as an unknown curriculum update. See ADR-073.

## 2026-09-12 — Finite practice never wraps silently

Learner-visible “next” actions in finite Dictation, Branching, Collocation, and context-appropriateness rounds now reach the next task/level and a terminal destination; restart is explicit. Five-minute practice uses the real eligible SRS queue and cannot follow a stale aggregate counter into an empty Review page. Technical provider/content/task IDs are retained in state/export metadata but replaced by human labels in learning UI. See ADR-074.
