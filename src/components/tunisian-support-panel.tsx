import { Languages, ShieldCheck } from "lucide-react";
import { tunisianSupportForMode } from "@/data/tunisian-support-registry";
import type { ArabicSupportMode } from "@/types/learning";

export function TunisianSupportPanel({ lessonId, mode }: { lessonId: string; mode: ArabicSupportMode | undefined }) {
  const notes = tunisianSupportForMode(lessonId, mode);
  if (!notes.length) return null;

  const pending = notes.filter((item) => item.reviewStatus === "authored-review-pending").length;
  const sourceVerified = notes.filter((item) => item.reviewStatus === "source-verified-agent").length;
  return <aside className="tunisian-support-panel" data-tunisian-policy="tunisian-support-v1" data-review-pending={pending} data-source-verified={sourceVerified}>
    <header>
      <span><Languages size={20}/></span>
      <div><small lang="de" dir="ltr">Tunesische Lernhilfe</small><h2>تقريب تونسي اختياري</h2><p>الفصحى هي المرجع؛ يظهر هذا التقريب فقط لأنك اخترت الدعم التونسي.</p></div>
      <b><ShieldCheck size={14}/> {pending ? "مراجعة مستقلة معلّقة" : "مُتحقَّق منه بمصادر منشورة"}</b>
    </header>
    <div className="tunisian-note-list">{notes.map((item) => <article key={item.id} data-tunisian-note={item.id} data-review-status={item.reviewStatus}>
      <header><div><strong>{item.titleAr}</strong><small lang="de" dir="ltr">{item.titleDe}</small></div><span data-contrast-category={item.category}>فرق مؤثر</span></header>
      <section><small>الجسر بالفصحى</small><p lang="ar" dir="rtl">{item.msaBridgeAr}</p></section>
      <section className="tunisian-phrase"><small>بالتونسي للتقريب</small><p lang="ar-TN" dir="rtl">{item.tunisianNoteAr}</p></section>
      <section className="difference-impact"><small>لماذا يهم الفرق؟</small><p>{item.differenceImpactAr}</p></section>
      <blockquote lang="de" dir="ltr">{item.germanAnchorDe}</blockquote>
    </article>)}</div>
    <footer>للعربية التونسية ست لهجات جهوية متفاهمة: تونس العاصمة، الساحل، صفاقس، الشمال الغربي، الجنوب الغربي، الجنوب الشرقي، والنطق يختلف بينها (مثل «قال» بالقاف أو بالـ«ڨ»). اخترنا صيغًا مفهومة في كل الجهات، والفصحى تبقى المرجع. هذا الدعم لا يغيّر القاعدة الألمانية، وصيغه مقابلة بمصادر لغوية منشورة، وليست مراجعة بشرية مستقلة.</footer>
  </aside>;
}
