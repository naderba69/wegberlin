// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * خطة الأصوات (P0-6/P0-7): ثلاثة أصوات + مسار مُبطَّأ، بنفس وصفة الصوت المثبّتة في المشروع.
 * التوليد الفعلي يحتاج piper وملفات أصوات غير متاحة في بيئة البناء، لذلك يُثبَّت هنا العقد
 * نفسه: الأصوات، الوصفة، والحدّ الصريح بأن الملفات إنتاج آلي لا تسجيل متحدّث أصلي.
 */
describe("listening voice plan", () => {
  const source = readFileSync("scripts/materialize-listening-voices.mjs", "utf8");
  const plan = JSON.parse(readFileSync("reports/listening-voice-plan.json", "utf8")) as {
    voices: Array<{ id: string; model: string; rate: number; tier: string }>;
    lessons: number;
    filesIfRun: number;
    recipe: Record<string, unknown>;
    piperAvailable: boolean;
    missingModels: string[];
    boundary: string;
  };

  it("pins three distinct voices plus a slowed training track", () => {
    const models = [...new Set(plan.voices.map((voice) => voice.model))];
    expect(models.length).toBeGreaterThanOrEqual(3);
    expect(plan.voices.filter((voice) => voice.tier === "variety").length).toBeGreaterThanOrEqual(2);
    const slow = plan.voices.find((voice) => voice.rate < 1);
    expect(slow?.tier).toBe("training");
    expect(plan.voices).toHaveLength(4);
  });

  it("keeps the repository's pinned audio recipe", () => {
    expect(plan.recipe).toMatchObject({ sampleRate: 24000, channels: 1, mp3Bitrate: "32k", opusBitrate: "24k", sentenceSilence: "0.32", lengthScale: "1.05" });
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["audio:listening:materialize"]).toBe("node scripts/materialize-listening-voices.mjs");
  });

  it("plans both formats for every lesson and states it wrote nothing here", () => {
    expect(plan.lessons).toBe(96);
    expect(plan.filesIfRun).toBe(96 * plan.voices.length * 2);
    expect(plan.boundary).toBe("planning-only-no-audio-was-written-in-this-run");
    expect(plan.piperAvailable).toBe(false);
    expect(plan.missingModels.length).toBeGreaterThan(0);
  });

  it("fails loudly instead of pretending when the tools or voices are absent", () => {
    expect(source).toContain('${piper.ok ? "متاح" : "غير مثبّت"}');
    expect(source).toContain("أصوات ناقصة");
    expect(source).toContain("synthetic-tts-multiple-voices-not-native-speaker-recordings");
    expect(source).toContain("process.exit(1)");
    expect(source).toContain("--dry-run");
    expect(source).toContain("--check");
  });
});
