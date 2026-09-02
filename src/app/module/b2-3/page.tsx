import { ModuleReview } from "@/components/module-review";
import { b2Module3Lessons } from "@/data/lessons-b2-module3";

export default function B2ModuleThreeReviewPage() {
  return (
    <ModuleReview
      moduleId="B2.3"
      titleAr="فهم البيانات وتبسيط المعرفة"
      titleDe="Wissen und Forschung"
      lessons={b2Module3Lessons}
      projectTitle="حلل نتيجة بحثية واشرحها لجمهور عام"
      projectCopy="افصل التغير المطلق من النسبي والارتباط من السببية، قيّد الاستنتاج بالعينة والتوزيع، ثم حوّل المصطلح والطريقة والنتيجة والحدود إلى شرح واضح لا يزوّر درجة اليقين."
    />
  );
}
