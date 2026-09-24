import type { FullExamSimulation } from "@/types/exam";

export const fullExamSimulations: FullExamSimulation[] = [
  {
    id: "goethe-b2-full-01",
    provider: "goethe-b2",
    titleDe: "Vollsimulation 1 · Stadt, Arbeit und Teilhabe",
    titleAr: "المحاكاة الكاملة الأولى — المدينة والعمل والمشاركة",
    descriptionAr: "حزمة أصلية تغطي الوحدات الأربع لـGoethe B2 بأجزاء القراءة الخمسة والاستماع الأربعة والكتابة والمحادثة. تنظمها المنصة بوصفها جلسة موجهة بمؤقت مستقل لكل جزء.",
    modules: [
      {
        id: "goethe-full-01-reading",
        titleDe: "Lesen",
        titleAr: "القراءة",
        officialMinutes: 65,
        taskIds: [
          "goethe-b2-reading-01",
          "goethe-b2-reading-02",
          "goethe-b2-reading-03",
          "goethe-b2-reading-04",
          "goethe-b2-full-01-reading-05",
        ],
        resultRuleAr: "خمسة أجزاء و30 عنصرًا. نتيجة التطبيق تدريبية؛ الحد الرسمي للوحدة منفصل ولا يُدمج مع telc.",
      },
      {
        id: "goethe-full-01-listening",
        titleDe: "Hören",
        titleAr: "الاستماع",
        officialMinutes: 40,
        taskIds: [
          "goethe-b2-listening-01",
          "goethe-b2-listening-02",
          "goethe-b2-listening-03",
          "goethe-b2-listening-04",
        ],
        resultRuleAr: "أربعة أجزاء و30 عنصرًا؛ الصوت الحالي Browser TTS، لذلك لا يُعرض الأداء كدرجة امتحانية رسمية.",
      },
      {
        id: "goethe-full-01-writing",
        titleDe: "Schreiben",
        titleAr: "الكتابة",
        officialMinutes: 75,
        taskIds: ["goethe-b2-writing-01", "goethe-b2-writing-02"],
        resultRuleAr: "مهمة رأي ورسالة مهنية. الحفظ والفحص محليان ولا يحلان محل تقييم مصححين رسميين.",
      },
      {
        id: "goethe-full-01-speaking",
        titleDe: "Sprechen",
        titleAr: "المحادثة",
        officialMinutes: 15,
        taskIds: ["goethe-b2-speaking-01", "goethe-b2-speaking-02"],
        resultRuleAr: "عرض ونقاش؛ التسجيل الفردي يوثق الإنتاج لكنه لا يثبت تفاعل امتحان ثنائي حي.",
      },
    ],
    sourceRefs: ["goethe-b2-overview-2026", "goethe-b2-terms-2025", "goethe-b2-model-2025"],
    contentStatus: "published",
    originalContent: true,
    sessionMode: "guided-module-timers",
    limitationsAr: [
      "المؤقت يطبق داخل كل مهمة؛ الانتقال بين الصفحات قابل للاستئناف ولا يفرض جلسة واحدة غير قابلة للتوقف.",
      "الاستماع يستخدم Browser TTS ولا يمثل تنوع الصوت البشري في الامتحان.",
      "المحادثة تسجل طرفًا واحدًا ولا تحاكي شريكًا حيًا.",
      "الكتابة والمحادثة لا تحصلان على درجة رسمية آلية.",
    ],
  },
  {
    id: "telc-b2-full-01",
    provider: "telc-deutsch-b2",
    titleDe: "Vollsimulation 1 · Alltag, Service und Zusammenarbeit",
    titleAr: "المحاكاة الكاملة الأولى — الحياة والخدمات والتعاون",
    descriptionAr: "حزمة أصلية تغطي القسم الكتابي والشفهي لـtelc Deutsch B2: القراءة والعناصر اللغوية والاستماع والرسالة والأجزاء الشفهية الثلاثة، دون استعمال قواعد Goethe.",
    modules: [
      {
        id: "telc-full-01-reading-language",
        titleDe: "Leseverstehen und Sprachbausteine",
        titleAr: "القراءة والعناصر اللغوية",
        officialMinutes: 90,
        taskIds: [
          "telc-b2-reading-01",
          "telc-b2-reading-02",
          "telc-b2-reading-03",
          "telc-b2-language-01",
          "telc-b2-language-02",
        ],
        resultRuleAr: "ثلاثة أجزاء قراءة وجزآن لغويان ضمن 90 دقيقة مشتركة؛ لا تُحسب 90 دقيقة لكل جزء.",
      },
      {
        id: "telc-full-01-listening",
        titleDe: "Hörverstehen",
        titleAr: "فهم الاستماع",
        officialMinutes: 20,
        taskIds: ["telc-b2-listening-01", "telc-b2-listening-02", "telc-b2-listening-03"],
        resultRuleAr: "ثلاثة أجزاء و20 عنصرًا؛ Browser TTS يمنع الادعاء بأنها درجة استماع رسمية.",
      },
      {
        id: "telc-full-01-writing",
        titleDe: "Schriftlicher Ausdruck",
        titleAr: "التعبير الكتابي",
        officialMinutes: 30,
        taskIds: ["telc-b2-writing-01"],
        resultRuleAr: "رسالة شبه رسمية من اختيارين؛ لا تطبق معايير أو نقاط Goethe عليها.",
      },
      {
        id: "telc-full-01-speaking",
        titleDe: "Mündlicher Ausdruck",
        titleAr: "التعبير الشفهي",
        officialMinutes: 15,
        taskIds: ["telc-b2-speaking-01", "telc-b2-speaking-02", "telc-b2-speaking-03"],
        resultRuleAr: "خبرة ونقاش وتخطيط؛ 20 دقيقة التحضير تخص الجزأين 2 و3، والتسجيل الفردي لا يثبت التفاعل الثنائي.",
      },
    ],
    sourceRefs: ["telc-b2-overview-2026", "telc-b2-mock-2019-current-link"],
    contentStatus: "published",
    originalContent: true,
    sessionMode: "guided-module-timers",
    limitationsAr: [
      "المحاكاة تستخدم تنقلًا موجهًا بين المهام مع حفظ محلي، وليست جلسة مراقبة رسمية.",
      "الاستماع يستخدم Browser TTS بدل تسجيلات بشرية متعددة.",
      "المحادثة تدرب مساهمة طرف واحد ولا تحاكي تفاوضًا حيًا كاملًا.",
      "لا تُستخرج نتيجة telc رسمية من الفحوص الحتمية أو التقييم الذاتي.",
    ],
  },
  {
    id: "goethe-b2-full-02",
    provider: "goethe-b2",
    titleDe: "Vollsimulation 2 · Lernen, Zugang und Alltag",
    titleAr: "المحاكاة الكاملة الثانية — التعلم والوصول والحياة اليومية",
    descriptionAr: "مجموعة مستقلة بالكامل عن المحاكاة الأولى، تضم خمسة أجزاء قراءة وأربعة استماع ومهمتي كتابة ومهمتي محادثة.",
    modules: [
      { id: "goethe-full-02-reading", titleDe: "Lesen", titleAr: "القراءة", officialMinutes: 65, taskIds: ["goethe-b2-full-02-reading-01", "goethe-b2-full-02-reading-02", "goethe-b2-full-02-reading-03", "goethe-b2-full-02-reading-04", "goethe-b2-full-02-reading-05"], resultRuleAr: "خمسة أجزاء جديدة و30 عنصرًا؛ نتيجة تدريبية داخلية." },
      { id: "goethe-full-02-listening", titleDe: "Hören", titleAr: "الاستماع", officialMinutes: 40, taskIds: ["goethe-b2-full-02-listening-01", "goethe-b2-full-02-listening-02", "goethe-b2-full-02-listening-03", "goethe-b2-full-02-listening-04"], resultRuleAr: "أربعة أجزاء و30 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS." },
      { id: "goethe-full-02-writing", titleDe: "Schreiben", titleAr: "الكتابة", officialMinutes: 75, taskIds: ["goethe-b2-full-02-writing-01", "goethe-b2-full-02-writing-02"], resultRuleAr: "مساهمة منتدى ورسالة مهنية جديدتان دون درجة رسمية آلية." },
      { id: "goethe-full-02-speaking", titleDe: "Sprechen", titleAr: "المحادثة", officialMinutes: 15, taskIds: ["goethe-b2-full-02-speaking-01", "goethe-b2-full-02-speaking-02"], resultRuleAr: "عرض ونقاش جديدان بتسجيل فردي محلي." },
    ],
    sourceRefs: ["goethe-b2-overview-2026", "goethe-b2-terms-2025", "goethe-b2-model-2025"],
    contentStatus: "published",
    originalContent: true,
    sessionMode: "guided-module-timers",
    limitationsAr: ["المؤقتات لكل مهمة مع استئناف محلي بين الصفحات.", "ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.", "التسجيل الفردي لا يثبت تفاعل الشريك.", "لا توجد درجة رسمية آلية للكتابة أو المحادثة."],
  },
  {
    id: "telc-b2-full-02",
    provider: "telc-deutsch-b2",
    titleDe: "Vollsimulation 2 · Bildung, Mobilität und Service",
    titleAr: "المحاكاة الكاملة الثانية — التعليم والتنقل والخدمات",
    descriptionAr: "مجموعة telc مستقلة جديدة تغطي ثلاثة أجزاء قراءة وجزأي العناصر اللغوية وثلاثة استماع وكتابة والأجزاء الشفهية الثلاثة.",
    modules: [
      { id: "telc-full-02-reading-language", titleDe: "Leseverstehen und Sprachbausteine", titleAr: "القراءة والعناصر اللغوية", officialMinutes: 90, taskIds: ["telc-b2-full-02-reading-01", "telc-b2-full-02-reading-02", "telc-b2-full-02-reading-03", "telc-b2-full-02-language-01", "telc-b2-full-02-language-02"], resultRuleAr: "40 عنصرًا جديدًا ضمن كتلة 90 دقيقة مشتركة." },
      { id: "telc-full-02-listening", titleDe: "Hörverstehen", titleAr: "فهم الاستماع", officialMinutes: 20, taskIds: ["telc-b2-full-02-listening-01", "telc-b2-full-02-listening-02", "telc-b2-full-02-listening-03"], resultRuleAr: "ثلاثة أجزاء و20 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS." },
      { id: "telc-full-02-writing", titleDe: "Schriftlicher Ausdruck", titleAr: "التعبير الكتابي", officialMinutes: 30, taskIds: ["telc-b2-full-02-writing-01"], resultRuleAr: "اختيار جديد بين رسالتين شبه رسميتين." },
      { id: "telc-full-02-speaking", titleDe: "Mündlicher Ausdruck", titleAr: "التعبير الشفهي", officialMinutes: 15, taskIds: ["telc-b2-full-02-speaking-01", "telc-b2-full-02-speaking-02", "telc-b2-full-02-speaking-03"], resultRuleAr: "خبرة ونقاش وتخطيط جديدة مع تسجيل فردي." },
    ],
    sourceRefs: ["telc-b2-overview-2026", "telc-b2-mock-2019-current-link"],
    contentStatus: "published",
    originalContent: true,
    sessionMode: "guided-module-timers",
    limitationsAr: ["التنقل موجه وقابل للاستئناف، لا جلسة مراقبة واحدة.", "ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.", "التفاعل الشفهي فردي تدريبي.", "لا تُحسب نتيجة telc رسمية."],
  },
  {
    id: "goethe-b2-full-03", provider: "goethe-b2", titleDe: "Vollsimulation 3 · Alltag, Lernen und Infrastruktur", titleAr: "المحاكاة الكاملة الثالثة — الحياة والتعلم والبنية", descriptionAr: "مجموعة ثالثة مستقلة من 13 مهمة جديدة تحافظ على أجزاء Goethe دون مشاركة مهام مع المحاكاتين السابقتين.",
    modules: [
      { id: "goethe-full-03-reading", titleDe: "Lesen", titleAr: "القراءة", officialMinutes: 65, taskIds: ["goethe-b2-full-03-reading-01","goethe-b2-full-03-reading-02","goethe-b2-full-03-reading-03","goethe-b2-full-03-reading-04","goethe-b2-full-03-reading-05"], resultRuleAr: "خمسة أجزاء و30 عنصرًا جديدًا." },
      { id: "goethe-full-03-listening", titleDe: "Hören", titleAr: "الاستماع", officialMinutes: 40, taskIds: ["goethe-b2-full-03-listening-01","goethe-b2-full-03-listening-02","goethe-b2-full-03-listening-03","goethe-b2-full-03-listening-04"], resultRuleAr: "أربعة أجزاء و30 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS." },
      { id: "goethe-full-03-writing", titleDe: "Schreiben", titleAr: "الكتابة", officialMinutes: 75, taskIds: ["goethe-b2-full-03-writing-01","goethe-b2-full-03-writing-02"], resultRuleAr: "مهمتا كتابة جديدتان دون درجة رسمية آلية." },
      { id: "goethe-full-03-speaking", titleDe: "Sprechen", titleAr: "المحادثة", officialMinutes: 15, taskIds: ["goethe-b2-full-03-speaking-01","goethe-b2-full-03-speaking-02"], resultRuleAr: "عرض ونقاش جديدان بتسجيل فردي." },
    ], sourceRefs: ["goethe-b2-overview-2026","goethe-b2-terms-2025","goethe-b2-model-2025"], contentStatus: "published", originalContent: true, sessionMode: "guided-module-timers", limitationsAr: ["مؤقتات مهام مع استئناف محلي.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","المحادثة الفردية لا تثبت تفاعل الشريك.","لا درجة رسمية للإنتاج."],
  },
  {
    id: "telc-b2-full-03", provider: "telc-deutsch-b2", titleDe: "Vollsimulation 3 · Quartier, Bildung und Arbeit", titleAr: "المحاكاة الكاملة الثالثة — الحي والتعليم والعمل", descriptionAr: "مجموعة telc ثالثة مستقلة من 12 مهمة جديدة تغطي القراءة واللغة والاستماع والكتابة والمحادثة.",
    modules: [
      { id: "telc-full-03-reading-language", titleDe: "Leseverstehen und Sprachbausteine", titleAr: "القراءة والعناصر اللغوية", officialMinutes: 90, taskIds: ["telc-b2-full-03-reading-01","telc-b2-full-03-reading-02","telc-b2-full-03-reading-03","telc-b2-full-03-language-01","telc-b2-full-03-language-02"], resultRuleAr: "40 عنصرًا جديدًا ضمن 90 دقيقة مشتركة." },
      { id: "telc-full-03-listening", titleDe: "Hörverstehen", titleAr: "الاستماع", officialMinutes: 20, taskIds: ["telc-b2-full-03-listening-01","telc-b2-full-03-listening-02","telc-b2-full-03-listening-03"], resultRuleAr: "ثلاثة أجزاء و20 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS." },
      { id: "telc-full-03-writing", titleDe: "Schriftlicher Ausdruck", titleAr: "الكتابة", officialMinutes: 30, taskIds: ["telc-b2-full-03-writing-01"], resultRuleAr: "اختيار من رسالتين جديدتين." },
      { id: "telc-full-03-speaking", titleDe: "Mündlicher Ausdruck", titleAr: "المحادثة", officialMinutes: 15, taskIds: ["telc-b2-full-03-speaking-01","telc-b2-full-03-speaking-02","telc-b2-full-03-speaking-03"], resultRuleAr: "خبرة ونقاش وتخطيط جديدة." },
    ], sourceRefs: ["telc-b2-overview-2026","telc-b2-mock-2019-current-link"], contentStatus: "published", originalContent: true, sessionMode: "guided-module-timers", limitationsAr: ["جلسة موجهة قابلة للاستئناف.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","تفاعل فردي غير رسمي.","لا نتيجة telc رسمية."],
  },
  {
    id:"goethe-b2-full-04",provider:"goethe-b2",titleDe:"Vollsimulation 4 · Medien, Ressourcen und Stadt",titleAr:"المحاكاة الكاملة الرابعة — الإعلام والموارد والمدينة",descriptionAr:"مجموعة Goethe رابعة مستقلة من 13 مهمة جديدة.",
    modules:[
      {id:"goethe-full-04-reading",titleDe:"Lesen",titleAr:"القراءة",officialMinutes:65,taskIds:["goethe-b2-full-04-reading-01","goethe-b2-full-04-reading-02","goethe-b2-full-04-reading-03","goethe-b2-full-04-reading-04","goethe-b2-full-04-reading-05"],resultRuleAr:"خمسة أجزاء و30 عنصرًا جديدًا."},
      {id:"goethe-full-04-listening",titleDe:"Hören",titleAr:"الاستماع",officialMinutes:40,taskIds:["goethe-b2-full-04-listening-01","goethe-b2-full-04-listening-02","goethe-b2-full-04-listening-03","goethe-b2-full-04-listening-04"],resultRuleAr:"أربعة أجزاء و30 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS."},
      {id:"goethe-full-04-writing",titleDe:"Schreiben",titleAr:"الكتابة",officialMinutes:75,taskIds:["goethe-b2-full-04-writing-01","goethe-b2-full-04-writing-02"],resultRuleAr:"مهمتا كتابة جديدتان."},
      {id:"goethe-full-04-speaking",titleDe:"Sprechen",titleAr:"المحادثة",officialMinutes:15,taskIds:["goethe-b2-full-04-speaking-01","goethe-b2-full-04-speaking-02"],resultRuleAr:"عرض ونقاش جديدان بتسجيل فردي."}
    ],sourceRefs:["goethe-b2-overview-2026","goethe-b2-terms-2025","goethe-b2-model-2025"],contentStatus:"published",originalContent:true,sessionMode:"guided-module-timers",limitationsAr:["استئناف محلي.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","لا شريك حي.","لا درجة إنتاج رسمية."]
  },
  {
    id:"telc-b2-full-04",provider:"telc-deutsch-b2",titleDe:"Vollsimulation 4 · Kultur, Zugang und Umwelt",titleAr:"المحاكاة الكاملة الرابعة — الثقافة والوصول والبيئة",descriptionAr:"مجموعة telc رابعة مستقلة من 12 مهمة جديدة.",
    modules:[
      {id:"telc-full-04-reading-language",titleDe:"Leseverstehen und Sprachbausteine",titleAr:"القراءة والعناصر اللغوية",officialMinutes:90,taskIds:["telc-b2-full-04-reading-01","telc-b2-full-04-reading-02","telc-b2-full-04-reading-03","telc-b2-full-04-language-01","telc-b2-full-04-language-02"],resultRuleAr:"40 عنصرًا جديدًا ضمن 90 دقيقة مشتركة."},
      {id:"telc-full-04-listening",titleDe:"Hörverstehen",titleAr:"الاستماع",officialMinutes:20,taskIds:["telc-b2-full-04-listening-01","telc-b2-full-04-listening-02","telc-b2-full-04-listening-03"],resultRuleAr:"ثلاثة أجزاء و20 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS."},
      {id:"telc-full-04-writing",titleDe:"Schriftlicher Ausdruck",titleAr:"الكتابة",officialMinutes:30,taskIds:["telc-b2-full-04-writing-01"],resultRuleAr:"اختيار من مهمتين جديدتين."},
      {id:"telc-full-04-speaking",titleDe:"Mündlicher Ausdruck",titleAr:"المحادثة",officialMinutes:15,taskIds:["telc-b2-full-04-speaking-01","telc-b2-full-04-speaking-02","telc-b2-full-04-speaking-03"],resultRuleAr:"خبرة ونقاش وتخطيط جديدة."}
    ],sourceRefs:["telc-b2-overview-2026","telc-b2-mock-2019-current-link"],contentStatus:"published",originalContent:true,sessionMode:"guided-module-timers",limitationsAr:["جلسة موجهة.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","تفاعل فردي.","لا نتيجة رسمية."]
  },
  {
    id:"goethe-b2-full-05",provider:"goethe-b2",titleDe:"Vollsimulation 5 · Konsum, Kultur und Zugang",titleAr:"المحاكاة الخامسة — الاستهلاك والثقافة والوصول",descriptionAr:"مجموعة Goethe خامسة مستقلة من 13 مهمة.",modules:[
      {id:"goethe-full-05-reading",titleDe:"Lesen",titleAr:"القراءة",officialMinutes:65,taskIds:["goethe-b2-full-05-reading-01","goethe-b2-full-05-reading-02","goethe-b2-full-05-reading-03","goethe-b2-full-05-reading-04","goethe-b2-full-05-reading-05"],resultRuleAr:"خمسة أجزاء و30 عنصرًا."},
      {id:"goethe-full-05-listening",titleDe:"Hören",titleAr:"الاستماع",officialMinutes:40,taskIds:["goethe-b2-full-05-listening-01","goethe-b2-full-05-listening-02","goethe-b2-full-05-listening-03","goethe-b2-full-05-listening-04"],resultRuleAr:"أربعة أجزاء و30 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS."},
      {id:"goethe-full-05-writing",titleDe:"Schreiben",titleAr:"الكتابة",officialMinutes:75,taskIds:["goethe-b2-full-05-writing-01","goethe-b2-full-05-writing-02"],resultRuleAr:"مهمتا كتابة جديدتان."},
      {id:"goethe-full-05-speaking",titleDe:"Sprechen",titleAr:"المحادثة",officialMinutes:15,taskIds:["goethe-b2-full-05-speaking-01","goethe-b2-full-05-speaking-02"],resultRuleAr:"عرض ونقاش جديدان."}
    ],sourceRefs:["goethe-b2-overview-2026","goethe-b2-terms-2025","goethe-b2-model-2025"],contentStatus:"published",originalContent:true,sessionMode:"guided-module-timers",limitationsAr:["استئناف محلي.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","لا شريك حي.","لا درجة رسمية."]
  },
  {
    id:"telc-b2-full-05",provider:"telc-deutsch-b2",titleDe:"Vollsimulation 5 · Versorgung, Kultur und Alltag",titleAr:"المحاكاة الخامسة — الخدمات والثقافة والحياة",descriptionAr:"مجموعة telc خامسة مستقلة من 12 مهمة.",modules:[
      {id:"telc-full-05-reading-language",titleDe:"Leseverstehen und Sprachbausteine",titleAr:"القراءة والعناصر اللغوية",officialMinutes:90,taskIds:["telc-b2-full-05-reading-01","telc-b2-full-05-reading-02","telc-b2-full-05-reading-03","telc-b2-full-05-language-01","telc-b2-full-05-language-02"],resultRuleAr:"40 عنصرًا ضمن 90 دقيقة مشتركة."},
      {id:"telc-full-05-listening",titleDe:"Hörverstehen",titleAr:"الاستماع",officialMinutes:20,taskIds:["telc-b2-full-05-listening-01","telc-b2-full-05-listening-02","telc-b2-full-05-listening-03"],resultRuleAr:"ثلاثة أجزاء و20 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS."},
      {id:"telc-full-05-writing",titleDe:"Schriftlicher Ausdruck",titleAr:"الكتابة",officialMinutes:30,taskIds:["telc-b2-full-05-writing-01"],resultRuleAr:"اختيار من مهمتين."},
      {id:"telc-full-05-speaking",titleDe:"Mündlicher Ausdruck",titleAr:"المحادثة",officialMinutes:15,taskIds:["telc-b2-full-05-speaking-01","telc-b2-full-05-speaking-02","telc-b2-full-05-speaking-03"],resultRuleAr:"خبرة ونقاش وتخطيط."}
    ],sourceRefs:["telc-b2-overview-2026","telc-b2-mock-2019-current-link"],contentStatus:"published",originalContent:true,sessionMode:"guided-module-timers",limitationsAr:["جلسة موجهة.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","تفاعل فردي.","لا نتيجة رسمية."]
  },
  {
    id:"goethe-b2-full-06",provider:"goethe-b2",titleDe:"Vollsimulation 6 · Lernen, Technik und Teilhabe",titleAr:"المحاكاة السادسة — التعلم والتقنية والمشاركة",descriptionAr:"البنك السادس المستقل والأخير من 13 مهمة Goethe.",modules:[
      {id:"goethe-full-06-reading",titleDe:"Lesen",titleAr:"القراءة",officialMinutes:65,taskIds:["goethe-b2-full-06-reading-01","goethe-b2-full-06-reading-02","goethe-b2-full-06-reading-03","goethe-b2-full-06-reading-04","goethe-b2-full-06-reading-05"],resultRuleAr:"خمسة أجزاء و30 عنصرًا."},
      {id:"goethe-full-06-listening",titleDe:"Hören",titleAr:"الاستماع",officialMinutes:40,taskIds:["goethe-b2-full-06-listening-01","goethe-b2-full-06-listening-02","goethe-b2-full-06-listening-03","goethe-b2-full-06-listening-04"],resultRuleAr:"أربعة أجزاء و30 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS."},
      {id:"goethe-full-06-writing",titleDe:"Schreiben",titleAr:"الكتابة",officialMinutes:75,taskIds:["goethe-b2-full-06-writing-01","goethe-b2-full-06-writing-02"],resultRuleAr:"مهمتا كتابة."},
      {id:"goethe-full-06-speaking",titleDe:"Sprechen",titleAr:"المحادثة",officialMinutes:15,taskIds:["goethe-b2-full-06-speaking-01","goethe-b2-full-06-speaking-02"],resultRuleAr:"عرض ونقاش."}
    ],sourceRefs:["goethe-b2-overview-2026","goethe-b2-terms-2025","goethe-b2-model-2025"],contentStatus:"published",originalContent:true,sessionMode:"guided-module-timers",limitationsAr:["استئناف محلي.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","لا شريك حي.","لا درجة رسمية."]
  },
  {
    id:"telc-b2-full-06",provider:"telc-deutsch-b2",titleDe:"Vollsimulation 6 · Bildung, Stadt und Medien",titleAr:"المحاكاة السادسة — التعليم والمدينة والإعلام",descriptionAr:"البنك السادس المستقل والأخير من 12 مهمة telc.",modules:[
      {id:"telc-full-06-reading-language",titleDe:"Leseverstehen und Sprachbausteine",titleAr:"القراءة والعناصر اللغوية",officialMinutes:90,taskIds:["telc-b2-full-06-reading-01","telc-b2-full-06-reading-02","telc-b2-full-06-reading-03","telc-b2-full-06-language-01","telc-b2-full-06-language-02"],resultRuleAr:"40 عنصرًا ضمن 90 دقيقة مشتركة."},
      {id:"telc-full-06-listening",titleDe:"Hörverstehen",titleAr:"الاستماع",officialMinutes:20,taskIds:["telc-b2-full-06-listening-01","telc-b2-full-06-listening-02","telc-b2-full-06-listening-03"],resultRuleAr:"ثلاثة أجزاء و20 عنصرًا بملفات MP3 مولّدة مع بديل Browser TTS."},
      {id:"telc-full-06-writing",titleDe:"Schriftlicher Ausdruck",titleAr:"الكتابة",officialMinutes:30,taskIds:["telc-b2-full-06-writing-01"],resultRuleAr:"اختيار من مهمتين."},
      {id:"telc-full-06-speaking",titleDe:"Mündlicher Ausdruck",titleAr:"المحادثة",officialMinutes:15,taskIds:["telc-b2-full-06-speaking-01","telc-b2-full-06-speaking-02","telc-b2-full-06-speaking-03"],resultRuleAr:"خبرة ونقاش وتخطيط."}
    ],sourceRefs:["telc-b2-overview-2026","telc-b2-mock-2019-current-link"],contentStatus:"published",originalContent:true,sessionMode:"guided-module-timers",limitationsAr:["جلسة موجهة.","ملفات MP3 اصطناعية أحادية المتحدث وغير امتحانية، وBrowser TTS بديل.","تفاعل فردي.","لا نتيجة رسمية."]
  },
];

export const fullExamSimulationById = Object.fromEntries(
  fullExamSimulations.map((simulation) => [simulation.id, simulation]),
) as Record<string, FullExamSimulation>;
