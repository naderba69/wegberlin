import { describe, expect, it } from "vitest";
import * as telc from "@/core/writing/telc-criteria";
import { learningStateSchema } from "@/core/portability/schema";

const submissionSchema = learningStateSchema.shape.writingSubmissions.element;

const baseSubmission = {
  id: "writing-test-1",
  taskId: "b2-writing-1",
  text: "Sehr geehrte Damen und Herren, ich schreibe Ihnen wegen meiner Reise.",
  wordCount: 12,
  version: 1,
  status: "submitted" as const,
  feedback: [],
  createdAt: "2026-10-10T10:00:00.000Z",
  updatedAt: "2026-10-10T10:00:00.000Z",
};

describe("معايير telc للتقييم الذاتي", () => {
  it("تحمل الأسماء الرسمية الثلاثة من كتيب telc كما هي", () => {
    expect(telc.TELC_CRITERIA.map((criterion) => criterion.nameDe)).toEqual([
      "Aufgabenbewältigung",
      "Kommunikative Gestaltung",
      "Formale Richtigkeit",
    ]);
    expect(telc.TELC_CRITERION_IDS).toEqual(["aufgabenbewaeltigung", "kommunikative-gestaltung", "formale-richtigkeit"]);
  });

  it("لكل معيار وصف عربي غير فارغ لكل مستوى A–D", () => {
    for (const criterion of telc.TELC_CRITERIA) {
      for (const level of telc.TELC_LEVELS) {
        expect(criterion.levels[level].trim().length).toBeGreaterThan(20);
      }
    }
  });

  it("لا يوجد أي تجميع للمستويات في درجة أو مجموع أو نسبة في الوحدة", () => {
    const exported = Object.keys(telc);
    expect(exported.filter((name) => /total|score|sum|percent|pass|grade/i.test(name))).toEqual([]);
  });

  it("لا يُعتبر التقييم مكتملًا إلا باختيار مستوى لكل معيار", () => {
    expect(telc.isTelcSelectionComplete({})).toBe(false);
    expect(telc.isTelcSelectionComplete({ aufgabenbewaeltigung: "A", "kommunikative-gestaltung": "B" })).toBe(false);
    expect(telc.isTelcSelectionComplete({ aufgabenbewaeltigung: "A", "kommunikative-gestaltung": "B", "formale-richtigkeit": "D" })).toBe(true);
  });

  it("يقبل مخطط الحفظ التقييم الكامل ويرفض الناقص أو المستوى غير المعروف أو حقولًا زائدة", () => {
    const valid = {
      ...baseSubmission,
      telcSelfAssessment: {
        policyVersion: "telc-criteria-self-assessment-v1",
        assessedAt: "2026-10-10T10:05:00.000Z",
        levels: { aufgabenbewaeltigung: "B", "kommunikative-gestaltung": "B", "formale-richtigkeit": "C" },
      },
    };
    expect(submissionSchema.safeParse(valid).success).toBe(true);
    expect(submissionSchema.safeParse({ ...baseSubmission }).success).toBe(true);

    const missingCriterion = { ...valid, telcSelfAssessment: { ...valid.telcSelfAssessment, levels: { aufgabenbewaeltigung: "B" } } };
    expect(submissionSchema.safeParse(missingCriterion).success).toBe(false);

    const unknownLevel = { ...valid, telcSelfAssessment: { ...valid.telcSelfAssessment, levels: { ...valid.telcSelfAssessment.levels, "formale-richtigkeit": "E" } } };
    expect(submissionSchema.safeParse(unknownLevel).success).toBe(false);

    const extraField = { ...valid, telcSelfAssessment: { ...valid.telcSelfAssessment, score: 45 } };
    expect(submissionSchema.safeParse(extraField).success).toBe(false);
  });
});
