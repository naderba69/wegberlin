# سجلّ دفعة P2-93 — خريطة المواءمة الخاصة على فهرس يملكه المتعلّم

- **التاريخ:** 2026-09-28 · **الإصدار:** v179 + P2-22 + P2-225 · **القرار:** ADR-092
- **السياسة:** `learner-owned-alignment-map-v1` — **صفر شبكة وصفر تخزين لنصّ المصدر**.

## ما بُني

| الملف | الدور |
|---|---|
| `src/core/alignment/learner-alignment-map.ts` | النواة: بناء الخريطة + الحرّاس + التنقية + الدمج + العدّ أحاديّ الاتجاه |
| `src/components/learner-alignment-panel.tsx` | اللوحة على `/settings` (بعد مدير العلامات/الملاحظات) |
| `tests/unit/learner-alignment-map.test.ts` | 10 اختبارات وحدة |
| `tests/e2e/critical-flows.spec.ts` | اختبار E2E يُثبت من IndexedDB أن `pastedIndex = ""` بعد إعادة التحميل |
| `docs/adr/ADR-092-learner-owned-alignment-map.md` | القرار والبدائل المرفوضة |

## قياس المسبار (`measure.ts`) — إخراج حرفي

```text
policy: learner-owned-alignment-map-v1
claim boundary: private-learner-map-no-book-reproduction-no-matching-claim
contact lessons (ours): 96
mapped rows written by the learner: 5
levels carrying rows: 1
unmapped (ours, no hint yet): 91
coverage rows: A1 5/24 · A2 0/24 · B1 0/24 · B2 0/24
pasted index chars (cleaned): 87 of cap 6000
pasted index lines offered for selection: 5
stored pastedIndex length after sanitize: 0 (must be 0)
stored summary.pastedIndexStored: false (must be false)
reproduction refused (book text): true
reproduction refused (OCR): true
page/unit hint accepted: true
refusal without acknowledgement: ownership
```

## ما يقيسه هذا وما لا يقيسه

- **يقيس:** عدد الدروس المنشورة عندنا (96)، وعدد الصفوف التي كتبها المتعلّم (5)،
  وأن الفهرس الخام **لا** يبقى بعد الحفظ (0 محرف)، وأن سياق نقل المصدر مرفوض.
- **لا يقيس:** أي مطابقة مع كتاب حقيقي — لا نملك فهرسًا ولا نجرّبه. الغرض أن يجري
  المتعلّم المقابلة بنفسه على ملكه، والتطبيق يحفظ نتيجته بحدودها.

## الحرّاس المُختبرة

1. إقرار الملكية مزدوج (واجهة + طلب) وإلا رفض `ownership`.
2. رفض نقل المصدر/الاستخراج/OCR ولو مع الإقرار — مع قبول أرقام الصفحات.
3. `sanitizeAlignmentMapForStorage` تُفرِّغ `pastedIndex` قبل أي حفظ.
4. درس غير منشور = صفّ مُسقط (`droppedEntryCount`)، لا ابتكار مطابقة.
5. بلا `fetch` ولا `localStorage` ولا كتابة لـ`pastedIndex` في أي مخزن.
