# ADR-019 — Language and Bidi fragment governance

Date: 2026-09-05  
Status: accepted; physical assistive-technology review deferred to final review

## Context

The Arabic RTL shell already tagged many German fragments, but P0-254 required a complete, repeatable audit rather than a count of hand-picked locations. Generic answer banks can contain Arabic, German, mixed text, or technical values, so hardcoding every option as German would itself be incorrect. Raw bidirectional control characters also create security and rendering risks.

## Decision

Adopt `language-boundary-v1` and a generated `language-boundary-audit-v1` report.

### Explicit fragments

- The root remains `<html lang="ar" dir="rtl">`.
- Every static `lang="de"` JSX tag must also own `dir="ltr"`.
- Every static Arabic tag, including a regional tag such as `lang="ar-TN"`, must own `dir="rtl"`.
- An LTR element without German language must declare an explicit technical, numeric, secret, or mixed bidi scope.
- Dynamic `lang={...}` and `dir={...}` expressions must occur as a pair.
- Raw Unicode bidi override/isolate control characters are forbidden in TSX source.

### Adaptive answer fragments

`fragmentLanguageAttributes` classifies the actual string as:

- Arabic → `lang=ar`, `dir=rtl`;
- German/Latin → `lang=de`, `dir=ltr`;
- mixed → `dir=auto`, explicit mixed scope;
- technical/numeric → `dir=ltr`, explicit technical scope.

The classifier is mandatory in generic exercise, diagnostic, library, module-review, A1/A2/B1/B2 assessment, targeted-choice, and targeted-listening answer renderers.

### CSS containment

Arabic-host static text receives a plaintext paragraph boundary, while explicit German, `bdi`, and scoped technical fragments use `unicode-bidi:isolate`.

## Current audit

```text
TSX files: 180
Opening JSX tags: 7,045
Explicit German fragments: 406
Explicit technical/numeric/secret scopes: 45
Adaptive answer-bank consumers: 10
Arabic + Latin static text nodes audited: 235
Pairing/control-character issues: 0
```

Generated artifacts:

```text
docs/generated/LANGUAGE_BOUNDARY_REPORT.md
reports/language-boundary-audit.json
```

`language:audit` runs during `prebuild` and fails on source/report drift.

Re-measured at **v158 (2026-09-23)**: the woven nursing layer added one TSX surface
(`src/components/nursing-layer-panel.tsx`) carrying German fragments marked `lang="de" dir="ltr"`, three Arabic
sections and one `<bdi>` per option. The counters moved from the previous 179 TSX / 6,990 opening tags / 399 German
fragments / 233 mixed-static nodes to the values above, still with **0 issues**; the earlier numbers stay recorded in
the ADR history, and `handoff:check` fails if the report, the unit test or this block drifts from the audit.

## Consequences and boundary

P0-254 is closed at source-governance, runtime DOM, CSS containment, and automated browser acceptance levels. P0-255 remains open: the owner has explicitly deferred real NVDA/VoiceOver/TalkBack/Switch Control and physical-browser testing to the final whole-project review. Automated ordering and computed-style checks cannot claim what those devices will speak in practice.

## Re-measurement at v158 (2026-09-23)

The woven nursing layer added one TSX surface (`src/components/nursing-layer-panel.tsx`) with German fragments marked `lang="de" dir="ltr"`, three Arabic sections and one `<bdi>` per option. The measured counters moved from 179 TSX / 6,990 opening tags / 399 German fragments / 233 mixed-static tags to **180 TSX / 7,045 opening tags / 406 German fragments / 235 mixed-static tags**, still with **0 issues**. The original v-era numbers above are kept as the historical measurement; `npm run language:audit` and its unit test carry the current ones, and `handoff:check` fails if either drifts.
