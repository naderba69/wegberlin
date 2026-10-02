# ADR-037 — Three-pass listening and articulation contrast practice

- Status: accepted
- Date: 2026-09-08 — Africa/Tunis
- Policies: `three-pass-listening-sequence-v1`, `articulation-contrast-practice-v1`
- Closes: P1-139, P1-150, P1-151

## Context

Every published lesson already had one generated MP3, a listening strategy, three authored questions, a transcript, and a pronunciation focus with IPA examples. The previous lesson surface showed the player, all questions, and a transcript toggle at once. It did not turn those resources into an explicit before/during/after listening process, and the transcript could be opened before the learner committed to the questions.

Pronunciation showed words and IPA but no visual articulation explanation or contrast challenge. The product must not pretend that Browser TTS is human exam audio or that selecting a word is an acoustic score of the learner's pronunciation.

## Decision

### 1. Three-pass listening sequence

`buildLessonListeningSequence` gives all 90 lessons the same bounded process while retaining each lesson's authored title, strategy, MP3, transcript, and questions:

1. `Vor dem Hören`: read the real title and select one German-first listening focus—people/roles, place/time, or core message/result. This is planning only and has no correct answer.
2. `Beim ersten Hören`: the player appears after the focus commitment. The first authored question appears only after MP3 or Browser TTS starts and acts as the gist commitment.
3. `Nach dem ersten Hören`: the remaining authored questions appear after the gist commitment and are used for detail checking on a second listen.

The German and Arabic transcript remains locked until every authored listening question has an attempt. Wrong commitments unlock the process just as correct commitments do; correctness continues to come only from the existing question attempts. The process cannot be gamed into mastery through focus or playback clicks.

Existing learners with a pre-policy listening attempt bypass the new focus/playback prerequisites, so old evidence is not stranded. They must still commit all current question IDs before transcript reveal.

### 2. Process evidence

`ListeningProcessEvent` records a deduplicated process event for focus, playback, gist commitment, or detail commitment under:

```text
listening-process-only-no-score-or-mastery
```

The event contains no answer, correctness, score, duration, transcript, or mastery field. Question answers remain in the existing `ExerciseAttempt` store. `PronunciationContrastAttempt` records only which hidden synthetic side was played and which side was selected under:

```text
synthetic-discrimination-only-no-pronunciation-or-mastery-score
```

Both arrays are strict Zod fields with old-state defaults, DWNB portability, deterministic merge, stable deduplication/upsert behavior, and a separate Settings deletion action. They never alter lesson completion, CEFR, exam readiness, or mastery.

### 3. Original inline articulation SVG

`PronunciationArticulationLab` renders an original inline SVG cross-section. It contains named layers for head/mouth outline, palate, teeth, tongue, lips, airflow, active-zone highlight, and an optional rhythm wave. `<title>` and `<desc>` provide accessible text. It has no external image, data URI, CDN, or copied anatomical plate.

A deterministic mapping assigns the lesson's authored pronunciation focus to one of at least six instructional profiles: onset breath, lip/teeth friction, affricate closure, palate friction, rounded front vowels, vowel length/space, or prosody. Each profile explains mouth/lips, tongue, and airflow in Arabic. The surface explicitly says it is a simplified learning diagram, not medical imaging and not analysis of a recording.

### 4. Minimal and meaningful contrasts

Each articulation profile owns two authored contrast cards. The registry distinguishes:

- `minimal-pair`
- `meaningful-sound-contrast`
- `meaningful-prosody-contrast`

Examples include `Kirche/Kirsche`, `Tür/Tour`, `vier/wir`, `Stadt/Staat`, and statement/question melody with the same words. The interface does not label every pair a strict minimal pair when more than one phonetic property differs.

A challenge plays one hidden side through German Browser TTS, asks the learner which visible word was heard, and allows replay. The persisted `correct` flag means only that the selected side matched the hidden synthetic target. It is not evidence that the learner pronounced the sound, and no microphone is opened.

### 5. Offline and audio boundary

The lesson MP3 remains the normal listening source and keeps `learning-playback-speed-v1` at 0.75×/1×/1.15×. Browser TTS is an optional synthetic fallback/stimulus whose availability and voice quality depend on the browser/device. No new remote API or model is required, and no network AI payload exists. The connected exam rehearsal remains fixed at 1× and is unchanged.

## Acceptance evidence

Automated tests verify:

- 85/85 lesson sequence contracts and ownership of the existing question IDs;
- focus → playback → gist → details → transcript locks;
- old-attempt compatibility and no-score process provenance;
- at least six articulation mappings and two meaningful contrasts per lesson focus;
- strict distinction between minimal, sound, and prosody contrasts;
- inline accessible SVG layers and absence of external images;
- synthetic-target correctness consistency, stable upsert, Zod, DWNB, merge, and no mastery change;
- Desktop and Mobile traversal of the actual A1 lesson sequence, transcript lock, SVG, TTS challenge, and IndexedDB evidence;
- responsive and axe coverage through the existing full browser matrix.

## Consequences and limits

- P1-139, P1-150, and P1-151 are closed as product/software workflows.
- The SVG is pedagogical and deliberately simplified; it is not a full phonetics atlas or clinical instruction.
- Browser TTS voices vary, may be unavailable offline on some devices, and are not human or exam-grade audio.
- Matching a hidden TTS word is listening discrimination evidence only. It cannot validate the learner's articulation, accent, stress, fluency, or CEFR level.
- No claim is made that automated Chromium tests replace a German phonetician, a human audio review, VoiceOver/NVDA/TalkBack, or physical-device listening tests. Those remain in the final manual review round.
