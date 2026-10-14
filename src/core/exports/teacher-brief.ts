import type { LearningState, WeeklyReflectionAdjustment, WeeklyReflectionObstacle, WeeklyReflectionRecord, WeeklyReflectionSuccess } from "@/types/learning";
import { buildWeeklyEvidenceSummary, WEEKLY_EVIDENCE_SUMMARY_BOUNDARY, WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION } from "@/core/coach/weekly-summary";

export const TEACHER_BRIEF_POLICY_VERSION = "learner-controlled-teacher-brief-v1" as const;
export const TEACHER_BRIEF_WEEKS = 4;

const successLabels: Record<WeeklyReflectionSuccess, string> = {
  consistency: "العودة بانتظام",
  review: "الاسترجاع",
  lesson: "هدف الدرس",
  listening: "الاستماع",
  writing: "الكتابة",
  speaking: "الكلام",
};
const obstacleLabels: Record<WeeklyReflectionObstacle, string> = {
  time: "الوقت",
  energy: "الطاقة",
  difficulty: "الصعوبة",
  instructions: "وضوح التعليمات",
  technology: "الجهاز أو الاتصال",
  none: "لا عائق",
};
const adjustmentLabels: Record<WeeklyReflectionAdjustment, string> = {
  "keep-plan": "أبقي الخطة",
  "lighter-plan": "أخفف الحمل",
  "more-review": "أبدأ بمراجعة أكثر",
  "more-production": "أزيد الإنتاج",
  "change-study-time": "أغير وقت الدراسة",
};

export const TEACHER_BRIEF_NOT_MEASURED = [
  "درجة لغوية أو مستوى CEFR أو احتمال النجاح في أي امتحان",
  "الإتقان الفعلي للمفردات أو القواعد، فهذا يحتاج أدلة مستقلة ومراجعة بشرية",
  "جودة النص المكتوب أو المنطوق، فلا يُرفق أي نص للمتعلم إلا إذا اختار ذلك",
  "أي شيء قبل تاريخ بدء السجل المحلي أو خارج الأسابيع المذكورة",
] as const;

export interface TeacherBriefOptions {
  includeReflectionNotes: boolean;
}

export interface TeacherBriefFile {
  policyVersion: typeof TEACHER_BRIEF_POLICY_VERSION;
  filename: string;
  mime: "text/markdown";
  content: string;
  weeks: number;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function labelList<T extends string>(values: T[], labels: Record<T, string>): string {
  return values.length === 0 ? "—" : values.map((value) => labels[value] ?? value).join("، ");
}

function oneLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").replace(/[`*_#>]/g, "").trim().slice(0, 400);
}

function reflectionLines(record: WeeklyReflectionRecord, options: TeacherBriefOptions): string[] {
  const lines = [
    `- ما نجح: ${labelList(record.whatWorked, successLabels)}`,
    `- العوائق: ${labelList(record.obstacles, obstacleLabels)}`,
    `- التعديل المختار: ${adjustmentLabels[record.oneAdjustment] ?? record.oneAdjustment}`,
  ];
  if (options.includeReflectionNotes && record.note.trim()) {
    lines.push(`- ملاحظة المتعلم (بموافقته): ${oneLine(record.note)}`);
  }
  return lines;
}

/**
 * ملف Markdown يكتبه المتعلم ليعرضه على مدرّب بشري. كل شيء فيه محلي ومحسوب من السجلات المؤرّخة.
 * الافتراضي لا يتضمن أي نص حر للمتعلم، والملاحظات تُضاف فقط عند اختياره.
 */
export function buildTeacherBriefMarkdown(state: LearningState, now = new Date(), options: TeacherBriefOptions = { includeReflectionNotes: false }): TeacherBriefFile {
  const weeks = Array.from({ length: TEACHER_BRIEF_WEEKS }, (_, index) => buildWeeklyEvidenceSummary(state, addDays(now, -7 * index)));
  const generated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const profileExam = state.profile?.targetExam ?? "غير محدد";
  const rows = weeks.map((week) =>
    `| ${week.weekStart} → ${week.weekEnd} | ${week.studyDays} | ${week.activeMinutes} | ${week.rescueDays} | ${week.planningSignals.tooEasy} / ${week.planningSignals.tooHard} | ${week.receptionAttempts} | ${week.writingBenchmarks} | ${week.reflectionSaved ? "نعم" : "لا"} |`,
  );
  const reflections = (state.weeklyReflections ?? [])
    .filter((record) => weeks.some((week) => week.weekStart === record.weekStart))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const reflectionBlock = reflections.length
    ? reflections.flatMap((record) => [`### ${record.weekStart} → ${record.weekEnd}`, ...reflectionLines(record, options), ""])
    : ["لا توجد تأملات أسبوعية محفوظة في هذه الفترة.", ""];
  const latest = weeks[0];

  const content = [
    "# ملف متابعة للمدرّب",
    "",
    `- تاريخ الإنشاء: ${generated}`,
    `- الهدف المعلن للمتعلم: ${profileExam}`,
    `- نسخة السياسة: ${TEACHER_BRIEF_POLICY_VERSION} · ${WEEKLY_EVIDENCE_SUMMARY_POLICY_VERSION}`,
    `- حدود الأرقام: ${WEEKLY_EVIDENCE_SUMMARY_BOUNDARY}`,
    "",
    "## ما هذا الملف",
    "ملخص أرقام لآخر أربعة أسابيع، مأخوذ من سجل التطبيق المحلي. الأرقام تصف النشاط فقط، ولا تحكم على مستوى المتعلم.",
    "",
    "## ما لا يقيسه هذا الملف",
    ...TEACHER_BRIEF_NOT_MEASURED.map((item) => `- ${item}`),
    "",
    "## الأسابيع الأربعة",
    "| الأسبوع | أيام الدراسة | دقائق نشطة | أيام خطة الإنقاذ | إشارات «سهل / صعب» | محاولات استماع ونطق وقراءة | قياسات الكتابة | تأمل محفوظ |",
    "|---|---:|---:|---:|---:|---:|---:|---|",
    ...rows,
    "",
    "## ملاحظة عن الكتابة والكلام",
    `سجلت ${state.writingSubmissions?.length ?? 0} مسودات أو نصوص كتابة و${state.speakingAttempts?.length ?? 0} تسجيلات كلام دون توقيت في السجل، لذلك لا تظهر في الجدول أعلاه. راجعها مع المتعلم مباشرة.`,
    "",
    "## التأملات الأسبوعية",
    ...reflectionBlock,
    "## آخر أسبوع بالأرقام",
    latest ? `- أيام الدراسة: ${latest.studyDays} · الدقائق النشطة: ${latest.activeMinutes} · متوسط الطاقة: ${latest.averages.energy ?? "—"}` : "- لا بيانات.",
    "",
  ].join("\n");

  return {
    policyVersion: TEACHER_BRIEF_POLICY_VERSION,
    filename: `teacher-brief-${generated}.md`,
    mime: "text/markdown",
    content,
    weeks: weeks.length,
  };
}
