# ADR-051 — Independent curriculum identity, accountable lifecycle, bounded claims, and pronunciation inventory

- Status: accepted
- Date: 2026-09-09
- Scope: P1-367, P1-368, P1-377, P1-380, P1-389

## Decision

### Curriculum identity

`independent-curriculum-version-v1` separates application build `0.1.0` from curriculum identity `dwnb-a1-b2-2026.09-v1`. The curriculum version is required in `LearningState`, written beside app version in new DWNB manifests, visible before import, fixed through Merge, and supplied to old unversioned schema-v3 state. Supported schema-v1/v2 state migrates to the current curriculum before strict validation.

### Ownership and lifecycle

`content-accountability-lifecycle-v1` defines exactly thirteen content families matching every scope in the 2,932-record answer/productive-task governance corpus. Each family has a distinct stable owner role and reviewer role, validation evidence, publication evidence, review state, and only the forward transitions Draft → Validated → Published. Direct Draft → Published and silent Published → Validated transitions are rejected.

Every generated content row inherits its family accountability. All twelve runtime learner-risk types and all sixteen external source records also carry distinct owner/reviewer role IDs. Runtime evidence risks are decorated with that governance before returning to the UI. Role assignment does not fabricate that a pending independent review occurred.

`Published` means a validated product route is available. It remains separate from `automated-validated-independent-review-pending` and never means independent German, Arabic, CEFR, phonetics, specialist, or rights approval.

### Consular/legal language

`general-consular-legal-claims-v1` adds twelve bounded language-practice claims across consular contact, travel disruption/accommodation, study admission/enrolment, work contract/conflict referral, residence authorities/deadlines, and qualified legal referral. Every row maps to a published A1–B2 lesson, names owner/reviewer roles, sets `officialClaimStatus=not-claimed`, keeps external source references empty rather than inventing authority, and provides an instruction to verify with the competent official or qualified source.

The software inventory and claim boundary are complete, but actual specialist review remains `specialist-review-pending`; P1-377 therefore remains partial.

### Pronunciation support

`arabic-learner-pronunciation-inventory-v1` records eighteen possible contrasts across consonants, vowels, clusters, word/sentence stress, and intonation. Every row is `notUniversal=true`, mapped to published lessons and an articulation diagram profile, and has an explicit synthetic-discrimination or guided-self-observation evidence mode. Eleven rows connect to existing interactive Browser-TTS contrast pairs; seven do not yet have an exact interactive pair.

No row diagnoses an Arabic speaker, recognizes learner phonemes, or creates a pronunciation/fluency/mastery score. Independent phonetics review and the seven remaining exact pairs keep P1-380 partial.

## Evidence

- `src/config/curriculum-version.ts`
- `src/config/content-governance-registry.ts`
- `src/core/content-validation/content-governance.ts`
- `src/data/high-risk-context-claims.ts`
- `src/data/arabic-learner-pronunciation-inventory.ts`
- `reports/content-governance-audit.json`
- `docs/generated/CONTENT_GOVERNANCE_REPORT.md`
- `tests/unit/content-governance-curriculum-version.test.ts`
