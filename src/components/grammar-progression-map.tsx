import Link from "next/link";
import { ArrowLeft, GitBranch, LockKeyhole } from "lucide-react";
import { grammarNodeById, grammarProgressionNodes, GRAMMAR_PROGRESSION_VERSION } from "@/data/grammar-progression-registry";
import type { CEFRLevel } from "@/types/learning";

const levels:CEFRLevel[]=["A1","A2","B1","B2"];
export function GrammarProgressionMap(){return <section className="grammar-progression-map" data-grammar-map-policy={GRAMMAR_PROGRESSION_VERSION}>
  <header><span><GitBranch size={20}/></span><div><small lang="de" dir="ltr">Grammatik-Landkarte</small><h2>خريطة المتطلبات وحدود القاعدة</h2><p>24 قاعدة محورية مرتبة بعلاقات تدريس فعلية. الأسهم تعني «تعلم هذا أولًا»، لا حكم CEFR رسميًا ولا إتقانًا بالتصفح.</p></div></header>
  <div className="grammar-level-columns">{levels.map((level)=><section key={level}><h3>{level}</h3>{grammarProgressionNodes.filter((node)=>node.level===level).map((node)=><article key={node.id}><header><strong lang="de" dir="ltr">{node.titleDe}</strong><span>{node.titleAr}</span></header><p>{node.progression.commonLimitAr}</p><div>{node.prerequisiteIds.length?<><LockKeyhole size={13}/><span>قبلها: {node.prerequisiteIds.map((id)=>grammarNodeById[id]?.titleAr).join(" · ")}</span></>:<span>نقطة تأسيس</span>}</div><Link href={`/lernen/${node.lessonId}`}>افتح درس القاعدة <ArrowLeft size={13}/></Link></article>)}</section>)}</div>
  <footer>الخريطة إصدارية ومحدودة بالقواعد المحورية المسجلة. بقية تفاصيل الدروس لا تُسمى «متطلبات» آليًا.</footer>
</section>}
