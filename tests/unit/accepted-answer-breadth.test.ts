// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { normalizeGermanText } from "@/core/lesson/evaluate";

/**
 * البند P1-11: كل بديل مقبول يجب أن يكون **قابلًا للوصول** (لا يتطابق بعد التطبيع مع بديل آخر)
 * وأن يكون مبرَّرًا في الشرح العربي. والعدد الباقي بإجابة واحدة موثَّق الأسباب في قائمة العمل،
 * فلا يُقرأ عيبًا عامًّا.
 */
describe("accepted-answer breadth (P1-11)", () => {
  it("keeps every listed variant reachable after normalization", () => {
    let multi = 0;
    for (const lesson of academicLessonList) {
      for (const exercise of lesson.exercises) {
        const answers = "acceptedAnswers" in exercise ? exercise.acceptedAnswers ?? [] : [];
        if (answers.length < 2) continue;
        multi += 1;
        const normalized = answers.map((answer) => normalizeGermanText(answer));
        expect(new Set(normalized).size, `${exercise.id} lists answers that normalize onto each other`).toBe(answers.length);
      }
    }
    expect(multi).toBeGreaterThanOrEqual(47);
  });

  it("carries the newly broadened a1-21 variant with its authored justification", () => {
    const exercise = academicLessonList.flatMap((lesson) => lesson.exercises).find((item) => item.id === "a1-21-e4")!;
    const answers = "acceptedAnswers" in exercise ? exercise.acceptedAnswers ?? [] : [];
    expect(answers).toContain("Ich muss in Hannover umsteigen");
    expect(answers).toContain("In Hannover umsteigen muss ich");
    expect("explanationAr" in exercise ? exercise.explanationAr : "").toContain("يجوز تقديم الجار والمجرور");
  });

  it("shows the accepted alternates only after checking, with the reason", () => {
    const card = readFileSync("src/components/exercise-card.tsx", "utf8");
    expect(card).toContain('data-accepted-alternates={acceptedAlternates.length}');
    expect(card).toContain("كل صياغة تولّي الفعل المصرف موضعه نفسه");
    expect(card).toContain("لا نعرضها قبل المحاولة");
  });

  it("documents why the remaining single-answer exercises are legitimate", () => {
    const worklist = readFileSync("reports/accepted-answer-worklist.md", "utf8");
    expect(worklist).toContain("جملة قصيرة جدًا");
    expect(worklist).toContain("نص فرعي أو مجموعة المصدر");
    expect(worklist).toContain("تحتاج قرار مؤلِّف");
    const report = JSON.parse(readFileSync("reports/accepted-answer-hygiene-audit.json", "utf8")) as { productiveExercises: number; acceptsExactlyOneString: number; multiVariantExercises: number; noOpVariantCount: number };
    expect(report.productiveExercises).toBe(387);
    expect(report.acceptsExactlyOneString).toBeLessThanOrEqual(340);
    expect(report.multiVariantExercises).toBeGreaterThanOrEqual(47);
    expect(report.noOpVariantCount).toBe(0);
  });
});
