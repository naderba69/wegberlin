# Architecture Decisions

Sync batch: v262 · 2026-10-21 · كلمات غوته B1 لأربعة محاور أخرى (ADR-153): أُضيفت 80 كلمة إلى أربعة دروس موجودة: الرأي والشك والموقف (b1-02)، والناس والأماكن في العمل (b1-04)، والمهن والمؤهلات (b1-14)، والأشكال والرسوم في العرض (b1-15). لكل كلمة عبارة وبطاقة بجملة مثال، و59 اسمًا موثّقًا كلها بـWiktionary، وتمرين مطابقة لكل درس، فصارت B1 ‏2352/2830 (83.1%) بعد إعادة عدّ كاملة من ملف غوته الأصلي (طريقة العدّ المختصرة كانت تزيد الرقم قليلًا، فصُحّحت). لم يُرفع أي سقف، والمتبقي من سقف المنهج الآن 6,726 بايت. صحّح التدقيق قبل الحفظ ترجمة mittlerweile وجملتي مثال وشرحًا واحدًا، وأضاف إلى وصف حزمة المراجعة اسم ملف التحقق الخاص بدفعة v261 الذي كان ناقصًا.

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

Current P2-352 decision: `neutral-self-waveform-comparison-v1` provides a temporary, same-origin/on-device visual outline from 48 amplitude peaks per clip, independently normalized to each clip's own peak, with no alignment, similarity/pronunciation/quality score, upload, persistence, or evidence effect. Limits: 60 seconds and 4 MB per clip. Full rationale: [ADR-112](docs/adr/ADR-112-neutral-waveform-self-comparison.md).

Prior P2-355 decision: `local-test-generator-v1` uses only published authored mini-tests, samples at most one item per lesson, reveals feedback after explicit submission, and never stores answers or changes learner evidence. The route and statically bundled banks are included in every Offline pack. Full rationale and review boundary: [ADR-111](docs/adr/ADR-111-local-authored-mini-test-practice-generator.md).

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

**القواعد الصارمة الثلاث.** (أ) **لا تُدخل الطبقة قاعدةً نحوية جديدة**: مشهدٌ تمريضي يحتاج لغةً أعلى من المستوى يُرحَّل إلى مستواه، ولا يُخفَّف شرحه ليلائم؛ ومن يقول «في لغة التمريض تختلف القاعدة» فقد أخطأ التأليف. (ب) **لا يجوز أن يتوقف الجواب الصحيح في تمرين لغوي على معرفة سريرية**: تمرينٌ يحتاج قرارًا طبيًا ليُحلّ فاسد عندنا، يُصلَح أو يُلغى — لأن التطبيق لا يملك سلطة الشهادة الإكلينيكية ولا يريد أن يظنّ أحدٌ أنه تعلّم مهنة من تطبيق لغة. (ج) **الطبقة باراسيتية لا حاملة**: إن حُذفت بقي مسار B2 العام كاملًا لا ينقصه شيء، ولكل دفعة ميزانيةٌ معلنة من الكلمات المضافة، و**قاطع رجوع**: إن قِيس انخفاضٌ في أداء مهام الامتحان العام تُخفَّض الطبقة وتُقدَّم الشهادة، لا العكس.

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

## 2026-10-09 — telc point distribution: a second official source corroborates the per-part values; the open fact stays open

The telc.net B2 page links two official PDFs: the 2019 Handbuch and the 2020 `Deutsch_B2_tipps_zur_Pruefungsvorbereitung.pdf` (6. Auflage, © 2020 telc gGmbH). The tips booklet states the per-task scores in its task descriptions: Leseverstehen 1 = 5 × 5 (25), Leseverstehen 2 = 5 × 5 (25), Leseverstehen 3 = 10 × 2.5 (25), Sprachbausteine 1 = 10 × 1.5 (15), Sprachbausteine 2 = 10 × 1.5 (15), Hörverstehen 1 = 5 × 5 (25), Hörverstehen 2 = 10 × 2.5 (25), Hörverstehen 3 = 5 × 5 (25), and Schriftlicher Ausdruck = 45 (criteria A/B/C/D worth 5/3/1/0 each, summed and multiplied by 3). These match the figures already pinned from the 2019 mock (Teilergebnis I 225, Sprachbausteine 15/15). They do not establish the 2026 edition: the booklet is dated 2020, and the oral section (chapter 7, which contains the 75-point scoring and the 135/45 pass rule) was not in the text the tools could read.

Decision: `telc-b2-point-distribution` stays an open fact, unchanged in `src/config/exam-format-evidence.json`. What is now corroborated is the written structure across two official telc editions (2019 mock and 2020 tips). What remains open is the currency for 2026, which still needs a telc-dated 2026 score table, a written confirmation from a licensed centre, or the queued human review. No app behaviour changed.

## 2026-10-09 — telc point distribution: owner decision on the working basis

The owner reviewed the evidence above and chose to use the official 2019 mock values and the 2020 tips booklet as the working basis for telc Deutsch B2 (225 written with Lesen 75, Sprachbausteine 30, Hören 75, Schreiben 45; 75 oral; pass at 135 and 45). This is a usage decision, not a currency verification: the 2026 edition is still not confirmed by a telc-dated source. `telc-b2-point-distribution` stays an open fact in `src/config/exam-format-evidence.json` and in the official-format audit, and the gap is labelled in the app as unverified for 2026.

## ADR-116 — طبقة دليل `source-verified-agent`: إغلاق البنود البشرية القابلة للحسم بمصادر منشورة (v225، 2026-10-17)

**الحالة.** مقبولة بقرار المالك ومنفَّذة على P0-98 وP0-99.

**السياق.** كانت القاعدة السابقة في `P0_AUDIT.md` تنص على أن «لا يُغلق أي بند بشري بالأتمتة». في 2026-10-17 قرر المالك صراحة في المحادثة: «الخطط التربوية توثقها المدارس والمراجع وهي موجودة في النت — كل ما تحتاج بشريًا ابحث ستجد مصادره، أنت ستغلق كل ما هو بشري».

**القرار.**
1. يُغلق كل بند يمكن حسم سؤاله بمصادر منشورة بطبقة دليل اسمها `source-verified-agent`. الوكيل يقارن كل سجل بمصدر خارجي مسمّى ومؤرخ: قاموس، أو قائمة تعليمية منشورة، أو قاعدة نحوية موثقة، أو موقع رسمي. وكل خطأ يظهر يُصلح في المحتوى نفسه.
2. يُحفظ الدليل في ملفات CSV صفًّا بصف (السجل، والنتيجة، والمصدر، وتاريخ الفحص)، مع تقرير يذكر الروابط.
3. **حدود صريحة:** هذه الطبقة ليست مراجعة بشرية مستقلة ولا توقيعًا ولا اعتمادًا لغويًا. لا تُكتب أسماء مراجعين، وتبقى خانات `reviewerName` وما يتبعها، وحالة `authored-review-pending` في الاستبعادات، فارغة كما هي، ولا يقرؤها أي فاحص كإغلاق.
4. لا تغلق المصادر ما يحتاج دليلًا حسيًا أو جهازًا أو مشاركين: الاستماع البشري لصوتنا (P0-135)، والتقنيات المساعدة والأجهزة الحقيقية (P0-255 وP1-331 وP2-264)، وتجربة المتعلمين (P2-371)، والتدقيق الخارجي من طرف ثالث (P2-360). لهذه البنود تُقدَّم بدائل تقريبية موسومة كذلك، ولا تُدّعى.

**البدائل المرفوضة.** (أ) كتابة اسم مراجع أو توقيع ⇒ تزوير؛ (ب) ملء أعمدة المراجعة في الحزمة ⇒ يخلط الدليل المصدري بالتوقيع البشري؛ (ج) إبقاء البنود مفتوحة رغم قرار المالك ورغم وجود مصادر ⇒ يخالف التفويض ويعطّل إصلاح الأخطاء.

**العواقب.** في v225 أظهر التحقق المصدري 10 أخطاء حقيقية وأُصلحت: 6 أسماء و4 أطر، منها ملاحظة تعلّم المتعلم الحالة الخاطئة لـ«sich halten an». وصار P0 = 118 منجزًا و6 جزئية. والمراجعة الألمانية المستقلة تبقى مستحسنة وغير شرط.

## ADR-117 — التحقق المصدري للدعم التونسي ووضوح الشرح العربي (v226، 2026-10-17)

**الحالة.** مقبولة ومنفَّذة على P0-373 وP0-376 وP2-384، تحت طبقة `source-verified-agent` في ADR-116.

**السياق.** الملاحظات التونسية الـ17 (`tunisian-support-v1`) كانت كلها `authored-review-pending`، وكان P0-373 وP0-376 جزئيين بانتظار مراجعة تونسية/فصحى مستقلة. وكان P2-384 (وضوح الشرح العربي في تونس وبقية العالم العربي) جزئيًا. قرر المالك في 2026-10-17 أن تُغلق البنود البشرية القابلة للحسم بمصادر منشورة.

**القرار.**
1. يضاف إلى `TunisianReviewStatus` وفي مخطط Zod قيمة ثالثة هي `source-verified-agent`، مع حقلين: `sourceVerifiedAt` (تاريخ الفحص) و`sourceRefs` (معرّفات من `TUNISIAN_SOURCES`). المدقق يرفض الملاحظة إذا كانت بهذه الحالة وفيها `reviewedBy` أو `reviewedAt`، أو بلا تاريخ، أو بلا مصدر، أو بمصدر غير مسجّل. ويرفض أيضًا أي دليل مصدري على ملاحظة لا تحمل هذه الحالة.
2. قوبل الجانب التونسي في كل ملاحظة بمراجع نحوية منشورة:
   - Lingualism، وتمثّل لهجة تونس العاصمة.
   - Peace Corps «Spoken Tunisian Arabic».
   - معجم الأفعال لمحمد باشا.
   - فصل المبني للمجهول في مواد جامعة Wisconsin.
   - ورقة ACL I13-1048.
   - Ithaca Bound Languages.
   - Wikipedia مصدرًا ثانويًا فقط، لأن مقالة الصرف التونسي عليها تنبيه منذ يونيو 2026 بأنها قد تحتوي نصًّا مولّدًا آليًا.
3. أربعة تحسينات في المحتوى ظهرت من المصادر:
   - a1-01: إضافة «شِسمك؟»، وأن كلمة السؤال قد تأتي في آخر الجملة («احنا وين؟»)، مع التنبيه إلى أن «Du wohnst wo?» لا يصلح إلا سؤال استغراب أو تأكيد.
   - a1-04: إضافة «الكتاب متاعي» (متاع بعد اسم معرّف).
   - a2-08: «تصلحلي» بدل «تناسب»، لأن «تناسب» أقرب إلى الفصحى منها إلى الكلام التونسي.
   - b1-04: بناء المجهول التونسي بالسابقة «تـ» («الخدمة تعملت»، «التفاحة تاكلت») مقابل تغيير الحركات في الفصحى.
4. **التنوع داخل تونس (P0-376).** للتونسية ست لهجات جهوية متفاهمة: تونس العاصمة، والساحل، وصفاقس، والجنوب الغربي، والجنوب الشرقي، والشمال الغربي. والقاف تُنطق [q] عند الحضر و[g] عند ذوي الأصل البدوي. تستعمل الملاحظات نحوًا تونسيًا عامًّا تثبته المصادر:
   - «نـ» للمتكلم.
   - «ما…ش» للنفي.
   - «متاع» للملكية.
   - «تـ» للمجهول.
   - «اللي» للوصل.

   وتتجنب النطق الخاص بجهة واحدة، وتعرض الترتيب المتغيّر خيارًا لا قاعدة. ولوحة المتعلم تذكر الجهات الست.
5. **وضوح الشرح العربي (P2-384).** يفحص `tests/unit/arabic-msa-clarity.test.ts` كل نص عربي في `src/data`، أي أكثر من 24 ألف سلسلة، ما عدا سجل الملاحظات التونسية. يرفض علامات اللهجات التونسية/المغاربية والمصرية والشامية والخليجية، ويفرض نظامًا واحدًا لأسماء الأشهر (يناير…ديسمبر، الأقرب إلى الأسماء الألمانية). كانت النتيجة صفر مخالفات. أما الكلمتان «نحب» و«فما عليكِ إلا» فهما فصيحتان ومستثناتان عمدًا.

**الحدود.** هذا ليس مراجعة بشرية تونسية أو فصحى مستقلة: لا اسم مراجع ولا توقيع، و`independentlyReviewed = 0`. والمراجعة البشرية تبقى مستحسنة وغير شرط.

**البدائل المرفوضة.**
- (أ) وضع `independently-reviewed` مع اسم ⇒ تزوير.
- (ب) إبقاء البنود جزئية رغم وجود مصادر وقرار المالك.
- (ج) نسبة صيغة إلى جهة بعينها بلا مصدر. حُذفت لهذا السبب عبارة أولية تخص «آش» في صفاقس بعد أن تبيّن أن «شـ/آش» عامة.

**العواقب.** صار P0 = 120 منجزًا و4 جزئية (124، 135، 255، 301)، وP2 = 134 منجزًا و6 جزئية وبندان غير منجزين.

الدليل: `reports/tunisian-source-verification/TUNISIAN_SOURCE_VERIFICATION_2026-10-17.md` و`tunisian-notes-2026-10-17.csv`.

## ADR-118 — التحقق المصدري الرسمي للسياقات القنصلية والقانونية العامة (v226، 2026-10-17)

**الحالة.** مقبولة ومنفَّذة على P1-377، تحت طبقة `source-verified-agent` في ADR-116.

**السياق.** يضم `general-consular-legal-claims-v1` اثنتي عشرة جملة تدريب. تغطي ستة سياقات: القنصلية والسفر والدراسة والعمل والإقامة والإحالة القانونية. كانت كلها `specialist-review-pending` بلا أي مصدر (`sourceRefs:[]`)، وتعليماتها عامة مثل «تحقق من الجهة الرسمية» دون تسمية القناة.

**القرار.**
1. يُسجَّل `CONTEXT_OFFICIAL_SOURCES` ويضم 11 مصدرًا رسميًا أو عامًّا فُحصت في 2026-10-17:
   - بوابة الخدمات القنصلية للخارجية الألمانية، مع أداة Konsulatfinder.
   - صفحتا Your Europe لحقوق ركاب القطار والطائرة.
   - Schlichtungsstelle Reise & Verkehr، وهو الاسم الجديد لـ«söp».
   - المركز الأوروبي للمستهلك في ألمانيا.
   - DAAD وuni-assist.
   - Faire Integration: يعمل منذ 2026-01-01 وفق § 45b AufenthG بتمويل وزارة العمل الاتحادية BMAS.
   - BAMF-NAvI: الاختصاص بحسب مكان السكن لا مكان الوجود الحالي.
   - § 58 VwGO: لا تبدأ مهلة الاعتراض إلا بعد بيان كتابي، وإلا فالمهلة سنة.
   - § 1 BerHG: Beratungshilfe لذوي الدخل المحدود.
2. لكل جملة الآن `sourceRefs` و`sourceVerifiedAt` والحالة `source-verified-agent`. وأُعيدت كتابة تعليمات التحقق العربية لتسمّي القناة الرسمية بدل الإحالة العامة.
3. تبقى `officialClaimStatus = not-claimed`: لا تقرر المنصة إجراءً ولا أهلية ولا مهلة ولا حق تعويض، وحدود `general-language-practice-not-legal-consular-or-eligibility-advice` قائمة. المدقق يرفض أي جملة بلا مصدر مسجل أو بلا تاريخ.
4. تعرض بطاقة «دورة المحتوى» في الإعدادات قائمة قابلة للطي: الجملة الألمانية، والتعليمة، وروابط المصادر، مع تنبيه بأن الإجراءات تتغير وأن المرجع هو الصفحة الرسمية الحالية.

**الحدود.** ليست مراجعة محامٍ أو جهة قنصلية مختصة. لا اسم مراجع ولا توقيع، و`reviewerId` يبقى دورًا لا شخصًا. والروابط قد تتغير: رابطان فُحصا وأعادا 404 (صفحة BAMF القديمة لأداة البحث عن مكتب الأجانب وصفحة Hochschulkompass)، فاستُبدل بهما المصدران الحاليان.

**البدائل المرفوضة.**
- (أ) سرد قوائم وثائق أو مدد معالجة ⇒ تتغير حسب البعثة والغرض، وتصير ادعاءً رسميًا.
- (ب) إبقاء التعليمات العامة رغم وجود قنوات رسمية مسمّاة تفيد المتعلم.
- (ج) تسمية مكاتب محاماة أو خدمات تجارية.

**العواقب.** صار P1 = 132 منجزًا و3 جزئية (92، 331، 380).

الدليل: `reports/context-claims-source-verification/CONTEXT_CLAIMS_SOURCE_VERIFICATION_2026-10-17.md` و`context-claims-2026-10-17.csv`.

## ADR-119 — External comparison with Menschen public samples (P1-92) and attributed OER import (P2-357)

**Status.** Accepted, 2026-10-17 (v228).

**Delegation.** The agent decided under the owner's explicit delegation in the conversation («نفّذ ما يفيد المتعلم والصحيح»; «كل ما تحتاج بشريًا ابحث ستجد مصادره»). This was not an independent human legal review.

**Evidence tier.** `source-verified-agent` (ADR-116).

## P1-92 — similarity check against the book

**Context.** `content-near-duplicate-v1` compared the internal corpus only. P1-92 stayed partial because no external reference text could be lawfully obtained.

**Decision.**
1. **Statutory basis.** § 44b UrhG (https://www.gesetze-im-internet.de/urhg/__44b.html) allows copies of *lawfully accessible* works for text and data mining, unless the rightsholder declares a machine-readable reservation. On 2026-10-17, `https://www.hueber.de/robots.txt` carried no such reservation. The copies must be deleted when no longer needed.
2. **Tool.** `scripts/compare-external-reference-corpus.ts`, policy `external-reference-comparison-v1`, core in `src/core/content-validation/external-reference-comparison.ts`.
   - It segments every German string reachable from `src/data/*.ts`: 19,780 unique segments.
   - It compares them with an external corpus, using the internal thresholds (score ≥ 0.84, token ≥ 0.82, order ≥ 0.65) plus a shared verbatim run of 7 tokens.
   - It refuses a corpus inside the repository, and the report stores only hashes, indices and scores.
3. **Run.** The reference was the publisher's own sample PDFs on shop.hueber.de:
   - Menschen A1.1 KB, lesson 1;
   - Menschen A1 KB, Leseprobe 2 (lesson 9);
   - Menschen B1 KB, Leseprobe 1 (lesson 1).

   They were transcribed to `/tmp` (177 segments). Gaps in the book stayed gaps. The copies were deleted after the run. Pirated full copies found online were deliberately not used.
4. **Result.** 0 matches. The closest pair scores 0.4933, and it is a generic exercise rubric. Unit tests inject an exact copy, a close paraphrase and a long verbatim run; all three are detected.

**Consequences.**
- P1-92 is `implemented`. `content-originality-review-registry.ts` records the corpus, with `matchCount:0`.
- **Copyright clearance stays pending.** The coverage is 3 sample lessons, about 12 pages. A full-book comparison needs a copy the owner lawfully holds: run the same script on it, then delete the copy.

## P2-357 — import licensed OER with attribution

**Context.** The licence gate and the attribution line existed, but every register record was rejected, and no importer existed.

**Decision.**
1. **Licence versions.** The pages themselves were checked on 2026-10-17:
   - **Grimm Grammar** (home, credits, site index, topic pages) shows a CC BY 4.0 badge.
   - **Deutsch im Blick** (home page) shows the same badge.

   This settles the version that was unverified on 2026-10-08. G-FOL shows no version and quotes DWDS examples, so it stays rejected.
2. **Data and importer.**
   - `src/data/oer-register.ts` is the machine-readable register.
   - `src/core/oer/importer.ts` (`oer-attributed-reference-import-v1`) imports only gate-approved records. It rejects URLs outside the licensed source, duplicates, and items without a review record.
3. **Bounded first import.** 21 Grimm Grammar topic pages (titles taken from the official site index) are linked from the matching terms in the bilingual grammar glossary.
   - Each link carries the full attribution: author, title, source, licence and its URL, and check date.
   - No text is copied, and the links are marked as English explanations.
   - Three terms with no matching page stay unlinked.

**Consequences.**
- P2-357 is `implemented`. Importing actual text or media from OER-03 or other sources needs a separate decision per item. OER-03's videos show recorded people.

## Counts after this ADR

- P1: 133 implemented, 2 partial (331, 380).
- P2: 135 implemented, 5 partial, 2 not implemented.

## ADR-120 — Authored reading-evidence locators (P0-124) and opt-in anonymous response contribution (P2-350)

- Status: accepted — 2026-10-17 (v229)
- Evidence tier: agent semantic review under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). For P2-350 the tier is `source-verified-agent` (GDPR Recital 26; Art. 29 WP Opinion 05/2014). **Neither part is an independent human German review or a data-protection officer's opinion. Reviewer fields stay empty.**

## Context

**P0-124.** After a learner commits a reading answer, the app shows "where the evidence is". Until now `reading-evidence-grounded-v1` picked that sentence by lexical overlap between the correct option, the question and each sentence. The audit row asked for authored evidence positions per question, "so that lexical matching does not choose a sentence that is formally right but semantically weak". 246 of the 288 reading explanations also cited the lexical sentence ("ارجع إلى «…»") with the internal marker `FEEDBACK_DISCLOSURE_MARKER` ("موضع الرجوع آلي ويحتاج مراجعة دلالية مستقلة").

**P2-350.** The local calibration panel (`anonymous-item-calibration-v1`) already read a two-column `itemId,correct` CSV. The remaining gap was "opt-in collection of anonymous data, which needs a human decision and a privacy review". The app has no server, and adding one would break ZERO_COST and the local-first contract.

## Decision

### P0-124: authored locators

1. `src/data/reading-evidence-locators.ts` (`reading-evidence-authored-v1`) gives every one of the **288** reading questions in 96 lessons a locator `{ relation, quotes[] }`.
   - Each quote is a **verbatim span** of `lesson.reading.textDe`. Tests enforce exactly one occurrence, in text order.
   - It was chosen by reading the question, all four options and the whole text.
2. The relations are:
   - `direct`: 113
   - `paraphrase`: 80
   - `combined`: 86. Two or three spans, such as referent plus fact, plan plus reason, or one condition per option.
   - `computed`: 6. For example, *acht Uhr* ↔ 8:00.
   - `inference`: 2. b2-20-rq2 is a word-order rule shown by the example sentence. b2-21-r3 shows that correct indirect speech can still carry a false attribution.
   - `exclusion`: 1. a2-08-rq1: the absent task is proven by the complete task list.
3. Compared with the lexical selector, **192** were kept, **72** were completed (the lexical sentence held only part of the evidence) and **24** were replaced (wrong or missing sentence). Examples:
   - a1-01-rq2 quoted Omar's polite question instead of "Sie ist die Lehrerin."
   - a1-15-rq2 had no evidence at all.
   - a2-21-rq1 quoted the four-week test instead of the four weekdays.
   - b1-19-rq2 quoted Ben's misunderstanding instead of the clarification.
   - b2-18-rq3 quoted the opening instead of "zweimal sei die Fügung amtlich, dreimal werde sie Füllstoff."
4. `selectReadingEvidence` returns the authored locator first.
   - The lexical selector stays only as a fallback for questions without a locator, or when a span no longer occurs in an edited text.
   - The UI shows every span as its own `<q>` with a relation-specific Arabic label. These labels contain no Latin tokens.
5. The 246 explanation citations now quote exactly the authored spans, so the internal marker was removed from all of them. The rule "marker on every mechanical reference" still holds, and the number of mechanical references is now 0. `lesson-teaching-contract.test.ts` enforces equality with the locators.
6. Full table: `reports/reading-evidence-review/READING_EVIDENCE_REVIEW_2026-10-17.csv` (288 rows: id, prompt, correct option, relation, authored spans, former lexical sentence, change).

### P2-350: opt-in contribution without a server

1. "Collection" means the learner deliberately downloads `anonymous-answers.csv` from the settings panel and hands it to a teacher. The teacher pools many files in the same panel, which now accepts multiple files.
2. The export is off by default. The button stays disabled until the learner ticks a consent text that lists what is excluded.
3. Data minimisation (`anonymous-response-export-v1`):
   - only `itemId,correct`;
   - only the **first attempt** per item;
   - item IDs restricted to `[A-Za-z0-9._-]`;
   - rows shuffled with `crypto.getRandomValues`;
   - no answer text, time, confidence, profile, device or lesson progress;
   - nothing is sent automatically.
4. Because one learner contributes at most one row per item, the existing 30-response floor means **at least 30 distinct learners per reported item**. This is aggregation / k-anonymity in the sense of Art. 29 WP Opinion 05/2014 §3.2.1.
5. The results still never change an item, score, level or gate.

## Sources (P2-350, checked 2026-10-17)

- GDPR Recital 26 (https://gdpr-info.eu/recitals/no-26/):
  - The principles do not apply to anonymous information, "including for statistical or research purposes".
  - Identifiability is judged by "all the means reasonably likely to be used, such as singling out".
- Article 29 Working Party, Opinion 05/2014 on Anonymisation Techniques, WP216 (https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2014/wp216_en.pdf):
  - It names three risks: singling out, linkability and inference.
  - Aggregation / k-anonymity prevents singling out within groups of k, but "does not prevent any type of inference attack".

## Limits stated in the product, not hidden

- A teacher who receives a single file directly knows who sent it. Such a file is minimised, not anonymous. Anonymity in the Recital-26 sense arises only after pooling with the sender association discarded.
- An item that every pooled learner got right, or every pooled learner got wrong, reveals each learner's answer. This is the inference risk that k-anonymity does not remove. Both limits are shown to the learner beside the consent box.
- The reading locators are an agent's semantic judgement under delegation. An independent German reviewer may still disagree on individual spans. The CSV makes every decision checkable.
- P1-380 is not touched by this ADR. Calibration on real Arabic learner recordings cannot be replaced by sources.

## Consequences

- P0 = **121/124 implemented, 3 partial** (135, 255, 301).
- P2 = **136/142 implemented, 4 partial** (264, 371, 400, 401), **2 not implemented** (359, 360).
- Next ADR number: ADR-121.

## ADR-121 — Authored objective↔item alignment replaces lesson-scoped structural coverage (P2-400)

- Status: accepted — 2026-10-18 (v230)
- Evidence tier: agent semantic alignment under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **It is not an independent human German review.** P2-400 stays `partial` until the gaps this alignment uncovered are closed in the content.

## Context

`buildObjectiveCoverageReport()` linked every objective to every surface of its lesson. Teaching meant entry, vocabulary, discovery and all theory blocks. Practice meant all exercises, all reading and listening questions, writing, speaking, mediation and the error clinic. Assessment meant all Mini-Test items. So all 389 objectives were "covered" by construction, and every row said `pending-independent-item-alignment`. The report proved that the surfaces existed. It did not prove that any of them taught, practised or tested a given objective.

## Decision

1. `src/data/objective-item-alignment.ts` holds one entry per lesson (96). Each entry maps every surface to the 1-based objective indices it serves:
   - entry
   - vocabulary (`phrases`)
   - optional discovery
   - each theory block, exercise, reading question and listening question
   - writing, speaking and mediation
   - each Mini-Test item

   `[]` marks a surface as deliberately unaligned: comprehension-only, or off-objective. Each link was decided by reading the objective together with the item text (prompt, key, options and theory examples). For suspected teaching gaps, the agent also read the full vocabulary list, the discovery examples and the theory explanations.
2. `objective-coverage.ts` now derives `taughtIn`, `practicedIn` and `assessedIn` per objective from these links. Rows carry:
   - `mappingBasis: "authored-item-alignment"`
   - `semanticReviewStatus: "agent-authored-under-owner-delegation"`
   - `missing[]`
   
   The error clinic is no longer counted as practice for every objective, because it is not an authored item.
3. `ok` means **alignment integrity**: every required surface is accounted for, every index is valid, and no key is unknown. A gap is a learning finding, not an integrity failure. Gaps are therefore listed (`gaps`, `gapsByDimension`, `unalignedSurfaces`) and not hidden. `tests/unit/objective-item-alignment.test.ts` pins the exact gap ledger as a ratchet: closing a gap must shrink the ledger in the same change, and a new gap fails the test.

## Result (v230)

- 3,266 objective links. 335/389 objectives have at least one teaching, one practice and one Mini-Test link.
- **54 gaps:**
  - All 54 are not assessed by the Mini-Test.
  - 5 of them are also not taught: a1-15 O4 (pros and cons), a1-24 O4 (protecting data), a2-04 O4, a2-10 O4 and b1-12 O4 (presenting a project proposal).
  - 1 is also not practised: a1-14 O2.
- By level: A1 11, A2 21, B1 13, B2 9.
- The typical pattern: five Mini-Test items concentrate on the grammar objective, and the communicative objective (usually O1 or O4) gets no item.
- **67 unaligned surfaces:**
  - 61 practice items, mostly reading and listening comprehension questions.
  - 5 Mini-Test items that test content outside the lesson's objectives: a2-06-m3, a2-14-m5, a2-19-m3, a2-24-m3 and b2-15-m3.
  - 1 theory block: a2-06-t3.

## Consequences

- The coverage report no longer claims 389/389. It shows 335/389 with a gap ledger. `docs/generated/OBJECTIVE_COVERAGE_REPORT.md` and `reports/academic-content-audit.json` (`gapLedger`, `unalignedSurfaces`) are the evidence.
- Next content step: retarget off-objective or duplicate Mini-Test items to unassessed objectives, keeping their IDs, and add the five missing teaching points. Then flip P2-400 to `implemented`. (Done in v231: ADR-122.)
- Boundary: the alignment is the agent's judgement under delegation. A German-teaching reviewer may disagree with individual links. The data file is the single place to change them, and the tests re-derive everything.

## ADR-122 — The 54 objective gaps are closed in the content, not by re-tagging (P2-400)

- Status: accepted — 2026-10-18 (v231)
- Evidence tier: agent-authored content and alignment under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **It is not an independent human German review.** P2-400 becomes `implemented` because its acceptance criterion — every objective is linked to an item that teaches it, one that practises it and one that assesses it, derived from authored item-level links — is now met and pinned by a test. Independent reviewer agreement on individual links stays a separate, human question.

## Context

ADR-121 (v230) replaced lesson-scoped structural coverage with authored objective↔item links. It found 335/389 objectives covered and left a pinned ledger of 54 gaps:

- All 54 had no Mini-Test item.
- 5 also had no teaching point: a1-15 O4, a1-24 O4, a2-04 O4, a2-10 O4 and b1-12 O4.
- 1 also had no practice item: a1-14 O2.

The usual pattern was five Mini-Test items on the grammar objective and none on the communicative objective.

Re-tagging existing items to the missing objectives would have made the numbers green without changing what learners do. That option was rejected.

## Decision

1. **54 Mini-Test items rewritten (IDs kept).** Each replacement item targets exactly one missing objective. The item it replaces was chosen in this order:
   - the 5 deliberately unaligned items (a2-06-m3, a2-14-m5, a2-19-m3, a2-24-m3, b2-15-m3);
   - otherwise, an item whose objective is still assessed by at least one other Mini-Test item in the same lesson.

   No objective lost its last assessment.

   Each new item follows these rules:
   - It has 4 options.
   - The key is never the uniquely longest option.
   - Keys are spread across positions A–D.
   - The prompt does not leak the key.
   - The Arabic explanation quotes the German key, says why each distractor is wrong, and ends with a self-check question (فحص ذاتي).

   Communicative objectives are tested as communicative choices, for example:
   - which note passes on a phone message completely;
   - which sentence states an interest and a limit;
   - which summary does not spoil the ending.

   They are not tested as grammar drills.
2. **5 teaching points added.** The `explanationAr` of an existing theory block was extended for each one:
   - a1-15-t1: pros and cons with aber;
   - a1-24-t1: invented data in practice forms;
   - a2-04-t3: structure of a short note to neighbours;
   - a2-10-t3: justifying a travel decision with weil or deshalb;
   - b1-12-t1: five-sentence project proposal.

   The examples were not touched, so no audio or manifest changed.
3. **1 practice item retargeted.** a1-14-e3 now asks the learner to order the words of a real place question (Wo liegt der Schlüssel). The case-free explanation keeps the meaning-first case audit clean.
4. **Explanation quotes.** Every German «…» quote in the new explanations appears verbatim in the same lesson's German content. Illustrative German that does not appear there is written without quote marks. The quote-exception ledger went from 73 to 70 entries, and no new unreviewed entry was added.

5. **Case-teaching contracts kept honest.** Eight replaced items had been listed as case assessments in `src/data/case-teaching-registry.ts`: a1-12-m5, a1-14-m1, a2-04-m1, a2-07-m2, a2-23-m2, a2-23-m3, b1-08-m1 and b2-04-m3. Their new versions test communicative objectives, not case, so they were removed from `assessmentIds`. Every contract still keeps at least one Mini-Test item that tests case. Assessment references went from 44 to 36, and the case-signal items found in assessments went from 25 to 21.
6. **Parallel options in the parallelised lessons.** In b1-05, b2-07, b2-11 and b2-19 the new items meet the existing option-parallelism rule: the key is neither the unique longest nor the unique shortest option, and option lengths differ by at most 25 characters.

## Result (v231)

- 389/389 objectives have at least one teaching, one practice and one Mini-Test link. 0 gaps.
- `tests/unit/objective-item-alignment.test.ts` pins an empty gap ledger, so any new gap fails.
- 62 unaligned surfaces remain: 61 comprehension-only practice questions and the theory block a2-06-t3. All 5 off-objective Mini-Test items were replaced.
- MCQ cues improved:
  - The longest-option-is-key share went from 39.2% to 38%.
  - Lessons without position D went from 3 to 2.
  - Key positions are now A 319, B 302, C 305, D 324.

## Consequences

- P2-400 → `implemented`. P2 is now 137 implemented, 3 partial (264, 371, 401) and 2 not implemented (359, 360).
- Boundary: the items and links are the agent's work under delegation. A German-teaching reviewer may disagree with individual choices. `src/data/objective-item-alignment.ts` and the lesson module files are the single places to change them, and the tests re-derive coverage.

## ADR-123 — The local practice bank is derived from the already-loaded curriculum, not shipped twice (P2-355, ADR-049)

- Status: accepted — 2026-10-18 (v231)
- Policy ID: `local-test-generator-v1` (unchanged). Amends point 5 of ADR-111; the rest of ADR-111 stays in force.

## Context

ADR-111 shipped four generated level banks (`src/data/local-test-templates/{a1,a2,b1,b2}.ts`) as static imports of `/practice/test-generator`, so the route works offline after a pack install. Each bank is a copy of the published lessons' `miniTest` items. The route's HTML already references the four `curriculum-a1…b2` chunks, so every Mini-Test item reached the browser twice on that route: once in the curriculum chunks and once in the page chunk (about 76 KB gzip).

In v231 (ADR-122), 54 Mini-Test items were rewritten with complete explanations. Both copies grew, and the total built JavaScript reached 2,136,520 gzip bytes. That is above the ADR-049 safety ceiling of 2,125,000, which keeps a mandatory 15% reserve below the 2,500,000 hard limit. Project precedent (2026-09-19, curriculum split per level) is to fix `js:budget` with engineering, not by relaxing the policy.

## Decision

1. `loadLocalTestTemplateBank(level)` now builds the banks in the browser with the same pure, fail-closed `buildLocalTestCatalog(academicLessonList, curriculum)` that the build-time audit uses. The result is cached for the page session. If the catalog is not `ok`, the loader throws, and the existing UI shows its error state without saving anything.
2. The inputs are static imports (`@/data/academic-lessons`, `@/data/curriculum`) whose chunks the route already loads. There is still no `dynamic import`, so the ADR-111 offline guarantee holds: an installed pack keeps every level usable on this route.
3. The generated bank files stay as a reviewed, drift-checked artifact. `npm run local:test:templates` still fails when they are stale, and `tests/unit/local-test-generator.test.ts` checks that the browser-derived banks equal them level by level. They are no longer imported by client code.
4. `scripts/audit-js-budgets.mjs` and the 15% reserve are unchanged.

## Consequences

- One copy of each Mini-Test item ships to the client. Built JavaScript falls back under the safety ceiling (see the v231 build line in `PROJECT_STATUS.md`).
- Learners see the same 480 templates from the 96 published lessons, with the same sampling, shuffling and delayed answer reveal.
- `scripts/verify-continuation-handoff.mjs` now requires the derived loader and fails if the loader imports the generated banks again.

## ADR-124 — Authored lesson prerequisite links answer «على ماذا يبني الدرس؟»

- Status: accepted — 2026-10-18 (v232)
- Policy ID: `authored-lesson-prerequisite-links-v1`
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not an independent human review.**

## Context

The lesson teaching contract (`lesson-teaching-contract-v1`) asks eight questions of every lesson. Question 2, «على ماذا يبني الدرس؟», was the only soft question with a numbered gap. 73 of 96 lessons had no authored grammar node with a parent in the grammar progression map (24 nodes, P1-114). For those lessons the contract fell back to curriculum order («الاستنتاج من ترتيب المنهج فقط»), which says nothing about *which* earlier explanation the learner needs.

Adding 72 more nodes to the visual map would overload it, and many of these lessons are communicative rather than grammar-centred.

## Decision

1. **A separate, flat registry.** `src/data/lesson-prerequisite-links.ts` maps each of the 72 uncovered lessons to 1–2 earlier theory blocks (136 links in total). Each link has an Arabic reason that names the specific dependency. Examples:
   - a1-19 (transport with mit) → a1-14-t1 (Dativ for fixed places) and a1-10-t1 (Akkusativ endings);
   - b2-21 (Konjunktiv I) → b2-08-t2 (indirect speech in media criticism) and b1-18-t1 (sollen as distance);
   - b1-01 (Präteritum in biographies) → a2-02-t3 (war/hatte) and a2-01-t1 (Perfekt), across the level boundary.
2. **Checked rules** (`validateLessonPrerequisiteLinks`, with tests):
   - the theory block exists and belongs to an earlier lesson in curriculum order;
   - 1–2 links per lesson, with no duplicates;
   - the reason is plain Arabic with no Latin letters, between 40 and 160 characters. Learner-facing Arabic stays free of mixed-script tokens, and the German theory title is rendered separately with `lang="de" dir="ltr"`.
3. **Contract.** `lessonTeachingContract` accepts an authored lesson link as a valid answer (`authored-lesson-link`). Authored grammar nodes with parents still take precedence.
4. **Learner surface.** In the rule stage, `LessonPrerequisitePanel` lists «يبني هذا الدرس على». Each entry shows the earlier block's Arabic and German titles, links to that lesson, and gives the reason. The panel states that this is a teaching pointer, not a mastery condition or a lock. Nothing is gated, and no learner state changes.
5. **Ceiling ratchet.** `lessonsWithoutAuthoredPrerequisiteLink` goes from 73 to **1**. The one remaining lesson is a1-01, the first lesson of the curriculum, which has nothing before it; it keeps its founding grammar node.

## Consequences

- All 96 lessons now answer the eight contract questions with no open gap.
- The grammar progression map is unchanged (24 nodes and 31 relations, P1-114).
- Boundary: each link is a pedagogical judgement made by the agent under delegation. A German-teaching reviewer may prefer other dependencies, and `src/data/lesson-prerequisite-links.ts` is the single place to change them. The validator only enforces structure and direction; it cannot prove that a dependency is the best one.

## ADR-125 — Authored articulation profile per lesson (P1-380)

- Status: accepted — 2026-10-18 (v233)
- Policy ID: `authored-articulation-profile-per-lesson-v1`
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not an independent phonetics review.**

## Context

Each lesson's pronunciation lab (`articulation-contrast-practice-v1`) shows one articulation diagram and two meaningful Browser-TTS contrasts. The profile was picked by `profileFor(lesson.pronunciation.focus)`, a keyword heuristic over the focus string. The heuristic sent **73 of 96 lessons** to the fallback "prosody" profile, so they all showed the same statement/question intonation pairs, whatever the lesson actually trained. Two problems followed:

- **Wrong mappings.** a2-11 has the focus `[ˈvʏʁdə]` (rounded front vowel ü), but `"[ʏ"` does not match `"[ˈvʏ"`, so the lesson showed intonation pairs. Lessons on word stress (AUFstehen, WEIterleiten, compound stress, separable prefixes with zu), the ach-Laut in «doch» and «auch», and short vowels in Konjunktiv forms all fell through to the same generic pairs.
- **Inventory links that did not show the pair.** The 18-row Arabic-learner inventory linked most rows to lessons that never displayed the row's interactive pair. For example, f–v was linked to a1-02 and a1-06, which are palate lessons. A learner following the link landed on a different contrast.

## Decision

1. **An authored map.** `src/data/articulation-profile-assignments.ts` assigns one profile to each of the 96 lessons. Each choice was made by reading the lesson's focus, Arabic explanation and items. The heuristic remains only as a fallback for IDs outside the map; a test requires the map to cover exactly the curriculum.
2. **Two new profiles, with contrasts that TTS can honestly produce.** Each new pair uses two different strings, so the synthetic voice really differs.
   - `wordStress` (zone rhythm, «Wortakzent»):
     - «Er fährt das Schild um.» vs «Er umfährt das Schild.»: separable prefix stressed vs root stressed, with a change in meaning;
     - Kaffee [ˈkafe] vs Café [kaˈfeː].
     - Lessons: a1-08, a1-17, a1-24, a2-01, a2-07, a2-08, a2-14, a2-17, a2-20, b1-13, b2-14, b2-15, b2-17 and b2-23 (14 lessons).
   - `achLaut` (new diagram zone `velum`, back of the tongue towards the soft palate):
     - Buch [buːx] vs Bücher [ˈbyːçɐ];
     - Dach [dax] vs Dächer [ˈdɛçɐ].
     - Lessons: b2-19 («doch» [dɔx]) and b2-20 (nicht [nɪçt] / auch [aʊ̯x]).
3. **Corrections to existing profiles.** a2-11 moves to `rounded`. b2-21 (short vowels and schwa in Konjunktiv forms) moves to `vowelLength`.
4. **Sentence-level foci stay on `prosody`.** These include Satzakzent, Kontrast, Intonation, Sprechgruppen and connector melody. Browser TTS reads an identical string the same way each time, so it cannot honestly vary sentence focus. Distribution: prosody 73 ⇒ **55**, wordStress 14, rounded 7, palate 5, affricates 4, lipTeeth 4, vowelLength 3, onsetH 2, achLaut 2.
5. **Inventory re-linked.**
   - Every row now points to lessons that actually teach its sound.
   - Every interactive row is linked to at least one lesson that shows its pair. A test checks this.
   - Each row's level is the level of its earliest linked lesson.
   - The word-stress row gets `interactivePairId: "stress-umfahren"`, and the ach-ch row gets `"ach-dach-daecher"` (Bach/ich ⇒ Dach/Dächer, zone `velum`).
   - The consonant-cluster row (Sprache/Straße) now links to a1-06 and a1-16 ([ʃp]/[ʃt]) with the palate diagram.
   - Interactive rows go from 11/18 to **13/18**.

## Consequences

- Interactive rows for P1-380 reach 13/18. p-b, r-variants, final devoicing, consonant clusters and sentence focus remain guided only, because no lesson focus maps to them honestly through TTS. P1-380 stays `partial`. Recordings of Arabic learners and an independent phonetics review are still missing.
- No score, no mastery and no new learner state. The evidence boundary stays `synthetic-discrimination-only-no-pronunciation-or-mastery-score`.
- Boundary: each assignment is a pedagogical judgement made by the agent. `src/data/articulation-profile-assignments.ts` is the single place to change it.

## ADR-126 — Lemmatized lexical load for reading texts and long inputs (P2-401)

- Status: accepted — 2026-10-18 (v234)
- Policy IDs: `lemmatized-lexical-load-v1`, `german-curriculum-lemmatizer-v1`, `curriculum-proper-names-v1`
- Evidence tier: agent-authored measurement under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). Grammar labels for the ten new glossary headwords were checked against de.wiktionary on 2026-10-18. **This is not a human review of voice, pacing, suitability or rights.**

## Context

P2-401 asks for realistic listening length and a *controlled* lexical load. Before this batch the curriculum measured reading load as "share of content words not supported by earlier lessons" (`prior-sequence-support-v3`). The figure was reported but not thresholded, because the measurement itself was known to be wrong in four ways:

1. **No lemmas.** A suffix stemmer cannot unify strong verbs (spricht/sprechen, ging/gehen, verstanden/verstehen) or umlaut plurals (Satz/Sätze, Buch/Bücher). Every such form counted as a new word.
2. **Proper names counted as vocabulary.** Speaker and town names (Amira, Lindenau, Okafor) made texts look harder than they are.
3. **The stop list was never folded.** The text is folded (ü→ue), the stop list was not, so für, über, außerhalb, möchten and müssen never matched it and always counted as unknown content words.
4. **Accents split words.** The legacy fold turned é into a space (Café → "caf"), so Sprachcafés became two tokens.

The 16 long inputs (`graded-long-input-v1`, 113–473 words) had no lexical-load measurement at all.

## Decision

1. **A curriculum lemmatizer** (`src/core/german/lemmatizer.ts`). For each folded word it proposes lemma candidates:
   - rule candidates for regular inflection;
   - explicit hits in an irregular dictionary;
   - compound tails (Arbeitsplätze → Arbeitsplatz, anrief → anrufen);
   - inseparable participles without ge- (verstanden → verstehen, bekommen).

   Matching uses the exact candidates plus the legacy surface stem. Stemming the candidates was tried and rejected, because short stems collided ("schl…").
2. **An explicit irregular dictionary** (`src/data/german-lemma-dictionary.ts`), with 2,044 form→lemma pairs:
   - 111 strong and mixed verbs expanded from their principal parts;
   - 50 forms of sein, haben, werden, the modals and Konjunktiv II;
   - 88 umlaut and Latin plurals;
   - 32 irregular comparison forms;
   - the plurals already recorded in the lexical grammar registry.

   Multi-word entries throw at build time, so a typo cannot silently widen the dictionary.
3. **A proper-name list** (`src/data/curriculum-proper-names.ts`) with 64 people and 11 places that occur in the curriculum. Country and language names are deliberately excluded, because they are vocabulary a learner must learn. A test requires every named speaker in the long inputs to be on the list.
4. **The measurement** (`src/core/content-validation/lexical-load.ts`) works on distinct content-word types, folds the stop list like the text, and counts names apart. Support is defined differently for the two kinds of text:
   - reading uses the same prior-sequence support as v3;
   - long inputs use every lesson at or below their level, plus the glossary shown beside the input.
5. **A ratchet gate** in `scripts/generate-lesson-quality-audit.ts`. The values were measured on 2026-10-18:
   - lemmatized reading median ≤ 29%;
   - at most 13 reading texts above 45%;
   - every long input ≤ 32%.

   The legacy fields stay in the report unchanged, so the comparison remains auditable.
6. **Content repair where the load was highest.** The five long inputs above 25% each got two new glossary headwords: words needed to answer the input's own questions, each with an Arabic meaning and a source-checked grammar label:
   - b1-D: Schulhof, Schatten;
   - b1-C: Spielplatz, Fragebogen;
   - a1-D: trocken, Erdbeere;
   - b2-C: Lehrkraft, heimlich;
   - a2-D: Bremse, Helm.

   This takes the glossary from 64 to 74 headwords, and the verified labels from 63 to 73.

## Result

| Measure | Legacy (v3 stemmer) | Lemmatized (v1) |
| --- | --- | --- |
| Reading median | 40% | **28.9%** |
| A1 / A2 / B1 / B2 medians | 52.8 / 36.8 / 40.8 / 39.4 | 45.1 / 28.2 / 28.0 / 27.0 |
| Reading texts above 45% | 29 | 13 |
| Highest reading text | 80% | 73.3% |
| Proper names excluded | 0 | 139 |
| Long inputs: median / highest | not measured | 20% / 31.3% (b1-D) |

## Consequences

- **The pedagogical target is still a 25% median, and it is not met.** A1 texts remain the heaviest. Their remaining unknowns are mostly genuinely untaught words (heute, dann, vier, Dienstag) rather than measurement artefacts. The ratchet only forbids regression; lowering the median requires rewriting texts or teaching the words earlier.
- The lemmatizer is not a full morphological analyser. A missed form counts as unknown, so the figure still errs high, never low.
- P2-401 stays `partial`. A human voice for the long inputs and an independent review of suitability and rights are human work that this batch does not claim.

## ADR-127 — Show the reading's own noun anchors before the reading, and meet the 25% reading-load median (P2-401)

- Status: accepted, 2026-10-18 (v235)
- Policy IDs: `lemmatized-lexical-load-v2`, `reading-anchored-noun-visibility-v1` (the lemmatizer stays `german-curriculum-lemmatizer-v1` with one added rule)
- Evidence tier: an agent-authored content and measurement change under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not a human review** of voice, suitability or rights.

## Context

ADR-126 measured reading load on lemma candidates. It found a median of 28.9% unknown content-word types, against a pedagogical target of 25%. Looking at the remaining unknown words lesson by lesson showed three distinct causes:

1. **Untaught high-frequency words in A1.** The numbers 2–9 and 11–12, the weekdays, heute, jetzt, oft, manchmal, nur, immer and dort appear in the first readings. No phrase or card taught them first.
2. **Question-critical words.** Some readings ask about a word that no earlier stage teaches. Examples: nimmt (a1-10), Fahrrad fahren (a1-17), Atemnot (a1-23), mehrmals (a2-18), schüchtern (a2-23), verteidigte (b1-05) and manipuliert (b2-21).
3. **Hidden anchors.** Every lesson's lexical-grammar registry documents more noun anchors than the four the vocabulary stage shows. The rest sat behind a closed «Weitere Zielnomen» disclosure, even when the same lesson's reading text uses them, so the learner first met these nouns inside the text. Across the curriculum, 549 such anchors in 92 lessons occur in their own lesson's reading.

There were also two definition faults in the measurement:

- Irregular forms of stop-listed verbs (wurde, hast, konnte, möchte) counted as content words.
- The vocabulary stage was not counted as support at all, although it comes before the reading.

## Decision

1. **Measurement definitions (v2).**
   - An irregular form counts as a function word only through an explicit dictionary entry onto the lemma of a stop word. Rule guesses never count, so kannte (kennen) is not swallowed by kann.
   - Support now includes what the vocabulary stage shows openly: the first four noun anchors (lemma and plural) and every verb-preposition frame infinitive.
   - Participle I forms used as adjectives or nouns (wartende, entstehenden) map to the infinitive.
2. **Thirty pre-reading flashcards.** They are appended at the end of each lesson's card list, so existing card IDs stay stable:
   - 17 cards teach the A1 core words: Frau/Herr, heute, jetzt, the numbers, nur, oft, manchmal, am Wochenende, the parts of the day, the weekdays, immer and dort.
   - 13 cards pre-teach question-critical words in a1-10, a1-15, a1-17, a1-18, a1-19, a1-23, a2-18, a2-23, b1-05, b2-04, b2-08, b2-10 and b2-21.

   No card front pairs an article with a noun, so no new pending-human lexical target is created. The lexical-target gap counts are unchanged.
3. **The vocabulary stage shows the reading's own anchors** (`src/core/lesson/vocabulary-stage.ts`).
   - Anchors after the first four that occur in the lesson's reading text appear openly under «ستقابلها في نص القراءة». They form a compact list: article and noun, Arabic meaning, plural, and a «nur Plural» badge where it applies. Each row opens to show the case forms.
   - Only anchors that the reading does not use stay in the closed disclosure.
   - Occurrence means an exact folded match on the lemma, the plural, the dative plural or a case form, optionally with a genitive -s/-es. A substring never counts, so «Stuhlkreis» does not match Stuhl.
   - The panel and the audit call the same function, so the audit counts exactly what the learner sees. The registry is not edited, and the 1,297 nouns and 134 frames are unchanged.
4. **The ratchet is tightened to the measured state:**
   - reading median ≤ 23%;
   - at most 4 reading texts above 45%;
   - every long input ≤ 32%, unchanged.

## Result: each effect separately

| Step | Median | A1 | A2 | B1 | B2 | Texts > 45% | Texts ≤ 25% | Highest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADR-126 committed (v1) | 28.9 | 45.1 | 28.2 | 28.0 | 27.0 | 13 | 33 | 73.3 |
| + function-word definition (v2) | 29.9 | 46.0 | 29.0 | 27.5 | 27.3 | 15 | 30 | 75.0 |
| + first four anchors and frames as support | 28.6 | 44.0 | 27.5 | 24.7 | 25.6 | 10 | 34 | 70.5 |
| + 30 pre-reading cards | 25.5 | 37.8 | 25.0 | 24.7 | 24.4 | 6 | 46 | 65.9 |
| + reading anchors shown openly | **22.6** | 28.9 | 19.6 | 20.8 | 23.1 | **4** | 60 | 53.7 |

- The visible-anchor step alone, without the new cards, would give 24.1. Cards and visibility each contribute about three points.
- The function-word correction *raised* the figure. It is kept because it is the correct definition.
- Long inputs: median 19.1%, highest 31.7% (b1-D).

## Consequences

- **The 25% reading-load median is met (22.6%).** The ratchet now forbids any regression from it.
- **A1 remains the heaviest level** (median 28.9%). Four texts are still above 45%: a1-01 (53.7), a1-04 (46.3), a1-03 (46.2) and a1-05 (45.8). These first readings need rewriting, not more cards. That is the next content task, and it is recorded rather than hidden.
- **Trade-off:** a few lessons now show a long pre-reading list. b2-09 has 27 rows. The list is compact and separated from the four core anchors, but some learners may find it long. A later batch could shorten such readings.
- The figure is curricular exposure, never proof that a learner knows a word. The lemmatizer still errs high, never low.
- **P2-401 stays `partial`** for the human parts only: a human voice for the long inputs, and an independent review of suitability and rights.

## ADR-128 — Simplify the first A1 reading texts around their evidence sentences (P2-401)

- Status: accepted, 2026-10-18 (v236)
- Policy IDs: unchanged (`lemmatized-lexical-load-v2`, `reading-anchored-noun-visibility-v1`, `reading-evidence-authored-v1`)
- Evidence tier: agent-authored content under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not a human review** of the German or of suitability.

## Context

After ADR-127 the reading median was 22.6%. Four A1 texts were still above 45% unknown content-word types. All four come early in the course, where the learner knows least:

| Lesson | Load |
| --- | --- |
| a1-01 | 53.7% |
| a1-04 | 46.3% |
| a1-03 | 46.2% |
| a1-05 | 45.8% |

The next two were close behind: a1-06 at 43.1% and a1-09 at 39.5%. Most of their unknown words were in sentences that no question uses, for example «Er ist neunzehn Jahre alt und studiert», «Sie plant technische Projekte», «David bringt seine Grammatiknotizen mit». Adding more cards would not fix that. ADR-127 recorded that these texts need rewriting.

## Decision

1. **The six texts are rewritten around their evidence sentences.**
   - Every sentence that the authored evidence locators (`reading-evidence-authored-v1`) or a question explanation quotes stays verbatim. The 18 questions, their options, their explanations and the locators are therefore untouched.
   - Every glossary surface form still occurs in its text, so the glossary is unchanged.
   - Sentences that carried only untaught detail are removed or reworded with words the lesson teaches. Examples: «Er arbeitet als Verkäufer in einem Supermarkt»; «Kenji hat am Dienstag einen Termin».
   - Where the lesson's own phrases fit, they are used in short exchanges. Examples: «Wie geht es dir?» – «Danke, gut.» in a1-01; «Stimmt das?» – «Ja, das stimmt.» in a1-05.
   - The Arabic text for each reading (`textAr`) is rewritten to match.
2. **Two very frequent words are taught before the first reading.** The a1-01 cards gain «sagen – er sagt, sie sagt» and «dann». Both are used in the first texts and were untaught.
3. **A measurement fix:** «Adel», a person name in a1-06, is added to the proper-name list.
4. **The ratchet is tightened again**, and gains a ceiling for the heaviest text:
   - reading median ≤ 22%;
   - no text above 45%;
   - the heaviest text ≤ 42%.

## Result

| Lesson | Before | After | Words before → after |
| --- | --- | --- | --- |
| a1-01 | 53.7% | 30.6% | 92 → 79 |
| a1-03 | 46.2% | 34.2% | 92 → 93 |
| a1-04 | 46.3% | 34.4% | 94 → 78 |
| a1-05 | 45.8% | 36.8% | 95 → 91 |
| a1-06 | 43.1% | 20.0% | 98 → 81 |
| a1-09 | 39.5% | 27.5% | 97 → 97 |

| Measure | Before (ADR-127) | After |
| --- | --- | --- |
| Reading median | 22.6% | **22.0%** |
| A1 median | 28.9% | 27.5% |
| A2 / B1 / B2 medians | unchanged | 19.6 / 20.8 / 23.1 |
| Texts above 45% | 4 | **0** |
| Heaviest text | 53.7% | 41.3% (a2-16) |

- The lexical-target gap loses 10 contextual noun candidates and 3 contextual verb candidates that only the removed sentences contained. Covered and pending-human counts are unchanged: 1,385 / 89 nouns and 134 / 1 frames.
- The 1,297 noun anchors and 134 frames are unchanged.

## Consequences

- The first texts are shorter and recycle the lesson's phrases. Every question is still answered by the same verbatim sentence.
- Some story detail is gone: Karim's age and studies, Hatem's hotel, Monastir, the grandfather. No question or exercise used it.
- The heaviest texts are now a2-16 (41.3%) and a1-02 (40.9%). Most unknown words in a1-02 are glossed beside the text, and a2-16 is a level-appropriate notice text. Both stay under the new ceiling and are left as they are.
- The answer-integrity audit picks evidence for its report with a lexical selector. For a1-04-rq3 it pointed to the wrong sentence before this change and still does. The learner is shown the authored locator, which is correct. This is recorded, not hidden.
- **P2-401 stays `partial`** for the human parts only: a human voice for the long inputs, and an independent review of suitability and rights.

## ADR-129 — Lip-closure and consonant-cluster articulation profiles (P1-380)

- Status: accepted, 2026-10-18 (v237)
- Policy IDs: unchanged (`authored-articulation-profile-per-lesson-v1`, `articulation-contrast-practice-v1`, `arabic-learner-pronunciation-inventory-v1`)
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not an independent phonetics review.**

## Context

After ADR-125, 13 of the 18 inventory rows had an interactive Browser-TTS pair. Five rows were guided only: p-b, r-variants, final devoicing, consonant clusters and sentence focus.

Two of the five belonged to lessons whose pronunciation lab showed the wrong contrasts:

- **a1-10 and a1-11** train [pf] (Apfel, Pfeffer, Pfanne, Pfund). They used the `affricates` profile, so half of each lab was the [ts] pair Zeit/seit. That pair is unrelated to these lessons. The [p] closure that starts [pf] is exactly where Arabic-speaking learners can confuse [p] with [b], but no lesson offered a [p]–[b] contrast.
- **a1-06 and a1-16** train the clusters [ʃp]/[ʃt] (sprechen, Straße, Stadt, spielen). Their own explanations warn: «لا تضف حركة بين الصوامت» and «لا تقل إش-بيلن». They used the `palate` profile, so they showed Kirche/Kirsche and Licht/List ([ç]–[ʃ], [ç]–[s]). Neither pair is about clusters.

## Decision

1. **New profile `lipClosure`** (zone `lips`, «Lippenverschluss: [p], [b], [pf]») for a1-10 and a1-11.
   - packen [ˈpakn̩] vs backen [ˈbakn̩]: a strict minimal pair. The note teaches the aspiration cue (a sheet of paper in front of the mouth moves with packen).
   - Pfund [pfʊnt] vs Fund [fʊnt]: kept from the old profile.
2. **New profile `clusters`** (zone `ridge`, «Konsonanten ohne Zwischenvokal») for a1-06 and a1-16.
   - Stein [ʃtaɪ̯n] vs Schein [ʃaɪ̯n]: a strict minimal pair. The [t] must follow [ʃ] directly.
   - Platte [ˈplatə] vs Palette [paˈlɛtə]: a meaningful contrast. A short vowel inserted into the cluster produces a different word, which is exactly the confusion the inventory row describes.
3. **The `affricates` profile now serves only its [ts] lessons**, a1-05 and a1-21. Pfund/Fund moved to `lipClosure`, and its place is taken by Ziege [ˈtsiːɡə] vs Siege [ˈziːɡə], a strict [ts]–[z] minimal pair.
4. **Inventory rows updated.**
   - p-b now uses packen/backen, `diagramProfileId: "lipClosure"`, `interactivePairId: "pb-packen-backen"` and synthetic discrimination.
   - The consonant-cluster row now uses Platte/Palette, `diagramProfileId: "clusters"`, `interactivePairId: "cluster-platte-palette"` and synthetic discrimination.
   - pf-f now points at `lipClosure`.
   - Interactive rows go from 13/18 to **15/18**.
5. Every pair uses two different strings, so the synthetic voice really produces the difference. No sentence-level focus is simulated.

## Why the other three rows stay guided

- **r-variants:** the two sides are the same word, rot, in two accepted realisations ([ʁ] and [r]). Browser TTS has one realisation per voice, so it cannot honestly produce both.
- **Final devoicing:** it is linked to b1-11 and b2-18. Their focus is sentence prosody, and b2-18 mentions Ab-schluss [p] only in passing. Moving either lesson off `prosody` would hide what it really trains.
- **Sentence focus:** TTS reads an identical string the same way each time (ADR-125).

## Result

| Profile | Lessons |
| --- | --- |
| prosody | 55 (unchanged) |
| wordStress | 14 |
| rounded | 7 |
| lipTeeth | 4 |
| vowelLength | 3 |
| palate | 3 (was 5) |
| affricates | 2 (was 4) |
| lipClosure | 2 (new) |
| clusters | 2 (new) |
| onsetH | 2 |
| achLaut | 2 |

- Interactive inventory rows: 13/18 ⇒ **15/18**.

## Consequences

- No score, no mastery and no new learner state. The evidence boundary stays `synthetic-discrimination-only-no-pronunciation-or-mastery-score`, and attempts are keyed by lesson and pair as before.
- **P1-380 stays `partial`.** What is missing: the three guided rows, calibration on real Arabic-learner recordings, and an independent phonetics review (`authored-review-pending`).

## ADR-130 — After-commit support for the 96 independent transfer tasks (م39)

- Status: accepted, 2026-10-18 (v238)
- Policy ID: `after-commit-transfer-support-v1` (new). Existing policies are unchanged: `productive-independence-v1`, `support-usage-v1`.
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **The German phrases and models are not a human linguistic review.**

## Context

ADR-106 phase C gave every lesson an independent transfer task (96 tasks, 24 per level). To keep the evidence clean, these tasks show nothing before the attempt: `usefulPhrases: []` and the writing `modelDe` says that no model exists. The ledger row م39 said what was still missing: after the attempt, the learner got no model and no reusable phrases. The only thing they could do was revise their own text without any target to compare it with.

Research on output followed by models supports showing a model **after** a committed attempt:

- **Hanaoka (2007)**, *Language Teaching Research* 11(4), 459–479. Learners first wrote, then compared their text with native models. They noticed mainly the gaps their own attempt had revealed, and they used those features in later rewrites.
- **Coyle & Roca de Larios (2014)**, *Studies in Second Language Acquisition* 36(3), 451–485. Models given after writing led to more noticing of lexical and content features than error correction did. Error correction did more for form accuracy.

The order matters: the model comes after the attempt. The independence evidence must therefore stay honest once the model has been seen.

While auditing this, a real loophole turned up in `writingIsIndependent`. A model reveal only invalidated a submission if it happened **within the same round** (`event.createdAt >= draftStartedAt`). So a learner could submit a weak attempt, open the model, start a "new independent attempt" and have it counted as independent.

## Decision

1. **New data module `src/data/independent-transfer-support.ts`.** It is keyed by `sourceLessonId` and imported only by the writing and speaking labs.
   - Five reusable phrases for each of the 96 tasks.
   - A full model for every **A1** task (30–50 words) and every **A2** task (80–110 words). Each model sits inside its own task's word range, counted with the app's own `analyzeWriting`.
   - Names are invented and phone numbers are placeholders (`0000 …`). There are no pork words, and A2 models use no B1 constructions.
2. **Writing lab.** After an independent task has been checked, a closed `<details>` panel appears: «عبارات ونموذج بعد التسليم» («عبارات مفيدة بعد التسليم» for B1/B2).
   - Opening it records the existing `writing-model` support event (`afterCommit: true`).
   - The panel says in Arabic that any later attempt at the same task no longer counts as independent writing.
   - The warning before the task now says that help appears only after the check.
3. **Loophole closed.** Two places changed:
   - `writingIsIndependent` now treats **any** model reveal for that task before the submission as support, regardless of round.
   - The writing lab's `supportUsedBeforeDraft` no longer starts counting at the current round.
   - A genuinely new round without any reveal still counts, as before. Re-submitting the same text still does not count twice.
4. **Speaking lab.** After a saved independent attempt, a closed panel appears: «عبارات للمحاولة التالية». Each phrase has a play button that uses the existing synthetic model voice.
   - Opening it records a `hint` event on the new surface `speaking-lab`, with content ID `${taskId}:after-attempt-phrases` and `afterCommit: true`.
   - Every later recording of that task stores `supportVisibleDuringRecording: true`.
   - `uniqueRecentSpeakingTasks` also refuses any attempt recorded after such an event (`afterCommitSpeakingSupportSeen`).
   - The phrases appear only for the **first eight tasks of each level (32 tasks)**. Those are the only tasks whose speaking scenario matches the written one. In the other 64, speaking uses a different situation, so the written-task phrases would mislead.
5. **Portability.** The support-usage `surface` enum gains `speaking-lab`. This is an additive value, so older exports still import.

## Budget and what is deferred

- The curriculum source gzip went from 1,249,948 to **1,263,887**, still under the 15% safety ceiling of 1,275,000.
- Client JS went from 2,077,060 to **2,091,375** gzip, still under the 2,125,000 ceiling. No dynamic import was added (ADR-111).
- Full **B1 (140–180 words) and B2 (180–230 words) models** for 48 tasks would need about 20–25 KB gzip more, and that does not fit inside the reserve.
  - The ceiling is not relaxed.
  - The data is not moved out of `src/data` to dodge the measurement.
  - **B1/B2 therefore get phrases only.** A test pins `model === undefined` for them, so adding models later is an explicit change.
- The speaking panel for the 64 tasks with a different speaking scenario needs scenario-specific phrases. That is not authored yet.

## Consequences

- No score, no mastery and no new learner-state field.
- Independence evidence gets stricter, never looser: a reveal can only remove independence.
- **م39 becomes «منجز برمجيًا مع حدود معلنة».** What is still missing:
  - B1/B2 models;
  - speaking phrases for 64 tasks;
  - a human linguistic review of the 96 phrase sets and 48 models;
  - evidence from real learners that post-attempt models help this population.

## ADR-131 — Workflow markers are separated from mastery evidence (م34)

- Status: accepted, 2026-10-18 (v239)
- Policy ID: `workflow-markers-separate-from-mastery-v1` (new). `event-derived-mastery-v1` is unchanged.
- Evidence tier: agent-authored engineering change under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»).

## Context

Ledger row م34 said that `mastery` still mixed UI flags with mastery evidence in export and import. Measured in the source:

- `full-exam-${id}-started` (value 1) and `full-exam-${id}-completed` (value 100) are written by the full-exam rehearsal screen. They only record that the learner opened or closed a rehearsal. They say nothing about language ability.
- Because they lived in `mastery`, every change went through `captureMasteryMutationEvents`. So opening a rehearsal created a **mastery evidence event** with source `full-exam-workflow`.
- These keys also inflated `masteryDerivationSummary().legacyFallbackKeys` and the reset wizard's `masteryCount`.

The other keys named in the ledger were checked one by one:

| Key | Written by | What it is | Decision |
|---|---|---|---|
| `full-exam-*-started` / `-completed` | full-exam rehearsal screen | UI workflow state | **moved out of `mastery`** |
| `level-*-knowledge` / `-retention-verified` / `-ready` | level assessment after a 48-item form | assessment outcome derived from stored attempts (`buildLevelEvidenceGate`) | stays an assessment result |
| `module-*` | module review (score × 10) | assessment score | stays |
| `exam-target-*` | targeted exam simulations | assessment score | stays |
| `diagnostic` | diagnostic | assessment score | stays |

`level-*-ready` is a gate result rather than a raw score. It is still produced only by evaluating stored attempts, and its readers already treat it as legacy and unverified when no run exists (`legacyReadyUnverified`). Moving it would change four readers without changing what the value means.

## Decision

1. **New state field `workflowMarkers: Record<string, { value: number | null; updatedAt: string }>`**, with schema default `{}`.
   - Older schema-v3 snapshots and archives therefore parse unchanged. There is no schema version bump and no reset.
   - `value: null` is a **tombstone**. Merges keep the newest `updatedAt` per key, so resetting a rehearsal on one device is not undone by importing an older backup. Before this change the event log's `delete` events gave that protection; the tombstone keeps it.
2. **Migration at the single load and import chokepoint.** `normalizeEventDerivedMastery`, used by local load, profile switch and archive import, now calls `separateWorkflowMarkers` first. `mergeLearningStates` also calls it on both sides. The migration:
   - moves marker keys out of `mastery`;
   - drops their legacy `full-exam-workflow` events;
   - takes the value and timestamp from the newest legacy event. A legacy `delete` becomes a tombstone. A key with no event uses the snapshot value and the state's `updatedAt`.
   - It is idempotent.
3. **`captureMasteryMutationEvents` ignores marker keys**, so a stray write can never produce mastery evidence again.
4. **The full-exam screen and the exam hub** read and write markers through `workflowMarkerValue`, `setWorkflowMarker` and `fullExamMarkerKeys`. "Reset marker" writes two tombstones.
5. **Reset and partial export.** The reset plan classifies `workflowMarkers` as progress, so it is cleared with `examSessions`. Classified fields go from 68 to 69, and cleared fields from 19 to 20. Partial export puts the field next to `mastery` in the progress section.
6. The `full-exam-workflow` value stays in the event-source enum so that old archives still parse. Normalisation removes those events after parsing.

## Consequences

- `mastery` and its event log now hold assessment and lesson evidence only. A rehearsal opened but never finished no longer shows up as "mastery".
- There is no learner-visible behaviour change in the rehearsal flow. Tests cover the migration, idempotence, merges in both orders with tombstones, the legacy backup case, archive import, and reset classification.
- **Not done:** `level-*-ready` remains a stored gate result instead of being recomputed on every read. That would be a separate readability change, not part of separating UI flags from evidence.

## ADR-132 — Per-learner, per-lemma evidence before reading (م17)

- Status: accepted, 2026-10-18 (v240)
- Policy IDs: `learner-lemma-evidence-v1` (new), `curriculum-lexical-context-v1` (new). `lemmatized-lexical-load-v2` (ADR-126) is unchanged and its report is byte-identical.
- Evidence tier: agent-authored engineering change under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»).

## Context

Ledger row م17 had one open gap after v234–v236: the lexical-load measure assumes "taught earlier = known". It never measures what one particular learner knows. ADR-126 says this explicitly: "unknown" means "not supported by earlier curricular exposure", never "the learner does not know the word".

The app already stores the evidence needed for a per-learner view. It just never joined that evidence to words:

- `reviewEvents`: card id, grade 0–5, `initial` or `delayed`, timestamp.
- `exerciseAttempts`: the learner's answer string, correct or not, timestamp.
- `completedLessonIds`.

## Decision

1. **Shared lexical context.**
   - The audit's stop list and legacy stemmer moved unchanged from `scripts/generate-lesson-quality-audit.ts` to `src/core/german/curriculum-lexical-context.ts`.
   - The script now imports them, and `reports/lesson-quality-audit.json` regenerates with no diff.
   - The audit and the learner view therefore agree on what a content word is.
2. **Per-word status, derived on the fly** in `src/core/evidence/learner-lexical-knowledge.ts`. There is no new state field, migration, export change or reset-plan change. For each non-name content word of the reading text, the most recent observation decides:

   | Status | Meaning |
   |---|---|
   | `struggling` | The latest observation is a failed lesson-card review (grade < 3). |
   | `retrieved` | The latest observation is a success, and at least one success was a **delayed** review (retrieval after a gap). |
   | `practised` | Successes only in initial reviews or correct exercise answers. |
   | `taught-only` | No observation, but the current lesson taught the word before the reading, or a lesson the learner **completed** covers it. |
   | `new` | None of the above. |

3. **What counts as evidence:**
   - **Word-level lesson cards** (authored flashcards and lesson phrases) whose German front contains one of the word's exact lemma candidates. Example-sentence and error cards are not used, because they test a sentence rather than a word.
   - **Correct exercise answers** that contain the word.
   - **Wrong answers are never attributed to a word.** A wrong answer does not say which word failed, and guessing would invent a weakness the learner never showed.
   - **Personal error-remediation reviews are skipped**, because their card front is the wrong form.
   - **Only exact lemma candidates credit evidence.** The audit's legacy `~stem` key is used only for the "taught" check, so `Wohnung` is never reported as practised because `wohnen` was.
4. **Bundle boundary.** The lesson page is a server component, so the work is split:
   - `src/data/reading-lexicon-seeds.ts` builds one compact seed per lesson at build time. Each word is a tuple: word, surface, hex bitmask of covering lessons, before-reading flag, and base-36 card refs.
   - The seed is passed as a prop. The curriculum and the 2,300-card list never reach the browser.
   - The browser joins the seed with the learner's own state.
   - Seed size: about 5.4 KB raw and 2.1 KB gzip per lesson page on average.
5. **Learner-facing use.**
   - The reading stage shows a short panel before the text with the five counts.
   - Below the counts it lists up to 10 German words the learner failed last time and up to 10 words new to them, without meanings.
   - Showing German without meanings is orientation, not translation, so opening the stage records no support use.
   - The panel says in Arabic that this is evidence tracking from this device and not a vocabulary test. It also says that wrong answers are not attributed to words.

## Consequences

- The learner sees, before reading, which words of this text they actually retrieved after a gap and which ones failed last time. The curriculum's "taught earlier" assumption is replaced by their own record wherever a record exists.
- Covered by `tests/unit/learner-lexical-knowledge.test.ts`:
  - parity of the stop list and stemmer;
  - mask and card-ref round trips for every word-level card;
  - seed fidelity for all 96 lessons;
  - time ordering and precedence;
  - skipping remediation reviews;
  - no credit through the stem key;
  - no credit from wrong answers;
  - completed-lesson coverage;
  - rendering;
  - the bundle boundary.
- E2E checks that the panel is present on the a1-01 reading stage.
- **Stated limits:**
  - It is deterministic, not a probability or forgetting model.
  - A phrase card credits all of its content words together.
  - Evidence is local to the device, like all learner state.
  - The panel is used on the reading stage only. Feeding the same status into review-queue prioritisation or exercise selection would be a separate decision.

## ADR-133 — Phrases for the speaking scenario of transfer tasks 9–24 (م39 remainder)

- Status: accepted, 2026-10-18 (v241)
- Policy ID: `after-commit-transfer-support-v1` (unchanged; same after-commit rule, wider coverage).
- Evidence tier: agent-authored content under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). Not reviewed by a human linguist.

## Context

ADR-130 gave the speaking lab a «عبارات للمحاولة التالية» panel only for tasks 1–8 of each level (32 tasks). Their speaking scenario parallels the written task, so the written-task phrases fit.

Tasks 9–24 (64 tasks) use a different speaking situation. For example, the written task for a1-03 is a message to the school, while the speaking task is a phone call that needs spelling and two requests for repetition. Offering the written phrases there would have trained the wrong situation, so ADR-130 offered nothing. Ledger row م39 recorded this as an open gap.

## Decision

1. **New map `speakingScenarioPhrases`** in `src/data/independent-transfer-support.ts`, keyed by source lesson.
   - It has five chunks per task for exactly the 64 tasks at positions 9–24: 16 per level.
   - Each set was written for that task's **speaking** prompt. It covers the moves the prompt demands, such as spelling and asking for repetition at A1, Perfekt with separable verbs at A2 (a2-02), `je … desto` at B1 (b1-07), and twice `doch`, once `ja` and once `halt` at B2 (b2-19).
   - Phrases stay at the task's level and use `…` where the learner inserts their own content. They contain no pork or alcohol words.
2. **`speakingTransferPhrases`**:
   - Tasks 1–8 keep the written-task phrases, unchanged.
   - Tasks 9–24 now return their scenario phrases.
   - A missing task id or source lesson still returns nothing.
3. **Same independence rule.** The panel opens only after a saved attempt. Opening it records an after-commit `hint` event, and any later recording of the task counts as guided, not independent (`afterCommitSpeakingSupportSeen`). Nothing about evidence changes.

## Budget

The curriculum source gzip rises by about 4 KB and stays under the 1,275,000 safety ceiling. The ceiling was not raised. B1/B2 written models stay deferred, as ADR-130 says, because the remaining reserve still does not hold them.

## Consequences

- All 96 independent transfer tasks now have a speaking aid that matches the situation being spoken.
- `tests/unit/after-commit-transfer-support.test.ts` checks the following:
  - tasks 1–8 still equal the written set;
  - tasks 9–24 have exactly 64 entries, keyed by their source lessons;
  - every task has five distinct phrases;
  - no phrase repeats the written set;
  - phrases contain no Arabic script and no excluded food words.
- **Stated limits:**
  - The phrases are agent-written to level norms, not checked by a human linguist.
  - There is no learner data yet on whether after-attempt phrases improve the next attempt for this group of learners.

## ADR-134 — Source verification of every IPA transcription and of the 18 Arabic-learner pronunciation claims (P1-380)

- Status: accepted, 2026-10-18 (v242)
- Policy IDs: `ipa-dictionary-source-verification-v1`, `arabic-learner-pronunciation-source-check-v1`
- Evidence tier: `source-verified-agent` (ADR-116). Not an independent phonetician's review; inventory `reviewStatus` stays `authored-review-pending`.

## Decision

1. All 601 distinct transcriptions (lesson items, 44 contrast-pair sides, 36 inventory sides) were compared with a pinned Wiktionary-derived dictionary (`open-dict-data/ipa-dict` `de.txt`, commit `43c3570e…`, CC BY-SA) by `scripts/verify-ipa-against-dictionary.ts`. Evidence: `reports/pronunciation-source-verification/IPA_SOURCE_VERIFICATION_2026-10-18.csv`. 17 rows carry a recorded manual decision (4 intonation arrows out of scope).
2. Eleven real transcription errors were corrected (notiere, jedoch, also, Komma, des, ausgewertet, allerdings ×2, unsicher, Telefonnummer, telefoniert), plus six notation alignments (r → ʁ ×4, deːɐ → deːɐ̯ ×2).
3. Each of the 18 Arabic-learner claims now cites published sources (`src/core/pronunciation/arabic-learner-claim-sources.ts`): 10 supported, 3 partially supported, 3 general DaF, 2 rewritten as positive transfer (Arabic has ه/ء and long/short a/i/u). The r row gained the sourced Ġain ≈ Zäpfchen-r hint.
4. `tests/unit/ipa-source-verification.test.ts` fails on any unverified transcription, unresolved mismatch, reintroduced error, or unsourced claim.

## Consequences

- P1-380 stays `partial`: an independent phonetician, calibration on real Arabic-speaker recordings, and the three guided-only rows remain open. No pronunciation score is claimed.

## ADR-135 — Question-critical reading support: no reading question may depend on a never-explained word

- Status: accepted, 2026-10-19 (v243)
- Policy ID: `question-critical-reading-support-v1`
- Authority: owner delegation «نفذ ما يفيد المتعلم و الصحيح». Agent-authored anchors and glossary entries stay `authored-review-pending`.

## Decision

1. `measureQuestionCriticalSupport` (`src/core/content-validation/lexical-load.ts`) lists reading words that also occur in a question prompt or keyed answer and that no earlier lesson, current phrase/card/vocabulary-stage anchor or reading glossary ever explained. The lesson-quality audit enforces `readingQuestionCriticalUnsupportedMax: 0`.
2. The 151 such words (75 lessons) were supported: 105 lesson-scoped noun anchors (`questionSupportNounSeeds`, shown openly in the vocabulary stage before the text), 42 glossary entries for verbs/adjectives/adverbs/determiners, and 4 proper names (Alexanderplatz, Hafenblick, Goethe, telc). Result: 0 at every level.
3. The original P0-98 scope stays 1,297 anchors / 89 pending (`originalP098NounEntries`); the new anchors have their own unsigned worksheet `reports/lexical-review-packet/question-support-noun-anchors.csv`.
4. Reading-load ratchet tightened to median ≤ 21% and max ≤ 39% (measured 20.3% and 38.6%). No stop-list change, no text or item rewrite.

## Consequences

- Noun anchors 1,297 → 1,402; covered candidates 1,385 → 1,503; `pendingHuman` unchanged at 89. Search entries 3,750 → 3,792. Curriculum gzip about +3 KB, ceiling unchanged.
- IDEA_BACKLOG 402 closed. See `docs/adr/ADR-135-question-critical-reading-support.md`.

## ADR-136 — Source verification of the ADR-135 noun anchors and an E2E proof for the speaking after-attempt phrases

- Status: accepted, 2026-10-19 (v244)
- Evidence tier: `source-verified-agent` (ADR-116) for the 105 anchors; not an independent German review.

## Decision

1. The 105 question-support noun anchors were compared with WiktionaryDE (`german_nouns` 1.2.5, CC BY-SA 4.0) on gender, accusative, dative and plural: 82 direct, 21 through the compound head, 2 checked by hand on de.wiktionary (Spanisch, Befragte), 0 mismatches. Evidence: `reports/lexical-review-packet/source-verification-question-support-nouns-2026-10-19.csv`; scripts `scripts/export-question-support-nouns.ts` and `scripts/verify-question-support-nouns.py`. A unit test ties the CSV to `questionSupportNounEntries`.
2. A browser test on `independent-a1-10` proves the ADR-133 rule: the phrase panel is absent before a saved independent attempt, opens closed, shows the speaking-scenario set, and records one after-commit `hint` event. E2E 66 → 67 per project.

## Consequences

- Arabic meanings, the 42 glossary entries and the 4 proper names are outside this check. Reviewer cells stay empty. No audit item changes state. See `docs/adr/ADR-136-question-support-source-verification-and-speaking-phrases-e2e.md`.

## ADR-137 — No reading or listening key is recognisable by length alone

- Status: accepted, 2026-10-19 (v245)
- Evidence tier: agent content edit checked by measured gates; not an independent German review.

## Decision

1. A "visible" length cue is a key that is the unique longest option by at least 5 characters and at least 15%. Before v245: reading 115, listening 96, mini-test 88, exercises 55 (354 of 1,250).
2. All 211 reading/listening items were rewritten (229 options): mostly one distractor lengthened with a trap from the text that stays false, 17 over-specified keys shortened. Distractors named in `explanationAr` were kept or lengthened compatibly.
3. Result: reading 0, listening 0; unique-longest key 38.0% → 27.6%; unique-shortest key unchanged at 63; positions unchanged; 0 misquotes.
4. `generate-lesson-quality-audit.ts` reports `multipleChoice.visibleLengthCue` and ratchets it per kind (0 / 0 / 88 / 55); `longestOptionCuePctMax` 40 → 28; a unit test forbids the cue in any reading or listening question.

## Consequences

- Mini-test and exercise items stay ratcheted at the measured count: their short ill-formed distractors need a rewrite that the curriculum budget (628 B left of 1,275,000) cannot carry, or an owner decision on the ceiling. Noun/verb candidates +19/+15 contextual only; covered and pendingHuman unchanged. IDEA_BACKLOG 399 and 404 closed. See `docs/adr/ADR-137-comprehension-mcq-length-cue-review.md`.

## ADR-138 — No mini-test or exercise key is recognisable by length alone

- Status: accepted, 2026-10-19 (v246)
- Evidence tier: agent content edit checked by measured gates; not an independent German review.

## Decision

1. The 143 mini-test (88) and exercise (55) items that ADR-137 had ratcheted were rebuilt with near-miss distractors of about the key's length that reuse the key's words. Grammar items get the same sentence with one word-order or morphology slip; function items get a well-formed sentence doing the wrong job (no deadline, blame, overgeneralisation, ambiguous reference). Five over-specified keys were shortened, with their quotes updated.
2. Distractors quoted in `explanationAr` were only lengthened by appending, so quotes stay verbatim; quote exceptions unchanged at 70.
3. Result: visible cue 0 in all four kinds; unique-longest key 27.6% → 20.8% (audit metric 27.5% → 20.8%); unique-shortest unchanged at 63; positions unchanged.
4. `visibleLengthCueByKindMax` is 0 / 0 / 0 / 0; `longestOptionCuePctMax` 28 → 21; a unit test forbids the cue in any mini-test or exercise item.

## Consequences

- The generated Mini-Test mirror (`src/data/local-test-templates`) doubled the cost of every Mini-Test edit and pushed the curriculum 310 B over the unchanged 1,275,000 B ceiling. Its generator now writes one question per line instead of 2-space pretty-printing (identical data, still drift-checked), which brings the curriculum to 1,272,322 B. Noun/verb candidates +4/+5 contextual only; covered and pendingHuman unchanged. IDEA_BACKLOG 397 closed. See `docs/adr/ADR-138-mini-test-exercise-length-cue-review.md`.


## ADR-139 — Teach the missing Goethe-Zertifikat A1 core vocabulary inside the A1 lessons

- Status: accepted, 2026-10-19 (v248)
- Owner decision: «نعم» to raising the curriculum ceiling for the A1 gaps. Content under the owner delegation «نفّذ ما يفيد المتعلم والصحيح».
- Evidence tier: agent content edit checked by measured gates and a WiktionaryDE source check; not an independent German review.

## Decision

- Curriculum hard limit 1,500,000 → 1,540,000 B gzip. The 15% reserve is unchanged, so the safety ceiling is 1,275,000 → **1,309,000**. The JS, audio and pack limits are unchanged.
- No new lessons. The missing A1 words go into the A1 lesson of their theme:
  - 235 vocabulary phrases
  - 245 review cards (appended)
  - 23 matching exercises `a1-NN-e8`, each aligned or explicitly unaligned
  - 144 lesson-scoped noun anchors in their own worksheet, outside P0-98. A1 pendingHuman stays 0.
- All 144 anchors are confirmed against WiktionaryDE (`german_nouns` 1.2.5): 142 by gender and case forms, and 2 Pluraletantum.
- Listening transcripts and audio are untouched. Months use MSA names only.

## Consequences

- A1 headwords appearing in A1 lessons: 67.2% → **98.8%**. Taught explicitly: 51.5% → **82.8%**. Missing at A1: 220 → 8, and only `tot` and `der Bogen` are genuinely absent.
- Curriculum gzip is 1,287,127 of 1,309,000.
- Still open under IDEA 407: the missing A2, B1 and B2 themes and the A1/A2/B1 mock exams. Another ceiling raise needs a new owner decision.
- Details: `docs/adr/ADR-139-goethe-a1-core-vocabulary.md`.

## ADR-140 — Audit every page as a learner far from the build day and zone

- Status: accepted, 2026-10-19 (v249). Agent batch under the owner delegation «نفّذ ما يفيد المتعلم والصحيح».
- Context: the static pages are built once and opened later in other zones. `/exams` (freshness status), `/errors` (weekly trend labels) and `/settings` (quiet-hours zone, quiet-active flag, AI capability rows) computed visible text from the device clock or zone during the first render. React then threw #418 and rebuilt the whole tree on the client. The 642-check browser audit missed it because it ran on the build day in the build zone.
- Decision: the device values now arrive after hydration via `useDeviceDay` / `useDeviceMinute` / `useDeviceValue`. The mobile pass of `a11y:browser` runs with the clock +400 days and the `Pacific/Kiritimati` zone, so any recurrence fails `npm run check`. Pinned by `tests/unit/off-build-hydration.test.ts`.
- Result: off-build probe over 321 routes, 3 → 0 failing. JS +493 B gzip. No content change. Pack generation v249.
- Details: `docs/adr/ADR-140-off-build-hydration-audit.md`.

## ADR-141 — Teach the missing Goethe-Zertifikat A2 vocabulary inside the A2 lessons, with an owner-approved JS ceiling

- Status: accepted, 2026-10-19 (v250). Owner chose «ارفعه 80 KB» for the JavaScript ceiling; content under the delegation «نفّذ ما يفيد المتعلم والصحيح».
- Context: the A2 lessons used 889 of 1,136 Goethe A2 headwords (78.3%) and taught 715 (62.9%). The environment and clothing themes were missing. The content fitted the curriculum ceiling, but the client JS had only 3,436 B left under 2,125,000.
- Decision: JS total hard limit 2,500,000 → 2,594,118, so the 15%-reserve ceiling is 2,205,000 (+80,000); other limits unchanged (ADR-049 amendment note). 240 words added to the existing 24 A2 lessons: a vocabulary phrase and a review card each, 23 `a2-NN-e8` matching exercises, and 144 lesson-scoped noun anchors (`a2GoetheCoreNounEntries`, scope `ADR-141-goethe-a2-core-noun-anchor`), all 144 confirmed against WiktionaryDE via `german_nouns` 1.2.5.
- Result: A2 headwords appearing 1,130 (99.5%), taught ≥ 955 (84.1%), missing 247 → 6. JS 2,135,587 B, curriculum 1,301,956 B. Pack generation v250. Pinned by `tests/unit/goethe-a2-core-vocabulary.test.ts`.
- Details: `docs/adr/ADR-141-goethe-a2-core-vocabulary-and-js-ceiling.md`.

## ADR-142 — Teach the missing Goethe-Zertifikat B1 food and perception vocabulary inside existing B1 lessons

- Status: accepted, 2026-10-20 (v251). Owner «واصل» under the delegation «نفّذ ما يفيد المتعلم والصحيح»; no ceiling raised.
- Context: the official B1 themes food (Verpflegung) and perception/movement (Wahrnehmung/Motorik) had no lesson; their headwords were absent from every lesson. Only 7,044 B were left under the 1,309,000 B curriculum ceiling.
- Decision: 72 words added to b1-08, b1-10, b1-12, b1-20 and b1-23 (phrase + card each, five `b1-NN-e8` matching exercises), 43 lesson-scoped noun anchors (`b1GoetheCoreNounEntries`, scope `ADR-142-goethe-b1-core-noun-anchor`), all 43 confirmed against WiktionaryDE. «achten» is taught without a frame target so no new review item waits.
- Result: B1 headwords appearing 1,857 → 1,931 (68.2%), taught ≥ 1,461 (51.6%), absent 813 → 740. JS 2,140,111 B, curriculum 1,306,762 B (2,238 B left). Pack generation v251. Pinned by `tests/unit/goethe-b1-core-vocabulary.test.ts`.
- Details: `docs/adr/ADR-142-goethe-b1-food-and-perception-vocabulary.md`.

## ADR-143 — Audit every Goethe vocabulary addition and guard it with a permanent test

- Status: accepted, 2026-10-20 (v252). Owner: «كل اضافة قم بمعالجتها و التدقيق فيها اريد عمل خالي من الاخطاء و الهوفوات — العمل مخطط و مرتب و موثوق». No ceiling raised.
- Context: the v248/v250/v251 gates checked structure, not the accuracy of Arabic meanings, the naturalness of German examples or the consistency of a word across surfaces.
- Decision: automatic checks plus a full manual reading of the 556 added cards, their meanings and the 51 matching explanations. 8 real errors were fixed (a duplicate a1-08 card replaced in place so no card ID moves, a misleading «nirgends» gloss, two unnatural examples, missing punctuation, wording). 72 older phrase/card meanings in the same lessons were aligned to the more accurate one (including «zu früh/zu spät» wrongly glossed «جدًا»). New permanent guard `tests/unit/goethe-additions-quality-guard.test.ts` over the 53 lessons that received words.
- Result: 0 open errors in the additions. Noun contextual candidates 5,394/3,460 → 5,393/3,459. JS 2,139,956 B, curriculum 1,306,607 B (2,393 B left). Pack generation v252.
- Details: `docs/adr/ADR-143-audit-of-goethe-vocabulary-additions.md`.

## ADR-144 — Audit the remaining B1 and B2 vocabulary and guard all 96 lessons

- Status: accepted, 2026-10-20 (v253). Owner «واصل» under the instruction to audit every addition; no ceiling raised.
- Context: the ADR-143 guard covered 53 lessons; run over the other 43 (19 B1, 24 B2) it reported 65 problems, and a manual reading of their 451 cards found more weak examples.
- Decision: 59 phrase/card meanings aligned (including «eine Frist vereinbaren» → مهلة, «offenlegen» → يكشف); the 18 b2-19 phrases translated, with the tone note kept in brackets; 46 card examples completed or corrected (one unrelated example, 19 ending in «…», examples missing their own word, guillemets → „…“). No card added, removed or reordered. Guard widened to all 96 lessons with two new rules (no example ending in «…», no «» in German examples).
- Result: 0 guard problems in 96 lessons. Contextual candidates: nouns 5,401/3,467, verb pairs 1,338/1,203 (pending 89 + 1 unchanged). JS 2,140,456 B, curriculum 1,307,086 B (1,914 B left). Pack generation v253.
- Details: `docs/adr/ADR-144-audit-of-all-b1-b2-vocabulary.md`.

## ADR-145 — Audit all exercises and mini-tests and guard them

- Status: accepted, 2026-10-20 (v254). Owner «واصل» under the instruction to audit every addition; no ceiling raised.
- Context: ADR-143/144 audited the vocabulary cards; the 728 exercises and 480 mini-test items had not been read against their options.
- Decision: 44 word-ordering tasks whose chips (shown unshuffled) already read as an accepted answer were reordered, a1-03-e3 became a four-word phrase from the lesson; 77 items had an explanation, option or prompt corrected (including «zehn Uhr zwanzig» → «dreißig» for 10:30, a false Fugen-s in «Studienberatung», «sodann» listed as a result connector, explanations that described other options, typos). No item added, removed or reordered. New guard `tests/unit/exercise-explanation-guard.test.ts` with planted errors.
- Result: guard clean over 728 + 480 items. Contextual candidates: nouns 5,401/3,467 unchanged, verb pairs 1,334/1,199 (pending 89 + 1 unchanged). JS 2,140,647 B, curriculum 1,307,170 B (1,830 B left). Pack generation v254.
- Details: `docs/adr/ADR-145-audit-of-all-exercises-and-mini-tests.md`.

## ADR-146 — Audit all reading and listening questions; no option named by position

- Status: accepted, 2026-10-20 (v255). Owner «واصل» under the instruction to audit every addition; no ceiling raised.
- Context: ADR-145 audited exercises and mini-tests; the 288 reading and 288 listening questions had not been read against their texts and transcripts. Options of these questions, mini-tests and multiple-choice exercises are shown shuffled, yet some explanations named options by position.
- Decision: 24 questions corrected (22 explanations that contradicted or overstated the text, for example «inbegriffen» for a breakfast that is «nicht dabei», the arm for stomach pain, a cancelled appointment that was moved; three off-text distractors in b2-08-rq2 and one distractor equal to the key in b2-17-rq1 replaced). 15 explanations now name options by content instead of «الخيار الثاني / الجملة الأخيرة». No `transcriptDe` changed, no item added, removed or reordered. New guard `tests/unit/option-position-reference-guard.test.ts` with planted errors.
- Result: 576/576 questions read, 0 positional references to shuffled options. Contextual candidates: nouns 5,400/3,466, verb pairs 1,335/1,200 (pending 89 + 1 unchanged). JS 2,140,719 B, curriculum 1,307,248 B (1,752 B left). Pack generation v255.
- Details: `docs/adr/ADR-146-audit-of-reading-and-listening-questions.md`.

## ADR-147 — Audit all theory blocks and common mistakes; show mistake text in its real language

- Status: accepted, 2026-10-20 (v256). Owner «واصل» under the instruction to audit every addition; no ceiling raised.
- Context: ADR-146 audited reading and listening questions; the 272 theory blocks and 392 common mistakes had not been read item by item. 129 wrong/correct fields are Arabic strategy notes, but every renderer marked them German and left-to-right, and review cards marked the German back of every mistake card as Arabic.
- Decision: 50 corrections in 33 lessons (unclear German such as «Der Flug ist spät», mistakes whose correct line changed more than the error, Arabic glosses that only repeated the German, Arabic grammar and wording, «…»/„…“ and a markdown asterisk pair). The lesson mistakes section, memory map, search results and review cards now use `fragmentLanguageAttributes`, and `mistakeLine` points the arrow along the reading direction. Nothing added, removed or reordered; no `transcriptDe` changed. New guard `tests/unit/theory-mistake-guard.test.ts` with planted errors; the language/Bidi audit requires the classifier in the four renderers.
- Result: 272/272 blocks and 392/392 mistakes read; 0 mistake fields shown in the wrong language. Contextual candidates: nouns 5,399/3,465, verb pairs 1,334/1,199 (pending 89 + 1 unchanged). JS 2,141,691 B, curriculum 1,307,311 B (1,689 B left). Pack generation v256.
- Details: `docs/adr/ADR-147-audit-of-theory-and-common-mistakes.md`.

## ADR-148 — Audit all writing, speaking and mediation tasks; stop the writing analyser from misreading correct German

- Status: accepted, 2026-10-20 (v257). Owner «واصل» under the instruction to audit every addition; no ceiling raised.
- Context: ADR-147 audited theory and mistakes; the production tasks of the 96 lessons had not been read item by item. Most A1–B1 models (and b2-05 … b2-08) had padding sentences after the closing or decision, four A1 prompts had no word range, and the app's own writing analyser marked nine models as wrong.
- Decision: 164 field corrections in 91 lessons (models reordered so the closing comes last, repeats deleted, contradictions fixed, prompts and Arabic prompts with one shared «N–M Wörter» range, Arabic agreement and wording, „…“ in German production text). The analyser gets a shared `splitGermanSentences` (dates, abbreviations, e-mail addresses), an «er»-only conjugation pattern that ignores infinitives before modal verbs, a perfect pattern that does not cross a comma, more connectors, and one shared greeting rule `writingTaskNeedsGreeting`. New guard `tests/unit/production-task-guard.test.ts` with planted errors.
- Result: 96/96 lessons read; 0 prompts without a range; 0 models failing the analyser. Contextual candidates: nouns 5,389/3,455, verb pairs 1,339/1,204 (covered 1,845 + 134 and pending 89 + 1 unchanged). JS 2,143,425 B, curriculum 1,307,930 B (1,070 B left). Pack generation v257.
- Details: `docs/adr/ADR-148-audit-of-writing-speaking-and-mediation-tasks.md`.

## ADR-149 — Audit lesson entry, header, discovery and pronunciation in all 96 lessons

- Status: accepted, 2026-10-20 (v258). Owner «واصل» under the instruction to audit every addition. Curriculum hard limit 1,540,000 → **1,560,000** B gzip after the owner's answer «لا يهم السقف ساستعمله اونلاين دائما»; the 15% reserve is unchanged, so the safety ceiling is 1,309,000 → **1,326,000**. JS ceiling unchanged.
- Context: ADR-148 audited the production tasks; the opening layer of each lesson (header, entry scene and dialogue, discovery, pronunciation) had not been read item by item. Many pronunciation glosses were truncated to one or two words, b2-17 … b2-24 glosses were sound notes without a meaning, and several pronunciation statements, scene names and discovery questions were wrong.
- Decision: 343 field corrections in 78 lessons (240 pronunciation glosses completed, with «…» mirroring open German frames; meanings added before the B2 sound notes; daDURCH as neutral stress, Ach-Laut focus, „der Ach-Laut“, ROLLENbasiert; scene names and genders matched to the speakers; discovery questions answerable from the examples; Arabic dialogue lines that translate their German line; „…“ in German fields). Changed IPA re-verified against the pinned ipa-dict (SHA-256 match); CSV and `curriculum-phoneme-reference.generated.ts` regenerated. New guard `tests/unit/entry-discovery-pronunciation-guard.test.ts` with planted errors.
- Result: 96/96 lessons read; 0 open German frames without «…» in the gloss; 0 German «…» in the audited fields. Lexical coverage unchanged (covered 1,845, pending 89, contextual 3,455; row-by-row diff against `6b1e083`). JS 2,145,427 B, curriculum 1,309,847 B (16,153 B left). Pack generation v258.
- Details: `docs/adr/ADR-149-audit-of-lesson-entry-discovery-and-pronunciation.md`.

## ADR-150 — German quotation marks, Goethe A1/A2 closure, and the missing Goethe B1 theme vocabulary

- Status: accepted, 2026-10-21 (v259). Owner «واصل» after the v258 report, under the instruction to audit every addition. No ceiling raised.
- Context: ADR-149 left «…» in German strings (b2-module6 texts, nursing layer). The Goethe comparison reported A1 662/670, A2 1130/1136 and B1 1,931/2,830; six B1 lessons had a matching theme but lacked its everyday headwords.
- Decision: 35 German fields / 50 pairs «…» → „…“, with the two explanations and two reading-evidence locators that quote them; guard `german-quote-typography-guard` (source, built lessons, locator quotes). `BOUND_FORMS` in the Goethe comparison plus „Grüße Gruß“ remove the A1/A2 false negatives; Bogen, tot and die meisten are taught in a1-03/a1-04/a1-19 readings. 124 B1 words in b1-01/03/06/07/11/19 (phrase + card + one matching e8 per lesson), 117 noun anchors appended at the end of the seeds with their own scope `ADR-150-goethe-b1-themes-noun-anchor`, 117/117 confirmed against WiktionaryDE.
- Result: A1 669/670, A2 1136/1136, B1 2,076/2,830 (73.4%), taught ≥ 1,606. Noun anchors 1,850; pending stays 89 (row-by-row diff). Exercises 734, governed records 3,334. JS 2,154,585 B, curriculum 1,318,935 B (7,065 B left). Pack generation v259.
- Gates: three new vite/launch-editor dev-server advisories (fix available) were fixed with `overrides` vite ^8.3.5, not accepted. Offline fingerprint `9afd336bdc9c`.
- Details: `docs/adr/ADR-150-german-quotes-goethe-a1-a2-closure-and-b1-theme-vocabulary.md`.

## ADR-151 — Goethe B1 vocabulary for feelings, media, arts and literature, and environment and community

- Status: accepted, 2026-10-21 (v260). Owner «واصل» after the v259 report, under the instruction to audit every addition. No ceiling raised.
- Context: after ADR-150, 600 B1 headwords were absent from every lesson; four B1 lessons (b1-05 feelings, b1-16 media, b1-17 stage and literature, b1-21 environment and community) lacked their everyday headwords.
- Decision: 80 words as phrase + card with example, one matching e8 per lesson; 64 noun anchors appended with scope `ADR-151-goethe-b1-themes-2-noun-anchor`, 64/64 WiktionaryDE. The pre-commit audit fixed two glosses that overclaimed (Reportage, Erzählung), a case term without a case contract, a non-verbatim quote and an overclaim in an explanation.
- Result: B1 2,170/2,830 (76.7%), taught ≥ 1,702, absent 508. Noun anchors 1,914; pending stays 89 (row-by-row diff). Exercises 738, governed records 3,338. JS 2,160,450 B, curriculum 1,324,754 B (1,246 B left). Pack generation v260.
- Details: `docs/adr/ADR-151-goethe-b1-feelings-media-arts-environment-vocabulary.md`.

## ADR-152 — Goethe B1 vocabulary for police and courts, city buildings, study and sport, with one moderate curriculum-ceiling step

- Status: accepted, 2026-10-21 (v261). Owner «واصل» after the v260 report announced a small ceiling step; authority: «لا يهم السقف ساستعمله اونلاين دائما» (ADR-149).
- Context: after ADR-151, 508 B1 headwords were absent from every lesson, and the curriculum had 1,246 B left under 1,326,000.
- Decision: curriculum hard limit 1,560,000 → 1,580,000 (safety 1,343,000, 15% reserve kept; JS ceiling untouched). 80 words as phrase + card with example in b1-18 (police and courts), b1-09 (city buildings and services), b1-13 (study), b1-22 (sport), one matching e8 per lesson; 71 noun anchors appended with scope `ADR-152-goethe-b1-themes-3-noun-anchor`, 71/71 WiktionaryDE. The pre-commit audit fixed a doubled article in the weak-noun forms and a plural taken from the wrong sense (der Bau).
- Result: B1 2,263/2,830 (80.0%), taught ≥ 1,797, absent 416. Noun anchors 1,985; pending stays 89 (row-by-row diff). Exercises 742, governed records 3,342. JS 2,166,322 B, curriculum 1,330,848 B (12,152 B left under 1,343,000). Pack generation v261.
- Details: `docs/adr/ADR-152-goethe-b1-police-city-study-sport-vocabulary-and-ceiling-step.md`.

## ADR-153 — Goethe B1 vocabulary for opinions, people and places at work, trades and qualifications, and shapes and charts

- Status: accepted, 2026-10-21 (v262). Owner «واصل» after the v261 report.
- Context: after ADR-152, 416 B1 headwords were absent from every lesson; b1-02, b1-04, b1-14, b1-15 and b1-24 had no vocabulary e8.
- Decision: no ceiling change. 80 words as phrase + card with example in b1-02 (opinions, doubt and attitude), b1-04 (people and places at work), b1-14 (trades, experts and qualifications), b1-15 (shapes and charts on slides), one matching e8 per lesson; 59 noun anchors appended with scope `ADR-153-goethe-b1-themes-4-noun-anchor`, 59/59 WiktionaryDE. The pre-commit audit fixed the gloss of mittlerweile, two example sentences and one explanation, added the missing ADR-152 evidence file to the review-packet description, and checked all 93 newly matched headwords for false matches (none). Counting fix: the `--from-report` mode re-added three registry-only headwords to taughtExplicitly on every run and could not see five words removed in v257; A1 and B1 were recounted in full from PDFs whose SHA-256 match the pinned editions (the v248 figures were reproduced exactly first), the script now records `explicitWhileAbsentList` and is idempotent, guarded by `goethe-reference-report.test.ts`.
- Result (full recount): B1 2,352/2,830 (83.1%; at most 2,351 real because das Zeug stays a false match), taught 1,890 (66.8%), absent 327, first in B2 149. A1 unchanged at 669/670; A2 carried over at 1136/1136. Noun anchors 2,044; pending stays 89 (row-by-row diff). Exercises 746, governed records 3,346. JS 2,171,803 B, curriculum 1,336,274 B (6,726 B left under 1,343,000). Pack generation v262.
- Details: `docs/adr/ADR-153-goethe-b1-opinion-workplace-trades-charts-vocabulary.md`.
