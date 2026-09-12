# ADR-073 — Single-source runtime curriculum identity

- **Status:** accepted and implemented
- **Date:** 2026-09-12
- **Scope:** TypeScript runtime, Service Worker, prebuild/prepare, Offline pack metadata

## Context

The curriculum version was manually repeated in `src/config/curriculum-version.ts` and `public/sw.js`. A future curriculum release could update one location and silently leave Offline pack metadata on the other identity.

## Decision

1. `src/config/curriculum-version.json` is the authored registry for app version, curriculum version, policy, scope, publication date, migration rule, and claim boundary.
2. `scripts/materialize-runtime-config.mjs` validates the JSON and generates `curriculum-version.generated.ts` plus the marked Service Worker constant.
3. Runtime TypeScript imports the generated TypeScript module, avoiding Node ESM JSON-loader differences without creating a second authored source.
4. `prepare` and `prebuild` both run materialization.
5. Unit tests compare the Service Worker value with the JSON registry and require the generated marker, so unmaterialized drift fails before release.
6. The Service Worker still contains a physical constant because it must execute independently in the browser; that line is generated output, not a second authored source.
7. `pre-update-curriculum-pack-diff-v2` treats installed legacy metadata without a curriculum identity as an unknown curriculum update rather than a harmless build update.

## Boundary

The version identity does not prove semantic equivalence, CEFR accuracy, independent content review, or successful migration on every physical browser. It prevents manual source drift and keeps the existing explicit review boundaries.
