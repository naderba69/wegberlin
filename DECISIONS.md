# Architecture Decisions

Sync batch: v161 · 2026-09-23 · re-verified in full against pack `dwnb-full-pack-v161`.

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

## 2026-09-13 — Phoneme reference is authored-only; alignment ships uncalibrated

`german-phoneme-reference-v1` resolves a word only to human-authored IPA (the Arabic-learner contrast inventory plus each lesson's own `pronunciation.items`), keeps both readings when one spelling carries two authored stresses, and returns letter-level hints when nothing is authored. `german-phoneme-alignment-v1` implements the actual engine (Needleman–Wunsch over IPA tokens, deletion/substitution/vowel-length classes, accepted r-variants, same-attempt sentence rule, three states, `compositeScore: null`), but `phoneme-observation-policy-v1` keeps every readiness flag `false` behind a nine-step evidence ledger, because there is no pinned model revision, no ONNX/q8 artefact, no device measurement, no calibrated accept threshold, and no German-native or Arabic-learner trial. Wording stays "within engine limits"; a rule G2P transducer that measured 35/53 against authored IPA was deleted instead of shipped. See ADR-075.

## 2026-09-13 — Local grammar signals teach; Gemini answers only what is grounded and confirmed

`german-grammar-signals-v1` adds nine deterministic German rules to the Writing lab with `proven`/`probable` certainty, verbatim excerpts, German restatements, and an explicit unresolved channel (measured 9/9 learner cases, 0 `proven` false positives across 84 authored model answers). `writing-review-grounding-gate-v1` (`writing-review-contract-v2`) refuses remote notes that do not quote the sent text, rewrite the whole text, claim an official score/grade/CEFR/pass result in a finding or in the summary, mix exam brands, or hide open questions, and forces `needsHumanReview` when a high-confidence finding lacks a German rule or a drill. In Speaking, `speaking-confirmed-transcript-v1` requires the learner to confirm the local Whisper transcript before any send, re-asks when the text changed afterwards, and renders acoustic/linguistic/task as three lanes with no composite number. Audio is never part of a request. All new persistence fields are optional, so v1 exports still validate. See ADR-075.

## 2026-09-13 — Audit pass: inventory must cover the authored corpus, not an idealised one

A corpus scan over all 504 authored `pronunciation.items` (84 lessons) replaced three assumptions with measurements. The declared inventory lacked `ʏ` (29 uses — the short half of the priority `u/ü` contrast) and `tʃ` (7 uses), so both were added; `splitIpaIntoPhonemes` emitted a whitespace token for every multi-word IPA string, which is now dropped because the aligner is word-scoped by contract; and one truncated authored row carries a glide fragment (`i̯`), which the corpus test tolerates explicitly as a variant of a listed base rather than silently normalizing it into a new phoneme. The scan also found that the lesson-level phoneme lexicon is never wired into the repair-loop panel (3% coverage of authored word rows), which is recorded as an open defect in `PROJECT_STATUS.md`, not presented as done. `tests/unit/german-phoneme-corpus.test.ts` (6 tests) pins all of it: 941/941 across 144 files.

## 2026-09-13 — Audit fixes: wire the real lexicon, and honour guards that were computed and dropped

An audit pass over the shipped code replaced two of my own prior claims with measurements. (1) `PhonemeWordReference` was mounted without a lexicon argument, so lookups fell back to the 19-row inventory and covered 6 of the 207 authored curriculum word rows (3%): learners were told no authored reference exists for words the curriculum does transcribe. Instead of importing the 84 lesson modules into a client chunk, a generator (`npm run phoneme:lexicon:generate`, 15,178 bytes of `{de, ipa, source}` rows) feeds `curriculumPhonemeReferenceLexicon`; coverage is 207/207, and a unit test rebuilds the rows from the lesson data so the two cannot drift. (2) `german-grammar-signals.ts` computed `safeRestatement`/`safeInversion` and discarded them, so two word-order rules published a permutation as a complete fix even when the written verb form cannot belong to the written subject — the invention its own doc comment forbids. The gate is now real via `reorderIsComplete(verb, subject)`: `Wie Sie heißen?` keeps the reorder, `Heute ich arbeiten nicht.` keeps the diagnosis with `suggestionDe: null`. An unread `GLUED_SEPARABLE_FORMS` map was deleted, and `npm run lint` reports zero problems, which it did not before. 942/942 unit tests across 144 files; no readiness flag moved and no source-registry record added.

## 2026-09-13 — Behaviour tests exposed a semantics bug in `gradeableFindings`

Rendering the two surfaces we changed (instead of grepping their source) found a defect the previous batch created: `gradeableFindings` required `certainty === "proven" && Boolean(suggestionDe)`, so the conservative word-order gate made a *proven* diagnosis fall into the panel's "probable" group — withholding a fix silently downgraded the strength of the claim. `gradeableFindings` now tests certainty only; a missing suggestion is a missing fix, rendered as لا يقترح الفحص صيغة جاهزة, and never a weaker diagnosis. Same batch: `WRITING_REVIEW_PROMPT_VERSION` has one definition (`hybrid-review.ts` re-exports it from `core/ai/client`), the phoneme status line states that word stress is displayed and not compared, and `tests/unit/gated-surfaces-behavior.test.tsx` (4 tests) is the first behaviour test for the phoneme reference and the grammar panel: 946/946 across 145 files.

## 2026-09-13 — The review contract flows structurally into its own gate

`client.ts` called `evaluateWritingReviewGate` with a `Parameters<typeof ...>[0]` escape-hatch cast in two places, which meant the validated Gemini payload and the shape the gate inspects could diverge silently while the cast kept compiling. The gate input is now `readonly ReviewIssueCandidate[]` with `suggestionDe: string | null`, so the zod-inferred payload is assignable as itself and both casts are gone (measured: `as unknown as` in `src/core/ai/client.ts` = 0). The whole-text-rewrite detector takes a null-safe local and treats a withheld fix as “no rewrite” rather than reading the string `null`. `tsc`, `eslint`, and the 22 grounding/hybrid tests are green, then the full suite and the mobile browser project.

## 2026-09-13 — One owner for the word-repair microphone lifecycle

The record-then-review state machine inside `LocalWordRepairPractice` (stream acquisition, bounded timer, chunk accumulation, blob, object-URL revocation, track stop, unmount cleanup) was moved verbatim into `src/components/use-speaking-recorder.ts` as `useWordRepairRecording()`. The view keeps only `analyze()` and `retry()`, so the file that touches `navigator.mediaDevices` no longer also decides what a whisper transcript means. The hook is a `.ts` module with no JSX, which is also why `npm run language:audit` had to be rewritten: the regex tag counter reads generic-argument angle brackets inside `.tsx`, so moving `useRef<MediaRecorder | null>` and two `type` imports out of the component changed `openingTagCount` from 6,959 to 6,953 with every other counter identical (178 files / 397 German / 41 technical scopes / 10 adaptive / 233 mixed static / 0 issues). Pins were synced in `verify-continuation-handoff.mjs`, `tests/unit/language-boundary.test.ts`, and ADR-019. `npm run check` = 0 (948/948 across 145 files, 309/309 pages, budgets intact) and both browser projects pass: 41 chromium + 41 mobile-chromium. `speaking-lab.tsx` keeps its own, longer recorder (it interleaves a response countdown and lane persistence); sharing the hook there is deliberately not attempted in this batch.

## 2026-09-14 — External-evaluator bridge: the human the app is not, kept out of the app's claims

The readiness audit answered “production-ready, and can it be the only official teacher for B2?” with: usable as a personal production tool within its documented limits, and no as a sole official teacher — measured: 0 of 3,020 content records have completed independent human review (all `automated-validated-independent-review-pending`), B2 carries 12 lessons and 12 writing models against 24/24 for A1/A2/B1, pronunciation assessment has zero calibrated evidence steps, audio is synthetic, and browser coverage is Chromium-only. The first remedy is a bridge rather than a claim: `src/core/assessment/external-evaluator-packet.ts` builds a paste-ready packet (learner text, learner-pasted task criteria, and the local engine's own signal/unresolved counts quoted rather than summarised) and reads a reply back as statements attributed to `external-human-arranged-by-learner`, with `canCertifyExamReadiness: false`, `canCountTowardLevelGate: false`, `appVerifiedTheFeedback: false`, an excerpt the app cannot locate flagged `unconfirmableExcerpts` instead of arguing with the reviewer, and pass/score/certificate/CEFR-assignment phrasing refused in German and Arabic. It is deliberately not mounted or persisted yet, and `PROJECT_STATUS.md` says so. Two prior claims were falsified while doing this and are recorded as absent, not present: the task-criteria engine (`GRADEABLE_CRITERIA`, `validateWritingTask`) and the official-exam-format verifier script. 957/957 tests across 146 files, `tsc` and `eslint` clean.

## 2026-09-14 — The evaluator bridge is mounted, persisted, and still cannot grade

`ExternalEvaluatorBridge` now sits under the reviewed text in `/writing`: criteria the learner pastes, the packet preview, a copy action, and an import box that stores the reply in `externalEvaluatorNotes`. The field is `.optional()` in `src/core/portability/schema.ts` so every pre-existing record still parses, and its three capability flags are `z.literal(false)` - a future change cannot quietly turn stored human advice into an app verdict. `tests/unit/external-evaluator-persistence.test.ts` (5 tests) proves old-record validity, round-trip, refusal of tampered flags, size bounds, and that nothing named like a level gate reads it. Two honest disclosures from doing it: the audit pins had to move with the new component (`178→179` TSX files, `6953→6990` tags, `397→399` German, `41→45` technical scopes, 0 issues), and this collection is not merged across devices by `merge.ts` - the same limitation `writingAIReviews` already has. App size moved by 3,406 gzip bytes; `npm run check` = 0 with 962/962 across 147 files, and both browser projects pass (41 + 41). No level gate, readiness flag, or exam claim moved.

## 2026-09-14 — Merge support for imported human review, and a correction to yesterday's limitation

`mergeLearningStates` now unions `externalEvaluatorNotes` by id (incoming snapshot wins a duplicate id) and a `tests/unit/merge.test.ts` pair proves both that records predating the field still merge and that a same-id reply is never duplicated. In the previous batch I documented, as a measured limitation, that neither collection is merged by `merge.ts` because a line-limited grep found no `writingAIReviews` there. That grep was truncated and the claim was false: `writingAIReviews` was already merged. The correction matters because it changed the fix - the only missing kind was `externalEvaluatorNotes`, now added - and because a limitation stated in the status file is a claim a reader may rely on. E2E coverage for the bridge went into the existing writing test rather than a new one, keeping the browser suite at 41 per project (82 total) while asserting the packet, the refusal of a `bestanden` line, and the stored reviewer label.

## 2026-09-14 — Pinned official snapshots, not a live crawler, decide whether our exam structure is right

Yesterday's guard only stops the app from *claiming* an official or unchanged exam format; it deliberately said nothing about whether the numbers in `src/data/exam-profiles.ts` are correct. That gap is now closed with `src/config/exam-format-evidence.json` and `scripts/verify-official-exam-formats.ts`: each structural fact the app teaches (module count, parts per skill, minutes, item counts, points, pass mark) is pinned to a verbatim excerpt that was collected by hand from the official document on a recorded date, hashed with sha256, and re-tested with one regex per fact. `--check` (in `prebuild`) needs no network: it proves the app agrees with the snapshot and that the snapshot is self-consistent, and it refuses an excerpt that was edited without re-hashing. `--live` re-fetches and re-tests the same patterns, and a failed fetch is an explicit failure — a 200 response would still not prove the format is unchanged, so live mode stays out of the build and out of any readiness claim.

Deliberate choice: gaps are declared, not hidden. Every field of a `status: "verified"` profile must either have a pinned fact or appear in `openFacts`; the current snapshot therefore lists three open items (telc's 225/75 point split and 135/45 thresholds are not on the overview page we fetched, telc's shared 90-minute Sprachbausteine block has no separate stated duration, and Goethe's 30 listening items are not in our hoeren description) instead of pretending full coverage. `excerptNoteAr` records exactly how each excerpt was transcribed (line-wrap normalisation, markdown emphasis stripped, nothing reworded), because a quotation that was "cleaned up" is no evidence of anything.

## 2026-09-14 — Agreement from third-party sites is corroboration, never evidence

The last structural gap in `exam-format-evidence.json` was telc's point split (225 written / 75 oral, pass 135 / 45 at 60% per block). A search returned five third-party pages — language schools and blogs — that all state exactly what `src/data/exam-profiles.ts` states, so the app's numbers look right. They were still **not** pinned: the verifier only accepts snapshots whose host is the publisher's official domain, and a language school's FAQ is not telc. What telc itself does publish is out of reach from here for measured reasons, and those reasons are now recorded inside the gap (`whyAr`): the current telc B2 overview page lists parts and durations only, the `Handbuch Deutsch B2` section that specifies the scoring starts on page 33 while the available PDF reader parses 30 pages, and the official mock exam ships as a ZIP. So the gap stays declared with a concrete closing route instead of being closed by the nearest convenient citation.

Second lesson from the same batch: promoting the Goethe listening item count from an informational note to a cross-checked fact failed at first because the profile's Arabic note spelled the number as a word (`ثلاثون عنصرًا`) while the checker compares digits. The note now reads `30 عنصرًا…`, matching how the reading module already states it. A verification rule that silently accepts prose the checker cannot read is not verification — the rule decided the data format here, not the other way round.

## 2026-09-14 — Growing the curriculum is a pipeline, not a paste: b2-13 and the counters it broke

`b2-13` was added as a full lesson (14 stages, 19 anchor nouns, one verb-preposition frame, synthetic listening audio). Doing it exposed four hard-coded totals that were really derived facts, and they were fixed at the source instead of being re-pinned by hand:

- `curriculum.ts` numbered lessons as `moduleIndex * module.lessons.length + index`, which is only correct while every module has the same size. Putting a third lesson in a module would have re-labelled `b2-03`…`b2-12` and collided with the content ids. The numbering is now a cumulative counter, and "published" comes from `publishedLessonLocalOrder` rather than `localOrder <= 12`.
- `learning-architecture.ts` required exactly 84 listening-gist rows; it now uses the lesson list length. `lexicalGrammarCoverage` claimed `lessons: 12` for B2 and now counts distinct lesson ids in the anchor rows. `delivery-health.ts` compared against literals 84/84/260 and now derives from `academicLessonList.length`. `journey-state.ts` required `upperCompleted === 36` (24 B1 + 12 B2), so a learner who finished *every* B2 lesson would have been stuck in `growth` forever; the total is now derived from the curriculum.
- The lesson-audio manifest generator hard-coded `totalLessonCount: 84` and never emitted the Opus fields the verifier requires, so regenerating it would have silently destroyed Opus provenance. It now derives the count and writes mp3+Opus sizes/hashes from the files on disk; regenerating it reproduced the 84 existing assets byte-for-byte, which is the check that the rewrite was faithful. Recording provenance is per batch: `voiceProfile`/`generatedAt` come from an explicit table for new lessons and are reused from the previous manifest otherwise, so the 2026-08-30 corpus is never back-dated onto a file recorded today.

The governance ledger also caught a genuine quality requirement: `buildLexicalTargetGapAudit` flags any noun in a lesson that carries target weight but has no anchor row. b2-13 initially produced **15 pending-human noun rows**; the lesson now anchors all of them (19 noun entries). That is the intended direction — new content must state its grammatical anchors rather than slip past the audit — and the count that the handoff verifier pins moved with it.

Limits of this batch, stated plainly: B2 is 13 of 24 lessons (11 still missing, along with their writing models); the new lesson's 21+ governed records are `automated-validated-independent-review-pending` like every other record; its audio is synthetic single-speaker and not exam-grade; and no readiness flag, P0/P1/P2 state, or source-registry entry was changed because a lesson was added.

## 2026-09-15 — b2-14: two of the "pins" that broke were live bugs, and one guard was kept on purpose

The second B2 expansion lesson (`b2-14`, Kohäsion im langen Text) landed with 4 objectives, 18 phrases, 3 theory blocks, 7 exercises across all five types, a 181-word reading with a 6-item glossary and 3 questions, a 1123-character listening transcript with 3 questions, 5 Mini-Test items, 10 cards, 4 common errors, 14 noun anchors and 2 verb-preposition frames, plus a freshly synthesised MP3/Ogg-Opus pair. Content SHA-256 moved to `38831533b992…`; governed records 3041 → 3062; Zod roots 3796 → 3838; answers 2620 closed + 354 productive; objectives 344/344; question-taxonomy rows 516; pages 310 → 311; Offline routes 307 → 308 (B2 pack 208 → 209); physical audio 522 → 524 files (262 MP3 + 262 Opus).

Three findings matter more than the arithmetic.

**The Offline route registry was a hand-written count of lessons.** `scripts/generate-offline-manifest.mjs` carried `["a1",24,8],["a2",24,8],["b1",24,8],["b2",13,6]`, and every pack's route list was generated from those literals. Adding a lesson therefore produced a published lesson that no Offline pack contained — a silent functional gap, not a stale number, and the previous batches only "fixed" it by editing the literal. The script is now `scripts/generate-offline-manifest.ts`, run under `tsx`, and derives both the lesson count and the module count per level from `curriculum` filtered to `status === "published"`. Regenerating it reproduced the previous 307 routes exactly and added `/lernen/b2-14` and nothing else, which is the evidence that the derivation is equivalent, not merely plausible. `tests/unit/lesson-audio-assets.test.ts` had the same disease in test form — a hand-built id ladder — so it could never have caught a missing lesson; it now reads `publishedLessonLocalOrder`.

**The governance record count stays a literal on purpose.** `GOVERNED_CONTENT_RECORD_COUNT` in `src/config/content-governance-registry.ts` is the one total that is deliberately *not* derived: it exists so that adding content has to be an act someone performed. It was raised 3_041 → 3_062 rather than deleted, and the meaning-first case audit was satisfied by authoring the 18th contract for `b2-14` (meaning → role → form, semantic question free of case terminology, form step naming `auf + Akkusativ` / `in + Dativ`) instead of removing the case vocabulary from the theory block that triggered it.

**Duplicate object keys are a real risk in a file that only tsc reads.** The lexical registry keeps one frame per lesson in `frameSeeds` and extras in `additionalFrameSeeds`; a single edit that pasted both `sich beziehen auf` and `zurückverweisen auf` into `frameSeeds` was legal JavaScript, invisible to every content audit, and only stopped `npm run build` with `TS1117`. The same file also lost an English fragment (`Prefix`) inside an Arabic contrast note, and the governance-adjacent integrity test caught a glossary entry (`Genitivkette`) that the reading text never contained — so the text now contains it, and the B2 final-bank assertion `toHaveLength(moduleNumber===6?12:8)` became `lessons.length*4` per module so an added lesson cannot be silently excluded from the exam bank.

Not claimed by this batch: B2 is still 14 of 24 lessons with their writing models unwritten; all 3062 governed records remain `automated-validated-independent-review-pending` with 0 completed human reviews; the audio remains synthetic single-speaker and not exam audio; `dwnb-full-pack-v120` is cache bookkeeping for changed pack contents, not a certification; and nothing was pushed to GitHub or Vercel.

## 2026-09-15 — b2-15: the pipeline that was built last batch caught nothing, and the audit caught seven things

The third B2 lesson in two days (`b2-15`, Zeitplan unter Druck) landed with 4 objectives, 18 phrases, 3 theory blocks, 7 exercises over all five types, a 231-word reading with a 6-item glossary, a 1155-character listening transcript, 5 Mini-Test items, 10 cards, 4 errors, 6 pronunciation items and a 199-word writing model that stays inside the 170–200 window its own prompt declares. Governed records 3062 → 3083, Zod roots 3838 → 3893, closed answers 2620 → 2638 with 354 → 357 productive tasks, objectives 344 → 348, question-taxonomy rows 516 → 522, noun anchors 1077 → 1098, verb frames 107 → 115, pages 311 → 312, Offline routes 308 → 309 (B2 pack 209 → 210), audio 524 → 526 files (263 MP3 + 263 Opus), content SHA-256 `4272e38e9210…`, pack cache `dwnb-full-pack-v121`.

What this batch proves about the previous one: the Offline route generator now derives lesson and module counts from the curriculum, and adding a lesson required **no edit** to it — `/lernen/b2-15` appeared in the B2 and full packs on its own, with A1/A2/B1 counts untouched. The derived writing model test (`publishedLessonLocalOrder`) likewise needed no change.

What still catches authored content, and should: `buildLexicalTargetGapAudit` flagged **7 verb-preposition frames** harvested from my own Redemittel (`ablesen an`, `nutzen für`, `offenhalten für`, `schreiben an`, `stellen auf`, `zerlegen in`, `verzichten auf`). They were anchored in the registry rather than exempted, which also means the lesson now states the government of every chunk it teaches. The phoneme corpus gate rejected `[ˈnaːχdeːm]` because `χ` has no inventory row — the repo writes that sound `x`, and the fix was to the transcript, not to the gate.

A correction to yesterday's batch is recorded here rather than hidden: four Arabic strings in `b2-14` had leaked mixed-language fragments («Grammar», `ohneRelation`, `ثلاثGenitive`, `maskulin`). Repairing them removed the Latin case token from one exercise's explanation, so the case-signal counter moved 28 → 27 while the meaning→role→form contract still owns that exercise; the audit stays green because ownership is allowed to exceed detection, not because a detector was loosened.

Not claimed: B2 is 15 of 24; all 3083 governed records remain review-pending with 0 independent human reviews; the new audio is synthetic single-speaker and not exam audio; `dwnb-full-pack-v121` is cache bookkeeping for changed pack content; nothing was pushed to GitHub or Vercel; and no P0/P1/P2 row, readiness flag, or source-registry record was touched by this batch.

## 2026-09-15 — b2-16: authoring against the audit's own definitions, and re-recording audio because the text moved

The fourth B2 lesson of the two-day run (`b2-16`, Nachlese ohne Anklage) covers what no earlier lesson does: the past counterfactual (`hätte/wäre + Partizip II`, including `wäre`-selection and verb-final double infinitives with modals), `als ob/als wenn` as a way to report an impression without asserting it, and hedged self-critique that keeps responsibility. Governed records 3083 → 3104, Zod roots 3893 → 3942, closed answers 2638 → 2656 with 357 → 360 productive tasks, objectives 348 → 352, taxonomy rows 522 → 528 (264 reading + 264 listening), noun anchors 1098 → 1117, verb frames 115 → 119, pages 312 → 313, Offline routes 309 → 310 (B2 pack 211), audio 526 → 528 files (264 MP3 + 264 Opus), content SHA-256 `7b74da78ce1f…`, pack cache `dwnb-full-pack-v122`.

Three deliberate method choices, all of which produced real findings rather than green-by-default numbers.

**Topic selection was made by proving absence, not by taste.** Before designing anything, the B1/B2 title and theory lists were read out, which killed two candidate topics: indirect speech/`Konjunktiv I` is already `b2-04`'s media-criticism lesson, and present-tense `Konjunktiv II` for advice exists at `b1-02`, `b1-05`, `b1-20`. Greps for `irreal`, `Konjunktiv II der Vergangenheit`, `Passiversatz` and `sein zu` returned nothing, so the past counterfactual + `als ob` slot is genuinely empty rather than merely unwritten.

**The lexical target list was computed from the lesson, not guessed.** `extractArticleMarkedNouns` over `phrases[].de`, `flashcards[].frontDe` and the glossary returned 19 nouns, so those 19 were anchored. The same audit then flagged two *phantom* frames manufactured by my own comma-joined phrasings — `anzuklagen` paired with the `auf` belonging to the previous clause, and `benennen` paired with the `zu` of a following infinitive group. Both were fixed by rewording the phrase into one clause; no frame was exempted and the detector was untouched. Two phrases were reworded for the same reason (`zur Abschwächung nutzen`, `aus der Nachlese einen Auftrag machen`) so the lesson teaches no chunk whose government the registry does not state.

**Synthesised audio is a derived artefact and was regenerated when the text moved.** The first take was produced from the pre-review transcript (it still contained `der Mann habe keine Ahnung`); after the text was corrected, the mp3/opus pair was re-synthesised from the final `transcriptDe` so the recording and the shown transcript match, and only then was the manifest rewritten (88 assets, per-day provenance `2026-09-15`).

The pin cascade for one lesson now spans 36 files (21 test files, the handoff verifier, sw.js, README, PROJECT_STATUS, the continuation prompt, six ADRs, three offline tests and the E2E spec) and still fails one number at a time; the two values that could not be derived ahead of time (lesson-question total 968, content-reference count 398) came from the tests' own messages. B2 remains 16 of 24, all 3104 records remain review-pending, and nothing was pushed to GitHub or Vercel.

## 2026-09-15 — telc point distribution: the gap was a tooling limit, and it was closed on the primary host

`src/config/exam-format-evidence.json` had declared `telc-b2-point-distribution` open because the only available fetcher parsed 30 pages of a PDF and the current telc.net overview page lists parts and durations but no scores. This batch replaced that reasoning: the official archive linked from the live telc B2 page (`/fileadmin/user_upload/mock_exams/Deutsch/telc_deutsch_b2.zip`) was downloaded from telc.net and its inner `telc_deutsch_b2_uebungstest_1.pdf` (56 pages) was text-extracted with pypdf, so pages 47–48 could be read directly.

Seven facts were pinned against a 1,217-character verbatim excerpt (sha256 `fe6084f379bb819d…`) of that official document, which carries the edition marker «© telc gGmbH, Frankfurt a. M., telc Deutsch B2, 2019 … telc Deutsch B2, Übungstest 1»: two `passMark` facts (135 written / 45 oral, which the verifier cross-checks against the profile's own Arabic passing rule), and five informational facts (`Teilergebnis I 225 75 %`, `Teilergebnis II 75 25 %`, `Gesamtpunktzahl 300 100 %`, `Sprachbausteine … 15 15 30 10 %`, and the grade bands 270–300 sehr gut … 0–179,5 nicht bestanden). The table row text is stored exactly as the text layer emitted it — including the split cell `11–2 0` — and `excerptNoteAr` says so, because silently re-flowing a table into a prettier shape would be authoring evidence rather than quoting it. Verification now reads: 2 profiles, 3 snapshots, 35 pinned facts (24 cross-checked), 0 evidence issues, 0 mismatches, 2 declared gaps, fingerprint `1e61862c8a97`; only `crossCheckedFactCount` moved in the tests (22 → 24), and the governed content SHA stayed `7b74da78ce1f…` because the evidence file is audit input, not app content.

Two refusals belong on the record. First, `allowedHostSuffixes` was **not** widened: third-party mirrors (a language-school site and a downloads mirror) served the same document with the numbers, and a `dsh-germany.com` or `sprachzertifikate-duesseldorf.de` source would have made the guard's "official host" rule decorative; adding the mirror host would have been the cheapest green and the most dishonest one. Second, `telc-b2-point-distribution` remains an open fact — narrowed, not deleted. What is now missing is not the numbers but their **currency**: telc's 2026 page publishes parts and minutes, not a dated score table, so a 2019-linked mock cannot prove the distribution is unchanged today. Closing it needs a telc-dated 2026 score table, a written confirmation from a licensed centre, or the human review that is queued for the whole project; and HTTP 200 on a page that does not mention a change is explicitly not evidence.
## 2026-09-16 — b2-17 keeps the passive-replacement lesson functional, not stylistic

The topic was chosen by proving absence: greps over every `lessons-*/theory` title show `Passiversatz`, `sein zu`, and `-bar` appear nowhere, and `b2-06` only uses `Die beiden Größen lassen sich nicht gleichsetzen` as one example inside a nominal-style block. Authoring a lesson about *choosing* between the three replacement forms — and what each choice makes unsayable — was therefore a real gap, not a duplicate.

The lesson deliberately never names a grammatical case in `theory`, `exercises`, or `miniTest`. That keeps it outside the 18 meaning-first case contracts (the detector scans exactly those three stage collections), and the case audit stayed at 18 contracts / 22 theory references / 55 controlled / 42 assessment with no new contract and no silenced detector.

Two gates caught real defects before any number was written down. `answer-integrity` failed `b2-17-e4` because the error-correction prompt contained the accepted answer verbatim (`Das Problem lässt sich nicht lösen` inside `Das Problem lässt sich nicht lösen werden.`); the distractor was rewritten to `gelöst werden` instead of exempting the pair. `similarity:audit` failed `b2-17-lq1 ↔ b2-16-lq1` because both reuse the stock gist opener; the new question was reworded to a content-specific global question rather than adding an exemption entry — gist status comes from being the first listening question (positional contract), so the rewrite does not weaken the listening sequence rule.

The lexical target list was again computed, not guessed: `extractArticleMarkedNouns` over `phrases[].de`, `flashcards[].frontDe` and `reading.glossary[].lemma` returned 25 nouns, and the audit's own run later added `Lesbarkeit` and `Ultimatum` because reading-glossary lemmas count as authored targets. All 26 nouns plus two frames (`sich berufen auf`, `übersetzen in`) were anchored until `content:audit:write` printed 0 noun + 0 verb-frame candidates pending human review. Audio was synthesized once, from the final `transcriptDe` after every text fix, and is labelled single-speaker synthetic with `humanRecordedAssetCount: 0`.

Unchanged after this batch: 0 of 9 phoneme-evidence steps, 0 independent human reviews of 3,125 governed records, and no publication push. B2 stands at 17 of 24 lessons; eight lessons and their writing models remain, and the verdict is unchanged — this build is a personal production self-study tool inside its documented limits, not a sole official teacher for exam readiness.

## 2026-09-16 — b2-18 records two structural frame exclusions instead of inventing case government

`Funktionsverbgefüge` was proven absent the same way as the previous batch: `Funktionsverbgefüge`, `Nomen-Verb-Verbindung`, `zur Verfügung stellen` and `in Betracht ziehen` return 0 hits across every `lessons-*.ts`, while `Pronominaladverbien` — the other candidate — is already taught in `b1-24`, so it was dropped as a duplicate. The lesson is built around the one thing the light-verb construction does that a plain verb cannot: it keeps the result countable and the agent visible, which is exactly what the previous lesson (`b2-17`) removes with `sein + zu`.

The interesting decision is about the audit, not the content. The lexical gap detector extracted four verb+preposition pairs from the authored vocabulary: `nehmen|auf`, `richten|an`, `ziehen|in`, `kommen|in`. The first two are real government and were anchored as frames with their actual case. The last two are not: `in Betracht`/`in Frage` are fixed adverbials whose preposition survives a change of light verb (`in Betracht ziehen`, `das kommt nicht in Betracht`, `etwas in Frage stellen`), and the noun carries no article, so no case is observable at all. The schema only allows `accusative` or `dative`, so the tempting move was to write `accusative` and move on. That was refused: writing a case the phrase never shows would have taught a rule that does not exist, and loosening the audit or exempting the pair silently would have hidden the gap. Instead two versioned structural exclusion decisions (`locative-adjunct`, `lexical-frame-exclusions-v1`) were recorded with the alternation argument in the explanation, each stamped `authored-review-pending`. The registry now holds 8 such decisions, all still awaiting independent review — that count is asserted, not smoothed over.

Everything else followed the standing cascade: 19 nouns anchored from the computed target list, 0 pending candidates, 0 answer leaks (the error-correction items avoid answers embedded verbatim in their prompts), the lesson names no grammatical case anywhere in `theory`/`exercises`/`miniTest`, so the meaning-first case detector stayed silent and no 19th contract was created. The listening audio was synthesised from the final transcript text (byte-identical to `transcriptDe`, 1,223 characters, 78,432 ms, single speaker, labelled `Arena.ai speech synthesis`) and Opus-encoded at 24 kbps/48 kHz mono like the rest of the corpus.

Unchanged after this batch: 0 of 9 phoneme-evidence steps, 0 independent human reviews of 3,146 governed records, and no publication push. B2 stands at 18 of 24 lessons; six lessons and their writing models remain, and the verdict is unchanged — a personal production self-study tool inside its documented limits, not a sole official teacher for exam readiness.


## 2026-09-16 — `b2-19` instead of a second-best topic, and no nineteenth case contract

The candidate list for the next B2 lesson contained three ideas; two were rejected before writing, and the rejection is the decision worth keeping. `Pronominaladverbien` (dafür/worüber) had already been taught in `b1-24`, and the two-part connectors were partially covered, so a new lesson on either would have produced structural duplication that the similarity audit would not catch (it compares wording, not syllabus ownership). Grepping `src/data/lessons-*.ts` for `Abtönung`, `Fokuspartikel`, and `Gradpartikel` returned zero hits, so modal particles became the topic: a closed class of short words that carries stance, which is exactly what a B2 learner must produce in the `Stellungnahme` and in the Sprechen Teil 2.

The lesson deliberately names no grammatical case anywhere in theory, exercises, or Mini-Test. That keeps `meaning-first-case-v1` at 18 contracts / 22 theory blocks / 55 controlled exercises / 42 assessment items with 0 gaps, and avoids a nineteenth contract whose owned signals would be thin. Passive (`b2-17`) and Funktionsverbgefüge (`b2-18`) made the same choice for the same reason: an explicit case contract must be owned end-to-end or not opened at all.

Two extraction details were handled by the recorded rules rather than by loosening them. `extractArticleMarkedNouns` derived `die Akten` — a plural-only surface form whose lemma would have had to be invented — so the phrase was reworded to `die Akte`; the alternative (seeding a false lemma) would have taught the registry a noun no learner sees. And the governance record-count pin failed the audit with an explicit mismatch (3,146 expected / 3,167 actual) instead of silently absorbing a new lesson, so `GOVERNED_CONTENT_RECORD_COUNT` moved to 3,167 as a data bump, never as a rule change.

Unchanged after this batch: 0 of 9 phoneme-evidence steps, 0 independent human reviews of 3,167 governed records, 8 structural frame exclusions still awaiting independent German confirmation, and no publication push. B2 stands at 19 of 24 lessons; five lessons and their writing models remain.


## 2026-09-17 — raise the audio ceiling instead of re-encoding, and the four lessons that close B2

The batch that publishes `b2-21`…`b2-24` (96 of 96 scheduled lessons) hit the media budget before it
hit the test suite: 92 shipped lesson files at 32 kb/s MP3 plus their Opus twins put the physical audio at
52,882,954 bytes against a 60 MB ceiling (that first measurement covered the audio as it was synthesised before a workspace-snapshot rollback dropped the four new pairs; they were regenerated with the same recorded recipe and now total 52,943,843 bytes) with a 15 % reserve, i.e. 50,580,847 usable bytes. Two options were
real. Re-encoding all 92 already-delivered files at 24 kb/s would have returned roughly 7 MB and would have
silently changed 92 audio artifacts whose SHA-256 values are committed in `public/audio/lessons/manifest.json`.
Raising the ceiling costs nothing on disk and keeps every shipped byte verifiable. The owner chose the ceiling:
ADR-077 (2026-09-17) raises `totalAudioBytes` again to 70,000,000 on the owner's explicit decision so the measured listening-length gap can be closed: safety ceiling is now 59,500,000 against 52,943,843 measured, i.e. 6,556,157 bytes of headroom (+23.3% of lesson audio), and a full B2 extension to ~230 words (~9.2 MB) still needs 20 kb/s Opus for regenerated files or a shorter scope. Pack ceilings are unchanged because they already have room (b2 pack 20,011,179 of 32,300,000 safety). A separate decision this batch: `scripts/generate-lesson-quality-audit.ts` (`lesson:quality`, `lesson:quality:audit`) measures item-position fairness, longest-option cue, model-answer range compliance, accepted-answer breadth, feedback length, objective traceability, listening span and pronunciation coverage; strict mode currently exits 1 with 7 documented issues, so it is deliberately NOT wired into `npm run check` until the data is fixed (red-gate-then-disable is the failure mode being avoided). `scripts/generate-human-review-packet.ts` (`review:packet`) exports all 3,277 governed records with their text into 17 CSV review sheets plus a 24-row B2 checklist, with decision columns left empty on purpose. Findings doc: `docs/LESSON-QUALITY-FINDINGS-2026-09-17.md`; registered as P1-397/398/399 and P2-400/401. The exact-match grading policy (explicit orthographic variants only) is tested at `tests/unit/content-integrity.test.ts:77-78` but undocumented, so the fix is more `acceptedAnswers` in data plus an ADR, not comparator relaxation.

`scripts/audit-media-pack-budgets.mjs` previously allowed 63,000,000 bytes for lesson audio, documented in
`docs/adr/ADR-076-lesson-audio-media-budget-raise.md` together with the re-encode arithmetic, so the alternative
stays on the table for whoever wants it back. Result after the change and after the audio regeneration: 52,943,843 / 53,550,000 — a
real 606,157-byte margin, not a padded one.

Three other decisions were forced by the guards, and in each case the guard was kept and the content fixed.
`b2-23` names the Genitiv explicitly in theory and assessment, so `meaning-first-case-v1` demanded an owner:
a 19th contract was added to `src/data/case-teaching-registry.ts` instead of paraphrasing the word away. The
verb-frame validator rejected `vom`, so `b2-22` now carries the preposition as its own word in both `chunkDe`
and `exampleDe` (`von einer Fassung abweichen`). Two `b2-24` punctuation-correction items failed
`answer-integrity` because the normalizer strips commas, making prompt and answer identical and the item
ungradeable; the items were rewritten so a word changes.

The pack cache names in `public/sw.js` are hand-maintained, and four new lesson routes plus eight new audio
files are a content change a returning learner must not keep stale, so the cache moved `dwnb-full-pack-v122` →
`v123` (staging/previous to `v122`) in the worker, its five pinning tests, the E2E spec, and the handoff
verifier together.

Unchanged after this batch: 0 independent human reviews of 3,277 governed records; 89 noun candidates and
4 verb-frame candidates left *pending* on purpose, with 8 structural exclusions still unconfirmed; 0 of 9
phoneme-evidence steps; synthetic TTS only (0 of 96 lesson clips are human recordings); and no Git push or
hosting action from this sandbox. P0-98, P0-99 and P1-380 remain partial — completing the lesson count is not
a review.
### 2026-09-18 — دفعة B1 الثالثة: إغلاق مستوى كامل بالقياس (72 شرحًا هذا اليوم)

أُعيد تأليف 72 شرحًا في تمارين B1 بأربع دفعات مقاسة (24 ثم 12 ثم 12 ثم 24)، فنزل `allUnder60Chars` من 1,518 إلى 1,446 وأكمل **B1 عند 168/168**.
القرار: النطاق 156–212 حرفًا حدٌّ تحريري يُعاد قياسه بعد التطبيق لا قبله؛ والحارس المواقعي (`rebalance-answer-positions.ts:21`) يرفض «الأخير/الأول» داخل الشرح ولو بلغ الطول —
`b1-20-e3` اصطدم به وقُصّ إلى 179 حرفًا. وملاحظة بنية: حذف اسم حالة إعرابية من شرح يحرّك `discoveredSignals.controlled` (26 → 24 هنا)، فيُعاد تثبيت الاختبار المعني ولا يُرخَّ المُدقِّق.
البوابات على البناء الجديد: `tsc` 0 · vitest 150/985 · lint 0 · `handoff:check` 0 · بناء 321/321 · بصمة Offline `c79a2e90cefb` · بصمة المحتوى `d6093844630a…`.
المتصفح: 6/6 في 1.3 دقيقة، واختبار الحزمة الكاملة نجح منفردًا في 32.9 ثانية؛ تعثّر أوليّ سببه خادم يتيم على 3100 لا المحتوى. مجموعة الـ82 اختبارًا الكاملة لم تُشغَّل لهذا الكاش.
### 2026-09-19 — دفعة B2 الأولى (76 شرحًا) وإصلاح `js:budget` بالهندسة لا بالسياسة

76 شرحًا في تمارين B2 (24 ثم 24 ثم 28) أكملت **B2 عند 173/173** وأنزلت `allUnder60Chars` من 1,446 إلى 1,370. لمسار الشروحات قاعدة مكتسبة ثانية: نمو المحتوى يصبّ في مقطع جافاسكربت واحد، وقد يبلغ سقف ADR-049 الاحتياطي؛ الحدّ الذي فشل كان 642,417 مقابل 637,500.
القرار: لا تُرخى السياسة. قُسِّمت بيانات المنهج لكل مستوى في `next.config.ts` (cacheGroups بـ`enforce: true`) فأصبح أقصى مقطع 243,237، وأُضيف `tests/unit/curriculum-chunk-split.test.ts` يمنع إعادة الدمج أو تليين `scripts/audit-js-budgets.mjs`. الأثر الجانبي المقاس: حِزم Offline زادت من 5,532,239 إلى 5,590,306 gzip لأربعة مقاطع إضافية في مراجع HTML، وما زالت داخل السقف.
انزياح متحقَّق: `discoveredSignals.controlled` نزل 24 → 23 لأن `b2-09-e4` كفّ تسمية الحالة؛ رُفِع التثبيت في اختبار العقد فقط. البوابات: `tsc` 0 · vitest 151/988 · lint 0 · `handoff:check` 0 · بناء 321/321 · بصمة Offline `65b2e7277c28` · بصمة المحتوى `9aeac5e56499…` · الكاش v131.

### 2026-09-19 — دفعة A2 الأولى (48 شرحًا) — القاعدة نفسها تعمل خارج B1/B2

48 شرحًا في تمارين A2 على دفعتين (24 ثم 24) أنزلت `allUnder60Chars` من 1,370 إلى **1,322**، و`under40Chars` من 1,062 إلى 1,047، ورفعت الوسيط 27 → 28. مستوى A2 صار عند **48/168** (المتبقي 120، ثم A1 عند 167). السجل الكامل في `docs/LESSON-QUALITY-FINDINGS-2026-09-17.md` §1h و`docs/run-logs/2026-09-19-a2-explanations-1/`.

القرار: مستوى A2 يُكتب بسجلّ أبسط من B2 — بناء واحد مسمّى، مقابل واحد للشكل الخاطئ، ولا مصطلح نحوي غير الكلمة التي يستعملها التمرين نفسه. لا يُرخى أي حارس من أجل «هذا مستوى مبتدئين»: حارس المواضع رُفضت لأجله أربعة نصوص (كلمتا «الأولى» و«الطرف الثاني» تحويان «الأول/الثاني» كسلسلة فرعية) فُعدت الصياغة، والنطاق 156–212 بقي حدًّا قياسيًا بعد التطبيق فنُصّر نصّ من 220 إلى 212.

انزياح متحقَّق آخر: `discoveredSignals.controlled` 23 → 21 لأن `a2-04-e4` و`a2-23-e7` كفّا تسمية الحالة الإعرابية؛ رُفع التثبيت في اختبار العقد وحده. حادثة بناء مسجّلة: أول `npm run build` لهذا الطابَع تعثّر في «Running TypeScript» عند 14 ميغابايت حرّة وقُتل؛ الإعادة بـ `--max-old-space-size=768` أنهت 321/321 صفحة. البوابات: `tsc` 0 · vitest 151/988 · lint 0 · `handoff:check` 0 · متصفح 6/6 والحزمة الكاملة 2/2 · بصمة Offline `0a0bfdd2c01f` · بصمة المحتوى `cd4e9b124b6b0741…4b9b418f`. الحزمة مُولَّدة بعد البناء الأخير، ولا يُدّعى دفع إلى `origin/main` لأن الصلاحيات لا تسمح به، ولا يغيّر أي من ذلك حالة شروط الجاهزية المفتوحة.

### 2026-09-19 — تغيير أولوية مبرَّر: حمل القراءة قبل طول الشرح، والقياس قبل العلاج

القرار المهني: تحويل الصف الأمامي من `allUnder60Chars` إلى `reading.medianUnknownWordPct` لأن الثاني
هو ما يكسر القراءة فعليًا عند متعلّم بلا مدرسة ولا مدرّس. قبل تعديل أي محتوى صُحِّح عيب قياس في
`scripts/generate-lesson-quality-audit.ts`: فتح `fold()` بـ`normalize("NFKD")` كان يقطع كل كلمة بها
لوترة، فأبطل سطور ä/ö/ü/ß وضخّم عدد «الكلمات المجهولة». بعد الإصلاح ظهر الرقم أسوأ (42.0 → 44.9
بالتعريف القديم)، فثبّتنا أن العيب كان يُخفّف لا يُبالغ، وأُضيف تعريف v2 (معجم المستويات الأدنى
محتسب) مع إبقاء الرقمين في التقرير.

العلاج بالمحتوى: ‏109 شرحًا معجميًا في `reading.glossary` لأربعة دروس أسوأ حملًا، و53 مرساة اسم
(جنس/جمع/معنى). القياس: وسيط القراءة **44.9 → 29.8** (وليس بالترميم: النصوص الأربعة نفسها 50.0→18.0،
45.2→22.6، 46.6→24.8، 46.0→27.3)، ولا نص فوق 45%، وأقصى 42.4%. طابور `pending-human` لم ينمُ (89 كما
كان) رغم أن الشرح المعجمي وحده كان سيرفعه إلى 142.

ما رفضناه عمدًا: لا ختم جديد على حمل القراءة قبل مرجع صرفي، لأن المقياس يخلط تصريفًا معلَّمًا
بمفردة جديدة. ولا تخفيف مُصحِّح ولا تغيير عتبة مقابل لون أخضر. البوابات على `dwnb-full-pack-v133`:
`tsc` 0 · lint 0 · **vitest 151 ملفًا / 988 اختبارًا** · `handoff:check` 0 · بناء 321/321 ·
`js:budget` ‏110 / 1,712,758 / 244,943 · بصمة `offline:size` ‏37bbaf8e8c58 · بصمة المحتوى
`f62de3e9a8feee1aa1213d75214153db8e5ef63daac508882875576af205540e` · متصفح 6/6 في 59.3 ثانية
والحزمة الكاملة 2/2 في 46.2 ثانية. ثلاث محاولات بناء أُجهضت بنفاد الذاكرة سُجّلت كلها في
`docs/run-logs/2026-09-19-reading-load-1/` ولم تُحذف.

## دفعة 2026-09-19 (v134): بدائل إنتاجية بقرار مؤلِّف، بلا لمس للمصحِّح ولا للعتبات

**القرار**: في التمارين الإنتاجية لا يُقبل إلا ما يُدرَج صراحةً، والبديل المُضاف يجب أن يكون
جملةً تحافظ على المعنى والسجلّ وعلى البنية المُعلَّمة، وأن يُذكر نصًا في `explanationAr`.
أُضيفت 5 بدائل إلى 4 بنود: `b1-06-e3`، `b2-14-e3`، `b2-15-e4`، `b2-24-e4` (بندان في الأخير).

**ما رُفض**: 159 بند «املأ فراغ» كان الدافع إليها النسبة وحدها، و`b2-16-e4` (تقديم `als ob`
يترك جملة غير طبيعية)، وبوابة آلية لقاعدة الفعل الثاني بعد أن تبيّن أن إنذارات المسبار
السبعة والسبعين كلها عيوب في المسبار نفسه لا في البيانات.

**البديل المتاح الذي لم يُختَر**: كان يمكن إنزال النسبة تحت السقف بجعل المصحِّح يقبل أي
إعادة ترتيب صحيحة، أو بتعديل السقف من 25% إلى 50%. لم يُفعَل أيهما: الأول ينقل الحكم إلى
خوارزمية لا تفهم المعنى، والثاني يغيّر المقياس لا المحتوى، وكلاهما من قلب الرايات الممنوع
في هذه الوثيقة. البوابة تبقى `fail` عند 50.9% وهذا هو التقرير الصادق.

**ما لا تثبته هذه الدفعة**: لا مراجعة بشرية (0 من 3,277؛ `reports/review-packet/` مستخرَج
آليًا للجودة فقط)، ولا أثر تعلُّمي مقاس، ولا أن البنود الـ17 الباقية لها بدائل طبيعية.

**الأرقام المُثبَّتة بعد البناء**: بصمة المحتوى `6865b7f3cbce1dbf22d91df3511c690e834db24ad066f29e76e1dd50fd400983` ·
`offline:size` ‏`f4d6663673ef` (الحزمة الكاملة 5,611,081) · `js:budget` ‏110 / 1,712,855 / 245,019 ·
كاش `dwnb-full-pack-v134` · `lesson:quality` بثلاثة إنذارات: 55.2% و50.9% و24 حرفًا.

## دفعة 2026-09-19 (v135): الاكتمال يُقرأ من الكاش عند ضياع رسالة العامل

**القرار**: رسالة `DWNB_OFFLINE_PACK_DOWNLOAD` لم تعد المصدر الوحيد لاكتمال تثبيت حزمة
دون إنترنت. أثناء التنزيل تسأل اللوحة العامل عن الحالة (`DWNB_OFFLINE_PACK_STATUS`، وهو
مسار موجود يقرأ `__dwnb_offline_pack_meta__` المكتوب في الكاش) كل 4 ثوانٍ، وتُنهي الحالة
فقط إذا قبلتها القاعدة الصرفة في `src/core/offline/pack-reconciliation.ts`: الحزمة المطلوبة
نفسها، خيار الصوت المطلوب نفسه، `routeCount` موجب، ولقطة مختلفة عمّا قبل الضغط.

**البديل الذي رُفض**: خياران كانا أيسر وأخطر معًا — رفع مهلة اختبار الجوال من 360 ثانية
إلى ما يكفي (يخفي العَرَض ولا يلمسه)، أو جعل `replyTo()` يرمي بدل ابتلاع فشل `postMessage`
(يكسر سلوك «الصفحة قد تُغلق والتثبيت يستمر» المعتمد في ADR-015). لم يُفعَل أيهما، ولم
تُغيَّر أي عتبة ولا أي فحص حجم ولا أي نص مُثبَّت.

**الأرقام**: 152 ملف اختبار و996 اختبارًا (من 151/988، +8 للاختبار الجديد) · `tsc` 0 ·
`lint` 0 · بناء 321/321 · بصمة `offline:size` ‏5b076556032b وحزمة كاملة 5,610,993 ·
`js:budget` ‏110 / 1,713,173 / 245,019 · طابع الكاش `dwnb-full-pack-v135` ·
Playwright ‏41/41 جوال في 10.3 دقيقة و41/41 سطح مكتب في 7.6 دقيقة. بصمة المحتوى بقيت
`6865b7f3cbce…` لأن بيانات الدروس لم تتغيّر في هذه الدفعة.

**ما لا تثبته**: تشغيل كامل واحد لكل مشروع بعد الإصلاح مقابل فشلين قبله — مؤشر لا برهان
إحصائي، والبنية مسجَّلة للمراقبة. ولم يُحقَّق في خطأ استيفاء React ‏`#418` الذي ظهر مرة واحدة
على `/settings`، فبقي مفتوحًا ومكتوبًا في `docs/OFFLINE-PACK-INSTALL-FLAKE-2026-09-19.md`.
لا يُغلق هذا شيئًا من شروط الجاهزية: لا مراجعة بشرية، ولا أثر تعلُّمي مقاس.

## 2026-09-19 — حمل القراءة: الوسيط يُعالَج بالدرس لا بالتعريف (v136)

**القرار**: إذا كان المقياس صوابًا والتعريف مُختبَرًا، فالعلاج مُحتوى. الدفعة أضافت 53 ترجمة
إلى `reading.glossary` لعشرة دروس قريبة من العتبة، لا إلى أسوأ النصوص، لأن رقم المعيار وسيطٌ
والوسيط يتحرك بتحويل الدروس القريبة من فوق 25% إلى تحتها. النتيجة: A1 ‏28.9 ⇒ 21.6 وA2 ‏27.6 ⇒
19.0 فانسَدّ الشرط في مستويين، وبقي B1 ‏29.7 وB2 ‏28.6 مفتوحين.

**البديل المطروح والمرفوض**: تليين `fold`/`STOP` ليعفي الأعلام وأيام الأسبوع، أو مطابقة جذر
فضفاضة، أو توسيع وعاء «المُعلَّم» ليشمل نصوص التمارين والاستماع. الثلاثة تُخضِرّ البوابة
آليًا ولا تُعلّم المتعلم كلمة؛ والمطابقة الفضفاضة قِيست فأعطت ‏27.1/30.8/29.5 أي أقل من نقطة
واحدة في مستويين — دليل إضافي على أن الفجوة حقيقية لا قياسيّة. تُترك البوابة حمراء حيث يجب.

**ما تقرر للمتبقي**: أسماء B1/B2 تحتاج مراسيَ في `lexical-grammar-*` لأن lemma بحرف كبير في
`reading.glossary` يُعدّ مرشحًا غير مغطى حتى يوجد المرسى، والمرسى يضيف اسمًا إلى لوحة
«Weitere Zielnomen» (a1-04 عنده 39 اسمًا إضافيًا الآن). إذن ليس عملًا آليًا: يُفتح درسًا درسًا
مع مفاضلة موثّقة، ويُمنع حشو المراسي لخفض رقم.

**الأداة المصاحبة**: `lesson:quality` كتب من هذه الدفعة `reading.unknownByLesson` (قائمة الكلمات
المجهولة لكل درس فوق 25%). السبب أن كل دفعة سابقة كانت تبدأ من إعادة اشتقاق القوائم يدويًا.

**درس بيئي مسجَّل**: `node_modules/.bin` اختفى مرة أثناء العمل فأصبح `npx tsc` ينزّل حزمة
`tsc` من npm ويعطي خلوًا كاذبًا من الأخطاء؛ الفحص المعتمد `./node_modules/.bin/tsc --noEmit` بعد
`npm ci`. كذلك بناء 321 صفحة مع التزامن يفشل بـ`Failed to type check.` بلا قائمة أخطاء (ضغط ذاكرة)،
ونجح منفردًا بسقف 1024 MB.


## 2026-09-19 — إغلاق معيار القراءة بأفعال لا بأسماء، وتحرير البناء بالمبادلة (v137)

**القرار الأول**: تُغلق الوسوط بتعليم الكلمات القريبة من العتبة، لا بلمس تعريف المقياس. استُخدمت
أفعال وصفات وظروف وضمائر حصريًا في 76 إدخالًا، لأن قاعدة التدقيق تعدّ lemma بحرف كبير في
قاموس القراءة مرشحَ اسم بلا مرسى، فتنفتح قائمة pending-human وتنتفخ لوحة «Weitere Zielnomen».
بهذا بقيت الفجوات المعجمية مطابقة حرفيًا لحالة v135 مع إغلاق الشرط على المستويات الأربعة.
الأسماء تعمل لها دفعة مستقلة بقرار مراسي موثّق — لا تُحشو لخفض رقم.

**القرار الثاني**: أداة القياس تُصلَح قبل أن تُستَغَل. إلغاء سقف 16 درسًا في
`reading.unknownByLesson` ليس تجميلًا للتقرير: مع السقف كانت الخطة تُبنى على الذيل بينما
المطلوب نطاق العتبة.

**القرار الثالث (تصحيح علني)**: قلنا في v136 إن بصمة المحتوى «محكومة بخلاصة التدقيق فلا تلمسها
ترجمات الدروس». هذا تعليل خاطئ؛ الخلاصة تتضمن صفوف الفجوات المعجمية كاملة. الدليل: البصمة تحرّكت
في v137 إلى be475d82 ولم تتحرك في v136. الأرقام القديمة تبقى صحيحة لما قِيست عليه، والتصحيح
مكتوب في موضع الادعاء لا في هامش.

**القرار الرابع**: لمّا كان `next build` يُقتل داخل فحص الأنواع على صندوق بذاكرته 1,984 ميجابايت،
زِيد ملف مبادلة 4 غيغابايت (sudo، على قرص التشغيل) بدل الإسكات أو التسطيح: لا `ignoreBuildErrors`،
ولا تعديل `tsconfig`، ولا خفض عتبة، ولا `--no-lint`. استُخدمت المبادلة نفسها لاحقًا لاختبار
المتصفح الكامل. تُركت مُفعّلة لهذه الجلسة وتُذكر في السجل لأنها تغيّر زمن التشغيل لا نتيجته.


## 2026-09-19 — كسر قرينة الطول بإعادة كتابة المشتتات، لا بتغيير المقياس (v138)

**القرار**: قرينة «المفتاح هو الأطول» عيب بناء لا عيب قياس: في B2 يكون المفتاح جملة دقيقة والمشتتات مقاطع قصيرة أو
عربية، فيكفي أن يقيس المتعلم الأطوال ليجيب. عولج المصدر: 117 مشتتة أعيدت كتابتها بألمانية كاملة على وزن المفتاح في 39
عنصرًا من ثلاثة دروس، مع إبقاء نص المفتاح وموضعه وشرح الطالب. ولم يُقبل الحل الانحرافي الثاني: توسيع المشتت بكلمة
حشو حتى يتعادل مع المفتاح، لأنه يبدل قرينة بقرينة.

**قاعدة صارمة أُضيفت للحارس**: يُمنع أن يكون المفتاح الأطول وحده **و**الأقصر وحده. الأولى هي المقياس المعلن، والثانية
حماية من «إصلاح» يقلب القرينة فيصير الأقصر هو الجواب. كما فُرضت أحادية اللغة داخل مجموعة الخيارات الواحدة: مجموعة
تختلط فيها العربية بالألمانية تكشف الجواب قبل قراءة السؤال.

**القرار الثاني**: لا تُغيَّر عتبات ولا تُسكت بوابات. البوابة ما تزال fail بالإنذارات الثلاثة، وهذه الدفعة خفضت واحدًا
منها بنسبة 3.12 نقطة، وهذا هو الفرق المُقاس.

**القرار الثالث**: أرقام الجرد المعجمي تُعاد تثبيتها حيث تُثبَّت الآن، وتُترك الأرقام التاريخية في سجلات الدفعات كما
هي. تعدّت المرشحات لأن نصوص الخيارات تدخل التجميع؛ لم نحاكم ذلك بتخفيض المشتتات بل بتوثيق أن لوحة pending-human لم
تتغير (‏89 و4) فلا قرار بشريًا أُضيف أو أُخفي.

**تصحيح بيئي**: رسالة «Failed to type check.» لا تكفي وحدها دليلًا على نفاد الذاكرة — هذه المرة كانت خطأ نوع حقيقيًا.
الفصل بينهما: `./node_modules/.bin/tsc --noEmit` مستقلًا؛ إن أعطى صفرًا فالسبب الذاكرة، وإن أعطى أسطرًا فالخطأ حقيقي.

## ADR-079 — مصادقة كل وثيقة قائمة بعد كل دفعة (2026-09-20)

**السياق المقاس**: قرار المالك أن تكون الوثائق محدَّثة بعد كل دفعة. الفاحص كان يثبت أرقامًا منتقاة في أربعة ملفات
فقط. القياس في 2026-09-20 وجد `docs/CONTENT_COMPLETENESS_AUDIT.md` و`P0_AUDIT.md` يقولان 1,244 مرساة اسم و4,389
إشارة بينما يطبع `reports/academic-content-audit.json` ‏1,297 و4,717، وأن أطر الأفعال 1,090 منها 952 خارج الهدف في
الوثيقة مقابل 1,233 و1,095 في التقرير، وأن سطر البند 397 في `P1_AUDIT.md` بقي عند 55.2% بينما الدفعة الجارية
52.08%، وأن رأس `PROJECT_STATUS.md` أعلن 2026-09-13 داخل ملف يحمل أرقام `v138`، وأن `IDEA_BACKLOG.md` عدَّ نفسه
396 اقتراحًا وهو 401، وأن خمسة تقارير مولَّدة تُطبع بتاريخ 2026-09-05 الثابت لأن `AUDIT_DATE` نص ثابت في
`scripts/generate-academic-audit.ts` وتتحتم مطابقته حرفيًا في وضع `--check`.

**القرار**: سطر `Sync batch: v<NNN>` في أول اثني عشر سطرًا من كل وثيقة من الثلاث عشرة، يساوي جيل الحزمة في
`PACK_CACHE`، ويفشل `handoff:check` عند غياب السطر أو تأخر جيله. معنى السطر مصادقة لا تعديل. وتُغيَّر تسمية رأس
التقارير المولَّدة من `Generated:` إلى `Definition date:` لأن المرجع الطازج هو `Content SHA-256` لا التاريخ.

**العواقب**: لا تُغلَق دفعة قبل مصادقة وثائقها؛ ولا يُعفَى سطر من وثيقة بلا أرقام، لأن سطرًا واحدًا أرخص من لبس
أسبوعين؛ ولا يُصلَح فشل الفاحص بتخجيل الحزمة. القائمة نفسها لا تُقلَّص إلا بقرار موثَّق هنا.

**التحقق**: `node scripts/verify-continuation-handoff.mjs` صفرًا مع الحارس، وفشل مقصود حين كُسِر سطر
`docs/SOURCE_FRESHNESS.md` إلى `v137` ثم أُعيد. السجل في `docs/run-logs/2026-09-20-doc-sync-1/README.md`.

**ملحق في نفس اليوم — الحارس المعمَّم و`v139`**: أثناء تنفيذ القاعدة مُسح `src/**` بالحروف الشرق آسيوية، فوُجد عيب
حقيقي واحد في بيانات الدروس: حرفان شرق آسيويان دخلا محل «تفاوض» داخل `explanationAr` في `b2-13.exercises[4]`، وهو غير قابل لرصد الحارس
القديم لأنه لا يرى سوى الخيارات. صُحِّح النص، وأُضيف `tests/unit/lesson-text-purity.test.ts` يفرض صفر عبرية أو شرق
آسيوية أو كيريلية في **كل** نص مؤلَّف (39,540 نصًا في 96 درسًا)، وفُحص أن العداًد المعجمي لم يتحرك (1,297 مراسي و4,717
إشارة و1,233 إطارًا، وpendingHuman 89 و4 كما كان) لأن التصحيح عربي لا ألماني. رُفع الكاش إلى
`dwnb-full-pack-v141` لأن نص الدرس داخل الحزمة، فامتحان الحارس الجديد لرفع جيل حقيقي: سطر `Sync batch` نُقل في
الوثائق الثلاث عشرة إلى `v139` قبل أن يمرّ `handoff:check`. لم يُشغَّل المتصفح، ولا يُدّعى لـ`v139` تشغيل متصفح لم يُنفَّذ؛
آخر تشغيل كامل 82/82 يبقى عند v138

## 2026-09-20 — ملحق ADR-079 الثاني: الدفعة التي تعدّل نصًا تعيد تثبيت العدادات المعجمية (v140)

**القرار**: كل دفعة تُبدّل نصًا في الدروس (شرحًا كان أو خيارًا) تُلزَم بإعادة توليد كل التدقيقات ثم إعادة تثبيت
الأرقام المعجمية في الاختبارات والفاحص والوثائق الجارية **في الدفعة نفسها**. السبب: ‏`scripts/lesson-lexical-gap.mjs`
يقرأ نصوص الخيارات، فأي إعادة صياغة للألمانية تحرّك تعداد المرشحات؛ وترك التثبيت يترك ‏`npm test` و‏`handoff:check`
أحمر بعد دفعة «ناجحة» ظاهريًا.

**ما حدث فعلًا**: بعد 49 عنصرًا في ‏`b2-12 · b1-05 · b2-07 · b2-08` تحرّكت الأرقام إلى ‏4,802 و1,380 و3,333 و1,469
و‏1,233 و1,095 (والمراسي ثابتة عند ‏1,297/134). كان اختبارا ‏`lexical-target-gap` و‏`academic-content-governance`
أحمر قبل التثبيت، وأخضر بعده — وهذا هو الدليل التشغيلي على أن القاعدة ليست ورقية.

**درس إضافي مُسجَّل**: إدراج درس في قائمة ‏`PARALLELISED` يوسّع فحص الحارس إلى كل عناصر الدرس (بما فيه الاختبار المصغّر)،
فلا يُدرج درس إلا بعد إصلاح خلل التباعد أو خلط اللغتين الذي يظهر حينها. الحارس لم يُخفَّف، وبُلّغ الخللان وأُصلحا.

## 2026-09-20 — قاعدة الدفعة التي تلمس الشيفرة: كل `:audit:write` قبل البناء، ولا تثبيت رقم قديم باسم جديد (v141)

**القرار**: أي دفعة تعدّل `src` تُعيد توليد كل التقارير ذات أمر `:write` قبل `npm run build`، لأن سلسلة ما قبل البناء تفحص تقادمها وتفشل البناء. وممنوع أن تُثبَّت بصمة أو حجم غير مقاس في هذه الدفعة تحت اسم الدفعة الجديدة؛ إن تعذّر القياس يُكتب صراحةً أنه قياس الدفعة السابقة وسبب التعذّر.
**سببان مقيسان**: أولًا فشل البناء مرتين عند `exam:format-claims:audit --check` لتقادم تقرير الادعاءات. ثانيًا تعطّلت أدوات npm في آخر الجلسة (خروج 127) فامتنع البناء والقياس، وتثبيت الأرقام القديمة بصفتها جديدة كان سيُنتج وثائق كاذبة.
**درس مسجَّل**: `npx tsc` لا يستدعي typescript المحلي حين يغيب، بل ينصب حزمة اسمها tsc ويعطي خطأ مضلّلًا؛ يُستعمل `./node_modules/.bin/tsc`.

## 2026-09-20 — إغلاق البند 406 بحصر قيم الجهاز، وقاعدة «الحارس يُصلح ولا يُوسَّع» (v142)

ثلاثة مواقع كانت تقرأ ساعة الجهاز أو منطقة الوقت في أول رسم على `src`، وهي مسماة في قائمة `deferred` داخل
`tests/unit/no-storage-in-render-init.test.ts`. أُغلقت جميعها بهذا النمط: `const EPOCH = new Date(0);` و
`epochOr(ms)` على مستوى الوحدة، و`const deviceNow = useDeviceValue(() => Date.now(), 0);`، ثم
`const now = useMemo(() => epochOr(deviceNow), [deviceNow]);`. صيغة الـ `useMemo` ليست تجميلًا: بدونها يفقد
`now` ثبات الهوية فتُبطَل ذاكرة كل `useMemo` يعتمد عليه، وتحذر القاعدة `react-hooks/exhaustive-deps`.

ثلاثة حدود مُتَّبعة تُذكر لأن كلًّا منها كاد يسقط. أولًا: لا يُنادى خطاف داخل تعبير شرطي — المحاولة الأولى على
`study-export-control.tsx` كتبت `useDeviceValue(...) ? new Date(useDeviceValue(...)) : EPOCH` وهو خرق صريح
لقواعد الخطافات وكان سيُنتج رسمًا غير قابل للتكرار. ثانيًا: السطر الطويل يخفي الأخطاء؛ كانت `timeZone` معلَّفة في
آخر سطر declaration فمرّت على القارئ، والحارس هو الذي كشفها لأن `deviceRead` رأى `Intl.DateTimeFormat` على سطر
`useMemo` — فقط بعد إخراج الملف من `deferred`. ثالثًا: قائمة `deferred` أفرِغت ولم تُحذف، والاختبار يسمّى
«لا مواقع مؤجَّلة» ليبقى مرئيًا.

القرار الثاني: لم تُضعَّف أنماط الحارس ولا أُضيف استثناء، ورُفع جيل الكاش إلى `dwnb-full-pack-v142` لأن شيفرة
العميل دخلت الحزمة. القياس الأخضر: tsc صفر · lint صفر · 155/155 ملفًا و1,011/1,011 اختبارًا · بناء 321 صفحة ·
`offline:size` بصمة `51316cb18282` و`full 5,631,189` · `js:budget` 110/1,720,720/249,350 · `media:budget`
544/52,943,843/939,473 · `handoff:check` صفر. ما لم يُقَس: حزمة المتصفح؛ مكتبات chromium ما تزال ناقصة على هذا
الصندوق، فبند الترطيب في `tests/e2e/critical-flows.spec.ts` غير مشغَّل، وآخر قياس متصفح كامل معروف هو 82/82 عند
v138، ولا يجوز أن يُنسب إلى v142 رقمٌ لم يُقَس عليها.

## 2026-09-20 — دفعة المحتوى تُقاس بالأداة نفسها، ولا يُغلق P1-397 قبل البوابة (v143)

حوّلت هذه الدفعة الدرسين `b2-11` و`b1-20` بالكامل إلى صيغة موازية: 25 عنصرًا، و75 مشتتًا ألمانيًا أُعيد تأليفه
يدويًا، بلا لمس `correctIndex` ولا نص المفتاح. الأداة هي المسؤولة عن الكتابة — `scripts/cue-batch.py` يبني الدفعة
ويدقّق القواعد، ثم `scripts/parallelise-options.py --write` يستبدل جسم مصفوفة `options` بقوس-aware فقط — فلا يوجد
تحرير يدوي لبيانات الدروس في هذه الدفعة، وهو ما يجعل الرقم قابلًا للتكرار.

القياس تحرك لكن البوابة لم تُصب: القرينة 48.16% ⇒ 46.16% (577 من 1,250) بينما السقف 40%. لذلك بقيت حالة التقرير
`fail` بثلاث ملاحظات ولم يُغلق P1-397، ولم تُكتب أي صيغة تقول «انتهى انحياز الطول». المطلوب 77 عنصرًا آخر،
وسبعة دروس تالية (‏`b1-07` و`b1-12` و`b1-16` و`b1-22` و`b2-05` و`b2-13` و`b2-17`) تغطيها بالضبط، كلٌّ منها 11 عنصرًا.

قرار ثانٍ: حارس الموازة `tests/unit/mcq-option-parallelism.test.ts` يوسَّع بقائمة الدروس المحوَّلة فقط (7 ⇒ 9)،
وهذا يرفع عدد الاختبارات إلى 1,013. القاعدة ألا يمسّ الحارس الدروس غير المحوَّلة، حتى لا يبدو الرقم الأخضر
أكبر مما صُنع فعلًا.

قرار ثالث — وأهم من الرقم: كشف استرجاع الشجرة أن نسخة الصندوق رجعت عن دفعة v142 في ملفاتها الثلاثة و`deferred`
في الحارس، فاستُعيدت من أرشيف v142 قبل أي قياس، وأُعيد توليد كل تقارير `:write` لأن `language:audit --check`
في `prebuild` رفض تقريرًا عتيقًا. الدفعة المسجلة هنا therefore مبنية على شجرة موصولة فعليًا: `src` فيه
`useDeviceValue` في المواقع الأربعة، والحارس بلا استثناءات، والتقاير مطابقة لبناء v143.

## 2026-09-20 — قياس المتصفح على chromium: حزام الأمان صار مرئيًا في متصفح حقيقي (v143)

لأول مرة منذ أُضيف بند «استعادة مفتاح الجلسة بعد الترطيب» إلى `tests/e2e/critical-flows.spec.ts` عند v141، شُغِّل
في متصفح حقيقي على هذا الصندوق: مرّ في 12.5 ثانية. هذا لا يقول إن خلل الترطيب اختفى إلى الأبد، بل يقول إن السياج
الذي بُني عند v141 وv142 لا يُنتج عدم تطابق HTML على `/settings` في chromium في هذا البناء.

جري المشروع الكامل أعطى 40 من 42، والفشلان كانا زمنيًا: لوحة جهوزية الامتحان وحزمة الأوفلاين الكاملة؛ كلٌّ منهما
مرّ عند إفراده (1.1 دقيقة و31.2 ثانية). السجلّان في `docs/run-logs/2026-09-20-cue-parallelism-b2-11-b1-20/`.
القرار المُستفاد: لا يُصدَّق «لم يُشغَّل» كحالة دائمة — عطل مكتبات chromium كان يُصلح بـ `apt-get` على هذا
الصندوق نفسه، وقد فعل. مشروع الهاتف ما يزال غير مشغَّل، ولا يُنسب إلى v143 رقم 82/82.

## 2026-09-20 — الحارس على مستوى الدرس يكشف ما لا تقيسه البوابة (v144)

إضافة `b1-12` إلى `PARALLELISED` في `tests/unit/mcq-option-parallelism.test.ts` أسقطت الاختبار فورًا، لا على
عنصر قرينة، بل على `b1-12-m5`: مفتاح ألماني وثلاثة مشتتات عربية. هذا العنصر لا تراه بوابة `lesson:quality`
مطلقًا — فهي تقيس «المفتاح هو الأطول وحده» فقط — ولم يره أيضًا `scripts/dump-cue-items.ts` لأنه ليس عنصر قرينة.
الدرس المُستفاد مسجَّل كقاعدة: عند ضمّ درس إلى قائمة الحارس، الحارس نفسه هو الحكم، لا مخرج أداة التحويل؛
وما يُكتشف يُصلح بالأدوات نفسها (`cue-batch.py` مع `items.jsonl` مُعدّ للعنصر، ثم `parallelise-options.py --write`)
ولا يُمسّ نص المفتاح ولا `correctIndex`.

القرار الثاني: لم تُخفَّف قاعدة «لغة واحدة لكل مجموعة» لتنجح الدفعة. بديل كان ممكنًا (إبقاء `m5` خارج القائمة)
ورُفض لأنه يبقي عيبًا معروفًا بلا حارس.

القرار الثالث: بعد أي إصلاح لاحق على شجرة موجودة، تُعاد كل `:write` قبل البناء. أول محاولة بناء عند v144 خرجت
بـ exit 1 لأن `docs/generated/ACADEMIC_SCHEMA_REPORT.md` و`ANSWER_INTEGRITY_REPORT.md` بقيا عتيقين بعد تأليف
مشتتات `m5`؛ لم يُتجاوز الحارس بـ flag، بل أُعيد التوليد. وقد تغيّرت بصمة المحتوى مرتين في هذه الدفعة
(‏`b27320694fde` ثم `cfbffc605825` لكل الحالة النهائية)، والثانية هي المثبتة في الوثائق.

القياس النهائي لهذه الدفعة: القرينة 44.4% (555 من 1,250) · 1,015 اختبارًا في 155 ملفًا · tsc صفر · lint صفر ·
العدادات المعجمية 4,833 / 1,381 / 3,363 / 1,470 وأطر الأفعال 1,242 / 1,104 مع pending-human 89 و4 بلا حركة.
البوابة ما تزال fail لذلك لا يُغلق P1-397؛ ومتصفح هذه الدفعة لم يُعَد تشغيله، فلا رقم متصفح باسم v144.

## دفعة v145 — الحارس يمنع إدراج درس فيه عنصر ترفضه الأداة (2026-09-20)

نصّ القرار: إذا اشترطت أداة التوليد لغةً لمجموعة الخيارات فلا يُخفَّف الشرط يدويًا ولا يُستبدل بنصّ مكتوب خارجها لمجرد
إدراج درس. عند v145 حُوِّل 20 من 22 عنصر قرينة في `b1-16` و`b1-22`، وبقي `b1-16-e6` و`b1-22-e6` لأن مفتاحهما عربي
و`scripts/cue-batch.py` تكتب مشتتات ألمانية نقية فقط؛ وإدراج الدرسين في `PARALLELISED` كان يُفشل
`tests/unit/mcq-option-parallelism.test.ts` لأنه يحاكم كل عناصر الدرس لا عناصر القرينة وحدها.
القرار الثاني: يبقى الدرس خارج القائمة حتى يكتمل، ولا تُرخَّ القاعدة ولا يُستثنَ عنصر؛ النتيجة أن الحارس ما يزال على
**11** درسًا فبقيت الاختبارات **1,015** في **155** ملفًا ولم تُحرَّك أرقام التثبيت، وبقي العنصران مسجَّلَين في P1-397
كمطلَب تغيير أداة (دعم مجموعات عربية نقية) لا كنقص مؤلَّف.
القرار الثالث: قبل أي قياس على هذا الصندوق يُتحقق من `/home/user/.swapfile`؛ غيابُه (حدَث في هذه الدفعة مع رجوع
الشجرة) يرفع المتوسط إلى 11+ ويقتل `next build` عند SSG. أُعيد بـ fallocate/mkswap/swapon بمبادلة 1,500 MB ثم بني
بحاجز `--max-old-space-size=1200` فخرج exit 0.

القياس النهائي لهذه الدفعة: القرينة **42.8%** (535 من 1,250) · 1,015 اختبارًا في 155 ملفًا · tsc صفر · lint صفر ·
العدادات المعجمية 4,845 / 1,381 / 3,375 / 1,470 وأطر الأفعال 1,245 / 1,107 مع pending-human 89 و4 بلا حركة، وبصمة
محتوى `f2c6e0eae623…`. البوابة ما تزال fail لذلك لا يُغلق P1-397؛ ومتصفح هذه الدفعة لم يُعَد تشغيله، فلا رقم متصفح
باسم v145.

## دفعة v146 — درس واحد يكفي لإدراجه: لا يُنتظر اكتمال المستوى (2026-09-20)

نصّ القرار: يُدرَج الدرس في `PARALLELISED` فور خلوّه من عناصر القرينة ونجاحه على قواعد الحارس، دون انتظار دفعات
إضافية في مستواه. عند v146 حُوِّل `b2-05` وحده (11 عنصرًا و33 مشتتًا) وأُدرج، فارتفع تغطية الحارس من 11 درسًا إلى
**12** وزاد عدد الاختبارات بمقدار واحد بالضبط (1,015 ⇒ **1,016** في **155** ملفًا). هذا يثبت أن إدراج درس واحد
آمن: الحارس Level-wise يراجع كل عناصر الدرس، والدليل أن بندَي `b2-05` غير القرينيين مرا عليه بلا إصلاح، ولو كان
فيهما خلط لغوي لفشلا كما فشل `b1-12-m5` عند v144.
القرار الثاني: لا تُستعمل قائمة الدروس القيادية كحجة لتأجيل الإدراج. المسبار بعد الدفعة لم يُبقِ `b2-05` في قائمة
القادة (صار صفرًا) بينما بقيت `b2-13` · `b2-17` · `b2-19` كلٌّ 11 من 13، فالحساب المقيس للبقية **24** عنصرًا لا
يُغلق بالسقف بدرسَين (22)؛ السجل في P1-397 يذكر ذلك صراحة بدل تلميح «قاربنا».
القرار الثالث: الأرقام التي تُثبَّت في الفاحص تُقاس من `reports/` بعد آخر كتابة لا قبلها؛ لذلك جرت إعادة توليد
كل التدقيقات (13 أمر `:write` + `lesson:quality:audit --write`) ثم أُعيد تثبيت 4,845⇒4,857 و1,245⇒1,249
و1,015⇒1,016 في `tests/unit/lexical-target-gap.test.ts` و`scripts/verify-continuation-handoff.mjs` و`README.md`.

القياس النهائي لهذه الدفعة: القرينة **41.92%** (524 من 1,250) · 1,016 اختبارًا في 155 ملفًا · tsc صفر · lint صفر ·
العدادات المعجمية 4,857 / 1,381 / 3,387 / 1,470 وأطر الأفعال 1,249 / 1,111 مع pending-human 89 و4 بلا حركة، وبصمة
محتوى `6c915e187d4b…`. البوابة ما تزال fail لذلك لا يُغلق P1-397؛ ومتصفح هذه الدفعة لم يُعَد تشغيله، فلا رقم
متصفح باسم v146.

## دفعة v147 — فحص الأطوال قبل الأداة، لا بعدها (2026-09-20)

نصّ القرار الأول: تُفحص قيود الأطوال محليًا (نطاق ‏[K−12, K+18]، مشتت واحد أطول من المفتاح وواحد أقصر، توسيع ≤25،
ولا تكرار بعد طيّ الترقيم) قبل نداء `cue-batch.py`، لأن رفض الأداة عنصرًا واحدًا يعيد توليد الدفعة كلها. عند v147
نجح هذا الفحص في تمرير 11 عنصرًا و33 مشتتًا من أول محاولة، بعد أن كانت دفعات سابقة (‏v144 وv145) تحتاج ثلاث جولات
تصحيح لكل درس. الفحص أداة مساعدة للمؤلِّف فقط، ولا يستبدل تحقّق الأداة ولا يُضاف إلى المستودع كبوابة.
نصّ القرار الثاني: التعادل المطلق مقبول ومقصود. ثلاثة بنود محوَّلة في `b2-13` صار فيها طول المفتاح مساويًا تمامًا
لطول أطول مشتت (‏`lq1` 28/28، `lq3` 63/63، `m1` 49/49)، والقياس يعتبر القرينة «الأطول **وحده**» لا «الأطول أو
المساوي»، والحارس يمرّ. لا يُمنع التعادل ولا يُفرَض تفاديًا مصطنعًا بحرف زائد؛ المنع يقع على التلميح لا على الطول.
نصّ القرار الثالث: بعد كل دفعة تُقاس قائمة القادة من `probe-option-cue.ts` لا من الذاكرة. هذه الدفعة أسقطت
`b2-13` من القائمة فبقي قائدان فقط (‏`b2-17` و`b2-19`، 11 من 13 لكلٍّ)، ومنه يُحسب المتبقي: 13 عنصرًا؛ و`b2-17`
وحده يترك 502 أي فوق السقف بعنصرين، فلا يُعلن اقتراب الإغلاق بلا رابع أو بلا قرار الأداة العربية.

القياس النهائي لهذه الدفعة: القرينة **41.04%** (513 من 1,250) · 1,017 اختبارًا في 155 ملفًا · tsc صفر · lint صفر ·
`handoff:check` صفر · العدادات المعجمية 4,864 / 1,381 / 3,394 / 1,470 وأطر الأفعال 1,250 / 1,112 مع pending-human
89 و4 بلا حركة، وبصمة محتوى `e585e350b85e…`. البوابة ما تزال fail فلا يُغلق P1-397؛ ومتصفح هذه الدفعة لم يُعَد
تشغيله، فلا رقم متصفح باسم v147.

## دفعة v148 — فاحص الأطوال المحليّ يطابق منطق الأداة لا نصّها (2026-09-20)

نصّ القرار الأول: أي فحص مسبق للأطوال يجب أن يُحاكي `cue-batch.py` حرفيًا: تجريد علامات الترقيم النهائية
(`[.!?]+$`) قبل العدّ، ورفض **التعادل** عند الطرفين (`lens[key] == max(lens)` و`== min(lens)` خطأ)، وحساب التوسيع
على الأربعة (المفتاح + المشتتات) لا على المشتتات وحدها، وطيّ `ä/ö/ü/ß` قبل مقارنة التكرار. عند v148 كان فاحصي
الأول يعتمد أطوالًا غير مجرّدة ويقبل التعادل، فمرّ `b2-17-m4` محليًا ورُفض عند الأداة («المفتاح ما يزال الأطول وحده
(58)»)؛ بعد مطابقة المنطق صارت الدفعة كلها مقبولة من المحاولة التالية بلا جولة تصحيح إضافية.
نصّ القرار الثاني: البند الذي لا يظهر في قائمة القرينة ليس بالضرورة سليمًا. `b2-17-m2` لم يكن عنصر قرينة (مفتاحه
لم يكن الأطول) لكنه خالف قاعدة «المفتاح ليس الأقصر وحده»، واكتُشف فقط عند إضافة الدرس إلى `PARALLELISED` لأن الحارس
يحاكم كل عناصر الدرس. النتيجة: تُؤلَّف هذه الحالات أيضًا عبر الأداة (دفعة من سطر واحد)، كما فُعل في `b1-12-m5` عند
v144 — لا تحرير يدوي لبيانات الدروس.
نصّ القرار الثالث: عند البقاء عنصرين فوق السقف لا يُصرَّح بـ«قاربنا»؛ يُصرَّح بالرقم: 502 مقابل ≤500، والبوابة خروجها
1، وP1-397 مفتوح. الإغلاق المتوقع دفعة واحدة: `b2-19` (11 عنصرًا ⇒ 491 = 39.28%).

القياس النهائي لهذه الدفعة: القرينة **40.16%** (502 من 1,250) · 1,018 اختبارًا في 155 ملفًا · tsc صفر · lint صفر ·
`handoff:check` صفر · الحارس على **14** درسًا (15 اختبارًا في ملفه) · العدادات المعجمية 4,870 / 1,381 / 3,400 / 1,470
وأطر الأفعال 1,251 / 1,113 مع pending-human 89 و4 بلا حركة، وبصمة محتوى `9d1740170ad9…`. البوابة ما تزال fail فلا
يُغلق P1-397؛ ومتصفح هذه الدفعة لم يُعَد تشغيله، فلا رقم متصفح باسم v148.

## دفعة v149 — البناء على آلة بلا سوابل: دفّئ ذاكرة tsc الزيادة أولًا (2026-09-20)


`swapon` مرفوع الرفض في هذه البيئة (Operation not permitted) وذاكرتها 1,984 ميغابايت. عند v149 شُغّل `npm run build`
بـ`NODE_OPTIONS=--max-old-space-size=1200` فالتقطته webpack («Compiled successfully in 22.4s») ثم تعثّر تسع دقائق عند
«Running TypeScript» مع 15 ميغابايت متاحة للنظام كلّه؛ قُتل التشغيل. الإجراء الذي نجح ولا يغيّر أي ضبط في المستودع:
تشغيل نفس ما يستدعيه Next حرفيًا قبل البناء —
`node --max-old-space-size=900 node_modules/typescript/bin/tsc --project tsconfig.json --noEmit --declarationMap false --emitDeclarationOnly false --tsBuildInfoFile .next/cache/.tsbuildinfo`
(24 ثانية، خروج 0، `incremental: true` في `tsconfig.json` هو ما يجعل الناتج صالحًا لإعادة الاستخدام) — ثم البناء
بسقف 900 ميغابايت ⇒ خروج 0 في نحو ثلاث دقائق. القرار: على آلة بلا سوابل تُدفَّأ ذاكرة tsc الزيادة أولًا ولا يُخفَّض
سقف الذاكرة داخل إعدادات البناء، ولا يُعطَّل فحص الأنواع في `next.config`.
القياس الذي يواكب القرار: القرينة **39.28%** (491 من 1,250) تحت سقف 40%، و**15** درسًا في `PARALLELISED`،
و**1,019** اختبارًا في **155** ملفًا، وtsc صفر، و`handoff:check` صفر، وبصمة `offline:size` ‏86118504e7f8، وبصمة محتوى
464623b3d15b، و`pending-human` ‏89 و4 بلا حركة. البوابة ما تزال fail بملاحظتين (الإنتاجية 50.9% ووسيط الشرح 24)،
فلا يُغلَق P1-397 ولا أي بند جودة يعتمد عليها؛ ومتصفح هذه الدفعة لم يُشغَّل.

## دفعة v150 — شروحات A2 (الدفعة الثالثة) وتسلسل البناء بلا سوابل

**السياق**: استمرار P1-399 (الشرح التصحيحي ≥60 حرفًا) بعد دفعتَي A2 السابقتين (48 بندًا). الدفعة: 24 شرحًا
في تمارين A2 عند أطول 24 بندًا قِصرًا (21–25 حرفًا)، بنمط المستودع نفسه.

**القرار**:
1. تأليف خارج المستودع ثم فحص آلي قبل التطبيق: validators على المدى المحريري (156–212)، والعبارة الموضعية
   (مطابقة جزئية، لذا «الأولى» و«الثاني» ممنوعتان)، وتسمية الحالات، والتكرار بين النصوص؛ ثم `set_expl.py`
   الذي يطابق الطول السابق حرفيًا لكل بند. لم يُحرَّر أي ملف بيانات يدويًا.
2. قبول انزياح `discoveredSignals.controlled` ‏21 ⇒ 20 بدلًا من إعادة تسمية الحالة في الشرح: النمط المعتمد
   يذكر القاعدة والمعنى بلا حالة مسمّاة، والعقد التدريسي يحمل الصيغة. التثبيت رُفع في
   `tests/unit/meaning-first-case.test.ts` وحده وسُجّل في سجل التشغيل.
3. **تسلسل البناء الواجب في بيئة بلا سوابل** (درس مُطبَّق هذه الدفعة): تدفئة `tsc` قبل البناء لا تكفي إن جرت
   قبل أن يولّد Next ملفات `.next/types/**`؛ عندئذٍ يكون `.tsbuildinfo` غير مطابق فيتعثّر «Running TypeScript»
   ويستهلك الذاكرة كلها (قِيس: 16 ميغابايت متاحة وtsc عند 811 ميغابايت بعد خمس دقائق). التسلسل الصحيح:
   تشغيل البناء حتى `Compiled successfully` ثم إيقافه ⇒ تدفئة `tsc` بنفس أعلام Next (‏26 ثانية) ⇒ إعادة البناء
   بـ`--max-old-space-size=900` ⇒ خروج 0 في 100 ثانية. لا يُلمَس `next.config`.
4. لا مطالبة بإغلاق P1-397: البوابة المشتركة ما تزال خروجها 1 بملاحظتين، وإحداهما قرار ملكية (P1-398).

**النتيجة المقيسة**: `allUnder60Chars` ‏1,322 ⇒ 1,298 · وسيط الشرح ‏24 ⇒ 25 والوسيط العام ‏28 ⇒ 29 ·
`feedback.under40Chars` ‏1,047 ⇒ 1,035 · A2 عند 72/168 · القرينة ‏39.28% بلا حركة · بصمة المحتوى
‏99f930237c10 · بصمة `offline:size` ‏90a27131fd55 مع full ‏5,649,071 · المنهاج ‏945,047 gzip ·
155 ملفًا / 1,019 اختبارًا · tsc صفر · lint صفر · `handoff:check` صفر · البوابة الصارمة خروج 1.

**ما لم يُعزَّ إلى قياس**: إعادة تشغيل Playwright (آخر قياس v143)، وأي «إغلاق» لبند الشرح قبل بلوغ الوسيط 60.

## دفعة v151 — الشرح لا يُرخي عدادًا، والقرار الذي لا يملكه المُنفِّذ (2026-09-20)

**السياق**: بعد دفعتَي A2 السابقتين (72 بندًا) بقيت البوابة الصارمة خروج 1 بملاحظتين؛ الدفعة الرابعة رفعت 24 شرحًا
أخرى (174–212 حرفًا) ونزولَ العدّاد 1,298 ⇒ 1,274 من 1,733 مع وسيط 30، فثبت أن الملاحظة الثانية قابلة للإنجاز
بالكتابة وحدها وأن الأولى ليست كذلك.

**القرار**:
1. المضي في M4 بمقاييسه نفسها (فاحص مدى + فاحص عبارة موضعية + فاحص تسمية حالة قبل التطبيق، و`set_expl.py` يتحقق من
   الطول السابق حرفيًا). التسع المخالفات في المسودة الأولى رُفِضت قبل الكتابة، لا بعد القياس.
2. **لا تُلمَس عتبة الإنتاجية**: `lessons:variant-worklist` يقيس 197 بندًا بإجابة وحيدة و0 قابلة للإضافة بثقة،
   والتوزيع (159 فراغًا / 36 ترتيبًا / 2 تصحيح) يثبت أن رفع 101 بندًا غير ممكن بتأليف بدائل، لأن الفراغ ذا الكلمة
   الواحدة لا يحتمل ثانيًا صحيحًا؛ ولو رُفعت البنود الـ38 لبقي 41.1%. فالخيار مطروح على المالك: إعادة تصميم فراغات،
   أو قياس المؤشر على البنود المفتوحة الإجابة مع سطر ADR، أو إبقاء البوابة حمراء. لا توسيع لـ`normalizeGermanText`
   ولا تخفيض للسقف في هذه الجلسة.
3. البيئة: تسلسل v150 مُطبَّق كما هو — بناء حتى `Compiled successfully` ⇒ إيقاف ⇒ تدفئة tsc (‏24.5 ثانية، خروج 0) ⇒
   بناء كامل خروج 0 في 71 ثانية، بلا سوابل وبلا تعديل `next.config`.

**النتيجة المقيسة**: ‏1,274 تحت الستين · وسيط 30 · `feedback.under40Chars` ‏1,031 · A2 عند 96/168 · قرينة ‏39.28% ·
حارس ‏15 درسًا · vitest ‏1,019 في 155 ملفًا · tsc صفر · lint صفر · `handoff:check` صفر · بوابة الجودة خروج 1 ·
بناء ‏321 صفحة · بصمة `offline:size` ‏8d3241e662dd (full ‏5,655,234) · بصمة محتوى ‏dac99157d91c · الكاش
`dwnb-full-pack-v151`.

**ما لا يُدَّعى**: لا إغلاق P1-397 ولا P1-398 ولا P1-399؛ ولا متصفح لهذا الجيل؛ ولا مراجعة بشرية؛ ولا نشر.


## ADR-080 — عقد التعليم الموقّع من المالك (v152): تسعون دقيقة، شهادة عامة، والتمريض طبقةٌ منسوجة لا منهجٌ ثانٍ

**القرار.** يوقّع المالك هذا العقد ويُنفَّذ على التصميم لا على العرض: (1) **تسعون دقيقة يوميًا** توزَّع خمسين للعمود الفقري (درس + استرجاع مؤجَّل) وخمسًا وعشرين لإنتاج شفهي مُسجَّل (تظليل ← إعادة قول ← إعادة المقطع الصعب وحده) وخمس عشرة لشكل الامتحان بوقته وعشرًا لدفتر الأخطاء؛ السبت محاكاة كاملة كل أسبوعين ومهارية في غيرها، والأحد راحة أو استرجاع خفيف يُقرَّره التطبيق بحسب الإنهاك لا كمكافأة. (2) **الشهادة عامة**: B2 من Goethe أو telc أو ÖSD، ولا صلات لها بالتمريض؛ الجهة **لم تُحسم**، فتُعتمد `telc` افتراضًا في قالب محاكاة السبت إلى أن يُتحقق من الصفحة الرسمية وتُثبَّت الوقائع بتاريخٍ ورابط — ولا تُتَّخذ صيغةُ الامتحان برأي. (3) **الانطلاق من الصفر** مع صدق الحساب: B1 مؤكَّد في اثني عشر شهرًا، وB2 عند أربع عشرة إلى ستّ عشرة شهرًا أو اثنتا عشرة مع فترة مكثّفة؛ ويُلغى تجميل الأرقام لملاءمة وعدٍ تسويقي. (4) **مسار التمريض طبقة منسوجة**: «توابل» في A1 وA2 (لا كلمة مهنية تدخل استرجاعًا ولا امتحانًا؛ تُعاد صياغة مادة المستوى في سياق الرعاية وحده)، و«طبقٌ ثانٍ» من B1 (كلمات مهنية تُحفظ وتُراجَع).

**القواعد الصارمة الثلاث.** (أ) **لا تُدخل الطبقة قاعدةً نحوية جديدة**: مشهدٌ تمريضي يحتاج لغةً أعلى من المستوى يُرحَّل إلى مستواه، ولا يُخفَّف شرحه ليلائم؛ ومن يقول «في لغة التمريض تختلف القاعدة» فقد أخطأ التأليف. (ب) **لا يجوز أن يتوقف الجواب الصحيح في تمرين لغوي على معرفة سريرية**: تمرينٌ يحتاج قرارًا طبيًا ليُحلّ فاسد عندنا، يُصلَح أو يُلغى — لأن التطبيق لا يملك سلطة الشهادة الإكلينيكية ولا يريد أن يظنّ أحدٌ أنه تعلّم مهنة من تطبيق لغة. (ج) **الطبقة بارasitasية لا حاملة**: إن حُذفت بقي مسار B2 العام كاملًا لا ينقصه شيء، ولكل دفعة ميزانيةٌ معلنة من الكلمات المضافة، و**قاطع رجوع**: إن قِيس انخفاضٌ في أداء مهام الامتحان العام تُخفَّض الطبقة وتُقدَّم الشهادة، لا العكس.

**الأمان يُبنى عادةً لا قاعدة.** عناقيد الأمان (أسماء الأدوية والوحدات، الطريق والتوقيت، تأكيد الأمر المسموع بصوت عالٍ، سؤالان قبل تنفيذ أمر مبهم، الإبلاغ عن خطأ) تُدرَّب بأن **تُفشِل بيئةُ التمرين التخمينَ وتُنجِح التأكيد**، لا بأن تُكتب قائمةَ قواعد تُحفظ وتُمتحَن؛ وتُدرَّج: تعرّفٌ في A1، تأكيدٌ في A2، سؤالٌ ورفضُ غموض في B1، توثيقٌ وكتابةٌ في B2. وكل وحدة تمريضية تحمل سطرًا صريحًا: **هذه صياغات لغوية لا إرشاد سريري**.

**ما لا يُدَّعى، ولا يُجمَّل.** لا تصحيحَ نطق يُعتدّ به ولا حكمَ بشري على الطلاقة؛ والمحتوى **لم يراجعه بشرٌ متحدّث** (0 من 3,277) بل دُقّق آليًا، والطبقة التمريضية تزيد هذا الدين **مراجعةً مهنية** لا تُدفن؛ والطريق غير اللغوي (الاعتراف بالشهادة الأجنبية وجهةُ الاختصاص في الولاية) ليس شغل التطبيق ولا يوقّع التطبيق نيابة عن جهة. **قيود قائمة لا تُلغى بهذا العقد**: لا تخفيف لسقف 25% في `lesson:quality` ولا توسيع لـ`normalizeGermanText` ولا بدائلَ `acceptedAnswers` تختلف عن المفتاح بحرف كبير أو علامة ترقيم؛ وبما أن البوابة تخرج 1 بملاحظتين (50.9% ووسيط 25) فلا يُنقل P1-397 ولا P1-398 ولا P1-399 إلى `partial`/`implemented`. **بناءُ الطبقة التمريضية لم يبدأ في هذا الجيل**: v152 وثّق العقد وكتب دفعة الشروح الخامسة في A2 (24 بندًا ⇒ `allUnder60Chars` ‏1,274 إلى **1,250**)، ولمسار الطبقة جلسةٌ قادمة تُبنى فيها السجلّات والنصوص والأصوات. الكاش `dwnb-full-pack-v155`، وبصمة المحتوى **d0c2079d038f**، وبصمة `case:audit` ‏167645dd621b دون تحرك.

## ADR-081 — دفعة تحسين الشرح تُجمَع من «جماعة الوسيط» لا من قائمة التدقيق، وبانيُها يقرأ من المستودع (v153، 2026-09-20)

**الحالة.** مقبول، نافذ من الجيل `v153`.

**السياق.** خمس دفعات جُمِعت من `feedback.allUnder60Chars` (سكان 1,733 بندًا)، فحرّكت العدّاد فعلاً (1,322 ⇒ 1,250) لكن `explanationMedianChars` بقي **25** جيلًا بعد جيل، لأن الوسيط يُحسب على جماعة أضيق: تمارين `multiple-choice` + أسئلة القراءة + أسئلة الاستماع + `miniTest` (= 1,250 بندًا). القياس الطازج عند `v153`: رفعت الدفعة 24 نصًّا فلم يدخل الجماعة إلا **2**، فالمسافة إلى 60 تحرّكت 464 ⇒ 462. كما سقطت دفعةٌ سابقًا لأن بانيها كان يحمل أطوالًا مكتوبة باليد، فأخطأ في اسم حقلٍ واحد، وكادت صياغة «بالمعنى فقط» تمحو اسمَي الحالتين من شرح ممارسة مُتحكَّم فيها.

**القرار.**
1. تُجمَع كل دفعة شروح من **جماعة الوسيط نفسها** عبر `/home/user/tmp/pick_median.ts <n> <stage|any>`؛ لا تُجمَع من `scratch/expl_detail.ts` إلا لمؤازرة القياس، ويُذكَر في سجلّ الجيل أن العكس يعني تقدّمًا صفرِيًا في البوابة.
2. لا طولَ يُكتب يدويًا: بانيُ الدفعة (`tmp/a2e6.py` كنمط) **يقرأ `explanationAr` الحيّ من المستودع** لكل معرّف، ويطبّق على نسخة في /tmp، ولا يُقرّ الفرق إلا بعد إعادة قياس.
3. مفاتيح بيانات الدروس **غير منقّطة**؛ فكل مطابقة نصية تستعمل `explanationAr"?\s*:\s*"`، ويُحدّ لكل عنصرٍ مقطعُه بحدّ العنصر التالي (`[{,]\s*"?id"?\s*:`) حتى لا يتسرّب شرحٌ إلى جاره.
4. قبل التطبيق يفرض الباني: (أ) مدى الطول المعلَن، (ب) `CASE(old) ⊆ CASE(new)` فلا تُمحى إشارة إعرابية، (ج) بلا ألفاظ موضع (الأول/الثاني/الأخير/الموضع/المرتبة) إذا كانت خياراتٍ حرفية في السؤال، (د) لا مساس بالسقف ولا بالمُطبِّع ولا بأطوال الخيارات.
5. يظلّ الهدف مُعلَنًا كما هو: وسيط ≥60 لا يعني إغلاق P1-399، والبند لا يُنقل من `not-implemented` قبل بلوغ الوسيط؛ وبوابة `lesson:quality:audit` تبقى خروجها 1 ما دامت ملاحظتا 50.9% و25 قائمة، وتُغلَّف الملاحظات كما هي بلا تطبيع.

**البدائل المرفوضة.** (1) تسريع الدفعة بجعلها 48 أو 96 بندًا دون تغيير الجماعة — يرفع العدّاد الأوسع ولا يحرّك البوابة؛ (2) نقلُ كلّ شرح قصير أينما وُجد بلا اختيار مقاس — يهدّد بإسقاط إشارات إعرابية (حدث في `v152`)؛ (3) تخفيفُ السقف إلى 40 حرفًا أو توسيع `normalizeGermanText` — ممنوع بقرار المالك؛ (4) اعتبارُ `reports/*.json` دليل حالة — ثبت أنه يبقى أخضر قديمًا حين ترجع `src/data`.

**العواقب.** الوتيرة المتوقعة موثّقة: ≈ **18 دفعة** بـ24 للوصول إلى الوسيط 60 إذا اختيرت من جماعة الوسيط، بدل «20 دفعة» كانت تُقاس على أساس أن كل دفعة تحرّك 24 بندًا في الوسيط. وتصبح بوابة الطول قابلة للتوقّع جيلًا بجيل، فيُسجَّل في كل سجلّ جيل الرقم قبلَ وبعدَ القياس لا قبلَه فقط.

## ADR-082 — حزمة التسليم تُغلَّف مسطّحة، والرفع بالأمر الموثّق في المستودع لا بأمر مرتجل (v153، 2026-09-21)

**الحالة.** مقبول، نافذ من الآن على كل تسليم.

**ما وقع (قيس، لا رِواية).** كانت الحزمة التوليدية تُبنى من `/home/user` على المجلد نفسه، فكل مدخل يبدأ بـ`der-weg-nach-berlin/`. وأداة الرفع الموجودة في المستودع — `TERMUX_REPLACE_REPO.sh` التي يستدعيها `TERMUX_ONE_COMMAND.txt` — تستخرج نفسها بالاسم المجرّد:

```bash
unzip -jo wegberlin-full.zip TERMUX_REPLACE_REPO.sh -d "$HOME/wegberlin-upload-tools"
```

مع الغلاف هذا يفشل: `caution: filename not matched` وخروج **11** (أُعيد تشغيله على الحزمة الحقيقية للتأكد). ولأن الدور كان يسلّم أيضًا أمرًا مرتجلًا (`git init` + `git add -A` من مجلدٍ يحوي الغلاف ثم `push -f`)، انتهَى المطاف بـ`main` يحمل **مجلدًا واحدًا** `der-weg-nach-berlin/` وملفات المشروع داخله، أي عمليًّا: استبدال جذر المستودع وغلق ما كان فيه. الخطأ خطأ الأمر المرتجل وخطأ بنية الحزمة، لا خطأ Termux.

**القرار.**
1. **البنية مسطّحة**: `zip -qr "$OUT" . -x …` من **داخل** جذر المشروع. لا يُقبَل أي مدخل يبدأ بـ`der-weg-nach-berlin/`، ويُتحقَّق بذلك آليًّا في فاحص الحزمة (`tmp/checkflat153.py`: عدد المدخلات، مطابقة بالبايت لـ34 ملفًا مفتاحيًا، صفر مدخل محظور، **إعادة تشغيل اكتشاف جذر المشروع كما تفعل أداة الرفع** ⇒ يجب أن يكون البادئة `""`).
2. **الرفع بالأمر الموثّق وحده**: `TERMUX_ONE_COMMAND.txt` ⇒ `TERMUX_REPLACE_REPO.sh`: يستنسخ `main` القائم (فيحفظ تاريخه و`origin`)، يحذف ملفات المشروع مع الإبقاء على `.git` وحده، ينسخ الجذر المكتشف **بما فيه الملفات المخفية** (`.gitignore`، `.githooks/`، `.github/workflows/`)، ينظّف المولَّد/الخاص (`node_modules`, `.next`, test-results, `.env*`, `tsconfig.tsbuildinfo`, `*.dwnb`)، يبني قوالب العمل من `deployment/`، يشغّل `scripts/audit-secrets.mjs --working-tree --history --require-history`، ثم يدفع **دفعًا عاديًا بلا `--force`**.
3. **ممنوع**: ارتجال `git init` + `git add -A` فوق مجلد ظرف؛ وممنوع تمرير PAT في رابط الدفع في الأمر الموصى به (`TERMUX_GITHUB_UPLOAD.md`: لا PAT في محادثة ولا ملف ولا أمر ظاهر؛ السكربت يستخدم `GIT_ASKPASS` مؤقتًا و`gh api user` للتحقق من ملكية المفتاح). فإن طُلب أمر سطر-واحد بـ`$PAT` صراحةً، يُذكَر هذا القيد في نفس الرسالة ولا يُجعَل افتراضًا.
4. **الحذر من «أخضر بلا قياس»**: `reports/*.json` قد يبقى من جيل أحدث بينما ترجع `src/data`؛ والدليل قياسٌ طازج من `npm run lesson:quality` بعد `npm ci` (بدون `node_modules` تفشل الأداة بصمتٍ تقريبـي «tsx: not found» ويُقرأ التقرير القديم).

** البدائل المرفوضة.** (أ) إبقاء الغلاف وإصلاح الأمر المرتجل بحذفه يدويًا — يترك أداة الرفع الموثّقة مكسورة لكل مستخدم؛ (ب) إضافة `mv` داخل `TERMUX_REPLACE_REPO.sh` — السكربت يكشف الجذر أصلًا، والعيب في بنية الحزمة لا في الكشف؛ (ج) `push -f` بجذرٍ خاطئ لإصلاح الجذر — يهدد تاريخ `main`؛ (د) توثيق الأمر الصحيح في رسالة دردشة فقط — يضيع مع الجيل التالي، فوُثّق في §3 و§12 و`PROJECT_STATUS.md` و`docs/AGENT-HANDOFF-PROMPT-AR.md` والوثيقة الاحتياطية.

**العواقب.** كل جيلٍ يبدأ بالتغليف يعيد فاحص البنية؛ والتسليم الذي يستلزم تغيير البنية يعدّل `tmp/checkflat153.py` (لا يُترك فاحصًا صامتًا). وعند رجوع الشجرة صار **مصدر الاستعادة موثَّقًا**: `git clone --depth 1 https://github.com/naderba69/wegberlin.git` ثم `cp -a …/src/data/. src/data/` (استُعمل هذا الدور نفسه: رجعت البيانات إلى حالة v149، فاستُعيدت من `main` إلى 1,274 ثم أُعيدت الدفعتان #5 و#6 فقيست 1,226 / 1,019 / 39.28% وTOTAL 24).


## ADR-083 — بنيةُ التسليم أداةٌ في المستودع لا تعليماتٌ في الردّ (v155، 2026-09-21)

**الحالة.** مقبولة ومنفَّذة.

**السياق.** فشل نشر Vercel عند `368d6e8` بـ«Couldn't find any `pages` or `app` directory. Please create one under the project root» لأنَّ `main` دُفع من أرشيفٍ **ملفوف** عبر أمرٍ مرتجل (`git init` + `add -A` + `push -f`) بلا فحص بنية، فأصبح جذر المستودع حاويةً (`git ls-files` يُرجع `der-weg-nach-berlin` وحده). وبالتوازي كان تراجعُ الالتقاطة قد أعاد أرشيف `/home/user/wegberlin-full.zip` إلى البايتات القديمة بينما يبقي sidecar بصمة الجيل، فصار «التسليم الصحيح» كاذبًا بعد دقائق من التحقق.

**القرار.** لا يُترَك انضباطُ البنية للنصّ: (1) `npm run archive:delivery` يبني الأرشيف من جذر المشروع ويرفض أيَّ عضوٍ تحت مجلد ظرف وأيَّ فقدانٍ لتسعة ملفات حرجة في الجذر، ويكتب `wegberlin-full.zip.sha256` ويعيد التحقق منه ومن `unzip -t`؛ (2) `TERMUX_REPLACE_REPO.sh` يفحص البنيةَ **قبل** أيّ commit ويرفض جذرًا فيه `der-weg-nach-berlin/`، ويذكر أن Root Directory في Vercel = جذر المستودع؛ (3) `tests/unit/delivery-layout.test.ts` يثبّت ذلك (ومنه: لا نمط `.gitignore` يبتلع `src`/`app`، و`vercel-build` إن وُجد فليكن `npm run build`)؛ (4) يُعاد `sha256sum -c` على الأرشيف **عند التسليم** لا قبله بدقائق.

**البدائل المرفوضة.** (أ) إبقاء الغلاف وإصلاح الأمر المرتجل بحذفه يدويًا — يترك أداة الرفعة هي الضحية التالية؛ (ب) توثيق «سطّح الأرشيف» في الردود فقط — ثبت أنها تفشل تحت الضغط؛ (ج) تجاهل فحص `unzip -Z1 | grep -c '^src/app/'` لأنه «تحصيل حاصل» — هو بالضبط ما كان سينكشف به الغلاف.

**العواقب.** كل جيل يبدأ بالتغليف يمرّ بفاحص البنية؛ وأيّ تسليم يستلزم تغيير البنية يُصلَح في الأداة لا في الرد. وكُشف أثناء Replay خطأٌ كامن في `TERMUX_REPLACE_REPO.sh`: `printf … | grep -q` مع `set -o pipefail` يعيد 141 عند أول مطابق فيرفض أرشيفًا سليمًا («missing package-lock.json») — استُبدل بحلقات `zip_has_entry`/`zip_has_any_entry_matching` على here-string (وهو يزيل كذلك موافقةً خاطئة صامتة على وجود `.git/`).

**ما يبقى غير مُتحقَّق منه.** إعادةُ النشر على Vercel بعد دفع هذا الجذر المسطّح، وضبطُ Root Directory في إعدادات المشروع — كلاهما خارج هذه البيئة.


## ADR-084 — عرضُ الإجابات المقبولة يُقاس بعد التطبيع، والحشو بوابةٌ صلبة (v157، 2026-09-23)

**الحالة.** مقبولة ومنفَّذة.

**السياق.** بند P1-398 كان يقيس «تعدد البدائل المقبولة» بطول المصفوفة `acceptedAnswers`، فبدت الشجرة أرحب مما هي: **1,039 تمرينًا من 1,250** تحت ستين حرفًا في الشروح، و**190 من 387** تمرينًا إنتاجيًا يبدو متعدد الإجابات. الفحص كشف أن كثيرًا من هذه البدائل **لا يمكن أن تُطابَق أبدًا**: `normalizeGermanText` تُسوّي الحالة والترقيم قبل المقارنة، فأيُّ بديلٍ لا يفارق المفتاح إلا بحرفٍ كبيرٍ أو نقطةٍ أو مسافةٍ هو **تكرارٌ ميت** يرفع العدد ولا يزيد احتمال قبول جواب المتعلّم.

**القرار.** (1) يُقاس العرض على **مجموعة الأشكال المتمايزة بعد التطبيع** (`distinctAcceptedForms`)، لا على الطول؛ (2) أيُّ بديل مطابق لمفتاحٍ آخر بعد التطبيع يُصنَّف `noOpAcceptedVariants` ويُمنع ببوابة **0** (`npm run accepted:answers`، والفحصُ داخل `handoff:check`، والعددُ داخل `reports/lesson-quality-audit.json` كـ`acceptedAnswerHygieneVersion` و`noOpVariants` و`singleAcceptedString` و`sharePct`)، فيسقط الحشو **وقت التأليف** لا بعد المراجعة؛ (3) الرقم الأمين يُنشَر كما هو: **338 من 387 = 87.3%** بسلسلةٍ مقبولةٍ واحدة، لا يُرقَّع ولا يُعاد تعريفه؛ (4) التطبيع نفسه **لا يُوسَّع** — لو قبلنا `ß`=`ss` لصار العرض رقمًا بلا معنى، وهو مرفوض كما في ADR-078.

**البدائل المرفوضة.** (أ) توسيع `normalizeGermanText` حتى يبتلع حروفًا مختلفة — يحوّل مشكلة قياسٍ إلى مشكلة صحّة تقييم؛ (ب) إضافة 150 بديلًا ميتًا لتضخيم الرقم — ثبت أنها لا تُقبَل عند التصحيح أصلًا؛ (ج) إبقاء القياس على الطول مع سطر توثيقي — يُبقي البوابة قابلة للخداع بأصفارٍ وبمسافات.

**العواقب.** `singleVariantSharePctMax` بقي 25% ولم يُخفَّض، والبوابة تخرج 1 كما كانت (87.3% مقابل السقف) — أي أنّ البند **تبقّى مفتوحًا بقرارِ مالكٍ** لا بحشو. وما لم يُحسم بعد: هل يُعاد تصميم الفراغات لتقبل مرادفًا حقيقيًا، أم يُقاس المؤشر على الأسئلة المفتوحة وحدها بسطر ADR. التفاصيلُ والأدوات وسجلُّ الدفعة في `docs/run-logs/2026-09-23-accepted-answer-hygiene/README.md`.


## ADR-085 — طبقةُ التمريض منسوجةٌ لا منهجٌ ثانٍ: ثلاث قواعد تُقاس، وقاطعُ رجوعٍ، وصفرُ أثرٍ على الإتقان (v158، 2026-09-23)

**الحالة.** مقبولة ومنفَّذة (14 وحدة: A1 4 · A2 4 · B1 3 · B2 3).

**السياق.** عقد المالك v152 (ADR-080) قرَّر طبقةً تمريضية منسوجة («توابل» في A1/A2 و«طبق ثانٍ» من B1)، لكن الطبقة **لم تكن مبنيةً**: لا سجلَّ ولا مدقّقًا ولا واجهةً ولا حرّاسًا. والقواعدُ الثلاث المكتوبة في الوثيقة كانت قابلةً للانزلاق بصمت، خصوصًا «لا معرفة سريرية في تمرين لغوي» و«الطبقة طفيلية لا حاملة».

**القرار.** (1) كل وحدة تُسمّي كتل القاعدة التي تعيد استعمالها من درسها، ومرجعٌ لا يُحلّ ⇒ فشل؛ (2) لكل وحدة **فعلٌ لغوي واحد مقبول** (‏A1 `recognize` · A2 `confirm` · B1 `ask` · B2 `document`)، مع **خيار تخمين إلزامي تُفشِله البيئة**، ورفضُ أي خيارٍ صحيح يقرأ كتعليمة على جسمٍ أو جرعة؛ (3) المدقّق يعدّ مستوردي الطبقة ويرفض أي مستوردٍ غير مُعلَن وأيَّ ذكرٍ لها في `exams`/`lessons`/`evidence`/`review`/`assessment`/`diagnostic` ⇒ الحذفُ بملفٍ واحد ممكن؛ (4) قاطع الرجوع `nursing-layer-rollback-v1`: انخفاضُ 5 نقاط في أداء مهام الامتحان العام خلال 14 يومًا ⇒ تخفيضُ الطبقة وتقديمُ الشهادة؛ (5) `masteryEffect/evidenceEffect/gateEffect = none` في الواجهة والاختبارين (وحدةٌ + متصفح)؛ (6) الكلمات المهنية تُصدَّر بـTSV بترويسة الاستيراد الشخصي نفسها ولا تكتب الطبقة في التخزين.

**البدائل المرفوضة.** (أ) تمارينُ تمريضية داخل `lessons-*.ts` ⇒ تلوّث عدّادات المحتوى وتجعل الحذف جراحة؛ (ب) قائمةُ قواعد سلامةٍ تُحفظ ⇒ يخالف نصّ العقد («عادة لا قاعدة»)؛ (ج) مرشدُ AI سريري ⇒ يخرق صفرَ التكلفة ويفتح باب ادّعاء معرفة سريرية؛ (د) إغلاقُ البند بنجاح الفحوص ⇒ مرفوع؛ يبقى `pending-nursing-professional` مع 0 مراجعة باسم ممرّض أو مدرّب.

**العواقب.** السطر «هذه صياغات لغوية لا إرشاد سريري» على كل وحدة، وفشلُ التدقيق إن غاب من واحدة؛ و**دَينُ المراجعة البشرية يزيد** بـ14 وحدة معلّقة، ولا يُستخدم لإثبات تدريب مهني أو تأهيل أو اعتماد. الطبقةُ لا تلمس بوابات المستويات ولا الامتحانات ولا الإتقان، واختبار المتصفح يقيس ذلك من الحالة المخزّنة لا من النصّ.
