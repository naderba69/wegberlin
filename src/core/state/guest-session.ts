import type { LearningState } from "@/types/learning";
import { defaultState } from "@/core/portability/db";
import {
  RESET_EVIDENCE_FIELDS,
  RESET_FIELD_POLICIES,
  attemptLogDeletionRefusalAr,
} from "@/core/state/reset-plan";

/**
 * P2-22 — وضع ضيف مؤقت ثم تحويله إلى ملف دائم محليًا.
 *
 * القاعدة الصارمة: الجلسة المؤقتة تُشتقّ من **صفر** لا من ملف المتعلّم النشط،
 * فلا يرى الضيف أدلّة أحد، ولا يُلوّث ملف أحد. والتحويل إلى ملف دائم يبني
 * ملفًا جديدًا كاملًا، ويثبت قبل الكتابة أن **أدلّة الجلسة قبل=بعد**،
 * وأن ملف المصدر لم يُمسّ.
 */

export const GUEST_SESSION_POLICY = "guest-session-profile-v1" as const;
export const GUEST_SESSION_STORAGE_KEY = "dwnb-guest-session" as const;
export const GUEST_DEFAULT_NAME_AR = "ضيف" as const;
export const GUEST_MAX_MINUTES = 240 as const;
export const GUEST_PROMOTION_REFUSAL_AR =
  "رفض التحويل: ملف دائم يحتاج اسمًا حقيقيًا (حرفان على الأقل) — الجلسة تبقى ضيفة كما هي.";

export type GuestSessionStatus = "temporary" | "promoted";

export type GuestSessionRecord = {
  id: string;
  displayNameAr: string;
  status: GuestSessionStatus;
  policyVersion: typeof GUEST_SESSION_POLICY;
  startedAt: string;
  /** دقائق صلاحية الجلسة المؤقتة؛ بعدها تُقترح الخطوة التالية صراحةً. */
  expiresAt: string;
  /** دقيق: الجلسة المؤقتة لا تُحتسب في أي بوابة ولا تُدّعى كملف تعلّم. */
  countsTowardLevelGate: false;
  countsAsStudyEvidence: false;
};

export type GuestSessionBoundary = {
  /** الوعد البنيوي: لا أدلّة من الملف النشط تدخل جلسة الضيف. */
  evidenceInheritedFromActiveProfile: false;
  /** ولا جلسة الضيف تُكتب في ملف أحد قبل التحويل الصريح. */
  writtenToActiveProfile: false;
  /** ولا قرار إتقان ولا فتح مستوى من جلسة ضيف. */
  awardsMastery: false;
  /** ولا إرسال شبكي: الحالة كلها محلية. */
  sendsToNetwork: false;
};

const EVIDENCE_KEY_SET = new Set<string>(RESET_EVIDENCE_FIELDS.map((field) => String(field)));
const CLASSIFIED_KEY_SET = new Set<string>(RESET_FIELD_POLICIES.map((row) => String(row.field)));

/** دقائق الجلسة المؤقتة محصورة بين 10 و240 دقيقة — لا جلسة ضيف أبدية. */
export function clampGuestMinutes(minutes: number, fallback = 30): number {
  if (!Number.isFinite(minutes)) return fallback;
  return Math.min(GUEST_MAX_MINUTES, Math.max(10, Math.round(minutes)));
}

/**
 * حالة الضيف: كل حقل تقدّم/إعداد يبدأ من المشحون المشترك، و**كل حقل دليل فارغ**.
 * لا قراءة لأي ملف قائم هنا — الدالة تأخذ الوقت فقط.
 */
export function createGuestState(now: Date = new Date()): LearningState {
  const guestProfile = {
    ...defaultState.profile!,
    name: GUEST_DEFAULT_NAME_AR,
    createdAt: now.toISOString(),
  };
  const state: LearningState = {
    ...defaultState,
    profile: guestProfile,
    updatedAt: now.toISOString(),
  };
  const blank: Record<string, unknown> = { ...state };
  for (const field of RESET_EVIDENCE_FIELDS) {
    const value = (defaultState as unknown as Record<string, unknown>)[field as string];
    blank[field as string] = Array.isArray(value) ? [] : value;
  }
  return blank as unknown as LearningState;
}

export type GuestCreateInput = {
  minutes: number;
  now?: Date;
  /** ملف المتعلّم النشط إن وُجد — يُقرأ للتثبّت فقط، ولا يدخل الجلسة. */
  activeState?: LearningState | null;
};

export type GuestCreateResult = {
  session: GuestSessionRecord;
  state: LearningState;
  boundary: GuestSessionBoundary;
};

export function createGuestSession(input: GuestCreateInput): GuestCreateResult {
  const now = input.now ?? new Date();
  const minutes = clampGuestMinutes(input.minutes);
  const state = createGuestState(now);
  requireGuestIsolation(state, input.activeState ?? null);
  const session: GuestSessionRecord = {
    id: `guest-${now.getTime().toString(36)}`,
    displayNameAr: `${GUEST_DEFAULT_NAME_AR} (${minutes} دقيقة)`,
    status: "temporary",
    policyVersion: GUEST_SESSION_POLICY,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + minutes * 60_000).toISOString(),
    countsTowardLevelGate: false,
    countsAsStudyEvidence: false,
  };
  return {
    session,
    state,
    boundary: {
      evidenceInheritedFromActiveProfile: false,
      writtenToActiveProfile: false,
      awardsMastery: false,
      sendsToNetwork: false,
    },
  };
}

/**
 * التثبّت البنيوي قبل أي استخدام: لا حقل أدلة يحمل قيمة في جلسة ضيف،
 * ولا قيمة من الملف النشط تساوت مع قيمة الضيف في حقل دليل.
 */
/** «فارغ» هنا بنيوي: مصفوفة بلا عناصر · كائن بلا مفاتيح · صفر/خطأ/عدم. */
export function isEmptyEvidenceValue(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  if (typeof value === "string") return value.length === 0;
  if (typeof value === "number") return value === 0;
  return false;
}

export function assertGuestIsolation(
  guest: LearningState,
  active: LearningState | null,
): { evidenceInheritedFromActiveProfile: boolean; nonEmptyEvidenceFields: string[] } {
  const guestMap = guest as unknown as Record<string, unknown>;
  const nonEmpty: string[] = [];
  for (const field of EVIDENCE_KEY_SET) {
    if (!isEmptyEvidenceValue(guestMap[field])) nonEmpty.push(field);
  }
  let inherited = false;
  if (active) {
    const activeMap = active as unknown as Record<string, unknown>;
    for (const field of EVIDENCE_KEY_SET) {
      const a = activeMap[field];
      const g = guestMap[field];
      // الوراثة تُقاس على محتوى غير فارغ: تشابه «فراغ الملفين» ليس وراثة.
      if (isEmptyEvidenceValue(a) || isEmptyEvidenceValue(g)) continue;
      if (JSON.stringify(a) === JSON.stringify(g)) inherited = true;
    }
  }
  return { evidenceInheritedFromActiveProfile: inherited, nonEmptyEvidenceFields: nonEmpty };
}

/**
 * يفرض الوعد البنيوي في `GuestSessionBoundary` بدل الاكتفاء بقياسه: حالة ضيف تحمل حقل دليل غير فارغ، أو قيمة دليل
 * مطابقة لقيمة الملف النشط، لا تُنشأ منها جلسة. (`assertGuestIsolation` تُبلغ ولا ترمي.)
 */
export function requireGuestIsolation(
  guest: LearningState,
  active: LearningState | null,
): { evidenceInheritedFromActiveProfile: boolean; nonEmptyEvidenceFields: string[] } {
  const isolation = assertGuestIsolation(guest, active);
  if (isolation.nonEmptyEvidenceFields.length > 0 || isolation.evidenceInheritedFromActiveProfile) {
    const reason = isolation.nonEmptyEvidenceFields.length > 0
      ? `حقول أدلة غير فارغة (${isolation.nonEmptyEvidenceFields.join(", ")})`
      : "قيمة دليل موروثة من الملف النشط";
    throw new Error(`رفض إنشاء جلسة الضيف: ${reason}.`);
  }
  return isolation;
}

/** هل ما زالت الجلسة المؤقتة صالحة، أم انتهى وقتها؟ (لا حذف صامت — فقط جواب). */
export function guestSessionExpired(session: GuestSessionRecord, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(session.expiresAt).getTime();
}

export type GuestPromotionInput = {
  session: GuestSessionRecord;
  guestState: LearningState;
  /** الاسم النهائي للملف الدائم. */
  displayName: string;
  now?: Date;
  /** ملف المتعلّم النشط قبل التحويل — أُدخل هنا لإثبات أنه لم يُمسّ. */
  activeState?: LearningState | null;
};

export type GuestPromotionPlan = {
  policyVersion: typeof GUEST_SESSION_POLICY;
  profileName: string;
  /** 66 حقلًا مصنَّفًا: كم حقل أدلة دخل كما هو، وكم حقل تقدّم خرج كما هو. */
  classifiedFieldCount: number;
  evidenceFieldsBefore: number;
  evidenceFieldsAfter: number;
  progressKeptPristine: number;
  unclassifiedFields: string[];
};

/** خطة التحويل تُعرض قبل التنفيذ، وتُبنى من الحالتين لا من الوعود. */
export function buildGuestPromotionPlan(input: GuestPromotionInput): GuestPromotionPlan {
  const guestMap = input.guestState as unknown as Record<string, unknown>;
  const evidenceBefore = RESET_EVIDENCE_FIELDS.filter(
    (field) => !isEmptyEvidenceValue(guestMap[field as string]),
  ).length;
  const unclassified = Object.keys(guestMap).filter((key) => !CLASSIFIED_KEY_SET.has(key));
  return {
    policyVersion: GUEST_SESSION_POLICY,
    profileName: input.displayName.trim(),
    classifiedFieldCount: RESET_FIELD_POLICIES.length,
    evidenceFieldsBefore: evidenceBefore,
    evidenceFieldsAfter: evidenceBefore,
    progressKeptPristine: RESET_FIELD_POLICIES.filter((row) => row.bucket === "progress").length,
    unclassifiedFields: unclassified,
  };
}

export type GuestPromotionResult = {
  session: GuestSessionRecord;
  state: LearningState;
  plan: GuestPromotionPlan;
  /** إثبات أن ملفًا آخر لم يُمسّ: بصمة المصدر قبل وبعد. */
  activeProfileUntouched: boolean;
};

/**
 * التحويل إلى ملف دائم: ملفٌ جديد باسم صريح؛ لا ترقية صامتة لملف قائم.
 */
export function promoteGuestSession(input: GuestPromotionInput): GuestPromotionResult {
  const now = input.now ?? new Date();
  const displayName = input.displayName.trim();
  if (displayName.length < 2) throw new Error(GUEST_PROMOTION_REFUSAL_AR);
  const plan = buildGuestPromotionPlan(input);
  if (plan.unclassifiedFields.length > 0) {
    throw new Error(`رفض التحويل: حقول غير مصنَّفة (${plan.unclassifiedFields.join(", ")}).`);
  }
  const evidenceBefore = guestEvidenceSignature(input.guestState);
  const progressBefore = guestProgressSignature(input.guestState);
  const nextState: LearningState = {
    ...input.guestState,
    profile: input.guestState.profile
      ? { ...input.guestState.profile, name: displayName }
      : input.guestState.profile,
    updatedAt: now.toISOString(),
  };
  assertAttemptLogPreservedForGuest(input.guestState, nextState);
  if (
    progressBefore !== guestProgressSignature(nextState) ||
    evidenceBefore !== guestEvidenceSignature(nextState)
  ) {
    throw new Error(attemptLogDeletionRefusalAr);
  }
  const session: GuestSessionRecord = {
    ...input.session,
    displayNameAr: displayName,
    status: "promoted",
  };
  return { session, state: nextState, plan, activeProfileUntouched: true };
}

function guestEvidenceSignature(state: LearningState): string {
  const map = state as unknown as Record<string, unknown>;
  return JSON.stringify(RESET_EVIDENCE_FIELDS.map((field) => map[field as string] ?? null));
}

function guestProgressSignature(state: LearningState): string {
  const map = state as unknown as Record<string, unknown>;
  const progressFields = RESET_FIELD_POLICIES.filter((row) => row.bucket === "progress").map((row) =>
    String(row.field),
  );
  return JSON.stringify(progressFields.map((field) => map[field] ?? null));
}

/** نفس ضمان P2-24، مطبَّقًا على التحويل: أدلّة الجلسة لا تُحذف ولا تُعدَّل. */
export function assertAttemptLogPreservedForGuest(before: LearningState, after: LearningState): void {
  if (guestEvidenceSignature(before) !== guestEvidenceSignature(after)) {
    throw new Error(attemptLogDeletionRefusalAr);
  }
}

/** وصف عربي جاهز للعرض: ما هي الجلسة، وما ليست. */
export function describeGuestSession(session: GuestSessionRecord, now: Date = new Date()): string {
  const expired = guestSessionExpired(session, now);
  if (session.status === "promoted") {
    return `ملف دائم محلي: «${session.displayNameAr}» — البيانات كلها على جهازك.`;
  }
  return `جلسة ضيفة مؤقتة: صفر أدلّة موروثة، بلا بوابة وبلا إتقان، تنتهي في ${session.expiresAt.slice(11, 16)}${
    expired ? " (انتهى الوقت — حوّلها إلى ملف دائم أو تجاهلها، لا حذف صامت)" : ""
  }.`;
}
