# ADR-015 — Independent level Offline packs and pre-download build sizes

Date: 2026-09-05  
Status: accepted

## Context

The atomic Offline installer previously owned one 298-route choice. Learners could opt out of audio, but could not install only A1, A2, B1, or B2. It also knew exact MP3 bytes before download while reporting Next/page bytes only after Cache Storage installation.

## Decision

### Route packs v2

`public/offline-routes.json` now defines five independently selectable route sets:

```text
A1             51 routes
A2             51 routes
B1             51 routes
B2 + Prüfung  200 routes
A1–B2 full    298 routes
```

Each lower-level pack contains the shared guidance/local-data shell plus only its own lessons, modules, and level assessment. A1/A2/B1 do not include B2 exam routes. B2 owns all 150 provider-scoped task routes and 12 full dashboards while preserving Goethe/telc separation. Installing another choice atomically replaces the active pack; IndexedDB learner data is never part of that replacement.

Optional audio is filtered by pack:

```text
A1:   40 files
A2:   48 files
B1:   48 files
B2:  124 files, including 96 exam files
Full: 260 files
```

### Size manifest v1

`postbuild` runs `scripts/generate-offline-size-manifest.mjs` against the completed `.next` output. For every route pack it:

1. reads the exact generated route HTML/body;
2. discovers unique `/_next/static/` assets referenced by that pack;
3. URL-decodes generated dynamic-segment paths such as `%5BlessonId%5D`, resolves them under `.next/static`, and rejects traversal outside that root;
4. records raw bytes;
5. computes deterministic gzip level-9 bytes;
6. emits route, unique-Next-asset, support-file, and total sizes plus a SHA-256 build fingerprint.

The UI shows this precomputed page/Next size before download and adds exact selected-pack MP3 bytes only when audio is enabled.

The exact gzip level-9 bytes, raw bytes, unique Next asset count, and SHA-256 fingerprint are regenerated after every production build and live in `public/offline-size-manifest.json`. They are intentionally not hardcoded in this ADR because route HTML can contain legitimate build-specific differences. CI and unit gates require every pack to have a positive compressed total smaller than its raw total and the same route count as route manifest v2.

## Integrity boundaries

- The precomputed figure is deterministic gzip payload size, not a guarantee of the final network invoice. CDN Brotli selection and HTTP headers can differ.
- The size-manifest response itself is excluded to avoid recursive self-sizing.
- Actual installed bytes are still measured from Cache Storage after promotion.
- Browser quota/eviction remains outside application control.
- Audio stays synthetic, optional, and non-exam-grade.

## Consequences

P0-242 and P0-243 now have selectable product paths, atomic Service Worker enforcement, generated build evidence, unit coverage, and production-browser coverage. Any app/offline asset change must bump both active/staging cache names and regenerate the post-build size manifest.
