import { ModuleReview } from "@/components/module-review";
import { academicLessonList } from "@/data/academic-lessons";
import { moduleTitles } from "@/data/curriculum";

export default function B2ModuleReviewPage(){const moduleMeta=moduleTitles.B2[1];const lessons=academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===2);return <ModuleReview moduleId="B2.2" titleAr={moduleMeta.titleAr} titleDe={moduleMeta.titleDe} lessons={lessons} projectTitle="فسّر بيانات وقارن مصادر دون تضخيم الادعاء" projectCopy="افصل الملاحظة عن السبب، وانسب الادعاءات إلى مصادرها، ثم اكتب ملخصًا يذكر الحدود وما يحتاج إلى معلومات إضافية."/>}
