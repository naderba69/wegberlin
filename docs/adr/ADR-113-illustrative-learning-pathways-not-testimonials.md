# ADR-113: Illustrative learning pathways, not testimonials

**Status:** Accepted and implemented · P2-276 · 2026-10-05  
**Policy:** `illustrative-learning-pathways-v1`

## Context

The backlog asks for success stories that work as practical guidance rather than marketing promises. The project has no independently reviewed learner-outcome study or permissioned testimonial corpus. Inventing named learners, quotations, before/after measures, success rates, or time-to-level estimates would imply evidence the product does not have.

## Decision

- `/practice` presents three authored hypothetical situations and short sequences through existing product routes: a practical everyday situation, changing time/energy, and extra practice without a level claim.
- The visible disclosure calls them fictional illustrative scenarios, not learner testimonials or trial data. It states that there are no measured outcomes or promised time-to-level/exam results.
- Each path points only to routes present in every current Offline pack. The examples work as optional guidance; they are not personalized, are not based on profile or analytics data, and do not claim an outcome.
- The section is static and uses native `<details>` disclosure. It adds no profile fields, persistent state, network origin, analytics, score, or change to mastery/progress/CEFR.
- The existing `/practice` route is retained, so the route manifest and pack route counts remain unchanged. Because the cached `/practice` HTML/assets change, active and staging pack caches move together to v183; v182 remains the previous complete rollback pack.

## Validation boundary

Unit integrity checks verify the hypothetical-evidence contract, absence of testimonial/outcome fields, and route availability in every Offline pack. Desktop/mobile Playwright checks visible disclosure, expandable steps, in-scope route links, accessibility, absence of off-origin/non-GET requests, and unchanged learner evidence. These are product/code checks; they do not validate real learner outcomes or turn the scenarios into research evidence.
