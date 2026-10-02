import { webGPUModelRegistry } from "./webgpu-model-registry";

export const LOCAL_PRONUNCIATION_MODEL_POLICY = "local-german-word-matching-v1" as const;
export const LOCAL_PRONUNCIATION_MODEL_CACHE = "dwnb-pronunciation-model-v1" as const;
export const LOCAL_PRONUNCIATION_MODEL_META_PATH = "/__dwnb_pronunciation_model_meta__" as const;

export const localPronunciationModelRegistry = {
  policyVersion: LOCAL_PRONUNCIATION_MODEL_POLICY,
  task: "automatic-speech-recognition",
  purpose: "local-german-expected-word-matching",
  modelId: "onnx-community/whisper-tiny",
  modelRevision: "ff4177021cc41f7db950912b73ea4fdf7d01d8e7",
  dtype: "q8",
  language: "german",
  taskMode: "transcribe",
  sampleRateHz: 16_000,
  minimumAudioSeconds: 0.35,
  maximumAudioSeconds: 20,
  maximumFeedbackItems: 3,
  modelLicense: "Apache-2.0",
  estimatedDownloadBytes: 90_000_000,
  minimumDeviceMemoryGB: 4,
  minimumMaxBufferBytes: 134_217_728,
  evaluationBoundary: "asr-expected-word-match-no-phoneme-accent-fluency-or-official-pronunciation-score",
  sourceIds: [
    "transformers-js-runtime-4-2-0",
    "transformers-js-webgpu-guide-2026-09",
    "whisper-tiny-base-license-2026-09",
    "whisper-tiny-onnx-web-2026-09",
  ],
  runtime: {
    ...webGPUModelRegistry.runtime,
    workerPath: "/pronunciation-model-worker.js",
  },
} as const;

export const LOCAL_PRONUNCIATION_RUNTIME_ASSETS = [
  localPronunciationModelRegistry.runtime.workerPath,
  localPronunciationModelRegistry.runtime.browserBundlePath,
  localPronunciationModelRegistry.runtime.wasmModulePath,
  localPronunciationModelRegistry.runtime.wasmBinaryPath,
] as const;
