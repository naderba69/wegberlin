/**
 * جردُ أهداف المستويات (P2-96، ADR-093) — **صياغة داخلية غير رسمية**.
 *
 * ما هذا الملف: قائمةُ أهدافٍ نكتبها نحن لكل مستوى (8 أهداف × 4 مستويات = 32)،
 * مستندة إلى الأوصاف العامة لقدرات المتعلّم في أطر CEFR المتداولة، **بصياغتنا
 * العربية/الألمانية نحن** لا بنقل نصّ أي وصف رسمي. ليست هذه القائمة ادّعاءَ مطابقةٍ
 * رسمية ولا اعتمادًا، وهي مادةُ تخطيطٍ داخلية فقط (سياسة `unofficial-paraphrase`).
 *
 * لماذا نحتاجها: بند P2-96 يطلب أنه إذا وُجد هدفٌ في المستوى **غير مغطّى** بدروسنا
 * المنشورة، نُضيف **وحدة مكمّلة** له بدل حشو درسٍ قائم. بلا جردٍ معلن لا يمكن قياس
 * الفجوة أصلًا، ولا يمكن إثبات أن سدّها جرى بوحدة مكمّلة لا بحشو.
 *
 * القاعدة الحاكمة للقياس: التغطية **مقيَّدة بالمستوى**. هدف A1 لا يُغطّى بدروس B2
 * لأن التكرار اللاحق لا يعني تعليمًا في المستوى المطلوب (وهذا فرقٌ يمنع تجميلًا
 * شائعًا: «موجود في مكان ما» ليس تغطية).
 */

export const CEFR_GOAL_INVENTORY_POLICY = "unofficial-paraphrase" as const;

export const CEFR_GOAL_CLAIM_BOUNDARY_AR =
  "جردٌ داخليّ غير رسمي: صياغتنا نحن لأهداف المستوى، لا نقلُ نصٍّ رسمي ولا ادّعاءُ مطابقةٍ معتمدة. لا يُعرض كوصف رسمي للمستوى.";

export type CefrGoalSkill = "listening" | "reading" | "writing" | "speaking" | "mediation";

export type CefrGoal = {
  goalId: string;
  level: "A1" | "A2" | "B1" | "B2";
  skill: CefrGoalSkill;
  canDoAr: string;
  canDoDe: string;
  /** كلمات مفتاحية تُستدلّ بها الصلة من نصوص أهداف الدروس (ألماني/عربي). */
  keywordsDe: readonly string[];
  keywordsAr: readonly string[];
};

export const cefrGoalInventory: readonly CefrGoal[] = [
  // ── A1 ─────────────────────────────────────────────────────────────────────
  { goalId: "a1-goal-1", level: "A1", skill: "speaking", canDoAr: "أستطيع تقديم نفسي والسؤال عن الآخر في حوار قصير.", canDoDe: "Ich kann mich vorstellen und nach der anderen Person fragen.", keywordsDe: ["vorstellen", "nach dem Namen", "Namen sagen"], keywordsAr: ["تقديم اسمي", "أستطيع تقديم اسمي", "السؤال عن اسم الآخر"] },
  { goalId: "a1-goal-2", level: "A1", skill: "listening", canDoAr: "أفهم أرقامًا وأسعارًا وساعات في موقف يومي بسيط.", canDoDe: "Ich verstehe Zahlen, Preise und Uhrzeiten in einer einfachen Alltagssituation.", keywordsDe: ["Uhrzeit", "Preis", "Zahlen"], keywordsAr: ["الساعة", "السعر", "الأرقام"] },
  { goalId: "a1-goal-3", level: "A1", skill: "reading", canDoAr: "أقرأ لافتة أو إعلانًا قصيرًا وأستخرج معلومة واحدة مطلوبة.", canDoDe: "Ich lese ein kurzes Schild oder eine Anzeige und entnehme eine verlangte Information.", keywordsDe: ["Schild", "Anzeige", "Aushang"], keywordsAr: ["لافتة", "إعلان قصير", "إعلانًا قصيرًا"] },
  { goalId: "a1-goal-4", level: "A1", skill: "writing", canDoAr: "أكتب جملة أو جملتين عن نفسي أو عن يومي.", canDoDe: "Ich schreibe ein bis zwei Sätze über mich oder meinen Tag.", keywordsDe: ["über mich", "über meinen Tag", "einfache Sätze schreiben"], keywordsAr: ["أكتب جملة", "أكتب عن نفسي", "أكتب عن يومي"] },
  { goalId: "a1-goal-5", level: "A1", skill: "speaking", canDoAr: "أطلب شيئًا في متجر أو مقصف وأدفع.", canDoDe: "Ich bestelle etwas im Geschäft oder in der Kantine und bezahle.", keywordsDe: ["bestellen", "bezahlen", "Geschäft"], keywordsAr: ["أطلب", "الدفع", "في متجر"] },
  { goalId: "a1-goal-6", level: "A1", skill: "mediation", canDoAr: "أنقل معلومة رقمية واحدة من لافتة إلى شخص آخر بلغة بسيطة.", canDoDe: "Ich gebe eine einzelne Zahleninformation von einem Schild einfach weiter.", keywordsDe: ["weitergeben", "Nummer weitergeben"], keywordsAr: ["أنقل", "أنقل معلومة"] },
  { goalId: "a1-goal-7", level: "A1", skill: "reading", canDoAr: "أفهم رسالة قصيرة جدًّا (بطاقة أو رسالة نصية) وأجيب بنعم/لا.", canDoDe: "Ich verstehe eine sehr kurze Nachricht und antworte mit ja/nein.", keywordsDe: ["kurze Nachricht", "SMS", "Karte"], keywordsAr: ["رسالة قصيرة", "بطاقة"] },
  { goalId: "a1-goal-8", level: "A1", skill: "listening", canDoAr: "أفهم تعليمات صفية بسيطة من خطوة واحدة.", canDoDe: "Ich verstehe eine einfache Unterrichtsanweisung mit einem Schritt.", keywordsDe: ["Anweisung", "Arbeitsauftrag verstehen"], keywordsAr: ["تعليمات الصف", "تعليمة واحدة"] },

  // ── A2 ─────────────────────────────────────────────────────────────────────
  { goalId: "a2-goal-1", level: "A2", skill: "speaking", canDoAr: "أصف روتيني اليومي ومواعيدي في محادثة قصيرة.", canDoDe: "Ich beschreibe meinen Tagesablauf und meine Termine in einem kurzen Gespräch.", keywordsDe: ["Tagesablauf", "Termin", "Tagesroutine"], keywordsAr: ["روتيني اليومي", "مواعيدي", "يومي"] },
  { goalId: "a2-goal-2", level: "A2", skill: "writing", canDoAr: "أكتب رسالة قصيرة أعتذر فيها أو أطلب معلومة.", canDoDe: "Ich schreibe eine kurze Nachricht, in der ich mich entschuldige oder um Auskunft bitte.", keywordsDe: ["entschuldigen", "um Auskunft", "kurze E-Mail"], keywordsAr: ["أعتذر", "أطلب معلومة", "رسالة قصيرة"] },
  { goalId: "a2-goal-3", level: "A2", skill: "listening", canDoAr: "أتابع إعلان محطة أو متجر مشافهًا وأستخرج التفصيل المطلوب.", canDoDe: "Ich folge einer Durchsage am Bahnhof oder im Geschäft und entnehme das verlangte Detail.", keywordsDe: ["Durchsage", "Bahnsteig", "Ansage"], keywordsAr: ["إعلان محطة", "إعلانًا في المتجر"] },
  { goalId: "a2-goal-4", level: "A2", skill: "reading", canDoAr: "أقرأ جدولًا أو تعليمات استخدام وأستخرج خطوتين مرتبتين.", canDoDe: "Ich lese einen Fahrplan oder eine Gebrauchsanweisung und entnehme zwei geordnete Schritte.", keywordsDe: ["Fahrplan", "Gebrauchsanweisung", "Anleitung"], keywordsAr: ["جدول", "تعليمات استخدام"] },
  { goalId: "a2-goal-5", level: "A2", skill: "speaking", canDoAr: "أتحدث عن موعد طبيب أو زيارة عيادة بجُمَل جاهزة.", canDoDe: "Ich spreche über einen Arzttermin oder einen Praxisbesuch mit fertigen Wendungen.", keywordsDe: ["Arzttermin", "Praxis", "beim Arzt"], keywordsAr: ["موعد طبيب", "عيادة"] },
  { goalId: "a2-goal-6", level: "A2", skill: "mediation", canDoAr: "أشرح لصديق عربي مضمون إعلان ألماني قصير بكلماتي.", canDoDe: "Ich erkläre einer arabischsprachigen Person den Inhalt einer kurzen deutschen Anzeige.", keywordsDe: ["erklären", "Anzeige erklären"], keywordsAr: ["أشرح", "أشرح لصديق"] },
  { goalId: "a2-goal-7", level: "A2", skill: "writing", canDoAr: "أكتب دعوة قصيرة أو ردًّا عليها بالتفصيل الزمني.", canDoDe: "Ich schreibe eine kurze Einladung oder eine Antwort mit Zeitangabe.", keywordsDe: ["Einladung", "einladen"], keywordsAr: ["دعوة", "أدعو"] },
  { goalId: "a2-goal-8", level: "A2", skill: "reading", canDoAr: "أفهم فاتورة أو إشعارًا بسيطًا وأحدّد المبلغ والتاريخ.", canDoDe: "Ich verstehe eine einfache Rechnung oder Mitteilung und finde Betrag und Datum.", keywordsDe: ["Rechnung", "Betrag", "Mitteilung"], keywordsAr: ["فاتورة", "إشعار", "المبلغ"] },

  // ── B1 ─────────────────────────────────────────────────────────────────────
  { goalId: "b1-goal-1", level: "B1", skill: "speaking", canDoAr: "أعبّر عن رأيي وأعلّله بجملة سبب واحدة في نقاش قصير.", canDoDe: "Ich äußere meine Meinung und begründe sie in einer kurzen Diskussion.", keywordsDe: ["Meinung", "begründen", "Stellung nehmen"], keywordsAr: ["رأيي", "أعلّل", "أبدي رأيي"] },
  { goalId: "b1-goal-2", level: "B1", skill: "writing", canDoAr: "أكتب بريدًا إلكترونيًا رسميًّا شبه رسمي بطلب واضح.", canDoDe: "Ich schreibe eine halbformelle E-Mail mit einer klaren Bitte.", keywordsDe: ["E-Mail", "halbformell", "Bitte formulieren"], keywordsAr: ["بريد إلكتروني", "رسالة رسمية"] },
  { goalId: "b1-goal-3", level: "B1", skill: "listening", canDoAr: "أفهم مقتطفًا إذاعيًّا أو مقابلة قصيرة وأحدّد الموقف والموضوع.", canDoDe: "Ich verstehe einen Radiobeitrag oder ein kurzes Interview und erkenne Situation und Thema.", keywordsDe: ["Interview", "Radiobeitrag", "Sendung"], keywordsAr: ["مقابلة", "مقتطف"] },
  { goalId: "b1-goal-4", level: "B1", skill: "reading", canDoAr: "أقرأ مقالًا قصيرًا عن موضوع مألوف وألخّص الفكرة الأساسية.", canDoDe: "Ich lese einen kurzen Artikel über ein vertrautes Thema und fasse die Kernidee zusammen.", keywordsDe: ["Artikel", "zusammenfassen", "Kernidee"], keywordsAr: ["مقال", "ألخّص", "الفكرة الأساسية"] },
  { goalId: "b1-goal-5", level: "B1", skill: "speaking", canDoAr: "أروي تجربة شخصية مرتبة زمنيًّا وأستخلص درسًا قصيرًا.", canDoDe: "Ich erzähle ein persönliches Erlebnis zeitlich geordnet und ziehe eine kurze Lehre.", keywordsDe: ["Erlebnis", "erzählen", "Erfahrung"], keywordsAr: ["أروي", "تجربة شخصية"] },
  { goalId: "b1-goal-6", level: "B1", skill: "mediation", canDoAr: "ألخّص لمحاور عربي محتوى فقرة ألمانية وأجيب عن سؤال متابعة.", canDoDe: "Ich fasse für eine arabischsprachige Gesprächsperson einen deutschen Absatz zusammen.", keywordsDe: ["zusammenfassen für andere", "weiterleiten"], keywordsAr: ["ألخّص لمحاور", "أنقل مضمون"] },
  { goalId: "b1-goal-7", level: "B1", skill: "writing", canDoAr: "أكتب وصفًا لموقف أو شكوى مع نتيجة مطلوبة.", canDoDe: "Ich schreibe eine Situationsbeschreibung oder Beschwerde mit gewünschtem Ergebnis.", keywordsDe: ["Beschwerde", "Situation beschreiben"], keywordsAr: ["شكوى", "وصف موقف"] },
  { goalId: "b1-goal-8", level: "B1", skill: "reading", canDoAr: "أفهم نصّ إجراء إداري (نموذج تقديم) وأستخرج المتطلبات.", canDoDe: "Ich verstehe einen behördlichen Verfahrenstext und finde die Anforderungen.", keywordsDe: ["Antrag", "Behörde", "Voraussetzungen"], keywordsAr: ["نموذج تقديم", "إجراء إداري", "المتطلبات"] },

  // ── B2 ─────────────────────────────────────────────────────────────────────
  { goalId: "b2-goal-1", level: "B2", skill: "speaking", canDoAr: "أدافع عن موقف في نقاش وأردّ على حجة مخالفة.", canDoDe: "Ich verteidige einen Standpunkt und entgegne einem Gegenargument.", keywordsDe: ["verteidigen", "Gegenargument", "argumentieren"], keywordsAr: ["أدافع", "حجة مخالفة", "أردّ على"] },
  { goalId: "b2-goal-2", level: "B2", skill: "writing", canDoAr: "أكتب نصًّا حجاجيًّا من 200 كلمة ببنية مقدمة/حجج/خاتمة.", canDoDe: "Ich schreibe einen argumentativen Text von etwa 200 Wörtern mit Einleitung, Argumenten und Schluss.", keywordsDe: ["argumentativer Text", "Erörterung", "Schluss"], keywordsAr: ["نصّ حجاجي", "حجاج", "خاتمة"] },
  { goalId: "b2-goal-3", level: "B2", skill: "listening", canDoAr: "أفهم ندوة أو خطابًا مسجّلًا وأفرّق بين الحجة والخلفية.", canDoDe: "Ich verstehe einen aufgezeichneten Vortrag und trenne Argument von Hintergrund.", keywordsDe: ["Vortrag", "Referat", "Argument erkennen"], keywordsAr: ["ندوة", "خطاب مسجّل"] },
  { goalId: "b2-goal-4", level: "B2", skill: "reading", canDoAr: "أقرأ مقالًا رأيًا طويلًا وأميّز الدعوى من الدليل.", canDoDe: "Ich lese einen längeren Meinungsartikel und unterscheide Behauptung von Beleg.", keywordsDe: ["Behauptung", "Beleg", "Meinungsartikel"], keywordsAr: ["دعوى", "الدليل", "مقال رأي"] },
  { goalId: "b2-goal-5", level: "B2", skill: "speaking", canDoAr: "أدير محادثة معاملة أو استشارة مع طلب توضيح وتفاوض.", canDoDe: "Ich führe ein Beratungs- oder Behördengepräch mit Nachfragen und Aushandeln.", keywordsDe: ["Beratung", "aushandeln", "nachfragen"], keywordsAr: ["استشارة", "أفاوض", "طلب توضيح"] },
  { goalId: "b2-goal-6", level: "B2", skill: "mediation", canDoAr: "أكتب ملخّصًا وسيطًا لمحاورين يستحيل بينهما الفهم المباشر.", canDoDe: "Ich schreibe eine vermittelnde Zusammenfassung zwischen zwei Gesprächspersonen ohne gemeinsame Sprache.", keywordsDe: ["vermitteln", "Sprachmittlung", "Zusammenfassung schreiben"], keywordsAr: ["وساطة", "ملخّص وسيط", "وسيط"] },
  { goalId: "b2-goal-7", level: "B2", skill: "writing", canDoAr: "أكتب تقريرًا موجزًا بنقاط مرقّمة وخلاصة.", canDoDe: "Ich schreibe einen kurzen Bericht mit nummerierten Punkten und Fazit.", keywordsDe: ["Bericht", "Fazit", "nummerierte Punkte"], keywordsAr: ["تقرير", "خلاصة"] },
  { goalId: "b2-goal-8", level: "B2", skill: "reading", canDoAr: "أفهم عقودًا أو شروطًا رسمية وأستخرج الالتزامات الأساسية.", canDoDe: "Ich verstehe Verträge oder Bedingungen und finde die wesentlichen Pflichten.", keywordsDe: ["Vertrag", "Bedingungen", "Pflichten"], keywordsAr: ["عقد", "شروط", "الالتزامات"] },
];

export const cefrGoalCountByLevel = cefrGoalInventory.reduce<Record<string, number>>((acc, goal) => {
  acc[goal.level] = (acc[goal.level] ?? 0) + 1;
  return acc;
}, {});

export function getCefrGoal(goalId: string): CefrGoal {
  const goal = cefrGoalInventory.find((entry) => entry.goalId === goalId);
  if (!goal) throw new Error(`معرّف هدف غير معروف في الجرد: ${goalId}`);
  return goal;
}
