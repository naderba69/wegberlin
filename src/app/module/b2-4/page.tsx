import { ModuleReview } from "@/components/module-review";
import { academicLessonList } from "@/data/academic-lessons";
import { moduleTitles } from "@/data/curriculum";

export default function B2ModuleReviewPage(){const moduleMeta=moduleTitles.B2[3];const lessons=academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===4);return <ModuleReview moduleId="B2.4" titleAr={moduleMeta.titleAr} titleDe={moduleMeta.titleDe} lessons={lessons} projectTitle="راجع موقفك ونظّم النص أمام اعتراض جديد" projectCopy="أعد صياغة موقف بعد دليل مخالف، حافظ على الإحالات وخيط النص، وفسّر قرارًا سابقًا دون اتهام أو يقين غير مسند."/>}
