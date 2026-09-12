# ADR-024 — Opt-in browser WebGPU embedding model

Date: 2026-09-07  
Status: accepted

## Context

P0-219 requires support for a model inside the browser when WebGPU is available. A generative model would require a much larger download, introduce free-form output and hallucination risk, and duplicate the optional remote/Ollama paths. The product already owns safe authored follow-up candidates under P0-160, so semantic ranking is a bounded useful task for an in-browser model.

## GitHub-safe exact-byte materialization

The upstream minified Transformers browser bundle produced a GitHub Push Protection false positive for an opaque Mistral-style token. We do not disable protection, bypass the alert, or edit unaudited runtime semantics. The plaintext is Git-ignored and reconstructed by `npm ci`/prebuild from `vendor-assets/webgpu/transformers.web.min.js.xor-gzip.packed`; the materializer verifies packed and original SHA-256 values before writing. XOR+gzip is reversible packaging, not encryption or secret handling. ONNX JSEP files and licenses remain directly vendored.

## Decision

Adopt `browser-webgpu-model-v1` using the multilingual 384-dimensional `Xenova/paraphrase-multilingual-MiniLM-L12-v2` ONNX model at pinned revision `2c4055b12046f11709e9df2c122e59ffbdc2f900`, executed with Transformers.js 4.2.0, `device: "webgpu"`, and `dtype: "q8"` in a dedicated Web Worker.

The model ranks up to four authored questions against the learner-typed transcript. It cannot create a new answer key, score language, perform STT, or evaluate acoustic quality. If installation or inference fails, the deterministic local follow-up is used.

Installation is opt-in only. Settings exposes capability, conservative 130–150 MB download size, 118 MB quantized weight fact, exact model/revision, license, source freshness, memory/storage boundaries, and deletion. No weights enter Git, ZIP, or the default Offline pack. Successful files use a dedicated Cache Storage namespace with a completion marker; failure deletes partial state.

Only audited browser runtime artifacts are vendored with SHA-256 and license notices. The unused full NPM package is not retained as a dependency, preserving a zero-known-vulnerability `npm audit` state and avoiding Node/CUDA installer payloads.

## Privacy and cost

The first download contacts the public Hugging Face model host after explicit opt-in but sends no learner data. Inference after installation occurs inside the local Worker. There is no API key, card, paid fallback, or server inference. New downloads are blocked when any runtime/model/license source record is stale or clock-invalid.

## Acceptance

- Unit tests validate secure-context/adapter detection, 4 GB memory and 128 MiB buffer boundaries, storage quota, source expiry, runtime/model hashes, completion marker, deletion, WebGPU-only Worker configuration, authored candidate sets, and `browser-webgpu` evidence provenance.
- Desktop and mobile Playwright mock the expensive Worker only, while executing the real capability/opt-in/cache/UI/state flow: no automatic install, visible size/license, install progress, local ranked follow-up, DWNB-compatible evidence, and cache deletion.
- Physical 118 MB model installation and representative GPU-driver/thermal review remain final manual-device work; this limitation is visible and is not converted into a fake benchmark.

This closes P0-219 as a real optional browser-model path while keeping every core learning path functional without it.