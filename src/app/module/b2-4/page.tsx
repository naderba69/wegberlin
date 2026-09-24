import { ModuleReview } from "@/components/module-review";
import { b2Module4Lessons } from "@/data/lessons-b2-module4";

export default function B2ModuleFourReviewPage() {
  return (
    <ModuleReview
      moduleId="B2.4"
      titleAr="المشاركة ونقد الإعلام"
      titleDe="Gesellschaft im Diskurs"
      lessons={b2Module4Lessons}
      projectTitle="صمم مشاركة عادلة ودقّق روايتها الإعلامية"
      projectCopy="حلل الفئات المتأثرة والعوائق ودرجات التأثير، صمم آليات وصول ورد معلل، ثم افحص تقريرًا عن العملية عبر المصدر الأولي وما قيس والتأطير والمصلحة والتصحيح دون اتهام أو تبنٍ غير مبرر."
    />
  );
}
