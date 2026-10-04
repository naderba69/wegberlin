import Link from "next/link";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";

/**
 * صفحة 404 عربية. قبلها كان الرابط المكسور (مثل /lernen أو /assessment أو بتر رابط درس)
 * يعرض هيكل التطبيق مع 404 إنجليزية مجرّدة، فيظنّ المتعلّم أنّ المنصة تعطّلت.
 * لا نعرض بيانات متعلّم هنا ولا ننشئ تقدّمًا؛ الصفحة تنقل فقط.
 */
export default function NotFound() {
  return <section className="not-found-page">
    <span className="eyebrow"><Compass size={15} /> الرابط غير موجود</span>
    <h1>هذا العنوان ليس في المنصة.</h1>
    <p>
      لم نجد الصفحة التي طلبتها: قد يكون الرابط قديمًا أو ناقصًا. لم يتغيّر تقدّمك ولم يُحذف شيء؛
      بياناتك محفوظة محليًا في هذا الجهاز.
    </p>
    <div className="not-found-actions">
      <Link className="primary-button" href="/today"><Home size={17} /> العودة إلى مهمة اليوم</Link>
      <Link className="secondary-button" href="/path"><Compass size={17} /> مسار التعلّم</Link>
      <Link className="secondary-button" href="/search"><Search size={17} /> البحث في المنهج</Link>
    </div>
    <p className="not-found-note">
      إن كنت تبحث عن درس، فكل الدروس تُفتح من «مسار التعلّم» أو من بطاقة اليوم، وليست لها صفحة فهرس عامة.
    </p>
  </section>;
}
