import { ModuleReview } from "@/components/module-review";
import { academicLessonList } from "@/data/academic-lessons";
import { moduleTitles } from "@/data/curriculum";

export default function B2ModuleReviewPage(){const moduleMeta=moduleTitles.B2[2];const lessons=academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===3);return <ModuleReview moduleId="B2.3" titleAr={moduleMeta.titleAr} titleDe={moduleMeta.titleDe} lessons={lessons} projectTitle="انقل فكرة معقدة ثم أنتج تحت وقت مناسب" projectCopy="قدّم وساطة لجمهور غير متخصص، ثم اكتب وتحدث تحت قيد زمني معلن. هذه بروفة مرحلية لا إعلان جاهزية B2 النهائية."/>}
