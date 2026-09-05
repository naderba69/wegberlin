import { describe, expect, it } from "vitest";
import { diagnosticSampleTasks } from "@/data/diagnostic";
import {
  canSaveSpeakingSample,
  canSaveWritingSample,
  countWords,
  latestSample,
  sampleTaskFor,
  summarizeDiagnosticSamples,
  withSample,
  withoutSample,
} from "@/core/diagnostic/samples";
import { learningStateSchema } from "@/core/portability/schema";
import { defaultState } from "@/core/portability/db";
import type { CEFRLevel, DiagnosticSample } from "@/types/learning";

const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
const sample = (overrides: Partial<DiagnosticSample>): DiagnosticSample => ({
  id: "sample-1",
  kind: "writing",
  level: "A1",
  promptDe: "Schreiben Sie drei Sätze.",
  promptAr: "اكتب ثلاث جمل.",
  createdAt: "2026-09-05T10:00:00.000Z",
  ...overrides,
});

describe("P0-26: independent productive sample after the diagnostic", () => {
  it("authors one short writing task and one short speaking task per level", () => {
    for (const level of levels) {
      const writing = diagnosticSampleTasks[level].writing;
      const speaking = diagnosticSampleTasks[level].speaking;
      expect(writing.promptDe.length, level).toBeGreaterThan(20);
      expect(writing.promptAr.length, level).toBeGreaterThan(10);
      expect(writing.hintAr.length, level).toBeGreaterThan(10);
      expect(writing.minimum, level).toBeGreaterThan(0);
      expect(writing.target, level).toBeGreaterThan(writing.minimum);
      expect(speaking.promptDe.length, level).toBeGreaterThan(20);
      expect(speaking.promptAr.length, level).toBeGreaterThan(10);
      expect(speaking.minimum, level).toBeGreaterThan(0);
      expect(speaking.target, level).toBeGreaterThan(speaking.minimum);
      // المهمة «قصيرة»: الهدف الشفهي لا يتجاوز دقيقة، والكتابي لا يتجاوز 80 كلمة.
      expect(speaking.target, level).toBeLessThanOrEqual(60);
      expect(writing.target, level).toBeLessThanOrEqual(80);
      expect(sampleTaskFor(level, "writing"), level).toBe(writing);
      expect(sampleTaskFor(level, "speaking"), level).toBe(speaking);
    }
  });

  it("gates saving on completeness, never on quality or score", () => {
    expect(countWords("  ich   heiße   Mila  ")).toBe(3);
    // الحد الأدنى شرط اكتمال: نص قصير يُرفض، ونص أطول يُقبل مهما كانت جودته.
    expect(canSaveWritingSample("Ich heiße Mila.", "A1")).toBe(false);
    const minimum = diagnosticSampleTasks.A1.writing.minimum;
    expect(canSaveWritingSample(Array.from({ length: minimum }, () => "Wort").join(" "), "A1")).toBe(true);
    // لا درجة في أي مكان: نص مليء بالأخطاء يُقبل كاملاً عند بلوغ الحد الأدنى.
    expect(canSaveWritingSample(
      "ich habe gestern ein apfel gegessen und bin nach hause gehen danach habe ich mit mein freund gesprochen uber die wetter und wir sind ins park spazieren gegangen",
      "A2",
    )).toBe(true);
    expect(canSaveSpeakingSample(diagnosticSampleTasks.B2.speaking.minimum - 1, "B2")).toBe(false);
    expect(canSaveSpeakingSample(diagnosticSampleTasks.B2.speaking.minimum, "B2")).toBe(true);
  });

  it("keeps one reference sample per kind and deletes it on request", () => {
    const first = sample({ id: "a", createdAt: "2026-09-01T10:00:00.000Z", text: "erste", wordCount: 1 });
    const second = sample({ id: "b", createdAt: "2026-09-05T10:00:00.000Z", text: "zweite", wordCount: 1 });
    const merged = withSample(withSample([], first), second);
    // الاستبدال لا التراكم: المرجع هو آخر أثر إنتاجي من كل نوع.
    expect(merged).toHaveLength(1);
    expect(latestSample(merged, "writing")?.id).toBe("b");
    const speaking = sample({ id: "c", kind: "speaking", mediaId: "media-1", durationSeconds: 30, createdAt: "2026-09-05T11:00:00.000Z" });
    const both = withSample(merged, speaking);
    expect(both).toHaveLength(2);
    const summary = summarizeDiagnosticSamples(both);
    expect(summary).toMatchObject({ total: 2, writingCount: 1, speakingCount: 1, lastSavedAt: "2026-09-05T11:00:00.000Z" });
    expect(summary.latestSpeaking?.mediaId).toBe("media-1");
    expect(withoutSample(both, "b").map((item) => item.id)).toEqual(["c"]);
    expect(summarizeDiagnosticSamples([]).lastSavedAt).toBeNull();
  });

  it("carries samples through the portability schema with no score field", () => {
    expect(defaultState.diagnosticSamples).toEqual([]);
    const parsed = learningStateSchema.parse({
      ...defaultState,
      diagnosticSamples: [sample({ mediaId: "media-1", durationSeconds: 20 })],
    });
    expect(parsed.diagnosticSamples).toHaveLength(1);
    // لا درجة ولا مستوى مشتقًا: الحقول المسموحة محددة، وأي حقل تقييم يُرفض.
    expect(learningStateSchema.safeParse({
      ...defaultState,
      diagnosticSamples: [sample({ score: 80 } as Partial<DiagnosticSample>)],
    }).success).toBe(false);
    expect(learningStateSchema.safeParse({
      ...defaultState,
      diagnosticSamples: [sample({ kind: "speaking", mediaId: "m", durationSeconds: 20 })],
    }).success).toBe(true);
  });
});
