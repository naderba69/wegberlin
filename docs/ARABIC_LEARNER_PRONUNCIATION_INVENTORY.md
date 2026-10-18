# Arabic-learner pronunciation support inventory

Policy: `arabic-learner-pronunciation-inventory-v1`

The inventory contains eighteen possible training contrasts across consonants, vowels, consonant clusters, word stress, sentence focus, and statement/question intonation. `notUniversal:true` is mandatory: the records are teaching possibilities, never a diagnosis of all Arabic speakers.

Every row maps to at least one published lesson, an articulation diagram profile, owner/reviewer roles, and either synthetic discrimination or guided self-observation. Fifteen rows currently map to exact interactive Browser-TTS pairs; three remain guided only (r-variants, final devoicing, sentence focus), because Browser TTS cannot honestly produce them in a lesson that trains them. Since ADR-129 (v237), p-b (packen/backen) and the consonant cluster (Platte/Palette) are interactive through the new `lipClosure` profile ([pf] lessons a1-10/a1-11) and `clusters` profile ([ʃp]/[ʃt] lessons a1-06/a1-16). Since ADR-125 (v233) every row links to lessons that actually teach its sound, every interactive row links to at least one lesson whose articulation lab shows that pair, and each lesson's lab profile comes from an authored map (`authored-articulation-profile-per-lesson-v1`) instead of a keyword heuristic. Browser TTS is synthetic and not exam-grade.

Current automated coverage:

- inventory: 18/18;
- lesson references: 18/18;
- articulation diagram mapping: 18/18;
- exact interactive synthetic pairs: 15/18;
- independent phonetics reviews: 0/18;
- pronunciation or fluency scores: 0.

ADR-060 adds optional local German STT for expected-word matching only. The app still does not perform phoneme recognition, acoustic alignment, accent scoring, fluency scoring, or learner-pronunciation scoring. P1-380 remains partial until the three remaining guided rows are addressed (they need recordings or a lesson that really trains them), Arabic-learner recordings, and independent phonetics review are complete.
