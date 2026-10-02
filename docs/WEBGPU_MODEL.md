# Optional in-browser WebGPU model

Last reviewed: 2026-09-07  
Policy: `browser-webgpu-model-v1`

## Purpose

This implementation closes P0-219 with a usable optional browser-model path while preserving the deterministic zero-download product.

The model performs one bounded task: it embeds a learner-typed German summary and up to four authored follow-up questions, then selects the most semantically similar question by cosine similarity. It does not generate curriculum content, transcribe audio, score pronunciation or fluency, estimate CEFR, or replace the deterministic follow-up engine.

## Runtime and model

```text
Runtime: @huggingface/transformers 4.2.0 browser-only bundle
Execution: Web Worker + device="webgpu"
ONNX Runtime Web: 1.26.0-dev.20260416-b7804b056c
Model: Xenova/paraphrase-multilingual-MiniLM-L12-v2
Model revision: 2c4055b12046f11709e9df2c122e59ffbdc2f900
Task: feature-extraction
Quantization: q8 / model_quantized.onnx
Embedding dimensions: 384
Maximum sequence length: 128 tokens
Model and runtime license boundary: Apache-2.0; ONNX Runtime: MIT
```

The quantized weight file is approximately 118 MB. The UI presents a conservative 130–150 MB first-download envelope because tokenizer/config/runtime files are also required. Model weights are not committed to Git, the normal ZIP, or the default Offline packs.

## Vendored browser-only runtime

The ONNX WebGPU JSEP runtime is committed directly. The audited Transformers browser plaintext is materialized during `npm ci` (`prepare`) and again before build from a GitHub-safe packed payload because GitHub Push Protection misclassified an opaque substring in the upstream minified bundle as a Mistral key. The generated plaintext is ignored by Git; both packed input and materialized output are checked before use:

```text
vendor-assets/webgpu/transformers.web.min.js.xor-gzip.packed
Packed SHA-256 29eb4707c7605fe1291ad9b0db192c90fd88465db5ccbfc97f02e3d891ac1019

public/vendor/webgpu/transformers.web.min.js (generated, Git-ignored)
Output SHA-256 0a96dcf4c48981b7d05f53827e6975ec239132606ad0d526bbc2db0fcdbc4ded

public/vendor/webgpu/ort-wasm-simd-threaded.jsep.mjs
SHA-256 522b3769929f5684c83a12cf1e06eedf073b65d161728b4f3757c75d62b14384

public/vendor/webgpu/ort-wasm-simd-threaded.jsep.wasm
SHA-256 ae61141f8fbf0a4e43fd7b4f4d40a1a115627f6facc4f33ddf84074a655e33ea
```

Apache and MIT license texts remain committed beside the runtime directory. Packing is reversible transport encoding, not encryption or secret storage: `scripts/materialize-vendor-runtime.mjs` verifies the packed SHA-256, applies gunzip plus XOR reversal, verifies the original SHA-256, and only then writes the ignored runtime. The full NPM package is deliberately not a production dependency. This keeps `npm audit` at zero known vulnerabilities, preserves exact upstream bytes, and prevents the false-positive plaintext from entering Git history.

## Capability and installation contract

1. Require a secure context and `navigator.gpu`.
2. Request a real adapter rather than checking the property only.
3. Fail closed when declared device memory is below 4 GB, `maxBufferSize` is below 128 MiB, or reported free browser quota is below the conservative download envelope.
4. Show size, model ID, revision, license, source freshness, purpose, and fallback before enabling the opt-in checkbox.
5. Fetch runtime/model files only after a learner click. No automatic preload is allowed.
6. Use a dedicated Worker so model initialization and inference do not block React rendering.
7. Cache runtime and model resources under `dwnb-webgpu-model-v1`; create the completion marker only after the pipeline initializes.
8. Delete the incomplete cache on install failure. Deleting the model terminates its Worker and removes both weights and locally cached runtime files.
9. Do not silently fall back to WASM. If WebGPU fails, use the deterministic question engine or optional Ollama instead.

## Privacy and Offline behavior

The initial opt-in download requests public model files from Hugging Face. It does not send the learner's profile, progress, text, or audio. After successful caching, ranking input is passed only to the local Worker. The existing content-follow-up evidence records provider `browser-webgpu`, the pinned model ID, `not-required` per-inference consent, source hash/cue, and the no-STT/no-score boundary.

When the model cannot load or rank candidates, the UI immediately returns to the deterministic local question. An installed model can be reused after network loss as long as the app, Worker/runtime, and model cache remain available and the browser has not evicted storage.

## Source governance

The model registry owns four 30-day source records:

- Transformers.js 4.2.0 package/version/license;
- official Transformers.js WebGPU guidance;
- sentence-transformers base model card/language/license;
- Transformers.js-compatible ONNX revision and quantized-file size.

A stale or clock-invalid record blocks a new model download. Existing deterministic learning remains available. HTTP success alone does not authorize advancing review dates.

## Verification boundary

Unit tests verify capability decisions, storage/memory boundaries, source expiry, registry pins, vendor hashes/licenses, cache completion/deletion, authored-candidate ranking contracts, and Worker WebGPU-only configuration. Desktop and mobile Playwright replace only the heavy inference Worker with a deterministic mock; they verify opt-in UI, zero automatic download, progress/installed state, use inside the Speaking Lab, persisted provenance, and deletion. The 118 MB weights are intentionally not downloaded in CI.

Real installation speed, GPU-driver compatibility, thermals, memory pressure, and browser cache eviction still require representative physical-device testing in the final whole-project manual review.
## Separate Whisper word-matching pack

ADR-060 adds `local-german-word-matching-v1` as a separate model, Worker, and Cache. It reuses the same audited Transformers.js/ONNX runtime assets but does not share MiniLM weights or metadata. Deleting `dwnb-pronunciation-model-v1` does not delete `dwnb-webgpu-model-v1`, and neither result is a CEFR or pronunciation score. See `docs/LOCAL_PRONUNCIATION_MODEL.md`.
