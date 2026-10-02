import { Languages, ShieldCheck } from "lucide-react";
import { tunisianSupportForMode } from "@/data/tunisian-support-registry";
import type { ArabicSupportMode } from "@/types/learning";

export function TunisianSupportPanel({ lessonId, mode }: { lessonId: string; mode: ArabicSupportMode | undefined }) {
  const notes = tunisianSupportForMode(lessonId, mode);
  if (!notes.length) return null;

  const pending = notes.filter((item) => item.reviewStatus === "authored-review-pending").length;
  return <aside className="tunisian-support-panel" data-tunisian-policy="tunisian-support-v1" data-review-pending={pending}>
    <header>
      <span><Languages size={20}/></span>
      <div><small lang="de" dir="ltr">Tunesische Lernhilfe</small><h2>تقريب تونسي اختياري</h2><p>الفصحى هي المرجع؛ يظهر هذا التقريب فقط لأنك اخترت الدعم التونسي.</p></div>
      <b><ShieldCheck size={14}/> مراجعة مستقلة معلّقة</b>
    </header>
    <div className="tunisian-note-list">{notes.map((item) => <article key={item.id} data-tunisian-note={item.id} data-review-status={item.reviewStatus}>
      <header><div><strong>{item.titleAr}</strong><small lang="de" dir="ltr">{item.titleDe}</small></div><span data-contrast-category={item.category}>فرق مؤثر</span></header>
      <section><small>الجسر بالفصحى</small><p lang="ar" dir="rtl">{item.msaBridgeAr}</p></section>
      <section className="tunisian-phrase"><small>بالتونسي للتقريب</small><p lang="ar-TN" dir="rtl">{item.tunisianNoteAr}</p></section>
      <section className="difference-impact"><small>لماذا يهم الفرق؟</small><p>{item.differenceImpactAr}</p></section>
      <blockquote lang="de" dir="ltr">{item.germanAnchorDe}</blockquote>
    </article>)}</div>
    <footer>توجد فروق داخل تونس بين المناطق والمتكلمين. هذا الدعم لا يغيّر القاعدة الألمانية، وصياغاته مؤلفة أوليًا بانتظار المراجعة اللغوية النهائية المستقلة.</footer>
  </aside>;
}
