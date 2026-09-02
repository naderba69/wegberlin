// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { askTutor, buildTutorContextPrompt, isTutorConsentRequired, parseTutorPayload, TUTOR_PROMPT_VERSION, type TutorContext } from "@/core/ai/client";

const payload = {
  hintAr: "راقب موضع الفعل.",
  explanationAr: "ينتقل الفعل المصرف إلى نهاية الجملة التابعة بعد weil.",
  examplesDe: ["Ich bleibe, weil ich krank bin."],
  microExerciseAr: "رتب جملة جديدة باستعمال weil.",
};
const context: TutorContext = {
  lessonId: "a2-01",
  level: "A2",
  objectiveAr: "شرح السبب",
  objectiveDe: "Gründe nennen",
  errorSummaries: [{ id: "e1", wrong: "weil ich bin müde", correct: "weil ich müde bin", explanationAr: "الفعل في النهاية" }],
};

afterEach(() => vi.unstubAllGlobals());

describe("P0 structured and consented tutor", () => {
  it("accepts only the authored four-field JSON contract and removes a JSON fence", () => {
    expect(parseTutorPayload(`\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``)).toEqual(payload);
  });

  it("rejects unstructured or contract-expanding model output", () => {
    expect(() => parseTutorPayload("هذا شرح عادي بلا JSON")).toThrow("غير منظم");
    expect(() => parseTutorPayload(JSON.stringify({ ...payload, officialScore: 95 }))).toThrow("لا يطابق عقد المرشد");
  });

  it("limits injected error context to three bounded records", () => {
    const prompt = JSON.parse(buildTutorContextPrompt({ ...context, errorSummaries: Array.from({ length: 6 }, (_, index) => ({ id: `e${index}`, wrong: "x".repeat(300), correct: "richtig", explanationAr: "شرح" })) }));
    expect(prompt.lesson).toMatchObject({ id: "a2-01", level: "A2" });
    expect(prompt.activeErrors).toHaveLength(3);
    expect(prompt.activeErrors[0].wrong).toHaveLength(180);
  });

  it("keeps the built-in disabled provider useful without network or consent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutor({ provider: "disabled", model: "", key: "" }, "اشرح weil", { context });
    expect(answer.hintAr).toContain("الفعل");
    expect(answer.examplesDe[0]).toContain("weil");
    expect(answer).toMatchObject({ provider: "disabled", model: "local-rules-v2", promptVersion: TUTOR_PROMPT_VERSION });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks every network-backed provider before fetch when consent is absent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(isTutorConsentRequired("gemini")).toBe(true);
    expect(isTutorConsentRequired("openrouter")).toBe(true);
    expect(isTutorConsentRequired("local")).toBe(true);
    await expect(askTutor({ provider: "gemini", model: "gemini-2.5-flash", key: "secret" }, "Warum?", { context })).rejects.toThrow("تأكيد الإرسال");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a paid-capable OpenRouter model before any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(askTutor({ provider: "openrouter", model: "vendor/paid-model", key: "secret" }, "Warum?", { context, consentGranted: true })).rejects.toThrow("Free-only");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates Gemini JSON and attaches trusted local provenance", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutor({ provider: "gemini", model: "gemini-2.5-flash", key: "secret" }, "Warum steht das Verb am Ende?", { context, consentGranted: true });
    expect(answer).toMatchObject({ ...payload, provider: "gemini", model: "gemini-2.5-flash", promptVersion: "tutor-v2" });
    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.systemInstruction.parts[0].text).toContain("a2-01");
  });

  it("supports consented local Ollama chat with JSON mode and no cloud key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { content: JSON.stringify(payload) } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const answer = await askTutor({ provider: "local", model: "qwen2.5:3b", key: "http://localhost:11434/" }, "Erkläre weil", { context, consentGranted: true });
    expect(answer.provider).toBe("local");
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:11434/api/chat");
    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({ model: "qwen2.5:3b", stream: false, format: "json" });
  });
});
