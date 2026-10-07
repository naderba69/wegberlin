import type { Metadata } from "next";
import { LocalTestGenerator } from "@/components/local-test-generator";

export const metadata: Metadata = {
  title: "اختبار تدريبي محلي من أسئلة الدروس",
  description: "أنشئ عينة تدريبية محلية من اختبارات الدروس المنشورة، دون حفظ النتيجة أو تغيير التقدم.",
};

export default function LocalTestGeneratorPage() {
  return <LocalTestGenerator />;
}
