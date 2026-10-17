import { describe, expect, it } from "vitest";
import {
  ANONYMOUS_RESPONSE_EXPORT_CONSENT_AR,
  ANONYMOUS_RESPONSE_EXPORT_LIMIT_AR,
  MIN_RESPONSES_PER_ITEM,
  buildAnonymousResponseExport,
  calibrateItems,
  parseAnonymousResponseCsv,
  parseAnonymousResponseFiles,
} from "@/core/assessment/item-calibration";

const attempt = (exerciseId: string, correct: boolean, createdAt: string) => ({ exerciseId, correct, createdAt, answer: "Ich heiße Omar", lessonId: "a1-01", id: `${exerciseId}-${createdAt}` });

describe("P2-350 المساهمة الاختيارية بملف إجابات مختصر (ADR-120)", () => {
  it("يصدّر المحاولة الأولى فقط لكل سؤال، بعمودين فقط وبلا نص الإجابة أو الوقت", () => {
    const { csv, rows } = buildAnonymousResponseExport([
      attempt("a1-01-rq1", true, "2026-10-02T10:00:00.000Z"),
      attempt("a1-01-rq1", false, "2026-10-01T09:00:00.000Z"),
      attempt("a1-01-rq2", true, "2026-10-01T09:05:00.000Z"),
    ], () => 0.5);
    expect(rows).toBe(2);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("itemId,correct");
    expect(lines.slice(1).sort()).toEqual(["a1-01-rq1,0", "a1-01-rq2,1"]);
    expect(csv).not.toMatch(/Omar|2026|a1-01,|:/u);
    expect(parseAnonymousResponseCsv(csv).errors).toEqual([]);
  });

  it("يستبعد المعرفات غير الصالحة مثل محاولات العبارات ذات النقطتين", () => {
    const { rows } = buildAnonymousResponseExport([attempt("a1-01:four-skill-phrase:1", true, "2026-10-01T09:00:00.000Z"), attempt("a1-01-rq1", true, "2026-10-01T09:00:00.000Z")]);
    expect(rows).toBe(1);
  });

  it("يخلط ترتيب الأسطر فلا يكشف تسلسل الدراسة", () => {
    const attempts = Array.from({ length: 12 }, (_, index) => attempt(`b1-01-q${index + 1}`, index % 2 === 0, `2026-10-01T09:${String(index).padStart(2, "0")}:00.000Z`));
    let seed = 7;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const order = buildAnonymousResponseExport(attempts, random).csv.trim().split("\n").slice(1).map((line) => line.split(",")[0]);
    expect(order).not.toEqual(attempts.map((item) => item.exerciseId));
    expect([...order].sort()).toEqual(attempts.map((item) => item.exerciseId).sort());
  });

  it("الحد الأدنى يساوي متعلمين مختلفين: ثلاثون ملفًا تعطي نسبة، وتسعة وعشرون لا", () => {
    const file = (correct: boolean) => buildAnonymousResponseExport([attempt("b2-05-rq1", correct, "2026-10-01T09:00:00.000Z"), attempt("b2-05-rq1", !correct, "2026-10-02T09:00:00.000Z")]).csv;
    const pooled = (count: number) => parseAnonymousResponseFiles(Array.from({ length: count }, (_, index) => file(index % 3 !== 0)));
    expect(MIN_RESPONSES_PER_ITEM).toBe(30);
    expect(calibrateItems(pooled(29).rows)[0]).toMatchObject({ responses: 29, pCorrect: null, band: "insufficient-data" });
    expect(calibrateItems(pooled(30).rows)[0]).toMatchObject({ responses: 30, pCorrect: 0.67, band: "no-flag" });
  });

  it("يرقّم أخطاء كل ملف عند الدمج ولا يقبل ملفًا فيه عمود إضافي", () => {
    const parsed = parseAnonymousResponseFiles(["itemId,correct\na1-01-rq1,1\n", "itemId,correct,learner\nx,1,abc"]);
    expect(parsed.errors).toEqual(["file-2-header-must-be-exactly-itemId,correct"]);
  });

  it("نص الموافقة يذكر ما يُستبعد، ونص الحدود يعترف بأن الملف المفرد غير مجهول", () => {
    for (const phrase of ["اسمي", "نص إجاباتي", "أوقاتها", "جهازي", "عشوائي", "لا يُرسل شيء تلقائيًا"]) expect(ANONYMOUS_RESPONSE_EXPORT_CONSENT_AR).toContain(phrase);
    for (const phrase of ["يعرف أنه منك", "ثلاثين متعلمًا", "تكشف إجابة كل واحد"]) expect(ANONYMOUS_RESPONSE_EXPORT_LIMIT_AR).toContain(phrase);
    expect(`${ANONYMOUS_RESPONSE_EXPORT_CONSENT_AR}${ANONYMOUS_RESPONSE_EXPORT_LIMIT_AR}`).not.toMatch(/[A-Za-z]/u);
  });
});
