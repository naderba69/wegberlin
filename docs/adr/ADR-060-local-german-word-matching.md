# ADR-060 — Standard local German word matching before phoneme correction

Date: 2026-09-11 — Africa/Tunis

## Context

The learner requires the platform to act as the primary self-teacher and correct speech locally. The existing product could record, play back, estimate energy-based pauses, and present authored articulation contrasts, but it could not recognize spoken words. Calling those signals pronunciation correction would be false.

## Decision

Introduce one optional standard pack under `local-german-word-matching-v1`:

- multilingual Whisper tiny ASR, pinned to one ONNX revision;
- q8 weights and a dedicated WebGPU Worker;
- explicit one-time model download and dedicated Cache Storage;
- local audio decode, mono mixing, and 16 kHz resampling;
- German transcription for 0.35–20 second short tasks;
- `local-microphone-signal-check-v1` checks silence, low level, and clipping before ASR without diagnosing a noise source or pronunciation;
- a temporary waveform envelope that retains no audio;
- expected-word matching with `ß`/`ss` normalization;
- at most three corrections per recording;
- `local-word-repair-loop-v1` turns one unconfirmed word into listen → record → playback → signal check → local match → retry;
- no persistence of transcript/result and no audio upload;
- complete fallback to record/play/self-review when unavailable.

The installer is blocked by low-data mode, insufficient declared memory/storage/buffer limits, or stale runtime/model/license sources. Model inference after installation disables remote model loading.

## Evidence separation

A local ASR result does not change correctness, lesson completion, mastery, CEFR, or exam readiness. It is an immediate practice aid. The guided/independent speaking distinction from ADR-059 remains authoritative.

## Why not claim phoneme correction

ASR answers “which words did the model recognize?” It does not establish which phoneme was wrong. Microphone and model errors can produce the same unconfirmed word. Sound-specific automated correction requires a separately validated alignment/acoustic contract and real Arabic-learner recordings.

## Acceptance

- Settings exposes capability, exact pinned identity, estimated size, source deadline, consent, progress, installed state, and delete.
- A short speaking recording can be converted to 16 kHz and sent to the local Worker.
- The Worker transcribes in German from its cache without a network call at inference.
- Target matching ignores personal names and emits no score.
- Unusable signal blocks ASR so microphone level/clipping is not mislabeled as a pronunciation problem.
- The speaking UI labels heard/unconfirmed words and provides a complete one-word repair loop.
- Unit and mocked browser tests cover install, cache marker, deletion, signal classification, waveform envelope, transcription, matching, word repair, zero network inference, and claim boundaries.
- P1-380 and P0-255 remain partial pending independent phonetics and physical-device review.
