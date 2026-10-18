# ADR-132: Per-learner, per-lemma evidence before reading (م17)

- Status: accepted, 2026-10-18 (v240)
- Policy IDs: `learner-lemma-evidence-v1` (new), `curriculum-lexical-context-v1` (new). `lemmatized-lexical-load-v2` (ADR-126) is unchanged and its report is byte-identical.
- Evidence tier: agent-authored engineering change under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»).

## Context

Ledger row م17 had one open gap after v234–v236: the lexical-load measure assumes "taught earlier = known". It never measures what one particular learner knows. ADR-126 says this explicitly: "unknown" means "not supported by earlier curricular exposure", never "the learner does not know the word".

The app already stores the evidence needed for a per-learner view. It just never joined that evidence to words:

- `reviewEvents`: card id, grade 0–5, `initial` or `delayed`, timestamp.
- `exerciseAttempts`: the learner's answer string, correct or not, timestamp.
- `completedLessonIds`.

## Decision

1. **Shared lexical context.**
   - The audit's stop list and legacy stemmer moved unchanged from `scripts/generate-lesson-quality-audit.ts` to `src/core/german/curriculum-lexical-context.ts`.
   - The script now imports them, and `reports/lesson-quality-audit.json` regenerates with no diff.
   - The audit and the learner view therefore agree on what a content word is.
2. **Per-word status, derived on the fly** in `src/core/evidence/learner-lexical-knowledge.ts`. There is no new state field, migration, export change or reset-plan change. For each non-name content word of the reading text, the most recent observation decides:

   | Status | Meaning |
   |---|---|
   | `struggling` | The latest observation is a failed lesson-card review (grade < 3). |
   | `retrieved` | The latest observation is a success, and at least one success was a **delayed** review (retrieval after a gap). |
   | `practised` | Successes only in initial reviews or correct exercise answers. |
   | `taught-only` | No observation, but the current lesson taught the word before the reading, or a lesson the learner **completed** covers it. |
   | `new` | None of the above. |

3. **What counts as evidence:**
   - **Word-level lesson cards** (authored flashcards and lesson phrases) whose German front contains one of the word's exact lemma candidates. Example-sentence and error cards are not used, because they test a sentence rather than a word.
   - **Correct exercise answers** that contain the word.
   - **Wrong answers are never attributed to a word.** A wrong answer does not say which word failed, and guessing would invent a weakness the learner never showed.
   - **Personal error-remediation reviews are skipped**, because their card front is the wrong form.
   - **Only exact lemma candidates credit evidence.** The audit's legacy `~stem` key is used only for the "taught" check, so `Wohnung` is never reported as practised because `wohnen` was.
4. **Bundle boundary.** The lesson page is a server component, so the work is split:
   - `src/data/reading-lexicon-seeds.ts` builds one compact seed per lesson at build time. Each word is a tuple: word, surface, hex bitmask of covering lessons, before-reading flag, and base-36 card refs.
   - The seed is passed as a prop. The curriculum and the 2,300-card list never reach the browser.
   - The browser joins the seed with the learner's own state.
   - Seed size: about 5.4 KB raw and 2.1 KB gzip per lesson page on average.
5. **Learner-facing use.**
   - The reading stage shows a short panel before the text with the five counts.
   - Below the counts it lists up to 10 German words the learner failed last time and up to 10 words new to them, without meanings.
   - Showing German without meanings is orientation, not translation, so opening the stage records no support use.
   - The panel says in Arabic that this is evidence tracking from this device and not a vocabulary test. It also says that wrong answers are not attributed to words.

## Consequences

- The learner sees, before reading, which words of this text they actually retrieved after a gap and which ones failed last time. The curriculum's "taught earlier" assumption is replaced by their own record wherever a record exists.
- Covered by `tests/unit/learner-lexical-knowledge.test.ts`:
  - parity of the stop list and stemmer;
  - mask and card-ref round trips for every word-level card;
  - seed fidelity for all 96 lessons;
  - time ordering and precedence;
  - skipping remediation reviews;
  - no credit through the stem key;
  - no credit from wrong answers;
  - completed-lesson coverage;
  - rendering;
  - the bundle boundary.
- E2E checks that the panel is present on the a1-01 reading stage.
- **Stated limits:**
  - It is deterministic, not a probability or forgetting model.
  - A phrase card credits all of its content words together.
  - Evidence is local to the device, like all learner state.
  - The panel is used on the reading stage only. Feeding the same status into review-queue prioritisation or exercise selection would be a separate decision.
