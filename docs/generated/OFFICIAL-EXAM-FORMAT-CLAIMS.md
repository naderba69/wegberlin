# Official exam-format claim guard

Policy: `exam-format-claim-guard-v1` · Result: **PASS**

| Measurement | Value |
| --- | --- |
| Exam-facing surfaces audited | 8 |
| Surfaces carrying an explicit boundary sentence | 4 |
| Forbidden claim matches | 0 |
| Missing surfaces | 0 |
| Source fingerprint | `d729860a7334` |

No surface claims an official grade, a guaranteed pass, a certificate, a certified level, or a readiness decision.

**Boundary:** الحارس يمنع الادعاءات الإيجابية على أسطح الامتحان، ويقيس عدد الأسطح التي تحمل عبارة حدّ صريحة ويسجّلها في الأثر: حذفُ عبارة حدّ من سطح موجود يغيّر العدد فيفشل التدقيق. لا يُثبِت أي رقم هنا شيئًا عن صيغة امتحان رسمي ولا عن بقائها بلا تغيير.

## Surfaces

- `src/core/exams/readiness.ts` — boundary: وليست نتيجة
- `src/core/exams/continuous-session.ts` — no boundary sentence
- `src/core/coach/exam-target-forecast.ts` — no boundary sentence
- `src/components/exam-hub.tsx` — boundary: لا نتيجة رسمية, لا تاريخ نجاح قطعي
- `src/components/full-exam-simulation.tsx` — boundary: ولا تُنشئ شهادة
- `src/components/targeted-exam-simulation.tsx` — boundary: دون تحويلها إلى نتيجة رسمية
- `src/components/exam-print-tools.tsx` — no boundary sentence
- `src/components/continuous-exam-session.tsx` — no boundary sentence

## Policy fields

- `claimsAboutOfficialFormat: false` — this audit reads repository text, not any exam authority.
- `claimsFormatUnchanged: false` — a green result here never means an exam format is unchanged.
