import { BookKey, GitBranch } from "lucide-react";
import { a1NounsByLesson, a1VerbFramesByLesson } from "@/data/lexical-grammar-a1";

const genderLabels = {
  masculine: "Maskulin",
  feminine: "Feminin",
  neuter: "Neutrum",
};
const caseLabels = {
  nominative: "Nominativ · الفاعل",
  accusative: "Akkusativ · المفعول المباشر",
  dative: "Dativ · بعد أفعال/حروف محددة",
};

export function LexicalGrammarPanel({ lessonId }: { lessonId: string }) {
  const nouns = a1NounsByLesson[lessonId] ?? [];
  const frames = a1VerbFramesByLesson[lessonId] ?? [];
  if (!nouns.length && !frames.length) return null;

  return <section className="lexical-grammar-panel" aria-label="بيانات الاسم والفعل البنيوية">
    <header>
      <span><BookKey size={19} /></span>
      <div>
        <small lang="de" dir="ltr">Nomen mit Artikel, Plural und Kasus</small>
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
        <details>
          <summary lang="de" dir="ltr">Kasusformen ansehen <span lang="ar" dir="rtl">· عرض الحالات</span></summary>
          <dl>{Object.entries(noun.caseForms).map(([caseName, form]) => <div key={caseName}><dt>{caseLabels[caseName as keyof typeof caseLabels]}</dt><dd lang="de" dir="ltr">{form}</dd></div>)}</dl>
        </details>
      </article>)}
    </div>

    {frames.map((frame) => <article className="verb-frame-card" key={frame.id} data-frame-id={frame.id}>
      <span><GitBranch size={18} /></span>
      <div>
        <small lang="de" dir="ltr">Verb + Präposition + Kasus</small>
        <h3 lang="de" dir="ltr">{frame.chunkDe}</h3>
        <p>{frame.meaningAr}</p>
        <blockquote lang="de" dir="ltr">{frame.exampleDe}</blockquote>
        <footer><b lang="de" dir="ltr">{frame.preposition} + {frame.governedCase === "dative" ? "Dativ" : "Akkusativ"}</b><span>{frame.contrastAr}</span></footer>
      </div>
    </article>)}
    <p className="lexical-coverage-note">تغطي هذه الدفعة أربع كلمات اسمية مرساة وإطار فعل واحدًا في كل درس A1. لا تدّعي بعد تغطية كل أسماء وأفعال A2–B2.</p>
  </section>;
}
