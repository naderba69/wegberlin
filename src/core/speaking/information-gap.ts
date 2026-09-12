export const INFORMATION_GAP_POLICY = "two-party-information-gap-v1" as const;
export const INFORMATION_GAP_SCENARIO = {
  id: "course-choice-berlin-v1",
  roleA: {
    titleDe: "Rolle A · Kursberatung",
    factsDe: ["Kurs Alpha: Dienstag und Donnerstag, 18 Uhr, 120 Euro, nur vor Ort.", "Kurs Beta: Samstag, 9 Uhr, 95 Euro, Online-Material inklusive."],
    questionsDe: ["An welchen Tagen kannst du lernen?", "Wie hoch ist dein Budget?", "Brauchst du Online-Material?"],
  },
  roleB: {
    titleDe: "Rolle B · Interessent/in",
    factsDe: ["Du kannst nur am Samstag lernen.", "Dein Budget beträgt höchstens 100 Euro.", "Du brauchst Online-Material zum Wiederholen."],
    questionsDe: ["Wann beginnt der passende Kurs?", "Wie viel kostet er?", "Gibt es Material zum Wiederholen?"],
  },
  correctDecision: "beta" as const,
  minimumTurns: 4,
} as const;

export type InformationGapDecision = "alpha" | "beta";

export function evaluateInformationGap(decision: InformationGapDecision) {
  return decision === INFORMATION_GAP_SCENARIO.correctDecision;
}

export function canCompleteInformationGap(input: { partnerConfirmed: boolean; completedTurns: number; decision: InformationGapDecision | null }) {
  return input.partnerConfirmed && input.completedTurns >= INFORMATION_GAP_SCENARIO.minimumTurns && input.decision !== null && evaluateInformationGap(input.decision);
}
