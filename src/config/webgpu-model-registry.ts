export const WEBGPU_MODEL_POLICY_VERSION = "browser-webgpu-model-v1" as const;
export const WEBGPU_MODEL_CACHE = "dwnb-webgpu-model-v1" as const;
export const WEBGPU_MODEL_META_PATH = "/__dwnb_webgpu_model_meta__" as const;

export const webGPUModelRegistry = {
  policyVersion: WEBGPU_MODEL_POLICY_VERSION,
  task: "feature-extraction",
  purpose: "rank-content-grounded-follow-up-candidates",
  modelId: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
  modelRevision: "2c4055b12046f11709e9df2c122e59ffbdc2f900",
  dtype: "q8",
  modelLicense: "Apache-2.0",
  outputDimensions: 384,
  maxSequenceTokens: 128,
  quantizedWeightBytes: 118_000_000,
  estimatedDownloadBytes: 152_043_520,
  minimumDeviceMemoryGB: 4,
  minimumMaxBufferBytes: 134_217_728,
  sourceIds: [
    "transformers-js-runtime-4-2-0",
    "onnxruntime-web-webgpu-1-26-dev-20260416",
    "transformers-js-webgpu-guide-2026-09",
    "multilingual-minilm-base-license-2026-09",
    "multilingual-minilm-onnx-web-2026-09",
  ],
  runtime: {
    library: "@huggingface/transformers",
    version: "4.2.0",
    license: "Apache-2.0",
    browserBundlePath: "/vendor/webgpu/transformers.web.min.js",
    browserBundleSha256: "2c570c9d88af5d8f269fbcece6c274e82b0470e3b0e519c5d4ad69a75598f9d2",
    browserBundleSourceSha256: "0a96dcf4c48981b7d05f53827e6975ec239132606ad0d526bbc2db0fcdbc4ded",
    onnxRuntimeVersion: "1.26.0-dev.20260416-b7804b056c",
    onnxRuntimeLicense: "MIT",
    onnxRuntimeBundlePath: "/vendor/webgpu/ort.webgpu.bundle.min.mjs",
    onnxRuntimeBundleSha256: "2ec70f685749470635e64dd142c2510dc13b37bb593d9cd6ab4f8923e5204479",
    wasmModulePath: "/vendor/webgpu/ort-wasm-simd-threaded.jsep.mjs",
    wasmModuleSha256: "522b3769929f5684c83a12cf1e06eedf073b65d161728b4f3757c75d62b14384",
    wasmBinaryPath: "/vendor/webgpu/ort-wasm-simd-threaded.jsep.wasm",
    wasmBinarySha256: "ae61141f8fbf0a4e43fd7b4f4d40a1a115627f6facc4f33ddf84074a655e33ea",
  },
} as const;

export const WEBGPU_RUNTIME_ASSET_PATHS = [
  "/webgpu-model-worker.js",
  webGPUModelRegistry.runtime.browserBundlePath,
  webGPUModelRegistry.runtime.onnxRuntimeBundlePath,
  webGPUModelRegistry.runtime.wasmModulePath,
  webGPUModelRegistry.runtime.wasmBinaryPath,
] as const;
