# سجلّ دفعة P2-96 — وحدات مكمّلة عند فجوات الأهداف (لا حشو درس قائم)

- **التاريخ:** 2026-09-28 · **الإصدار:** v179 + P2-22 + P2-225 + P2-93 · **القرار:** ADR-093
- **السياسة:** `gap-driven-supplementary-unit-v1` · **الجرد:** `unofficial-paraphrase` (غير رسمي).

## ما بُني

| الملف | الدور |
|---|---|
| `src/core/content-validation/cefr-goal-inventory.ts` | جرد 32 هدفًا (8 × 4 مستويات) بصياغتنا + كلمات مطابقة |
| `scripts/materialize-cefr-goal-links.ts` | مولّد الصلات: يمسح 96 درسًا ويكتب الدليل |
| `src/data/cefr-goal-links.ts` | AUTO-GENERATED — 35 صلة، كلٌّ بدليلها (درس + فهرس + كلمة + حقل) |
| `src/core/content-validation/supplementary-units.ts` | الدورة: تغطية → فجوات → خطة وحدات + حارس رفض الحشو |
| `src/components/supplementary-unit-panel.tsx` | لوحة قراءة-فقط على `/progress` |
| `tests/unit/supplementary-units.test.ts` | 9/9 |
| `tests/e2e/critical-flows.spec.ts` | اختبار E2E واحد (الملحمة 49) |

## القياس (إخراج `measure.ts` حرفيًّا)

```text
inventory goals: 32 (unofficial-paraphrase)
published lessons scanned: 96
goal→lesson evidence rows: 35
covered: 15 · gaps: 17 (level-scoped)
per level: A1 4/8 (gaps 4) · A2 3/8 (gaps 5) · B1 4/8 (gaps 4) · B2 4/8 (gaps 4)
planned units: 8 · goals planned for closure: 17
coverage after plan: covered 15 → gaps 17 (must not move)
schemas of links per goal: 15 of 32
first unit: supp-a1-u1-v1 · وحدة مكمّلة A1: قراءة + كتابة + وساطة · budget reading 4
stuffing guard on an existing lesson: refused as expected
```

## ما تقوله هذه الأرقام — وما لا تقوله

- **تقول:** من 32 هدفًا داخليًّا، **15** لها دليل في المستوى نفسه، و**17 فجوة معلنة**؛
  و**8 وحدات** مخطَّطة تسدّها، بسقف 3 أهداف للوحدة وبنود محدَّدة (قراءة 4 · استماع 4 ·
  تمارين 6 · اختبار 5 · كتابة 1 · كلام 1) على 14 مرحلة.
- **لا تقول:** إن الأهداف معلَّمة فعلًا، ولا إن الجرد مطابقة رسمية: الجرد صياغتنا نحن،
  والصلات كلماتٌ معلنة موثَّقة، والتخطيط **لا يحرّك رقم التغطية** (15 تبقى 15 حتى تُكتب
  وحدةٌ حقيقية وتُقاس بأدلّتها).

## الحرّاس المُختبرة

1. `assertSupplementaryUnitId` يرفض أي معرّف لا يبدأ بـ`supp-` وأي معرّف يساوي درسًا منشورًا.
2. القياس مقيَّد بالمستوى: دليل من درسٍ بمستوى الهدف نفسه فقط.
3. `coverageAfterPlan`: المغطّى والفجوات لا يتحرّكان بالتخطيط.
4. `applyAuthoredGoalClosure`: التحوّل إلى `covered` يتطلّب أدلّة مُدخَلة فعلًا.
5. الدورة قراءة-فقط: لا شبكة، لا تخزين، ولا حقل حالة جديد (لا أثر على إعادة التهيئة).
