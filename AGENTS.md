<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Sync batch: v194 · 2026-10-14 · مراجعة استثناءات الاقتباس، الدفعة 6 (a2-15 إلى a2-19): 7 اقتباسات في الشروح صُحّحت لتطابق نص الدرس حرفيًا، وأُعيدت كتابة شرح a2-19-lq2 (كان يخترع اقتباسًا «Fünf Wörter pro Tag lerne ich» ويزعم أن ثلاثة وعشرة وعشرين ترد في التسجيل)، و9 بنود أُبقيت كما هي بقرار الوكيل بتفويض صريح من المالك (مسجَّل تفويضًا لا مراجعةً بشرية بندًا بندًا)؛ الاستثناءات 150 → 141 (24 مُبقى، 117 غير مراجع)؛ pack cache v194 (staging v193, previous v193). Previous batch note: 2026-10-14 · 22 شرحًا لترتيب الكلمات كانت تَعِد بـ«ويُقبل أيضًا» ببديل يرفضه المصحّح (أُزيلت البدائل في جولة 2026-10-10 لأنها لا تُبنى من الكتل المعروضة وبقي الوعد في الشرح) — أُزيل الوعد وأُضيف حارس وحدة؛ الإجابات بصيغة واحدة 226/387 (58.4%) بلا تغيير؛ تصحيح تناقضات برومبت الاستمرار (قوائم P2 = 133/7/2، الاستبعادات 11، المسار، الفقرات التاريخية)؛ pack cache v193 (staging v192, previous v192). Previous batch note: 2026-10-11 · ملخص أسبوعي من الأدلة المحلية (أرقام فقط بلا درجة) وملف متابعة للمدرّب (Markdown، بلا نصوص حرة افتراضيًا)؛ 2026-10-08 · route/UI fixes (broken /writing/portfolio link, copy-icon glyph); offline fingerprint ac82338f0809; pack cache v191 (staging v190, previous v190). Previous batch note: 2026-10-08 · P2-401 grammar labels: 63/64 source-checked (Wiktionary, DWDS, Duden); five labels corrected to dictionary-backed classes (nachträglich, zwangsläufig, pauschal = Adjektiv; bar = Adjektiv / Präposition; in der Nähe = mit Genitiv); 1 open (Nutzungssituation); pack cache v189 with v188 kept for rollback. Previous batch note follows · P2-401 grammar labels: record 57/64 source-checked (Wiktionary, DWDS, Duden) ...

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Pushed P2-352 head `b974c48` passed Quality Gate `37335158220` (64/64 Desktop + 64/64 Mobile E2E) and Vercel Preview; P0-302 is closed. PR #7 remains open, so P0-301 is partial until it is closed. Deployment Smoke was skipped by its guard; no production deployment is claimed.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

Independent evidence policy v2: bootstrap exits after real progress; never trust legacy readiness caches as new independent proof, never raise whole-lesson mastery from self-graded cards, never merge productive volume into a language score. Run fresh lesson:quality:audit and learning:integrity:audit as well as npm run check.

# Der Weg nach Berlin product rules

Read `PROFESSIONAL_CONTINUATION_PROMPT_AR.md`, `docs/MASTER_SPEC.md`, `PROJECT_STATUS.md`, `P0_AUDIT.md`, `P1_AUDIT.md`, `P2_AUDIT.md`, and `DECISIONS.md` before changing product behavior.
The primary UX is Coach/Today, not a lesson catalog. Durable learner data is local-first.
Never claim incomplete curriculum or media is complete. Run `npm run check` before reporting success.
After every batch, re-sync every standing document listed in `docs/adr/ADR-079-documentation-sync-marker.md` and update its `Sync batch: vNNN` marker; `npm run handoff:check` fails while a document lags the current pack generation.
The optional WebGPU model is Opt-in: never commit its downloaded weights, loosen pinned runtime/model hashes, add a silent WASM/paid fallback, or claim CI mocks equal physical GPU installation.
