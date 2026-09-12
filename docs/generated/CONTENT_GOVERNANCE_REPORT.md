# Content accountability, lifecycle, claims, and pronunciation audit

Version: `content-governance-audit-v1`  
Policy: `content-accountability-lifecycle-v1`  
Curriculum: `dwnb-a1-b2-2026.09-v1` (app `0.1.0`)  
Content SHA-256: `404179be689ca146de022470cfbeb9ed00246e463f6f6325655146b90daef5dc`

## Result

PASS

| Contract | Count |
|---|---:|
| Content records with owner + reviewer + lifecycle | 3020 |
| Content families Draft → Validated → Published | 16 |
| Published families | 16 |
| External source records with owner + reviewer | 18 |
| Learner-risk types with owner + reviewer | 12 |
| General consular/legal context claims | 12 |
| Arabic-learner pronunciation inventory | 18 |
| Inventory rows with existing interactive synthetic pair | 11 |
| Inventory rows mapped to articulation diagram | 18 |
| Issues | 0 |

## Lifecycle by family

- `diagnostic`: 32 published records; automated validation passed, independent review pending.
- `exam`: 720 published records; automated validation passed, independent review pending.
- `exam-speaking`: 72 published records; automated validation passed, independent review pending.
- `exam-writing`: 24 published records; automated validation passed, independent review pending.
- `lesson-controlled`: 588 published records; automated validation passed, independent review pending.
- `lesson-listening`: 252 published records; automated validation passed, independent review pending.
- `lesson-mediation`: 84 published records; automated validation passed, independent review pending.
- `lesson-mini-test`: 420 published records; automated validation passed, independent review pending.
- `lesson-reading`: 252 published records; automated validation passed, independent review pending.
- `lesson-speaking`: 84 published records; automated validation passed, independent review pending.
- `lesson-writing`: 84 published records; automated validation passed, independent review pending.
- `library-listening`: 160 published records; automated validation passed, independent review pending.
- `library-reading`: 160 published records; automated validation passed, independent review pending.
- `practice-dictation`: 16 published records; automated validation passed, independent review pending.
- `practice-branching`: 8 published records; automated validation passed, independent review pending.
- `practice-collocation`: 64 published records; automated validation passed, independent review pending.

## Claim boundaries

- Publication means the validated route is available; it does not mean independent German, Arabic, CEFR, or rights approval.
- All 12 consular/legal rows are language practice with `officialClaimStatus=not-claimed` and specialist review pending.
- All 18 pronunciation rows set `notUniversal=true`; current diagrams and 11 synthetic pairs are teaching support, not a learner pronunciation score. Independent phonetics review remains pending.
- Named IDs assign accountable product roles; they do not fabricate that a pending human review occurred.
