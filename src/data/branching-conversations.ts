import type { CEFRLevel } from "@/types/learning";

export const BRANCHING_CONVERSATION_POLICY = "offline-branching-conversation-v1" as const;
export const BRANCHING_CONVERSATION_BOUNDARY = "structured-local-simulation-no-free-text-ai-live-partner-mastery-or-cefr" as const;

export type BranchChoiceQuality = "effective" | "repairable" | "misaligned";
export type BranchOutcome = "goal-reached" | "partial" | "restart-recommended";

export type BranchChoice = {
  id: string;
  responseDe: string;
  intentionAr: string;
  feedbackAr: string;
  repairTipAr: string;
  quality: BranchChoiceQuality;
  nextNodeId: string;
};

export type BranchDialogueNode = {
  id: string;
  speakerDe: string;
  utteranceDe: string;
  supportAr: string;
  choices?: BranchChoice[];
  outcome?: BranchOutcome;
  outcomeTitleDe?: string;
  outcomeTitleAr?: string;
  outcomeSummaryAr?: string;
  transferPromptDe?: string;
};

export type BranchingConversationScenario = {
  id: string;
  policyVersion: typeof BRANCHING_CONVERSATION_POLICY;
  level: CEFRLevel;
  titleDe: string;
  titleAr: string;
  contextAr: string;
  learnerRoleDe: string;
  learnerRoleAr: string;
  goalDe: string;
  goalAr: string;
  openingNodeId: string;
  estimatedTurns: 2 | 3;
  nodes: BranchDialogueNode[];
  source: "original-authored-branching-dialogue";
  engine: "deterministic-local-tree";
  aiRequired: false;
};

type ScenarioSeed = Omit<BranchingConversationScenario, "policyVersion" | "openingNodeId" | "estimatedTurns" | "nodes" | "source" | "engine" | "aiRequired"> & {
  partnerDe: string;
  rootUtteranceDe: string;
  rootSupportAr: string;
  effective: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  repairable: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  misaligned: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  progressUtteranceDe: string;
  progressSupportAr: string;
  goalFinish: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  partialFinish: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  repairUtteranceDe: string;
  repairSupportAr: string;
  repairedFinish: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  failedRepair: Omit<BranchChoice, "id" | "quality" | "nextNodeId">;
  terminal: {
    goalDe: string; goalAr: string; goalSummaryAr: string; goalTransferDe: string;
    partialDe: string; partialAr: string; partialSummaryAr: string; partialTransferDe: string;
    restartDe: string; restartAr: string; restartSummaryAr: string; restartTransferDe: string;
  };
};

function buildScenario(seed: ScenarioSeed): BranchingConversationScenario {
  const id = seed.id;
  const choice = (suffix: string, quality: BranchChoiceQuality, nextNodeId: string, value: Omit<BranchChoice, "id" | "quality" | "nextNodeId">): BranchChoice => ({ id: `${id}-${suffix}`, quality, nextNodeId, ...value });
  return {
    id,
    policyVersion: BRANCHING_CONVERSATION_POLICY,
    level: seed.level,
    titleDe: seed.titleDe,
    titleAr: seed.titleAr,
    contextAr: seed.contextAr,
    learnerRoleDe: seed.learnerRoleDe,
    learnerRoleAr: seed.learnerRoleAr,
    goalDe: seed.goalDe,
    goalAr: seed.goalAr,
    openingNodeId: `${id}-start`,
    estimatedTurns: 2,
    source: "original-authored-branching-dialogue",
    engine: "deterministic-local-tree",
    aiRequired: false,
    nodes: [
      {
        id: `${id}-start`, speakerDe: seed.partnerDe, utteranceDe: seed.rootUtteranceDe, supportAr: seed.rootSupportAr,
        choices: [
          choice("direct", "effective", `${id}-progress`, seed.effective),
          choice("repair", "repairable", `${id}-repair-node`, seed.repairable),
          choice("off-goal", "misaligned", `${id}-restart`, seed.misaligned),
        ],
      },
      {
        id: `${id}-progress`, speakerDe: seed.partnerDe, utteranceDe: seed.progressUtteranceDe, supportAr: seed.progressSupportAr,
        choices: [choice("finish-goal", "effective", `${id}-goal`, seed.goalFinish), choice("finish-partial", "repairable", `${id}-partial`, seed.partialFinish)],
      },
      {
        id: `${id}-repair-node`, speakerDe: seed.partnerDe, utteranceDe: seed.repairUtteranceDe, supportAr: seed.repairSupportAr,
        choices: [choice("repair-success", "effective", `${id}-goal`, seed.repairedFinish), choice("repair-fail", "misaligned", `${id}-restart`, seed.failedRepair)],
      },
      {
        id: `${id}-goal`, speakerDe: seed.partnerDe, utteranceDe: seed.terminal.goalDe, supportAr: seed.terminal.goalSummaryAr,
        outcome: "goal-reached", outcomeTitleDe: "Ziel erreicht", outcomeTitleAr: seed.terminal.goalAr, outcomeSummaryAr: seed.terminal.goalSummaryAr, transferPromptDe: seed.terminal.goalTransferDe,
      },
      {
        id: `${id}-partial`, speakerDe: seed.partnerDe, utteranceDe: seed.terminal.partialDe, supportAr: seed.terminal.partialSummaryAr,
        outcome: "partial", outcomeTitleDe: "Teilziel erreicht", outcomeTitleAr: seed.terminal.partialAr, outcomeSummaryAr: seed.terminal.partialSummaryAr, transferPromptDe: seed.terminal.partialTransferDe,
      },
      {
        id: `${id}-restart`, speakerDe: seed.partnerDe, utteranceDe: seed.terminal.restartDe, supportAr: seed.terminal.restartSummaryAr,
        outcome: "restart-recommended", outcomeTitleDe: "Noch einmal mit klarem Ziel", outcomeTitleAr: seed.terminal.restartAr, outcomeSummaryAr: seed.terminal.restartSummaryAr, transferPromptDe: seed.terminal.restartTransferDe,
      },
    ],
  };
}

export const branchingConversationScenarios: BranchingConversationScenario[] = [
  buildScenario({
    id:"branch-a1-bakery",level:"A1",titleDe:"In der Bäckerei",titleAr:"في المخبزة",contextAr:"تطلب خبزًا وتوضح العدد ثم تنهي الطلب بأدب.",learnerRoleDe:"Kundin oder Kunde",learnerRoleAr:"زبون/زبونة",goalDe:"Bestellen Sie zwei Brötchen und fragen Sie nach dem Preis.",goalAr:"اطلب قطعتين واسأل عن السعر.",partnerDe:"Verkäuferin",rootUtteranceDe:"Guten Morgen. Was möchten Sie?",rootSupportAr:"ابدأ بطلب محدد: العدد والشيء.",
    effective:{responseDe:"Guten Morgen. Zwei Brötchen, bitte.",intentionAr:"طلب محدد ومهذب",feedbackAr:"فهمت البائعة الشيء والعدد مباشرة.",repairTipAr:"احتفظ بـ bitte بعد الطلب."},
    repairable:{responseDe:"Ich möchte etwas essen.",intentionAr:"تذكر حاجة عامة",feedbackAr:"الجملة صحيحة لكنها لا تحدد ما تريد شراءه.",repairTipAr:"أضف العدد واسم المنتج."},
    misaligned:{responseDe:"Wo ist der Bahnhof?",intentionAr:"تسأل عن مكان آخر",feedbackAr:"الرد لا يجيب عن سؤال الطلب، فتتوقف المعاملة.",repairTipAr:"ارجع إلى: Zwei Brötchen, bitte."},
    progressUtteranceDe:"Gern. Möchten Sie sonst noch etwas?",progressSupportAr:"حقق الطلب الأول. الآن اسأل عن السعر بدل إضافة شيء لا تحتاجه.",
    goalFinish:{responseDe:"Nein, danke. Wie viel kostet das?",intentionAr:"ترفض إضافة وتسأل عن السعر",feedbackAr:"أكملت الطلب والسؤال عن السعر بأدب.",repairTipAr:"Wie viel kostet das? سؤال عملي كامل."},
    partialFinish:{responseDe:"Nein, danke.",intentionAr:"تنهي الطلب فقط",feedbackAr:"أنهيت الطلب لكن هدف السؤال عن السعر بقي ناقصًا.",repairTipAr:"أضف: Wie viel kostet das?"},
    repairUtteranceDe:"Was genau möchten Sie?",repairSupportAr:"الشريكة تطلب التحديد. قل العدد والمنتج الآن.",
    repairedFinish:{responseDe:"Zwei Brötchen, bitte. Wie viel kostet das?",intentionAr:"تصلح الغموض وتكمل الهدف",feedbackAr:"أصلحت الطلب وذكرت السعر في دور واحد.",repairTipAr:"عند طلب التوضيح، أجب بالمعلومة الناقصة مباشرة."},
    failedRepair:{responseDe:"Ja, genau.",intentionAr:"تؤكد دون تحديد",feedbackAr:"التأكيد لا يضيف المنتج أو العدد، لذلك ما زال الطلب غير مفهوم.",repairTipAr:"لا تستعمل genau قبل وجود معلومة محددة."},
    terminal:{goalDe:"Das kostet drei Euro. Vielen Dank!",goalAr:"اكتمل الطلب",goalSummaryAr:"حددت المنتج والعدد وسألت عن السعر.",goalTransferDe:"Bestellen Sie jetzt ein Getränk und fragen Sie nach dem Preis.",partialDe:"Gut. Das macht drei Euro.",partialAr:"اكتمل جزء من الهدف",partialSummaryAr:"الطلب مفهوم، لكنك لم تسأل عن السعر بنفسك.",partialTransferDe:"Ergänzen Sie jetzt eine Preisfrage.",restartDe:"Ich weiß noch nicht, was Sie möchten.",restartAr:"أعد بهدف أوضح",restartSummaryAr:"لم تصل معلومة المنتج والعدد إلى الشريكة.",restartTransferDe:"Beginnen Sie neu: Anzahl + Produkt + bitte."}
  }),
  buildScenario({
    id:"branch-a1-course",level:"A1",titleDe:"Erster Kurstag",titleAr:"أول يوم في الدورة",contextAr:"تتعرف إلى زميل وتسأله عن الاسم والمدينة.",learnerRoleDe:"Neue Kursteilnehmerin oder neuer Kursteilnehmer",learnerRoleAr:"متعلم جديد",goalDe:"Stellen Sie sich vor und stellen Sie eine Frage.",goalAr:"عرّف بنفسك واسأل سؤالًا واحدًا.",partnerDe:"Kursteilnehmer",rootUtteranceDe:"Hallo! Ich heiße Jonas. Und du?",rootSupportAr:"قل اسمك أولًا ثم اترك سؤالًا بسيطًا.",
    effective:{responseDe:"Hallo! Ich heiße Rami. Wo wohnst du?",intentionAr:"تعريف وسؤال عن السكن",feedbackAr:"قدمت اسمك وفتحت دورًا جديدًا بسؤال واضح.",repairTipAr:"مع الزميل استعمل du وwohnst."},repairable:{responseDe:"Hallo! Ich bin neu hier.",intentionAr:"تذكر أنك جديد",feedbackAr:"الرد مناسب لكنه لا يعطي الاسم ولا يسأل.",repairTipAr:"أضف Ich heiße … ثم سؤالًا."},misaligned:{responseDe:"Auf Wiedersehen!",intentionAr:"تنهي الحديث فورًا",feedbackAr:"أنهيت اللقاء قبل تحقيق هدف التعارف.",repairTipAr:"ابدأ بتحية واسم بدل الوداع."},
    progressUtteranceDe:"Ich wohne in Potsdam. Und wo wohnst du?",progressSupportAr:"أجب عن السؤال ثم اختم برد قصير يحافظ على التبادل.",goalFinish:{responseDe:"Ich wohne in Berlin. Freut mich!",intentionAr:"إجابة وخاتمة ودية",feedbackAr:"أجبت بالمعلومة المطلوبة وأغلقت التعارف طبيعيًا.",repairTipAr:"Freut mich مناسبة بعد تبادل المعلومات."},partialFinish:{responseDe:"Ja, ich wohne.",intentionAr:"تؤكد السكن دون مدينة",feedbackAr:"الفعل موجود لكن المدينة المطلوبة غير مذكورة.",repairTipAr:"قل: Ich wohne in + Stadt."},
    repairUtteranceDe:"Wie heißt du?",repairSupportAr:"طُلب اسمك صراحة؛ أعطه ثم أضف سؤالًا.",repairedFinish:{responseDe:"Ich heiße Rami. Und wo wohnst du?",intentionAr:"تعطي الاسم وتستعيد التبادل",feedbackAr:"أصلحت النقص وحققت التعريف والسؤال.",repairTipAr:"استعمل Und …? لتمرير الدور."},failedRepair:{responseDe:"Ich komme morgen.",intentionAr:"تذكر موعدًا لا الاسم",feedbackAr:"المعلومة لا تجيب عن Wie heißt du.",repairTipAr:"طابق نوع الجواب مع Fragewort wie heißen."},
    terminal:{goalDe:"Freut mich auch. Bis morgen!",goalAr:"تعارف ناجح",goalSummaryAr:"قدمت نفسك وتبادلت سؤالًا وجوابًا.",goalTransferDe:"Fragen Sie eine andere Person nach Name und Wohnort.",partialDe:"Ah, du wohnst also hier.",partialAr:"المعلومة غير مكتملة",partialSummaryAr:"استمر الحديث لكن المدينة لم تصل بوضوح.",partialTransferDe:"Antworten Sie mit: Ich wohne in …",restartDe:"Entschuldigung, ich habe deinen Namen nicht verstanden.",restartAr:"ابدأ التعارف من جديد",restartSummaryAr:"الاسم والسؤال لم يصلا بعد.",restartTransferDe:"Sagen Sie: Ich heiße … Und du?"}
  }),
  buildScenario({
    id:"branch-a2-appointment",level:"A2",titleDe:"Termin in der Praxis",titleAr:"موعد في العيادة",contextAr:"تطلب موعدًا وتوضح الوقت الممكن دون ذكر بيانات حقيقية.",learnerRoleDe:"Patientin oder Patient",learnerRoleAr:"مراجع للعيادة",goalDe:"Vereinbaren Sie einen Termin am Nachmittag.",goalAr:"اتفق على موعد بعد الظهر.",partnerDe:"Mitarbeiterin",rootUtteranceDe:"Praxis am Markt, guten Tag. Wie kann ich Ihnen helfen?",rootSupportAr:"اذكر أنك تريد موعدًا وحدد الفترة العامة.",
    effective:{responseDe:"Guten Tag. Ich brauche einen Termin am Nachmittag.",intentionAr:"طلب موعد مع قيد زمني",feedbackAr:"عرفت الموظفة المطلوب والفترة المناسبة.",repairTipAr:"am Nachmittag يحدد الفترة دون بيانات إضافية."},repairable:{responseDe:"Guten Tag. Ich habe ein Problem.",intentionAr:"تذكر وجود مشكلة فقط",feedbackAr:"فهمت الحاجة العامة لكن لا تعرف هل تريد موعدًا.",repairTipAr:"اطلب Termin صراحة."},misaligned:{responseDe:"Schicken Sie mir bitte eine Rechnung.",intentionAr:"تطلب فاتورة",feedbackAr:"انتقلت إلى موضوع آخر ولم تطلب موعدًا.",repairTipAr:"ثبت هدف الاتصال قبل إضافة طلب آخر."},
    progressUtteranceDe:"Am Donnerstag haben wir um fünfzehn Uhr etwas frei. Passt das?",progressSupportAr:"اقبل الموعد أو اطلب بديلًا محددًا.",goalFinish:{responseDe:"Ja, Donnerstag um fünfzehn Uhr passt. Vielen Dank.",intentionAr:"تؤكد اليوم والوقت",feedbackAr:"أعدت الموعد وأكدته، فقل خطر سوء الفهم.",repairTipAr:"كرر اليوم والساعة عند التأكيد."},partialFinish:{responseDe:"Donnerstag ist gut, aber wann?",intentionAr:"تقبل اليوم وتفقد الساعة",feedbackAr:"الموظفة قالت الساعة بالفعل؛ طلبك يكشف أن جزءًا لم يُلتقط.",repairTipAr:"أكد 15 Uhr أو اطلب الإعادة بوضوح."},
    repairUtteranceDe:"Möchten Sie einen Termin oder nur eine Auskunft?",repairSupportAr:"اختر Termin واذكر بعد الظهر.",repairedFinish:{responseDe:"Einen Termin, bitte. Am Nachmittag kann ich kommen.",intentionAr:"تصلح نوع الطلب والوقت",feedbackAr:"أصبح المطلوب محددًا ويمكن للموظفة المتابعة.",repairTipAr:"جواب البديل يبدأ بالاختيار نفسه."},failedRepair:{responseDe:"Das weiß ich nicht.",intentionAr:"لا تختار بين البديلين",feedbackAr:"لم تحدد Termin أو Auskunft، فبقي الاتصال معلقًا.",repairTipAr:"كرر كلمة Termin لإغلاق الغموض."},
    terminal:{goalDe:"Der Termin ist eingetragen. Auf Wiederhören!",goalAr:"تم تثبيت الموعد",goalSummaryAr:"طلبت فترة مناسبة وأكدت اليوم والساعة.",goalTransferDe:"Bestätigen Sie einen anderen Termin mit Tag und Uhrzeit.",partialDe:"Ich wiederhole: Donnerstag um fünfzehn Uhr.",partialAr:"احتجت إلى إعادة",partialSummaryAr:"وصل اليوم، لكن الساعة احتاجت إلى توضيح إضافي.",partialTransferDe:"Bestätigen Sie jetzt die wiederholte Uhrzeit.",restartDe:"Rufen Sie bitte noch einmal an, wenn Ihr Anliegen klar ist.",restartAr:"أعد المكالمة بهدف محدد",restartSummaryAr:"نوع الطلب لم يُحسم.",restartTransferDe:"Beginnen Sie mit: Ich brauche einen Termin."}
  }),
  buildScenario({
    id:"branch-a2-landlord",level:"A2",titleDe:"Problem in der Wohnung",titleAr:"مشكلة في الشقة",contextAr:"تبلغ إدارة السكن عن تدفئة معطلة وتطلب موعد فحص.",learnerRoleDe:"Mieterin oder Mieter",learnerRoleAr:"مستأجر/مستأجرة",goalDe:"Beschreiben Sie das Problem und bitten Sie um einen Termin.",goalAr:"صف المشكلة واطلب موعدًا للفحص.",partnerDe:"Hausverwaltung",rootUtteranceDe:"Hausverwaltung Schneider. Was ist passiert?",rootSupportAr:"قل ما الذي لا يعمل ومنذ متى.",
    effective:{responseDe:"Die Heizung funktioniert seit gestern nicht.",intentionAr:"وصف الشيء والمدة",feedbackAr:"وصل نوع العطل وبدايته بوضوح.",repairTipAr:"seit يأخذ بداية مستمرة حتى الآن."},repairable:{responseDe:"In meiner Wohnung ist es kalt.",intentionAr:"تصف النتيجة فقط",feedbackAr:"وصل أثر المشكلة، لكن مصدرها لم يتحدد بعد.",repairTipAr:"اذكر Heizung وfunktioniert nicht."},misaligned:{responseDe:"Ich möchte die Wohnung kündigen.",intentionAr:"تطلب إنهاء العقد",feedbackAr:"هذا موضوع مختلف ولا يحقق طلب إصلاح التدفئة.",repairTipAr:"لا توسع المشكلة إلى إجراء قانوني غير مطلوب."},
    progressUtteranceDe:"Wir können morgen zwischen zehn und zwölf Uhr kommen. Sind Sie zu Hause?",progressSupportAr:"أكد وجودك واطلب تضييق الوقت إن احتجت.",goalFinish:{responseDe:"Ja, ich bin da. Bitte kommen Sie um zehn Uhr.",intentionAr:"تؤكد وتقترح وقتًا",feedbackAr:"أكدت إمكانية الدخول وطلبت وقتًا واضحًا.",repairTipAr:"اجمع التأكيد مع الوقت في دور واحد."},partialFinish:{responseDe:"Vielleicht bin ich zu Hause.",intentionAr:"تعطي احتمالًا",feedbackAr:"الإجابة لا تسمح بتثبيت الزيارة.",repairTipAr:"اختر وقتًا تستطيع تأكيده أو اطلب موعدًا آخر."},
    repairUtteranceDe:"Ist die Heizung kaputt, oder ist ein Fenster offen?",repairSupportAr:"اختر التدفئة واذكر أنها لا تعمل.",repairedFinish:{responseDe:"Die Heizung ist kaputt. Können Sie morgen kommen?",intentionAr:"تحدد السبب وتطلب الموعد",feedbackAr:"أصلحت الوصف وحولت البلاغ إلى خطوة عملية.",repairTipAr:"بعد تحديد المشكلة اطلب الإجراء التالي."},failedRepair:{responseDe:"Es ist einfach schlecht.",intentionAr:"تكرر تقييمًا عامًا",feedbackAr:"لا يعرف الطرف ما الذي يجب فحصه.",repairTipAr:"استبدل schlecht باسم الشيء والفعل المحدد."},
    terminal:{goalDe:"Gut, der Techniker kommt morgen um zehn Uhr.",goalAr:"تم ترتيب الفحص",goalSummaryAr:"وصفت العطل وحددت زيارة قابلة للتنفيذ.",goalTransferDe:"Melden Sie jetzt ein Problem mit dem Wasser und vereinbaren Sie einen Termin.",partialDe:"Bitte rufen Sie zurück, wenn Sie die Zeit bestätigen können.",partialAr:"البلاغ وصل دون موعد",partialSummaryAr:"المشكلة مفهومة لكن الزيارة لم تُثبت.",partialTransferDe:"Bitten Sie um eine konkrete neue Uhrzeit.",restartDe:"Ohne genaue Beschreibung können wir keinen Auftrag anlegen.",restartAr:"أعد البلاغ بدقة",restartSummaryAr:"لم يتحدد الشيء المعطل أو الإجراء المطلوب.",restartTransferDe:"Nennen Sie Gegenstand, Problem und gewünschten Termin."}
  }),
  buildScenario({
    id:"branch-b1-feedback",level:"B1",titleDe:"Feedback im Team",titleAr:"ملاحظات داخل الفريق",contextAr:"تستقبل نقدًا على عرض وتحوّله إلى إجراء محدد.",learnerRoleDe:"Teammitglied",learnerRoleAr:"عضو في الفريق",goalDe:"Reagieren Sie sachlich und vereinbaren Sie eine Verbesserung.",goalAr:"رد بموضوعية واتفق على تحسين محدد.",partnerDe:"Teamleiterin",rootUtteranceDe:"Die Präsentation war klar, aber die Technik wurde zu spät getestet.",rootSupportAr:"أظهر أنك فهمت النقطة قبل تبرير موقفك.",
    effective:{responseDe:"Das stimmt. Beim nächsten Mal teste ich die Technik am Vortag.",intentionAr:"تقبل النقطة وتقترح إجراء",feedbackAr:"ربطت الملاحظة بخطوة قابلة للتحقق.",repairTipAr:"Das stimmt ثم إجراء محدد يحافظان على حوار مهني."},repairable:{responseDe:"Ich hatte gestern sehr viel zu tun.",intentionAr:"تشرح السبب أولًا",feedbackAr:"قد يكون السبب صحيحًا لكنه لا يبين فهم الأثر أو الحل.",repairTipAr:"أقر بالنقطة أولًا ثم أضف السياق."},misaligned:{responseDe:"Die Präsentation war doch perfekt.",intentionAr:"ترفض الملاحظة كلها",feedbackAr:"تجاهلت الجزء الإيجابي والنقطة المحددة، فتتعطل المعالجة.",repairTipAr:"لا تحول ملاحظة جزئية إلى حكم على العمل كله."},
    progressUtteranceDe:"Gut. Wer übernimmt zusätzlich die Checkliste?",progressSupportAr:"حدد مسؤولًا وخطوة متابعة، أو اطلب اتفاقًا مشتركًا.",goalFinish:{responseDe:"Ich übernehme die Checkliste und schicke sie dem Team bis Freitag.",intentionAr:"مسؤول وموعد وتسليم",feedbackAr:"جعلت التحسين محددًا بزمن ومخرج.",repairTipAr:"من + ماذا + متى يجعل الاتفاق قابلًا للمتابعة."},partialFinish:{responseDe:"Wir sollten das später besprechen.",intentionAr:"تؤجل القرار",feedbackAr:"حافظت على الموضوع لكن لم تحدد مسؤولًا أو موعدًا.",repairTipAr:"استبدل später بيوم ومسؤول محددين."},
    repairUtteranceDe:"Ich verstehe den Zeitdruck. Was ändern Sie konkret?",repairSupportAr:"المطلوب الآن إجراء محدد، لا سبب إضافي.",repairedFinish:{responseDe:"Ich teste am Vortag und dokumentiere das Ergebnis in der Checkliste.",intentionAr:"تحول السبب إلى إجراء",feedbackAr:"أجبت عن konkret بخطوتين واضحتين.",repairTipAr:"ركز على الفعل المستقبلي القابل للملاحظة."},failedRepair:{responseDe:"Dafür kann ich nichts.",intentionAr:"ترفض أي مسؤولية",feedbackAr:"لم تقدم تعديلًا، لذلك لا يوجد اتفاق عملي.",repairTipAr:"يمكن فصل المسؤولية عن اقتراح تحسين مشترك."},
    terminal:{goalDe:"Einverstanden. Dann prüfen wir die Checkliste am Freitag.",goalAr:"اتفاق تحسين واضح",goalSummaryAr:"استقبلت الملاحظة وحددت إجراءً ومسؤولًا وموعدًا.",goalTransferDe:"Reagieren Sie auf ein anderes Feedback mit Maßnahme und Termin.",partialDe:"Wir nehmen das Thema in die nächste Sitzung mit.",partialAr:"تأجل القرار",partialSummaryAr:"بقي الحوار موضوعيًا لكن دون التزام محدد.",partialTransferDe:"Ergänzen Sie Verantwortliche und Frist.",restartDe:"So kommen wir bei der Verbesserung nicht weiter.",restartAr:"أعد الرد دون دفاع شامل",restartSummaryAr:"لم يظهر فهم النقطة أو استعداد لمعالجتها.",restartTransferDe:"Fassen Sie zuerst die Kritik sachlich zusammen."}
  }),
  buildScenario({
    id:"branch-b1-study",level:"B1",titleDe:"Aufgaben im Studienprojekt",titleAr:"مهام مشروع دراسي",contextAr:"تفاوض زميلًا على توزيع مهمة مع سبب وبديل.",learnerRoleDe:"Projektmitglied",learnerRoleAr:"عضو مشروع",goalDe:"Lehnen Sie eine Aufgabe begründet ab und bieten Sie eine Alternative an.",goalAr:"ارفض مهمة بسبب واضح واقترح بديلًا.",partnerDe:"Projektpartner",rootUtteranceDe:"Kannst du morgen die gesamte Auswertung übernehmen?",rootSupportAr:"لا تقل nein فقط؛ اذكر القيد ثم البديل الممكن.",
    effective:{responseDe:"Morgen schaffe ich nicht alles, aber ich kann die Tabellen vorbereiten.",intentionAr:"قيد مع بديل محدد",feedbackAr:"حميت حدود الوقت وأبقيت مساهمتك واضحة.",repairTipAr:"aber يحول الرفض إلى تعاون."},repairable:{responseDe:"Das ist zu viel für mich.",intentionAr:"تذكر الحمل دون بديل",feedbackAr:"وصلت المشكلة، لكن توزيع العمل لم يتحرك بعد.",repairTipAr:"حدد الجزء الذي تستطيع أخذه."},misaligned:{responseDe:"Das Projekt interessiert mich nicht mehr.",intentionAr:"تنسحب من المشروع",feedbackAr:"وسعت سؤال مهمة واحدة إلى انسحاب كامل دون تفاوض.",repairTipAr:"ابق داخل المهمة الحالية والوقت المتاح."},
    progressUtteranceDe:"Gut. Dann analysiere ich die Daten. Bis wann kannst du die Tabellen schicken?",progressSupportAr:"قدم موعدًا واقعيًا يمكن للطرف الاعتماد عليه.",goalFinish:{responseDe:"Ich schicke dir die Tabellen morgen bis sechzehn Uhr.",intentionAr:"موعد تسليم محدد",feedbackAr:"أغلقت التوزيع بموعد واضح.",repairTipAr:"bis + Uhrzeit يحدد نهاية المهلة."},partialFinish:{responseDe:"Ich schicke sie so bald wie möglich.",intentionAr:"وعد بلا موعد",feedbackAr:"الوعد إيجابي لكنه لا يساعد على تخطيط التحليل.",repairTipAr:"استبدل so bald wie möglich بوقت واقعي."},
    repairUtteranceDe:"Welchen Teil könntest du denn übernehmen?",repairSupportAr:"اختر جزءًا ملموسًا الآن.",repairedFinish:{responseDe:"Ich kann die Tabellen erstellen und die Quellen kontrollieren.",intentionAr:"تقترح جزأين قابلين للتنفيذ",feedbackAr:"حولت الرفض العام إلى مساهمة محددة.",repairTipAr:"سمِّ المخرج لا مجرد الاستعداد."},failedRepair:{responseDe:"Gar keinen Teil.",intentionAr:"ترفض كل مساهمة",feedbackAr:"لم تقدم بديلًا، لذلك فشل هدف التفاوض.",repairTipAr:"إن تعذر العمل، اقترح وقتًا أو مهمة أصغر."},
    terminal:{goalDe:"Perfekt. Dann ist die Arbeit fair verteilt.",goalAr:"توزيع متفق عليه",goalSummaryAr:"ذكرت القيد وقدمت بديلًا وموعدًا.",goalTransferDe:"Verhandeln Sie jetzt eine andere Aufgabe mit Begründung und Alternative.",partialDe:"Okay, aber ich brauche bald eine genaue Zeit.",partialAr:"البديل دون مهلة",partialSummaryAr:"توزعت المهام، لكن موعد التسليم غير قابل للتخطيط.",partialTransferDe:"Nennen Sie eine realistische Frist.",restartDe:"Dann müssen wir die Aufgabenverteilung ganz neu klären.",restartAr:"أعد التفاوض",restartSummaryAr:"لم يظهر بديل يحافظ على المشروع.",restartTransferDe:"Formulieren Sie Grenze + mögliche Teilaufgabe."}
  }),
  buildScenario({
    id:"branch-b2-flexwork",level:"B2",titleDe:"Flexible Arbeitszeit verhandeln",titleAr:"التفاوض على وقت عمل مرن",contextAr:"تقترح تجربة محدودة وتجيب عن قلق التغطية بدل تقديم مطالبة مطلقة.",learnerRoleDe:"Mitarbeiterin oder Mitarbeiter",learnerRoleAr:"موظف/موظفة",goalDe:"Schlagen Sie einen begrenzten Pilotversuch mit Kriterien vor.",goalAr:"اقترح تجربة محدودة بمعايير متابعة.",partnerDe:"Vorgesetzte",rootUtteranceDe:"Flexible Startzeiten könnten unsere Erreichbarkeit am Morgen gefährden.",rootSupportAr:"اعترف بالمخاطرة ثم قل كيف ستحدها أو تقيسها.",
    effective:{responseDe:"Die Sorge ist berechtigt. Wir könnten das Modell vier Wochen mit einer festen Frühbesetzung testen.",intentionAr:"اعتراف وتجربة وقيد",feedbackAr:"لم تنكر الخطر وحولت الاقتراح إلى اختبار محدود.",repairTipAr:"berechtigt + Pilot + Schutzmaßnahme بنية تفاوض قوية."},repairable:{responseDe:"Andere Unternehmen arbeiten auch flexibel.",intentionAr:"تستشهد بممارسة عامة",feedbackAr:"المقارنة لا تجيب عن خطر التغطية في هذا الفريق.",repairTipAr:"اربط الدليل بسياقكم ومعيار قياس."},misaligned:{responseDe:"Sie müssen den Vorschlag einfach akzeptieren.",intentionAr:"تطالب بالقبول دون نقاش",feedbackAr:"ألغيت الاعتراض بدل معالجته، فتوقف التفاوض.",repairTipAr:"في التفاوض أجب عن المصلحة لا عن السلطة."},
    progressUtteranceDe:"Welche Kriterien würden Sie nach den vier Wochen auswerten?",progressSupportAr:"سم مؤشرات تكشف الفائدة والضرر معًا.",goalFinish:{responseDe:"Wir messen Erreichbarkeit, Überstunden und Rückmeldungen des Teams.",intentionAr:"ثلاثة مؤشرات متوازنة",feedbackAr:"اخترت مؤشرات أداء وعبء وتجربة فريق.",repairTipAr:"لا تقِس الفائدة وحدها."},partialFinish:{responseDe:"Wir fragen, ob alle zufrieden sind.",intentionAr:"تقيس الرضا فقط",feedbackAr:"الرضا مهم لكنه لا يكشف التغطية أو العمل الإضافي.",repairTipAr:"أضف Erreichbarkeit وÜberstunden."},
    repairUtteranceDe:"Das Beispiel ist interessant, aber wie schützen wir unsere Morgenabdeckung?",repairSupportAr:"اقترح إجراء تغطية داخل الفريق ثم مدة اختبار.",repairedFinish:{responseDe:"Ein rotierender Frühdienst sichert die Abdeckung; nach vier Wochen prüfen wir die Daten.",intentionAr:"حماية ومدة ومراجعة",feedbackAr:"أجبت مباشرة عن الاعتراض وأبقيت القرار قابلًا للمراجعة.",repairTipAr:"استخدم semicolon فقط إن أردت؛ المعنى هنا أهم من الزخرفة."},failedRepair:{responseDe:"Das wird schon funktionieren.",intentionAr:"تطمئن دون آلية",feedbackAr:"الطمأنة لا تحمي التغطية ولا تولد دليلًا.",repairTipAr:"استبدل التوقع بإجراء قابل للمراقبة."},
    terminal:{goalDe:"Unter diesen Bedingungen können wir den Pilotversuch planen.",goalAr:"موافقة مشروطة على التجربة",goalSummaryAr:"عالجت القلق وحددت مدة وحماية ومؤشرات.",goalTransferDe:"Formulieren Sie einen anderen Pilotvorschlag mit Risiko und Messkriterien.",partialDe:"Wir brauchen zusätzlich objektive Kriterien zur Erreichbarkeit.",partialAr:"الاقتراح يحتاج مؤشرات",partialSummaryAr:"التجربة ممكنة، لكن التقييم ما زال أحادي الجانب.",partialTransferDe:"Ergänzen Sie Leistungs- und Belastungskriterien.",restartDe:"Ohne Umgang mit dem Risiko kann ich dem Vorschlag nicht zustimmen.",restartAr:"أعد التفاوض من المصلحة المشتركة",restartSummaryAr:"لم يُعالج خطر التغطية بعد.",restartTransferDe:"Bestätigen Sie das Risiko und schlagen Sie eine begrenzte Lösung vor."}
  }),
  buildScenario({
    id:"branch-b2-civic",level:"B2",titleDe:"Bürgerdialog zur Grünfläche",titleAr:"حوار مدني حول مساحة خضراء",contextAr:"تلخص موقفًا آخر ثم تضيف اقتراحًا يجمع حاجتين مع معيار تقييم.",learnerRoleDe:"Teilnehmerin oder Teilnehmer am Bürgerdialog",learnerRoleAr:"مشارك/مشاركة في حوار مدني",goalDe:"Fassen Sie ein Gegenargument fair zusammen und machen Sie einen prüfbaren Kompromissvorschlag.",goalAr:"لخص الحجة المقابلة بإنصاف واقترح حلًا وسطًا قابلًا للتقييم.",partnerDe:"Geschäftsinhaberin",rootUtteranceDe:"Wenn Parkplätze wegfallen, verlieren kleine Geschäfte möglicherweise Kundschaft.",rootSupportAr:"ابدأ بتلخيص القلق كما هو قبل عرض المساحة الخضراء.",
    effective:{responseDe:"Sie befürchten also Nachteile für kleine Geschäfte. Könnten zwei Kurzzeitparkplätze erhalten bleiben?",intentionAr:"تلخيص واقتراح وسط",feedbackAr:"مثلت القلق بإنصاف وقدمت حلًا مرتبطًا به.",repairTipAr:"also يلخص، ثم سؤال اقتراح يفتح التفاوض."},repairable:{responseDe:"Eine Grünfläche ist aber wichtiger.",intentionAr:"ترتب الأولويات دون تلخيص",feedbackAr:"عرضت موقفك لكن لم تظهر فهم أثر الخطة على الطرف الآخر.",repairTipAr:"لخص القلق أولًا ثم وازن الحاجتين."},misaligned:{responseDe:"Autos gehören grundsätzlich aus der Stadt verbannt.",intentionAr:"تنتقل إلى موقف مطلق",feedbackAr:"وسعت النقاش من تصميم موضعي إلى حظر عام، فاختفى مجال التسوية.",repairTipAr:"ابق ضمن المساحة والقرار الحاليين."},
    progressUtteranceDe:"Zwei Plätze könnten helfen. Wie prüfen wir, ob die Lösung funktioniert?",progressSupportAr:"اختر معيارًا للتجارة وآخر لاستعمال المساحة أو الوصول.",goalFinish:{responseDe:"Wir vergleichen Kundenfrequenz, Nutzung der Sitzplätze und Zugänglichkeit nach drei Monaten.",intentionAr:"مؤشرات متعددة وموعد",feedbackAr:"جعلت الحل الوسط قابلًا للمراجعة من أكثر من منظور.",repairTipAr:"حدد متى ومن أي زوايا ستراجع النتيجة."},partialFinish:{responseDe:"Wir können später eine Umfrage machen.",intentionAr:"تقترح قياسًا عامًا مؤجلًا",feedbackAr:"يوجد اتجاه للتقييم، لكن لا موعد ولا مؤشرات واضحة.",repairTipAr:"حدد بعد كم شهر وماذا ستقيس."},
    repairUtteranceDe:"Sie sprechen über Grün, aber was ist mit den kleinen Geschäften?",repairSupportAr:"أعد ذكر قلق التجارة ثم اقترح عنصرًا يحفظ وصولًا قصيرًا.",repairedFinish:{responseDe:"Der Zugang muss erhalten bleiben. Deshalb schlage ich zwei Kurzzeitparkplätze und eine Auswertung nach drei Monaten vor.",intentionAr:"تقر بالحاجة وتقترح حلًا وموعد مراجعة",feedbackAr:"أصلحت التمثيل وربطت الحل بقياس لاحق.",repairTipAr:"Deshalb يربط الحاجة بالاقتراح."},failedRepair:{responseDe:"Darüber müssen wir nicht sprechen.",intentionAr:"تستبعد القلق",feedbackAr:"رفضت أحد أصحاب المصلحة، فلم يعد الحل وسطًا.",repairTipAr:"التسوية تبدأ بإبقاء الحاجتين داخل السؤال."},
    terminal:{goalDe:"Damit könnten wir beide Interessen im Pilotplan berücksichtigen.",goalAr:"حل وسط قابل للاختبار",goalSummaryAr:"لخصت الاعتراض واقترحت حلًا ومؤشرات وموعد مراجعة.",goalTransferDe:"Fassen Sie eine neue Gegenposition zusammen und formulieren Sie einen messbaren Kompromiss.",partialDe:"Die Richtung stimmt, aber Kriterien und Termin fehlen noch.",partialAr:"اتجاه جيد دون قياس كامل",partialSummaryAr:"ظهر استعداد للتسوية، لكن المراجعة ليست قابلة للتنفيذ بعد.",partialTransferDe:"Nennen Sie mindestens zwei Kriterien und einen Zeitpunkt.",restartDe:"So bleibt meine Sorge unberücksichtigt.",restartAr:"أعد إدخال الطرف الآخر",restartSummaryAr:"الحجة المقابلة استُبعدت بدل تلخيصها.",restartTransferDe:"Beginnen Sie mit einer fairen Zusammenfassung der Sorge."}
  }),
];

export function branchingScenariosForLevel(level: CEFRLevel) {
  return branchingConversationScenarios.filter((scenario) => scenario.level === level);
}

export function branchNode(scenario: BranchingConversationScenario, nodeId: string) {
  const node = scenario.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown branching dialogue node: ${nodeId}`);
  return node;
}
