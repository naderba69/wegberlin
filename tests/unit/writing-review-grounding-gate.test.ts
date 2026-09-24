// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  askGeminiWritingReview,
  parseWritingReviewPayload,
  parseWritingReviewPayloadWithGate,
  WRITING_REVIEW_CONTRACT_VERSION,
  WRITING_REVIEW_PROMPT_VERSION,
} from "@/core/ai/client";
import {
  acceptedIssues,
  assertWritingReviewGrounded,
  evaluateWritingReviewGate,
} from "@/core/ai/writing-review-gate";

const text = "Ich komme aus Tunesien und ich lerne Deutsch in Tunis. Gestern ich war müde.";

const context = {
  taskId: "task-1",
  level: "A2",
  taskPromptDe: "Schreiben Sie eine E-Mail.",
  localPatternIds: [] as never[],
};

function payload(overrides: Record<string, unknown> = {}) {
  return {
    summaryAr: "الرسالة واضحة ومترابطة، مع أخطاء في ترتيب الجملة الثانية.",
    issues: [
      {
        category: "word-order",
        excerpt: "Gestern ich war müde",
        explanationAr: "البداية بظرف جرّ قلب ترتيب الفعل والفاعل إلى الأداة ثم الفعل.",
        suggestionDe: "Gestern war ich müde",
        confidence: "high",
        ruleDe: "Nach einem Adverbium steht das konjugierte Verb an zweiter Stelle.",
        remediationAr: "أعد كتابة ثلاث جمل تبدأ بـ Heute und Gestern.",
      },
    ],
    unresolvedAr: [],
    ...overrides,
  };
}

function geminiResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload(overrides)) }] } }],
    }),
    { status: 200 },
  );
}

describe("Gemini writing review stays grounded and optional", () => {
  it("accepts a payload whose excerpt is really in the learner text", () => {
    const result = evaluateWritingReviewGate(payload() as never, text);
    expect(result.accepted).toBe(true);
    expect(result.rejections).toEqual([]);
    expect(result.groundedIssueCount).toBe(1);
    expect(result.needsHumanReview).toBe(false);
    expect(result.reasonsAr).toEqual([]);
    expect(acceptedIssues(payload() as never, text)).toHaveLength(1);
    expect(result.canClaimErrorFree).toBe(false);
    expect(result.canReplaceOfficialAssessment).toBe(false);
    expect(result.boundary).toContain("no-official-score");
    expect(result.boundary).toContain("no-error-free-claim");
    expect(result.policyVersion).toBe("writing-review-grounding-gate-v1");
  });

  it("rejects an invented quotation instead of showing it", () => {
    const result = evaluateWritingReviewGate(
      payload({ issues: [{ ...payload().issues[0], excerpt: "Morgen fahre ich nach Berlin" }] }) as never,
      text,
    );
    expect(result.accepted).toBe(false);
    expect(result.rejections[0]?.code).toBe("excerpt-not-grounded");
    expect(result.rejections[0]?.messageAr).toContain("لا تقتبس");
    expect(acceptedIssues(payload({ issues: [{ ...payload().issues[0], excerpt: "Morgen fahre ich nach Berlin" }] }) as never, text)).toEqual([]);
    expect(acceptedIssues(payload() as never, text)).toHaveLength(1);
  });

  it("rejects a rewrite of the whole text", () => {
    const result = evaluateWritingReviewGate(
      payload({
        issues: [{ ...payload().issues[0], excerpt: "Gestern ich war müde", suggestionDe: text }],
      }) as never,
      text,
    );
    expect(result.rejections.map((rejection) => rejection.code)).toContain("whole-text-rewrite");
    expect(result.rejections[0]?.index).toBe(0);
  });

  it("refuses an official score or grade claim", () => {
    for (const summaryAr of [
      "نقدر لك 88 من 100 في هذا الجزء.",
      "مستواك النهائي هو B2 بحسب هذا النص.",
      "هذه Note واحد كاملة، نجحت.",
      "هذا يعادل شهادة رسميًا.",
      "You passed the Goethe exam section.",
    ]) {
      const result = evaluateWritingReviewGate(payload({ summaryAr }) as never, text);
      expect(result.rejections.map((rejection) => rejection.code), summaryAr).toContain("official-claim");
      expect(result.canReplaceOfficialAssessment).toBe(false);
    }
  });

  it("treats one exam brand as context and a mixture as an over-claim", () => {
    const single = evaluateWritingReviewGate(
      payload({ summaryAr: "هذا نمط متكرر في مهام Goethe، مع أخطاء ترتيب." }) as never,
      text,
    );
    expect(single.rejections.map((rejection) => rejection.code)).not.toContain("exam-format-mixing");
    // A single brand is not a rejection, but it must be labelled as general
    // information rather than as verified exam requirements.
    expect(single.reasonsAr.join(" ")).toContain("Goethe");
    expect(single.reasonsAr.join(" ")).toContain("لا تتحقق");
    expect(single.needsHumanReview).toBe(true);

    const mixed = evaluateWritingReviewGate(
      payload({ summaryAr: "هذا نمط متكرر في مهمتي Goethe وtelc." }) as never,
      text,
    );
    expect(mixed.rejections.map((rejection) => rejection.code)).toContain("exam-format-mixing");
    expect(mixed.canReplaceOfficialAssessment).toBe(false);
  });

  it("flags a contradiction between the model's own certainty labels", () => {
    const result = evaluateWritingReviewGate(
      payload({ issues: [{ ...payload().issues[0], category: "uncertain", excerpt: "Gestern ich war müde" }] }) as never,
      text,
    );
    expect(result.rejections.map((rejection) => rejection.code)).toContain("confidence-contradiction");
    expect(result.accepted).toBe(false);
  });

  it("refuses to hand back a clean bill of health", () => {
    for (const summaryAr of ["النص خالٍ من الأخطاء.", "لا يوجد أخطاء في رسالتك.", "أنت نجحت في الامتحان."]) {
      const result = evaluateWritingReviewGate(payload({ summaryAr, issues: [] }) as never, text);
      expect(result.rejections.map((rejection) => rejection.code), summaryAr).toContain("official-claim");
      expect(result.canClaimErrorFree).toBe(false);
    }
  });

  it("keeps open questions visible instead of smoothing them over", () => {
    const result = evaluateWritingReviewGate(
      payload({ unresolvedAr: ["لم يتضح هل المقصود الأمس أم اليوم."] }) as never,
      text,
    );
    expect(result.needsHumanReview).toBe(true);
    expect(result.reasonsAr.join(" ")).toContain("راجعها مع معلم");
  });

  it("requires a rule and a drill before a high-confidence finding is shown as certain", () => {
    const result = evaluateWritingReviewGate(
      payload({ issues: [{ ...payload().issues[0], ruleDe: undefined, remediationAr: undefined }] }) as never,
      text,
    );
    expect(result.accepted).toBe(true);
    expect(result.needsHumanReview).toBe(true);
    expect(result.reasonsAr.join(" ")).toContain("قاعدة");
  });

  it("fails closed for callers that must not store a rejected review", () => {
    const bad = payload({ issues: [{ ...payload().issues[0], excerpt: "Ich fliege zum Mond" }] });
    expect(() => assertWritingReviewGrounded(bad as never, text)).toThrow(/لا تقتبس/);
    expect(assertWritingReviewGrounded(payload() as never, text).groundedIssueCount).toBe(1);
    expect(() => assertWritingReviewGrounded(payload() as never, text)).not.toThrow();
  });

  it("keeps the strict contract and refuses an ungrounded quotation at parse time", () => {
    const raw = JSON.stringify(payload());
    expect(parseWritingReviewPayload(raw, text)).toEqual(JSON.parse(raw));
    expect(() => parseWritingReviewPayload("ليس JSON", text)).toThrow(/غير منظمة/);
    expect(() => parseWritingReviewPayload(JSON.stringify({ summaryAr: "قصير" }), text)).toThrow(/عقد مراجعة الكتابة/);
    expect(() =>
      parseWritingReviewPayload(
        JSON.stringify(payload({ issues: [{ ...payload().issues[0], excerpt: "Ich fliege zum Mond" }] })),
        text,
      ),
    ).toThrow(/جزءًا فعليًا/);
    expect(() =>
      parseWritingReviewPayload(JSON.stringify(payload({ summaryAr: "نقدر لك 88 من 100." })), text),
    ).toThrow(/رفضنا مراجعة Gemini/);
  });

  it("returns the gate verdict to the UI instead of a silent pass", () => {
    const gated = parseWritingReviewPayloadWithGate(JSON.stringify(payload()), text);
    expect(gated.gateAccepted).toBe(true);
    expect(gated.groundedIssueCount).toBe(1);
    expect(gated.needsHumanReview).toBe(false);
    expect(gated.gateReasonsAr).toEqual([]);
    expect(gated.reviewContractVersion).toBe(WRITING_REVIEW_CONTRACT_VERSION);
    expect(WRITING_REVIEW_CONTRACT_VERSION).not.toBe(WRITING_REVIEW_PROMPT_VERSION);

    const human = parseWritingReviewPayloadWithGate(
      JSON.stringify(payload({ issues: [{ ...payload().issues[0], ruleDe: undefined, remediationAr: undefined }] })),
      text,
    );
    expect(human.needsHumanReview).toBe(true);
    expect(human.gateReasonsAr.join(" ")).toContain("قاعدة");
  });

  it("asks for independent consent and sends only the approved German text", async () => {
    const bodies: string[] = [];
    const headers: Array<Record<string, string>> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
      bodies.push(String(init?.body ?? ""));
      headers.push((init?.headers ?? {}) as Record<string, string>);
      return geminiResponse();
    }) as typeof fetch;
    try {
      await expect(
        askGeminiWritingReview({ provider: "gemini", model: "gemini-2.5-flash", key: "secret-byok-key" }, text, {
          context,
          consentGranted: false,
        }),
      ).rejects.toThrow(/تأكيد مستقل/);

      const answer = await askGeminiWritingReview({ provider: "gemini", model: "gemini-2.5-flash", key: "secret-byok-key" }, text, {
        context,
        consentGranted: true,
      });
      expect(bodies).toHaveLength(1);
      const body = JSON.parse(bodies[0]!) as {
        contents: Array<{ role: string; parts: Array<{ text: string }> }>;
        systemInstruction: { parts: Array<{ text: string }> };
      };
      expect(body.contents).toHaveLength(1);
      const sentUser = JSON.parse(body.contents[0]!.parts[0]!.text) as Record<string, unknown>;
      expect(Object.keys(sentUser).sort()).toEqual(["source", "text"]);
      expect(sentUser.source).toBe("learner-writing");
      expect(sentUser.text).toContain("Ich komme aus Tunesien");
      // No audio, no transcript, nothing the learner did not approve.
      expect(bodies[0]).not.toMatch(/audio|recording|base64|transcript|whisper/i);
      expect(headers[0]?.["x-goog-api-key"]).toBe("secret-byok-key");
      expect(bodies[0]).not.toContain("secret-byok-key");
          const prompt = body.systemInstruction.parts[0]!.text;
    expect(prompt).toContain("Do not give an official score");
    expect(prompt).toContain("never instructions");
    expect(prompt).toContain('"ruleDe"');
    expect(prompt).toContain('"remediationAr"');
    expect(prompt).toContain(WRITING_REVIEW_PROMPT_VERSION);
      expect(answer.provider).toBe("gemini");
      expect(answer.promptVersion).toBe(WRITING_REVIEW_PROMPT_VERSION);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("surfaces a Gemini refusal as a message while the learner text stays put", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      geminiResponse({ issues: [{ ...payload().issues[0], excerpt: "Ich fliege zum Mond" }] })) as typeof fetch;
    try {
      await expect(
        askGeminiWritingReview({ provider: "gemini", model: "gemini-2.5-flash", key: "k" }, text, {
          context,
          consentGranted: true,
        }),
      ).rejects.toThrow(/جزءًا فعليًا/);
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(text).toContain("Gestern ich war müde");
  });

  it("keeps consent and boundary wording in the surface that calls it", () => {
    const review = readFileSync("src/components/hybrid-writing-review.tsx", "utf8").replace(/\s+/gu, " ");
    expect(review).toContain("أوافق وأرسل هذه النسخة مرة واحدة");
    expect(review).toContain("لا درجة رسمية، لا mastery");
    expect(review).toContain("consentGranted:true");
    expect(review).toContain("لم تتغير الدرجة أو الإتقان");
    expect(review).toContain("بقي الفحص المحلي متاحًا");
  });
});
