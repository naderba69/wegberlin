import { ArrowLeftRight, ScanSearch, Shapes } from "lucide-react";
import { meaningFirstCaseByLesson } from "@/data/case-teaching-registry";

const caseLabel = { nominative:"Nominativ", accusative:"Akkusativ", dative:"Dativ", genitive:"Genitiv" } as const;

export function MeaningFirstCasePanel({lessonId}:{lessonId:string}){
  const contract=meaningFirstCaseByLesson[lessonId];
  if(!contract)return null;
  return <section className="meaning-first-case-panel" data-case-contract={contract.id} data-case-policy={contract.sourceVersion}>
    <header><span><ScanSearch size={20}/></span><div><small lang="de" dir="ltr">Bedeutung → Rolle → Form</small><h2>{contract.titleAr}</h2><p lang="de" dir="ltr">{contract.titleDe}</p></div><b>{contract.governedCases.map((item)=>caseLabel[item]).join(" · ")}</b></header>
    <div className="case-sequence">
      <article><span>1</span><div><small lang="de" dir="ltr">Bedeutung verstehen</small><strong>افهم الحدث أولًا</strong><p>{contract.semanticQuestionAr}</p></div></article>
      <article><span>2</span><div><small lang="de" dir="ltr">Rolle bestimmen</small><strong>حدّد دور الاسم</strong><ul>{contract.roleChoicesAr.map((role)=><li key={role}>{role}</li>)}</ul></div><ArrowLeftRight size={17}/></article>
      <article><span>3</span><div><small lang="de" dir="ltr">Form prüfen</small><strong>اختر الحالة ثم النهاية</strong><p>{contract.formRuleAr}</p></div><Shapes size={17}/></article>
    </div>
    <footer>لا تبدأ بحفظ جدول النهايات. أجب عن سؤال المعنى والدور، ثم استخدم الشكل بوصفه نتيجة للقرار.</footer>
  </section>;
}
