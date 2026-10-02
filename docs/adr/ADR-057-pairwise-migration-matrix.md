# ADR-057 — Pairwise supported migration matrix

Status: accepted · 2026-09-10 · Africa/Tunis  
Policy: `supported-pairwise-migration-matrix-v1`  
Closes: P2-333

The matrix tests every supported legacy plaintext DWNB format (v1 and v2) with every supported LearningState schema (v1, v2, v3), plus the only valid encrypted pair (DWNB v3 with schema v3). Each of the seven pairs must import through the real checksum/archive parser, migrate to strict schema v3, preserve a marker, and remain re-exportable as current v2 and encrypted v3.

We do not invent a DWNB v3 + legacy-state pair because encrypted v3 has only ever been emitted from the current strict schema. Unknown future formats and expired v1 remain rejection cases in the deprecation tests. App and curriculum identifiers are recorded beside the matrix; changing support requires changing the registry and test together.
