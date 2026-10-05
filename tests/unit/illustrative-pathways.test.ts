// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import offlineManifest from "../../public/offline-routes.json";
import {
  ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS,
  ILLUSTRATIVE_PATHWAYS_NOTICE_AR,
  ILLUSTRATIVE_PATHWAYS_POLICY_VERSION,
  illustrativeLearningPathways,
} from "@/core/planning/illustrative-pathways";

describe("P2-276 illustrative learning pathways", () => {
  it("labels authored scenarios as hypothetical rather than learner or outcome evidence", () => {
    expect(ILLUSTRATIVE_PATHWAYS_POLICY_VERSION).toBe("illustrative-learning-pathways-v1");
    expect(ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS).toBe("authored-hypothetical-guidance-only");
    expect(ILLUSTRATIVE_PATHWAYS_NOTICE_AR).toContain("ليست شهادات متعلمين");
    expect(ILLUSTRATIVE_PATHWAYS_NOTICE_AR).toContain("لا تعرض نتائج مقاسة");
    expect(illustrativeLearningPathways).toHaveLength(3);
    expect(new Set(illustrativeLearningPathways.map((pathway) => pathway.id)).size).toBe(3);

    for (const pathway of illustrativeLearningPathways) {
      expect(pathway.evidenceStatus).toBe(ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS);
      expect(pathway.outcomeClaim).toBe(false);
      for (const prohibitedEvidenceField of ["learnerName", "testimonial", "quote", "measuredOutcome", "timeToLevel", "examScore"]) {
        expect(pathway).not.toHaveProperty(prohibitedEvidenceField);
      }
      expect(pathway.steps).toHaveLength(3);
      expect(pathway.reflectionPromptAr.trim()).not.toBe("");
      expect(pathway.boundaryAr.trim()).not.toBe("");
    }
  });

  it("links every suggested action to a route present in every Offline pack", () => {
    for (const pack of offlineManifest.packs) {
      for (const pathway of illustrativeLearningPathways) {
        for (const step of pathway.steps) {
          expect(step.href, `${pack.id}: ${pathway.id} -> ${step.href}`).toMatch(/^\/[a-z0-9/-]+$/);
          expect(pack.routes, `${pack.id} is missing ${step.href}`).toContain(step.href);
          expect(step.linkLabelAr.trim()).not.toBe("");
        }
      }
    }
  });

  it("is a static, non-persisting section on the existing practice route", () => {
    const component = readFileSync("src/components/illustrative-pathways.tsx", "utf8");
    const hub = readFileSync("src/components/practice-hub.tsx", "utf8");
    expect(hub).toContain("<IllustrativePathways/>");
    expect(component).toContain("data-illustrative-pathways-policy={ILLUSTRATIVE_PATHWAYS_POLICY_VERSION}");
    expect(component).toContain("<details>");
    expect(component).not.toContain("useLearning");
    for (const persistenceOrNetworkApi of ["localStorage", "sessionStorage", "indexedDB", "fetch("]) {
      expect(component).not.toContain(persistenceOrNetworkApi);
    }
  });
});
