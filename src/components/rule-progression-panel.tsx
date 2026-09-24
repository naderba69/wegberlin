import { ArrowLeftRight, GitBranch, TriangleAlert } from "lucide-react";
import { grammarNodeById, grammarNodesByLesson } from "@/data/grammar-progression-registry";

export function RuleProgressionPanel({lessonId}:{lessonId:string}){const nodes=grammarNodesByLesson[lessonId]??[];if(!nodes.length)return null;return <div className="rule-progression-stack">{nodes.map((node)=><section key={node.id} className="rule-progression-panel" data-rule-progression-policy={node.policyVersion}>
  <header><span><GitBranch size={18}/></span><div><small lang="de" dir="ltr">Grenzen und Transfer</small><h2 lang="de" dir="ltr">{node.titleDe}</h2><p>{node.titleAr}</p></div></header>
  <div className="rule-progression-steps"><article><b>1</b><span><strong>الآن</strong>{node.progression.introducedAr}</span></article><article><b>2</b><span><strong>الحد الشائع</strong>{node.progression.commonLimitAr}</span></article><article><b>3</b><span><strong>ليس الآن</strong>{node.progression.deferredAr}</span></article></div>
  <div className="rule-boundary-grid"><article><h3><TriangleAlert size={14}/> أين تتوقف القاعدة؟</h3><ul>{node.boundariesAr.map((item)=><li key={item}>{item}</li>)}</ul></article><article><h3><ArrowLeftRight size={14}/> استثناء شائع</h3><ul>{node.exceptionsAr.map((item)=><li key={item}>{item}</li>)}</ul></article></div>
  <div className="rule-transfer-contract"><span><b>تدريب مضبوط</b>{node.controlledExerciseIds.length===2?"عنصران":"عناصر"} مرتبطان في هذا الدرس</span><span><b>نقل حر</b><strong lang="de" dir="ltr">{node.production.promptDe}</strong><small>{node.production.promptAr}</small></span><p>{node.semanticAlignmentAr}</p></div>
  {node.prerequisiteIds.length>0&&<footer>يبني على: {node.prerequisiteIds.map((id)=>grammarNodeById[id]?.titleAr).join(" · ")}. هذا ربط تعليمي، لا درجة إتقان.</footer>}
</section>)}</div>}
