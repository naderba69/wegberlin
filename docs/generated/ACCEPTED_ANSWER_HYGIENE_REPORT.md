# Accepted-Answer Breadth Hygiene Report

Generated: 2026-09-23  
Version: `accepted-answer-hygiene-v1`  
Content SHA-256: `fd7c34fd127d4feb56b7117b7b39f69c33b8f0c564b0c426288dd1d89898fda9`

## Result

`PASS` — **387** productive exercises, of which **257** (66.4%) accept exactly one normalized string and **130** accept more than one. Unreachable accepted variants listed in the tree: **0**.

## Policy

A listed accepted answer is padding when it normalizes onto another listed answer: students cannot type it distinctly, the grader cannot reward it, and counting it widens the claimed answer breadth without widening acceptance.

Breadth is therefore counted on distinct normalized forms. `normalizeGermanText` lowercases and strips `. ! ? , : ; ، „ “ " '`, so sentence-initial capitalization and a trailing full stop are never a second form.

## By level

| Level | Productive exercises | One accepted string | Share | Unreachable variants |
|---|---:|---:|---:|---:|
| A1 | 96 | 66 | 68.8% | 0 |
| A2 | 96 | 72 | 75% | 0 |
| B1 | 96 | 57 | 59.4% | 0 |
| B2 | 99 | 62 | 62.6% | 0 |

## Unreachable variants

| Exercise | Type | Variant normalized onto a listed form |
|---|---|---|
| — | — | لا شيء بالقياس الحالي |

## What this report does not claim

- It does not widen acceptance: the grader is untouched and ADR-078 still stands (explicitly listed variants only).
- It does not close P1-398. The ceiling (<=25% single-string productive exercises) is now evaluated honestly and remains far above it; whether the ceiling itself is the right definition is an owner decision recorded in `P1_AUDIT.md`.
- A green run here means "no variant is unreachable", not "the exercises accept every correct answer".
