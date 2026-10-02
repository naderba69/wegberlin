// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildExternalEvaluatorPacket,
  EXTERNAL_EVALUATOR_PACKET_POLICY,
  readExternalEvaluatorNotes,
  renderExternalEvaluatorPacketText,
} from "@/core/assessment/external-evaluator-packet";
import { analyzeGermanGrammarSignals } from "@/core/writing/german-grammar-signals";

const learnerText = "Ich habe den Bus verpasst, weil ich den Schlüssel vergessen hatte.";

const task = {
  id: "b2-writing-04",
  titleAr: "اكتب رسالة اعتذار عن تأخير",
  skill: "schreiben" as const,
  inputSummaryAr: "اقرأ الملاحظة واشرح السبب واقترح موعدًا جديدًا.",
  criteria: ["Aufgabe erfüllen", "Kohärenz", "Wortschatz"],
};

describe("external evaluator packet is a question, not a verdict", () => {
  const packet = buildExternalEvaluatorPacket({
    level: "B2",
    examFormat: "none",
    task,
    learnerText,
    wordTarget: { min: 150, max: 220 },
    localReport: analyzeGermanGrammarSignals({ text: learnerText }),
    now: () => new Date("2026-09-14T09:00:00.000Z"),
  });

  it("echoes the learner's own text and word count", () => {
    expect(packet.policyVersion).toBe(EXTERNAL_EVALUATOR_PACKET_POLICY);
    expect(packet.learnerText).toBe(learnerText);
    expect(packet.wordCount).toBe(11);
    expect(packet.taskTitleAr).toContain("اعتذار");
  });

  it("carries only the numbers the local engine actually produced", () => {
    const report = analyzeGermanGrammarSignals({ text: learnerText });
    expect(packet.localSignalCount).toBe(report.findings.length);
    expect(packet.localUnresolvedCount).toBe(report.unresolved.length);
  });

  it("refuses to borrow an official criteria catalog when the format is free practice", () => {
    expect(packet.examFormat).toBe("none");
    expect(packet.criteria).toEqual(task.criteria);
    expect(packet.criteriaSourceAr).toContain("لا يملك هذا التطبيق فهرس معايير رسمي");
    expect(renderExternalEvaluatorPacketText(packet)).toContain("بلا ادعاء مطابقة فحص رسمي");
  });

  it("keeps every capability flag closed and states the limit in Arabic", () => {
    expect(packet.boundary).toEqual({
      canCertifyExamReadiness: false,
      canIssueOfficialResult: false,
      appClaimsHumanReview: false,
      noteAr: expect.stringContaining("لا يمنح"),
    });
  });

  it("clamps runaway input instead of shipping an unbounded packet", () => {
    const huge = buildExternalEvaluatorPacket({
      level: "B2",
      examFormat: "goethe",
      task: { ...task, criteria: Array.from({ length: 40 }, (_, index) => `معيار ${index}`) },
      learnerText: "w ".repeat(9000),
    });
    expect(huge.criteria.length).toBe(20);
    expect(huge.learnerText.length).toBeLessThan(6100);
  });
});

describe("importing a human reply keeps it human, and refuses grades", () => {
  it("records statements with their origin and never as app-verified", () => {
    const result = readExternalEvaluatorNotes({
      learnerText,
      reviewerLabel: "أ. هدى (معلمة خاصة)",
      raw: `- فعل الماضي في جملة السبب صحيح؛ راجع «weil» مع نهاية الفعل.\n- «den Schlüssel vergessen hatte» طبيعية.\n- لا تحتاج تغيير البنية العامة.`,
      now: () => new Date("2026-09-14T11:00:00.000Z"),
    });
    expect(result.reply).not.toBeNull();
    const reply = result.reply!;
    expect(reply.reviewerLabel).toContain("هدى");
    expect(reply.notes).toHaveLength(3);
    expect(reply.boundary.source).toBe("external-human-arranged-by-learner");
    expect(reply.boundary.appVerifiedTheFeedback).toBe(false);
    expect(reply.boundary.canCountTowardLevelGate).toBe(false);
  });

  it("keeps an excerpt it cannot locate but marks it unconfirmable instead of rewriting the reviewer", () => {
    const result = readExternalEvaluatorNotes({
      learnerText,
      raw: `اقتباس غير موجود: "Ich habe den Zug genommen".`,
    });
    const reply = result.reply!;
    expect(reply.notes).toHaveLength(1);
    expect(reply.unconfirmableExcerpts).toEqual(["Ich habe den Zug genommen"]);
  });

  it("refuses score, pass, certificate and CEFR-assignment phrasing in German and Arabic", () => {
    for (const raw of [
      "Ergebnis: bestanden.",
      "Deine Note: 2.",
      "Punktzahl: 84 / 100 für die Prüfung.",
      "هذه درجة رسمية تجعلك جاهزًا للامتحان.",
      "مستواك الآن B2 حسب المعايير.",
    ]) {
      const reply = readExternalEvaluatorNotes({ learnerText, raw }).reply!;
      expect(reply.refusedPhrases.length, raw).toBeGreaterThan(0);
      expect(reply.boundary.officialResultClaimedAr).toContain("رُفضت");
      expect(reply.boundary.canCertifyExamReadiness).toBe(false);
    }
  });

  it("does not invent a reply out of an empty paste", () => {
    expect(readExternalEvaluatorNotes({ learnerText, raw: "   " }).errorAr).toContain("ملاحظات المراجع");
    expect(readExternalEvaluatorNotes({ learnerText, raw: "..." }).errorAr).toContain("لم نجد ملاحظة");
  });
});
