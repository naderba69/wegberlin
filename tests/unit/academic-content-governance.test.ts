// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { buildAnswerIntegrityAudit } from "@/core/content-validation/answer-integrity";
import { buildObjectiveCoverageReport } from "@/core/content-validation/objective-coverage";
import { fullLessonSchema, publishedExamTaskSchema } from "@/core/content-validation/schemas";
import { validateAcademicContent } from "@/core/content-validation/validate-academic-content";

const schema = validateAcademicContent();
const answers = buildAnswerIntegrityAudit();
const objectives = buildObjectiveCoverageReport();

describe("P0 academic schemas, answer integrity, and objective coverage", () => {
  it("validates every runtime academic root through strict nested Zod schemas", () => {
    expect(schema.ok, schema.issues.join("\n")).toBe(true);
    expect(schema.schemaFamilies).toBe(12);
    expect(schema.counts).toEqual({
      lessons: 84,
      lessonMetadata: 84,
      readingLibrary: 80,
      listeningLibrary: 80,
      diagnosticQuestions: 32,
      examTasks: 150,
      fullExamDashboards: 12,
      examProfiles: 2,
      examSources: 5,
      reviewCards: 2016,
      nounGrammarEntries: 664,
      anchorNouns: 336,
      inventoryNouns: 328,
      measuredNounTargets: 460,
      unjustifiedInventoryNouns: 0,
      nounTargetsWithoutMorphology: 0,
      verbPrepositionFrames: 262,
      derivedVerbFrames: 118,
      measuredValencyTargets: 141,
      unjustifiedDerivedFrames: 0,
      totalRootObjects: 4854,
    });
  });

  it("rejects missing nested lesson fields and unknown content keys", () => {
    const missingPrompt = structuredClone(academicLessonList[0]) as unknown as Record<string, unknown>;
    const reading = missingPrompt.reading as { questions: Array<Record<string, unknown>> };
    delete reading.questions[0].promptDe;
    expect(fullLessonSchema.safeParse(missingPrompt).success).toBe(false);

    const expanded = { ...structuredClone(academicLessonList[0]), unsupportedOfficialScore: 100 };
    expect(fullLessonSchema.safeParse(expanded).success).toBe(false);
  });

  it("rejects malformed exam answer indexes before content can publish", () => {
    const task = structuredClone(allPublishedExamTasks.find((candidate) => candidate.kind === "choice")!);
    task.items[0].correctIndex = -1;
    expect(publishedExamTaskSchema.safeParse(task).success).toBe(false);
  });

  it("links every closed answer to evidence with zero unapproved prompt leaks", () => {
    expect(answers.ok, answers.issues.join("\n")).toBe(true);
    expect(answers.rows).toHaveLength(2584);
    expect(answers.failures).toHaveLength(0);
    expect(answers.exemptions.map((row) => row.id)).toEqual(["a1-01-m4", "a2-16-e4", "diag-a-a1-vocabulary"]);
    expect(answers.rows.every((row) => row.answer.trim() && row.evidenceRef.trim() && row.evidenceExcerpt.trim())).toBe(true);
  });

  it("audits all five controlled exercise types and every receptive scope", () => {
    expect(new Set(answers.rows.filter((row) => row.scope === "lesson-controlled").map((row) => row.kind))).toEqual(new Set(["multiple-choice", "fill-blank", "word-ordering", "error-correction", "matching"]));
    expect(answers.byScope).toEqual({
      diagnostic: 32,
      exam: 720,
      "lesson-controlled": 588,
      "lesson-listening": 252,
      "lesson-mini-test": 420,
      "lesson-reading": 252,
      "library-listening": 160,
      "library-reading": 160,
    });
  });

  it("keeps productive work separate from fabricated single-answer grading", () => {
    expect(answers.productiveTasks).toHaveLength(348);
    expect(answers.productiveTasks.every((task) => task.answerPolicy === "no-single-answer" || task.answerPolicy === "model-after-commit")).toBe(true);
    expect(new Set(answers.productiveTasks.map((task) => task.scope))).toEqual(new Set(["lesson-writing", "lesson-speaking", "lesson-mediation", "exam-writing", "exam-speaking"]));
  });

  it("maps every lesson objective to teaching, practice, and assessment surfaces", () => {
    expect(objectives.ok, objectives.issues.join("\n")).toBe(true);
    expect(objectives.rows).toHaveLength(336);
    expect(objectives.byLevel).toEqual({
      A1: { objectives: 96, covered: 96, gaps: 0 },
      A2: { objectives: 96, covered: 96, gaps: 0 },
      B1: { objectives: 96, covered: 96, gaps: 0 },
      B2: { objectives: 48, covered: 48, gaps: 0 },
    });
    expect(objectives.rows.every((row) => row.taughtIn.length && row.practicedIn.length && row.assessedIn.length && row.status === "covered")).toBe(true);
  });

  it("uses unique stable report IDs and the canonical fourteen-stage contract", () => {
    expect(new Set(objectives.rows.map((row) => row.objectiveId)).size).toBe(336);
    expect(objectives.rows[0].objectiveId).toBe("a1-01-objective-1");
    expect(objectives.canonicalStages).toHaveLength(14);
  });

  it("commits human-readable and machine-readable reports with one content hash", () => {
    const schemaReport = readFileSync("docs/generated/ACADEMIC_SCHEMA_REPORT.md", "utf8");
    const answerReport = readFileSync("docs/generated/ANSWER_INTEGRITY_REPORT.md", "utf8");
    const coverageReport = readFileSync("docs/generated/OBJECTIVE_COVERAGE_REPORT.md", "utf8");
    const machine = JSON.parse(readFileSync("reports/academic-content-audit.json", "utf8"));
    expect(schemaReport).toContain(machine.contentSha256);
    expect(answerReport).toContain(machine.contentSha256);
    expect(coverageReport).toContain(machine.contentSha256);
    expect(machine.answerIntegrity.rows).toHaveLength(2584);
    expect(machine.objectiveCoverage.rows).toHaveLength(336);
  });
});
