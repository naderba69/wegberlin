/**
 * P0-135: سرعات تعليمية مضبوطة في كل مشغلات الاستماع.
 *
 * المشكلة: Shadowing وحده كان يعرض 0.75×/1×/1.15×، وبقية مشغلات الاستماع
 * (درس، مكتبة، تشخيص، محاكاة امتحان) كانت `<audio controls>` خامًا بلا تحكّم —
 * أي أن أهم مهارة في الامتحان (الفهم السمعي) بلا أداة ضبط.
 *
 * القرار: **مصدر واحد** للسرعة تتشاركه كل المشغلات، محفوظ على الجهاز، ومطبَّق
 * كذلك على صوت المتصفح البديل (TTS) حتى لا يتغيّر الإيقاع بين المسارين.
 *
 * القيم ليست اعتباطية: 1× هو الأصل (ما سيسمعه في الامتحان)، 0.75× للتشريح
 * (تمييز الحدود بين الكلمات)، و1.15× لتقريب الإيقاع من سرعة امتحانية أعلى.
 * لا تُعرض سرعات خارج هذه الثلاث: تغيير الإيقاع أداة فهم، لا لعبًا في التشغيل.
 *
 * الحدود المُعلنة: `playbackRate` يحفظ الطبقة الصوتية (لا يحوّل الصوت إلى
 * «سنحاب»)، لكن **عدم التشويه على أذن فعلية لم يُتحقَّق منه بشريًا** على كل
 * ملفات الصوت — وهذا وحده ما يُبقي البند جزئيًا. التسجيلات الشخصية تُترك
 * بالسرعة الأصلية قصدًا: الهدف هناك سماع صوت المتعلّم كما هو.
 */

export const STUDY_SPEEDS = [0.75, 1, 1.15] as const;
export type StudySpeed = (typeof STUDY_SPEEDS)[number];

export const DEFAULT_STUDY_SPEED: StudySpeed = 1;
export const STUDY_SPEED_STORAGE_KEY = "dwnb-study-speed";

export function isStudySpeed(value: unknown): value is StudySpeed {
  return typeof value === "number" && (STUDY_SPEEDS as readonly number[]).includes(value);
}

/** أي قيمة غير معلومة تُردّ إلى الأصل (1×) لا إلى أقرب سرعة: الأصل هو الآمن. */
export function clampStudySpeed(value: unknown): StudySpeed {
  return isStudySpeed(value) ? value : DEFAULT_STUDY_SPEED;
}

export function studySpeedLabel(speed: StudySpeed): string {
  return `${speed}×`;
}

/** معدّل نطق المتصفح = المعدّل الأساسي للنص × سرعة الدراسة المختارة. */
export function ttsRateFor(baseRate: number, speed: StudySpeed): number {
  const composed = baseRate * speed;
  // نطاق SpeechSynthesisUtterance.rate الآمن: 0.1 إلى 10.
  return Math.min(10, Math.max(0.1, Number(composed.toFixed(3))));
}

/** يطبّق السرعة ويُبلغ هل طُبّقت فعلًا: المتصفح قد يرفضها قبل توفر البيانات. */
export function applyStudySpeed(audio: HTMLAudioElement | null | undefined, speed: StudySpeed): boolean {
  if (!audio) return false;
  try {
    audio.playbackRate = speed;
    // بعض المتصفحات تُعيد المعدّل إلى 1 عند تغيّر المصدر؛ نُثبّته عند التشغيل أيضًا.
    audio.defaultPlaybackRate = speed;
    return audio.playbackRate === speed;
  } catch {
    return false;
  }
}

// ——————————————————————————————————————————————————————————————————————————
// مخزن بسيط: كل المشغلات تقرأ سرعة واحدة، وتتحدّث معًا عند تغييرها.
// ——————————————————————————————————————————————————————————————————————————

const listeners = new Set<() => void>();
let currentSpeed: StudySpeed = DEFAULT_STUDY_SPEED;
let hydrated = false;

function hydrate(): StudySpeed {
  if (hydrated) return currentSpeed;
  hydrated = true;
  if (typeof window !== "undefined") {
    try {
      currentSpeed = clampStudySpeed(Number(window.localStorage.getItem(STUDY_SPEED_STORAGE_KEY)));
    } catch {
      currentSpeed = DEFAULT_STUDY_SPEED;
    }
  }
  return currentSpeed;
}

export function getStudySpeed(): StudySpeed {
  return hydrate();
}

export function setStudySpeed(speed: StudySpeed): StudySpeed {
  const next = clampStudySpeed(speed);
  const changed = next !== hydrate();
  currentSpeed = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STUDY_SPEED_STORAGE_KEY, String(next));
    } catch {
      /* التخزين المحلي قد يكون معطّلًا؛ السرعة تبقى للجلسة */
    }
  }
  if (changed) for (const listener of listeners) listener();
  return next;
}

export function subscribeStudySpeed(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** سرعة النطق الافتراضية لكل نص (تختلف قليلًا بين نص محادثة ونص عرض). */
export const TTS_BASE_RATE = 0.92 as const;
