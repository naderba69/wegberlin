import { BookKey, GitBranch } from "lucide-react";
import { framesByLesson, nounsByLesson } from "@/data/lexical-grammar-registry";
import { lessonNounTargets } from "@/data/noun-inventory";
import { measuredTargetsByLesson } from "@/data/verb-preposition-coverage";
import { valencyEntries } from "@/data/verb-preposition-dictionary";

const genderLabels = {
  masculine: "Maskulin",
  feminine: "Feminin",
  neuter: "Neutrum",
};
const caseLabels = {
  nominative: "Nominativ · الفاعل",
  accusative: "Akkusativ · المفعول المباشر",
  dative: "Dativ · بعد أفعال/حروف محددة",
  genitive: "Genitiv · المضاف إليه",
};
const governedCaseLabels = {
  accusative: "Akkusativ",
  dative: "Dativ",
  genitive: "Genitiv",
};

export function LexicalGrammarPanel({ lessonId }: { lessonId: string }) {
  const nouns = nounsByLesson[lessonId] ?? [];
  const anchors = nouns.filter((noun) => noun.origin === "anchor");
  const inventory = nouns.filter((noun) => noun.origin === "inventory");
  const frames = framesByLesson[lessonId] ?? [];
  if (!nouns.length && !frames.length) return null;

  return <section className="lexical-grammar-panel" aria-label="بيانات الاسم والفعل البنيوية">
    <header>
      <span><BookKey size={19} /></span>
      <div>
        <small lang="de" dir="ltr">Nomen mit Artikel, Plural, Genitiv und Dativ Plural</small>
        <h3>مراسي الاسم في هذا الدرس</h3>
        <p>احفظ الاسم مع أداته وجمعه. افتح الحالات عندما تحتاج شكلًا داخل الجملة، لا تحفظ النهاية وحدها.</p>
      </div>
    </header>
    <div className="noun-grammar-grid">
      {anchors.map((noun) => <article key={noun.id} data-lexical-id={noun.id} data-origin={noun.origin}>
        <div><strong lang="de" dir="ltr">{noun.article} {noun.lemma}</strong><span>{genderLabels[noun.gender]}</span></div>
        <p>{noun.meaningAr}</p>
        <b lang="de" dir="ltr">{noun.plural.form ? `die ${noun.plural.form}` : "meist ohne Plural"}</b>
        <small>{noun.plural.noteAr}</small>
        <b lang="de" dir="ltr">{noun.dativePlural.form ?? "kein Dativ Plural"}</b>
        <small>{noun.dativePlural.noteAr}</small>
        <details>
          <summary lang="de" dir="ltr">Kasusformen ansehen <span lang="ar" dir="rtl">· عرض الحالات</span></summary>
          <dl>{Object.entries(noun.caseForms).map(([caseName, form]) => <div key={caseName}><dt>{caseLabels[caseName as keyof typeof caseLabels]}</dt><dd lang="de" dir="ltr">{form}</dd></div>)}</dl>
        </details>
      </article>)}
    </div>

    {inventory.length ? <details className="inventory-noun-block">
      <summary lang="ar" dir="rtl">أسماء مسرد القراءة في هذا الدرس · {inventory.length} <span lang="de" dir="ltr">Lesetext-Glossar</span></summary>
      <div className="inventory-noun-grid">
        {inventory.map((noun) => <article className="inventory-noun-card" key={noun.id} data-lexical-id={noun.id} data-origin={noun.origin}>
          <div><strong lang="de" dir="ltr">{noun.article} {noun.lemma}</strong><span>{genderLabels[noun.gender]}</span></div>
          <p>{noun.meaningAr}</p>
          <b lang="de" dir="ltr">{noun.plural.form ? `die ${noun.plural.form}` : "meist ohne Plural"}</b>
          <b lang="de" dir="ltr">{noun.dativePlural.form ?? "kein Dativ Plural"}</b>
          <details>
            <summary lang="de" dir="ltr">Kasusformen ansehen <span lang="ar" dir="rtl">· عرض الحالات</span></summary>
            <dl>{Object.entries(noun.caseForms).map(([caseName, form]) => <div key={caseName}><dt>{caseLabels[caseName as keyof typeof caseLabels]}</dt><dd lang="de" dir="ltr">{form}</dd></div>)}</dl>
          </details>
        </article>)}
      </div>
    </details> : null}

    {frames.length ? <div className="verb-frame-grid">
      {frames.map((frame) => <article className="verb-frame-card" key={frame.id} data-frame-id={frame.id} data-origin={frame.origin}>
        <span><GitBranch size={18} /></span>
        <div>
          <small lang="de" dir="ltr">{frame.origin === "derived" ? "Verb + Präposition + Kasus · مقيس في نص هذا الدرس" : "Verb + Präposition + Kasus"}</small>
          <h3 lang="de" dir="ltr">{frame.chunkDe}</h3>
          <p>{frame.meaningAr}</p>
          <blockquote lang="de" dir="ltr">{frame.exampleDe}</blockquote>
          <footer><b lang="de" dir="ltr">{frame.preposition} + {governedCaseLabels[frame.governedCase]}</b><span>{frame.contrastAr}</span></footer>
        </div>
      </article>)}
    </div> : null}
    <p className="lexical-coverage-note">
      {`تغطي هذه الطبقة ${anchors.length} مراسي اسمية مؤلفة في هذا الدرس، ولكل مرسى صيغة Genitiv مفرد وجمع مجرور بعد den، وتُضاف إليها ${inventory.length} اسمًا من مسرد قراءة الدرس (${(lessonNounTargets[lessonId] ?? []).length} اسمًا هدفًا مقيسًا في هذا الدرس). أما إطارات الفعل مع حرف الجر (${frames.length}) فمقيسة آليًا من نص هذا الدرس نفسه مقابل قاموس تكافؤ مؤلف من ${valencyEntries.length} مدخلًا، فهي تغطي كل فعل ذي متمم جرّي ظهر في النص (الأهداف المقيسة في هذا الدرس: ${measuredTargetsByLesson[lessonId]?.length ?? 0}) لا إطارًا أو إطارين ثابتين. حدّ الجرد: لا يستخدم مُعلّمًا صرفيًا، ولا يرى أفعالًا غير مدرجة في القاموس، ولا يقيس المتممات الظرفية والزمنية. كل هذه الصيغ لم تُراجَع ألمانيًا بشريًا بعد.`}
    </p>
  </section>;
}
