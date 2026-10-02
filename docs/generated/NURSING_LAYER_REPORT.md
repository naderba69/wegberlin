# Woven Nursing Layer Report — توابل (A1/A2) · طبق ثانٍ (B1+)

Generated: 2026-09-23  
Policy: `nursing-layer-v1`  
Audit: `nursing-layer-audit-v1`  
Content SHA-256: `1fdb3b00e1baf8c6e8f1238fa72348fee1ed41a285d870fe3409bb61a0dc26e7`

## Result

`PASS` — **14 woven units across 14 lessons**, one deterministic safety task each
(14 accepted language action(s), 22 explicitly failed guess options),
**8 of 8** declared professional words used, and **0 professional reviews**
recorded. Every unit carries `هذه صياغات لغوية لا إرشاد سريري`.

| Level | Units | Authored cluster | Accepted action | Professional words |
|---|---:|---|---|---:|
| A1 | 4 | `recognition` | `recognize` | 0 of 0 |
| A2 | 4 | `confirmation` | `confirm` | 0 of 0 |
| B1 | 3 | `questioning` | `ask` | 4 of 4 |
| B2 | 3 | `documentation` | `document` | 4 of 4 |

## The three strict rules, as measured

1. **No new grammar.** Every unit names the published theory blocks it reuses: 14 units, all references resolved inside their own lesson; a unit whose reference stops resolving fails this audit.
2. **No clinical knowledge needed to answer.** Exactly one accepted action per task and it is always a language act
   (`recognize` / `confirm` / `ask` / `document`); the validator additionally rejects accepted texts that read like a
   dosing or administration instruction. Guessing is offered and failed by the environment, not by a written rule
   (22 guess options across 14 tasks).
3. **Parasitic, not load-bearing.** The layer is imported by exactly 5 files, all on the declared
   allowlist (one panel, one validator, one practice core, one audit, tests); **zero** gate/exam/evidence/review modules
   mention it (0 hits), so deleting the registry leaves the general B2 path complete.

## Rollback breaker

`nursing-layer-rollback-v1` — metric: general exam-shape task accuracy (goethe-b2 + telc-deutsch-b2 simulations); window 14 days;
trigger: a 5-percentage-point drop; action: تُخفَّض الطبقة (إخفاء الوحدات ووقف إضافة كلمات) وتُقدَّم الشهادة العامة، ولا يُبرَّر الانخفاض بأنه «تعمّق مهني».
The layer is removable by deleting one registry file; mastery effect `none`, gate effect `none`, exam effect `none`.

## Boundary

الصياغات لغوية بحتة: لا إرشاد سريري ولا قرار صحي ولا تدريب مهني معتمد، والمراجعة المهنية معلّقة (0 مراجعات) — ولا ترفع الطبقة إتقانًا ولا تؤثر في بوابة مستوى ولا في مهام الامتحان.

**What this audit does not claim.** 14 units are authored and tagged
`pending-nursing-professional`: no nurse, no clinical educator, and no German
teacher has reviewed them (0 professional reviews). The layer is language practice inside a care situation; it is not
professional training, it does not certify anything, and every unit tells the learner so.
