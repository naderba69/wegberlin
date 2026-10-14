// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * عقد المصدر المحلي لأوزان Whisper: يُفضَّل ما هو مستضاف داخل التطبيق على أي طلب
 * خارجي، ويُترجم فشل الشبكة إلى رسالة عربية قابلة للتنفيذ بدل نص transformers.js.
 */
describe("local-first pronunciation model source", () => {
  const worker = readFileSync("public/pronunciation-model-worker.js", "utf8");
  const client = readFileSync("src/core/pronunciation/local-model.ts", "utf8");
  const control = readFileSync("src/components/local-pronunciation-model-control.tsx", "utf8");
  const materialize = readFileSync("scripts/materialize-pronunciation-model.mjs", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

  it("prefers the in-app vendor mirror and keeps Hugging Face as an explicit fallback", () => {
    expect(worker).toContain('const LOCAL_MIRROR_MANIFEST_PATH = "/vendor/pronunciation/manifest.json"');
    expect(worker).toContain("async function resolveModelSource(registry)");
    expect(worker).toContain("transformers.env.remoteHost = source.remoteHost");
    expect(worker).toContain('if (source.kind === "local-mirror") transformers.env.allowRemoteModels = true');
    expect(worker).toContain('resolvedSource = { kind: "huggingface"');
    expect(worker).toContain('source: resolvedSource?.kind ?? "huggingface"');
  });

  it("classifies loading failures and never forwards the raw English message", () => {
    expect(worker).toContain("MODEL_SOURCE_UNREACHABLE");
    expect(worker).toContain("function classifyLoadError(error)");
    expect(client).toContain("LOCAL_PRONUNCIATION_ERROR_GUIDANCE");
    expect(client).toContain("pronunciation:materialize");
    expect(control).toContain("describeLocalPronunciationError(error)");
    expect(control).not.toContain("setMessage(error instanceof Error?error.message:");
  });

  it("ships a one-time materialize command with a check mode", () => {
    expect(packageJson.scripts["pronunciation:materialize"]).toBe("node scripts/materialize-pronunciation-model.mjs");
    expect(materialize).toContain("/vendor/pronunciation");
    expect(materialize).toContain("onnx/encoder_model_quantized.onnx");
    expect(materialize).toContain("--check");
  });

  it("labels the effective source in the settings card", () => {
    expect(control).toContain('metadata?.source==="local-mirror"');
    expect(control).toContain("مستضافة داخل التطبيق");
  });
});
