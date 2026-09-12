# ADR-011 — Full CI browser matrix with bounded infrastructure retry

Date: 2026-09-04  
Status: accepted; remote green run pending

## Context

GitHub Quality Gate run 3 on commit `be56463e` passed `npm run check` and the production Build but failed the desktop e2e job. The same production suite passed locally on desktop and mobile. The workflow also omitted the mobile project and used GitHub actions versions that emitted Node 20 deprecation warnings.

## Decision

- Run `npm run test:e2e` in CI so both Chromium desktop and mobile projects execute.
- Keep one worker and production-server testing.
- Select Playwright `channel: "chromium"` so the installed full Chromium runs in its new headless mode instead of the legacy headless-shell binary. This followed two repeatable sandbox SIGSEGV process crashes late in the long media/Offline suite; it does not change application assertions.
- Allow exactly one retry only when `CI` is set; local development remains retry-free.
- Retain failure traces and forbid accidental `test.only` in CI.
- Use `actions/checkout@v5` and `actions/setup-node@v5`.
- Keep a 25-minute e2e timeout within the public-repository standard-runner zero-cost boundary.

## Consequences

- Mobile coverage is no longer omitted from the workflow.
- Retry-free local full-matrix runs passed 25/25 desktop and 25/25 mobile after switching away from the crashing headless-shell process.
- One transient browser-process crash can recover in CI without silently retrying local defects.
- P0-302 remains partial until this workflow is pushed and a remote run finishes green.
- A retry does not convert repeated product assertion failures into success; the run still fails after the bounded second attempt.
