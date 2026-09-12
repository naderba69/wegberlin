import { BookKey, GitBranch } from "lucide-react";
import { nounsByLesson, verbFramesByLesson } from "@/data/lexical-grammar-registry";
import type { NounGrammarEntry } from "@/types/lexical-grammar";

const genderLabels = {
  masculine: "Maskulin",
  feminine: "Feminin",
  neuter: "Neutrum",
  "plural-only": "nur Plural",
};
const caseLabels = {
  nominative: "Nominativ · الفاعل",
  accusative: "Akkusativ · المفعول المباشر",
  dative: "Dativ · بعد أفعال/حروف محددة",
  genitive: "Genitiv · الملكية أو بعض التراكيب",
};

function NounGrid({ nouns, baseline = false }: { nouns: NounGrammarEntry[]; baseline?: boolean }) {
  return <div className={`noun-grammar-grid${baseline ? " baseline-nouns" : ""}`}>
    {nouns.map((noun) => <article key={noun.id} data-lexical-id={noun.id}>
      <div><strong lang="de" dir="ltr">{noun.caseForms.nominative}</strong><span>{genderLabels[noun.gender]}</span></div>
      <p>{noun.meaningAr}</p>
      <b lang="de" dir="ltr">{noun.plural.form ? `die ${noun.plural.form}` : "meist ohne Plural"}</b>
      <small>{noun.plural.noteAr}</small>
      {noun.plural.dativeForm && <small lang="de" dir="ltr">Plural Dativ: den {noun.plural.dativeForm}</small>}
      <details>
        <summary lang="de" dir="ltr">Kasusformen ansehen <span lang="ar" dir="rtl">· عرض الحالات</span></summary>
        <dl>{Object.entries(noun.caseForms).map(([caseName, form]) => <div key={caseName}><dt>{caseLabels[caseName as keyof typeof caseLabels]}</dt><dd lang="de" dir="ltr">{form}</dd></div>)}</dl>
      </details>
    </article>)}
  </div>;
}

export function LexicalGrammarPanel({ lessonId }: { lessonId: string }) {
  const nouns = nounsByLesson[lessonId] ?? [];
  const frames = verbFramesByLesson[lessonId] ?? [];
  const level = lessonId.slice(0, 2).toUpperCase();
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
    <NounGrid nouns={nouns.slice(0, 4)} baseline />
    {nouns.length > 4 && <details className="additional-noun-anchors">
      <summary><span lang="de" dir="ltr">Weitere Zielnomen</span><span>أسماء هدف إضافية موثقة · {nouns.length - 4}</span></summary>
      <p>افتحها بعد تثبيت المراسي الأربع الأولى حتى لا تتحول البداية إلى قائمة حفظ طويلة.</p>
      <NounGrid nouns={nouns.slice(4)} />
    </details>}

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
    <p className="lexical-coverage-note">تعرض الطبقة حاليًا {nouns.length} مراسي اسم و{frames.length} إطار فعل/حرف جر في هذا الدرس {level}. اكتملت A1–B2 في خط الأساس، وتُضاف الفجوات الموثوقة تدريجيًا؛ هذه المراسي لا تمثل كل مفردات الدرس بعد.</p>
  </section>;
}
