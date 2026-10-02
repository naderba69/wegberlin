# 2026-10-02 — post-merge smoke failure and teaching-contract repairs

النطاق: جلسة ما بعد دمج PR #3 على `arena/01a0febf-wegberlin` (من `eb9c0616`). هذا سجل تشغيل محلي + قراءة سجلات GitHub، لا نشر ولا اعتماد لغوي.

## ما قيس فعليًا

| الفحص | النتيجة |
|---|---|
| `gh pr view 3` | `MERGED` عند 2026-10-02T21:23:59Z، head `eb9c0616` |
| `gh api .../commits/eb9c061/check-runs` | `Deployment Smoke: completed / failure` |
| `gh run list --workflow "Deployment Smoke"` | run `37066936703` على `Production`؛ فشل عند «Verify deployed critical routes and headers»؛ تشغيلات Preview مُتخطّاة |
| `gh api .../deployments/6818675193/statuses` | `environment_url` = `https://wegberlin-8u19akx07-balinader-2671s-projects.vercel.app` (مضيف نشر محمي، لا الاسم المستعار) |
| annotations الـcheck-run | 7 مسارات × `app identity missing` + `CSP missing` + `nosniff missing`، أي قراءة صفحة دخول Vercel |
| `npx vitest run --reporter=dot` | 1,208/1,208 في 174/174 ملفًا (+10 عن جيل ما قبل الدمج) |
| `npm run lint` | 0 أخطاء / 6 تحذيرات قائمة مسبقًا |
| `npx tsc --noEmit` | نجح |
| `npm run build` | 322/322 صفحة؛ `offline:size` بصمة ef613e05d712 وfull 5,760,592؛ `js:budget` 123 chunks / 1,880,826 gzip / max 266,168؛ `media:budget` 544 ملفًا / 52,943,843 bytes / منهج 1,033,335 gzip |
| `npm run handoff:check` | نجح بعد مزامنة العدادات في `PROJECT_STATUS.md` و`README.md` و`PROFESSIONAL_CONTINUATION_PROMPT_AR.md` والمثبت في `scripts/verify-continuation-handoff.mjs` |
| `npm run language:audit:write` | أُعيد توليد `reports/language-boundary-audit.json` و`docs/generated/LANGUAGE_BOUNDARY_REPORT.md` (194 TSX / 7,419 وسمًا / 422 ألمانيًا / 0 مشاكل) لأن تغيّر `lesson-runner.tsx` خلّف التقارير مولّدة قديمة وأعطاب `language:audit --check` في البناء |

## ما لم يُقَس (حدود صريحة)

- **لم يُعَد تشغيل Smoke ضد الإنتاج من هذه البيئة**: لا وصول شبكي إلى `*.vercel.app` من الـSandbox (`curl` = SSL_ERROR_SYSCALL، `fetch` = fetch failed). لذلك لا يدّعي هذا السجل أن الفحص الجديد اجتاز؛ يعيد المالك تشغيله بعد تثبيت المتغير.
- **لم تُعَد مجموعة Playwright**: لا binary لـChromium ولا `~/.cache/ms-playwright` ولا CDN. أرقام 58/58 desktop و58/58 mobile في `docs/run-logs/2026-10-02-production-release/` تخص جيل ما قبل الدمج ولا تُنسب إلى التغييرات في هذه الجلسة. مسارات المتصفح في `tests/e2e/critical-flows.spec.ts` تمشي المراحل 0→4 (شارحة، غير مقيدة ببوابة العمل)، و`learning-integrity.spec.ts` يزرع الحالة مباشرة، فلا تعارض متوقع — لكن هذا استنتاج من قراءة الاختبارات لا تشغيلها.
- `gh run view 37066936703 --log` أعاد `EOF` من results-receiver مرتين؛ الاعتماد على `--json jobs` والـannotations.
- لا مراجعة بشرية لغوية/حقوقية، ولا اختبار أثر على متعلمين حقيقيين، ولا ادعاء «بديل أفضل»؛ ولا تقييم صوتي يفوق ما تثبته المحركات.

- بصمة `offline:size` تُحسب من مخرجات البناء نفسها (مسارات الأصول تحمل معرّف البناء)، فتتغيّر بين تشغيلين على مصدر متطابق: أعطى البناء الأول 329d37aa1324 / full 5,759,874 والثاني ef613e05d712 / full 5,760,592 مع ثبات JS (1,880,826 gzip) والصوت (52,943,843 bytes) والمنهج (1,033,335 gzip). تُحدَّث الوثائق الحاكمة على آخر قياس، ولا تُقرأ البصمة كدليل تغيير محتوى.

## الإصلاحات التي نُفّذت في هذه الجلسة

1. **تصنيف نتيجة فحص النشر** (`scripts/smoke-deployment.mjs` + نسختا `deployment-smoke.yml`، سياسة `post-deployment-smoke-v2`): وحدة قابلة للاستيراد، تتبّع يدوي للتوجيهات داخل نفس الأصل (≤3)، و`passed`/`failure`/`blocked-by-auth`/`retry`، وتفضيل `vars.DEPLOYMENT_SMOKE_PRODUCTION_URL` على `environment_url`، وشرح الإعاقة في `GITHUB_STEP_SUMMARY`. التفاصيل في ADR-104.
2. **أدلة قراءة مؤسَّسة** (`src/core/lesson/support.ts` + `exercise-card.tsx` + `globals.css`، سياسة `reading-evidence-grounded-v1`): لا استشهاد بجملة لا تحمل الجواب؛ الأسئلة غير المؤسَّسة تُعلن «استنتاجية». التفاصيل في ADR-103.
3. **بوابة عمل المراحل** (`src/core/lesson/stage-gating.ts` + `lesson-runner.tsx`، سياسة `lesson-stage-work-gate-v1`): لا دخول إلى الاختبار القصير قبل محاولة مسجّلة في التدريب الموجّه والقراءة والاستماع، ولا إغلاق مرحلة تطلب عملًا بنقرة ذاتية. بوابة تنقّل فقط.
4. **مهمة الإنتاج المؤجل بمصدرها** (`src/core/evidence/delayed-transfer-task.ts`): عنوان الدرس المصدر ومستوى المصدر بدل المعرّف الخام و`currentLevel`.
5. **تهيئة بلا إتقان وهمي** (`src/core/portability/db.ts`): `mastery: {}`.
6. **اختبارات**: `tests/unit/lesson-support.test.ts` (7، منها بوابة على كل أسئلة القراءة المنشورة: لا تُستشهد جملة بينما تُتاح جملة أطابق للجواب)، `tests/unit/lesson-stage-gate.test.ts` (4، على 96 درسًا)، `tests/unit/deployment-smoke.test.ts` (4: تصنيف + تجميع + أصل صريح).

## المطلوب من المالك (بالترتيب)

1. `gh variable set DEPLOYMENT_SMOKE_PRODUCTION_URL --body "https://wegberlin.vercel.app"` (أو ضبطه من Settings → Secrets and variables → Actions).
2. إعادة تشغيل `Deployment Smoke` على `Production` وقراءة النتيجة: `passed` يعني المسارات السبعة والترويسات من التطبيق نفسه؛ `blocked-by-auth` يعني أن المتغير ما زال غير مثبت أو أن الحماية تعمل؛ `failure` يعني عطلًا حقيقيًا في النشر.
3. إن أردت يقينًا بصريًا: تشغيل `npm run test:e2e` على جهاز فيه Chromium بعد هذه التغييرات (بوابة المراحل لم تُختبر في متصفح بعد).

## الحالة المتبقية المفتوحة عمديًا

- `mastery` يخلط أعلام الواجهة بأدلة الإتقان في التصدير والاستيراد (قراءة `full-exam-*` و`level-*-ready` كـ`other-learning-evidence`).
- `passed` (7 معايير) مقابل سقف 65 في `lessonMasteryFromAttempts`: لا معنى موثّق للفارق.
- `eligibleReviewCards` يضيف كل بطاقات الأخطاء المؤكدة بلا سقف، و`getCoachTarget` لا يحوّل المسار إلا عند `dueReviews>=20`.
- سياسة تقويم المراجعة الافتراضية `timeZone:"UTC"` و`reviewHourLocal:0` لم تُثبت على منطقة المتعلم في اختبار end-to-end.
- ازدحام `/today` وتسريب إعدادات الطبقة التقنية إلى واجهة المتعلم: مؤجلان إلى حزمة تجربة الدخول (لم تُعتمد بعد).
