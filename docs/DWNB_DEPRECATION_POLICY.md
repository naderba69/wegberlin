# DWNB format deprecation and support policy

Policy: `dwnb-deprecation-policy-v1`  
Announced: 2026-09-09

## Compatibility matrix

| Format | Import | Export now | Encryption | Lifecycle | Support commitment | Migration |
|---|---|---|---|---|---|---|
| DWNB v1 | Yes through 2027-03-31 | No | No | Deprecated, supported during notice | Ends 2027-03-31 | Import before the deadline, verify the preview, then export as v2 or encrypted v3. |
| DWNB v2 | Yes | Yes when no passphrase is chosen | No | Current | At least through 2027-09-30 | Optionally re-export as encrypted v3. |
| DWNB v3 | Yes | Yes when a passphrase is chosen | AES-GCM, PBKDF2-SHA-256 | Current | At least through 2027-09-30 | No migration currently required. |

The v1 notice window is longer than 180 days. A supported old archive is never rejected silently: Settings shows its format, producing app version, lifecycle warning, and migration action before merge or replacement. After the deadline, v1 receives an explicit non-mutating error.

Unknown future formats are rejected before state mutation with an explicit version message. A recognized format with an invalid manifest is also rejected explicitly. Checksums, passphrase authentication, strict learning-state validation, preview, and atomic IndexedDB commit remain mandatory and separate from this lifecycle decision.

## Learning-state migration

DWNB format version and learning-state schema version are different. A supported archive may contain schema v1 or v2 state. The importer applies the existing deterministic schema-v3 migration, then validates the complete result through strict Zod before it can reach the import preview.

## Release rule

A future deprecation must:

1. name the affected DWNB format;
2. publish an announcement date and an end date at least 180 days later;
3. retain automated fixtures for the supported window;
4. show a runtime warning and concrete migration route;
5. reject only after the documented deadline, before any local mutation;
6. update this matrix, `dwnb-deprecation-policy-v1` (or its successor), the handoff verifier, and release notes.
