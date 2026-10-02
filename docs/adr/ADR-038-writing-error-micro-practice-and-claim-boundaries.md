# ADR-038 — Writing-error micro practice and claim boundaries

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `writing-error-micro-practice-v1`, `practice-law-language-boundary-v1`
- Closes: P1-175, P1-186

## Context

The Writing Lab already persisted plan, draft, self-check, five deterministic dimensions, cited feedback, and revision. Feedback could identify structural weaknesses, but it did not turn a reliably detected error in the learner's actual text into a small repair exercise. A generic generated exercise would not satisfy P1-175 because it could invent an error the learner never made.

The curriculum also contains realistic language-learning scenarios about greetings, housing, work, health, administration, forms, and deadlines. These are pedagogical contexts, not legal advice. P1-186 requires a visible distinction between a German language rule, a common contextual practice, and an official/legal requirement.

## Decision

### 1. Deterministic error patterns only

`detectWritingErrorPatterns` inspects the learner's submitted German text locally. It currently recognizes seven bounded patterns whose correction can be generated without semantic guessing:

- sentence capitalization;
- infinitive left after `ich`;
- infinitive left after `du`;
- infinitive left after `er/sie/es`;
- `ich bin heißen`;
- copula order immediately after `weil`;
- `haben` instead of `sein` with common movement participles in Perfekt.

Each match carries the literal source sentence, a bounded deterministic correction, an Arabic explanation, the pattern ID, and `deterministic-local-pattern`. At most three exercises are built from one reviewed submission. Unsupported or ambiguous language produces no exercise rather than an invented correction.

The Writing grammar dimension can fail when one of these explicit patterns is found. If none is found, the UI says only that no limited local pattern matched; it never claims the text is error-free or human-reviewed.

### 2. Delayed German-first repair

Every generated exercise is linked to:

- `sourceSubmissionId`;
- task/lesson ID;
- exact source version;
- pattern ID;
- a literal source excerpt up to 180 characters.

The learner sees `Korrigieren Sie den Satz aus Ihrem eigenen Text`, the actual excerpt, and an empty answer field. The deterministic correction and explanation remain hidden until an answer is committed. The attempt stores only the bounded repair answer and provenance under:

```text
personal-writing-repair-no-mastery-or-gate
```

A successful repair is personal practice only. It does not alter the writing submission, lesson mastery, level gate, CEFR estimate, or exam readiness. No AI provider, API key, or network request is involved.

### 3. Portability and deletion

`writingRepairAttempts` is a strict LearningState array with old-state default compatibility. DWNB round-trip and merge preserve attempts by evidence ID. Settings deletes Writing submissions and their dependent repair attempts together; because the source evidence is genuinely deleted, the UI warns that productive gate readiness may fall. Device-input benchmark evidence is a separate category and is not silently deleted with learner writing.

### 4. Three claim kinds

`buildLessonClaimBoundary` produces exactly three non-overlapping cards for every one of the 85 lessons:

1. `Sprachregel` / language rule — anchored to the first authored theory block in the lesson. It describes German usage inside the curriculum and is not law.
2. `Übliche Praxis` / common practice — describes context-sensitive politeness, formality, or communication. It can vary by person, institution, and situation and is not a general legal obligation.
3. `Offizielle Vorgabe / Gesetz` / official requirement or law — explicitly `not-claimed` unless a separate maintained official source contract exists.

The policy scans lesson context for bounded risk themes: authority/forms, housing/contracts, employment, deadlines/obligations, and health. A flagged lesson displays an external-verification warning. It does not invent an authority URL, freshness date, legal deadline, required document, entitlement, or guarantee of acceptance.

The boundary is:

```text
classification-guidance-not-legal-advice
```

Exam-format facts remain governed separately by the existing official source registry and provider-specific exam profiles.

## Acceptance evidence

Automated tests cover:

- all seven supported writing patterns and their deterministic corrections;
- literal-source ownership, 180-character bounds, source submission/version linkage, and maximum exercise count;
- no fabricated exercise for unsupported text;
- delayed correction and exact normalized evaluation;
- grammar-dimension linkage to the learner's actual sentence;
- strict schema, DWNB, merge, and unchanged mastery;
- all 90 lessons with exactly the three claim kinds and correct authority classes;
- administrative/housing/work/deadline/health detection and mandatory verification warnings;
- absence of fabricated official source IDs or official claims;
- Desktop/Mobile Writing repair, IndexedDB provenance/deletion, and three-card lesson UI;
- existing responsive and axe matrix coverage.

## Consequences and limits

- P1-175 and P1-186 close as software/product workflows.
- The pattern detector is deliberately narrow. It has false negatives and must never be marketed as full grammar correction, teacher review, or plagiarism detection.
- The deterministic corrected sentence may still need human review in unusual names, punctuation, ellipsis, or dialectal contexts. Unsupported ambiguity must remain without an exercise.
- A language-rule card is authored curriculum evidence, not independent German approval.
- A common-practice card is not a sociological guarantee for every German-speaking region or institution.
- The official card currently refuses to make legal claims; it is not a substitute for a maintained official-service source registry or legal professional.
- Automated tests do not replace a German writing teacher, legal reviewer, Arabic/Tunisian reviewer, or physical assistive-technology review.
