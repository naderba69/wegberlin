import type { LearningState } from "@/types/learning";
import { DEFAULT_ACCESSIBILITY_PREFERENCES } from "@/core/accessibility/preferences";
import { DEFAULT_MOTIVATION_PREFERENCES } from "@/core/coach/motivation-preferences";
import { DEFAULT_LANGUAGE_HISTORY_PREFERENCES } from "@/core/vocabulary/language-history-enrichment";
import { DEFAULT_QUIET_HOURS } from "@/core/coach/learning-agreement";
import { learningStateSchema } from "./schema";
import { CURRENT_CURRICULUM_VERSION } from "@/config/curriculum-version";
import { normalizeEventDerivedMastery } from "@/core/evidence/event-derived-mastery";
import { DEFAULT_PLANNING_INTENSITY } from "@/core/coach/intensity-presets";
import { DEFAULT_SPEECH_PREFERENCES } from "@/core/audio/speech-preferences";
import { DEFAULT_REVIEW_REMINDER_SETTINGS } from "@/core/review/reminder";
import { buildRawStoreExport, serializeRawStoreValue, type RawStoreName } from "./raw-store-export";

const INVALID_KEY = "invalid-primary-latest";

/**
 * A stored state this build cannot read is never discarded: the exact bytes are kept beside the
 * restore points, and the learner is told — instead of being silently handed an empty profile that
 * the next keystroke would save over. See ADR-106 · م3 (learner audit 2026-10-03).
 */
export const STATE_INTEGRITY_ARABIC_NOTICE =
  "تعذّرت قراءة تقدّمك المحفوظ: بنيتها لا تطابق هذا الإصدار. نُسخَت بياناتك كما هي إلى مساحة الاسترجاع، " +
  "ولن تُمسح فوقها نسخة فارغة. نزّلها من هذا الشريط أو استرجع نقطة ما قبل آخر استيراد من الإعدادات، ثم أعد التحميل.";

let learningStateIntegrityNotice: string | null = null;

export function consumeLearningStateIntegrityNotice(): string | null {
  const notice = learningStateIntegrityNotice;
  learningStateIntegrityNotice = null;
  return notice;
}

/** The unreadable payload, exactly as it was stored, or null when nothing is quarantined. */
export async function loadInvalidPrimaryStateRecord(): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDatabase();
  return new Promise((resolve) => {
    const request = db.transaction("restore-points", "readonly").objectStore("restore-points").get(INVALID_KEY);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
    request.onerror = () => resolve(null);
  });
}

async function quarantineUnreadableState(raw: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDatabase();
  await new Promise<void>((resolve) => {
    const tx = db.transaction("restore-points", "readwrite");
    tx.objectStore("restore-points").put(JSON.stringify(raw ?? null), INVALID_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

const DB_NAME = "der-weg-nach-berlin";
const STORE = "learning-state";
const KEY = "primary";

export const defaultState: LearningState = {
  schemaVersion: 3,
  curriculumVersion: CURRENT_CURRICULUM_VERSION,
  profile: null,
  diagnosticResult: null,
  diagnosticSessionDraft:null,
  skillDiagnosticAttempts: [],
  learningContracts: [],
  planningIntensity:DEFAULT_PLANNING_INTENSITY,
  pinnedLearningTask:null,
  studyRoutineMode:{policyVersion:"learner-selected-morning-evening-mode-v1",mode:"auto",evidenceBoundary:"learner-selected-entry-mode-no-automatic-completion-mastery-or-time-debt"},
  libraryInterestPreferences:{policyVersion:"local-library-interest-profile-v1",categoriesAr:[],evidenceBoundary:"learner-selected-library-filter-no-cefr-mastery-tracking-or-content-removal"},
  speechPreferences:DEFAULT_SPEECH_PREFERENCES,
  dataUsagePreferences:{policyVersion:"persisted-low-data-mode-v1",lowDataMode:false,evidenceBoundary:"local-download-preference-no-autoplay-tracking-mastery-or-automatic-deletion"},
  sessionRitualPreferences:{policyVersion:"optional-session-rituals-v1",startEnabled:true,endEnabled:true,evidenceBoundary:"learner-selected-ritual-visibility-no-completion-mastery-or-penalty"},
  weeklyReflections:[],
  quietHours: DEFAULT_QUIET_HOURS,
  reviewReminderSettings:DEFAULT_REVIEW_REMINDER_SETTINGS,
  completedBlockIds: [],
  completedLessonIds: [],
  currentLessonId: "a1-01",
  currentStage: 0,
  lessonProgress: {},
  exerciseAttempts: [],
  dueReviews: 0,
  mastery: {},
  masteryEvidenceEvents: [],
  errors: [],
  errorClinicAttempts: [],
  reviewItems: [],
  reviewEvents: [],
  writingSubmissions: [],
  writingRepairAttempts: [],
  writingAIReviews: [],
  delayedTransferTasks: [],
  externalEvaluationVerifications: [],
  resetEvents: [],
  mediationSubmissions: [],
  speakingAttempts: [],
  examSessions: {},
  accessibilityPreferences: DEFAULT_ACCESSIBILITY_PREFERENCES,
  motivationPreferences: DEFAULT_MOTIVATION_PREFERENCES,
  languageHistoryPreferences: DEFAULT_LANGUAGE_HISTORY_PREFERENCES,
  contentNotes: [],
  learnerAlignmentMap: null,
  personalVocabulary: [],
  contentErrorReports: [],
  aiSettings: { provider: "disabled", model: "", enabledFeatures: [] },
  tutorInteractions: [],
  studyHistory: [],
  trainingInteractionEvents: [],
  dictationAttempts: [],
  branchingConversationAttempts: [],
  collocationNetworkAttempts: [],
  cohesionRewriteAttempts: [],
  supportUsageEvents: [],
  listeningProcessEvents: [],
  listeningUsageEvents: [],
  pronunciationContrastAttempts: [],
  prosodyRhythmAttempts:[],
  comprehensibilityChecks:[],
  practicalDayAttempts:[],
  dailySessions: {},
  readingBenchmarkAttempts: [],
  writingBenchmarkAttempts: [],
  updatedAt: new Date(0).toISOString(),
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      if (!request.result.objectStoreNames.contains("media")) request.result.createObjectStore("media");
      if (!request.result.objectStoreNames.contains("restore-points")) request.result.createObjectStore("restore-points");
      if (!request.result.objectStoreNames.contains("profiles")) request.result.createObjectStore("profiles");
      if (!request.result.objectStoreNames.contains("metadata")) request.result.createObjectStore("metadata");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function exportRawLocalStores(now=new Date()){
  if(typeof indexedDB==="undefined")throw new Error("IndexedDB غير متاح في هذا السياق.");const db=await openDatabase();
  return buildRawStoreExport(async(store:RawStoreName)=>{
    const objectStore=db.transaction(store,"readonly").objectStore(store);const[keys,values]=await Promise.all([requestValue(objectStore.getAllKeys()),requestValue(objectStore.getAll())]);
    return Promise.all(keys.map(async(key,index)=>({key,value:await serializeRawStoreValue(values[index])})));
  },now);
}

export function migrateLearningState(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  // Any stored state that is not exactly this shape gets the defaulting migration: a future
  // schema bump must never turn into a silent reset for someone returning from a newer build.
  if (typeof source.schemaVersion === "number" && source.schemaVersion !== 3) {
    return {
      ...defaultState,
      ...source,
      schemaVersion: 3,
      curriculumVersion: CURRENT_CURRICULUM_VERSION,
      accessibilityPreferences: source.accessibilityPreferences ?? defaultState.accessibilityPreferences,
      motivationPreferences: source.motivationPreferences ?? defaultState.motivationPreferences,
      languageHistoryPreferences: (source.languageHistoryPreferences as never) ?? defaultState.languageHistoryPreferences,
      contentNotes: source.contentNotes ?? [],
      learnerAlignmentMap: (source.learnerAlignmentMap as never) ?? null,
      personalVocabulary: source.personalVocabulary ?? [],
      contentErrorReports: source.contentErrorReports ?? [],
      aiSettings: source.aiSettings ?? defaultState.aiSettings,
      diagnosticResult: source.diagnosticResult ?? null,
      diagnosticSessionDraft:source.diagnosticSessionDraft??null,
      skillDiagnosticAttempts: source.skillDiagnosticAttempts ?? [],
      learningContracts: source.learningContracts ?? [],
      planningIntensity:source.planningIntensity??defaultState.planningIntensity,
      pinnedLearningTask:source.pinnedLearningTask??null,
      studyRoutineMode:source.studyRoutineMode??defaultState.studyRoutineMode,
      libraryInterestPreferences:source.libraryInterestPreferences??defaultState.libraryInterestPreferences,
      speechPreferences:source.speechPreferences??defaultState.speechPreferences,
      dataUsagePreferences:source.dataUsagePreferences??defaultState.dataUsagePreferences,
      sessionRitualPreferences:source.sessionRitualPreferences??defaultState.sessionRitualPreferences,
      weeklyReflections:source.weeklyReflections??[],
      quietHours: source.quietHours ?? defaultState.quietHours,
      reviewReminderSettings:source.reviewReminderSettings??defaultState.reviewReminderSettings,
      errorClinicAttempts: source.errorClinicAttempts ?? [],
      masteryEvidenceEvents: source.masteryEvidenceEvents ?? [],
      reviewItems: source.reviewItems ?? [],
      reviewEvents: source.reviewEvents ?? [],
      writingSubmissions: source.writingSubmissions ?? [],
      writingRepairAttempts: source.writingRepairAttempts ?? [],
      writingAIReviews: source.writingAIReviews ?? [],
      mediationSubmissions: source.mediationSubmissions ?? [],
      speakingAttempts: source.speakingAttempts ?? [],
      tutorInteractions: source.tutorInteractions ?? [],
      trainingInteractionEvents: source.trainingInteractionEvents ?? [],
      dictationAttempts: source.dictationAttempts ?? [],
      branchingConversationAttempts: source.branchingConversationAttempts ?? [],
      collocationNetworkAttempts: source.collocationNetworkAttempts ?? [],
      cohesionRewriteAttempts: source.cohesionRewriteAttempts ?? [],
      supportUsageEvents: source.supportUsageEvents ?? [],
      listeningProcessEvents: source.listeningProcessEvents ?? [],
      listeningUsageEvents: source.listeningUsageEvents ?? [],
      pronunciationContrastAttempts: source.pronunciationContrastAttempts ?? [],
      prosodyRhythmAttempts:source.prosodyRhythmAttempts??[],
      comprehensibilityChecks:source.comprehensibilityChecks??[],
      practicalDayAttempts:source.practicalDayAttempts??[],
      dailySessions: source.dailySessions ?? {},
      readingBenchmarkAttempts: source.readingBenchmarkAttempts ?? [],
      writingBenchmarkAttempts: source.writingBenchmarkAttempts ?? [],
      lessonProgress: {},
      exerciseAttempts: [],
    };
  }
  return value;
}

export type LocalProfileSummary={id:string;name:string;targetExam:string;updatedAt:string};
const requestValue=<T>(request:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
export async function ensureProfileRegistry(state:LearningState):Promise<{activeId:string;profiles:LocalProfileSummary[]}>{
 if(typeof indexedDB==="undefined")return{activeId:"primary",profiles:[]};const db=await openDatabase();let activeId=await requestValue(db.transaction("metadata","readonly").objectStore("metadata").get("active-profile") as IDBRequest<string|undefined>);if(!activeId)activeId="primary";const existing=await requestValue(db.transaction("profiles","readonly").objectStore("profiles").get(activeId));if(!existing){const tx=db.transaction(["profiles","metadata"],"readwrite");tx.objectStore("profiles").put(state,activeId);tx.objectStore("metadata").put(activeId,"active-profile");await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}return{activeId,profiles:await listLearningProfiles()};
}
export async function listLearningProfiles():Promise<LocalProfileSummary[]>{if(typeof indexedDB==="undefined")return[];const db=await openDatabase();const store=db.transaction("profiles","readonly").objectStore("profiles");const [keys,values]=await Promise.all([requestValue(store.getAllKeys()),requestValue(store.getAll())]);return keys.flatMap((key,index)=>{const parsed=learningStateSchema.safeParse(migrateLearningState(values[index]));return parsed.success?[{id:String(key),name:parsed.data.profile?.name??"ملف بلا اسم",targetExam:parsed.data.profile?.targetExam??"—",updatedAt:parsed.data.updatedAt}]:[]});}
export async function createLearningProfile(state:LearningState,id=`profile-${crypto.randomUUID()}`):Promise<string>{const db=await openDatabase();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("profiles","readwrite");tx.objectStore("profiles").put(state,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});return id;}
export async function renameLearningProfile(id:string,name:string):Promise<void>{const clean=name.trim();if(!clean)throw new Error("اسم الملف لا يمكن أن يكون فارغًا.");const db=await openDatabase();const value=await requestValue(db.transaction("profiles","readonly").objectStore("profiles").get(id));const parsed=learningStateSchema.safeParse(migrateLearningState(value));if(!parsed.success||!parsed.data.profile)throw new Error("لا يمكن إعادة تسمية ملف بلا بيانات شخصية.");const next={...parsed.data,profile:{...parsed.data.profile,name:clean},updatedAt:new Date().toISOString()};await new Promise<void>((resolve,reject)=>{const tx=db.transaction("profiles","readwrite");tx.objectStore("profiles").put(next,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}
export async function deleteLearningProfile(id:string):Promise<void>{const db=await openDatabase();const active=await requestValue(db.transaction("metadata","readonly").objectStore("metadata").get("active-profile"));if(active===id)throw new Error("لا يمكن حذف الملف النشط. انتقل إلى ملف آخر أولًا.");await new Promise<void>((resolve,reject)=>{const tx=db.transaction(["profiles","media"],"readwrite");tx.objectStore("profiles").delete(id);const request=tx.objectStore("media").openKeyCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const key=String(cursor.key);if(key.startsWith(`${id}:`))cursor.delete();cursor.continue();};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});}
export async function switchLearningProfile(id:string,current:LearningState):Promise<LearningState>{await saveLearningState(current);const db=await openDatabase();const value=await requestValue(db.transaction("profiles","readonly").objectStore("profiles").get(id));const parsed=learningStateSchema.safeParse(migrateLearningState(value));if(!parsed.success)throw new Error("الملف الشخصي المطلوب غير صالح.");const normalized=normalizeEventDerivedMastery(parsed.data);await new Promise<void>((resolve,reject)=>{const tx=db.transaction([STORE,"metadata"],"readwrite");tx.objectStore(STORE).put(normalized,KEY);tx.objectStore("metadata").put(id,"active-profile");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});return normalized;}

export async function loadLearningState(): Promise<LearningState> {
  if (typeof indexedDB === "undefined") return defaultState;
  const db = await openDatabase();
  return new Promise((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    request.onsuccess = async () => {
      const raw = request.result;
      const parsed = learningStateSchema.safeParse(migrateLearningState(raw));
      if (parsed.success) resolve(normalizeEventDerivedMastery(parsed.data));
      else {
        // First the bytes are preserved, then — and only then — does the app fall back to defaults.
        if (raw !== undefined && raw !== null) {
          await quarantineUnreadableState(raw);
          learningStateIntegrityNotice = STATE_INTEGRITY_ARABIC_NOTICE;
        }
        resolve(defaultState);
      }
    };
    request.onerror = () => resolve(defaultState);
  });
}

export type PersistenceFaultPoint = "after-primary-state" | "after-restore-point" | "after-media";

function transactionFailure(transaction: IDBTransaction, fallback: string) {
  return transaction.error ?? new Error(fallback);
}

export async function saveLearningState(state: LearningState, options: { faultAt?: "after-primary-state" } = {}): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE,"profiles","metadata"], "readwrite");
    tx.objectStore(STORE).put(state, KEY);
    if (options.faultAt === "after-primary-state") {
      tx.abort();
    } else {
      const request=tx.objectStore("metadata").get("active-profile");
      request.onsuccess=()=>{const id=typeof request.result==="string"?request.result:"primary";tx.objectStore("profiles").put(state,id);tx.objectStore("metadata").put(id,"active-profile");};
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(transactionFailure(tx, "فشل حفظ حالة التعلم."));
    tx.onabort = () => reject(transactionFailure(tx, "أُلغيت معاملة حفظ حالة التعلم."));
  });
}

export async function commitImportedStateAtomic(options: {
  state: LearningState;
  targetProfileId: string;
  media: Array<{ id: string; blob: Blob }>;
  restorePoint: Blob;
  currentState?: LearningState;
  faultAt?: PersistenceFaultPoint;
}): Promise<void> {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB غير متاح لإتمام الاستيراد الذري.");
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE,"profiles","metadata","media","restore-points"], "readwrite");
    const metadataStore = tx.objectStore("metadata");
    const activeRequest = metadataStore.get("active-profile");
    activeRequest.onsuccess = () => {
      const currentProfileId = typeof activeRequest.result === "string" ? activeRequest.result : "primary";
      if (options.currentState && currentProfileId !== options.targetProfileId) tx.objectStore("profiles").put(options.currentState, currentProfileId);
      tx.objectStore(STORE).put(options.state, KEY);
      tx.objectStore("profiles").put(options.state, options.targetProfileId);
      metadataStore.put(options.targetProfileId, "active-profile");
      if (options.faultAt === "after-primary-state") {
        tx.abort();
        return;
      }
      tx.objectStore("restore-points").put(options.restorePoint, "pre-import-latest");
      if (options.faultAt === "after-restore-point") {
        tx.abort();
        return;
      }
      for (const item of options.media) tx.objectStore("media").put(item.blob, item.id);
      if (options.faultAt === "after-media") tx.abort();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(transactionFailure(tx, "فشل الاستيراد الذري."));
    tx.onabort = () => reject(transactionFailure(tx, "أُلغيت معاملة الاستيراد الذرية؛ لم تُطبّق كتابة جزئية."));
  });
}

export async function saveRestorePoint(blob: Blob): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction("restore-points","readwrite");tx.objectStore("restore-points").put(blob,"pre-import-latest");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
}

export async function loadRestorePoint(): Promise<Blob|null> {
  if(typeof indexedDB==="undefined")return null;const db=await openDatabase();return new Promise(resolve=>{const request=db.transaction("restore-points","readonly").objectStore("restore-points").get("pre-import-latest");request.onsuccess=()=>resolve(request.result instanceof Blob?request.result:null);request.onerror=()=>resolve(null);});
}

export async function saveMedia(id: string, blob: Blob): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("media", "readwrite");
    tx.objectStore("media").put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listMedia(): Promise<Array<{ id: string; blob: Blob }>> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDatabase();
  return new Promise((resolve) => {
    const store = db.transaction("media", "readonly").objectStore("media");
    const keysRequest = store.getAllKeys();
    const valuesRequest = store.getAll();
    let keys: IDBValidKey[] | null = null;
    let values: unknown[] | null = null;
    const finish = () => {
      if (keys === null || values === null) return;
      const currentValues = values;
      resolve(keys.flatMap((key, index) => currentValues[index] instanceof Blob ? [{ id: String(key), blob: currentValues[index] as Blob }] : []));
    };
    keysRequest.onsuccess = () => { keys = keysRequest.result; finish(); };
    valuesRequest.onsuccess = () => { values = valuesRequest.result; finish(); };
    keysRequest.onerror = valuesRequest.onerror = () => resolve([]);
  });
}

export async function loadMedia(id: string): Promise<Blob | null> {
  const db = await openDatabase();
  return new Promise((resolve) => {
    const request = db.transaction("media", "readonly").objectStore("media").get(id);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => resolve(null);
  });
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve) => {
    const tx = db.transaction("media", "readwrite");
    tx.objectStore("media").delete(id);
    tx.oncomplete = () => resolve();
  });
}
