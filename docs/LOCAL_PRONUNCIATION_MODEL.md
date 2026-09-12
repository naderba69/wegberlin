# Local German word-matching model

Last reviewed: 2026-09-11 — Africa/Tunis

## Purpose

`local-german-word-matching-v1` adds an optional, standard browser pack for short German speaking tasks. It converts a temporary local recording to a German transcript and compares the transcript with the authored target words. No recording is sent to Gemini, OpenRouter, Ollama, Vercel, or the application server.

## Pinned stack

- Runtime: audited local Transformers.js browser bundle `4.2.0`.
- Model: `onnx-community/whisper-tiny`.
- Revision: `ff4177021cc41f7db950912b73ea4fdf7d01d8e7`.
- Base: multilingual `openai/whisper-tiny`, including German.
- Task: automatic speech recognition with `language=german`, `task=transcribe`.
- Quantization: one standard `q8` pack.
- Execution: dedicated Web Worker with WebGPU.
- Audio: mono `Float32Array`, locally decoded and resampled to 16 kHz.
- Bound: 0.35–20 seconds per analysis.
- Cache: `dwnb-pronunciation-model-v1`.
- Conservative download display: about 70–90 MB; the browser reports actual origin delta when available.

The exact model files loaded by Transformers.js may vary with runtime graph selection, so the UI does not promise a byte-exact download before a physical install.

## Consent and network boundary

Installation requires an explicit checkbox and button. The install worker may download the pinned model files from Hugging Face and writes a complete metadata marker only after pipeline creation succeeds. A failed installation deletes the dedicated model cache. Later transcription loads with remote model access disabled and must use the complete local cache.

Low-data mode blocks a new installation. Source freshness blocks new installations when runtime, model, ONNX revision, or license verification is stale. The pack is not bundled into the base ZIP or curriculum Offline pack.

## Matching contract

Before ASR, `local-microphone-signal-check-v1` inspects only signal amplitude: silence, low level, and clipping. An unusable signal stops word recognition and asks for a new recording, preventing a device problem from being presented as a language error. Its temporary 48-bar waveform envelope stores no samples and does not identify background-noise source, speech, words, or pronunciation.

The result displays:

- the temporary local transcript;
- each unique expected German word as “heard” or “unconfirmed”;
- the factual count “heard X of Y expected words”;
- at most three learner-facing corrections;
- a replay action for each unconfirmed target;
- `local-word-repair-loop-v1`: listen, record the single word, play it back fully, recheck the signal, run one local match, then retry or return to the sentence.

German case and punctuation are ignored, and `ß`/`ss` are normalized for matching. Personal names and other extra transcript words are not treated as errors because only authored target words are evaluated.

## Claim boundary

Whisper ASR word recognition is not phoneme alignment. A missing word can result from pronunciation, microphone quality, noise, model error, or an unexpected but valid phrase. Therefore the product does not output:

- a pronunciation percentage;
- an accent or native-likeness score;
- a phoneme verdict;
- a fluency score;
- a CEFR or exam result.

The result is never mastery evidence and is not persisted in the learner record. The temporary recording is not persisted unless the learner separately presses the existing save button.

## Still required

- real installation and performance tests on representative phones and computers;
- Arabic/Tunisian learner recordings under multiple microphones/noise conditions;
- independent German phonetics review;
- calibrated phoneme-level forced alignment before any sound-specific automated correction;
- memory, thermal, crash, and offline reload evaluation;
- completion of the seven pronunciation pairs still pending in P1-380.

Automated Worker mocks prove the software lifecycle but do not prove acoustic accuracy or physical WebGPU performance.
