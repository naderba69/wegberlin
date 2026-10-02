# حزمة المراجعة البشرية المستقلة — Der Weg nach Berlin

تاريخ التوليد: 2026-09-20 · مولّدها: `scripts/generate-human-review-packet.ts` (`npm run review:packet`)

- عدد السجلات المحكومة: **3,277** موزّعة على `17` أوراق CSV بـ200 سطرًا (آخر ورقة أقصر).
- حالة كل سجل اليوم: `automated-validated-independent-review-pending` — أي أن البوابات الآلية تحققت من البنية، ولم يوقّع إنسان على الوصف/المستوى/الحقوق.
- أعمدة القرار (`decision`, `reviewerName`, `reviewDate`, `note`) **فارغة عمدًا**: لا يملؤها سكربت ولا نموذج، والمقبول الوحيد هو توقيع إنسان مسمّى.
- الورقة `b2-lesson-checklist.md` تبدأ من حيث ينتهي القياس الآلي: 24 درس B2 مع أرقام النموذج/الهدف/الاستماع لكل درس.

## التوزيع حسب النطاق

| النطاق | العدد |
|---|---:|
| `lesson-controlled` | 677 |
| `lesson-listening` | 288 |
| `lesson-mini-test` | 480 |
| `lesson-mediation` | 96 |
| `lesson-reading` | 288 |
| `lesson-speaking` | 96 |
| `lesson-writing` | 96 |
| `practice-branching` | 8 |
| `practice-collocation` | 64 |
| `diagnostic` | 32 |
| `practice-dictation` | 16 |
| `exam` | 720 |
| `exam-speaking` | 72 |
| `exam-writing` | 24 |
| `library-listening` | 160 |
| `library-reading` | 160 |

## ما لا تفعله هذه الحزمة

- لا تُغيّر أي حالة مراجعة في الشيفرة، ولا تُنتج ادّعاء «مُعتمد/رسمي». بعد توقيع المراجع تُحدَّث السجلات والوثائق في دفعة كود مستقلة.
- لا تُغني عن: صوت بشري للامتحان (0 من 96)، دليل الفونيم (0 من 9 خطوات)، مراجعة سياقية حقوقية (P1-377)، تجربة قارئ الشاشة (P1-331 · P2-264)، تثبيت توزيع نقاط telc.

## مؤشرات مساعدة

- صفوف وُسمت بانحراف جودة مقيس: **268** (من 3277) — لا تعني رفضًا، بل أولوية مراجعة أعلى.
- صفوف لم يُحلّ نصّها آليًا (معرّفها لا يظهر كنصّ حرفي في src/data لأنها تُولَّد برمجية): **1104** — التوزيع حسب النطاق: `lesson-mediation` 96 · `lesson-speaking` 96 · `lesson-writing` 96 · `practice-branching` 8 · `practice-collocation` 64 · `diagnostic` 32 · `practice-dictation` 16 · `exam` 600 · `exam-speaking` 72 · `exam-writing` 24؛ يقرؤها المراجع من صفحة الدرس/الامتحان أو من عمود sourceFile.
- عائلات المعجم في سجل الاستراتيجية: 32 (مرشّحات الاسم/الإطار المعلّقة تُراجَع في ملف مستقل).

