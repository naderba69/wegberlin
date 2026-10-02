import type { CEFRLevel } from "@/types/learning";

export type IndependentProductionTask = {
  id: string;
  level: CEFRLevel;
  sourceLessonId: string;
  titleAr: string;
  writing: { titleAr: string; promptDe: string; promptAr: string; checklistAr: string[]; modelDe: string };
  speaking: { titleAr: string; promptDe: string; promptAr: string; usefulPhrases: string[]; successCriteriaAr: string[] };
  reviewStatus: "authored-independent-review-pending";
};
type Seed = [string, string, string, string];
const seeds: Record<CEFRLevel, Seed[]> = {
  A1: [
    ["a1-01", "تعارف في المكتبة", "Sie treffen eine neue Person in der Bibliothek. Schreiben Sie eine kurze Nachricht mit Ihrem erfundenen Namen, Wohnort und einer Frage nach dem Namen der anderen Person.", "Sie begrüßen eine neue Person in der Bibliothek. Nennen Sie Ihren Namen und Wohnort, fragen Sie nach ihrem Namen und verabschieden Sie sich."],
    ["a1-09", "موعد جديد", "Sie können am Mittwoch nicht kommen. Schreiben Sie Ihrem Freund: Sagen Sie ab, nennen Sie Freitag um 16 Uhr als neuen Termin und fragen Sie, ob er Zeit hat.", "Ihr Freund schlägt Mittwoch vor. Sagen Sie ab, schlagen Sie Freitag um 16 Uhr vor und fragen Sie nach einer Antwort."],
    ["a1-11", "شراء فاكهة", "Sie bestellen Obst für ein Treffen. Schreiben Sie: Sie brauchen zwei Kilo Äpfel und ein Kilo Bananen. Fragen Sie nach dem Preis und der Abholzeit.", "Sie sind im Laden. Bestellen Sie zwei Kilo Äpfel und ein Kilo Bananen, fragen Sie nach dem Preis und bitten Sie einmal um Wiederholung."],
    ["a1-15", "غرفة متاحة", "Sie suchen ein Zimmer. Schreiben Sie eine kurze Anfrage: Fragen Sie nach der Miete, dem Ort und einem Besichtigungstermin am Samstag.", "Sie rufen wegen eines Zimmers an. Fragen Sie nach Miete und Ort und schlagen Sie Samstag als Besuchstermin vor."],
    ["a1-17", "دعوة إلى حديقة", "Laden Sie eine Freundin in den Park ein. Nennen Sie Sonntag, 14 Uhr, den Treffpunkt am Eingang und fragen Sie, ob sie kommt.", "Laden Sie eine Person in den Park ein. Nennen Sie Tag, Uhrzeit und Treffpunkt. Die Person versteht die Uhrzeit nicht; wiederholen Sie sie."],
    ["a1-19", "تذكرة ورحلة", "Schreiben Sie an den Service: Sie fahren am Montag nach Erfurt. Fragen Sie nach Abfahrt, Preis und einem Ticket für die Rückfahrt.", "Sie kaufen ein Ticket nach Erfurt. Fragen Sie nach Abfahrt und Preis und sagen Sie, dass Sie auch zurückfahren möchten."],
    ["a1-23", "طلب موعد", "Schreiben Sie an eine Praxis: Sie möchten einen Termin am Vormittag. Nennen Sie einen erfundenen Namen und eine Übungsnummer; fragen Sie nach einem freien Termin.", "Sie bitten um einen Termin am Vormittag. Nennen Sie einen erfundenen Namen, fragen Sie nach einem freien Tag und bestätigen Sie die Uhrzeit."],
    ["a1-24", "طلب مساعدة في نموذج", "Sie verstehen zwei Felder in einem Formular nicht. Schreiben Sie an den Service: Fragen Sie nach Vorname und Unterschrift und bitten Sie um eine kurze Erklärung.", "Sie brauchen Hilfe bei einem Formular. Fragen Sie nach zwei Feldern und bitten Sie um eine langsame Erklärung."],
  ],
  A2: [
    ["a2-01", "زيارة لم تتم", "Sie haben einen Besuch verpasst, weil der Zug ausgefallen ist. Erklären Sie, was passiert ist, entschuldigen Sie sich und schlagen Sie einen neuen Termin vor.", "Berichten Sie von einer verpassten Reise: Was ist passiert, warum, und was haben Sie danach gemacht?"],
    ["a2-06", "مشكلة سكن", "In Ihrer Wohnung funktioniert die Heizung seit gestern nicht. Beschreiben Sie das Problem, nennen Sie zwei mögliche Besuchszeiten und bitten Sie um eine Antwort.", "Rufen Sie wegen einer defekten Heizung an. Beschreiben Sie die Situation, fragen Sie nach Hilfe und bestätigen Sie einen Termin."],
    ["a2-08", "استفسار عن عمل", "Eine Anzeige bietet Arbeit am Wochenende. Fragen Sie nach Arbeitszeiten und Aufgaben, nennen Sie Ihre verfügbare Zeit und bitten Sie um weitere Informationen.", "Erklären Sie Ihre Erfahrung und fragen Sie nach Aufgaben und Arbeitszeiten einer Stelle am Wochenende."],
    ["a2-11", "حجز يحتاج تغييرًا", "Sie haben ein Zimmer für zwei Nächte gebucht, brauchen aber drei Nächte. Bitten Sie um eine Änderung und fragen Sie nach dem neuen Preis und der Bestätigung.", "Erklären Sie eine Buchungsänderung und fragen Sie nach Preis und Verfügbarkeit. Bitten Sie um Wiederholung einer wichtigen Angabe."],
    ["a2-16", "خبر محلي", "Ein neuer Bus fährt ab nächster Woche durch Ihr Viertel. Informieren Sie einen Freund über Beginn, Nutzen und eine noch offene Frage.", "Erklären Sie eine neue Busverbindung, nennen Sie einen Vorteil und eine Frage, die Sie noch klären möchten."],
    ["a2-19", "تنظيم التعلّم", "Schreiben Sie an einen Lernpartner: Beschreiben Sie Ihre Lernroutine, nennen Sie eine Schwierigkeit und schlagen Sie zweimal pro Woche gemeinsames Üben vor.", "Beschreiben Sie, wie Sie lernen, was Ihnen schwerfällt und wie ein Partner helfen könnte."],
    ["a2-21", "خطة مستقبلية", "Sie möchten in sechs Monaten eine neue Ausbildung beginnen. Beschreiben Sie Ihr Ziel, zwei Vorbereitungsschritte und den Grund für diese Wahl.", "Erklären Sie eine Zukunftsplanung mit einem Ziel, zwei Schritten und einer Begründung."],
    ["a2-24", "قرار بين خيارين", "Ihre Gruppe kann am Samstag ins Museum oder wandern gehen. Vergleichen Sie Preis und Wetter, machen Sie einen Vorschlag und bitten Sie um Zustimmung.", "Vergleichen Sie Museum und Wanderung, nennen Sie einen Vorteil pro Option und schlagen Sie einen gemeinsamen Plan vor."],
  ],
  B1: [
    ["b1-02", "تغيير قرار", "Sie haben einen Kurs gewechselt. Erklären Sie Ihren ursprünglichen Plan, den Grund für die Änderung und zwei Folgen. Fragen Sie eine Freundin nach ihrer Erfahrung.", "Erzählen Sie von einer Entscheidung: Was war geplant, warum änderten Sie den Plan, und was folgte daraus?"],
    ["b1-05", "خلاف على مهام", "In Ihrem Team wurden Aufgaben ungleich verteilt. Beschreiben Sie die Situation sachlich, erklären Sie einen konkreten Nachteil und schlagen Sie eine faire neue Verteilung vor.", "Verhandeln Sie eine Aufgabenverteilung. Nennen Sie ein Problem, einen Lösungsvorschlag und eine Rückfrage an die andere Seite."],
    ["b1-08", "شكوى محددة", "Ein gemieteter Raum hat nicht die vereinbarte Ausstattung. Beschreiben Sie zwei Abweichungen, erklären Sie deren Folgen und bitten Sie um eine konkrete Lösung.", "Beschreiben Sie eine Reklamation, erklären Sie die Folgen und verhandeln Sie zwischen Ersatz und Preisnachlass."],
    ["b1-11", "اختيار تنقل", "Ihre Arbeitsstelle ist umgezogen. Vergleichen Sie Bus und Fahrrad nach Zeit, Kosten und Zuverlässigkeit. Begründen Sie Ihre Entscheidung und nennen Sie eine Grenze.", "Vergleichen Sie zwei Verkehrsmittel für den Arbeitsweg und reagieren Sie auf den Einwand, dass Ihre Wahl nicht bei jedem Wetter funktioniert."],
    ["b1-14", "طلب معلومات تكوين", "Sie interessieren sich für eine Weiterbildung. Beschreiben Sie Ihr Ziel und Ihre Erfahrung; fragen Sie nach Voraussetzungen, Zeitaufwand und einem Beratungstermin.", "Stellen Sie sich für eine Weiterbildung vor und fragen Sie nach drei Informationen, die Sie für eine Entscheidung brauchen."],
    ["b1-18", "نقل خبر بحذر", "Ein Freund schickt eine unbestätigte Meldung über eine Kursänderung. Geben Sie wieder, was behauptet wird, trennen Sie sichere und offene Angaben und schlagen Sie eine Prüfung vor.", "Fassen Sie eine unbestätigte Nachricht zusammen. Nennen Sie den Ursprung und sagen Sie, welche Information noch überprüft werden muss."],
    ["b1-19", "إصلاح سوء فهم", "Eine Kollegin hat Ihre kurze Nachricht als Kritik verstanden. Erklären Sie Ihren ursprünglichen Zweck, erkennen Sie das Missverständnis an und schlagen Sie ein kurzes Gespräch vor.", "Klären Sie ein Missverständnis, ohne die andere Person zu beschuldigen. Formulieren Sie Ihren Zweck neu und stellen Sie eine Rückfrage."],
    ["b1-24", "مشروع مشترك", "Ihre Lerngruppe plant einen öffentlichen Bücher-Tausch. Beschreiben Sie Ziel, Aufgaben, Zeitplan und einen möglichen Engpass; schlagen Sie eine Lösung vor.", "Stellen Sie einen Gruppenplan vor. Verteilen Sie Aufgaben und verhandeln Sie, was bei Zeitmangel zuerst erledigt wird."],
  ],
  B2: [
    ["b2-01", "قرار حول الهواتف", "Ein Sprachkurs erwägt ein Handyverbot. Diskutieren Sie Nutzen und Risiken, berücksichtigen Sie einen ernsthaften Einwand und formulieren Sie einen überprüfbaren Vorschlag mit klarer Reichweite.", "Vertreten Sie eine Position zur Handynutzung im Kurs. Reagieren Sie auf den Einwand, dass ein Totalverbot notwendige Lernhilfen ausschließt."],
    ["b2-03", "نموذج عمل مرن", "Eine Organisation plant drei Homeoffice-Tage. Vergleichen Sie Auswirkungen auf Zusammenarbeit und Zugang, berücksichtigen Sie unterschiedliche Tätigkeiten und empfehlen Sie ein begrenztes Vorgehen.", "Diskutieren Sie flexible Arbeit mit einer Person, deren Aufgaben Präsenz erfordern. Suchen Sie einen Kompromiss statt einer pauschalen Lösung."],
    ["b2-05", "بيانات وحدودها", "Eine Befragung in zwei Kursen zeigt weniger gemeldeten Stress nach einer Stundenplanänderung. Erläutern Sie den Befund, nennen Sie alternative Erklärungen und begrenzen Sie die Schlussfolgerung.", "Erläutern Sie einen begrenzten Befund. Die andere Person nennt ihn einen Beweis für alle Schulen; korrigieren Sie die Reichweite sachlich."],
    ["b2-08", "تقييم مصدرين", "Zwei Berichte bewerten denselben Pilotversuch unterschiedlich. Ein Bericht nennt Teilnehmerzahlen, der andere nur Einzelbeispiele. Vergleichen Sie Belege und offene Fragen und formulieren Sie ein vorläufiges Urteil.", "Vergleichen Sie zwei unterschiedliche Darstellungen eines Pilotversuchs und erklären Sie, welche weitere Information für ein Urteil fehlt."],
    ["b2-10", "وساطة لقارئ عام", "Eine Arbeitsgruppe empfiehlt ein digitales Anmeldeverfahren, weist aber auf fehlenden Gerätezugang hin. Erklären Sie einem nicht spezialisierten Publikum Empfehlung, Grenze und eine zugängliche Alternative, ohne Fakten zu erfinden.", "Vermitteln Sie eine Empfehlung für digitale Anmeldung an eine Person ohne eigenes Gerät. Erklären Sie Grenze und Alternative und prüfen Sie das Verständnis."],
    ["b2-13", "مراجعة موقف", "Sie haben zunächst eine Maßnahme unterstützt. Neue Rückmeldungen zeigen einen nicht berücksichtigten Nachteil. Erklären Sie, welchen Teil Ihres Standpunkts Sie revidieren, was weiterhin gilt und welche Prüfung Sie vorschlagen.", "Revidieren Sie einen Teil Ihrer Position nach einem nachvollziehbaren Einwand. Benennen Sie, was sich ändert und was offenbleibt."],
    ["b2-17", "طلب رسمي بحدود واضحة", "Eine angekündigte Serviceleistung wurde teilweise erbracht. Beschreiben Sie nur überprüfbare Abweichungen, erläutern Sie deren Folgen und bitten Sie um eine konkrete Korrektur mit nachvollziehbarer Frist. Erfinden Sie keine Rechtsansprüche.", "Verhandeln Sie eine teilweise erbrachte Leistung. Benennen Sie Tatsachen, trennen Sie Wunsch und Anspruch und fragen Sie nach einer realistischen Lösung."],
    ["b2-22", "تبسيط نص كثيف", "Eine interne Mitteilung beschreibt mehrere Zuständigkeiten in langen Nominalgruppen. Formulieren Sie eine verständliche Nachricht: Wer tut was, bis wann, und welche Rückfrage bleibt offen? Erhalten Sie Einschränkungen und vermeiden Sie neue Behauptungen.", "Erklären Sie einen komplexen Ablauf in einfachen Schritten. Die andere Person verwechselt Verantwortliche und Termin; klären Sie beides durch Rückfragen."],
  ],
};
const lengths: Record<CEFRLevel, [number, number, number]> = { A1: [30,50,20], A2: [80,110,45], B1: [140,180,90], B2: [180,230,180] };
export const independentProductionTasks: IndependentProductionTask[] = (Object.entries(seeds) as [CEFRLevel,Seed[]][]).flatMap(([level, rows]) => rows.map(([sourceLessonId,titleAr,writing,speaking],index)=>({
  id:`independent-${level.toLowerCase()}-${index+1}`,
  level,sourceLessonId,titleAr,
  writing:{titleAr,promptDe:`${writing} Schreiben Sie ${lengths[level][0]}–${lengths[level][1]} Wörter.`,promptAr:"مهمة نقل جديدة بلا نموذج جاهز. حدّد المتلقي والغرض، غطّ النقاط المذكورة، ثم سلّم مسودتك قبل أي مراجعة.",checklistAr:["غطيت نقاط المهمة دون اختلاق معلومات.","نظمت الرسالة للمتلقي والغرض.","كتبت مسودتي دون نموذج أو ترجمة آلية."],modelDe:"لا يوجد نموذج في وضع النقل المستقل."},
  speaking:{titleAr,promptDe:`${speaking} Sprechen Sie etwa ${lengths[level][2]} Sekunden.`,promptAr:"قدّم محاولة جديدة دون عبارات نموذجية ظاهرة. سجّل، استمع إلى نفسك، وحدّد موضعًا يحتاج إعادة. وجود التسجيل لا يثبت جودة اللغة.",usefulPhrases:[],successCriteriaAr:["غطيت المقصد والنقاط المذكورة.","لم أقرأ نموذجًا جاهزًا.","راجعت وضوح الكلام وحدّدت سؤال متابعة أو إصلاحًا."]},
  reviewStatus:"authored-independent-review-pending" as const,
})));
export function independentProductionTask(id?: string) { return independentProductionTasks.find(task=>task.id===id); }
export function productionTaskLevel(taskId: string): CEFRLevel | undefined {
  const task=independentProductionTasks.find(item=>taskId===`${item.id}-writing`||taskId===`${item.id}-speaking`);
  return task?.level;
}
