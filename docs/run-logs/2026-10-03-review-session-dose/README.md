# سجل تشغيل — حصة العلاج في جلسة المراجعة وساعة الاستحقاق (2026-10-03)

الحزمة: `dwnb-full-pack-v180` · نسخة المنهج `dwnb-a1-b2-2026.10-v2` · الفرع `arena/01a0febf-wegberlin` · PR #4 (مفتوح، غير مدمج).
المرجع: [ADR-105](../../adr/ADR-105-review-session-dose-and-review-hour.md) و`docs/LEARNING_REPAIRS_AR.md` م36.

## ما قيس قبل التعديل

| المصدر | ما يفيده |
|---|---|
| `src/core/review/daily-quota.ts:8` | عدّاد اليوم يستثني `evidenceScope === "personal-error-remediation"` صراحةً |
| `src/core/srs/review-queue.ts:19` (`eligibleReviewCards`) | بطاقات الأخطاء المؤكَّدة تُلحق بالطابور بلا سقف |
| `src/core/coach/coach.ts:64` و`src/core/evidence/report.ts:221` | الحارس الوحيد `dueReviews >= 20`، يوقف الاقتراح ولا يحدّ الجلسة |
| `src/app/review/page.tsx` قبل التعديل | `applyReviewGrade(..., {timeZone})` بلا `reviewHourLocal` ← التثبيت على 00:00 المحلي |
| `src/core/srs/sm2.ts` (`scheduledReviewDate`) | إذا كان التثبيت ماضيًا يُدفع يومًا كاملًا، فتزحزح بلا سبب يراه المتعلم |

## التنفيذ

- `src/core/review/session-dose.ts` — سياسة `review-session-dose-v1` و`isRemediationCard` و`reviewHourFromLocalClock`.
- `src/app/review/page.tsx` — حصة العلاج من `dose.visible`، عدّاد `remediationDone`، زر «جلسة أطول اليوم»، سطر الحصة في الترويسة، وحالة نهائية بدل الطابور غير المحدود؛ تمرير `reviewHourLocal` إلى SM-2.
- `src/app/globals.css` — أنماط `.review-dose` و`.review-dose-state`.
- `tests/unit/review-session-dose.test.ts` — 11 اختبارًا (سقف، ترتيب، لا حذف مجدول، رفع بطلب، منع إعادة تعبئة، عدم مساس الحصة، تثبيت الساعة 18 بدل UTC 00، محلّل الساعة).

## القياس بعد التعديل

| الأمر | النتيجة |
|---|---|
| `npx tsc --noEmit` | نجح |
| `npm run lint` | 0 أخطاء / 6 تحذيرات قائمة (نفس تحذيرات الاختبارات القديمة) |
| `npm test` | **1,221/1,221** في **175/175** ملفًا |
| `npm run language:audit:write` | 194 ملف TSX / 7430 وسمًا افتتاحيًا / 422 وسم ألماني / 51 نطاقًا تقنيًا / 202 مختلط / 0 مشاكل — ثبّت `openingTagCount: 7430` في `tests/unit/language-boundary.test.ts` |
| `npm run workflows:check` | يمرّ |
| CI على head `65b6f03` (run `37105579225`، PR #4) | `check` نجح في 2m48s و`e2e` نجح في 16m28s (خلاصة التشغيل success، مشروعا desktop وmobile)، و`Vercel` نجح، و`Deployment Smoke` = skipping على تشغيل الـPR لأن الحارس يثبّته على Production وحده — لا يُوصف هذا اجتيازًا لفحص الإنتاج |
| `npm run build` | 322/322 صفحة؛ `offline:size` بصمة `0d2add3b1207` وfull 5,761,228؛ `js:budget` 123 chunks / 1,881,894 gzip / max 266,168؛ `media:budget` 544 ملفًا / 52,943,843 bytes / منهج 1,033,335 gzip |

## ما يبقى خارج هذه البيئة

- المتصفح: `e2e` يُقاس في Actions فقط، وقيس هناك لهذا Head (الجدول أعلاه). لا Chromium ولا egress في هذا الصندوق، فلا يُنسب أي نجاح متصفح له.
- الإنتاج: إعادة تشغيل `Deployment Smoke` وتثبيت `DEPLOYMENT_SMOKE_PRODUCTION_URL` على عهدة المالك (توكن الجلسة يُرجع 403 على `gh variable set`/`gh workflow run`). الدمج أيضًا قرار المالك وحده.
- لا ادعاء مراجعة بشرية لغوية أو حقوقية، ولا «أفضل للمتعلمين» بلا دراسة، ولا درجة صوتية تفوق ما تثبته المحركات.
