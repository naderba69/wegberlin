import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  NURSING_LAYER_DISCLAIMER_AR,
  NURSING_LAYER_RULES_AR,
  NURSING_LAYER_WORD_BUDGET,
  NURSING_PROFESSIONAL_WORDS,
  NURSING_ROLLBACK_BREAKER,
  nursingLayerUnits,
  nursingReviewWordsTsv,
} from "@/data/nursing-layer-registry";
import { NURSING_ACCEPTED_KIND_BY_LEVEL, NURSING_CLUSTER_BY_LEVEL, buildNursingLayerAudit, germanSurfaces } from "@/core/content-validation/nursing-layer";
import {
  NURSING_PRACTICE_POLICY,
  evaluateNursingChoice,
  nursingReviewTsvForLesson,
  nursingUnitsForLesson,
  summarizeNursingPractice,
} from "@/core/nursing/safety-practice";
import type { NursingLayerUnit } from "@/types/nursing-layer";

const REJECTION_KINDS = ["guess", "act-now", "silent-agreement"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("woven nursing layer (ADR-080)", () => {
  it("passes its own audit with the authored coverage per level", () => {
    const audit = buildNursingLayerAudit();
    expect(audit.issues).toEqual([]);
    expect(audit.ok).toBe(true);
    expect(audit.unitCount).toBe(14);
    expect(audit.byLevel).toEqual({ A1: 4, A2: 4, B1: 3, B2: 3 });
    expect(audit.professionalReviews).toBe(0);
    expect(audit.pendingProfessionalReview).toBe(14);
    expect(audit.masteryEffect).toBe("none");
    expect(audit.gateEffect).toBe("none");
    expect(audit.examEffect).toBe("none");
  });

  it("trains one safety cluster per level, from recognition to documentation", () => {
    expect(NURSING_CLUSTER_BY_LEVEL).toEqual({ A1: "recognition", A2: "confirmation", B1: "questioning", B2: "documentation" });
    expect(NURSING_ACCEPTED_KIND_BY_LEVEL).toEqual({ A1: "recognize", A2: "confirm", B1: "ask", B2: "document" });
    for (const unit of nursingLayerUnits) {
      expect(unit.cluster).toBe(NURSING_CLUSTER_BY_LEVEL[unit.level]);
      const accepted = unit.safetyTask.options.filter((option) => !REJECTION_KINDS.includes(option.kind));
      expect(accepted).toHaveLength(1);
      expect(accepted[0].kind).toBe(NURSING_ACCEPTED_KIND_BY_LEVEL[unit.level]);
    }
  });

  it("fails guessing by design and never needs clinical knowledge to answer", () => {
    const audit = buildNursingLayerAudit();
    expect(audit.failedGuessOptionCount).toBeGreaterThanOrEqual(nursingLayerUnits.length);
    for (const unit of nursingLayerUnits) {
      const guessIndex = unit.safetyTask.options.findIndex((option) => option.kind === "guess");
      const outcome = evaluateNursingChoice(unit, guessIndex);
      expect(outcome.status).toBe("rejected");
      expect(outcome.confirmationRequired).toBe(false);
      expect(outcome.masteryEffect).toBe("none");
      expect(outcome.evidenceEffect).toBe("none");
      expect(outcome.gateEffect).toBe("none");
      const acceptedIndex = unit.safetyTask.options.findIndex((option) => !REJECTION_KINDS.includes(option.kind));
      const accepted = evaluateNursingChoice(unit, acceptedIndex);
      expect(accepted.status).toBe("accepted");
      expect(accepted.confirmationRequired).toBe(true);
      // The accepted action is a language act, never an act on a body or a dose.
      expect(unit.safetyTask.options[acceptedIndex].textDe).toBeTruthy();
      expect(/\b(Tablette|Tropfen|Spritze|Dosierung)\b/u.test(unit.safetyTask.options[acceptedIndex].textDe)).toBe(false);
    }
  });

  it("keeps A1/A2 free of professional words and B1+ inside the declared budget", () => {
    const audit = buildNursingLayerAudit();
    for (const level of ["A1", "A2"] as const) {
      expect(NURSING_LAYER_WORD_BUDGET[level]).toBe(0);
      for (const unit of nursingLayerUnits.filter((item) => item.level === level)) {
        expect(unit.reviewWords).toEqual([]);
        for (const word of NURSING_PROFESSIONAL_WORDS) {
          const stem = word.replace(/^(die|der|das) /u, "");
          expect(germanSurfaces(unit).some((surface) => surface.toLowerCase().includes(stem.toLowerCase()))).toBe(false);
        }
      }
    }
    for (const level of ["B1", "B2"] as const) {
      const words = new Set(nursingLayerUnits.filter((item) => item.level === level).flatMap((item) => item.reviewWords.map((word) => word.de)));
      expect(words.size).toBeLessThanOrEqual(NURSING_LAYER_WORD_BUDGET[level]);
      expect(words.size).toBeGreaterThan(0);
    }
    expect(audit.reviewWordCount).toBe(8);
    expect(audit.reviewWordBudget).toBe(8);
  });

  it("carries the clinical-advice disclaimer and the three strict rules on every unit", () => {
    expect(NURSING_LAYER_DISCLAIMER_AR).toBe("هذه صياغات لغوية لا إرشاد سريري");
    expect(NURSING_LAYER_RULES_AR).toHaveLength(3);
    for (const unit of nursingLayerUnits) {
      expect(unit.disclaimerAr).toBe(NURSING_LAYER_DISCLAIMER_AR);
      expect(unit.professionalReview).toBe("pending-nursing-professional");
      expect(unit.reviewStatus).toBe("authored-review-pending");
      expect(unit.reusedTheoryIds.length).toBeGreaterThan(0);
    }
    expect(NURSING_ROLLBACK_BREAKER.layerRemovable).toBe(true);
    expect(NURSING_ROLLBACK_BREAKER.ifDropsPercentagePoints).toBe(5);
    expect(NURSING_ROLLBACK_BREAKER.actionAr).toContain("الشهادة العامة");
  });

  it("is parasitic: no gate, exam, evidence, review or lesson module imports or mentions it", () => {
    const roots = ["src/core/exams", "src/core/lessons", "src/core/evidence", "src/core/review", "src/core/assessment", "src/core/diagnostic", "src/core/portability"];
    const hits = roots.flatMap((root) => walk(root).filter((file) => /nursing/i.test(readFileSync(file, "utf8"))));
    expect(hits).toEqual([]);
    const importers = walk("src").filter((file) => /nursing-layer-registry|core\/nursing\/safety-practice/.test(readFileSync(file, "utf8")));
    // The registry is the single definition site; nothing else in src/ may import it.
    expect(importers.sort()).toEqual([
      "src/components/nursing-layer-panel.tsx",
      "src/core/content-validation/nursing-layer.ts",
      "src/core/nursing/safety-practice.ts",
    ]);
    // The layer is reachable from lessons by exactly one mounting point.
    const lessonRunner = readFileSync("src/components/lesson-runner.tsx", "utf8");
    expect(lessonRunner.match(/NursingLayerPanel/g)).toHaveLength(2);
  });

  it("keeps practice local and summary-only", () => {
    const unit: NursingLayerUnit = nursingLayerUnits.find((item) => item.level === "A2")!;
    const outcomes = unit.safetyTask.options.map((_option, index) => evaluateNursingChoice(unit, index));
    const summary = summarizeNursingPractice(unit, outcomes);
    expect(summary.policyVersion).toBe(NURSING_PRACTICE_POLICY);
    expect(summary.answered).toBe(4);
    expect(summary.acceptedCount).toBe(1);
    expect(summary.rejectedCount).toBe(3);
    expect(summary.guessRejectedCount).toBeGreaterThanOrEqual(1);
    expect(summary.confirmationSeen).toBe(true);
    expect(summary.masteryEffect).toBe("none");
    expect(summary.evidenceEffect).toBe("none");
    expect(summary.gateEffect).toBe("none");
    expect(summary.disclaimerAr).toBe(NURSING_LAYER_DISCLAIMER_AR);
    expect(() => summarizeNursingPractice(unit, [...outcomes, outcomes[0]])).toThrow();
  });

  it("hands B1+ words to the existing TSV importer without writing to storage", () => {
    const tsv = nursingReviewTsvForLesson("b1-04")!;
    expect(tsv.split("\n")[0]).toBe("German\tArabic\tExample\tTags");
    expect(tsv).toContain("die Übergabe");
    expect(tsv).toContain("nursing-layer-B1");
    expect(nursingReviewTsvForLesson("a1-22")).toBeNull();
    expect(nursingReviewWordsTsv(nursingLayerUnits.filter((item) => item.level === "B2")).split("\n").length).toBeGreaterThan(1);
    expect(nursingUnitsForLesson("b1-04")).toHaveLength(1);
    expect(nursingUnitsForLesson("a1-01")).toHaveLength(1);
    expect(nursingUnitsForLesson("a1-02")).toHaveLength(0);
  });
});
