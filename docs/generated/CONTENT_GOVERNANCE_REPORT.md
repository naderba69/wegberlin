# Content accountability, lifecycle, claims, and pronunciation audit

Version: `content-governance-audit-v1`  
Policy: `content-accountability-lifecycle-v1`  
Curriculum: `dwnb-a1-b2-2026.10-v2` (app `0.1.0`)
Content SHA-256: `bbbf064bb7693e895b78283be22c952084c94797453cb6fe385972fdf948cd47`

## Result

PASS

| Contract | Count |
|---|---:|
| Content records with owner + reviewer + lifecycle | 3323 |
| Content families Draft → Validated → Published | 16 |
| Published families | 16 |
| External source records with owner + reviewer | 19 |
| Learner-risk types with owner + reviewer | 12 |
| General consular/legal context claims | 12 |
| Arabic-learner pronunciation inventory | 18 |
| Inventory rows with existing interactive synthetic pair | 15 |
| Inventory rows mapped to articulation diagram | 18 |
| Issues | 0 |

## Lifecycle by family

- `diagnostic`: 32 published records; automated validation passed, independent review pending.
- `exam`: 720 published records; automated validation passed, independent review pending.
- `exam-speaking`: 72 published records; automated validation passed, independent review pending.
- `exam-writing`: 24 published records; automated validation passed, independent review pending.
- `lesson-controlled`: 723 published records; automated validation passed, independent review pending.
- `lesson-listening`: 288 published records; automated validation passed, independent review pending.
- `lesson-mediation`: 96 published records; automated validation passed, independent review pending.
- `lesson-mini-test`: 480 published records; automated validation passed, independent review pending.
- `lesson-reading`: 288 published records; automated validation passed, independent review pending.
- `lesson-speaking`: 96 published records; automated validation passed, independent review pending.
- `lesson-writing`: 96 published records; automated validation passed, independent review pending.
- `library-listening`: 160 published records; automated validation passed, independent review pending.
- `library-reading`: 160 published records; automated validation passed, independent review pending.
- `practice-dictation`: 16 published records; automated validation passed, independent review pending.
- `practice-branching`: 8 published records; automated validation passed, independent review pending.
- `practice-collocation`: 64 published records; automated validation passed, independent review pending.

## Claim boundaries

- Publication means the validated route is available; it does not mean independent German, Arabic, CEFR, or rights approval.
- All 12 consular/legal rows are language practice with `officialClaimStatus=not-claimed`; each row is source-verified by the agent (ADR-118) against 11 official/public sources checked 2026-10-17 (Auswärtiges Amt, EU Your Europe, BAMF, gesetze-im-internet.de, DAAD, Faire Integration and others). This is not a lawyer's or consular specialist's review.
- All 18 pronunciation rows set `notUniversal=true`; current diagrams and 15 synthetic pairs are teaching support, not a learner pronunciation score. Independent phonetics review remains pending.
- Named IDs assign accountable product roles; they do not fabricate that a pending human review occurred.
