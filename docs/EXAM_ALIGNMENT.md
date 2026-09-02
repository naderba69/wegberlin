# B2 Exam Alignment Registry

Last verified: 2026-08-28

This registry documents only structure and scoring facts used by the application. All practice texts and answer keys in Der Weg nach Berlin are original. The project is not affiliated with, endorsed by, or an official product of Goethe-Institut or telc gGmbH.

## Goethe-Zertifikat B2

Specification stored in `src/data/exam-profiles.ts`.

Verified structure:

| Module | Parts | Duration | Scoring boundary represented in the app |
|---|---:|---:|---|
| Lesen | 5 | 65 min | max 100; pass boundary 60 |
| Hören | 4 | approx. 40 min | max 100; pass boundary 60 |
| Schreiben | 2 | 75 min | max 100; pass boundary 60 |
| Sprechen | 2 | approx. 15 min | max 100; pass boundary 60; 15 min preparation |

The four modules can be taken individually or together. The app must not apply the telc written/oral aggregate rule to Goethe.

Official sources:

1. Exam overview: https://goethe.de/ins/us/en/sta/sfr/prf/gzb2/wi9.html
2. Terms and Conditions for Exam Administration, updated 2025-09-01: https://www.goethe.de/pro/relaunch/prf/en/Durchfuehrungsbestimmungen_B2.pdf
3. Adult model set, 2025 edition: https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf

## telc Deutsch B2

Specification stored in `src/data/exam-profiles.ts`.

Verified structure:

| Subtest | Parts | Duration | Maximum points |
|---|---:|---:|---:|
| Leseverstehen | 3 | shared 90-minute block | 75 |
| Sprachbausteine | 2 | shared 90-minute block | 30 |
| Hörverstehen | 3 | approx. 20 min | 75 |
| Schriftlicher Ausdruck | 1 | 30 min | 45 |
| Mündlicher Ausdruck | 3 | approx. 15 min | 75 |

Reading and language elements share one 90-minute block; the durations are not additive. The oral pair exam has 20 minutes of preparation. The official mock currently linked from the telc page documents 225 written points and 75 oral points. Passing requires at least 135 written points and 45 oral points. The app must not apply Goethe's per-module 60/100 rule to telc.

Official sources:

1. Current exam overview: https://www.telc.net/en/language-examinations/certificate-exams/german/telc-german-b2/
2. Official mock ZIP currently linked by that page, revised 2019 edition: https://www.telc.net/fileadmin/user_upload/mock_exams/Deutsch/telc_deutsch_b2.zip

## Published original targeted simulations

| ID | Provider | Scope | Status |
|---|---|---|---|
| `goethe-b2-reading-01` | Goethe-Zertifikat B2 | Lesen Teil 1 matching of statements to four forum voices | Published |
| `goethe-b2-reading-02` | Goethe-Zertifikat B2 | Lesen Teil 2 sentence-gap matching with two distractors | Published |
| `goethe-b2-reading-03` | Goethe-Zertifikat B2 | Lesen Teil 3 article comprehension, six MCQs | Published |
| `goethe-b2-reading-04` | Goethe-Zertifikat B2 | Lesen Teil 4 opinion-to-heading matching | Published |
| `goethe-b2-listening-01` | Goethe-Zertifikat B2 | Hören Teil 1: five short texts and ten items | Published; Browser TTS only |
| `goethe-b2-listening-02` | Goethe-Zertifikat B2 | Hören Teil 2: interview played twice, six three-option items | Published; Browser TTS only |
| `goethe-b2-listening-03` | Goethe-Zertifikat B2 | Hören Teil 3: three-speaker attribution, played once | Published; Browser TTS only |
| `goethe-b2-listening-04` | Goethe-Zertifikat B2 | Hören Teil 4: lecture and eight MCQs, played twice | Published; Browser TTS only |
| `goethe-b2-writing-01` | Goethe-Zertifikat B2 | Schreiben Teil 1: original forum contribution | Published; deterministic/self review |
| `goethe-b2-writing-02` | Goethe-Zertifikat B2 | Schreiben Teil 2: formal professional message | Published; deterministic/self review |
| `goethe-b2-speaking-01` | Goethe-Zertifikat B2 | Sprechen Teil 1: choice of two four-minute presentation prompts | Published; local recording/self review |
| `goethe-b2-speaking-02` | Goethe-Zertifikat B2 | Sprechen Teil 2: controversial discussion contribution | Published; local recording/self review |
| `telc-b2-reading-01` | telc Deutsch B2 | Leseverstehen Teil 1 global heading matching | Published |
| `telc-b2-reading-02` | telc Deutsch B2 | Leseverstehen Teil 2 detailed comprehension, five MCQs | Published |
| `telc-b2-reading-03` | telc Deutsch B2 | Leseverstehen Teil 3: ten situations and twelve notices | Published |
| `telc-b2-language-01` | telc Deutsch B2 | Sprachbausteine Teil 1: ten three-option gaps | Published |
| `telc-b2-language-02` | telc Deutsch B2 | Sprachbausteine Teil 2: ten gaps, fifteen-option bank | Published |
| `telc-b2-listening-01` | telc Deutsch B2 | Hörverstehen Teil 1 global true/false items | Published; Browser TTS only |
| `telc-b2-listening-02` | telc Deutsch B2 | Hörverstehen Teil 2: long dialogue and ten true/false items | Published; Browser TTS only |
| `telc-b2-listening-03` | telc Deutsch B2 | Hörverstehen Teil 3: five short selective announcements | Published; Browser TTS only |
| `telc-b2-writing-01` | telc Deutsch B2 | Schriftlicher Ausdruck: choice of two original email prompts | Published; deterministic/self review |
| `telc-b2-speaking-01` | telc Deutsch B2 | Mündlicher Ausdruck Teil 1: seven experience topics, 90-second response | Published; local recording/self review |
| `telc-b2-speaking-02` | telc Deutsch B2 | Mündlicher Ausdruck Teil 2: source-based discussion contribution | Published; local recording/self review |
| `telc-b2-speaking-03` | telc Deutsch B2 | Mündlicher Ausdruck Teil 3: collaborative planning contribution | Published; local recording/self review |

These are targeted part simulations. Their in-app score is diagnostic practice evidence only and must never be displayed as an official examination result.

## Published original full simulations

| ID | Provider | Coverage | Session status |
|---|---|---|---|
| `goethe-b2-full-01` | Goethe-Zertifikat B2 | Lesen 1–5, Hören 1–4, Schreiben 1–2, Sprechen 1–2 | Guided module timers; locally resumable; non-official |
| `goethe-b2-full-02` | Goethe-Zertifikat B2 | Independent new Lesen 1–5, Hören 1–4, Schreiben 1–2, Sprechen 1–2 | Guided module timers; locally resumable; non-official |
| `goethe-b2-full-03` | Goethe-Zertifikat B2 | Third independent complete task bank | Guided module timers; locally resumable; non-official |
| `goethe-b2-full-04` | Goethe-Zertifikat B2 | Fourth independent complete task bank | Guided module timers; locally resumable; non-official |
| `goethe-b2-full-05` | Goethe-Zertifikat B2 | Fifth independent complete task bank | Guided module timers; locally resumable; non-official |
| `goethe-b2-full-06` | Goethe-Zertifikat B2 | Sixth independent complete task bank | Guided module timers; locally resumable; non-official |
| `telc-b2-full-01` | telc Deutsch B2 | Leseverstehen 1–3, Sprachbausteine 1–2, Hörverstehen 1–3, Schreiben, Sprechen 1–3 | Guided module timers; locally resumable; non-official |
| `telc-b2-full-02` | telc Deutsch B2 | Independent new reading, language elements, listening, writing, and speaking set | Guided module timers; locally resumable; non-official |
| `telc-b2-full-03` | telc Deutsch B2 | Third independent complete task bank | Guided module timers; locally resumable; non-official |
| `telc-b2-full-04` | telc Deutsch B2 | Fourth independent complete task bank | Guided module timers; locally resumable; non-official |
| `telc-b2-full-05` | telc Deutsch B2 | Fifth independent complete task bank | Guided module timers; locally resumable; non-official |
| `telc-b2-full-06` | telc Deutsch B2 | Sixth independent complete task bank | Guided module timers; locally resumable; non-official |

Both packages contain the complete authored task sequence for their stored provider profile. Browser TTS is not treated as exam-grade audio, individual recordings do not prove live partner interaction, and productive work is not assigned a fabricated official score. The current runner permits local resume between individually timed tasks; it is not an invigilated one-sitting environment.

## Re-verification rule

Before publishing a full simulation or changing scoring logic:

1. re-open the current official overview;
2. compare the current terms/model document with the stored version;
3. update `verifiedAt` and `specificationVersion`;
4. keep both provider test fixtures passing;
5. do not publish when an unresolved contradiction affects timing, task type, or scoring.
