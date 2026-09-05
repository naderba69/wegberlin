/**
 * P0-99: جرد فعلي لتغطية «الفعل + حرف الجر + الحالة» في كل درس منشور.
 *
 * المنهج: يُستخرج كل نص ألماني من محتوى الدرس (النظرية، المفردات، التمارين، القراءة،
 * الاستماع، الأمثلة) ويُقسَّم إلى جمل. يُعدّ مدخل القاموس **هدفًا** في ذلك الدرس إذا
 * اجتمعت ثلاثة شروط في الجملة نفسها:
 *   1. ظهر أحد أشكال الفعل التصريفية — مع اشتراط الحرف الصغير إلا في بداية الجملة،
 *      حتى لا تُحسب الأسماء المكتوبة بحرف كبير (مثل "Stelle" مقابل "stelle").
 *   2. ظهر حرف الجر مفتوحًا متممًا اسميًا حقيقيًا (أداة + اسم، أو صيغة مدمجة،
 *      أو اسم علم بعد nach).
 *   3. ولو كان الفعل منفصلًا، ظهرت بادئته المنفصلة في الجملة نفسها.
 *
 * وبعد ذلك تُقارن الأهداف بالإطارات المؤلفة، فيظهر الفارق رقمًا مقيسًا.
 *
 * المتممات الظرفية/الزمنية (مثل wohnen in، stehen auf، beginnen um) تُصرَّح في القاموس
 * ولا تُقاس، لأن قياسها يعدّ كل جملة مكانية فجوة، وهذا تضخيم بلا معنى تعليمي.
 *
 * حدّ الجرد معلن: لا يستخدم مُعلّمًا صرفيًا (POS tagger)، بل قائمة أشكال مؤلفة،
 * لذلك قد يفوت فعلًا مذكورًا بصيغة غير مدرجة أو بتركيب نحوي غير متوقع. الفائدة أن
 * الفجوة تصبح رقمًا مقيسًا لا انطباعًا، وأن كل فجوة مقاسة تُغلَق قبل إغلاق البند.
 */
import { academicLessonList } from "./academic-lessons";
import { measuredValencyEntries, valencyEntriesById, type ValencyEntry } from "./verb-preposition-dictionary";

/** يجمع كل النصوص الألمانية (التي تحمل حروفًا لاتينية ولا تحمل عربية) من أي بنية متداخلة. */
function germanStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    if (/[A-Za-zÄÖÜäöüß]/.test(value) && !/[؀-ۿ]/.test(value)) out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) germanStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) germanStrings(nested, out);
    return out;
  }
  return out;
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * يطابق الأشكال التصريفية للفعل مع تمييز حالة الحرف الأول:
 * الأسماء الألمانية مكتوبة بحرف كبير، فلا تُعدّ "Stelle" تحقيقًا للفعل "stelle"
 * إلا إن وقعت في بداية الجملة. المطابقة نفسها غير حساسة للحالة، والفحص على الحرف الأول.
 */
function wordMatcher(forms: readonly string[]) {
  const pattern = new RegExp(`([^\\p{L}]|^)(${forms.map(escape).join("|")})(?=$|[^\\p{L}])`, "giu");
  return (segment: string) => {
    for (const match of segment.matchAll(pattern)) {
      const token = match[2];
      if (/^\p{Ll}/u.test(token)) return true;
      if ((match.index ?? 0) + match[1].length === 0) return true;
    }
    return false;
  };
}

/** الضمائر الانعكاسية: شرط لازم للأفعال الانعكاسية حتى لا تُحسب الاستعمالات غير الانعكاسية. */
const REFLEXIVE_PRONOUNS = ["sich", "mich", "dich", "uns", "euch"];

/** أدوات التعريف والتنكير والملكية التي تفتح عادةً متممًا جرّيًا حقيقيًا. */
const DETERMINER =
  "der|die|das|den|dem|des|ein|eine|einem|einer|einen|eines|kein|keine|keinem|keinen|mein|meine|meinem|meinen|dein|deine|deinem|deinen|sein|seine|seinem|seinen|ihr|ihre|ihrem|ihren|unser|unsere|unserem|unseren|euer|euere|euerem|eueren|welcher|welche|welchem|welchen|dieser|diese|diesem|diesen|jeder|jede|jedem|jeden|alle|allen|aller|allem|jedes|manche|manchem|manchen|viele|vielen|wenige|wenigen|mehrere|beide|beiden|andere|anderen|anderer";

/** صيغ مدمجة شائعة تدل على متمم جرّي: ins, im, am, ans, aufs, vom, zum, zur, beim. */
const FUSED = ["ins", "im", "am", "ans", "aufs", "vom", "zum", "zur", "beim"];

/**
 * هل يفتح حرف الجر متممًا اسميًا حقيقيًا في هذه الجملة؟
 * الشرط: تتبعه أداة، أو يظهر مدمجًا، أو (مع nach) اسم مكتوب بحرف كبير.
 * هذا يمنع عدّ "zu" المصدرية و"mit" الظرفية و"von" في تراكيب أخرى كأهداف.
 */
function hasPrepositionalComplement(sentence: string, preposition: string): boolean {
  const lower = sentence.toLowerCase();
  const prep = preposition.toLowerCase();
  if (new RegExp(`\\b${escape(prep)}\\s+(?:${DETERMINER})\\b`, "u").test(lower)) return true;
  if (prep === "nach" && new RegExp("\\bnach\\s+[A-ZÄÖÜ][\\p{L}]+", "u").test(sentence)) return true;
  for (const fused of FUSED) {
    const stem = fused.slice(0, -1);
    if (stem.startsWith(prep) && new RegExp(`\\b${escape(fused)}\\b`, "u").test(lower)) return true;
  }
  return false;
}

/** يقسّم النص إلى جمل/أسطر قصيرة حتى يُقاس التلازم داخل الجملة نفسها. */
function segmentsOf(text: string): string[] {
  return text
    .split(/[\n.!?;:•–—]+|\s{2,}/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function lessonSegments(lesson: unknown): string[] {
  return segmentsOf(germanStrings(lesson).join(" \n "));
}

const segmentsByLesson = new Map<string, string[]>(
  academicLessonList.map((lesson) => [lesson.id, lessonSegments(lesson)]),
);

function matchesEntry(segment: string, entry: ValencyEntry): boolean {
  if (!wordMatcher(entry.searchForms)(segment)) return false;
  if (!hasPrepositionalComplement(segment, entry.preposition)) return false;
  // الأفعال الانعكاسية: يلزم ضمير انعكاسي في الجملة نفسها، وإلا عدّدنا كل "sprechen für"
  // وكل "melden bei" تحقيقًا لـ"sich aussprechen für" و"sich melden bei".
  if (/^sich\b/u.test(entry.infinitive) && !wordMatcher(REFLEXIVE_PRONOUNS)(segment)) return false;
  if (entry.separablePrefix && entry.separablePrefix !== "sich" && !wordMatcher([entry.separablePrefix])(segment)) return false;
  if (entry.requireToken && !wordMatcher([entry.requireToken])(segment)) return false;
  return true;
}

/** الأهداف المقاسة لكل درس: مدخلات القاموس التي يقع فعلها فعلًا في نص الدرس. */
export const measuredTargetsByLesson: Record<string, string[]> = Object.fromEntries(
  academicLessonList.map((lesson) => {
    const segments = segmentsByLesson.get(lesson.id) ?? [];
    const targets = measuredValencyEntries
      .filter((entry) => segments.some((segment) => matchesEntry(segment, entry)))
      .map((entry) => entry.id);
    return [lesson.id, targets];
  }),
);

/** دليل الجرد: الجملة التي جعلت هذا المدخل هدفًا في الدرس، لأجل التدقيق البشري. */
export function targetEvidence(lessonId: string): Array<{ entryId: string; sentence: string }> {
  const segments = segmentsByLesson.get(lessonId) ?? [];
  const evidence: Array<{ entryId: string; sentence: string }> = [];
  for (const entryId of measuredTargetsByLesson[lessonId] ?? []) {
    const entry = valencyEntriesById[entryId];
    const sentence = segments.find((segment) => matchesEntry(segment, entry));
    if (sentence) evidence.push({ entryId, sentence: sentence.trim().slice(0, 220) });
  }
  return evidence;
}

export type LessonVerbCoverage = {
  lessonId: string;
  level: string;
  targetIds: string[];
  coveredIds: string[];
  gapIds: string[];
};

/**
 * يبني صفوف التغطية مقابل أي مجموعة إطارات (مؤلفة فقط، أو مؤلفة + مشتقة).
 * تمرير `hasFrame` من الخارج يمنع أي استيراد دائري مع السجل.
 */
export function buildLessonVerbCoverage(hasFrame: (lessonId: string, entryId: string) => boolean): Record<string, LessonVerbCoverage> {
  const result: Record<string, LessonVerbCoverage> = {};
  for (const lesson of academicLessonList) {
    const targets = measuredTargetsByLesson[lesson.id] ?? [];
    const coveredIds = targets.filter((entryId) => hasFrame(lesson.id, entryId));
    const gapIds = targets.filter((entryId) => !hasFrame(lesson.id, entryId));
    result[lesson.id] = {
      lessonId: lesson.id,
      level: lesson.id.slice(0, 2).toUpperCase(),
      targetIds: targets,
      coveredIds,
      gapIds,
    };
  }
  return result;
}

export type VerbCoverageSummary = {
  lessonCount: number;
  dictionarySize: number;
  lessonsWithTargets: number;
  lessonsWithGaps: number;
  totalTargets: number;
  totalCovered: number;
  totalGaps: number;
  gapLessons: string[];
  byLevel: Record<string, { lessons: number; targets: number; covered: number; gaps: number }>;
};

export function summarizeCoverage(rows: Record<string, LessonVerbCoverage>): VerbCoverageSummary {
  const values = Object.values(rows);
  const byLevel: VerbCoverageSummary["byLevel"] = {};
  for (const row of values) {
    byLevel[row.level] ??= { lessons: 0, targets: 0, covered: 0, gaps: 0 };
    byLevel[row.level].lessons += 1;
    byLevel[row.level].targets += row.targetIds.length;
    byLevel[row.level].covered += row.coveredIds.length;
    byLevel[row.level].gaps += row.gapIds.length;
  }
  return {
    lessonCount: values.length,
    dictionarySize: measuredValencyEntries.length,
    lessonsWithTargets: values.filter((row) => row.targetIds.length > 0).length,
    lessonsWithGaps: values.filter((row) => row.gapIds.length > 0).length,
    totalTargets: values.reduce((sum, row) => sum + row.targetIds.length, 0),
    totalCovered: values.reduce((sum, row) => sum + row.coveredIds.length, 0),
    totalGaps: values.reduce((sum, row) => sum + row.gapIds.length, 0),
    gapLessons: values.filter((row) => row.gapIds.length > 0).map((row) => row.lessonId),
    byLevel,
  };
}

/** الإطارات الناقصة لدرس بعينه، جاهزة للاشتقاق أو للفحص. */
export function gapEntriesFor(
  lessonId: string,
  hasFrame: (lessonId: string, entryId: string) => boolean,
): ValencyEntry[] {
  const targets = measuredTargetsByLesson[lessonId] ?? [];
  return targets
    .filter((entryId) => !hasFrame(lessonId, entryId))
    .map((entryId) => valencyEntriesById[entryId])
    .filter((entry): entry is ValencyEntry => Boolean(entry));
}
