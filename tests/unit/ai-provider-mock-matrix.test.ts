// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  askSpeakingFollowUp,
  askTutor,
  askTutorFollowUpCommand,
  buildTutorCommandPayload,
  TUTOR_FOLLOW_UP_COMMAND_POLICY,
  TUTOR_FOLLOW_UP_LOCAL_MODEL,
  type AIConfig,
  type TutorCommandSource,
  type TutorContext,
} from "@/core/ai/client";
import { WEBGPU_MODEL_CACHE, WEBGPU_MODEL_META_PATH, webGPUModelRegistry } from "@/config/webgpu-model-registry";
import { generateLocalContentFollowUp } from "@/core/speaking/content-follow-up";
import { rankFollowUpCandidatesWithWebGPU, resetWebGPUWorkerForTests } from "@/core/ai/webgpu-model";
import { learningStateSchema } from "@/core/portability/schema";
import { defaultState } from "@/core/portability/db";

const tutorPayload = {
  hintAr: "راقب موضع الفعل.",
  explanationAr: "ينتقل الفعل المصرف إلى النهاية في الجملة التابعة.",
  examplesDe: ["Ich bleibe, weil ich krank bin."],
  microExerciseAr: "كوّن جملة جديدة دون نسخ المثال.",
};
const commandPayload = {
  hintAr: "فكرة واحدة: راقب النهاية.",
  explanationAr: "ببساطة، يأتي الفعل المصرف في نهاية الجملة التابعة.",
  examplesDe: ["Nora lernt, weil sie morgen arbeitet."],
  microExerciseAr: "حدد الفعل في المثال الجديد فقط.",
};
const speakingPayload = {
  questionDe: "Was machen Sie gern in Berlin?",
  supportAr: "السؤال مرتبط بمكان السكن المكتوب.",
  groundingCue: "Berlin",
};
const context: TutorContext = { lessonId: "a2-01", level: "A2", objectiveAr: "شرح السبب", objectiveDe: "Gründe nennen", errorSummaries: [] };
const source: TutorCommandSource = { interactionId: "tutor-parent", question: "اشرح weil", answer: tutorPayload };

const providers: Array<{ id: "gemini" | "openrouter" | "local"; config: AIConfig; wrap: (content: string) => string }> = [
  { id: "gemini", config: { provider: "gemini", model: "gemini-2.5-flash", key: "session-key" }, wrap: (content) => JSON.stringify({ candidates: [{ content: { parts: [{ text: content }] } }] }) },
  { id: "openrouter", config: { provider: "openrouter", model: "openrouter/free", key: "session-key" }, wrap: (content) => JSON.stringify({ choices: [{ message: { content } }] }) },
  { id: "local", config: { provider: "local", model: "qwen2.5:3b", key: "http://localhost:11434" }, wrap: (content) => JSON.stringify({ message: { content } }) },
];

function userPayloadFromRequest(provider: typeof providers[number], request: RequestInit) {
  const body = JSON.parse(String(request.body));
  return provider.id === "gemini" ? body.contents[0].parts[0].text : body.messages[1].content;
}

class FakeCache {
  entries = new Map<string, Response>();
  async match(input: RequestInfo | URL) { return this.entries.get(String(input)); }
  async put(input: RequestInfo | URL, response: Response) { this.entries.set(String(input), response); }
  async delete(input: RequestInfo | URL) { return this.entries.delete(String(input)); }
}
class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) { if (!this.stores.has(name)) this.stores.set(name, new FakeCache()); return this.stores.get(name)!; }
  async delete(name: string) { return this.stores.delete(name); }
  async keys() { return [...this.stores.keys()]; }
}
class MockRankingWorker {
  listeners = new Set<(event: MessageEvent) => void>();
  addEventListener(_type: string, listener: (event: MessageEvent) => void) { this.listeners.add(listener); }
  removeEventListener(_type: string, listener: (event: MessageEvent) => void) { this.listeners.delete(listener); }
  postMessage(payload: { requestId: string; candidates: string[] }) {
    queueMicrotask(() => {
      const event = { data: { requestId: payload.requestId, type: "ranked", selectedIndex: 1, scores: payload.candidates.map((_, index) => index / 10) } } as MessageEvent;
      for (const listener of this.listeners) listener(event);
    });
  }
  terminate() { this.listeners.clear(); }
}

afterEach(() => {
  resetWebGPUWorkerForTests();
  vi.unstubAllGlobals();
});

describe("P1 provider success mocks for every connected feature", () => {
  it.each(providers)("returns a structured Tutor answer through $id", async (provider) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(provider.wrap(JSON.stringify(tutorPayload)), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutor(provider.config, "Warum steht das Verb am Ende?", { context, consentGranted: true, now: new Date("2026-09-08T12:00:00Z") });
    expect(answer).toMatchObject({ ...tutorPayload, provider: provider.id, model: provider.config.model, promptVersion: "tutor-v2" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(providers)("executes a consented linked Tutor command through $id", async (provider) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(provider.wrap(JSON.stringify(commandPayload)), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutorFollowUpCommand(provider.config, "simpler", source, { context, consentGranted: true, now: new Date("2026-09-08T12:00:00Z") });
    expect(answer).toMatchObject({ ...commandPayload, provider: provider.id, promptVersion: TUTOR_FOLLOW_UP_COMMAND_POLICY });
    const sent = JSON.parse(userPayloadFromRequest(provider, fetchMock.mock.calls[0][1]));
    expect(sent).toEqual({ kind: "tutor-follow-up-command", command: "simpler", previousQuestion: source.question, previousAnswer: source.answer });
    expect(JSON.stringify(sent)).not.toMatch(/answerKey|mastery|correctness|session-key/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(providers)("returns a transcript-grounded Speaking follow-up through $id", async (provider) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(provider.wrap(JSON.stringify(speakingPayload)), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askSpeakingFollowUp(provider.config, "Ich wohne in Berlin.", {
      context: { lessonId: "a1-01", level: "A1", taskPromptDe: "Stellen Sie sich vor." },
      consentGranted: true,
      now: new Date("2026-09-08T12:00:00Z"),
    });
    expect(answer).toMatchObject({ ...speakingPayload, provider: provider.id, model: provider.config.model, promptVersion: "speaking-follow-up-v1" });
    expect(userPayloadFromRequest(provider, fetchMock.mock.calls[0][1])).toBe(JSON.stringify({ source: "typed-transcript", transcript: "Ich wohne in Berlin." }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("requires a fresh consent event for a command even after the parent question was approved", async () => {
    const provider = providers[0];
    const fetchMock = vi.fn().mockResolvedValue(new Response(provider.wrap(JSON.stringify(tutorPayload)), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await askTutor(provider.config, source.question, { context, consentGranted: true, now: new Date("2026-09-08T12:00:00Z") });
    await expect(askTutorFollowUpCommand(provider.config, "simpler", source, { context, now: new Date("2026-09-08T12:00:00Z") })).rejects.toThrow("تأكيد جديد");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["simpler", "another-example", "arabic"] as const)("runs disabled/local command %s with no network", async (command) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutorFollowUpCommand({ provider: "disabled", model: "", key: "" }, command, source, { context });
    expect(answer).toMatchObject({ provider: "disabled", model: TUTOR_FOLLOW_UP_LOCAL_MODEL, promptVersion: TUTOR_FOLLOW_UP_COMMAND_POLICY });
    expect(answer.microExerciseAr.length).toBeGreaterThan(10);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps disabled Speaking follow-up deterministic without calling a provider", () => {
    const result = generateLocalContentFollowUp("Ich wohne in Berlin und lerne Deutsch.", "A1");
    expect(result).toMatchObject({ status: "ready", draft: { sourceCue: "Berlin" } });
  });

  it("uses a mocked WebGPU Worker for the only supported browser-model feature", async () => {
    const storage = new FakeCacheStorage();
    const cache = await storage.open(WEBGPU_MODEL_CACHE);
    await cache.put(WEBGPU_MODEL_META_PATH, new Response(JSON.stringify({
      policyVersion: "browser-webgpu-model-v1",
      modelId: webGPUModelRegistry.modelId,
      modelRevision: webGPUModelRegistry.modelRevision,
      dtype: webGPUModelRegistry.dtype,
      installedAt: "2026-09-08T12:00:00Z",
      cacheEntries: 7,
      headerByteSize: 130_000_000,
    })));
    vi.stubGlobal("caches", storage);
    vi.stubGlobal("Worker", MockRankingWorker);
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    const ranked = await rankFollowUpCandidatesWithWebGPU("Ich wohne in Berlin.", ["Wo wohnen Sie?", "Was machen Sie gern in Berlin?"]);
    expect(ranked).toMatchObject({ selectedIndex: 1, scores: [0, 0.1], model: { modelId: webGPUModelRegistry.modelId } });
  });

  it("falls back from one failed command request with command-specific provenance and no retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("limited", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutorFollowUpCommand(providers[1].config, "another-example", source, { context, consentGranted: true, now: new Date("2026-09-08T12:00:00Z") });
    expect(answer).toMatchObject({
      provider: "disabled",
      model: TUTOR_FOLLOW_UP_LOCAL_MODEL,
      promptVersion: TUTOR_FOLLOW_UP_COMMAND_POLICY,
      fallbackEvidence: { attemptedProvider: "openrouter", failureKind: "rate-limit", networkAttemptCount: 1, retryRequiresNewConsent: true },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("serializes a command without internal interaction IDs, keys, or learning scores", () => {
    const payload = JSON.parse(buildTutorCommandPayload("another-example", source));
    expect(Object.keys(payload)).toEqual(["kind", "command", "previousQuestion", "previousAnswer"]);
    expect(JSON.stringify(payload)).not.toContain(source.interactionId);
    expect(JSON.stringify(payload)).not.toMatch(/key|mastery|correctness/i);
  });

  it("accepts only complete portable command provenance and keeps legacy Tutor rows valid", () => {
    const command = {
      id: "tutor-command",
      question: "Einfacher · اشرح أبسط",
      answer: commandPayload,
      provider: "disabled" as const,
      model: TUTOR_FOLLOW_UP_LOCAL_MODEL,
      promptVersion: TUTOR_FOLLOW_UP_COMMAND_POLICY,
      lessonId: "a2-01",
      errorIds: [],
      consent: "not-required" as const,
      command: "simpler" as const,
      parentInteractionId: "tutor-parent",
      commandPolicyVersion: TUTOR_FOLLOW_UP_COMMAND_POLICY,
      evidenceBoundary: "support-only-no-answer-key-no-mastery-or-correctness" as const,
      createdAt: "2026-09-08T12:00:00Z",
    };
    expect(learningStateSchema.parse({ ...defaultState, tutorInteractions: [command] }).tutorInteractions[0]).toEqual(command);
    expect(() => learningStateSchema.parse({ ...defaultState, tutorInteractions: [{ ...command, parentInteractionId: undefined }] })).toThrow("Tutor command provenance");
    const legacy = { ...command, promptVersion: "tutor-v2" as const, command: undefined, parentInteractionId: undefined, commandPolicyVersion: undefined, evidenceBoundary: undefined };
    expect(learningStateSchema.parse({ ...defaultState, tutorInteractions: [legacy] }).tutorInteractions[0].promptVersion).toBe("tutor-v2");
  });
});
