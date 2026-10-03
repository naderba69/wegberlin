import type { FullLesson } from "@/types/lesson-content";
import { academicLessons } from "@/data/academic-lessons";
import { grammarNodesByLesson } from "@/data/grammar-progression-registry";
import { independentProductionTasks } from "@/data/independent-production-tasks";
import { reviewCards } from "@/data/review-cards";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";
import { LEARNING_STATE_LABELS, LEARNING_STATE_INDEPENDENCE_NOTE } from "@/core/lessons/learning-state";

/**
 * معيار الدرس الواحد — ثماني أسئلة تُجاب من البيانات لا من الانطباع.
 *
 * الأسئلة الثمانية هي عقد كل درس: هدف، متطلب سابق، شرح ونموذج، تدريب متدرَّج مصحَّح،
 * مهمة استخدام في وضع جديد، تصحيح محدد لكل خطأ، أي دليل تدريب وأي دليل استقلال، وما الذي
 * سيُراجع لاحقًا. هذا الملف **يقيس** فقط: لا يرفع إتقانًا، ولا يُغيّر إكمالًا، ولا يمنح
 * ادعاءً بمراجعة لغوية بشرية. ما لا يُقاس هنا يبقى معلَنًا في `docs/LEARNING_REPAIRS_AR.md`.
 */
export const LESSON_TEACHING_CONTRACT_POLICY = "lesson-teaching-contract-v1" as const;
export const LESSON_TEACHING_CONTRACT_BOUNDARY = "content-and-evidence-contract-audit-no-mastery-no-cefr-no-human-linguistic-review" as const;

/**
 * Arabic learner-facing prose keeps the **German** metalanguage (Akkusativ, Modalverben, Nebensatz…).
 * An English grammar word appearing there is an authoring leak, not a style choice: it was measured
 * in 25 fields on 2026-10-03 (ADR-106 · ع1) and is pinned to zero by the lesson-contract audit.
 * German spellings (Modal, Verb, Genus, Partikel) are deliberately absent from the list.
 */
export const ENGLISH_GRAMMAR_TERMS = [
  "modal verb", "modal", "auxiliary", "conjugation", "declension", "tense", "clause", "suffix",
  "prefix", "particle", "noun", "adjective", "adverb", "pronoun", "preposition", "conjunction",
  "word order", "gerund",
] as const;

const ARABIC_SCRIPT = /[\u0600-\u06ff]/u;

export function isLearnerArabicFieldKey(key: string): boolean {
  return /^[A-Za-z][A-Za-z0-9]*Ar$/u.test(key.replace(/\[\d+\]$/u, ""));
}

/** English grammar terms leaking into Arabic text. German words are legitimate and never matched. */
export function englishGrammarTermLeak(text: string): string[] {
  if (!text || !ARABIC_SCRIPT.test(text)) return [];
  return ENGLISH_GRAMMAR_TERMS.filter((term) =>
    new RegExp(`(^|[^A-Za-z\u00c0-\u024f])${term.replace(/ /gu, "[\\s_-]+")}([^A-Za-z\u00c0-\u024f]|$)`, "iu").test(text));
}

/**
 * جُمل «الذيل العام» التي مُنعت نهائيًا في حقول التغذية الراجعة (ع2 من تدقيق 2026-10-03).
 * هذه جُمل صحيحة المعنى لكنها لا تقول شيئًا عن العنصر الذي تُذَيَّل به: تكرارها حرفيًّا في
 * نسبة معتبرة من المنهج يجعل التبرير يبدو آليًّا. تُقاس ceilings لا تُصلَح بإبدال صيغة بأخرى.
 */
export const FEEDBACK_BOILERPLATE_TAILS = [
  "افحص المعنى وترتيب الكلمات في سياق السؤال قبل تثبيت جوابك، ثم كوّن استعمالًا جديدًا للهدف بدل تكرار المفتاح فقط",
  "أعد سماع موضع المعلومة وحدّد من يتكلم وما يقصده؛ لا تختَر تفصيلًا سمعته إذا كان يخص شخصًا أو وقتًا آخر",
  "بعد الفهم قل المعلومة بكلماتك دون قراءة النص",
] as const;

/** وسم أمانة لا نصيحة تعليمية: مكرَّر عمدًا على كل سؤال قراءة آليّ المرجع، فلا يدخل سقف التكرار. */
export const FEEDBACK_DISCLOSURE_MARKER = "موضع الرجوع آلي ويحتاج مراجعة دلالية مستقلة.";

/** أيّ جُملة ذيل عامّ توجد في هذا النصّ؟ (تُعاد الجملة المحظورة أو null) */
export function feedbackBoilerplateTail(text: string): string | null {
  if (!text) return null;
  return FEEDBACK_BOILERPLATE_TAILS.find((tail) => text.includes(tail)) ?? null;
}

/** Every learner-facing Arabic string of a lesson-shaped object, with its path. */
export function learnerArabicFields(node: unknown, path = ""): Array<{ path: string; text: string }> {
  const found: Array<{ path: string; text: string }> = [];
  const walk = (value: unknown, at: string) => {
    if (typeof value === "string") {
      if (value && isLearnerArabicFieldKey(at.split(".").pop() ?? "")) found.push({ path: at, text: value });
      return;
    }
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${at}[${index}]`));
    if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) walk(child, at ? `${at}.${key}` : key);
  };
  walk(node, path);
  return found;
}

export const CONTRACT_THRESHOLDS = {
  objectiveArMinChars: 10,
  objectiveDeMinChars: 5,
  descriptionArMinChars: 40,
  theoryExplanationMinChars: 60,
  theoryExamplesMin: 2,
  dialogueMinLines: 4,
  inLessonModelMinChars: 60,
  exercisesMin: 6,
  exerciseTypesMin: 3,
  itemExplanationMinChars: 20,
  mistakesMin: 3,
  mistakeWhyMinChars: 20,
  mistakeTrickMinChars: 15,
  transferPromptMinChars: 40,
  transferChecklistMin: 3,
  speakingCriteriaMin: 3,
  mediationTaskMinChars: 25,
  lessonCardsMin: 12,
} as const;

export type ContractQuestionId =
  | "goal" | "prerequisites" | "explanation-model" | "graded-practice" | "transfer" | "feedback" | "evidence-split" | "review-later";

export const CONTRACT_QUESTIONS: Array<{ id: ContractQuestionId; ar: string; hard: boolean }> = [
  { id: "goal", ar: "ما الذي سيستطيع المتعلم فعله بنهاية الدرس؟", hard: true },
  { id: "prerequisites", ar: "على ماذا يبني الدرس؟", hard: false },
  { id: "explanation-model", ar: "هل قبل التدريب شرحٌ ونموذج؟", hard: true },
  { id: "graded-practice", ar: "هل يوجد تدريب متدرَّج يُصحَّح آليًا؟", hard: true },
  { id: "transfer", ar: "هل توجد مهمة استخدام في وضع جديد؟", hard: true },
  { id: "feedback", ar: "هل لكل خطأ تصحيح محدد؟", hard: true },
  { id: "evidence-split", ar: "أي دليل تدريب وأي دليل استقلال؟", hard: true },
  { id: "review-later", ar: "ما الذي سيُراجع لاحقًا وكم بطاقة؟", hard: true },
];

export type ContractAnswer = { ok: boolean; valueAr: string; gapAr?: string };
export type LessonTeachingContract = {
  policyVersion: typeof LESSON_TEACHING_CONTRACT_POLICY;
  lessonId: string;
  level: FullLesson["level"];
  answers: Record<ContractQuestionId, ContractAnswer>;
  /** الأسئلة التي لا تقبل الاستثناء: كسرها يوقف البوابة. */
  hardFailures: ContractQuestionId[];
  /** فجوات مسموحة مرقومة، تُسدّ بالتأليف لا بتخفيف العتبة. */
  gaps: string[];
  boundary: typeof LESSON_TEACHING_CONTRACT_BOUNDARY;
};

const chars = (value: string | undefined) => (value ?? "").trim().length;

function previousLessonId(lesson: FullLesson) {
  const match = lesson.id.match(/^([a-z0-9]+)-(\d+)$/iu);
  if (!match) return null;
  const previous = `${match[1]}-${String(Number(match[2]) - 1).padStart(2, "0")}`;
  return academicLessons[previous] ? previous : null;
}

export function lessonTeachingContract(lesson: FullLesson): LessonTeachingContract {
  const T = CONTRACT_THRESHOLDS;
  const answers = {} as Record<ContractQuestionId, ContractAnswer>;

  // 1) الهدف
  const objectives = lesson.objectives;
  const shortestObjective = Math.min(...objectives.map((item) => chars(item.ar)));
  answers.goal = {
    ok: objectives.length >= 2 && objectives.every((item) => chars(item.ar) >= T.objectiveArMinChars && chars(item.de) >= T.objectiveDeMinChars) && chars(lesson.descriptionAr) >= T.descriptionArMinChars,
    valueAr: `${objectives.length} أهداف؛ أقصرها ${shortestObjective} حرفًا، والوصف ${chars(lesson.descriptionAr)} حرفًا`,
  };

  // 2) المتطلب السابق: رابط مؤلَّف في شبكة القواعد، أو ترتيب المنهج كانطباع لا كدعوى
  const nodes = grammarNodesByLesson[lesson.id] ?? [];
  const withParents = nodes.filter((node) => node.prerequisiteIds.length > 0);
  const previous = previousLessonId(lesson);
  const kind = withParents.length > 0 ? "authored" : nodes.length > 0 ? "authored-node-without-parents" : previous ? "curriculum-order" : "founding";
  answers.prerequisites = {
    ok: kind === "authored" || kind === "authored-node-without-parents" || kind === "founding",
    valueAr: kind === "authored" ? `${withParents.length} نقطة قاعدة موصولة بسابقها (تأليف صريح)`
      : kind === "authored-node-without-parents" ? "نقطة قاعدة موصولة بدرسها بلا سابق: نقطة تأسيس"
      : kind === "curriculum-order" ? `لا رابط مؤلَّف؛ الاستنتاج من ترتيب المنهج فقط (${previous})`
      : "أول درس في المستوى: نقطة تأسيس بلا سابق",
    ...(kind === "curriculum-order" ? { gapAr: "المتطلب مستنتج من الترتيب لا من رابط مؤلَّف نقطةً بنقطة" } : {}),
  };

  // 3) شرح + نموذج
  const theoryShort = lesson.theory.filter((block) => chars(block.explanationAr) < T.theoryExplanationMinChars || block.examples.length < T.theoryExamplesMin);
  const examples = Math.min(...lesson.theory.map((block) => block.examples.length));
  answers["explanation-model"] = {
    ok: theoryShort.length === 0 && lesson.theory.length >= 1 && lesson.entry.dialogue.length >= T.dialogueMinLines && chars(lesson.writing.modelDe) >= T.inLessonModelMinChars,
    valueAr: `${lesson.theory.length} كتلة شرح (أقصرها ${Math.min(...lesson.theory.map((b) => chars(b.explanationAr)))} حرفًا، ${examples} مثالًا) + حوار ${lesson.entry.dialogue.length} سطرًا + نموذج كتابة ${chars(lesson.writing.modelDe)} حرفًا`,
    ...(theoryShort.length > 0 ? { gapAr: `${theoryShort.length} كتلة شرح دون الحد`} : {}),
  };

  // 4) تدريب متدرَّج مصحَّح
  const types = new Set(lesson.exercises.map((item) => item.type));
  const weakItems = [...lesson.exercises, ...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest].filter((item) => chars(item.explanationAr) < T.itemExplanationMinChars);
  answers["graded-practice"] = {
    ok: lesson.exercises.length >= T.exercisesMin && types.size >= T.exerciseTypesMin && weakItems.length === 0,
    valueAr: `${lesson.exercises.length} تمرينًا بـ${types.size} أنواع (ترتيب كلمات ${lesson.exercises.filter((e) => e.type === "word-ordering").length}، تصحيح خطأ ${lesson.exercises.filter((e) => e.type === "error-correction").length}) + ${lesson.miniTest.length} سؤال اختبار قصير`,
  };

  // 5) النقل إلى وضع جديد: داخل الدرس + مهمة مؤجلة مستقلة
  // مهمة النقل المؤجلة تُربط بالدرس المصدري، لا بمعرّف المهمة (`independent-a1-3`).
  const deferred = independentProductionTasks.find((task) => task.sourceLessonId === lesson.id);
  const inLesson = chars(lesson.writing.promptDe) >= T.transferPromptMinChars && lesson.writing.checklistAr.length >= T.transferChecklistMin
    && lesson.speaking.successCriteriaAr.length >= T.speakingCriteriaMin && chars(lesson.mediation.taskAr) >= T.mediationTaskMinChars;
  // السقف الصعب هو وجود مهمة النقل داخل الدرس؛ مهمة النقل المؤجلة فجوة مؤلَّفة تُرقَم وتُسَدّ.
  answers.transfer = {
    ok: inLesson,
    valueAr: `كتابة ${chars(lesson.writing.promptDe)} حرفًا و${lesson.writing.checklistAr.length} معايير، كلام بـ${lesson.speaking.successCriteriaAr.length} معايير، وساطة ${chars(lesson.mediation.taskAr)} حرفًا؛ مهمة نقل مؤجلة: ${deferred ? "موجودة" : "غير مؤلَّفة"}`,
    ...(!deferred ? { gapAr: "لا مهمة نقل مؤجلة مرتبطة بهذا الدرس: لا دليل استقلال بعد ثلاثة أيام" } : {}),
  };

  // 6) تصحيح محدد لكل خطأ
  const stubWhy = lesson.mistakes.filter((item) => chars(item.whyAr) < T.mistakeWhyMinChars);
  const stubTrick = lesson.mistakes.filter((item) => chars(item.trickAr) < T.mistakeTrickMinChars);
  // الصعب: لا بند مصحَّح بلا تبرير، وأسطر الأخطاء موجودة. العمق التأليفي (طول الشرح) فجوة مرقومة.
  answers.feedback = {
    ok: lesson.mistakes.length >= T.mistakesMin && weakItems.length === 0,
    valueAr: `${lesson.mistakes.length} أسطر خطأ: ${stubWhy.length} شرحًا دون ${T.mistakeWhyMinChars} حرفًا و${stubTrick.length} تريك دون ${T.mistakeTrickMinChars}؛ وكل البنود المصحَّحة (${[...lesson.exercises, ...lesson.reading.questions, ...lesson.listening.questions, ...lesson.miniTest].length}) لها تبرير`,
    ...(stubWhy.length + stubTrick.length > 0 ? { gapAr: `${stubWhy.length + stubTrick.length} سطر تصحيح بلا تفصيل يكفي طالبًا عربيًا`} : {}),
  };

  // 7) الفصل بين التدريب ودليل الاستقلال — عقد التسمية في واجهة الدرس
  const recallLabelIsTraining = LEARNING_STATE_LABELS.firstUnaidedRecall.includes("تدريب");
  const noteSaysDeferred = LEARNING_STATE_INDEPENDENCE_NOTE.includes("ثلاثة أيام");
  const retainedLabel = LEARNING_STATE_LABELS.retained;
  answers["evidence-split"] = {
    ok: recallLabelIsTraining && noteSaysDeferred && retainedLabel.includes("مؤجل"),
    valueAr: `التدريب: «${LEARNING_STATE_LABELS.training}» و«${LEARNING_STATE_LABELS.firstUnaidedRecall}»؛ الاستقلال: «${retainedLabel}»`,
    ...(!(recallLabelIsTraining && noteSaysDeferred) ? { gapAr: "واجهة الدرس تسمّي أول استدعاء بلا سند استقلالًا: تسمية مرفوضة"} : {}),
  };

  // 8) ما سيُراجع لاحقًا
  const cards = buildLessonSrsCards(lesson);
  const pool = new Set(reviewCards.map((card) => card.id));
  const missingFromPool = cards.filter((card) => !pool.has(card.id)).length;
  answers["review-later"] = {
    ok: cards.length >= T.lessonCardsMin && missingFromPool === 0,
    valueAr: `${cards.length} بطاقة تدخل طابور SM-2 (${missingFromPool} غير مسجلة في مجموعة المراجعة)`,
    ...(missingFromPool > 0 ? { gapAr: `${missingFromPool} بطاقة من الدرس لن تصل إلى المراجعة`} : {}),
  };

  const hardFailures = CONTRACT_QUESTIONS.filter((question) => question.hard && !answers[question.id].ok).map((question) => question.id);
  const gaps = CONTRACT_QUESTIONS.filter((question) => answers[question.id].gapAr).map((question) => `${question.id}: ${answers[question.id].gapAr}`);
  return { policyVersion: LESSON_TEACHING_CONTRACT_POLICY, lessonId: lesson.id, level: lesson.level, answers, hardFailures, gaps, boundary: LESSON_TEACHING_CONTRACT_BOUNDARY };
}

export function allLessonsTeachingContract(lessons: readonly FullLesson[]) {
  return lessons.map(lessonTeachingContract);
}
