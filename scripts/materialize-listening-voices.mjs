#!/usr/bin/env node
/*
 * توليد صوت الاستماع بأصوات متعدّدة (البند P0-6/P0-7 من تدقيق الطريقة).
 *
 * الفجوة المقيسة: وسيط طول الاستماع 93 كلمة (~32 ثانية) وصوت اصطناعي واحد فقط
 * (de_DE-ramona-low). A2/B1 يتطلّبان فهم إعلانات ورسائل 60–120 ثانية، والاعتياد على صوت
 * واحد لا ينقل إلى الواقع. هذا السكربت يبني الملفات بأصوات بيبر الثلاثة المثبّتة بنفس
 * وصفة المشروع (24 kHz أحادي · MP3 32 kb/s · Opus 24 kb/s · --sentence-silence 0.32
 * --length-scale 1.05) ويضيف مسارًا ثالثًا بسرعة مُبطَّأة للتدريب.
 *
 * الاستعمال:
 *   npm run audio:listening:materialize -- --dry-run        (يعرض الخطة ويتحقّق من الأدوات)
 *   npm run audio:listening:materialize -- --only a2-05     (درس واحد)
 *   npm run audio:listening:materialize                     (الكل — يحتاج piper والأصوات)
 *   npm run audio:listening:materialize -- --check          (يتحقّق من وجود الملفات فقط)
 *
 * يتطلّب: python3 + piper-tts (pip install piper-tts) + ffmpeg، وملفات الأصوات:
 *   de_DE-ramona-low · de_DE-thorsten-medium · de_DE-eva_k-x_low
 * تنزيل الأصوات من https://huggingface.co/rhasspy/piper-voices (تُخزَّن في
 * $PIPER_VOICES_DIR أو ~/.local/share/piper-voices) — تنزيل واحد ثم يعمل كل شيء دون اتصال.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const AUDIO_DIR = join(ROOT, "public/audio/lessons");
const MANIFEST = join(ROOT, "public/audio/listening-voice-manifest.json");
const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => (args.indexOf(flag) >= 0 ? args[args.indexOf(flag) + 1] : undefined);
const dryRun = has("--dry-run");
const checkOnly = has("--check");
const only = valueOf("--only");

/** الأصوات المثبّتة: واحد ناطق فصيح مرجعي، واثنان لتنويع النبرة والطبقة. */
export const VOICES = [
  { id: "ramona-low", model: "de_DE-ramona-low", labelAr: "صوت مرجعي (كان الصوت الوحيد قبل اليوم)", rate: 1.0, tier: "base" },
  { id: "thorsten-medium", model: "de_DE-thorsten-medium", labelAr: "صوت رجالي أوسط", rate: 1.0, tier: "variety" },
  { id: "eva_k-x_low", model: "de_DE-eva_k-x_low", labelAr: "صوت نسائي مختلف الطبقة", rate: 1.0, tier: "variety" },
  { id: "ramona-slow", model: "de_DE-ramona-low", labelAr: "تدريب مُبطَّأ (0.85×)", rate: 0.85, tier: "training" },
];

const RECIPE = { sampleRate: 24000, channels: 1, mp3Bitrate: "32k", opusBitrate: "24k", sentenceSilence: "0.32", lengthScale: "1.05" };

const lessonIds = [
  ...Array.from({ length: 24 }, (_, i) => `a1-${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 24 }, (_, i) => `a2-${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 24 }, (_, i) => `b1-${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 24 }, (_, i) => `b2-${String(i + 1).padStart(2, "0")}`),
].filter((id) => (only ? id === only : true));

function voicesDir() {
  return process.env.PIPER_VOICES_DIR || join(process.env.HOME || "/root", ".local/share/piper-voices");
}

function voiceModelPath(model) {
  const [lang, name, quality] = model.split("-");
  return join(voicesDir(), lang, lang.split("_")[0], name, quality, `${model}.onnx`);
}

function tool(name, probe) {
  const result = spawnSync(name, probe, { encoding: "utf8" });
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n")[0] ?? "" };
}

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function fileBytes(path) {
  try {
    const info = await stat(path);
    return info.size;
  } catch {
    return 0;
  }
}

const piper = tool("piper", ["--version"]);
const ffmpeg = tool("ffmpeg", ["-version"]);
const missingModels = VOICES.map((voice) => voice.model).filter((model, index, all) => all.indexOf(model) === index).filter((model) => !existsSync(voiceModelPath(model)));

if (dryRun || checkOnly || !piper.ok || missingModels.length || !ffmpeg.ok) {
  const plan = lessonIds.map((id) => ({ id, files: VOICES.map((voice) => `${id}.${voice.id}.mp3`) }));
  const report = {
    format: "dwnb-listening-voice-plan",
    version: "listening-voice-plan-v1",
    recipe: RECIPE,
    voices: VOICES,
    lessons: lessonIds.length,
    filesIfRun: lessonIds.length * VOICES.length * 2,
    piperAvailable: piper.ok,
    ffmpegAvailable: ffmpeg.ok,
    voicesDir: voicesDir(),
    missingModels,
    plan: plan.slice(0, 5),
    boundary: "planning-only-no-audio-was-written-in-this-run",
  };
  await mkdir(join(ROOT, "reports"), { recursive: true });
  await writeFile(join(ROOT, "reports/listening-voice-plan.json"), `${JSON.stringify(report, null, 1)}\n`);
  if (checkOnly) {
    const present = [];
    for (const id of lessonIds) for (const voice of VOICES) {
      const target = join(AUDIO_DIR, `${id}.${voice.id}.mp3`);
      if (await fileBytes(target)) present.push(`${id}.${voice.id}`);
    }
    console.log(`فحص أصوات الاستماع: ${present.length}/${lessonIds.length * VOICES.length} ملفًا موجودًا.`);
    console.log("لم يُكتب شيء. للتوليد الكامل شغّل الأمر على جهاز فيه piper والأصوات.");
    process.exit(0);
  }
  console.log(`خطة أصوات الاستماع: ${lessonIds.length} درسًا × ${VOICES.length} أصوات × (MP3+Opus) = ${lessonIds.length * VOICES.length * 2} ملفًا.`);
  console.log(`piper: ${piper.ok ? "متاح" : "غير مثبّت"} · ffmpeg: ${ffmpeg.ok ? "متاح" : "غير مثبّت"} · مجلد الأصوات: ${voicesDir()}`);
  if (missingModels.length) console.log(`أصوات ناقصة: ${missingModels.join(" · ")}\nنزّلها مرة واحدة من https://huggingface.co/rhasspy/piper-voices إلى ${voicesDir()}.`);
  console.log("لم يُكتب أي ملف صوتي في هذه التشغيلة (وضع التخطيط). الخطة في reports/listening-voice-plan.json.");
  process.exit(0);
}

await mkdir(AUDIO_DIR, { recursive: true });
const entries = [];
for (const id of lessonIds) {
  const sourceFile = join(ROOT, "public/audio/lessons", `${id}.txt`);
  if (!existsSync(sourceFile)) {
    console.error(`لا يوجد نصّ مصدر للدرس ${id}: المتوقّع ${sourceFile} (صدّر transcripts أولًا: npm run audio:export-scripts).`);
    process.exit(1);
  }
  const text = (await readFile(sourceFile, "utf8")).trim();
  for (const voice of VOICES) {
    const base = `${id}.${voice.id}`;
    const wave = join(AUDIO_DIR, `${base}.wav`);
    const rate = (voice.rate * Number(RECIPE.lengthScale)).toFixed(3);
    const piperRun = spawnSync("piper", ["--model", voiceModelPath(voice.model), "--output_file", wave, "--sentence_silence", RECIPE.sentenceSilence, "--length_scale", rate], { input: `${text}\n`, encoding: "utf8" });
    if (piperRun.status !== 0) {
      console.error(`فشل piper للصوت ${voice.model} في الدرس ${id}: ${(piperRun.stderr ?? "").split("\n").slice(-2).join(" ")}`);
      process.exit(1);
    }
    const mp3 = join(AUDIO_DIR, `${base}.mp3`);
    const opus = join(AUDIO_DIR, `${base}.opus`);
    for (const [target, codec] of [[mp3, ["-codec:a", "libmp3lame", "-b:a", RECIPE.mp3Bitrate]], [opus, ["-codec:a", "libopus", "-b:a", RECIPE.opusBitrate]]]) {
      const ff = spawnSync("ffmpeg", ["-y", "-i", wave, "-ar", String(RECIPE.sampleRate), "-ac", String(RECIPE.channels), ...codec, target], { encoding: "utf8" });
      if (ff.status !== 0) {
        console.error(`فشل ffmpeg لـ${target}: ${(ff.stderr ?? "").split("\n").slice(-2).join(" ")}`);
        process.exit(1);
      }
    }
    const mp3Bytes = await fileBytes(mp3);
    entries.push({ lessonId: id, voiceId: voice.id, model: voice.model, rate: voice.rate, mp3Bytes, opusBytes: await fileBytes(opus), mp3Sha256: hash(await readFile(mp3)).slice(0, 16) });
    console.log(`${id} · ${voice.id} — ${(mp3Bytes / 1024).toFixed(0)} KB`);
  }
}
const manifest = {
  format: "dwnb-listening-voice-manifest",
  version: "listening-voice-manifest-v1",
  generatedAt: new Date().toISOString().slice(0, 10),
  recipe: RECIPE,
  voices: VOICES,
  entries,
  totalBytes: entries.reduce((sum, entry) => sum + entry.mp3Bytes + entry.opusBytes, 0),
  boundary: "synthetic-tts-multiple-voices-not-native-speaker-recordings",
};
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
console.log(`اكتمل: ${entries.length} زوجًا · ${(manifest.totalBytes / 1024 / 1024).toFixed(1)} MB → ${MANIFEST}`);
console.log("تحقّق من الميزانية: npm run media:budget");
