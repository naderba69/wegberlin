// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CONTENT_FOLLOW_UP_BOUNDARY, CONTENT_FOLLOW_UP_POLICY_VERSION, createSpeakingContentFollowUpEvidence, generateLocalContentFollowUp, LOCAL_FOLLOW_UP_MODEL, normalizeFollowUpTranscript } from "@/core/speaking/content-follow-up";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";

function ready(text: string, level: "A1" | "A2" | "B1" | "B2" = "A1") {
  const result = generateLocalContentFollowUp(text, level);
  expect(result.status).toBe("ready");
  if (result.status !== "ready") throw new Error("expected ready follow-up");
  return result.draft;
}

describe("P0 text-grounded speaking follow-up", () => {
  it("grounds an A1 question in the learner-written country instead of a fixed generic prompt", () => {
    const draft = ready("Ich komme aus Tunesien und wohne jetzt in Berlin.");
    expect(draft).toMatchObject({ cueCategory: "location", sourceCue: "Tunesien" });
    expect(draft.questionDe).toContain("Tunesien");
    expect(draft.supportAr).toContain("المكان");
  });

  it("uses work and study details and adjusts the question by level", () => {
    expect(ready("Ich arbeite als Krankenpfleger im Krankenhaus.", "B1")).toMatchObject({ cueCategory: "work-study", sourceCue: "Krankenpfleger" });
    const study = ready("Ich lerne Deutsch für meine Arbeit.", "A1");
    expect(study.sourceCue).toBe("Deutsch");
    expect(study.questionDe).toContain("Deutsch");
  });

  it("recognizes a preference, a dated plan, and an explicit reason", () => {
    expect(ready("Ich mag klassische Musik sehr.").cueCategory).toBe("preference");
    const plan = ready("Morgen besuche ich einen Deutschkurs.", "B2");
    expect(plan).toMatchObject({ cueCategory: "plan-time", sourceCue: "Morgen" });
    expect(plan.questionDe).toContain("Morgen");
    const reason = ready("Das ist wichtig, weil ich eine neue Stelle suche.", "B1");
    expect(reason).toMatchObject({ cueCategory: "reason-opinion", sourceCue: "ich eine neue Stelle suche" });
  });

  it("falls back to an actual content token when no authored pattern matches", () => {
    const draft = ready("Heute beschreibt Nadia Umweltschutz ausführlich.", "B2");
    expect(draft).toMatchObject({ cueCategory: "keyword", sourceCue: "Umweltschutz" });
    expect(draft.questionDe).toContain("Umweltschutz");
  });

  it("refuses empty, too-short, and Arabic-only text instead of pretending to understand audio", () => {
    expect(generateLocalContentFollowUp("", "A1")).toMatchObject({ status: "unavailable", reason: "empty" });
    expect(generateLocalContentFollowUp("Ich lerne", "A1")).toMatchObject({ status: "unavailable", reason: "too-short" });
    expect(generateLocalContentFollowUp("أنا أتعلم اللغة الألمانية", "A1")).toMatchObject({ status: "unavailable", reason: "no-german-content" });
  });

  it("normalizes whitespace, strips raw bidi controls, and stays deterministic", () => {
    const source = "  Ich\u202E   wohne   in Berlin.  ";
    expect(normalizeFollowUpTranscript(source)).toBe("Ich wohne in Berlin.");
    expect(generateLocalContentFollowUp(source, "A2")).toEqual(generateLocalContentFollowUp(source, "A2"));
  });

  it("creates auditable local provenance with a full-source hash and no network consent", async () => {
    const sourceText = "Ich komme aus Tunesien und wohne in Berlin.";
    const draft = ready(sourceText);
    const evidence = await createSpeakingContentFollowUpEvidence({ sourceText, ...draft, provider: "disabled", model: LOCAL_FOLLOW_UP_MODEL, consent: "not-required", generatedAt: "2026-09-06T12:00:00Z" });
    expect(evidence).toMatchObject({ policyVersion: CONTENT_FOLLOW_UP_POLICY_VERSION, source: "typed-transcript", sourceCue: "Tunesien", provider: "disabled", consent: "not-required", evaluationBoundary: CONTENT_FOLLOW_UP_BOUNDARY });
    expect(evidence.sourceTextSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.sourceExcerpt).toBe(sourceText);
  });

  it("rejects invented grounding cues and missing explicit consent for optional providers", async () => {
    const base = { sourceText: "Ich wohne in Berlin und lerne Deutsch.", questionDe: "Was machen Sie dort?", supportAr: "متابعة مرتبطة بالنص.", sourceCue: "München", cueCategory: "ai-grounded" as const, provider: "gemini" as const, model: "gemini-2.5-flash", consent: "explicit" as const };
    await expect(createSpeakingContentFollowUpEvidence(base)).rejects.toThrow("مرتبط بالنص");
    await expect(createSpeakingContentFollowUpEvidence({ ...base, sourceCue: "Berlin", consent: "not-required" })).rejects.toThrow("موافقة صريحة");
  });

  it("validates the optional evidence inside an old-compatible speaking attempt", async () => {
    const sourceText = "Ich wohne in Berlin und lerne Deutsch.";
    const draft = ready(sourceText);
    const contentFollowUp = await createSpeakingContentFollowUpEvidence({ sourceText, ...draft, provider: "disabled", model: LOCAL_FOLLOW_UP_MODEL, consent: "not-required" });
    const parsed = learningStateSchema.parse({ ...defaultState, speakingAttempts: [{ id: "s-follow", taskId: "a1-01", durationSeconds: 28, selfScore: 3, reflection: "سأجيب عن المتابعة", contentFollowUp, createdAt: "2026-09-06T12:00:00Z" }] });
    expect(parsed.speakingAttempts[0].contentFollowUp?.source).toBe("typed-transcript");
    expect(learningStateSchema.parse(defaultState).speakingAttempts).toEqual([]);
  });
});
