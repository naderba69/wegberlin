import { describe, expect, it } from "vitest";
import {
  RESULT_ANNOUNCEMENT_POLICY_VERSION,
  continuousTaskMessage,
  diagnosticResultMessage,
  examResultMessage,
  labDimensionMessage,
  selfScoreSavedMessage,
  speakingSavedMessage,
} from "@/core/a11y/result-announcements";

const messages = [
  examResultMessage({ score: 7, total: 10, kindAr: "نتيجة تدريب القراءة التفصيلية" }),
  labDimensionMessage({ passed: 3, total: 5, labelAr: "نتيجة فحص الكتابة" }),
  speakingSavedMessage({ seconds: 42, criteriaChecked: 2, criteriaTotal: 4 }),
  diagnosticResultMessage({ level: "A2", score: 9, maxScore: 16 }),
  continuousTaskMessage({ completed: 2, total: 5 }),
  selfScoreSavedMessage({ score: 4, max: 5, labelAr: "التقييم الذاتي للمحادثة" }),
];

describe("P0-256: considered result announcements for labs and exams", () => {
  it("states the outcome and the numbers in one short sentence", () => {
    for (const message of messages) {
      expect(message.length, message).toBeGreaterThan(20);
      expect(message.length, message).toBeLessThan(160);
      expect(/\d/u.test(message), message).toBe(true);
    }
    expect(RESULT_ANNOUNCEMENT_POLICY_VERSION).toBe("result-announcement-v1");
  });

  it("never announces an empty or partial announcement before the result", () => {
    // المذيع يبقى فارغًا قبل النتيجة؛ رسالة فارغة لا تُقرأ.
    expect(examResultMessage({ score: 0, total: 0, kindAr: "" })).not.toBe("");
    for (const message of messages) expect(message.trim(), message).toBe(message);
  });

  it("keeps the honest boundary inside the announcement itself", () => {
    // لا تتحول النتيجة إلى درجة رسمية ولا إلى تقييم آلي في نص الإعلان.
    expect(examResultMessage({ score: 7, total: 10, kindAr: "نتيجة" })).toContain("ليست نقاطًا رسمية");
    expect(labDimensionMessage({ passed: 3, total: 5, labelAr: "نتيجة" })).toContain("ليست درجة امتحان");
    expect(speakingSavedMessage({ seconds: 42, criteriaChecked: 2, criteriaTotal: 4 })).toContain("لا تقييم آلي للنطق");
    expect(diagnosticResultMessage({ level: "A2", score: 9, maxScore: 16 })).toContain("ليس شهادة");
    expect(selfScoreSavedMessage({ score: 4, max: 5, labelAr: "التقييم الذاتي" })).toContain("ليس قياسًا آليًا");
    expect(continuousTaskMessage({ completed: 2, total: 5 })).toContain("لن تظهر الحلول");
  });

  it("carries the same figures the visible panel shows", () => {
    expect(examResultMessage({ score: 7, total: 10, kindAr: "نتيجة" })).toContain("7 من 10");
    expect(labDimensionMessage({ passed: 3, total: 5, labelAr: "نتيجة" })).toContain("3 من 5");
    expect(speakingSavedMessage({ seconds: 42, criteriaChecked: 2, criteriaTotal: 4 })).toContain("42 ثانية");
    expect(diagnosticResultMessage({ level: "A2", score: 9, maxScore: 16 })).toContain("A2");
  });

  it("does not repeat the whole feedback panel: no markup, no headings, one line", () => {
    for (const message of messages) {
      expect(message, message).not.toContain("<");
      expect(message, message).not.toContain("\n");
      expect(message.split(".").length, message).toBeLessThanOrEqual(4);
    }
  });
});
