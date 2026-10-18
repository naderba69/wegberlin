# ADR-123 — The local practice bank is derived from the already-loaded curriculum, not shipped twice (P2-355, ADR-049)

- Status: accepted — 2026-10-18 (v231)
- Policy ID: `local-test-generator-v1` (unchanged). Amends point 5 of ADR-111; the rest of ADR-111 stays in force.

## Context

ADR-111 shipped four generated level banks (`src/data/local-test-templates/{a1,a2,b1,b2}.ts`) as static imports of `/practice/test-generator`, so the route works offline after a pack install. Each bank is a copy of the published lessons' `miniTest` items. The route's HTML already references the four `curriculum-a1…b2` chunks, so every Mini-Test item reached the browser twice on that route: once in the curriculum chunks and once in the page chunk (about 76 KB gzip).

In v231 (ADR-122), 54 Mini-Test items were rewritten with complete explanations. Both copies grew, and the total built JavaScript reached 2,136,520 gzip bytes. That is above the ADR-049 safety ceiling of 2,125,000, which keeps a mandatory 15% reserve below the 2,500,000 hard limit. Project precedent (2026-09-19, curriculum split per level) is to fix `js:budget` with engineering, not by relaxing the policy.

## Decision

1. `loadLocalTestTemplateBank(level)` now builds the banks in the browser with the same pure, fail-closed `buildLocalTestCatalog(academicLessonList, curriculum)` that the build-time audit uses. The result is cached for the page session. If the catalog is not `ok`, the loader throws, and the existing UI shows its error state without saving anything.
2. The inputs are static imports (`@/data/academic-lessons`, `@/data/curriculum`) whose chunks the route already loads. There is still no `dynamic import`, so the ADR-111 offline guarantee holds: an installed pack keeps every level usable on this route.
3. The generated bank files stay as a reviewed, drift-checked artifact. `npm run local:test:templates` still fails when they are stale, and `tests/unit/local-test-generator.test.ts` checks that the browser-derived banks equal them level by level. They are no longer imported by client code.
4. `scripts/audit-js-budgets.mjs` and the 15% reserve are unchanged.

## Consequences

- One copy of each Mini-Test item ships to the client. Built JavaScript falls back under the safety ceiling (see the v231 build line in `PROJECT_STATUS.md`).
- Learners see the same 480 templates from the 96 published lessons, with the same sampling, shuffling and delayed answer reveal.
- `scripts/verify-continuation-handoff.mjs` now requires the derived loader and fails if the loader imports the generated banks again.
