import { academicLessonList } from "@/data/academic-lessons";
import { allDiagnosticQuestions } from "@/data/diagnostic";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import { listeningLibrary, readingLibrary } from "@/data/library-registry";

export type AnswerAuditStatus = "pass" | "exempt" | "fail";
export type AnswerAuditRow = {
  id: string;
  scope: "lesson-controlled" | "lesson-reading" | "lesson-listening" | "lesson-mini-test" | "library-reading" | "library-listening" | "diagnostic" | "exam";
  kind: string;
  prompt: string;
  answer: string;
  evidenceRef: string;
  evidenceExcerpt: string;
  visibilityPolicy: "hidden-key" | "hidden-target" | "authorized-option-bank" | "authorized-token-bank" | "authorized-pair-bank";
  status: AnswerAuditStatus;
  leakMatch?: string;
  exemptionReason?: string;
};

export type ProductiveTaskAuditRow = {
  id: string;
  scope: "lesson-writing" | "lesson-speaking" | "lesson-mediation" | "exam-writing" | "exam-speaking";
  prompt: string;
  reviewEvidence: string;
  answerPolicy: "no-single-answer" | "model-after-commit";
};

const explicitLeakExemptions: Record<string, string> = {
  "a1-01-m4": "A greeting can be answered by repeating the same greeting; the prompt is a communicative stimulus, not a displayed answer key.",
  "a2-16-e4": "The neutral first clause is intentionally retained while the learner removes the following unsupported opinion; this is an omission/editing task.",
  "diag-a-a1-vocabulary": "Repeating Guten Morgen is an authentic response to the greeting used as the diagnostic stimulus.",
};

function normalize(value: string, foldCase = true) {
  const normalized = value
    .normalize("NFKC")
    .replace(/\[?lücke\s*\d*\]?|_{2,}|\[\?\]/giu, " ")
    .replace(/[^\p{L}\p{N}ßäöüÄÖÜ]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  return foldCase ? normalized.toLocaleLowerCase("de-DE") : normalized;
}

function directLeak(answer: string, prompt: string) {
  const normalizedAnswer = normalize(answer);
  const normalizedPrompt = normalize(prompt);
  const casedAnswer = normalize(answer, false);
  const casedPrompt = normalize(prompt, false);
  if (normalizedAnswer.length < 3 || !normalizedPrompt) return undefined;
  const sameCaseSurface = casedAnswer === casedPrompt || casedPrompt.includes(casedAnswer);
  if (!sameCaseSurface) return undefined;
  if (normalizedAnswer === normalizedPrompt) return normalizedAnswer;
  const answerTokens = normalizedAnswer.split(" ");
  if (answerTokens.length > 1 && normalizedPrompt.includes(normalizedAnswer)) return normalizedAnswer;
  if (answerTokens.length === 1 && normalizedAnswer.length >= 4 && normalizedPrompt.split(" ").includes(normalizedAnswer)) return normalizedAnswer;
  return undefined;
}

function compact(value: string, max = 220) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function evidenceSentence(source: string, prompt: string, answer: string) {
  const sentences = source.split(/(?<=[.!?])\s+|\n+/u).map((sentence) => sentence.trim()).filter(Boolean);
  if (!sentences.length) return compact(source);
  const tokens = new Set(normalize(`${prompt} ${answer}`).split(" ").filter((token) => token.length >= 4));
  let best = sentences[0];
  let bestScore = -1;
  for (const sentence of sentences) {
    const sourceTokens = new Set(normalize(sentence).split(" "));
    let score = 0;
    for (const token of tokens) if (sourceTokens.has(token)) score += 1;
    if (score > bestScore) {
      best = sentence;
      bestScore = score;
    }
  }
  return compact(best);
}

function closedRow(input: Omit<AnswerAuditRow, "status" | "leakMatch" | "exemptionReason">, checkPrompt = true): AnswerAuditRow {
  const match = checkPrompt ? directLeak(input.answer.split(" | ")[0], input.prompt) : undefined;
  const exemptionReason = match ? explicitLeakExemptions[input.id] : undefined;
  return {
    ...input,
    status: match ? exemptionReason ? "exempt" : "fail" : "pass",
    ...(match ? { leakMatch: match } : {}),
    ...(exemptionReason ? { exemptionReason } : {}),
  };
}

export function buildAnswerIntegrityAudit() {
  const rows: AnswerAuditRow[] = [];
  const productiveTasks: ProductiveTaskAuditRow[] = [];

  for (const lesson of academicLessonList) {
    for (const exercise of lesson.exercises) {
      if (exercise.type === "multiple-choice") {
        rows.push(closedRow({
          id: exercise.id,
          scope: "lesson-controlled",
          kind: exercise.type,
          prompt: `${exercise.promptDe ?? ""} ${exercise.promptAr}`,
          answer: exercise.options[exercise.correctIndex],
          evidenceRef: `${lesson.id}:controlled:${exercise.id}:explanationAr`,
          evidenceExcerpt: compact(exercise.explanationAr),
          visibilityPolicy: "authorized-option-bank",
        }));
      } else if (exercise.type === "fill-blank") {
        rows.push(closedRow({
          id: exercise.id,
          scope: "lesson-controlled",
          kind: exercise.type,
          prompt: `${exercise.template} ${exercise.promptAr}`,
          answer: exercise.acceptedAnswers.join(" | "),
          evidenceRef: `${lesson.id}:controlled:${exercise.id}:explanationAr`,
          evidenceExcerpt: compact(exercise.explanationAr),
          visibilityPolicy: "hidden-target",
        }));
      } else if (exercise.type === "word-ordering") {
        rows.push(closedRow({
          id: exercise.id,
          scope: "lesson-controlled",
          kind: exercise.type,
          prompt: exercise.promptAr,
          answer: exercise.acceptedAnswers.join(" | "),
          evidenceRef: `${lesson.id}:controlled:${exercise.id}:explanationAr`,
          evidenceExcerpt: compact(exercise.explanationAr),
          visibilityPolicy: "authorized-token-bank",
        }, false));
      } else if (exercise.type === "error-correction") {
        rows.push(closedRow({
          id: exercise.id,
          scope: "lesson-controlled",
          kind: exercise.type,
          prompt: `${exercise.promptAr} ${exercise.sentence}`,
          answer: exercise.acceptedAnswers.join(" | "),
          evidenceRef: `${lesson.id}:controlled:${exercise.id}:explanationAr`,
          evidenceExcerpt: compact(exercise.explanationAr),
          visibilityPolicy: "hidden-target",
        }));
      } else {
        rows.push(closedRow({
          id: exercise.id,
          scope: "lesson-controlled",
          kind: exercise.type,
          prompt: exercise.promptAr,
          answer: exercise.pairs.map((pair) => `${pair.left} → ${pair.right}`).join(" | "),
          evidenceRef: `${lesson.id}:controlled:${exercise.id}:explanationAr`,
          evidenceExcerpt: compact(exercise.explanationAr),
          visibilityPolicy: "authorized-pair-bank",
        }, false));
      }
    }

    for (const [scope, questions, source] of [
      ["lesson-reading", lesson.reading.questions, lesson.reading.textDe],
      ["lesson-listening", lesson.listening.questions, lesson.listening.transcriptDe],
      ["lesson-mini-test", lesson.miniTest, ""],
    ] as const) {
      for (const question of questions) {
        const answer = question.options[question.correctIndex];
        rows.push(closedRow({
          id: question.id,
          scope,
          kind: "multiple-choice",
          prompt: `${question.promptDe} ${question.promptAr}`,
          answer,
          evidenceRef: source ? `${lesson.id}:${scope === "lesson-reading" ? "reading.textDe" : "listening.transcriptDe"}` : `${lesson.id}:miniTest:${question.id}:explanationAr`,
          evidenceExcerpt: source ? evidenceSentence(source, question.promptDe, answer) : compact(question.explanationAr),
          visibilityPolicy: "authorized-option-bank",
        }));
      }
    }

    productiveTasks.push(
      { id: `${lesson.id}-writing`, scope: "lesson-writing", prompt: `${lesson.writing.promptDe} ${lesson.writing.promptAr}`, reviewEvidence: lesson.writing.checklistAr.join(" · "), answerPolicy: "model-after-commit" },
      { id: `${lesson.id}-speaking`, scope: "lesson-speaking", prompt: `${lesson.speaking.promptDe} ${lesson.speaking.promptAr}`, reviewEvidence: lesson.speaking.successCriteriaAr.join(" · "), answerPolicy: "no-single-answer" },
      { id: `${lesson.id}-mediation`, scope: "lesson-mediation", prompt: `${lesson.mediation.sourceDe} ${lesson.mediation.taskAr}`, reviewEvidence: lesson.mediation.suggestedAr, answerPolicy: "model-after-commit" },
    );
  }

  for (const item of readingLibrary) {
    for (const question of item.questions) {
      const answer = question.options[question.correctIndex];
      rows.push(closedRow({
        id: question.id,
        scope: "library-reading",
        kind: "multiple-choice",
        prompt: `${question.promptDe} ${question.promptAr}`,
        answer,
        evidenceRef: `${item.id}:textDe`,
        evidenceExcerpt: evidenceSentence(item.textDe, question.promptDe, answer),
        visibilityPolicy: "authorized-option-bank",
      }));
    }
  }
  for (const item of listeningLibrary) {
    for (const question of item.questions) {
      const answer = question.options[question.correctIndex];
      rows.push(closedRow({
        id: question.id,
        scope: "library-listening",
        kind: "multiple-choice",
        prompt: `${question.promptDe} ${question.promptAr}`,
        answer,
        evidenceRef: `${item.id}:transcriptDe`,
        evidenceExcerpt: evidenceSentence(item.transcriptDe, question.promptDe, answer),
        visibilityPolicy: "authorized-option-bank",
      }));
    }
  }

  const listeningById = Object.fromEntries(listeningLibrary.map((item) => [item.id, item]));
  for (const question of allDiagnosticQuestions) {
    const answer = question.options[question.correctIndex];
    const source = question.contextDe ?? (question.audioItemId ? listeningById[question.audioItemId]?.transcriptDe : undefined);
    rows.push(closedRow({
      id: question.id,
      scope: "diagnostic",
      kind: question.skill,
      prompt: question.prompt,
      answer,
      evidenceRef: question.contextDe ? `${question.id}:contextDe` : question.audioItemId ? `${question.audioItemId}:transcriptDe` : `${question.id}:explanation`,
      evidenceExcerpt: source ? evidenceSentence(source, question.prompt, answer) : compact(question.explanation),
      visibilityPolicy: "authorized-option-bank",
    }));
  }

  for (const task of allPublishedExamTasks) {
    if (task.kind === "matching") {
      for (const item of task.items) {
        const option = task.options.find((candidate) => candidate.id === item.correctOptionId);
        const label = option?.labelDe ?? item.correctOptionId;
        const labelName = label.split("·").at(-1)?.trim().toLocaleLowerCase("de-DE");
        const source = task.texts.find((textItem) => labelName && textItem.labelDe.toLocaleLowerCase("de-DE").includes(labelName)) ?? task.texts[0];
        rows.push(closedRow({
          id: item.id,
          scope: "exam",
          kind: "matching",
          prompt: `${item.promptDe} ${item.promptAr}`,
          answer: label,
          evidenceRef: `${task.id}:texts:${source?.id ?? "text-bank"}`,
          evidenceExcerpt: compact(source?.textDe ?? item.explanationAr),
          visibilityPolicy: "authorized-option-bank",
        }));
      }
    } else if (task.kind === "choice") {
      for (const item of task.items) {
        const answer = item.options[item.correctIndex];
        rows.push(closedRow({
          id: item.id,
          scope: "exam",
          kind: "choice",
          prompt: `${item.promptDe} ${item.promptAr}`,
          answer,
          evidenceRef: `${task.id}:textDe`,
          evidenceExcerpt: evidenceSentence(task.textDe, item.promptDe, answer),
          visibilityPolicy: "authorized-option-bank",
        }));
      }
    } else if (task.kind === "listening") {
      for (const item of task.items) {
        const answer = item.options[item.correctIndex];
        const clip = task.clips.find((candidate) => candidate.id === item.clipId);
        rows.push(closedRow({
          id: item.id,
          scope: "exam",
          kind: "listening",
          prompt: `${item.promptDe} ${item.promptAr}`,
          answer,
          evidenceRef: `${task.id}:clips:${item.clipId}`,
          evidenceExcerpt: evidenceSentence(clip?.transcriptDe ?? item.explanationAr, item.promptDe, answer),
          visibilityPolicy: "authorized-option-bank",
        }));
      }
    } else if (task.kind === "writing") {
      for (const choice of task.choices) productiveTasks.push({
        id: `${task.id}:${choice.id}`,
        scope: "exam-writing",
        prompt: `${task.instructionsDe} ${choice.situationDe} ${choice.guidingPointsDe.join(" ")}`,
        reviewEvidence: choice.checklistAr.join(" · "),
        answerPolicy: "no-single-answer",
      });
    } else {
      for (const choice of task.choices) productiveTasks.push({
        id: `${task.id}:${choice.id}`,
        scope: "exam-speaking",
        prompt: `${task.instructionsDe} ${choice.situationDe} ${choice.bulletPointsDe.join(" ")}`,
        reviewEvidence: task.selfCriteriaAr.join(" · "),
        answerPolicy: "no-single-answer",
      });
    }
  }

  const issues: string[] = [];
  const ids = new Set<string>();
  for (const row of rows) {
    if (ids.has(row.id)) issues.push(`${row.id}: duplicate answer-audit ID`);
    ids.add(row.id);
    if (!row.answer.trim()) issues.push(`${row.id}: empty answer`);
    if (!row.evidenceRef.trim() || !row.evidenceExcerpt.trim()) issues.push(`${row.id}: missing evidence link`);
    if (row.status === "fail") issues.push(`${row.id}: direct answer leak in prompt (${row.leakMatch})`);
  }
  for (const task of productiveTasks) {
    if (!task.prompt.trim() || !task.reviewEvidence.trim()) issues.push(`${task.id}: incomplete productive task contract`);
  }

  const byScope = Object.fromEntries([...new Set(rows.map((row) => row.scope))].sort().map((scope) => [scope, rows.filter((row) => row.scope === scope).length]));
  return {
    ok: issues.length === 0,
    issues,
    rows,
    productiveTasks,
    exemptions: rows.filter((row) => row.status === "exempt"),
    failures: rows.filter((row) => row.status === "fail"),
    byScope,
  };
}
