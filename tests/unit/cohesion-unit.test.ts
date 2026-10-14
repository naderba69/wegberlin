// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COHESION_BOUNDARY, COHESION_POLICY, checkCohesionRewrite, cohesionItems, cohesionItemById, summarizeCohesionCoverage } from "@/core/training/cohesion";

/**
 * حارس وحدة التماسك (P1-12): العقد هو أن كل نموذج مؤلَّف **يُقبل** وكل خطأ شائع **يُرفض**.
 * هذا يمنع أن يكون الفحص مدحًا للتطبيق أو عقبة كاذبة للمتعلّم.
 */
describe("cohesion unit before B1", () => {
  it("authors the four core connectors demanded by the audit plus their neighbours", () => {
    const connectors = cohesionItems.map((item) => item.connectorDe);
    for (const required of ["deshalb", "trotzdem", "obwohl", "damit"]) expect(connectors).toContain(required);
    expect(cohesionItems.length).toBe(12);
    const coverage = summarizeCohesionCoverage();
    expect(coverage.a2).toBeGreaterThanOrEqual(4);
    expect(coverage.b1).toBeGreaterThanOrEqual(5);
    expect(coverage.models).toBe(cohesionItems.length * 2);
    expect(coverage.withCommonError).toBe(cohesionItems.length);
    expect(coverage.withNuance).toBe(cohesionItems.length);
    expect(coverage.policyVersion).toBe(COHESION_POLICY);
    expect(new Set(cohesionItems.map((item) => item.id)).size).toBe(cohesionItems.length);
  });

  it("accepts every authored model and rejects every authored common error", () => {
    for (const item of cohesionItems) {
      expect(item.modelsDe.length, `${item.id} must offer more than one acceptable rewrite`).toBeGreaterThanOrEqual(2);
      for (const model of item.modelsDe) {
        const result = checkCohesionRewrite({ item, text: model });
        expect(result.issuesAr, `${item.id} rejected its own model: ${model}`).toEqual([]);
        expect(result.ok).toBe(true);
      }
      const error = checkCohesionRewrite({ item, text: item.commonErrorDe });
      expect(error.ok, `${item.id} accepted its own common error: ${item.commonErrorDe}`).toBe(false);
      expect(error.issuesAr.length).toBeGreaterThan(0);
      expect(error.boundaryAr).toBe(COHESION_BOUNDARY);
    }
  });

  it("names the exact rule that was broken instead of a generic 'wrong'", () => {
    const obwohl = cohesionItemById.get("coh-obwohl-zeit")!;
    const missingVerbFinal = checkCohesionRewrite({ item: obwohl, text: "Obwohl ich habe wenig Zeit, helfe ich dir." });
    expect(missingVerbFinal.verbFinal).toBe(false);
    expect(missingVerbFinal.issuesAr.join(" ")).toContain("الفعل المصرف في الجملة الفرعية يجب أن يكون في النهاية");

    const trotzdem = cohesionItemById.get("coh-trotzdem-regen")!;
    const subjectFirst = checkCohesionRewrite({ item: trotzdem, text: "Es regnet stark, trotzdem wir gehen spazieren." });
    expect(subjectFirst.verbSecond).toBe(false);
    expect(subjectFirst.issuesAr.join(" ")).toContain("بعد الظرف الرابط يأتي الفعل المصرف مباشرة");

    const damtt = cohesionItemById.get("coh-damit-deutsch")!;
    const oneClause = checkCohesionRewrite({ item: damtt, text: "Ich spreche langsam, damit." });
    expect(oneClause.bothClausesPresent).toBe(false);
    expect(oneClause.issuesAr.join(" ")).toContain("إحدى الفكرتين مفقودة");

    expect(checkCohesionRewrite({ item: obwohl, text: "obwohl zeit helfe" }).punctuation).toBe(false);
    expect(() => checkCohesionRewrite({ item: { ...obwohl, id: "unknown" }, text: "egal" })).toThrow();
  });

  it("is reachable in the practice hub and the route is declared", () => {
    const hub = readFileSync("src/components/practice-hub.tsx", "utf8");
    expect(hub).toContain('href:"/practice/cohesion"');
    const page = readFileSync("src/app/practice/cohesion/page.tsx", "utf8");
    expect(page).toContain("CohesionLab");
    const lab = readFileSync("src/components/cohesion-lab.tsx", "utf8");
    expect(lab).toContain("data-cohesion-policy={COHESION_POLICY}");
    expect(lab).toContain("data-cohesion-check={check.ok ? \"pass\" : \"issues\"}");
    expect(lab).toContain("سؤال الموازنة");
  });

  it("persists attempts as portable evidence with an explicit boundary and reset bucket", () => {
    const schema = readFileSync("src/core/portability/schema.ts", "utf8");
    expect(schema).toContain('policyVersion:z.literal("cohesion-unit-v1")');
    expect(schema).toContain('rule-based-rewrite-check-not-style-or-fluency-assessment');
    const merge = readFileSync("src/core/portability/merge.ts", "utf8");
    expect(merge).toContain("cohesionRewriteAttempts:byId(current.cohesionRewriteAttempts??[],incoming.cohesionRewriteAttempts??[])");
    const resetPlan = readFileSync("src/core/state/reset-plan.ts", "utf8");
    expect(resetPlan).toContain('field: "cohesionRewriteAttempts"');
    const types = readFileSync("src/types/learning.ts", "utf8");
    expect(types).toContain("cohesionRewriteAttempts: CohesionRewriteAttempt[]");
  });
});
