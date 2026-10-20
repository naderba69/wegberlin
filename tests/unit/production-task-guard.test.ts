// @vitest-environment node
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { analyzeWriting, writingTaskNeedsGreeting } from "@/core/writing/analyze";
import { detectWritingErrorPatterns, splitGermanSentences } from "@/core/writing/error-practice";

// ADR-148 / v257: guard for the audit of all 96 writing, speaking and mediation tasks.
// - Every writing prompt states one explicit word range ("N–M Wörter"); the Arabic prompt states the same range
//   with a singular Arabic noun after numbers of 11 and more («220–250 كلمة», not «كلمات»).
// - Every model text lies inside its own range and passes the app's own writing analyser with the settings the
//   writing lab uses (range minimum, greeting rule, full checklist): a model must never look "wrong" to learners.
// - A closing formula ends the model; no padding sentences follow it. No model repeats a sentence.
// - German production text uses German quotation marks „…“, never «…» or straight single quotes.
const range = /(\d{2,3})[–-](\d{2,3})\s+Wörter/u;
const closings = /(?:Mit freundlichen Grüßen|Viele Grüße|Liebe Grüße|Herzliche Grüße|Beste Grüße|Bis bald)/u;
const wrongGermanQuotes = /[«»]|(?<![\p{L}])'[^'\n]+'(?![\p{L}])/u;
const arabicLetter = /[\u0600-\u06FF]/u;
const words = (text: string) => text.trim().split(/\s+/u).filter((word) => /[\p{L}\d]/u.test(word));

describe("writing, speaking and mediation tasks (ADR-148)", () => {
  it("covers the audited inventory", () => {
    expect(academicLessonList).toHaveLength(96);
  });

  it("states one word range in German and Arabic and keeps every model inside it", () => {
    const problems: string[] = [];
    for (const lesson of academicLessonList) {
      const { promptDe, promptAr, modelDe } = lesson.writing;
      const match = promptDe.match(range);
      if (!match) { problems.push(`${lesson.id}: promptDe has no "N–M Wörter" range`); continue; }
      const [low, high] = [Number(match[1]), Number(match[2])];
      if (!promptAr.includes(`${low}–${high}`)) problems.push(`${lesson.id}: promptAr does not repeat ${low}–${high}`);
      if (low >= 11 && /\d\s*كلمات/u.test(promptAr)) problems.push(`${lesson.id}: promptAr uses «كلمات» after ${low}`);
      const count = words(modelDe).length;
      if (count < low || count > high) problems.push(`${lesson.id}: model has ${count} words, range ${low}–${high}`);
    }
    expect(problems).toEqual([]);
  });

  it("lets every model pass the writing analyser the learner sees", () => {
    const problems: string[] = [];
    for (const lesson of academicLessonList) {
      const task = lesson.writing;
      const minWords = Number(task.promptDe.match(range)?.[1] ?? 0);
      const analysis = analyzeWriting(task.modelDe, { minWords, requireGreeting: writingTaskNeedsGreeting(task.promptDe), taskPointsCompleted: task.checklistAr.length, taskPointsTotal: task.checklistAr.length });
      const failed = [...analysis.checks.filter((check) => !check.passed).map((check) => check.label), ...analysis.dimensions.filter((dimension) => !dimension.passed).map((dimension) => dimension.key)];
      if (failed.length) problems.push(`${lesson.id}: ${failed.join(", ")}`);
    }
    expect(problems).toEqual([]);
  });

  it("ends letters with their closing and repeats no sentence", () => {
    const problems: string[] = [];
    for (const lesson of academicLessonList) {
      const model = lesson.writing.modelDe;
      const closing = model.match(closings);
      if (closing && closing.index !== undefined) {
        const tail = model.slice(closing.index + closing[0].length);
        if (!/^[,!]?\s*(?:\p{Lu}\p{L}+(?:\s\p{Lu}\p{L}+)?)?\s*$/u.test(tail)) problems.push(`${lesson.id}: text continues after "${closing[0]}"`);
        if (/^\./u.test(tail)) problems.push(`${lesson.id}: closing formula ends with a period`);
      }
      const seen = new Set<string>();
      for (const sentence of splitGermanSentences(model)) {
        const key = sentence.toLocaleLowerCase("de-DE").replace(/[^\p{L}\d]+/gu, " ").trim();
        if (key.split(" ").length >= 4 && seen.has(key)) problems.push(`${lesson.id}: repeated sentence "${sentence.slice(0, 60)}"`);
        seen.add(key);
      }
    }
    expect(problems).toEqual([]);
  });

  it("uses German quotation marks in German production text and keeps Arabic support Arabic", () => {
    const problems: string[] = [];
    for (const lesson of academicLessonList) {
      const german: Array<[string, string]> = [
        ["writing.promptDe", lesson.writing.promptDe],
        ["writing.modelDe", lesson.writing.modelDe],
        ["speaking.promptDe", lesson.speaking.promptDe],
        ["mediation.sourceDe", lesson.mediation.sourceDe],
        ...lesson.speaking.usefulPhrases.map((phrase, index): [string, string] => [`speaking.usefulPhrases[${index}]`, phrase]),
      ];
      for (const [field, text] of german) if (wrongGermanQuotes.test(text)) problems.push(`${lesson.id}.${field}: «…» or '…' instead of „…“`);
      for (const [field, text] of [["writing.promptAr", lesson.writing.promptAr], ["speaking.promptAr", lesson.speaking.promptAr], ["mediation.taskAr", lesson.mediation.taskAr], ["mediation.suggestedAr", lesson.mediation.suggestedAr]] as const) {
        if (!arabicLetter.test(text)) problems.push(`${lesson.id}.${field}: no Arabic text`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("writing error patterns do not misread correct German (ADR-148)", () => {
  it.each([
    "Ich habe am 12. September Geburtstag.",
    "Wir prüfen Ihre Unterlagen am 9. und am 12. April.",
    "Ich möchte vom 12. bis 15. Juli ein Zimmer buchen.",
    "Meine E-Mail ist sami.bensalem@example.de. Bitte schreiben Sie mir.",
    "Ich brauche z. B. einen Termin am Montag.",
    "Die Schmerzen sind stark. Sie kommen besonders morgens.",
    "Es kommen heute viele Leute.",
    "Ich weiß, dass er kommen kann.",
    "Ich habe mit zwei Personen gesprochen, die beide Wege schon gegangen sind.",
  ])("reports no pattern for %s", (text) => {
    expect(detectWritingErrorPatterns(text)).toEqual([]);
  });

  it("keeps day numbers and abbreviations inside one sentence", () => {
    expect(splitGermanSentences("Wir prüfen am 9. und am 12. April. Danach entscheiden wir z. B. schriftlich.")).toEqual(["Wir prüfen am 9. und am 12. April.", "Danach entscheiden wir z. B. schriftlich."]);
    expect(splitGermanSentences("Meine Nummer ist 0176 5544221. Bitte rufen Sie an.")).toHaveLength(2);
  });
});
