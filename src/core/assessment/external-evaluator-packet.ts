/**
 * The external-evaluator bridge.
 *
 * This app corrects writing locally and, with consent, asks an optional AI
 * advisor when the local rules are unsure. Neither of those can grade `Schreiben`
 * or `Sprechen` the way an examiner does, and the app must not pretend otherwise.
 * So the honest move is to hand the work to a human the learner arranged, and to
 * store what that human says as *their* statement - never as a grade the app
 * verified and never as an exam result.
 *
 * Two halves, both deterministic and offline:
 *  - `buildExternalEvaluatorPacket`: what the learner sends (their text, the task
 *    criteria, and only the local findings the engine actually made).
 *  - `readExternalEvaluatorNotes`: what comes back, kept as reviewable statements
 *    with their origin recorded, with official-result and score phrasing refused.
 */

import { GERMAN_GRAMMAR_SIGNALS_POLICY, type GrammarSignalReport } from "@/core/writing/german-grammar-signals";

export const EXTERNAL_EVALUATOR_PACKET_POLICY = "external-evaluator-packet-v1" as const;

/**
 * Which channel the packet is about. Deliberately a local union: no task-fulfilment
 * catalog exists in this project, so the app must not imply it graded `Aufgabe
 * erfüllen` itself - the criteria below are whatever the learner pastes in, and
 * the human reviewer is asked to judge against them.
 */
export type ExternalEvaluatorSkill = "schreiben" | "sprechen";

export type ExternalEvaluatorPacket = {
  policyVersion: typeof EXTERNAL_EVALUATOR_PACKET_POLICY;
  generatedAt: string;
  level: "A1" | "A2" | "B1" | "B2";
  examFormat: "goethe" | "telc" | "owl" | "none";
  taskId: string;
  taskTitleAr: string;
  skill: ExternalEvaluatorSkill;
  inputSummaryAr: string;
  wordTarget: { min: number; max: number };
  /** Learner-supplied task criteria, echoed unchanged; not an official catalog. */
  criteria: string[];
  criteriaSourceAr: string;
  learnerText: string;
  wordCount: number;
  localSignalCount: number;
  localUnresolvedCount: number;
  boundary: {
    canCertifyExamReadiness: false;
    canIssueOfficialResult: false;
    appClaimsHumanReview: false;
    noteAr: string;
  };
};

export type ExternalEvaluatorNote = {
  excerpt: string;
  comment: string;
};

export type ExternalEvaluatorReply = {
  policyVersion: typeof EXTERNAL_EVALUATOR_PACKET_POLICY;
  reviewerLabel: string;
  receivedAt: string;
  notes: ExternalEvaluatorNote[];
  unconfirmableExcerpts: string[];
  refusedPhrases: string[];
  boundary: {
    source: "external-human-arranged-by-learner";
    appVerifiedTheFeedback: false;
    canCertifyExamReadiness: false;
    canCountTowardLevelGate: false;
    officialResultClaimedAr: string;
  };
};

const MAX_TEXT = 6000;
const MAX_CRITERIA = 20;
const MAX_NOTES = 24;

/** Phrasing this bridge refuses to record as though the app had graded anything. */
const OFFICIAL_RESULT_PATTERNS: RegExp[] = [
  /\b(bestanden|nicht bestanden|Durchgefallen|ausgezeichnet)\b/iu,
  /\b(Bestehenschein|Prüfungsergebnis|Prüfungsnote|Zertifikat)\b/iu,
  /\b(CEFR|GER)\s*(level|Niveau)\b/iu,
  /\b\d{1,3}\s*(\/|von)\s*100\b/u,
  /\bNote\s*:?\s*[1-6]\b/iu,
  /نجاح في الامتحان|درجة رسمية|نتيجة رسمية|شهادة إتقان|قرار الامتحان/u,
  /مستواك.{0,24}\b[AB][12]\b/u,
];

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

function clampText(value: string, max: number): string {
  const normalized = value.replace(/\r\n?/gu, "\n").trim();
  return normalized.length > max ? normalized.slice(0, max) : normalized;
}

export function buildExternalEvaluatorPacket(input: {
  level: "A1" | "A2" | "B1" | "B2";
  examFormat: "goethe" | "telc" | "owl" | "none";
  task: {
    id: string;
    titleAr: string;
    skill: ExternalEvaluatorSkill;
    inputSummaryAr: string;
    criteria?: string[];
  };
  learnerText: string;
  wordTarget?: { min: number; max: number };
  localReport?: GrammarSignalReport;
  now?: () => Date;
}): ExternalEvaluatorPacket {
  const learnerText = clampText(input.learnerText, MAX_TEXT);
  // With no format named, no criteria are attached at all: borrowing another
  // catalog's wording would quietly turn a free exercise into an exam claim.
  const criteria = (input.task.criteria ?? [])
    .map((entry) => clampText(entry, 240))
    .filter(Boolean)
    .slice(0, MAX_CRITERIA);
  const report = input.localReport;
  return {
    policyVersion: EXTERNAL_EVALUATOR_PACKET_POLICY,
    generatedAt: (input.now?.() ?? new Date()).toISOString(),
    level: input.level,
    examFormat: input.examFormat,
    taskId: input.task.id,
    taskTitleAr: input.task.titleAr,
    skill: input.task.skill,
    inputSummaryAr: input.task.inputSummaryAr,
    wordTarget: input.wordTarget ?? { min: 0, max: 0 },
    criteria,
    criteriaSourceAr: "المعايير من نص المهمة كما أدخلها المتعلم؛ لا يملك هذا التطبيق فهرس معايير رسمي ولا يحكم بها.",
    learnerText,
    wordCount: countWords(learnerText),
    // The local engine's own numbers, quoted rather than summarised, so the
    // reviewer can see what the machine claimed and disagree with it.
    localSignalCount: report?.findings.length ?? 0,
    localUnresolvedCount: report?.unresolved.length ?? 0,
    boundary: {
      canCertifyExamReadiness: false,
      canIssueOfficialResult: false,
      appClaimsHumanReview: false,
      noteAr: "هذه الحزمة سؤالٌ عن رأي خارجي، وليست تقييمًا من التطبيق؛ التطبيق لا يمنح درجة ولا يقرّر الجاهزية للامتحان.",
    },
  };
}

/** Paste-ready form for an email or a messenger, with no attachment needed. */
export function renderExternalEvaluatorPacketText(packet: ExternalEvaluatorPacket): string {
  const lines = [
    `# طلب مراجعة كتابة خارجية (${packet.level} · ${packet.skill}) - ${packet.policyVersion}`,
    `المهمة: ${packet.taskTitleAr}`,
    `المدخل: ${packet.inputSummaryAr}`,
    packet.examFormat === "none" ? "صيغة التدريب: حرة (بلا ادعاء مطابقة فحص رسمي)" : `صيغة التدريب المُحاكاة: ${packet.examFormat} (محاكاة فقط)`,
    packet.criteria.length ? "المعايير:" : "",
    ...packet.criteria.map((criterion) => `  - ${criterion}`),
    `الكلمة المستهدفة: ${packet.wordTarget.min}-${packet.wordTarget.max} (كتبتَ ${packet.wordCount})`,
    "",
    "",
    "نصي:",
    packet.learnerText,
    "",
    `رصد المحلّل المحلي: ${packet.localSignalCount} إشارة، ${packet.localUnresolvedCount} موضع لم يحسمه.`,
    `ملاحظة حدّ: ${packet.boundary.noteAr}`,
  ];
  return lines.filter((line) => line !== undefined).join("\n");
}

/**
 * A reviewer's reply is stored as their statement. An excerpt the learner never
 * wrote is kept but flagged as unconfirmable by this app - it is not evidence
 * that the reviewer was wrong, only that the app cannot check it.
 */
export function readExternalEvaluatorNotes(input: {
  raw: string;
  learnerText: string;
  reviewerLabel?: string;
  receivedAt?: string;
  now?: () => Date;
}): { reply: ExternalEvaluatorReply | null; errorAr?: string } {
  const raw = clampText(input.raw, MAX_TEXT);
  if (!raw) return { reply: null, errorAr: "أدخل نص ملاحظات المراجع أولًا." };
  const reviewer = clampText(input.reviewerLabel ?? "", 80) || "مراجع خارجي (لم يُسجَّل اسمه)";
  const source = input.learnerText.normalize("NFC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("de-DE");
  const notes: ExternalEvaluatorNote[] = [];
  const unconfirmable: string[] = [];
  const refused: string[] = [];
  for (const line of raw.split("\n")) {
    const entry = line.replace(/^[-*•\d.)\s]+/u, "").trim();
    if (!entry || !/\p{L}/u.test(entry)) continue;
    if (notes.length >= MAX_NOTES) break;
    const quoted = entry.match(/["«„]([^"»“]{3,240})["»”]/u);
    for (const pattern of OFFICIAL_RESULT_PATTERNS) {
      const hit = entry.match(pattern);
      if (hit) {
        refused.push(hit[0]);
        break;
      }
    }
    const excerpt = quoted?.[1]?.trim() ?? "";
    if (excerpt) {
      const needle = excerpt.replace(/\s+/gu, " ").trim().toLocaleLowerCase("de-DE");
      if (!source.includes(needle)) unconfirmable.push(excerpt);
    }
    notes.push({ excerpt, comment: clampText(entry, 400) });
  }
  if (!notes.length) return { reply: null, errorAr: "لم نجد ملاحظة واحدة في النص المُدخل." };
  return {
    reply: {
      policyVersion: EXTERNAL_EVALUATOR_PACKET_POLICY,
      reviewerLabel: reviewer,
      receivedAt: input.receivedAt ?? (input.now?.() ?? new Date()).toISOString(),
      notes,
      unconfirmableExcerpts: unconfirmable,
      refusedPhrases: refused,
      boundary: {
        source: "external-human-arranged-by-learner",
        appVerifiedTheFeedback: false,
        canCertifyExamReadiness: false,
        canCountTowardLevelGate: false,
        officialResultClaimedAr:
          refused.length > 0
            ? "حُفظت الملاحظات، لكن أي عبارة نتيجة/درجة/شهادة رُفضت ولا تُعرض كتقييم: لا يمنح هذا التطبيق قرار امتحان ولا يُثبِت جاهزيته."
            : "لا يمنح هذا التطبيق قرار امتحان ولا يُثبِت جاهزيته.",
      },
    },
  };
}

/** Only for the UI line that must never disappear: the local engine's policy id. */
export const EXTERNAL_EVALUATOR_LOCAL_ENGINE = GERMAN_GRAMMAR_SIGNALS_POLICY;
