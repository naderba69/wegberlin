# Accepted-Answer Breadth Hygiene Report

Generated: 2026-09-23  
Version: `accepted-answer-hygiene-v1`  
Content SHA-256: `99d4d53f3394586d07daa940232c641ff371abcb5c6969d26ea1c1a6eb08de81`

## Result

`PASS` — **387** productive exercises, of which **215** (55.6%) accept exactly one normalized string and **172** accept more than one. Unreachable accepted variants listed in the tree: **0**.

## Policy

A listed accepted answer is padding when it normalizes onto another listed answer: students cannot type it distinctly, the grader cannot reward it, and counting it widens the claimed answer breadth without widening acceptance.

Breadth is therefore counted on distinct normalized forms. `normalizeGermanText` lowercases and strips `. ! ? , : ; ، „ “ " '`, so sentence-initial capitalization and a trailing full stop are never a second form.

## By level

| Level | Productive exercises | One accepted string | Share | Unreachable variants |
|---|---:|---:|---:|---:|
| A1 | 96 | 55 | 57.3% | 0 |
| A2 | 96 | 62 | 64.6% | 0 |
| B1 | 96 | 52 | 54.2% | 0 |
| B2 | 99 | 46 | 46.5% | 0 |

## Unreachable variants

| Exercise | Type | Variant normalized onto a listed form |
|---|---|---|
| — | — | لا شيء بالقياس الحالي |

## What this report does not claim

- It does not widen acceptance: the grader is untouched and ADR-078 still stands (explicitly listed variants only).
- It does not close P1-398. The ceiling (<=25% single-string productive exercises) is now evaluated honestly and remains far above it; whether the ceiling itself is the right definition is an owner decision recorded in `P1_AUDIT.md`.
- A green run here means "no variant is unreachable", not "the exercises accept every correct answer".
