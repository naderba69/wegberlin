import { academicLessonList } from "@/data/academic-lessons";

/**
 * خريطة مواءمة خاصة بالمتعلّم (P2-93، ADR-092).
 *
 * السؤال الذي يجيبه هذا الملف: إذا كان المتعلّم يملك — **قانونيًا** — فهرسًا لمصدره
 * الخاص (فهرس كتابه أو قائمة دروسه)، فكيف نبني له خريطة تُقابِل دروسنا بمواضع فهرسه
 * **دون أن نراه ولا نحتفظ به**؟
 *
 * الجواب في ثلاث قواعد غير قابلة للتفاوض:
 *  1. **لا فهرس مشحون.** الفهرس الذي لا يملكه المستخدم لا يُخزَّن في التطبيق أصلًا،
 *     ولا يوجد جدول مواءمة جاهز مع أي كتاب. الوحدة تستقبل فهرسًا **يلصقه المتعلّم**
 *     من ملكه (يده/رخصته)، كما يلصق أي ملاحظة شخصية.
 *  2. **الاتجاه واحد: من دروسنا إلى فهرسه.** نحن نطرح «إلى أين يقع هذا الدرس في
 *     فهرسك؟» ونقبل **رقمًا/تسمية يكتبها هو**؛ ولا نكتب مواضع فهرسه بالنيابة عنه.
 *  3. **صفر ادّعاء مواءمة.** لا ندّعي أن أي صفحة في كتابه «تطابق» درسنا، ولا أن
 *     المواءمة مراجَعة أو معتمدة. الخريطة **ملاحظة شخصية اختيارية**، لا دليل تعلّم،
 *     ولا تدخل أي بوابة مستوى ولا أي حساب إتقان.
 */

export const ALIGNMENT_MAP_POLICY = "learner-owned-alignment-map-v1" as const;

/** الحدّ المعلن كما يُعرض في الواجهة. */
export const ALIGNMENT_CLAIM_BOUNDARY =
  "private-learner-map-no-book-reproduction-no-matching-claim" as const;

/** حدّ سياق الفهرس الملصوق: تسمية المصدر وحدها. */
export const ALIGNMENT_SOURCE_LABEL_MAX_CHARS = 120;

/** حدّ موضع الفهرس الذي يكتبه المتعلّم: 60 حرفًا تكفي لـ«ص 42، nr. 3». */
export const ALIGNMENT_INDEX_HINT_MAX_CHARS = 60;

/** حدّ الفهرس الملصوق الخام: 6,000 حرف قبل التنقية. */
export const ALIGNMENT_PASTED_INDEX_MAX_CHARS = 6_000;

/** أقصى عدد سطور مطبوعة من الفهرس الملصوق (للاختيار فقط، لا تُحفظ). */
export const ALIGNMENT_PARSED_LINE_MAX = 400;

/**
 * العبارة الصريحة التي يجب أن يقرّ بها المتعلّم. ليست نصًّا تجميليًا: من دونها لا
 * تُبنى خريطة، لأن جوهر البند أن الفهرس من ملك المتعلّم لا من ملكنا.
 */
export const ALIGNMENT_OWNERSHIP_STATEMENT_AR =
  "أُقرّ أن هذا الفهرس ملكي أو مرخّص لي باستعماله، وأن هذه الخريطة خاصة بي.";

/** الرفض المكتوب كما يُعرض — لا صمت يترك المتعلّم يظنّ أن شيئًا حُفظ. */
export const ALIGNMENT_OWNERSHIP_REFUSAL_AR =
  "لم تُحفظ خريطة المواءمة: لا تُبنى خريطة إلا على فهرس يُقرّ المتعلّم أنه يملكه أو يرخّصه.";

/**
 * كلمات حجب: إن ظهرت في السياق الملصوق فالمقصود نسخٌ من الكتاب نفسه، وهو ما لا
 * نشتغل به. الحجب هنا مقصود وضيّق (أفعال/تسميات النسخ والاستخراج)، لا يمنع أرقام
 * الصفحات ولا أسماء الوحدات.
 */
export const ALIGNMENT_REPRODUCTION_PATTERNS: readonly RegExp[] = [
  /نص\s+الكتاب|text\s+des\s+buchs|book\s+text/i,
  /النقل\s+الكامل|full\s+transcript|كامل\s+الوحدة/i,
  /تحميل\s+الكتاب|ocr\s|مسح\s+ضوئي|scan\s+der/i,
  /استخراج\s+النص|text\s+extraction/i,
];

export function containsReproductionLikeText(value: string): boolean {
  const normalized = value.normalize("NFKC");
  return ALIGNMENT_REPRODUCTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export type AlignmentContactReference = {
  lessonId: string;
  titleDe: string;
  titleAr: string;
  level: string;
  href: string;
};

/** دروسنا المشحونة هي الطرف الأول الوحيد الممكن؛ لا فهرس خارجي هنا. */
export const alignmentContactReferences: readonly AlignmentContactReference[] =
  academicLessonList.map((lesson) => ({
    lessonId: lesson.id,
    titleDe: lesson.titleDe,
    titleAr: lesson.titleAr,
    level: lesson.level,
    href: `/lernen/${lesson.id}`,
  }));

const contactReferenceMap = new Map(
  alignmentContactReferences.map((reference) => [reference.lessonId, reference]),
);

export const alignmentContactCount = alignmentContactReferences.length;

export function getAlignmentContact(lessonId: string): AlignmentContactReference {
  const reference = contactReferenceMap.get(lessonId);
  if (!reference) throw new Error("معرف الدرس غير معروف: لا مواءمة خارج الدروس المنشورة.");
  return reference;
}

export type LearnerAlignmentEntry = {
  /** درسنا: الطرف الذي نعرف صفّه ومستواه. */
  lessonId: string;
  /** مستوى درسنا كما هو منشور. */
  level: string;
  /** موضع الفهرس كما كتبه المتعلّم نفسه — لا يُشتقّ ولا يُخمَّن ولا يُصحَّح آليًا. */
  indexHint: string;
  updatedAt: string;
};

export type LearnerAlignmentMap = {
  policyVersion: typeof ALIGNMENT_MAP_POLICY;
  /** تسمية المصدر التي كتبها المتعلّم (مثال: «فهرست كتابي الخاص»). حرة تمامًا. */
  sourceLabel: string;
  /** إقرار الملكية: `true` بعد أن قرّ المتعلّم بنصّ الإقرار. */
  ownershipAcknowledged: true;
  /**
   * الفهرس الخام الملصوق. يُستخدم لحظة المعالجة **ولا يُحفظ أبدًا**: الحفظ يمرّ عبر
   * `sanitizeAlignmentMapForStorage` وهذا الحقل يُفرَغ فيه.
   */
  pastedIndex: string;
  entries: LearnerAlignmentEntry[];
  /** حدّ الادّعاء المطبوع مع الخريطة. */
  claimBoundary: typeof ALIGNMENT_CLAIM_BOUNDARY;
  createdAt: string;
  updatedAt: string;
};

/**
 * تنقية النص الملصوق: لا محارف تحكّم ولا اتجاه مخفي ولا صفوف فارغة. لا تُضاف كلمات
 * ولا تُصحَّح؛ التنقية إزالةُ وسائط لا إعادةُ صياغة (وهذا فرق يهمّ: النصّ يبقى نصّ
 * المتعلّم بحرفه).
 */
export function cleanPastedIndex(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/\r\n?/gu, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.trim().length > 0)
    .slice(0, ALIGNMENT_PARSED_LINE_MAX)
    .join("\n")
    .slice(0, ALIGNMENT_PASTED_INDEX_MAX_CHARS);
}

export function cleanAlignmentSourceLabel(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, ALIGNMENT_SOURCE_LABEL_MAX_CHARS);
}

export function cleanAlignmentIndexHint(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, ALIGNMENT_INDEX_HINT_MAX_CHARS);
}

/**
 * سطور الفهرس الملصوق كما هي — للعرض والاختيار فقط. لا تُحلَّل بنيويًا ولا تُخمَّن
 * أرقامها: أي تفسير آلي هنا سيكون ادّعاء مواءمة بلا مراجعة.
 */
export function listPastedIndexLines(value: string): string[] {
  return cleanPastedIndex(value).split("\n").map((line) => line.trim()).filter(Boolean);
}

export type AlignmentMapDraft = {
  sourceLabel: string;
  pastedIndex: string;
  ownershipAcknowledged: boolean;
  entries: Array<{ lessonId: string; indexHint: string }>;
  createdAt: string;
  updatedAt: string;
};

export type AlignmentMapGuardReason = "ownership" | "reproduction" | "empty-index" | "unknown-lesson";

export type AlignmentMapResult =
  | { ok: true; map: LearnerAlignmentMap; keptEntryCount: number; droppedEntryCount: number }
  | { ok: false; reason: AlignmentMapGuardReason; messageAr: string };

/** باني الخريطة: يمرّ أو يرفض برسالة عربية صريحة، ولا يوجد مسار ثالث. */
export function buildLearnerAlignmentMap(input: {
  draft: AlignmentMapDraft;
  acknowledge: boolean;
}): AlignmentMapResult {
  const { draft } = input;
  if (!input.acknowledge || !draft.ownershipAcknowledged) {
    return { ok: false, reason: "ownership", messageAr: ALIGNMENT_OWNERSHIP_REFUSAL_AR };
  }
  if (containsReproductionLikeText(draft.pastedIndex) || containsReproductionLikeText(draft.sourceLabel)) {
    return {
      ok: false,
      reason: "reproduction",
      messageAr:
        "لم تُحفظ خريطة المواءمة: السياق يشير إلى نقل نصّ الكتاب أو استخراجه. المسموح رقم الصفحة/الوحدة أو اسم الوحدة فقط، لا نصّ المصدر.",
    };
  }
  const pastedIndex = cleanPastedIndex(draft.pastedIndex);
  if (!pastedIndex) {
    return {
      ok: false,
      reason: "empty-index",
      messageAr: "لم تُحفظ خريطة المواءمة: لم يصل أي سطر من الفهرس الذي تملكه.",
    };
  }
  const seen = new Set<string>();
  const entries: LearnerAlignmentEntry[] = [];
  let dropped = 0;
  for (const entry of draft.entries) {
    const hint = cleanAlignmentIndexHint(entry.indexHint ?? "");
    if (!hint) {
      dropped += 1;
      continue;
    }
    const reference = contactReferenceMap.get(entry.lessonId);
    if (!reference) {
      dropped += 1;
      continue;
    }
    if (seen.has(entry.lessonId)) {
      dropped += 1;
      continue;
    }
    seen.add(entry.lessonId);
    entries.push({
      lessonId: reference.lessonId,
      level: reference.level,
      indexHint: hint,
      updatedAt: draft.updatedAt,
    });
  }
  const map: LearnerAlignmentMap = {
    policyVersion: ALIGNMENT_MAP_POLICY,
    sourceLabel: cleanAlignmentSourceLabel(draft.sourceLabel) || "فهرس يملكه المتعلّم",
    ownershipAcknowledged: true,
    pastedIndex,
    entries,
    claimBoundary: ALIGNMENT_CLAIM_BOUNDARY,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
  return { ok: true, map, keptEntryCount: entries.length, droppedEntryCount: dropped };
}

export class AlignmentMapGuardError extends Error {}

/** رفض بنيويّ قبل الاحتفاظ: خريطة بلا إقرار محفوظ أو بموضع فهرسي مشوّه = لا تُبقى. */
export function assertAlignmentMapIntegrity(map: LearnerAlignmentMap): void {
  if (map.policyVersion !== ALIGNMENT_MAP_POLICY) {
    throw new AlignmentMapGuardError("إصدار سياسة الخريطة غير معروف.");
  }
  if (map.ownershipAcknowledged !== true) {
    throw new AlignmentMapGuardError(ALIGNMENT_OWNERSHIP_REFUSAL_AR);
  }
  if (map.claimBoundary !== ALIGNMENT_CLAIM_BOUNDARY) {
    throw new AlignmentMapGuardError("حدّ الادّعاء مفقود: الخريطة لا تُحفظ بلا حدودها.");
  }
  for (const entry of map.entries) {
    if (!contactReferenceMap.has(entry.lessonId)) {
      throw new AlignmentMapGuardError(`معرف درس غير معروف في الخريطة: ${entry.lessonId}`);
    }
    if (cleanAlignmentIndexHint(entry.indexHint) !== entry.indexHint || !entry.indexHint) {
      throw new AlignmentMapGuardError("موضع فهرس غير مقبول في الخريطة.");
    }
  }
}

/**
 * الحفظ: الفهرس الخام يُفرَّغ هنا. هذه هي النقطة التي يُفي فيها الوعد المكتوب في
 * الواجهة («الفهرس الملصوق لا يُحفظ»)، ويغطّيها اختبار وحدة صريح.
 */
export function sanitizeAlignmentMapForStorage(
  map: LearnerAlignmentMap,
): LearnerAlignmentMap {
  return { ...map, pastedIndex: "" };
}

/** تحديث موضع واحد بعد البناء (المتعلّم يعيد الكتابة لاحقًا). */
export function updateAlignmentEntry(
  map: LearnerAlignmentMap,
  lessonId: string,
  indexHint: string,
  now?: Date,
): LearnerAlignmentMap {
  const reference = getAlignmentContact(lessonId);
  const hint = cleanAlignmentIndexHint(indexHint);
  const stamp = (now ?? new Date()).toISOString();
  const entries = hint
    ? [
        ...map.entries.filter((entry) => entry.lessonId !== lessonId),
        { lessonId, level: reference.level, indexHint: hint, updatedAt: stamp },
      ]
    : map.entries.filter((entry) => entry.lessonId !== lessonId);
  return { ...map, entries, updatedAt: stamp };
}

export function removeAlignmentEntries(
  map: LearnerAlignmentMap,
  lessonIds: string[],
): LearnerAlignmentMap {
  const remove = new Set(lessonIds);
  return { ...map, entries: map.entries.filter((entry) => !remove.has(entry.lessonId)) };
}

/** دمج استيراد صفين: الأحدث لكل درس يفوز، وبلا نسخ مزدوج. */
export function mergeLearnerAlignmentMaps(
  current: LearnerAlignmentMap | null | undefined,
  incoming: LearnerAlignmentMap | null | undefined,
): LearnerAlignmentMap | null {
  if (!current) return incoming ?? null;
  if (!incoming) return current;
  const merged = new Map<string, LearnerAlignmentEntry>();
  for (const entry of [...current.entries, ...incoming.entries]) {
    const existing = merged.get(entry.lessonId);
    if (!existing || Date.parse(entry.updatedAt) >= Date.parse(existing.updatedAt)) {
      merged.set(entry.lessonId, entry);
    }
  }
  const newerFirst = Date.parse(incoming.updatedAt) >= Date.parse(current.updatedAt);
  return {
    policyVersion: ALIGNMENT_MAP_POLICY,
    sourceLabel: newerFirst ? incoming.sourceLabel : current.sourceLabel,
    ownershipAcknowledged: true,
    pastedIndex: "",
    entries: [...merged.values()].sort((a, b) => a.level.localeCompare(b.level) || a.lessonId.localeCompare(b.lessonId)),
    claimBoundary: ALIGNMENT_CLAIM_BOUNDARY,
    createdAt: Date.parse(incoming.createdAt) <= Date.parse(current.createdAt) ? incoming.createdAt : current.createdAt,
    updatedAt: newerFirst ? incoming.updatedAt : current.updatedAt,
  };
}

export type AlignmentCoverageRow = {
  level: string;
  mappedCount: number;
  totalCount: number;
};

/**
 * العدّ بالاتجاه الواحد: كم درسًا من **دروسنا** له موضع عند المتعلّم. لا يقلب العدّ
 * إلى «كم من كتابه غطّيناه»، لأن ذلك ادّعاء مواءمة لا نملكه.
 */
export function alignmentCoverageByLevel(
  map: LearnerAlignmentMap | null | undefined,
): AlignmentCoverageRow[] {
  const levels = [...new Set(alignmentContactReferences.map((reference) => reference.level))].sort();
  return levels.map((level) => {
    const total = alignmentContactReferences.filter((reference) => reference.level === level).length;
    const mapped = new Set(
      (map?.entries ?? []).filter((entry) => entry.level === level).map((entry) => entry.lessonId),
    ).size;
    return { level, mappedCount: mapped, totalCount: total };
  });
}

/** عدّادات صريحة للواجهة: محسوبة من صفوف مطابقة فعلًا، لا من وعد. */
export function alignmentSummary(map: LearnerAlignmentMap | null | undefined) {
  const entries = map?.entries ?? [];
  const levels = new Set(entries.map((entry) => entry.level));
  return {
    mappedLessonCount: entries.length,
    mappingLevelCount: levels.size,
    contactLessonCount: alignmentContactCount,
    unmappedLessonCount: alignmentContactCount - entries.length,
    pastedIndexStored: Boolean(map?.pastedIndex),
  };
}

/** الحدّ الصادق المطبوع مع الخريطة، بنصّ واحد للحقيقة. */
export const ALIGNMENT_HONEST_NOTE_AR =
  "ملاحظة شخصية اختيارية: تقابل دروس التطبيق بمواضع فهرس تملكه أنت. لا تُحفظ منها نسخة من فهرسك ولا نصّ مصدرك، ولا تدّعي هذه الخريطة أن أحدًا راجع المواءمة أو اعتمدها، ولا تدخل أي بوابة مستوى أو حساب إتقان.";
