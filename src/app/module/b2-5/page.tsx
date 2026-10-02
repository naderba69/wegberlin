import { ModuleReview } from "@/components/module-review";
import { academicLessonList } from "@/data/academic-lessons";
import { moduleTitles } from "@/data/curriculum";

export default function B2ModuleReviewPage(){const moduleMeta=moduleTitles.B2[4];const lessons=academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===5);return <ModuleReview moduleId="B2.5" titleAr={moduleMeta.titleAr} titleDe={moduleMeta.titleDe} lessons={lessons} projectTitle="صغ طلبًا رسميًا وحدّد الأدوار والعلاقات" projectCopy="استخدم بدائل المبني للمجهول والتراكيب الوظيفية والروابط الثنائية عندما تخدم المقصد، واذكر المسؤول والمهلة دون اختلاق قانون أو مطلب سريري."/>}
