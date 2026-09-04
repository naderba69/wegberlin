import { BookKey, GitBranch } from "lucide-react";
import { framesByLesson, lexicalLevelOf, nounsByLesson } from "@/data/lexical-grammar-registry";

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
  const frames = framesByLesson[lessonId] ?? [];
  const level = lexicalLevelOf(lessonId);
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
      {nouns.map((noun) => <article key={noun.id} data-lexical-id={noun.id}>
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

    {frames.length ? <div className="verb-frame-grid">
      {frames.map((frame) => <article className="verb-frame-card" key={frame.id} data-frame-id={frame.id}>
        <span><GitBranch size={18} /></span>
        <div>
          <small lang="de" dir="ltr">Verb + Präposition + Kasus</small>
          <h3 lang="de" dir="ltr">{frame.chunkDe}</h3>
          <p>{frame.meaningAr}</p>
          <blockquote lang="de" dir="ltr">{frame.exampleDe}</blockquote>
          <footer><b lang="de" dir="ltr">{frame.preposition} + {governedCaseLabels[frame.governedCase]}</b><span>{frame.contrastAr}</span></footer>
        </div>
      </article>)}
    </div> : null}
    <p className="lexical-coverage-note">
      {level === "A1"
        ? "تغطي هذه الطبقة أربع مراسي اسمية وإطار فعل واحدًا مع حرف الجر في كل درس من 24/24 درس A1، ولكل مرسى صيغة Genitiv مفرد وجمع مجرور بعد den. المراسي مختارة من نظرية الدرس ولا تغطي كل أسماء وأفعال المستوى، ولم تُراجَع ألمانيًا بشريًا بعد."
        : `تغطي هذه الطبقة أربع مراسي اسمية وإطارين للفعل مع حرف الجر في هذا الدرس ${level}، مأخوذة من نظرية الدرس ومفرداته، ولكل مرسى صيغة Genitiv مفرد وجمع مجرور بعد den. المراسي مختارة ولا تغطي كل أسماء وأفعال المستوى، ولم تُراجَع ألمانيًا بشريًا بعد.`}
    </p>
  </section>;
}
