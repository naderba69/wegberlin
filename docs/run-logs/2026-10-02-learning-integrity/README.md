# 2026-10-02 — learning-integrity repairs

Authoritative source decisions: ADR-100 and docs/LEARNING_REPAIRS_AR.md.

`npm run check`: exit 0; 1,185 unit/integrity tests in 172 files, 322 built pages, unchanged 15% budgets.

Desktop: 55/57 in the final complete run, then the two updated contract assertions passed 2/2 on the same application build. Mobile: 55/57, then the two isolated contracts passed 2/2 after a sandbox browser closure and a desktop-only selector were addressed. All 57 distinct contracts were verified on each project; this is not a claim of one 114/114 green run. Assertions and existing timeouts were not loosened. TTS sequence tests use an explicit mock. Physical device, GPU, screen-reader, language, rights and human-voice reviews remain open.

Playwright CDN and Debian mirrors were unreachable. The temporary @sparticuz/chromium 153 browser and bundled NSS/NSPR libraries came from the accessible npm registry; no browser binary or weight is committed. CSP/origin security was not disabled. Six standing lint warnings remain. No push or deployment was performed.

QA_SUMMARY.json contains the measured aggregate and build fingerprint. Temporary verbose logs and browser runtime are in ignored `.arena/`; production artefacts are ignored `.next/`.
