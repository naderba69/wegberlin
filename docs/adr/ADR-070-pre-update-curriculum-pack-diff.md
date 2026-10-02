# ADR-070 — مقارنة الحزمة تسبق التثبيت

Policy: `pre-update-curriculum-pack-diff-v2` · 2026-09-12.

Version 2 treats a completed legacy pack without `curriculumVersion` as `unknown-installed-curriculum` and a curriculum change, rather than reassuring the learner that it is only a build update.

قبل تنزيل Offline تعرض الواجهة Metadata المثبتة مقابل المرشحة: curriculumVersion وBuild fingerprint ونطاق الحزمة وعدد المسارات وDelta والصوت. تميز أول تثبيت وBuild ضمن المنهج نفسه وتغيير النطاق وتغيير نسخة المنهج. Worker يحفظ curriculumVersion في metadata. المقارنة لا تدعي Diff دلالية للمحتوى، ولا تغير التقدم، ولا تثبت تلقائيًا. خمسة اختبارات وحدة وPlaywright Offline مستهدف يغطيان العقد.
