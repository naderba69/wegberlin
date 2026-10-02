"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, MessagesSquare, RefreshCcw, TriangleAlert } from "lucide-react";
import { arabicLearnerConfusions, registerExamples, registerLabels, wordFamilies, type LanguageRegister } from "@/data/lexical-strategy-registry";
import { MODULE_RECYCLING_VERSION, moduleRecyclingSummaries } from "@/core/lexical-strategy/recycling";
import type { CEFRLevel } from "@/types/learning";

type ExplorerTab="families"|"register"|"confusions"|"recycling";
const levels:CEFRLevel[]=["A1","A2","B1","B2"];
const tabs:Array<{id:ExplorerTab;de:string;ar:string;icon:typeof GitBranch}>=[
  {id:"families",de:"Wortfamilien",ar:"عائلات الكلمات",icon:GitBranch},
  {id:"register",de:"Register",ar:"السجل والسياق",icon:MessagesSquare},
  {id:"confusions",de:"Nicht verwechseln",ar:"كلمات مربكة",icon:TriangleAlert},
  {id:"recycling",de:"Wiederverwenden",ar:"إعادة التدوير",icon:RefreshCcw},
];

export function LexicalStrategyExplorer(){
  const[tab,setTab]=useState<ExplorerTab>("families");
  const[level,setLevel]=useState<CEFRLevel>("A1");
  const[register,setRegister]=useState<LanguageRegister|"all">("all");
  const families=wordFamilies.filter((item)=>item.level===level);
  const registers=registerExamples.filter((item)=>item.level===level&&(register==="all"||item.register===register));
  const confusions=arabicLearnerConfusions.filter((item)=>item.level===level);
  const recycling=moduleRecyclingSummaries.filter((item)=>item.level===level);
  return <section id="lexical-strategies" className="lexical-strategy-explorer" data-lexical-strategy-policy="lexical-strategy-registry-v1">
    <header><div><span className="eyebrow"><GitBranch size={15}/> روابط لا قوائم منفصلة</span><h2><span lang="de" dir="ltr">Wörter im Zusammenhang</span> · الكلمات داخل سياقها</h2><p>استكشف الاشتقاق والمركبات والسجل والكلمات المربكة. هذه أدوات فهم وتدريب، وليست نسبة إتقان أو حكمًا على جميع الناطقين بالعربية.</p></div><div className="lexical-level-filter" aria-label="مستوى مختبر الروابط">{levels.map((item)=><button type="button" key={item} className={level===item?"active":""} aria-pressed={level===item} onClick={()=>setLevel(item)}>{item}</button>)}</div></header>
    <nav className="lexical-tabs" aria-label="أقسام مختبر الكلمات">{tabs.map((item)=>{const Icon=item.icon;return <button type="button" key={item.id} className={tab===item.id?"active":""} aria-pressed={tab===item.id} onClick={()=>setTab(item.id)}><Icon size={15}/><span><b lang="de" dir="ltr">{item.de}</b><small>{item.ar}</small></span></button>})}</nav>

    {tab==="families"&&<div className="word-family-grid" data-lexical-view="families">{families.map((family)=><details key={family.id} className="word-family-card"><summary><span><strong lang="de" dir="ltr">{family.anchorDe}</strong><small>{family.titleAr}</small></span><b>{family.members.length} روابط</b></summary><div><p>{family.relationNoteAr}</p><ul>{family.members.map((member)=><li key={`${family.id}:${member.formDe}`}><div><strong lang="de" dir="ltr">{member.formDe}</strong><span>{member.wordClass==="verb"?"Verb":member.wordClass==="noun"?"Nomen":member.wordClass==="adjective"?"Adjektiv":member.wordClass==="compound"?"Kompositum":"Form"} · {member.relation==="base"?"أساس":member.relation==="derivation"?"اشتقاق":member.relation==="compound"?"مركب":"قريب دلاليًا"}</span></div><p>{member.meaningAr}</p><q lang="de" dir="ltr">{member.exampleDe}</q></li>)}</ul><footer>{family.cautionAr}</footer></div></details>)}</div>}

    {tab==="register"&&<div data-lexical-view="register"><div className="register-filter" role="group" aria-label="تصفية السجل"><button type="button" className={register==="all"?"active":""} onClick={()=>setRegister("all")}>الكل</button>{(Object.keys(registerLabels) as LanguageRegister[]).map((key)=><button type="button" key={key} className={register===key?"active":""} onClick={()=>setRegister(key)}><span lang="de" dir="ltr">{registerLabels[key].de}</span> · {registerLabels[key].ar}</button>)}</div><div className="register-example-grid">{registers.map((item)=><article key={item.id} data-language-register={item.register}><header><span lang="de" dir="ltr">{registerLabels[item.register].de}</span><b>{registerLabels[item.register].ar}</b></header><h3 lang="de" dir="ltr">{item.expressionDe}</h3><p>{item.meaningAr}</p><dl><div><dt>متى؟</dt><dd>{item.contextAr}</dd></div><div><dt>انتبه</dt><dd>{item.avoidAr}</dd></div></dl>{item.regionalBoundaryAr&&<small>{item.regionalBoundaryAr}</small>}<footer><strong lang="de" dir="ltr">{item.transferPromptDe}</strong><span>{item.transferPromptAr}</span></footer></article>)}</div><p className="lexical-boundary-note">{register==="all"?"الرسمي والمحايد والمحادثي والمهني وظائف سياقية، لا سلم أفضل/أسوأ.":registerLabels[register].boundaryAr}</p></div>}

    {tab==="confusions"&&<div className="confusion-grid" data-lexical-view="confusions"><p className="lexical-boundary-note full">هذه مربكات محتملة ناتجة عن النقل العربي أو المرور بالإنجليزية/الفرنسية أو تشابه ألماني داخلي. لا نفترض أن كل متعلم عربي يرتكبها.</p>{confusions.map((item)=><article key={item.id}><header><strong lang="de" dir="ltr">{item.targetDe}</strong><span>{item.source==="arabic-transfer"?"نقل من العربية":item.source==="english-mediation"?"مرور بالإنجليزية":item.source==="french-mediation"?"مرور بالفرنسية":"تشابه ألماني"}</span></header><p><b>ليس المقصود:</b> {item.falseAssociationAr}</p><p><b>المعنى هنا:</b> {item.correctMeaningAr}</p><blockquote><span lang="de" dir="ltr">{item.contrastDe}</span><small>{item.contrastAr}</small></blockquote><footer><b>تريك:</b> {item.strategyAr}</footer></article>)}</div>}

    {tab==="recycling"&&<div data-lexical-view="recycling"><p className="lexical-boundary-note full">كل مراجعة وحدة تتكون من عشرة أسئلة. النسبة محسوبة إصداريا؛ أول وحدة 0% لعدم وجود مادة سابقة، ثم 20% في A1 و30% في A2/B1 و40% في B2.</p><div className="recycling-module-grid">{recycling.map((item)=><article key={item.moduleId} data-recycling-policy={MODULE_RECYCLING_VERSION}><header><strong>{item.moduleId}</strong><span lang="de" dir="ltr">{item.titleDe}</span></header><div><b>{item.recycledPercent}%</b><span>قديم</span><b>{item.currentPercent}%</b><span>حالي</span></div><p>{item.recycledCount?`${item.recycledCount} سؤال استرجاع مفردات/بنية من وحدات أقدم، و${item.currentCount} من الوحدة الحالية.`:"لا مادة سابقة؛ الأسئلة العشرة تأسيسية من الوحدة الحالية."}</p><Link href={`/module/${item.level.toLowerCase()}-${item.module}`}>افتح المراجعة <ArrowLeft size={14}/></Link></article>)}</div></div>}
  </section>;
}
