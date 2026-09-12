# ADR-021 — Shared educational listening speed policy

Date: 2026-09-05  
Status: accepted for automated implementation; human distortion review deferred to final whole-project review

## Context

P0-135 requires both natural and educational listening speeds without pretending that a browser rate switch has been acoustically validated. Shadowing already offered three rates, but onboarding/diagnostic audio, lesson listening, library listening, and guided exam listening did not share that control. Inconsistent rates also meant the MP3 and Browser TTS fallbacks could behave differently.

Learner-recording playback is evidence review, not authored listening input. Continuous timed exam rehearsal should preserve the normal-speed condition instead of allowing a learner to slow its audio.

## Decision

Adopt `learning-playback-speed-v1` with exactly three bounded rates:

```text
0.75×  educational slow
1×     natural source speed
1.15×  controlled faster challenge
```

The shared policy is used by five authored-listening surfaces:

1. resilient onboarding and diagnostic playback;
2. lesson listening;
3. listening-library playback;
4. guided targeted/full-simulation listening;
5. Shadowing model playback.

Rules:

- native HTML audio receives both `defaultPlaybackRate` and `playbackRate`;
- `preservesPitch=true` is requested explicitly;
- Browser SpeechSynthesis receives the same transparent numeric rate;
- ordered exam-audio segments inherit the selected rate across segment transitions;
- continuous timed exam rehearsal is locked at `1×` and explains why;
- learner speaking/diagnostic recordings remain untouched;
- play limits, transcripts, answer evidence, Offline delivery, and provider separation are unchanged.

## Automated acceptance

Unit tests verify the bounded rate set, invalid-rate rejection, pitch-preservation request, TTS mapping, continuous-mode lock, accessible pressed/disabled controls, and adoption by every authored listening consumer. Production Playwright verifies real `HTMLAudioElement.playbackRate` and `preservesPitch` behavior in onboarding/diagnostic, lesson, library, guided exam, and Shadowing routes on desktop and mobile.

## Consequences and boundary

The learner now gets one predictable speed UI across authored listening. The policy does not alter source files or claim that 0.75×/1.15× are perceptually distortion-free on every device, browser, codec path, or synthetic voice. `preservesPitch=true` is a browser request, not acoustic evidence.

P0-135 therefore remains partial until the final human listening round checks intelligibility, artifacts, numbers, names, and pitch/timing quality across representative physical devices and Browser TTS voices. The product owner explicitly deferred that real review to the final whole-project review.
