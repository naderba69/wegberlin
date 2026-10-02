import { ModuleReview } from "@/components/module-review";
import { b2Module5Lessons } from "@/data/lessons-b2-module5";

export default function B2ModuleFiveReviewPage() {
  return (
    <ModuleReview
      moduleId="B2.5"
      titleAr="المنظورات والوساطة الدقيقة"
      titleDe="Kultur und Identität"
      lessons={b2Module5Lessons}
      projectTitle="قارن منظورين وانقل النتيجة إلى جمهور جديد"
      projectCopy="افصل الملاحظة من التفسير والتقييم، اربط المنظورات بالسياق دون تنميط، ثم أعد بناء المعلومات لجمهور عربي مع حفظ الإلزام والشرط والاستثناء وعدم اليقين وتمييز إضافتك من كلام المصدر."
    />
  );
}
