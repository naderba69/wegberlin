# سجل تشغيل — معيار الدرس الواحد وإعادة تسمية «الاستقلال» (2026-10-03)

الحزمة `dwnb-full-pack-v180` · المنهج `dwnb-a1-b2-2026.10-v2` · الفرع `arena/01a0febf-wegberlin` · PR #4 (مفتوح، غير مدموج).
المرجع: [ADR-106](../../adr/ADR-106-lesson-teaching-contract-and-recall-naming.md) و`docs/LEARNING_REPAIRS_AR.md` م37.
القرار المتخذ من المالك: إعادة التسمية الآن + معيار `retention` حقيقي لاحقًا؛ التعميم على الـ96؛ إصلاح أسطر التصحيح مع حدّ في الحارس؛ وسند مهمة النقل يُعرض **بعد** المحاولة لا قبلها.

## القياس قبل التعديل (96 درسًا × 8 أسئلة، من البيانات)

| المقيس | النتيجة | المصدر |
|---|---|---|
| أهداف كل درس | 96/96 (6 دروس فيها هدف بعربي قصير: 12‑13 حرفًا — ليس عطلًا) | `objectives`/`descriptionAr` |
| رابط متطلب مؤلَّف | 23 درسًا فقط؛ **73 بلا رابط** | `grammar-progression-registry` (24 نقطة قاعدة، 6 لكل مستوى) |
| حقل متطلب في النوع | غير موجود أصلًا | `src/types/lesson-content.ts:35-69` |
| شرح + نموذج | 96/96 (شرح 158‑484 حرفًا، 6 أمثلة لكل كتلة، حوار ≥4 أسطر، نموذج كتابة 182‑1949) | `theory`/`entry`/`writing.modelDe` |
| تدريب مصحَّح | 96/96 (7‑8 تمارين × 5 أنواع)؛ **1,733 بندًا: 0 بلا تبرير** | `exercises`+`reading`+`listening`+`miniTest` |
| مهمة نقل داخل الدرس | 96/96 | `writing`/`speaking`/`mediation` |
| مهمة نقل **مؤجلة** | 32 درسًا (8 لكل مستوى)؛ **64 بلا** | `independent-production-tasks` |
| سند مهمة النقل | `usefulPhrases: []` و`modelDe` ثابت «لا يوجد نموذج في وضع النقل المستقل.» | نفس الملف |
| أسطر «خطأ شائع» | **54 شرحًا دون 20 حرفًا** و**53 تريك دون 15** في 43 درسًا | `mistakes[].whyAr/trickAr` |
| بطاقات المراجعة | 24 لكل درس، 0 خارج `reviewCards` | `buildLessonSrsCards` = مصدر `reviewCards` |
| قاعدة الاستقلال عند الدرس | أول محاولة بلا سند **فقط**؛ لا تأجيل | `src/core/evidence/independence.ts:25-36` |
| قاعدة ≥3 أيام | مطبَّقة عند التقييم المستوي وSRS، لا عند الدرس | `level-evidence.ts:76`، `evidenceKind: "delayed"` |

## التنفيذ

- `src/core/lesson/teaching-contract.ts` — العقد: 8 إجابات مقاسة لكل درس، 7 أسئلة صعبة، «المتطلب السابق» فجوة مرقومة، ونصّ حدّ واحد.
- `scripts/generate-lesson-contract-audit.ts` — `npm run lesson:contract` (كتابة) و`npm run lesson:contract:audit` (`--strict --check`)؛ العتبات أسقف: `hardFailures 0`، `lessonsWithoutAuthoredPrerequisiteLink 73`، `lessonsWithoutDeferredTransferTask 64`، `mistakeWhyStubs 54`، `mistakeTrickStubs 53`، `itemsWithoutExplanation 0`. المخرجان: `reports/lesson-teaching-contract-audit.json` و`docs/generated/LESSON_TEACHING_CONTRACT.md`.
- `src/core/lessons/evidence-gate.ts` + `learning-state.ts` — `firstUnaidedRecallPassed` والتسميات الجديدة؛ لا تغيير في `passed`/`basicTrainingPassed`/الإتقان.
- `tests/unit/lesson-teaching-contract.test.ts` — 8 اختبارات (العيّنتان a1-01/b2-14، العمود الفقري لكل الـ96، عقد التسمية، الأرقام المقيسة، ثبات التقرير).
- `package.json` (`prebuild`) و`scripts/verify-continuation-handoff.mjs` — الحارس مُنفَّذ في CI.

## القياس بعد التعديل

| الأمر | النتيجة |
|---|---|
| `npm run lesson:contract:audit` | يمرّ: 0 إخفاق صعب، 0 مسائل خارج الطابور، الفجوات معلنة بالأرقام أعلاه |
| `npx tsc --noEmit` | نجح |
| `npm run lint` | 0 أخطاء / 6 تحذيرات قائمة (لم تُضف تحذيرات) |
| `npm test` | **1,229/1,229** في **176/176** ملفًا |
| `npm run build` | 322/322 صفحة؛ `offline:size` بصمة `d399ed70a36e` وfull 5,761,912؛ `js:budget` 123 chunks / 1,881,970 gzip / max 266,168؛ `media:budget` 544 ملفًا / 52,943,843 bytes / منهج 1,033,335 gzip |
| `npm run handoff:check` · `npm run workflows:check` | نجحا |
| CI على head `6fb5667` (run `37108553360`) | `check` و`e2e` نجحا في 11m06s لكلٍّ منهما (خلاصة التشغيل success، مشروعا desktop وmobile)، Vercel نجح، و`Deployment Smoke` = skipping على تشغيل الـPR بحكم الحارس. حارس العقد الجديد مُنفَّذ داخل `check` (prebuild + handoff) لا محليًا فقط |

## ملاحظة تشغيلية: حالة الصندوق

ثالث تراجع للتجهيز في هذه الجلسة: `HEAD` رجع إلى `eb9c061` و`node_modules` حُذفت بينما الملفات على القرص هي المدفوعة. الاستعادة تمت بلا لمس محتوى: مقارنة بايت‑ببايت (`git show <pushed>:<path> | cmp -`) لكل مسار مختلف، ثم تحريك مؤشر الفرع بـ`reset --mixed` وحده. لا `clean` ولا `checkout` ولا حذف عمل. `npm ci` أُعيد (471 حزمة، exit 0).

## ما يبقى

- دفعات التأليف لسدّ الفجوات (64 مهمة نقل، 73 رابط متطلب، 107 أسطر تصحيح) — كل دفعة تخفض سقفًا في `limits` ويُقاس في CI.
- معيار `retention` داخل بوابة الدرس (القرار المؤجل المتفق عليه).
- سند ما بعد المحاولة لمهمة النقل (عرض العبارات والنموذج بعد التسليم).
- المتصفح: يُقاس في CI فقط. الإنتاج: `DEPLOYMENT_SMOKE_PRODUCTION_URL` وإعادة تشغيل `Deployment Smoke` على عهدة المالك.

## المرحلة B في نفس الجلسة: سدّ فجوة التصحيح بالتأليف

| المقياس | قبل | بعد |
|---|---|---|
| `mistakes[].whyAr` دون 20 حرفًا (من 392) | 54 | 0 |
| `mistakes[].trickAr` دون 15 حرفًا | 53 | 0 |
| أسطر مؤلَّفة في هذه الدفعة | — | 107 على 95 درسًا |
| أرضية المُتحقِّق لعيادة الخطأ | لا شيء | `whyAr` ≥ 20، `trickAr` ≥ 15، بلا تكرار بين الحقلين، بلا رمز موضع مؤقت |
| سقفا `limits` في تقرير العقد | 54 و53 | 0 و0 |
| أدنى طول فعلي بعد التأليف | 10 و8 | 20 و15 |
| `npm test` | 1,229 في 176 ملفًا | 1,231 في 176 ملفًا |
| بصمة البناء وfull | `d399ed70a36e` / 5,761,912 | `76ef96838d9f` / 5,775,240 |
| JS gzip / أكبر chunk | 1,881,970 / 266,168 | 1,886,244 / 266,750 |
| gzip المنهج | 1,033,335 | 1,037,823 |
| `lesson-quality` | وسيط التبرير 232 | 232 نفسه؛ تغيّرت بصمة المحتوى فقط |

طريقة العمل: استُخرجت السطور القاصرة من البيانات نفسها (95 صنفًا، 107 حقولًا)، ثم كُتب لكل صنف شرح يذكر القاعدة والصيحتين الخاطئة والصحيحة وحيلة قابلة للاستعمال عند الإنتاج، وحُفظ payload في هذا المجلد، وطُبِّق بـ`scripts/repair-mistake-feedback.ts` الذي لا يكتب إلا حيث يطابق النص الحالي ما عرفه (dry-run أولاً: `Mistake feedback planned: 107 replaced, 0 already authored, 95 payload keys, 96 lessons`).

حدّ ما تُثبته الأرقام: الطول حدّ أدنى آلي يمنع سطرًا بلا معلومة، وليس تقييمًا دلاليًا ولا مراجعة بشرية؛ ولا يتغيّر أي حساب للإكمال أو الإتقان. الفجوتان البقيتان (64 بلا مهمة نقل مؤجلة، 73 بلا رابط متطلب مؤلَّف) والمرحلة D (معيار `retention`) ما زالت مقفَلة بأسقفها المعلنة.
