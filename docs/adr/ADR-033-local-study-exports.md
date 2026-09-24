# ADR-033 — Local ICS, printable/PDF report, and Anki TSV exports

- Status: Accepted
- Date: 2026-09-07
- Policy: `local-study-exports-v1`
- Closes: P1-53, P1-281, P1-339, P1-340

## Decision

Settings owns one preview-first export card. The learner chooses weekly plan, evidence summary, and optional profile name; the name is off by default. Exports never contain recordings, API keys, tutor payloads, or free writing/speaking text. `.dwnb` remains the only full restore format.

### ICS

The existing deterministic Monday–Sunday plan becomes UTF-8 iCalendar 2.0 with CRLF, stable local UIDs, `VEVENT`, IANA `TZID`, start/end times, categories, and the `local-study-exports-v1` marker. No server, calendar account, notification permission, or automatic subscription is used.

### Printable report and PDF

A semantic RTL HTML preview supports `window.print()` through print-only CSS. The local PDF renderer draws the same selected summary to a browser Canvas using local fonts, encodes one JPEG, and wraps it in a self-contained PDF 1.4 image XObject with a valid xref table. The image PDF is printable but not a tagged/selectable accessible PDF; assistive-technology users should use the semantic preview. This limitation is explicit in the UI.

### Anki TSV

Only currently eligible lesson cards and confirmed personal-error cards are exported. The UTF-8 BOM contract is:

```text
Front  Back  Hint  Tags  CardId
```

Tabs/newlines are escaped and cells beginning with `=`, `+`, `-`, or `@` receive an apostrophe to prevent spreadsheet formula injection. Empty card sets fail closed.

## Acceptance

Unit tests cover preview minimization, ICS timezone/events/MIME/CRLF, invalid timezone fallback, pre-onboarding and empty-section refusal, TSV columns/BOM/formula guard/empty refusal, optional name, exclusion of free text, and PDF structure/invalid image rejection. Desktop and mobile Playwright verify real browser downloads, filenames, MIME payload signatures, local print invocation, hidden-name default, and opt-in name preview.

## Boundaries

ICS import behavior depends on the user’s calendar application. The PDF is a local printable snapshot, not a cryptographically signed or accessible tagged document. TSV is not a backup and may expose the selected cards after download; the user owns the file. No export claims official Goethe/telc reporting.
