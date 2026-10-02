# Optional in-browser WebGPU model

Last reviewed: 2026-10-02
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

Chromium 153 reproduced the reported failure in a native module import: Transformers.js 4.2.0 left the bare ESM imports `onnxruntime-common` and `onnxruntime-web/webgpu` in its browser file. A browser Worker does not resolve npm package names without a bundler/import map, so module loading failed before pipeline initialization.

The pinned materializer now performs only two counted import-path rewrites, sending both imports to the same local `ort.webgpu.bundle.min.mjs` module. Using one module URL also keeps Transformers' `Tensor` constructor and the ONNX WebGPU backend on the same runtime export. The upstream Transformers bytes remain independently SHA-256-pinned; the transformed browser output has its own expected hash. No model, inference, `device: "webgpu"`, privacy, or fallback behavior is rewritten.

```text
Transformers.js 4.2.0 upstream source SHA-256
0a96dcf4c48981b7d05f53827e6975ec239132606ad0d526bbc2db0fcdbc4ded

public/vendor/webgpu/transformers.web.min.js (generated, Git-ignored)
SHA-256 2c570c9d88af5d8f269fbcece6c274e82b0470e3b0e519c5d4ad69a75598f9d2

onnxruntime-web@1.26.0-dev.20260416-b7804b056c
package tarball SHA-512 integrity is pinned in vendor-assets/webgpu/manifest.json
public/vendor/webgpu/ort.webgpu.bundle.min.mjs (generated, Git-ignored)
SHA-256 2ec70f685749470635e64dd142c2510dc13b37bb593d9cd6ab4f8923e5204479

public/vendor/webgpu/ort-wasm-simd-threaded.jsep.mjs
SHA-256 522b3769929f5684c83a12cf1e06eedf073b65d161728b4f3757c75d62b14384

public/vendor/webgpu/ort-wasm-simd-threaded.jsep.wasm
SHA-256 ae61141f8fbf0a4e43fd7b4f4d40a1a115627f6facc4f33ddf84074a655e33ea
```

The ORT browser bundle is additionally traced to the exact npm tarball using its package version, npm integrity value, and source SHA-256; its package license and the Transformers Apache license remain beside the runtime. The WASM JSEP files remain separately pinned as ONNX runtime support files; they are not a silent switch to `device: "wasm"`. Both new plaintext bundles are generated during `npm ci` (`prepare`) and prebuild from GitHub-safe packed payloads. The materializer checks packed bytes, original upstream bytes, exact rewrite occurrence counts, and final browser hashes before writing. Packing is reversible transport encoding, not encryption or secret storage. No full NPM package is added as a dependency.

A Chromium regression test imports both modules from a same-origin module Worker and constructs a small ONNX `Tensor` without downloading model weights or contacting Hugging Face. Real WebGPU model initialization and device performance remain separate physical-device checks.

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

Both model registries own five 30-day source records:

- Transformers.js 4.2.0 package/version/license;
- the exact ONNX Runtime WebGPU package version, ESM export, and MIT license;
- official Transformers.js WebGPU guidance;
- the selected base model card/language/license;
- its pinned ONNX revision and quantized-file size.

A stale or clock-invalid record blocks a new model download. Existing deterministic learning remains available. HTTP success alone does not authorize advancing review dates.

## Verification boundary

Unit tests verify capability decisions, storage/memory boundaries, source expiry, registry pins, vendor hashes/licenses, cache completion/deletion, authored-candidate ranking contracts, and Worker WebGPU-only configuration. A separate desktop/mobile Playwright test loads the actual generated Transformers and ORT modules inside a same-origin native module Worker, verifies the pinned runtime version and `Tensor` API, and makes no model-host request. The broader UI flow still mocks only expensive inference: it verifies opt-in, zero automatic weight download, progress/installed state, use inside the Speaking Lab, provenance, and deletion. The 118 MB weights are intentionally not downloaded in CI.

Real installation speed, GPU-driver compatibility, thermals, memory pressure, and browser cache eviction still require representative physical-device testing in the final whole-project manual review.
## Separate Whisper word-matching pack

ADR-060 adds `local-german-word-matching-v1` as a separate model, Worker, and Cache. It reuses the same audited Transformers.js/ONNX runtime assets but does not share MiniLM weights or metadata. Deleting `dwnb-pronunciation-model-v1` does not delete `dwnb-webgpu-model-v1`, and neither result is a CEFR or pronunciation score. See `docs/LOCAL_PRONUNCIATION_MODEL.md`.
