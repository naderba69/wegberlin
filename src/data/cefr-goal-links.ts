/**
 * AUTO-GENERATED — لا تُحرَّر يدويًّا.
 * المولّد: scripts/materialize-cefr-goal-links.ts (P2-96، ADR-093).
 * المصدر: أهداف دروس src/data/lessons-*.ts مقابل جرد الأهداف غير الرسمي.
 * كل صلة تحمل دليلها النصّي (الدرس + فهرس الهدف + الكلمة المطابقة + الحقل).
 * التغطية مقيَّدة بالمستوى: هدف A1 لا تُغطّيه دروس B2.
 */

export type CefrGoalLinkEvidence = {
  lessonId: string;
  objectiveIndex: number;
  matchedKeyword: string;
  matchedIn: "de" | "ar";
};

export const cefrGoalLinks: Readonly<Record<string, readonly CefrGoalLinkEvidence[]>> = {
  "a1-goal-1": [
    { lessonId: "a1-01", objectiveIndex: 1, matchedKeyword: "Namen sagen", matchedIn: "de" },
    { lessonId: "a1-04", objectiveIndex: 1, matchedKeyword: "vorstellen", matchedIn: "de" },
  ],
  "a1-goal-2": [
    { lessonId: "a1-07", objectiveIndex: 0, matchedKeyword: "Uhrzeit", matchedIn: "de" },
    { lessonId: "a1-07", objectiveIndex: 1, matchedKeyword: "Uhrzeit", matchedIn: "de" },
    { lessonId: "a1-09", objectiveIndex: 3, matchedKeyword: "Uhrzeit", matchedIn: "de" },
    { lessonId: "a1-11", objectiveIndex: 1, matchedKeyword: "Preis", matchedIn: "de" },
  ],
  "a1-goal-5": [
    { lessonId: "a1-03", objectiveIndex: 2, matchedKeyword: "أطلب", matchedIn: "ar" },
    { lessonId: "a1-05", objectiveIndex: 2, matchedKeyword: "أطلب", matchedIn: "ar" },
    { lessonId: "a1-11", objectiveIndex: 2, matchedKeyword: "bestellen", matchedIn: "de" },
    { lessonId: "a1-12", objectiveIndex: 1, matchedKeyword: "bestellen", matchedIn: "de" },
    { lessonId: "a1-12", objectiveIndex: 3, matchedKeyword: "أطلب", matchedIn: "ar" },
    { lessonId: "a1-24", objectiveIndex: 1, matchedKeyword: "أطلب", matchedIn: "ar" },
  ],
  "a1-goal-8": [
    { lessonId: "a1-20", objectiveIndex: 2, matchedKeyword: "Anweisung", matchedIn: "de" },
  ],
  "a2-goal-2": [
    { lessonId: "a2-04", objectiveIndex: 3, matchedKeyword: "رسالة قصيرة", matchedIn: "ar" },
  ],
  "a2-goal-6": [
    { lessonId: "a2-07", objectiveIndex: 3, matchedKeyword: "erklären", matchedIn: "de" },
    { lessonId: "a2-17", objectiveIndex: 3, matchedKeyword: "erklären", matchedIn: "de" },
  ],
  "a2-goal-7": [
    { lessonId: "a2-22", objectiveIndex: 0, matchedKeyword: "einladen", matchedIn: "de" },
  ],
  "b1-goal-1": [
    { lessonId: "b1-02", objectiveIndex: 0, matchedKeyword: "begründen", matchedIn: "de" },
    { lessonId: "b1-07", objectiveIndex: 3, matchedKeyword: "begründen", matchedIn: "de" },
  ],
  "b1-goal-3": [
    { lessonId: "b1-07", objectiveIndex: 1, matchedKeyword: "مقابلة", matchedIn: "ar" },
  ],
  "b1-goal-4": [
    { lessonId: "b1-17", objectiveIndex: 0, matchedKeyword: "zusammenfassen", matchedIn: "de" },
  ],
  "b1-goal-5": [
    { lessonId: "b1-01", objectiveIndex: 0, matchedKeyword: "erzählen", matchedIn: "de" },
    { lessonId: "b1-06", objectiveIndex: 0, matchedKeyword: "Erfahrung", matchedIn: "de" },
  ],
  "b2-goal-1": [
    { lessonId: "b2-01", objectiveIndex: 2, matchedKeyword: "Gegenargument", matchedIn: "de" },
    { lessonId: "b2-01", objectiveIndex: 3, matchedKeyword: "أدافع", matchedIn: "ar" },
    { lessonId: "b2-19", objectiveIndex: 0, matchedKeyword: "أردّ على", matchedIn: "ar" },
  ],
  "b2-goal-4": [
    { lessonId: "b2-01", objectiveIndex: 1, matchedKeyword: "Beleg", matchedIn: "de" },
    { lessonId: "b2-08", objectiveIndex: 0, matchedKeyword: "Behauptung", matchedIn: "de" },
    { lessonId: "b2-08", objectiveIndex: 1, matchedKeyword: "Beleg", matchedIn: "de" },
    { lessonId: "b2-13", objectiveIndex: 0, matchedKeyword: "Beleg", matchedIn: "de" },
    { lessonId: "b2-21", objectiveIndex: 4, matchedKeyword: "Beleg", matchedIn: "de" },
  ],
  "b2-goal-6": [
    { lessonId: "b2-06", objectiveIndex: 3, matchedKeyword: "vermitteln", matchedIn: "de" },
    { lessonId: "b2-10", objectiveIndex: 1, matchedKeyword: "vermitteln", matchedIn: "de" },
  ],
  "b2-goal-8": [
    { lessonId: "b2-03", objectiveIndex: 1, matchedKeyword: "Bedingungen", matchedIn: "de" },
    { lessonId: "b2-10", objectiveIndex: 2, matchedKeyword: "Bedingungen", matchedIn: "de" },
  ],
};
