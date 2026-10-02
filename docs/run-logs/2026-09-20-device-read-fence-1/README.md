# سجل الدفعة — حصر قيم الجهاز في الرسم الأول (v142) — 2026-09-20

## ما الذي تغيّر

أُغلق البند 406 من `IDEA_BACKLOG.md`: المواقع التي كانت تقرأ ساعة الجهاز أو منطقة الوقت في أول رسم
صارت كلها تقرأ بعد الترطيب عبر `src/components/device-value.ts`.

| الملف | ما كان | ما صار |
|---|---|---|
| `src/components/review-reminder-coordinator.tsx` | `useState(() => Date.now())` + `setNow` في المؤقّت | `useDeviceValue(() => Date.now(), 0)` وعدّاد `tick`، و`now` عبر `useMemo` |
| `src/app/review/page.tsx` | `new Date()` و`Intl.DateTimeFormat()` في `useMemo` فارغ التبعيات | `deviceNow` + `reviewTimeZone` عبر `useDeviceValue`، والمنطقة الساقطة `UTC` |
| `src/components/study-export-control.tsx` | `new Date()` و`useMemo(()=>Intl.DateTimeFormat()…)` | `deviceNow` و`timeZone` عبر `useDeviceValue`، وسطر الإعلان فُصّل سطرًا سطرًا |

النمط المستعمل في الملفات الثلاثة:

```ts
const EPOCH = new Date(0);
const epochOr = (ms: number) => (ms ? new Date(ms) : EPOCH);
const deviceNow = useDeviceValue(() => Date.now(), 0);
const now = useMemo(() => epochOr(deviceNow), [deviceNow]);
```

`epochOr` على مستوى الوحدة تعمَّدناها لسببين: وضع `new Date(...)` داخل سطر `useMemo` يُفعِّل حارس الترطيب
(وهو صحيح في ذلك)، وتركُها بدون تغليف يُبطل ذاكرة كل `useMemo` يعتمد على `now` ويولّد تحذير
`react-hooks/exhaustive-deps`. بالحالتين صفر تحذيرات في الملفات الثلاثة.

## ما كشفه الحارس ولم يكن مسجلًا

`src/components/study-export-control.tsx` كان فيه سطر ثالث ملغًى في آخر سطر الإعلان نفسه:

`const timeZone=useMemo(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",[]);`

لم يكن مذكورًا في البند 406، وما ظهر إلا بعد إخراج الملف من قائمة `deferred`. هذا هو المبرر الكامل
لإبقاء القائمة فارغة في الحارس بدل حذفه.

## ما لم يُعمل عمداً

- المحاولة الأولى على `study-export-control.tsx` كتبت `useDeviceValue(…) ? new Date(useDeviceValue(…)) : EPOCH`،
  وهي مناداة خطاف داخل تعبير شرطي. رُفضت وأُعيدت بصيغتين مستقلتين؛ لم تُختبر حولها ولا سكِت عنها.
- لم تُضَف استثناءات إلى `tests/unit/no-storage-in-render-init.test.ts` ولم تُلَيَّن أنماطه؛ أفرغت `deferred` فقط.
- حزمة المتصفح (`tests/e2e/critical-flows.spec.ts`) لم تُشغَّل: مكتبات نظام ستّة ناقصة لـ chromium على هذا
  الصندوق و`apt-get` تعذّر من قبل. فبند الترطيب المضاف عند v141 يبقى غير مقاس، وآخر قياس متصفح كامل معروف
  هو 82/82 عند v138. لا يُنسب إلى v142 رقم متصفح لم يُقس.

## البوابات (من هذه الشجرة نفسها، بعد كل تعديلات الوثائق)

- `tsc.log` — `./node_modules/.bin/tsc --noEmit` → exit 0
- `lint.log` — `npm run lint` → exit 0، صفر مشاكل
- `vitest-unit.log` — `./node_modules/.bin/vitest run` → **155/155 ملفًا، 1,011/1,011 اختبارًا**، 154.5 s
- `guard.log` — الحارس + `language-boundary` + `offline-pack-controls` → 18/18، exit 0
- `build.log` — `NODE_OPTIONS=--max-old-space-size=1200 npm run build` → exit 0، **321 صفحة**
  - `offline:size` البصمة **51316cb18282** · a1 2,392,468 · a2 2,468,817 · b1 2,532,642 · b2 3,885,365 · **full 5,631,189**
  - `js:budget` 110 مقاطع / 1,720,720 gzip / أكبر ملف 249,350
  - `media:budget` 544 ملفًا / 52,943,843 بايتًا / المنهاج 939,473 gzip
- `handoff.log` — `npm run handoff:check` → exit 0

## عيوب البيئة المسجَّلة كي لا تُقرأ كفشل شيفرة

- `/tmp` على هذا الصندوق فارغ تمامًا (0 MB). كل أمر يلمس `TMPDIR` يفشل بدونه، وقد أوقع ثلاث قياسات
  كاذبة من قبل. القاعدة: `export TMPDIR=/home/user/tmp` قبل `tsc`/`vitest`/`playwright`.
- `next build` يُقتل بإشارة 137 (OOM) بلا مقايضة؛ استُعمل `/home/user/.swapfile` بحجم 1500 MB
  مع `NODE_OPTIONS=--max-old-space-size=1200`. ملف المقايضة خارج الأرشيف ولا يُسلَّم.
- `npx tsc` يُثبّت حزمة وهمية (`tsc@2.0.4`)؛ المستعمل `./node_modules/.bin/tsc`.
- رفع جيل الكاش: `public/sw.js` إلى `dwnb-full-pack-v142` (staging/previous v141) مع ستّة ملفات اختبار
  و`scripts/verify-continuation-handoff.mjs`؛ عدّاد `languageAudit.openingTagCount` مثبَّت على 6991 في
  الاختبار والحارس معًا.
