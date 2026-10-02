import type { LearningState } from "@/types/learning";

export const EVIDENCE_ACHIEVEMENT_POLICY = "evidence-derived-achievement-v1" as const;
export const ACHIEVEMENT_EVIDENCE_BOUNDARY = "derived-display-only-no-mastery-cefr-or-reward" as const;

export type EvidenceAchievementId = "first-complete-lesson" | "delayed-retention" | "writing-revision" | "speaking-self-review" | "a1-path-complete" | "full-exam-simulation";
export type EvidenceAchievement = {
  id: EvidenceAchievementId;
  policyVersion: typeof EVIDENCE_ACHIEVEMENT_POLICY;
  titleDe: string;
  titleAr: string;
  descriptionAr: string;
  evidenceKind: "completed-lesson" | "delayed-review" | "writing-revision" | "speaking-self-review" | "completed-level-path" | "completed-full-simulation";
  evidenceLabelAr: string;
  current: number;
  target: number;
  progressPercent: number;
  unlocked: boolean;
  evidenceIds: string[];
  evidenceBoundary: typeof ACHIEVEMENT_EVIDENCE_BOUNDARY;
};

type AchievementSeed = Omit<EvidenceAchievement,"policyVersion"|"progressPercent"|"unlocked"|"evidenceBoundary">;

function finish(seed:AchievementSeed):EvidenceAchievement{
  const current=Math.max(0,seed.current);
  const target=Math.max(1,seed.target);
  return{...seed,current,target,policyVersion:EVIDENCE_ACHIEVEMENT_POLICY,progressPercent:Math.min(100,Math.round(current/target*100)),unlocked:current>=target,evidenceBoundary:ACHIEVEMENT_EVIDENCE_BOUNDARY};
}

export function deriveEvidenceAchievements(state:LearningState):EvidenceAchievement[]{
  const completedLessons=[...new Set(state.completedLessonIds)];
  const a1Lessons=completedLessons.filter((id)=>/^a1-\d{2}$/u.test(id));
  const delayedLessonReviews=[...new Map(state.reviewEvents.filter((event)=>event.evidenceKind==="delayed"&&event.grade>=3&&event.evidenceScope!=="personal-error-remediation").map((event)=>[event.cardId,event])).values()];
  const revisedWriting=[...new Map(state.writingSubmissions.filter((submission)=>submission.status==="revised"&&Boolean(submission.sourceVersion)).map((submission)=>[submission.taskId,submission])).values()];
  const reviewedSpeaking=[...new Map(state.speakingAttempts.filter((attempt)=>attempt.selfReview?.listenedBack&&attempt.reflection.trim().length>0).map((attempt)=>[attempt.taskId,attempt])).values()];
  const completedSimulations=Object.values(state.examSessions).filter((session)=>session.status==="completed"&&session.completedTaskIds.length===session.taskIds.length);

  return[
    finish({id:"first-complete-lesson",titleDe:"Erster Lernnachweis",titleAr:"أول درس بدليله",descriptionAr:"درس واحد اكتمل بعد تحقق حدود التدريب والقراءة والاستماع والاختبار، لا بمجرد فتحه.",evidenceKind:"completed-lesson",evidenceLabelAr:"دروس مكتملة بالدليل",current:completedLessons.length,target:1,evidenceIds:completedLessons}),
    finish({id:"delayed-retention",titleDe:"Später erinnert",titleAr:"احتفاظ بعد التأخير",descriptionAr:"أربع بطاقات درس نجحت بعد حلول موعدها المؤجل؛ الكشف الأول والبطاقات الشخصية لا يكفيان.",evidenceKind:"delayed-review",evidenceLabelAr:"بطاقات درس مؤجلة ناجحة",current:delayedLessonReviews.length,target:4,evidenceIds:delayedLessonReviews.map((event)=>event.id)}),
    finish({id:"writing-revision",titleDe:"Text wirklich überarbeitet",titleAr:"راجعت نصًا فعليًا",descriptionAr:"مهمة كتابة واحدة على الأقل لها نسخة منقحة مرتبطة صراحة بنسخة سابقة.",evidenceKind:"writing-revision",evidenceLabelAr:"مهام كتابة منقحة",current:revisedWriting.length,target:1,evidenceIds:revisedWriting.map((submission)=>submission.id)}),
    finish({id:"speaking-self-review",titleDe:"Aufnahme angehört und geplant",titleAr:"استمعت وخططت للإعادة",descriptionAr:"محاولة كلام محفوظة بعد الاستماع الكامل وكتابة تأمل ذاتي، دون درجة نطق آلية.",evidenceKind:"speaking-self-review",evidenceLabelAr:"محاولات بمراجعة ذاتية",current:reviewedSpeaking.length,target:1,evidenceIds:reviewedSpeaking.map((attempt)=>attempt.id)}),
    finish({id:"a1-path-complete",titleDe:"A1-Lernweg belegt",titleAr:"مسار A1 مكتمل بالأدلة",descriptionAr:"أربعة وعشرون درس A1 مكتملة؛ هذا إنجاز مسار داخلي وليس شهادة CEFR رسمية.",evidenceKind:"completed-level-path",evidenceLabelAr:"دروس A1 مكتملة",current:a1Lessons.length,target:24,evidenceIds:a1Lessons}),
    finish({id:"full-exam-simulation",titleDe:"Vollständige Prüfungssimulation",titleAr:"محاكاة كاملة منتهية",descriptionAr:"محاكاة كاملة واحدة أُنهيت بكل مهامها داخل جهة واحدة؛ النتيجة تدريبية وغير رسمية.",evidenceKind:"completed-full-simulation",evidenceLabelAr:"محاكاة كاملة مثبتة",current:completedSimulations.length,target:1,evidenceIds:completedSimulations.map((session)=>session.simulationId)}),
  ];
}

export function achievementSummary(state:LearningState){const achievements=deriveEvidenceAchievements(state);return{policyVersion:EVIDENCE_ACHIEVEMENT_POLICY,unlocked:achievements.filter((achievement)=>achievement.unlocked).length,total:achievements.length,achievements};}
