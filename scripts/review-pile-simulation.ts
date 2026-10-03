/*
 * محاكاة ديناميكية كومة المراجعة (م5 · الصف 8 من سجل تدقيق 2026-10-03).
 *
 * تُجيب رقميًا عن سؤال واحد: هل الكومة التي يخلّفها «٢٤ بطاقة لكل درس» مقابل
 * «سقف جلسة مُقيَّد بزمن» تتلاشى أم تتباعد؟ تُشغَّل على بيانات المقرر الحقيقي
 * ودوالّ الجدولة نفسها (buildDueReviewQueue / applyReviewGrade / dailyReviewQuota)،
 * بلا IndexedDB وبلا أي ادّعاء عن جودة الحفظ عند المتعلم.
 *
 *   node_modules/.bin/tsx scripts/review-pile-simulation.ts --lessons 96 --days 140 --grade 4
 */
import { academicLessonList } from "../src/data/academic-lessons";
import { reviewCards } from "../src/data/review-cards";
import { defaultState } from "../src/core/portability/db";
import { buildDueReviewQueue } from "../src/core/srs/review-queue";
import { applyReviewGrade } from "../src/core/srs/review-session";
import { dailyReviewQuota } from "../src/core/review/daily-quota";
import type { LearningState } from "../src/types/learning";

type Options = { lessons: number; days: number; grade: number; minutes: number; sample: number };

function flag<T extends string>(name: string, fallback: T): T {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? (process.argv[at + 1] as T) : fallback;
}

const options: Options = {
  lessons: Number(flag("lessons", "96")),
  days: Number(flag("days", "140")),
  grade: Number(flag("grade", "4")),
  minutes: Number(flag("minutes", "30")),
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
  if (lesson) {
    injected += cardsPerLesson.get(lesson.id) ?? 0;
    state = { ...state, completedLessonIds: [...state.completedLessonIds, lesson.id] };
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
