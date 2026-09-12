import { describe, expect, it } from "vitest";
import { GUIDED_MEDIATION_POLICY, mediationStarter } from "@/core/mediation/guidance";

describe("guided mediation from understanding to free production", () => {
  it("gives the first A1 lesson a concrete goal and source-grounded starting plan", () => {
    const starter = mediationStarter("a1-01", "A1");
    expect(GUIDED_MEDIATION_POLICY).toBe("guided-mediation-from-understanding-to-free-v1");
    expect(starter.guided).toBe(true);
    expect(starter.audience).toContain("صديق");
    expect(starter.purpose).toContain("اسمه");
    expect(starter.keyFacts).toEqual(expect.arrayContaining([
      expect.stringContaining("اسمه"),
      expect.stringContaining("كتابة"),
    ]));
  });

  it("does not invent facts for a task without an authored starter", () => {
    const starter = mediationStarter("a1-02", "A1");
    expect(starter.guided).toBe(false);
    expect(starter.keyFacts).toEqual(["", "", ""]);
    expect(starter.goalAr).toContain("ستفهم");
  });
});
