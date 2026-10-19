# ADR-136: Source verification of the ADR-135 noun anchors and an E2E proof for the speaking after-attempt phrases

- Status: accepted, 2026-10-19 (v244)
- Evidence tier: `source-verified-agent` (ADR-116) for the 105 nouns. This is agent verification against named sources, not an independent German review, and not a signature.
- Owner delegation: «نفّذ ما يفيد المتعلم والصحيح».

## Context

ADR-135 (v243) added 105 noun anchors to the vocabulary stage so that no reading question depends on a word the learner was never shown. These anchors were authored but not checked against a source. The 1,297 original P0-98 anchors were source-verified in v225 (ADR-116). That left the new 105 at a lower evidence tier than the rest of the registry.

ADR-133 (v241) gave all 64 independent speaking tasks at positions 9–24 a phrase panel for the next attempt. Unit tests covered the data. No browser test proved the rule that matters to the learner: the panel stays hidden until a saved attempt, and opening it is recorded as after-commit help.

## Decision

1. **Source verification of the 105 anchors**, using the v225 method:
   - `scripts/export-question-support-nouns.ts` exports the anchors from the registry itself.
   - `scripts/verify-question-support-nouns.py` compares gender, accusative, dative and plural with WiktionaryDE through `german_nouns` 1.2.5 (PyPI, CC BY-SA 4.0). A compound missing from the dictionary is checked through its head word.
   - Two rows the package cannot decide were checked by hand on de.wiktionary: «Spanisch» (neuter, no plural) and «Befragter» (masculine, adjectival declension).
   - Result in `reports/lexical-review-packet/source-verification-question-support-nouns-2026-10-19.csv`: 82 direct, 21 through the compound head, 2 manual, **0 mismatches**. No registry entry changed.
   - `tests/unit/question-critical-support.test.ts` ties the CSV to `questionSupportNounEntries`. If an anchor's gender, nominative or plural changes, the test fails until the row is verified again.
   - Arabic summary: `reports/lexical-review-packet/SOURCE_VERIFICATION_2026-10-19.md`.
2. **E2E for the ADR-133 panel** in `tests/e2e/learning-integrity.spec.ts`, on task `independent-a1-10` (a phone registration whose source lesson a1-03 has a written message instead). The test shows:
   - the panel is absent during preparation, recording and self-listening, and phrases are not visible during recording;
   - after saving, the attempt is stored with `supportVisibleDuringRecording: false` and the panel appears closed, with no support event yet;
   - opening it shows five phrases from the speaking scenario set, not the written-task set;
   - opening it records exactly one after-commit `hint` event for `independent-a1-10-speaking:after-attempt-phrases`.

The E2E count rises from 66 to 67 per project.

## Not covered

- The Arabic meanings of the 105 anchors are not verified here.
- The 42 glossary entries and 4 proper names from ADR-135 are not part of the CSV.
- Reviewer cells in the packet stay empty. No names are written.
- An independent German review remains desirable.
- No audit item changes state. The remaining partial items are still human-only or owner-only.
