# ADR-102 — Resolve pinned WebGPU ESM dependencies inside native browser Workers

Date: 2026-10-02 — Africa/Tunis
Status: accepted for runtime compatibility; physical-device inference remains unverified.

## Context

After the optional Whisper word-matching pack was installed, Chromium reported:

```text
Failed to resolve module specifier "onnxruntime-web/webgpu".
Relative references must start with either "/", "./", or "../".
```

The Transformers.js 4.2.0 browser bundle is loaded with native ESM from a module Worker, not through a package-aware bundler. Inspection found two bare static imports in that exact upstream file: `onnxruntime-common` (for `Tensor`) and `onnxruntime-web/webgpu` (for the WebGPU backend). The ORT `./webgpu` export for the registry-pinned `onnxruntime-web@1.26.0-dev.20260416-b7804b056c` includes a browser ESM bundle that exports `Tensor` and does not require a second external package specifier at module-import time.

## Decision

Keep the upstream Transformers payload and the ORT package file pinned separately. During `npm ci`/prebuild, `scripts/materialize-vendor-runtime.mjs`:

1. verifies the GitHub-safe packed payload and original upstream Transformers SHA-256;
2. requires exactly one occurrence of each of the two recorded bare imports;
3. rewrites both to the same same-origin path, `/vendor/webgpu/ort.webgpu.bundle.min.mjs`, so the imported `Tensor` and WebGPU backend share one module instance;
4. verifies the resulting browser bundle's expected byte length and SHA-256 before writing it;
5. independently verifies and materializes the ORT bundle from its packed payload, exact npm tarball integrity, and source SHA-256.

The ORT module remains a small generated browser asset, not a production npm dependency. Existing pinned ORT JSEP `.mjs` and `.wasm` support files remain. This fix does not change the model, revisions, weight download consent, worker boundary, `device: "webgpu"`, or offline/remote inference policy; it does not add a network fallback or change to `device: "wasm"`.

## Verification

- Unit tests validate both packed/source/final hashes, npm provenance, exact rewrite counts, licenses, asset-cache registration, and the no-WASM-device-fallback Worker contract.
- Playwright imports the actual generated Transformers and ORT ESM files from a same-origin **native module Worker**, checks the pinned ORT version and `Tensor` construction, and asserts that no Hugging Face model host is contacted. It downloads no model weights and does not claim that a GPU inference session has run.
- The import failure was reproduced before the fix in Chromium 153.0.8010.0. After materialization, the browser Worker imports both modules, reports the pinned ORT version, constructs a tensor, and makes zero external model-host requests.

Actual Whisper/MiniLM model inference, hardware-adapter support, driver compatibility, memory/thermal behavior, and offline inference after a physical install remain separate manual-device work. The runtime import test is not model-quality evidence or WebGPU-inference certification.
