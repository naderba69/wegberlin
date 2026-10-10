export const ILLUSTRATIVE_PATHWAYS_POLICY_VERSION = "illustrative-learning-pathways-v1" as const;
export const ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS = "authored-hypothetical-guidance-only" as const;

export type IllustrativePathwayStep = Readonly<{
  titleAr: string;
  detailAr: string;
  href: `/${string}`;
  linkLabelAr: string;
}>;

export type IllustrativeLearningPathway = Readonly<{
  id: string;
  titleAr: string;
  situationAr: string;
  steps: readonly [IllustrativePathwayStep, IllustrativePathwayStep, IllustrativePathwayStep];
  reflectionPromptAr: string;
  boundaryAr: string;
  evidenceStatus: typeof ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS;
  outcomeClaim: false;
}>;

export const ILLUSTRATIVE_PATHWAYS_NOTICE_AR =
  "هذه حالات افتراضية مؤلَّفة لتوضيح استخدام أدوات موجودة؛ ليست شهادات متعلمين أو بيانات تجربة، ولا تعرض نتائج مقاسة أو مدة للوصول إلى مستوى أو اجتياز امتحان.";

export const illustrativeLearningPathways = [
  {
    id: "practical-situation",
    titleAr: "أحتاج إلى التعامل مع موقف يومي",
    situationAr:
      "افترض أنك تريد الاستعداد لغويًا لمحادثة عن السكن أو العمل أو إجراء إداري، لكنك لا تعرف من أين تبدأ.",
    steps: [
      {
        titleAr: "اختر موقفًا واحدًا",
        detailAr:
          "في اليوم العملي اختر الموضوع الأقرب إلى حاجتك. استخدمه كتدريب لغوي، لا بوصفه إرشادًا قانونيًا أو بديلًا عن تعليمات الجهة.",
        href: "/practice/practical-day",
        linkLabelAr: "افتح اليوم العملي",
      },
      {
        titleAr: "حدّد كلمة أو تركيبًا",
        detailAr:
          "ابحث عن عبارة محددة أوقفت فهمك، ثم اقرأها في سياقها بدل حفظ قائمة طويلة.",
        href: "/search",
        linkLabelAr: "افتح البحث الألماني–العربي",
      },
      {
        titleAr: "ارجع إلى مهمتك الفعلية",
        detailAr:
          "افتح مهمة اليوم واتبع الخطوة المقترحة لملفك وأدلتك؛ تصفح هذا المثال لا يغيّر خطتك.",
        href: "/today",
        linkLabelAr: "افتح مهمتي اليوم",
      },
    ],
    reflectionPromptAr: "ما السؤال اللغوي الذي تريد أن تصبح أقدر على طرحه في هذا الموقف؟",
    boundaryAr:
      "اختيار هذه الخطوات لا يثبت الجاهزية لإجراء رسمي؛ تحقّق دائمًا من تعليمات الجهة المختصة.",
    evidenceStatus: ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS,
    outcomeClaim: false,
  },
  {
    id: "changing-availability",
    titleAr: "وقتي أو طاقتي يتغيران",
    situationAr:
      "افترض أن جدولك مزدحم أو أنك تعود بعد انقطاع، وتريد اختيار خطوة ممكنة دون تحويل الأيام الفائتة إلى دين.",
    steps: [
      {
        titleAr: "ثبّت ما يناسب اليوم",
        detailAr:
          "حدّد الوقت والطاقة المتاحين الآن في مهمتي اليوم. هذا يساعد في التخطيط ولا يُعدّ بحد ذاته دليل دراسة.",
        href: "/today",
        linkLabelAr: "افتح مهمتي اليوم",
      },
      {
        titleAr: "راجع عند وجود عنصر مستحق",
        detailAr:
          "إذا عرض التطبيق مراجعة مستحقة، اختر ما تستطيع إنجازه. لا يلزم إنهاء كل القائمة كي تعود إلى المسار.",
        href: "/review",
        linkLabelAr: "افتح المراجعة",
      },
      {
        titleAr: "افحص ما اخترت حفظه",
        detailAr:
          "استخدم صفحة التقدم لمراجعة السجل المحلي، لا لاستنتاج مستوى أو مقارنة نفسك بمتعلم آخر.",
        href: "/progress",
        linkLabelAr: "افتح تقدّمي",
      },
    ],
    reflectionPromptAr: "ما الخطوة الصغيرة التي تناسب ظروفك الآن، وما الذي يمكن تأجيله بلا ضغط؟",
    boundaryAr:
      "هذا المثال لا يَعِد باستمرارية أو تحسن، ولا يحوّل التهيئة أو التصفح إلى إنجاز تعلّم.",
    evidenceStatus: ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS,
    outcomeClaim: false,
  },
  {
    id: "practice-without-level-claim",
    titleAr: "أريد التدرّب دون خلطه بحكم المستوى",
    situationAr:
      "افترض أنك تريد عينة تدريب إضافية من مادة الدروس المنشورة، مع إبقاء نتيجتها منفصلة عن الجاهزية الرسمية.",
    steps: [
      {
        titleAr: "أنشئ عينة اختيارية",
        detailAr:
          "اختر المستوى وعدد الأسئلة بنفسك في المولّد؛ الأسئلة مأخوذة من اختبارات مصغّرة في الدروس المنشورة.",
        href: "/practice/test-generator",
        linkLabelAr: "افتح مولّد الاختبارات المحلية",
      },
      {
        titleAr: "عد إلى المصدر عند الحاجة",
        detailAr:
          "إذا أربكك عنصر، راجعه في درسِه أو في قائمة المراجعة إن كان مستحقًا بدل تكرار العينة فقط.",
        href: "/review",
        linkLabelAr: "افتح المراجعة",
      },
      {
        titleAr: "افصل التدريب عن الحكم",
        detailAr:
          "راجع الأدلة التي اختير حفظها في صفحة التقدم؛ نتيجة العينة لا تتحول إلى تقدير CEFR.",
        href: "/progress",
        linkLabelAr: "افتح تقدّمي",
      },
    ],
    reflectionPromptAr: "أي نوع من الأسئلة تريد مراجعته في مصدره قبل أن تختار التدريب التالي؟",
    boundaryAr:
      "العينة تدريب فقط؛ ليست درجة CEFR أو نتيجة امتحان رسمية أو توقعًا باجتيازه.",
    evidenceStatus: ILLUSTRATIVE_PATHWAYS_EVIDENCE_STATUS,
    outcomeClaim: false,
  },
] as const satisfies readonly IllustrativeLearningPathway[];
