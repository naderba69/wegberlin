import type { ExamProfile, ExamSourceReference } from "@/types/exam";

export const examSources: ExamSourceReference[] = [
  {
    id: "goethe-b2-overview-2026",
    organization: "Goethe-Institut",
    title: "Goethe-Zertifikat B2 — exam modules overview",
    url: "https://goethe.de/ins/us/en/sta/sfr/prf/gzb2/wi9.html",
    accessedAt: "2026-08-28",
    usageNoteAr: "مصدر رسمي لبنية الوحدات والمهارات والمدد العامة. لا يُنسخ منه محتوى الأسئلة.",
  },
  {
    id: "goethe-b2-terms-2025",
    organization: "Goethe-Institut",
    title: "Goethe-Zertifikat B2 — Terms and Conditions for Exam Administration",
    url: "https://www.goethe.de/pro/relaunch/prf/en/Durchfuehrungsbestimmungen_B2.pdf",
    accessedAt: "2026-08-28",
    publishedOrUpdatedAt: "2025-09-01",
    usageNoteAr: "مصدر رسمي لعدد الأجزاء والمدد والتنظيم والوحدات المستقلة.",
  },
  {
    id: "goethe-b2-model-2025",
    organization: "Goethe-Institut",
    title: "Goethe-Zertifikat B2 Modellsatz Erwachsene",
    url: "https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf",
    accessedAt: "2026-08-28",
    publishedOrUpdatedAt: "2025-08",
    usageNoteAr: "استُعمل لتوثيق أنواع الأجزاء وعدد العناصر وحد النجاح فقط؛ كل نصوص التطبيق أصلية.",
  },
  {
    id: "telc-b2-overview-2026",
    organization: "telc gGmbH",
    title: "telc Deutsch B2 — official examination overview",
    url: "https://www.telc.net/en/language-examinations/certificate-exams/german/telc-german-b2/",
    accessedAt: "2026-08-28",
    usageNoteAr: "مصدر رسمي حالي لعدد الأجزاء والمدد والصيغ المتاحة.",
  },
  {
    id: "telc-b2-mock-2019-current-link",
    organization: "telc gGmbH",
    title: "telc Deutsch B2 Übungstest 1 — revised 2019 edition",
    url: "https://www.telc.net/fileadmin/user_upload/mock_exams/Deutsch/telc_deutsch_b2.zip",
    accessedAt: "2026-08-28",
    publishedOrUpdatedAt: "2019",
    usageNoteAr: "النموذج الرسمي الذي تربط إليه صفحة telc الحالية؛ استُعمل لتوثيق أنواع المهام والنقاط دون نسخ التعبير المحمي.",
  },
];

export const examProfiles: Record<ExamProfile["id"], ExamProfile> = {
  "goethe-b2": {
    id: "goethe-b2",
    displayName: "Goethe-Zertifikat B2",
    specificationVersion: "Goethe B2 terms 2025-09 + adult model set 2025-08",
    verifiedAt: "2026-08-28",
    status: "verified",
    modules: [
      { id: "lesen", titleDe: "Lesen", titleAr: "القراءة", parts: 5, minutes: 65, maxPoints: 100, noteAr: "30 عنصرًا وفق النموذج الرسمي الحالي؛ الوحدة مستقلة." },
      { id: "hoeren", titleDe: "Hören", titleAr: "الاستماع", parts: 4, minutes: 40, maxPoints: 100, noteAr: "المدة تقريبية وتتضمن وقت نقل الإجابات." },
      { id: "schreiben", titleDe: "Schreiben", titleAr: "الكتابة", parts: 2, minutes: 75, maxPoints: 100, noteAr: "مساهمة رأي ورسالة مهنية رسمية." },
      { id: "sprechen", titleDe: "Sprechen", titleAr: "المحادثة", parts: 2, minutes: 15, maxPoints: 100, noteAr: "عادةً ثنائي؛ 15 دقيقة تحضير منفصلة، وحوالي 10 دقائق للفردي الاستثنائي." },
    ],
    structureAr: "أربع وحدات مستقلة يمكن تقديمها منفردة أو مجتمعة: قراءة، استماع، كتابة، محادثة.",
    passingRuleAr: "الحد الرسمي الموثق هو 60 من 100 في كل وحدة. التطبيق لا يمنح نتيجة رسمية.",
    separationWarningAr: "لا تُحوّل النقاط إلى نظام telc ولا تجمع الوحدات بقواعد telc الكتابية/الشفهية.",
    sourceRefs: ["goethe-b2-overview-2026", "goethe-b2-terms-2025", "goethe-b2-model-2025"],
  },
  "telc-deutsch-b2": {
    id: "telc-deutsch-b2",
    displayName: "telc Deutsch B2",
    specificationVersion: "Current official overview checked 2026-08-28 + linked mock revised 2019",
    verifiedAt: "2026-08-28",
    status: "verified",
    modules: [
      { id: "lesen", titleDe: "Leseverstehen", titleAr: "فهم القراءة", parts: 3, minutes: 90, maxPoints: 75, noteAr: "القراءة وSprachbausteine يشتركان في كتلة 90 دقيقة بلا فاصل." },
      { id: "sprachbausteine", titleDe: "Sprachbausteine", titleAr: "العناصر اللغوية", parts: 2, minutes: 90, maxPoints: 30, noteAr: "الـ90 دقيقة مشتركة مع القراءة وليست 90 دقيقة إضافية." },
      { id: "hoeren", titleDe: "Hörverstehen", titleAr: "فهم الاستماع", parts: 3, minutes: 20, maxPoints: 75, noteAr: "حوالي 20 دقيقة." },
      { id: "schreiben", titleDe: "Schriftlicher Ausdruck", titleAr: "التعبير الكتابي", parts: 1, minutes: 30, maxPoints: 45, noteAr: "رسالة إلكترونية شبه رسمية وفق مدخل محدد." },
      { id: "sprechen", titleDe: "Mündlicher Ausdruck", titleAr: "التعبير الشفهي", parts: 3, minutes: 15, maxPoints: 75, noteAr: "عادةً ثنائي؛ 20 دقيقة تحضير. قد تمتد إلى نحو 25 دقيقة مع ثلاثة مشاركين." },
    ],
    structureAr: "قسم كتابي: قراءة وعناصر لغوية واستماع وكتابة؛ وقسم شفهي من ثلاثة أجزاء.",
    passingRuleAr: "وفق النموذج الرسمي المرتبط حاليًا: 225 نقطة للكتابي و75 للشفهي؛ يلزم 135 كتابيًا و45 شفهيًا. التطبيق لا يمنح نتيجة رسمية.",
    separationWarningAr: "لا تطبق قاعدة 60/100 لكل وحدة الخاصة بـGoethe؛ telc يفصل مجموع الكتابي عن مجموع الشفهي.",
    sourceRefs: ["telc-b2-overview-2026", "telc-b2-mock-2019-current-link"],
  },
};

export const examSourceById = Object.fromEntries(examSources.map((source) => [source.id, source])) as Record<string, ExamSourceReference>;
