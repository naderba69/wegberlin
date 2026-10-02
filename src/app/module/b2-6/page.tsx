import { ModuleReview } from "@/components/module-review";
import { academicLessonList } from "@/data/academic-lessons";
import { moduleTitles } from "@/data/curriculum";

export default function B2ModuleReviewPage(){const moduleMeta=moduleTitles.B2[5];const lessons=academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===6);return <ModuleReview moduleId="B2.6" titleAr={moduleMeta.titleAr} titleDe={moduleMeta.titleDe} lessons={lessons} projectTitle="انقل تقريرًا كثيفًا إلى رسالة واضحة" projectCopy="انسب الكلام إلى صاحبه، فك الصفات والمركبات والإضافات الطويلة، واضبط الترقيم. راجع ما تغير من المعنى قبل جمع ملف الأدلة النهائي."/>}
