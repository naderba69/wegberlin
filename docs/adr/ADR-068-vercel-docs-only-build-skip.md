# ADR-068 — تخطي Vercel للتوثيق فقط يكون ضيقًا وFail-open

**الحالة:** مقبول ومطبق  
**التاريخ:** 2026-09-12  
**السياسة:** `vercel-docs-only-build-skip-v1`

## القرار

يربط `vercel.json` الحقل `ignoreCommand` بالسكربت المستقل `scripts/vercel-ignore-docs-only.mjs`. في Vercel يعني Exit 0 تجاهل Build وExit 1 متابعة Build.

لا يُتخطى Build إلا إذا كانت كل الملفات المتغيرة:

- Markdown في جذر المشروع مثل README وDECISIONS.
- أو Markdown مؤلفًا داخل `docs/`.

يستمر Build لأي تغيير في `src/`, `public/`, `scripts/`, `tests/`, package files, workflows, Vercel config أو `docs/generated/`. كما يستمر عند Diff فارغ أو Git غير متاح أو Timeout أو مسار مطلق/Traversal/Backslash. هذه سياسة fail-open: الخطأ يستهلك Build لكنه لا يخفي تغيير Runtime.

يستعمل السكربت SHA الحالي والسابق من Vercel عند توفرهما، وإلا يحاول `HEAD^..HEAD`. يبقى `main` مفعّلًا في إعداد Vercel؛ السياسة لا تعطل النشر العام ولا تدعي تعديل إعدادات المشروع البعيدة قبل رفعها.

ستة اختبارات تغطي Markdown المسموح، كل عائلات Runtime الحساسة، التقارير المولدة، Diff الفارغ، المسارات الخطرة، وربط Vercel مع fail-open. لا يغير هذا مسار التعلم أو Offline أو بيانات المتعلم.
