#!/usr/bin/env node
/*
 * يستضيف أوزان Whisper المحلية داخل التطبيق مرة واحدة (بديل Hugging Face وقت التشغيل).
 *
 * السبب: شبكات كثيرة (وحتى بعض وكلاء TLS) تحجب huggingface.co، فيفشل تنزيل حزمة
 * مطابقة الكلمات برسالة إنجليزية. هذا السكربت ينزّل نفس الملفات المثبّتة في
 * registry التطبيق إلى public/vendor/pronunciation بنفس شكل مسارات HF، ثم يكتب
 * manifest.json بالبصمات. عند وجوده يفضّله العامل تلقائيًا ولا يلمس الشبكة الخارجية.
 *
 * الاستعمال: npm run pronunciation:materialize      (يحتاج اتصالًا مرة واحدة)
 *            npm run pronunciation:materialize -- --check   (يتحقق بلا تنزيل)
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const REGISTRY = join(ROOT, "src/config/local-pronunciation-model-registry.ts");
const TARGET_ROOT = join(ROOT, "public/vendor/pronunciation");
const MANIFEST = join(TARGET_ROOT, "manifest.json");
const checkOnly = process.argv.includes("--check");

const registrySource = await readFile(REGISTRY, "utf8");
const modelId = /modelId:\s*"([^"]+)"/.exec(registrySource)?.[1];
const modelRevision = /modelRevision:\s*"([^"]+)"/.exec(registrySource)?.[1];
if (!modelId || !modelRevision) {
  console.error("تعذّر قراءة modelId/modelRevision من registry النطق.");
  process.exit(2);
}

const manifestPath = `${modelId}/resolve/${modelRevision}`;
const basePath = "/vendor/pronunciation";

// ملفات Whisper المطلوبة لتشغيل transformers.js بوضع q8 (whisper-tiny).
const files = [
  "config.json",
  "generation_config.json",
  "preprocessor_config.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "special_tokens_map.json",
  "normalizer.json",
  "onnx/encoder_model_quantized.onnx",
  "onnx/decoder_model_merged_quantized.onnx",
];

async function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

if (checkOnly) {
  if (!existsSync(MANIFEST)) {
    console.error("لا توجد نسخة مستضافة: المطلوب تشغيل npm run pronunciation:materialize مرة واحدة على جهاز متصل.");
    process.exit(1);
  }
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const missing = files.filter((file) => !manifest.files?.[file]);
  if (manifest.modelId !== modelId || manifest.modelRevision !== modelRevision || missing.length) {
    console.error(`نسخة الأوزان المستضافة غير مطابقة للـregistry أو ناقصة: ${missing.join(", ") || "بصمة/إصدار مختلف"}.`);
    process.exit(1);
  }
  console.log(`النسخة المستضافة جاهزة: ${Object.keys(manifest.files).length} ملفًا · ${(manifest.bytes / 1024 / 1024).toFixed(1)} MB · ${modelRevision.slice(0, 12)}`);
  process.exit(0);
}

const manifest = { format: "dwnb-pronunciation-vendor-manifest", version: 1, modelId, modelRevision, basePath, files: {}, bytes: 0, generatedAt: new Date().toISOString().slice(0, 10) };
for (const file of files) {
  const url = `https://huggingface.co/${manifestPath}/${file}`;
  let response;
  try {
    response = await fetch(url, { redirect: "follow" });
  } catch (error) {
    console.error(`تعذّر الوصول إلى ${url}\n${error instanceof Error ? error.message : error}`);
    console.error("إن كانت شبكتك تحجب huggingface.co فشغّل هذا الأمر من جهاز/شبكة تصل إليها، ثم انسخ مجلد public/vendor/pronunciation معك.");
    process.exit(1);
  }
  if (!response.ok) {
    console.error(`فشل تنزيل ${file}: HTTP ${response.status}`);
    process.exit(1);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const target = join(TARGET_ROOT, manifestPath, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
  manifest.files[file] = { sha256: await sha256(buffer), bytes: buffer.byteLength };
  manifest.bytes += buffer.byteLength;
  console.log(`نُزّل ${file} — ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
}
await mkdir(TARGET_ROOT, { recursive: true });
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`اكتملت الاستضافة: ${Object.keys(manifest.files).length} ملفًا · ${(manifest.bytes / 1024 / 1024).toFixed(1)} MB → public/vendor/pronunciation`);
