# ADR-125 — Authored articulation profile per lesson (P1-380)

- Status: accepted — 2026-10-18 (v233)
- Policy ID: `authored-articulation-profile-per-lesson-v1`
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not an independent phonetics review.**

## Context

Each lesson's pronunciation lab (`articulation-contrast-practice-v1`) shows one articulation diagram and two meaningful Browser-TTS contrasts. The profile was picked by `profileFor(lesson.pronunciation.focus)`, a keyword heuristic over the focus string. The heuristic sent **73 of 96 lessons** to the fallback "prosody" profile, so they all showed the same statement/question intonation pairs, whatever the lesson actually trained. Two problems followed:

- **Wrong mappings.** a2-11 has the focus `[ˈvʏʁdə]` (rounded front vowel ü), but `"[ʏ"` does not match `"[ˈvʏ"`, so the lesson showed intonation pairs. Lessons on word stress (AUFstehen, WEIterleiten, compound stress, separable prefixes with zu), the ach-Laut in «doch» and «auch», and short vowels in Konjunktiv forms all fell through to the same generic pairs.
- **Inventory links that did not show the pair.** The 18-row Arabic-learner inventory linked most rows to lessons that never displayed the row's interactive pair. For example, f–v was linked to a1-02 and a1-06, which are palate lessons. A learner following the link landed on a different contrast.

## Decision

1. **An authored map.** `src/data/articulation-profile-assignments.ts` assigns one profile to each of the 96 lessons. Each choice was made by reading the lesson's focus, Arabic explanation and items. The heuristic remains only as a fallback for IDs outside the map; a test requires the map to cover exactly the curriculum.
2. **Two new profiles, with contrasts that TTS can honestly produce.** Each new pair uses two different strings, so the synthetic voice really differs.
   - `wordStress` (zone rhythm, «Wortakzent»):
     - «Er fährt das Schild um.» vs «Er umfährt das Schild.»: separable prefix stressed vs root stressed, with a change in meaning;
     - Kaffee [ˈkafe] vs Café [kaˈfeː].
     - Lessons: a1-08, a1-17, a1-24, a2-01, a2-07, a2-08, a2-14, a2-17, a2-20, b1-13, b2-14, b2-15, b2-17 and b2-23 (14 lessons).
   - `achLaut` (new diagram zone `velum`, back of the tongue towards the soft palate):
     - Buch [buːx] vs Bücher [ˈbyːçɐ];
     - Dach [dax] vs Dächer [ˈdɛçɐ].
     - Lessons: b2-19 («doch» [dɔx]) and b2-20 (nicht [nɪçt] / auch [aʊ̯x]).
3. **Corrections to existing profiles.** a2-11 moves to `rounded`. b2-21 (short vowels and schwa in Konjunktiv forms) moves to `vowelLength`.
4. **Sentence-level foci stay on `prosody`.** These include Satzakzent, Kontrast, Intonation, Sprechgruppen and connector melody. Browser TTS reads an identical string the same way each time, so it cannot honestly vary sentence focus. Distribution: prosody 73 ⇒ **55**, wordStress 14, rounded 7, palate 5, affricates 4, lipTeeth 4, vowelLength 3, onsetH 2, achLaut 2.
5. **Inventory re-linked.**
   - Every row now points to lessons that actually teach its sound.
   - Every interactive row is linked to at least one lesson that shows its pair. A test checks this.
   - Each row's level is the level of its earliest linked lesson.
   - The word-stress row gets `interactivePairId: "stress-umfahren"`, and the ach-ch row gets `"ach-dach-daecher"` (Bach/ich ⇒ Dach/Dächer, zone `velum`).
   - The consonant-cluster row (Sprache/Straße) now links to a1-06 and a1-16 ([ʃp]/[ʃt]) with the palate diagram.
   - Interactive rows go from 11/18 to **13/18**.

## Consequences

- Interactive rows for P1-380 reach 13/18. p-b, r-variants, final devoicing, consonant clusters and sentence focus remain guided only, because no lesson focus maps to them honestly through TTS. P1-380 stays `partial`. Recordings of Arabic learners and an independent phonetics review are still missing.
- No score, no mastery and no new learner state. The evidence boundary stays `synthetic-discrimination-only-no-pronunciation-or-mastery-score`.
- Boundary: each assignment is a pedagogical judgement made by the agent. `src/data/articulation-profile-assignments.ts` is the single place to change it.
