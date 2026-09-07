import { academicLessonList, academicLessons } from "@/data/academic-lessons";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { buildDueReviewQueue } from "@/core/srs/review-queue";
import type { FullLesson, PracticeExercise } from "@/types/lesson-content";
import type { LearningState } from "@/types/learning";

/**
 * P0-38: إحماء استرجاع قصير يعمل قبل وجود أول بطاقة SM-2.
 *
 * المشكلة التي يعالجها هذا الملف: خطة الجلسة كانت تحذف كتلة الاسترجاع كلها
 * عندما لا توجد بطاقات مستحقة (أهم حالة: لم يكتمل أي درس بعد)، وتحوّل دقائقها
 * إلى درس جديد. النتيجة: جلسات بلا استرجاع على الإطلاق في أهم فترة للتثبيت.
 *
 * الحدود المُعلنة — وهي مقيدة في الشيفرة لا في الوصف فقط:
 * 1. لا يسترجع إلا ما **شاهده** المتعلّم فعلًا: مراحل الدرس التي وصل إليها
 *    (`lessonProgress`) أو دروسًا مكتملة. لا شيء من درس لم يفتحه.
 * 2. لا يكرّر بطاقات SM-2: أي عنصر يطابق واجهة بطاقة مجدولة للدرس نفسه
 *    يُستبعد، حتى لا يتحول الإحماء إلى مراجعة مبكرة تفسد التباعد.
 * 3. لا درجة ولا جدولة ولا إتقان: الإحماء لا يكتب في `reviewItems` ولا
 *    `reviewEvents` ولا `mastery`. هو إعادة تنشيط قبل التعلّم الجديد.
 */

export const WARMUP_POLICY_VERSION = "retrieval-warmup-v1" as const;

const SOURCE_ROTATION: WarmupSource[] = [
  "objective",
  "dialogue",
  "fill-blank",
  "word-ordering",
  "error-correction",
  "glossary",
  "pronunciation",
];

export type WarmupSource =
  | "objective"
  | "dialogue"
  | "fill-blank"
  | "word-ordering"
  | "error-correction"
  | "glossary"
  | "pronunciation";

export type WarmupItem = {
  id: string;
  lessonId: string;
  lessonTitleAr: string;
  source: WarmupSource;
  /** فهرس المرحلة التي يظهر فيها المحتوى أول مرة (0–13). */
  stageIndex: number;
  stageAr: string;
  /** تعليمات الاسترجاع بالعربية. */
  instructionAr: string;
  /** المُحفّز المعروض قبل الكشف (عربي، أو سياق ألماني للتمارين). */
  cueAr: string;
  /** سياق ألماني قصير يُعرض مع المُحفّز عند الحاجة (جملة بفراغ مثلًا). */
  contextDe?: string;
  /** الجواب المخفي حتى يكشفه المتعلّم بعد محاولة الاسترجاع. */
  answerDe: string;
  hintAr?: string;
};

export type WarmupPlan = {
  items: WarmupItem[];
  minutes: number;
  reasonAr: string;
  sourceLessonIds: string[];
};

const stageLabels: Record<number, string> = {
  0: "الأهداف",
  1: "المدخل",
  5: "التدرّب الموجّه",
  6: "القراءة",
  8: "النطق",
};

const instructionBySource: Record<WarmupSource, string> = {
  objective: "قل الهدف بالألمانية كما قرأته",
  dialogue: "قل هذه الجملة بالألمانية",
  "fill-blank": "أكمل الفراغ بالكلمة المناسبة",
  "word-ordering": "رتّب الكلمات لتصبح جملة صحيحة",
  "error-correction": "صحّح الخطأ في الجملة",
  glossary: "ما الكلمة الألمانية المقابلة؟",
  pronunciation: "ما الكلمة الألمانية المقابلة؟",
};

function normalize(text: string) {
  return text.normalize("NFKC").toLocaleLowerCase("de-DE").replace(/\s+/gu, " ").trim();
}

function dateKey(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function hash(text: string) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** واجهات بطاقات SM-2 للدرس: كل ما يطابقها يُستبعد من الإحماء. */
function cardFrontsByLesson(): Map<string, Set<string>> {
  const fronts = new Map<string, Set<string>>();
  for (const lesson of academicLessonList) {
    fronts.set(lesson.id, new Set(buildLessonSrsCards(lesson).map((card) => normalize(card.front))));
  }
  return fronts;
}

let cachedFronts: Map<string, Set<string>> | null = null;
function frontsFor(lessonId: string) {
  cachedFronts ??= cardFrontsByLesson();
  return cachedFronts.get(lessonId) ?? new Set<string>();
}

function exerciseItem(lesson: FullLesson, exercise: PracticeExercise, index: number): WarmupItem | null {
  const base = {
    id: `${lesson.id}:exercise-${index + 1}`,
    lessonId: lesson.id,
    lessonTitleAr: lesson.titleAr,
    stageIndex: 5,
    stageAr: stageLabels[5],
  };
  if (exercise.type === "fill-blank") {
    const answer = exercise.acceptedAnswers[0];
    if (!answer) return null;
    return { ...base, source: "fill-blank", instructionAr: instructionBySource["fill-blank"], cueAr: exercise.promptAr, contextDe: exercise.template, answerDe: answer, hintAr: exercise.explanationAr };
  }
  if (exercise.type === "word-ordering") {
    const answer = exercise.acceptedAnswers[0];
    if (!answer) return null;
    return { ...base, source: "word-ordering", instructionAr: instructionBySource["word-ordering"], cueAr: exercise.promptAr, contextDe: exercise.words.join(" · "), answerDe: answer, hintAr: exercise.explanationAr };
  }
  if (exercise.type === "error-correction") {
    const answer = exercise.acceptedAnswers[0];
    if (!answer) return null;
    return { ...base, source: "error-correction", instructionAr: instructionBySource["error-correction"], cueAr: exercise.promptAr, contextDe: exercise.sentence, answerDe: answer, hintAr: exercise.explanationAr };
  }
  return null;
}

function itemsForLesson(lesson: FullLesson, seenStage: number): WarmupItem[] {
  const fronts = frontsFor(lesson.id);
  const candidates: WarmupItem[] = [];

  if (seenStage >= 0) {
    lesson.objectives.forEach((objective, index) => {
      candidates.push({
        id: `${lesson.id}:objective-${index + 1}`,
        lessonId: lesson.id,
        lessonTitleAr: lesson.titleAr,
        source: "objective",
        stageIndex: 0,
        stageAr: stageLabels[0],
        instructionAr: instructionBySource.objective,
        cueAr: objective.ar,
        answerDe: objective.de,
      });
    });
  }

  if (seenStage >= 1) {
    lesson.entry.dialogue.forEach((line, index) => {
      candidates.push({
        id: `${lesson.id}:dialogue-${index + 1}`,
        lessonId: lesson.id,
        lessonTitleAr: lesson.titleAr,
        source: "dialogue",
        stageIndex: 1,
        stageAr: stageLabels[1],
        instructionAr: instructionBySource.dialogue,
        cueAr: line.ar,
        answerDe: line.de,
        hintAr: `قالها: ${line.speaker}`,
      });
    });
  }

  if (seenStage >= 5) {
    lesson.exercises.forEach((exercise, index) => {
      const item = exerciseItem(lesson, exercise, index);
      if (item) candidates.push(item);
    });
  }

  if (seenStage >= 6) {
    lesson.reading.glossary.forEach((entry, index) => {
      candidates.push({
        id: `${lesson.id}:glossary-${index + 1}`,
        lessonId: lesson.id,
        lessonTitleAr: lesson.titleAr,
        source: "glossary",
        stageIndex: 6,
        stageAr: stageLabels[6],
        instructionAr: instructionBySource.glossary,
        cueAr: entry.ar,
        answerDe: entry.surfaceForm,
        hintAr: `الكلمة الأساسية: ${entry.lemma}`,
      });
    });
  }

  if (seenStage >= 8) {
    lesson.pronunciation.items.forEach((item, index) => {
      candidates.push({
        id: `${lesson.id}:pronunciation-${index + 1}`,
        lessonId: lesson.id,
        lessonTitleAr: lesson.titleAr,
        source: "pronunciation",
        stageIndex: 8,
        stageAr: stageLabels[8],
        instructionAr: instructionBySource.pronunciation,
        cueAr: item.ar,
        answerDe: item.de,
        hintAr: `النطق: ${item.ipa}`,
      });
    });
  }

  return candidates.filter((item) => !fronts.has(normalize(item.answerDe)));
}

function lessonOrder(state: LearningState) {
  const indexOf = (lessonId: string) => academicLessonList.findIndex((lesson) => lesson.id === lessonId);
  const inProgress = academicLessonList
    .filter((lesson) => !state.completedLessonIds.includes(lesson.id) && (state.lessonProgress[lesson.id] ?? 0) > 0)
    .sort((left, right) => indexOf(right.id) - indexOf(left.id));
  const completed = academicLessonList
    .filter((lesson) => state.completedLessonIds.includes(lesson.id))
    .sort((left, right) => indexOf(right.id) - indexOf(left.id));
  const current = academicLessons[state.currentLessonId];
  const ordered = current && !state.completedLessonIds.includes(current.id) && (state.lessonProgress[current.id] ?? 0) > 0
    ? [current, ...inProgress.filter((lesson) => lesson.id !== current.id)]
    : inProgress;
  return [...ordered, ...completed];
}

export function warmupItemCount(minutes: number) {
  return Math.max(3, Math.min(6, Math.round(minutes)));
}

/**
 * يبني جولة إحماء قصيرة من محتوى **شاهده** المتعلّم فعلًا.
 * الاختيار ثابت داخل اليوم نفسه ويتغيّر بين الأيام (بذرة = معرّف العنصر + التاريخ)،
 * ويُوزّع على أكثر من درس بالتناوب حتى لا تقتصر الجولة على درس واحد.
 */
export function buildRetrievalWarmup(state: LearningState, now = new Date(), minutes = 4): WarmupPlan {
  const limit = warmupItemCount(minutes);
  const lessons = lessonOrder(state);
  const key = dateKey(now);
  // الجولة تمزج بين الأنواع (هدف، حوار، تمرين، مفردات، نطق) ثم تدوّر البداية داخل
  // كل نوع يوميًا: تنوّع في اليوم نفسه، وسير في المحتوى عبر الأيام بدل تكرارها.
  const buckets = lessons
    .map((lesson) => {
      const seenStage = state.completedLessonIds.includes(lesson.id) ? 13 : state.lessonProgress[lesson.id] ?? -1;
      const items = itemsForLesson(lesson, seenStage);
      const groups = SOURCE_ROTATION
        .map((source) => items.filter((item) => item.source === source))
        .filter((group) => group.length > 0);
      return {
        groups,
        groupOffset: groups.length === 0 ? 0 : hash(`${lesson.id}|groups|${key}`) % groups.length,
        offsets: groups.map((group) => (group.length === 0 ? 0 : hash(`${lesson.id}|${group[0].source}|${key}`) % group.length)),
      };
    })
    .filter((bucket) => bucket.groups.length > 0);

  const items: WarmupItem[] = [];
  for (let round = 0; items.length < limit && round < limit; round += 1) {
    for (const bucket of buckets) {
      for (let step = 0; step < bucket.groups.length && items.length < limit; step += 1) {
        const groupIndex = (bucket.groupOffset + step) % bucket.groups.length;
        const group = bucket.groups[groupIndex];
        const item = group[(bucket.offsets[groupIndex] + round) % group.length];
        if (!item || items.some((existing) => existing.id === item.id)) continue;
        items.push(item);
      }
    }
  }

  const sourceLessonIds = [...new Set(items.map((item) => item.lessonId))];
  const reasonAr = items.length === 0
    ? "لم تفتح أي مرحلة من أي درس بعد، ولا بطاقات مجدولة لديك: أول جلسة هي التي تبني مادة الاسترجاع. سنعيد هذه الدقائق إلى هدف اليوم بدل حذفها بصمت."
    : `استرجع ${items.length} عناصر من ${sourceLessonIds.length === 1 ? "درس واحد" : `${sourceLessonIds.length} دروس`} — من مراحل أنهيتها فعلًا (أهداف، حوار، تمارين، مفردات، نطق)، وليس من بطاقات SM-2 المجدولة. قل الجواب أو اكتبه قبل الكشف: بلا درجة، ولا يغيّر مواعيد SM-2، ولا يُحتسب في الإتقان.`;

  return {
    items,
    minutes: Math.max(2, Math.min(4, Math.round(minutes))),
    reasonAr,
    sourceLessonIds,
  };
}

/** هل تحتاج خطة الجلسة إلى إحماء بديل؟ (لا بطاقات مستحقة الآن + يوجد ما يُسترجع) */
export function needsRetrievalWarmup(state: LearningState, now = new Date()) {
  if (buildDueReviewQueue(state, now).length > 0) return false;
  return buildRetrievalWarmup(state, now, 4).items.length > 0;
}
