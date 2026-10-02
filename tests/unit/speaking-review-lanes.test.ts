// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertTranscriptConfirmedForSend,
  buildSpeakingReviewLanes,
  confirmTranscript,
  createTranscriptDraft,
  isTranscriptStale,
  laneSections,
  type LaneInput,
  SPEAKING_REVIEW_LANES_POLICY,
  speakingLanesHaveComposite,
  TRANSCRIPT_CONFIRMATION_POLICY,
} from "@/core/speaking/review-lanes";

const spoken = "Ich möchte nächste Woche nach Berlin fahren und dort einen Kurs besuchen.";

function lanes(overrides: Partial<LaneInput> = {}) {
  return buildSpeakingReviewLanes({
    transcript: confirmTranscript(createTranscriptDraft({ asrTranscript: spoken }), spoken),
    wordMatch: {
      heardCount: 10,
      expectedCount: 11,
      words: [
        ...Array.from({ length: 10 }, (_unused, index) => ({ word: `wort${index}`, status: "heard" as const })),
        { word: "Woche", status: "unconfirmed" as const },
      ],
      feedbackAr: ["كلمة واحدة لم تُؤكد."],
    },
    localSignals: {
      findingsAr: ["بعد ظرف الزمان يأتي الفعل قبل الفاعل في «nächste Woche nach Berlin»."],
      unresolvedAr: [],
    },
    aiFindings: null,
    task: { criteriaMet: ["ذكر السبب"], criteriaUnmet: [], targetSeconds: 60, spokeForSeconds: 41 },
    ...overrides,
  });
}

describe("the spoken transcript must be the learner's own confirmed words", () => {
  it("starts as an unconfirmed local ASR draft that cannot be sent", () => {
    const draft = createTranscriptDraft({ asrTranscript: spoken });
    expect(draft).toMatchObject({
      policyVersion: TRANSCRIPT_CONFIRMATION_POLICY,
      source: "local-asr-draft",
      confirmation: "unconfirmed",
      confirmedText: "",
      editedFromDraft: false,
    });
    expect(() => assertTranscriptConfirmedForSend(draft, spoken)).toThrow(/قبل أن تؤكد/);
  });

  it("records the learner's edit and their confirmation timestamp", () => {
    const draft = createTranscriptDraft({ asrTranscript: "Ich möchte nächste Woche nach Berlin fahren." });
    const corrected = confirmTranscript(draft, spoken, new Date("2026-09-13T10:00:00.000Z"));
    expect(corrected.confirmation).toBe("learner-confirmed");
    expect(corrected.editedFromDraft).toBe(true);
    expect(corrected.confirmedAt).toBe("2026-09-13T10:00:00.000Z");
    expect(() => assertTranscriptConfirmedForSend(corrected, spoken)).not.toThrow();
  });

  it("refuses confirmations that could not express an answer", () => {
    const draft = createTranscriptDraft({ asrTranscript: spoken });
    expect(() => confirmTranscript(draft, "   ")).toThrow(/فارغة/);
    expect(() => confirmTranscript(draft, "Ich Berlin")).toThrow(/ثلاث كلمات/);
    // Three real words is enough to confirm: a short but deliberate answer is
    // the learner's own, and refusing it would punish the honest correction.
    expect(confirmTranscript(draft, "Ich bin hier.").confirmedText).toBe("Ich bin hier.");
    expect(() => confirmTranscript(createTranscriptDraft({ typedText: "" }), "   ")).toThrow(/فارغة/);
  });

  it("refuses to send text that changed after the confirmation", () => {
    const confirmed = confirmTranscript(createTranscriptDraft({ asrTranscript: spoken }), spoken);
    const edited = `${spoken} Und ich bringe meine Freundin mit.`;
    expect(isTranscriptStale(confirmed, edited)).toBe(true);
    expect(() => assertTranscriptConfirmedForSend(confirmed, edited)).toThrow(/تغيّرت النص بعد التأكيد/);
    expect(isTranscriptStale(confirmed, spoken)).toBe(false);
    // Text the learner typed themselves is not an ASR draft, so no confirmation
    // is imposed on it — the gate exists to stop Whisper errors, not typing.
    const typed = createTranscriptDraft({ typedText: spoken });
    expect(typed.source).toBe("typed-by-learner");
    expect(() => assertTranscriptConfirmedForSend(typed, spoken)).not.toThrow();
    expect(isTranscriptStale(typed, "etwas anderes")).toBe(false);
  });
});

describe("speaking review stays in three separate lanes", () => {
  it("never merges the three lanes into one number", () => {
    const result = lanes();
    expect(result.policyVersion).toBe(SPEAKING_REVIEW_LANES_POLICY);
    expect(result.compositeScore).toBeNull();
    expect(result.compositeFluencyScore).toBeNull();
    expect(speakingLanesHaveComposite(result)).toBe(false);
    expect(result.boundary).toContain("three-separated-lanes");
    expect(result.boundary).toContain("no-composite-number");
    expect(JSON.stringify(result)).not.toMatch(/"(?:fluencyScore|pronunciationScore|overallScore)"\s*:\s*[0-9]/);
  });

  it("keeps the acoustic lane inside what the local provider can prove", () => {
    const result = lanes();
    expect(result.acoustic.status).toBe("word-match-only");
    expect(result.acoustic.providerId).toBe("local-whisper-word-match");
    expect(result.acoustic.phonemeGateOpen).toBe(false);
    expect(result.acoustic.canClaimScore).toBe(false);
    expect(result.acoustic.canClaimPhonemeAccuracy).toBe(false);
    expect(result.acoustic.wordsConfirmed).toBe(10);
    expect(result.acoustic.unconfirmedWords).toEqual(["Woche"]);
    expect(result.acoustic.detailAr).toContain("لا قياس للفونيمات");
    const unverifiable = lanes({ wordMatch: null });
    expect(unverifiable.acoustic.status).toBe("technical-unverifiable");
    expect(unverifiable.acoustic.wordsConfirmed).toBe(0);
    expect(unverifiable.acoustic.detailAr).toContain("لا يُعدّ خطأ نطق");
  });

  it("marks the linguistic lane with what was grounded and what was not", () => {
    const result = lanes();
    expect(result.linguistic.status).toBe("local-signals");
    expect(result.linguistic.provider).toBe("local");
    expect(result.linguistic.transcriptConfirmed).toBe(true);
    expect(result.linguistic.findingsAr).toHaveLength(1);
    expect(result.linguistic.needsHumanReview).toBe(false);
    expect(result.linguistic.canClaimScore).toBe(false);
    expect(result.linguistic.boundary).toContain("no-audio-analysis");

    const open = lanes({ localSignals: { findingsAr: [], unresolvedAr: ["لم يتضح المقصود بالأسبوع القادم."] } });
    expect(open.linguistic.needsHumanReview).toBe(true);
    expect(open.linguistic.unresolvedAr).toHaveLength(1);

    const remote = lanes({ aiFindings: { findingsAr: ["صيغة الأداتان غير شائعة."], unresolvedAr: [], groundedExcerpts: ["nach Berlin fahren"] } });
    expect(remote.linguistic.status).toBe("remote-advisory");
    expect(remote.linguistic.provider).toBe("gemini");
    expect(remote.linguistic.groundedExcerpts).toEqual(["nach Berlin fahren"]);
    // Any remote advice is advisory: it always carries a human-review flag.
    expect(remote.linguistic.needsHumanReview).toBe(true);
    expect(remote.linguistic.findingsAr).toHaveLength(2);

    const notReviewed = lanes({ localSignals: null });
    expect(notReviewed.linguistic.status).toBe("not-reviewed");
    const unconfirmed = lanes({
      transcript: createTranscriptDraft({ asrTranscript: spoken }),
      localSignals: null,
    });
    expect(unconfirmed.linguistic.transcriptConfirmed).toBe(false);
  });

  it("reports the task lane as the learner's own checklist, not a verdict", () => {
    const result = lanes();
    expect(result.task.status).toBe("self-reported");
    expect(result.task.canClaimScore).toBe(false);
    expect(result.task.criteriaMet).toEqual(["ذكر السبب"]);
    expect(result.task.spokeForSeconds).toBe(41);
    expect(result.task.targetSeconds).toBe(60);
    expect(result.task.detailAr).toContain("لا يقيّمها أحد غيرك");
  });

  it("renders one section per lane so no surface can average them", () => {
    const sections = laneSections(lanes());
    expect(sections.map((section) => section.titleAr)).toEqual(["القناة الصوتية", "القناة اللغوية", "قناة إنجاز المهمة"]);
    expect(sections[0]?.statusAr).toBe("مطابقة كلمات: 10/11");
    expect(sections[1]?.statusAr).toBe("رصد محلي");
    expect(sections[2]?.statusAr).toBe("1 معيار مؤكد من 1");
    expect(sections.every((section) => section.bodyAr.length > 10)).toBe(true);
    expect(laneSections(lanes({ wordMatch: null }))[0]?.statusAr).toContain("غير قابلة للتحقق تقنيًا");
    expect(laneSections(lanes({ transcript: createTranscriptDraft({ asrTranscript: spoken }), localSignals: null }))[1]?.statusAr).toBe("بانتظار تأكيد النسخة");
    const source = readFileSync("src/components/speaking-review-lanes-panel.tsx", "utf8").replace(/\s+/gu, " ");
    expect(source).toContain("laneSections");
    expect(source).toContain("حتى لا تختفي مشكلة خلف متوسط عام");
    expect(source).not.toMatch(/percent|toFixed|Math\.round|average\(/);
  });
});
