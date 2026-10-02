# 2026-10-02 — production-candidate verification

This run validates the complete working tree on `arena/01a0fba1-wegberlin` after the WebGPU ESM and contrast fixes. It is a local production build plus browser QA, not a production deployment.

- `npm run build`: passed on Next.js 16.3.8; all 322 static/SSG pages generated. Offline, JavaScript, and audio budgets passed.
- `npm test`: 1,198 tests passed across 173 files.
- Full Playwright E2E suites: 58/58 desktop and 58/58 mobile, run as separate complete projects on headless Chromium 153 using a temporary executable at `/tmp/chromium`; no browser binary was added to Git.
- The endurance question label previously measured 3.59:1 (`#7b8984` on `#fffdfa`). Its foreground is now `#596c65` (5.50:1); the Axe assertion and full desktop/mobile suites pass.
- The WebGPU Worker test imports the vendored ESM files, constructs an ORT Tensor, and verifies no model weights are requested. It does **not** run inference or verify physical GPU execution.
- The Vercel Preview is access-protected and redirects unauthenticated checks to Vercel login. No protection bypass was used. The follow-up workflow change avoids running the anonymous automatic smoke against `Preview`; Production smoke and explicit manual dispatch remain available.

Publication state: PR #3 is open with latest pushed head `2072a31`. Vercel Preview Comments passed; the GitHub `check` and `e2e` jobs and the Vercel check were pending at the last status query. Nothing has been merged to `main` or deployed to Production. See `QA_SUMMARY.json` for machine-readable results.

---

## تصحيح لاحق من نفس اليوم (2026-10-02، بعد الدمج)

ما فوق صحيح كما قيس قبل الدمج، وجُدد أسفله فقط لتفادي قراءة حالته كحالة حالية:

- PR #3 **أُدمج** في `main` عند 2026-10-02T21:23:59Z برأس `eb9c0616`؛ عبارة «Nothing has been merged to `main` or deployed to Production» و«PR #3 is open» تصفان لحظة الفحص لا الآن.
- `npm run build` و`npm test` كانا 322 صفحة و1,198/173؛ القياس الحالي بعد إصلاحات ADR-103/ADR-104 هو **1,208/1,208 في 174/174**، وبصمة البناء `329d37aa1324` (`full 5,759,874`).
- `checks: pending` استُنفدت: `smoke` على `Production` انتهى **فشلًا** (run `37066936703`) عند تحقق المسارات والترويسات، والسبب والتحليل والإصلاح في `docs/run-logs/2026-10-02-post-merge-smoke/README.md` وADR-104. لم نصف ذلك الفشل «ناجحًا باستثناء».
- أرقام المتصفح 58/58 desktop و58/58 mobile تخص هذا الجيل من الشجرة (قبل بوابة مراحل الدرس)؛ **لم تُعَد** في بيئة لا تملك Chromium.
