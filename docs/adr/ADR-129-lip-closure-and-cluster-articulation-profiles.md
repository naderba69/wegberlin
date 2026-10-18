# ADR-129: Lip-closure and consonant-cluster articulation profiles (P1-380)

- Status: accepted, 2026-10-18 (v237)
- Policy IDs: unchanged (`authored-articulation-profile-per-lesson-v1`, `articulation-contrast-practice-v1`, `arabic-learner-pronunciation-inventory-v1`)
- Evidence tier: agent-authored under explicit owner delegation («نفّذ ما يفيد المتعلم والصحيح»). **This is not an independent phonetics review.**

## Context

After ADR-125, 13 of the 18 inventory rows had an interactive Browser-TTS pair. Five rows were guided only: p-b, r-variants, final devoicing, consonant clusters and sentence focus.

Two of the five belonged to lessons whose pronunciation lab showed the wrong contrasts:

- **a1-10 and a1-11** train [pf] (Apfel, Pfeffer, Pfanne, Pfund). They used the `affricates` profile, so half of each lab was the [ts] pair Zeit/seit. That pair is unrelated to these lessons. The [p] closure that starts [pf] is exactly where Arabic-speaking learners can confuse [p] with [b], but no lesson offered a [p]–[b] contrast.
- **a1-06 and a1-16** train the clusters [ʃp]/[ʃt] (sprechen, Straße, Stadt, spielen). Their own explanations warn: «لا تضف حركة بين الصوامت» and «لا تقل إش-بيلن». They used the `palate` profile, so they showed Kirche/Kirsche and Licht/List ([ç]–[ʃ], [ç]–[s]). Neither pair is about clusters.

## Decision

1. **New profile `lipClosure`** (zone `lips`, «Lippenverschluss: [p], [b], [pf]») for a1-10 and a1-11.
   - packen [ˈpakn̩] vs backen [ˈbakn̩]: a strict minimal pair. The note teaches the aspiration cue (a sheet of paper in front of the mouth moves with packen).
   - Pfund [pfʊnt] vs Fund [fʊnt]: kept from the old profile.
2. **New profile `clusters`** (zone `ridge`, «Konsonanten ohne Zwischenvokal») for a1-06 and a1-16.
   - Stein [ʃtaɪ̯n] vs Schein [ʃaɪ̯n]: a strict minimal pair. The [t] must follow [ʃ] directly.
   - Platte [ˈplatə] vs Palette [paˈlɛtə]: a meaningful contrast. A short vowel inserted into the cluster produces a different word, which is exactly the confusion the inventory row describes.
3. **The `affricates` profile now serves only its [ts] lessons**, a1-05 and a1-21. Pfund/Fund moved to `lipClosure`, and its place is taken by Ziege [ˈtsiːɡə] vs Siege [ˈziːɡə], a strict [ts]–[z] minimal pair.
4. **Inventory rows updated.**
   - p-b now uses packen/backen, `diagramProfileId: "lipClosure"`, `interactivePairId: "pb-packen-backen"` and synthetic discrimination.
   - The consonant-cluster row now uses Platte/Palette, `diagramProfileId: "clusters"`, `interactivePairId: "cluster-platte-palette"` and synthetic discrimination.
   - pf-f now points at `lipClosure`.
   - Interactive rows go from 13/18 to **15/18**.
5. Every pair uses two different strings, so the synthetic voice really produces the difference. No sentence-level focus is simulated.

## Why the other three rows stay guided

- **r-variants:** the two sides are the same word, rot, in two accepted realisations ([ʁ] and [r]). Browser TTS has one realisation per voice, so it cannot honestly produce both.
- **Final devoicing:** it is linked to b1-11 and b2-18. Their focus is sentence prosody, and b2-18 mentions Ab-schluss [p] only in passing. Moving either lesson off `prosody` would hide what it really trains.
- **Sentence focus:** TTS reads an identical string the same way each time (ADR-125).

## Result

| Profile | Lessons |
| --- | --- |
| prosody | 55 (unchanged) |
| wordStress | 14 |
| rounded | 7 |
| lipTeeth | 4 |
| vowelLength | 3 |
| palate | 3 (was 5) |
| affricates | 2 (was 4) |
| lipClosure | 2 (new) |
| clusters | 2 (new) |
| onsetH | 2 |
| achLaut | 2 |

- Interactive inventory rows: 13/18 ⇒ **15/18**.

## Consequences

- No score, no mastery and no new learner state. The evidence boundary stays `synthetic-discrimination-only-no-pronunciation-or-mastery-score`, and attempts are keyed by lesson and pair as before.
- **P1-380 stays `partial`.** What is missing: the three guided rows, calibration on real Arabic-learner recordings, and an independent phonetics review (`authored-review-pending`).
