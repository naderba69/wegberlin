import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhonemeWordReference } from "@/components/phoneme-word-reference";
import { SpeakingTranscriptConfirmationCard } from "@/components/speaking-review-lanes-panel";
import { WritingGrammarSignalsPanel } from "@/components/writing-grammar-signals-panel";
import { createTranscriptDraft } from "@/core/speaking/review-lanes";

/**
 * Behaviour of the surfaces the phoneme wiring, the grammar-signal gate, and the
 * speaking confirmation guard actually touch. The core tests prove the rules;
 * these prove the learner sees - and is allowed to click - the right thing.
 */
describe("phoneme reference and grammar signal surfaces", () => {
  it("shows the authored curriculum IPA inside the repair loop", () => {
    const { container } = render(<PhonemeWordReference word="fünf" />);
    expect(container.querySelector(".phoneme-reference-authored")?.textContent).toContain("fʏnf");
    expect(container.querySelector("[data-phoneme-readiness]")?.getAttribute("data-phoneme-readiness")).toBe("closed");
  });

  it("keeps an unauthored word visibly unauthored and never invents sounds", () => {
    const { container } = render(<PhonemeWordReference word="zquxpt" />);
    expect(container.querySelector(".phoneme-reference-authored")).toBeNull();
    expect(container.textContent).not.toMatch(/\/[ʏœyːɐ̯]+\//u);
    expect(container.querySelector("[data-phoneme-reference]")?.getAttribute("data-phoneme-reference")).toBe(
      "german-phoneme-reference-v1",
    );
  });

  it("renders a word-order fix that only permutes the learner's words", () => {
    const { container } = render(<WritingGrammarSignalsPanel text="Wie Sie heißen?" />);
    expect(container.textContent).toContain("Wie heißen Sie");
  });

  it("diagnoses a sentence whose verb ending is wrong without printing a fake correction", () => {
    const { container } = render(<WritingGrammarSignalsPanel text="Heute ich arbeiten nicht." />);
    expect(container.querySelector(".writing-grammar-signals-findings li")).toBeTruthy();
    const fix = container.querySelector(".writing-grammar-signals-fix")?.textContent ?? "";
    expect(fix).toContain("لا يقترح الفحص صيغة جاهزة");
    expect(fix).not.toContain("Heute arbeiten ich");
  });
});

describe("spoken transcript confirmation surface", () => {
  it("offers the draft only while it differs, and labels an ASR draft untrustworthy", () => {
    const used: number[] = [];
    const draft = createTranscriptDraft({ asrTranscript: "Ich komme aus Tunesien." });
    const differing = render(
      <SpeakingTranscriptConfirmationCard
        draft={draft}
        currentText="Ich wohne in Berlin."
        onUseDraft={() => used.push(1)}
        onConfirm={() => undefined}
      />,
    );
    const fill = differing.container.querySelector<HTMLButtonElement>(".speaking-transcript-draft-actions button");
    expect(fill?.textContent).toContain("املأ الحقل من نسخة النموذج");
    fill?.click();
    expect(used).toEqual([1]);
    expect(differing.container.textContent).toContain("مسودة غير موثوقة");

    const matching = render(
      <SpeakingTranscriptConfirmationCard
        draft={draft}
        currentText={draft.draftText}
        onUseDraft={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(matching.container.querySelector(".speaking-transcript-draft-actions button")?.textContent).toContain(
      "أؤكد أن هذه النسخة",
    );
  });

  it("locks the confirm button once the learner has confirmed the exact text", () => {
    const draft = {
      ...createTranscriptDraft({ asrTranscript: "Ich lerne Deutsch." }),
      confirmation: "learner-confirmed" as const,
    };
    const { container } = render(
      <SpeakingTranscriptConfirmationCard
        draft={draft}
        currentText="Ich lerne Deutsch."
        onUseDraft={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    const confirm = [...container.querySelectorAll<HTMLButtonElement>("button")].find((button) =>
      button.textContent?.includes("أؤكد أن هذه النسخة"),
    );
    expect(confirm?.disabled).toBe(true);
    expect(container.textContent).toContain("أكّدت المسودة دون تعديل.");
    expect(container.querySelector("[data-transcript-policy]")?.getAttribute("data-transcript-policy")).toBe(
      "speaking-confirmed-transcript-v1",
    );
  });
});
