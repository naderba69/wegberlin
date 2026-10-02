# سجلّ دفعة P2-119 — التاريخ اللغوي إثراءً اختياريًّا موثّقًا

- **التاريخ:** 2026-09-28 · **الإصدار:** v179 + P2-22 + P2-225 + P2-93 + P2-96 · **القرار:** ADR-094
- **السياسة:** `optional-language-history-enrichment-v1` · **الحدّ:** `enrichment-only-no-grading-no-mastery-no-network`.

## ما بُني

| الملف | الدور |
|---|---|
| `src/core/vocabulary/language-history-enrichment.ts` | النواة: 14 ملاحظة مؤلَّفة + 5 مراجع معلنة + وسوم قوّة الادّعاء + الاختيار النقي |
| `src/components/language-history-panel.tsx` | اللوحة على `/settings` (تفعيل/تعطيل + عرض بمراجع) |
| `src/types/learning.ts` + `schema` + `db` + `merge` | تفضيل `languageHistoryPreferences` (معطّل افتراضيًّا) |
| `src/core/state/reset-plan.ts` | تصنيف في سلة الإعدادات ⇒ **65 حقلًا = 19/24/12/10** |
| `tests/unit/language-history-enrichment.test.ts` | 10/10 |
| `tests/e2e/critical-flows.spec.ts` | اختبار E2E واحد (الملحمة 50) |

## القياس (إخراج `measure.ts` حرفيًّا)

```text
notes authored: 14
declared sources: 5 → dwds · dw-arabic-roots · dpa-alcohol · unger-arabic-words · kluge
default enabled: false
per level: A1 3 · A2 3 · B1 4 · B2 4
claim strengths: {"documented":13,"refuted-folk-etymology":1}
refuted on record: Alkohol
off → visible: 0 | on (limit 3 ) → visible: 3 | next unseen → lh-luther
every note resolves its source: true
notes per lesson are level-pure: true
```

## ما تقوله هذه الأرقام

- **معطّل افتراضيًّا**: `off → visible: 0` — لا ملاحظة واحدة قبل اختيار المتعلّم.
- **موثّق**: 14/14 ملاحظة تُحلّ إلى مرجع معلن؛ و13 ادّعاءً موثّقًا و**1 مدحوض** محفوظ
  عمدًا (`Alkohol`: رواية «الروح آكلة الجسد» دحضها تدقيق dpa).
- **مقيَّد**: سقف 3 للجلسة، ومن مستوى المتعلّم نفسه، مع «المزيد» للملاحظات غير المرئية.
- **صفر أثر**: اختبار وحدة يمنع أي وصول إلى إتقان/أدلّة/جلسات امتحان، وE2E يفحص أن
  الحالة المخزَّنة تحمل التفضيل وحده و`masteryEvidenceEvents` تبقى فارغة.

## الحرّاس المُختبرة

1. `assertLanguageHistoryIntegrity` يرفض عرض ملاحظات بينما الإثراء معطّل، أو ملاحظة بلا مرجع/نصّ/درس.
2. كل ملاحظة مربوطة بدروس منشورة **بمستواها** (لا إثراء B2 على درس A1).
3. الافتراضيّ false في `defaultState` وفي مخطّط الحالة وفي الدمج عند الاستيراد.
4. إعادة التهيئة **تُبقي** التفضيل (سلة الإعدادات) — مُغطّى في وحدة reset-plan.
5. صفر شبكة وصفر تخزين: لا `fetch` ولا `localStorage`/`getItem(` في النواة.
