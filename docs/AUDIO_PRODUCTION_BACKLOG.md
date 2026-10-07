# حالة إنتاج صوت الامتحان

Sync batch: v183 · 2026-10-07 · Repository-only P0-99 stage-2 guard: `auditP099QualityTargetReviewSlots` reads the independent 126-target sheet (`frame-quality-targets.csv`) as presence only and `p099:evidence:status` now reports stage-2 progress per level (`Stage 2 rows with a recorded signature (presence only; contents not interpreted): 0/126`, `0/630` cells, A1 0/25 · A2 0/30 · B1 0/31 · B2 0/40) while restating `Review decision contents interpreted: no` and `P0-99 closure asserted: no`. The reader fails closed on ordering: any recorded signature in the 126-target sheet while an exclusion evidence reference is still unnamed stops the run with "The exclusion evidence comes first", so stage 2 cannot be signed ahead of the eight exclusion names. `handoff:check` validates the row/cell denominators (126 rows × 5 columns = 630), the per-level 25/30/31/40 distribution, the signed-versus-cell consistency, and refuses any stage-2 signature while the named-reference count is below 8. No sheet row, review decision, or signature was added or changed; the independent 126-target scope and `reviewScope` remain unchanged. Local `npm run check` passed: 1,380/1,380 tests in 203 files, lint/typecheck/audits clean, 323 statically built HTML pages; build fingerprint `c8a61637c676` (full 6,007,209 gzip), JS 128 / 2,017,616 gzip / max 262,117, media 544 / 52,943,843 bytes, curriculum 1,118,105 gzip, contrast 323 pages / 22,960 elements / 0 failures; regenerated tracked `public/offline-size-manifest.json`, `reports/js-budget-report.json`, `reports/media-pack-budget-report.json`, `reports/human-review-audit.json`, and `docs/generated/HUMAN_REVIEW_LEDGER.md`. No cache generation change (v183 active/staging; v182 rollback). Quality Gate `37648620168` passed on `d9506da`: `check` 7m30s and E2E 12m38s. Vercel previews were rate-limited on `e5d285a`, `d9506da`, and `4fbfec0` (`upgradeToPro=build-rate-limit`) and built successfully on the intervening heads `8c23227` and `ec8994a`; the limit is an external project quota, not a repository failure, but the code-bearing revision `d9506da` has no preview URL of its own. Quality Gate `37650404668` passed on the documentation head `4fbfec0` (`check` 6m5s, E2E 17m57s) with no Vercel preview for that revision. No Production claim and no merge claim; PR #7 remains open. No audio asset, production status, or audio claim changed.

Historical v182 follow-up: `neutral-self-waveform-comparison-v1` processes same-origin model audio and the learner Blob in memory only (≤60 seconds / ≤4,000,000 compressed bytes each); active/staging were v182 with v181 retained then. Current active/staging caches are v183, with v182 retained for rollback. Route list and learner-state schema are unchanged; P2-355's authored mini-test generator remains available in every Offline pack.

P2-355 remains intact: `/practice/test-generator` and its 480 authored templates from 96 published lessons are included in all five Offline packs; feedback is session-only with no mastery, progress, CEFR, or daily-plan effect.

Current contract: ADR-100 (2026-10-02) supersedes earlier completion/readiness/time guarantees. Read docs/LEARNING_REPAIRS_AR.md and the current QA block in PROJECT_STATUS.md; historical measurements below are not current source evidence.

New longer-input bank: 8 device-TTS-only tasks; 0 new MP3 or human recordings. Existing 96 lesson / 80 library / 96 exam MP3 files remain synthetic with review pending.

آخر تحديث: 2026-09-20 مقابل `v138`. القسم التاريخي أدناه يبقى كما قيس يومها، وتلي جدولَ الحالة طبقةُ totals المقيسة الآن.

## الحالة الحالية

- مهام الاستماع الكلية: 42.
- التدريبات المستهدفة المكتملة بملفات MP3: 7/7.
- مهام المحاكاة الكاملة المكتملة بملفات MP3: 35/35.
- مهام المحاكاة الكاملة المتبقية: 0.
- ملفات MP3 الحالية: 96.
- المقاطع المنطقية المغطاة: 90/90.
- المقاطع المنطقية المتبقية: 0.
- الملفات الفيزيائية المتبقية: 0.

اكتمل الصوت الاصطناعي لكل مهام الاستماع المستهدفة ولكل مهام المحاكاة الكاملة لدى Goethe وtelc. تتضمن الملفات الفيزيائية الستة الزائدة على عدد المقاطع المنطقية Segments مرتبة للمقاطع الطويلة.

## الطبقات الصوتية الثلاث عند v138 (قيس 2026-09-20)

ملفات MP3 في `public/audio` = 272، ومقابلها 272 بديل Ogg Opus، أي 544 ملفًا و52,943,843 بايتًا أصلية و937,466 بايتًا gzip للمنهاج الصوتي. التوزيع: 96 للامتحان و96 للدروس و80 للمكتبة. السقف 70 ميغابايت بقرار ADR-076 وADR-077، والهامش المحترم الآن 15%.

هذه الطبقات كلها مولَّدة وآلية التحقق من البنية (طول، تسلسل مقاطع، checksum، كثافة كلمات)؛ ولا تعني أن الاستماع البشري وقع. بند «مراجعة صوتية بشرية» ما زال مفتوحًا، ولا يُقفل إلا بتوقيع مسمًّى.

## سرعات الاستماع التعليمية

يوحّد `learning-playback-speed-v1` السرعات 0.75×/1×/1.15× في التهيئة والتشخيص والدروس والمكتبة والتدريب الامتحاني الموجّه وShadowing، مع طلب `preservesPitch=true` وتمرير السرعة نفسها إلى Browser TTS والمقاطع الامتحانية المتسلسلة. تبقى البروفة الزمنية المتصلة على 1×، ولا تتغير تسجيلات المتعلم.

هذا تنفيذ تقني مختبر آليًا، وليس حكمًا بأن التبطئة والتسريع خاليان من التشويه على كل جهاز وصوت. تُفحص السرعات فعليًا ضمن المراجعة الصوتية النهائية.

## مراحل الإغلاق المتبقية

1. **مراجعة صوتية بشرية:** وضوح النطق، الأرقام، الأسماء، الوقفات، وسلامة مطابقة الصوت للنص، إضافة إلى تشويه 0.75× و1.15× على أجهزة وأصوات TTS ممثلة. الملفات الحالية اصطناعية وأحادية المتحدث وليست صوت امتحان رسميًا.
2. **إنتاج/مراجعة متعدد المتحدثين إن توفر مورد مجاني مرخّص:** خصوصًا الحوارات والمقابلات؛ ليس شرطًا لتشغيل التطبيق الحالي لكنه مهم لجودة الاستعداد السمعي.
3. **مراجعة أكاديمية مستقلة:** مستوى CEFR، دقة الشرح العربي، ومفاتيح الإجابة.
4. **مراجعة حقوق التوزيع:** ملفات المشروع موسومة `generated-for-project-review-required` ولا يجوز افتراض صلاحية التوزيع التجاري قبل مراجعة شروط مزود التوليد.
5. **GitHub وVercel:** الكود مهيأ، لكن الرفع والنشر الفعليان يحتاجان مستودعًا وحسابات/صلاحيات المستخدم.

## حدود ليست منجزة ولا يُدّعى وجودها

- لا توجد تسجيلات بشرية أو صوت رسمي من Goethe أو telc.
- لا يوجد شريك محادثة حي.
- لا توجد درجة نطق صوتية موثقة.
- لا توجد مراقبة امتحان رسمية أو Browser lockdown كامل.
- لا توجد مراجعة بشرية مستقلة مكتملة حتى الآن.

## User-reported Full 02 truncation audit — 2026-09-02

The speech-generation UI excerpts for several Full 02 clips appeared visually truncated (notably `t2-h2` after “aber nur” and `g2-h1-4` after “Wer”). The committed files are present and materially longer than those excerpts:

```text
g2-h1-1  13.848 s
g2-h1-2  13.632 s
g2-h1-3  14.328 s
g2-h1-4  12.720 s — source ends “eine Erstattung beantragen.”
g2-h1-5  12.648 s
g2-h2     81.192 s — source ends “warum etwas übrig bleibt.”
g2-h3     60.768 s — source ends “die Jugendlichen selbst.”
g2-h4    100.632 s across 2 ordered segments — source ends “Leistung nach einem Abstand.”
t2-h1     25.032 s — source ends “bis Montag möglich.”
t2-h2     48.552 s — source ends “Nutzung ohne Onlinekonto.”
```

Automated checks now enforce, for every one of the 90 logical exam clips:

- complete physical segment chain;
- MP3 frame-chain, byte-size, duration, checksum, and payload variation;
- transcript-character and word density within conservative speech bounds;
- explicit source-ending assertions for the reported Full 02 clips.

This makes a grossly truncated file fail CI. It does **not** prove by itself that every final word is pronounced correctly: exact content equivalence still needs independent human listening or a validated speech-to-text alignment review. The files remain synthetic, single-speaker, and `examGrade: false`.
