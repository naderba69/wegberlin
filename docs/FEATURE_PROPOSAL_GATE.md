# Coach-decision feature proposal gate

Policy: `coach-decision-feature-proposal-gate-v1`

A proposal is rejected when it does not change a named coaching or learner-control decision, has no before/after decision, lacks automated acceptance evidence, or lacks a maintenance owner. Any new network origin is rejected by this gate until it receives separate CSP, privacy, consent, and zero-cost review.

The gate records persistent-field and network-origin complexity, but those counts are not learner outcomes or quality scores. Run `npm run feature:gate`; it is mandatory in `prebuild`.
