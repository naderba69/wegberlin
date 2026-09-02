import type { CEFRLevel, DiagnosticResult, DiagnosticSkill, ErrorRecord } from "@/types/learning";
import { diagnosticForms, diagnosticLevels, diagnosticSkills, type DiagnosticFormId } from "@/data/diagnostic";

const emptyLevelRecord = (): Record<CEFRLevel, number> => ({ A1: 0, A2: 0, B1: 0, B2: 0 });
const emptySkillRecord = (): Record<DiagnosticSkill, { correct: number; attempted: number }> => ({
  grammar: { correct: 0, attempted: 0 },
  vocabulary: { correct: 0, attempted: 0 },
  reading: { correct: 0, attempted: 0 },
  listening: { correct: 0, attempted: 0 },
});

function confidenceForBoundary(levelScores: Record<CEFRLevel, number>, levelAttempted: Record<CEFRLevel, number>): "low" | "medium" | "high" {
  const boundary = [...diagnosticLevels].reverse().find((level) => levelAttempted[level] > 0) ?? "A1";
  const score = levelScores[boundary];
  return score === 0 || score === 4 ? "high" : score === 1 || score === 3 ? "medium" : "low";
}

export function evaluateDiagnostic(answers: Record<string, number>, formId: DiagnosticFormId = "A", now = new Date()): { result: DiagnosticResult; errors: ErrorRecord[] } {
  const formQuestions = diagnosticForms[formId];
  const answeredQuestions = formQuestions.filter((question) => answers[question.id] !== undefined);
  const levelScores = emptyLevelRecord();
  const levelAttempted = emptyLevelRecord();
  const skillScores = emptySkillRecord();
  const errors: ErrorRecord[] = [];
  let score = 0;

  for (const question of answeredQuestions) {
    const correct = answers[question.id] === question.correctIndex;
    levelAttempted[question.level] += 1;
    skillScores[question.skill].attempted += 1;
    if (correct) {
      score += 1;
      levelScores[question.level] += 1;
      skillScores[question.skill].correct += 1;
    } else if (question.error) {
      errors.push({ ...question.error, id: `diagnostic-${question.id}`, occurrences: 1, lastSeenAt: now.toISOString() });
    }
  }

  let estimatedLevel: CEFRLevel = "A1";
  for (const level of diagnosticLevels) {
    if (levelAttempted[level] === diagnosticSkills.length && levelScores[level] >= 3) estimatedLevel = level;
    else break;
  }

  const result: DiagnosticResult = {
    estimatedLevel,
    score,
    maxScore: answeredQuestions.length,
    levelScores,
    levelAttempted,
    skillScores,
    formId,
    questionsAnswered: answeredQuestions.length,
    stoppedEarly: answeredQuestions.length < formQuestions.length,
    confidence: confidenceForBoundary(levelScores, levelAttempted),
    completedAt: now.toISOString(),
  };
  return { result, errors };
}
