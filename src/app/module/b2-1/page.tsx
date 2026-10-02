import { ModuleReview } from "@/components/module-review";
import { academicLessonList } from "@/data/academic-lessons";
import { moduleTitles } from "@/data/curriculum";

export default function B2ModuleReviewPage(){const moduleMeta=moduleTitles.B2[0];const lessons=academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===1);return <ModuleReview moduleId="B2.1" titleAr={moduleMeta.titleAr} titleDe={moduleMeta.titleDe} lessons={lessons} projectTitle="ناقش تغييرًا وبلّغ عنه بسجل مناسب" projectCopy="قارن موقفين حول إجراء عملي، ادمج اعتراضًا حقيقيًا، ثم اكتب رسالة مهنية بمقترح محدود وخطوة تحقق."/>}
