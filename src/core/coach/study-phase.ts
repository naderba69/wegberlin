import type { LearningState, CEFRLevel } from "@/types/learning";
import { buildLevelEvidenceGate } from "@/core/assessment/level-evidence";

export const PHASED_STUDY_PLAN_POLICY = "phased-ninety-minute-plan-v2" as const;
export type StudyPhase = "entry" | "foundation" | "growth" | "b2-consolidation" | "exam-specific";
export function studyPhase(state: LearningState, now = new Date()): { id: StudyPhase; level: CEFRLevel; examSpecific: boolean; reasonAr: string } {
  if (!state.profile || (state.profile.priorExperience === "none" && !state.diagnosticResult && !state.completedLessonIds.length && !state.exerciseAttempts.length && (state.lessonProgress["a1-01"] ?? 0) < 3)) return { id: "entry", level: "A1", examSpecific: false, reasonAr: "جلسة بداية قصيرة؛ ترتفع الميزانية بعد أول ممارسة فعلية، لا بعد تشخيص مفروض." };
  if (buildLevelEvidenceGate(state,"B2",now).passed) return { id: "exam-specific", level: "B2", examSpecific: true, reasonAr: "تغطية المنهج وبوابة الانتقال الداخلية تسمحان بتدريب صيغة الجهة المختارة؛ جودة الإنتاج لا تزال غير مصادق عليها." };
  if (buildLevelEvidenceGate(state,"B1",now).passed) return { id: "b2-consolidation", level: "B2", examSpecific: true, reasonAr: "مهام B2 جزئية ومتدرجة، لا محاكاة كاملة مبكرة." };
  if (buildLevelEvidenceGate(state,"A2",now).passed) return { id: "growth", level: "B1", examSpecific: false, reasonAr: "تدريب من مستوى B1؛ لا نحمّل المتعلم ورقة B2 كاملة." };
  const level = buildLevelEvidenceGate(state,"A1",now).passed ? "A2" : "A1";
  return { id: "foundation", level, examSpecific: false, reasonAr: "نثبت الفهم والإنتاج القصير بحسب المستوى، مع تعليمات اختبارات بسيطة لا محاكاة B2." };
}
