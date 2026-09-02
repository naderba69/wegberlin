import { ModuleReview } from "@/components/module-review";
import { b2Module6Lessons } from "@/data/lessons-b2-module6";

export default function B2ModuleSixReviewPage() {
  return (
    <ModuleReview
      moduleId="B2.6"
      titleAr="الإنتاج والبروفة النهائية"
      titleDe="B2-Prüfungsreife"
      lessons={b2Module6Lessons}
      projectTitle="نفّذ بروفة B2 داخلية وابنِ خطة أدلة"
      projectCopy="فك أفعال المهمة، أنجز كتابة وعرضًا تحت الوقت، ادمج دليل القراءة واعتراض الاستماع، ثم سجل الفجوة وسببها وتمرينًا لاحقًا. البروفة محايدة ولا تخلط صيغ Goethe وtelc الرسمية."
    />
  );
}
