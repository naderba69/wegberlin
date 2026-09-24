# ADR-032 — Internal near-duplicate gate and separate review states

- Status: Accepted
- Date: 2026-09-07
- Policies: `content-near-duplicate-v1`, `content-review-state-v1`
- P1 result: P1-293 implemented, P1-295 implemented, P1-92 partial

## Context

The academic audit already validated strict schemas, answer visibility, and objective mapping, but unique IDs did not prove that thousands of prompts were meaningfully distinct. Human-review pending states were documented by subsystem rather than attached separately to every question/task. A true “not close to Menschen” claim would also require an authorized reference corpus and independent rights review, neither of which is available or appropriate to copy into this repository.

## Decision

### Internal corpus

The audit reuses the unified answer registry and therefore covers all 2,584 closed-answer prompts plus 348 productive prompts: 2,932 objects. Every object retains stable ID, authored context, scope, and closed/productive kind.

### Deterministic similarity

The scanner normalizes NFKC, German case, Arabic diacritics, punctuation, placeholders, and whitespace. It compares content tokens and ordered token bigrams. Exact matches of meaningful length are suspicious. Near matches require:

```text
combined score >= 0.84
token Jaccard >= 0.82
ordered-bigram Jaccard >= 0.65
length ratio >= 0.68
minimum five content tokens
```

Short generic wording is not treated as evidence. Above-threshold pairs in one authored context remain visible as `exempt-same-context` teach→practice→assessment recycling. Cross-context pairs fail the audit unless a stable pair has a named reason, reviewer, and date in the explicit exemption registry.

The first live scan found 24 cross-context pairs. Instead of adding blanket exemptions, visible lesson/library/full-exam prompts were rewritten with their real contextual distinction. The accepted baseline compares 2,932 objects across 4,296,846 pairs, retains 10 same-context pairs, has zero reviewed exemptions, and has zero unexempt issues.

This is a lexical-semantic proxy, not embedding equivalence or plagiarism detection.

### Per-object review states

Every corpus object receives separate `german`, `arabic`, `cefr`, and `copyright` state objects under `content-review-state-v1`. The default is `automated-pass-human-pending`, with evidence specific to the dimension. An override can become `independently-reviewed` only with named evidence. Current counts are 2,932 pending and zero independently reviewed in each dimension.

### Copyright boundary

`authorizedExternalReferenceCorpora` is intentionally empty. No Menschen/Hueber or official exam source text is stored or fetched. The report therefore says `pending-authorized-corpus-and-independent-review`. P1-92 moves only to partial; it does not close and no copyright clearance is claimed.

## Build integration

`similarity:audit` writes/checks synchronized JSON and Markdown with one SHA-256 and is mandatory in `prebuild`. A cross-context issue or stale report fails production build. Synthetic unit fixtures verify exact duplicate, near duplicate, short generic wording, same-context visibility, and named reviewed exemptions. Live tests lock corpus/pair/status counts and the no-clearance boundary.

## Consequences

P1-293 is implemented because the complete internal prompt corpus has a deterministic fail-closed gate. P1-295 is implemented because all four states exist separately per object without pretending pending automation is human review. P1-92 remains partial until legally authorized comparison material and an independent copyright reviewer are available in the final review.
