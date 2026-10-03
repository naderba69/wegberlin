/*
 * محاكاة ديناميكية كومة المراجعة (م5 · الصف 8 من سجل تدقيق 2026-10-03).
 *
 * تُجيب رقميًا عن سؤالين: (1) هل الكومة التي يخلّفها «24 بطاقة لكل درس» مقابل «سقف جلسة
 * مُقيَّد بزمن» تتلاشى أم تتباعد؟ (2) هل رفع سعة اليوم (مدة الجلسة المُعلنة) كافٍ أصلًا؟
 * تُشغَّل على بيانات المقرر الحقيقي
 * ودوالّ الجدولة نفسها (buildDueReviewQueue / applyReviewGrade / dailyReviewQuota)،
 * بلا IndexedDB وبلا أي ادّعاء عن جودة الحفظ عند المتعلم.
 *
 *   # درس كل يوم، 30 دقيقة (= 5 بطاقات/يوم)
 *   node_modules/.bin/tsx scripts/review-pile-simulation.ts --days 200 --minutes 30
 *   # نفس الوتيرة بسقف مزدوج
 *   node_modules/.bin/tsx scripts/review-pile-simulation.ts --days 200 --minutes 60
 *   # درس كل خمسة أيام (الوتيرة التي تغطيها السعة)
 *   node_modules/.bin/tsx scripts/review-pile-simulation.ts --days 480 --every 5 --sample 120
 */
import { academicLessonList } from "../src/data/academic-lessons";
import { reviewCards } from "../src/data/review-cards";
import { defaultState } from "../src/core/portability/db";
import { buildDueReviewQueue } from "../src/core/srs/review-queue";
import { applyReviewGrade } from "../src/core/srs/review-session";
import { dailyReviewQuota } from "../src/core/review/daily-quota";
import type { LearningState } from "../src/types/learning";

type Options = { lessons: number; days: number; grade: number; minutes: number; sample: number; every: number };

function flag<T extends string>(name: string, fallback: T): T {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? (process.argv[at + 1] as T) : fallback;
}

const options: Options = {
  lessons: Number(flag("lessons", "96")),
  days: Number(flag("days", "140")),
  grade: Number(flag("grade", "4")),
  minutes: Number(flag("minutes", "30")),
  every: Number(flag("every", "1")),
  sample: 10,
};

const DAY = 86_400_000;
const start = Date.parse("2026-01-05T09:00:00Z");
const course = academicLessonList.slice(0, Math.min(options.lessons, academicLessonList.length));
const cardsPerLesson = new Map<string, number>();
for (const lesson of course) cardsPerLesson.set(lesson.id, reviewCards.filter((card) => card.tags.includes(lesson.id)).length);

let state = { ...defaultState, profile: { ...defaultState.profile!, dailyMinutes: options.minutes } } as LearningState;
let injected = 0;
const rows: string[] = [];

for (let day = 0; day < options.days; day += 1) {
  const now = new Date(start + day * DAY);
  const lesson = course[day];
  if (lesson && day % options.every === 0) {
    injected += cardsPerLesson.get(lesson.id) ?? 0;
    // يُحاكى ما يفعله المتعلم فعلًا: محاولات بالعنصر + قيد يوم دراسة (هذه مصادر مرجع الإفراج)
    const attempts = lesson.exercises.slice(0, 3).map((exercise, index) => ({
      id: `sim-attempt-${lesson.id}-${index}`,
      lessonId: lesson.id,
      exerciseId: exercise.id,
      answer: "sim",
      correct: true,
      createdAt: new Date(now.getTime() + index * 60_000).toISOString(),
    }));
    state = {
      ...state,
      completedLessonIds: [...state.completedLessonIds, lesson.id],
      exerciseAttempts: [...state.exerciseAttempts, ...attempts as never],
      studyHistory: [...state.studyHistory, { date: new Date(now.getTime()).toISOString().slice(0, 10), minutes: lesson.estimatedMinutes, evidenceCount: attempts.length } as never],
    };
  }
  const quota = dailyReviewQuota(state, now).required;
  let reviewed = 0;
  while (reviewed < quota) {
    const queue = buildDueReviewQueue(state, now);
    if (!queue.length) break;
    state = applyReviewGrade(state, queue[0]!, options.grade, now, `sim-${day}-${reviewed}`).state;
    reviewed += 1;
  }
  const due = buildDueReviewQueue(state, now).length;

  if (day % options.sample === 0 || day === course.length - 1 || day === options.days - 1) {
    rows.push(
      `يوم ${String(day + 1).padStart(3)} · دروس ${String(Math.min(day + 1, course.length)).padStart(2)}/${course.length} · بطاقات مُدخلة ${String(injected).padStart(4)} · مراجعة اليوم ${reviewed} · مستحقة الآن ${String(due).padStart(4)} · مُجدولة ${state.reviewItems.length}`,
    );
  }
}

const after = rows[rows.length - 1]!;
const tail = rows.slice(-3);
const tailDue = tail.map((row) => Number(/مستحقة الآن\s+(\d+)/.exec(row)?.[1] ?? 0));
const netPerDay = tailDue.length > 1 ? ((tailDue[tailDue.length - 1]! - tailDue[0]!) / (tail.length * options.sample)) : 0;
const quotaAtEnd = dailyReviewQuota(state, new Date(start + options.days * DAY)).required;

console.log(rows.join("\n"));
console.log(
  [
    "",
    `بطاقات لكل درس: ${[...cardsPerLesson.values()].reduce((sum, count) => sum + count, 0) / Math.max(1, cardsPerLesson.size)}`,
    `سقف المطلوب اليومي عند ${options.minutes} دقيقة: ${quotaAtEnd} بطاقات (وهو حدّ أدنى للجلسة، لا حدّ أقصى لما يُراجَع)`,
    `صافي تغيّر الكومة في آخر ${tail.length * options.sample} يومًا بعد انتهاء الدروس: ${netPerDay.toFixed(2)} بطاقة/يوم`,
    `الصف الأخير: ${after}`,
    netPerDay < 0.5
      ? "النتيجة: الكومة لا تتلاشى عمليًا — المراجعة تُعيد جدولة بطاقاتها بفواصل أقصر من انتظارها في الطابور."
      : "النتيجة: الكومة تتناقص بمعدل ملموس.",
  ].join("\n"),
);
