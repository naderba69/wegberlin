"use client";

import { useRef, useState } from "react";
import { Check, Eye, EyeOff, Hand, RotateCcw, UsersRound } from "lucide-react";
import { canCompleteInformationGap, evaluateInformationGap, INFORMATION_GAP_POLICY, INFORMATION_GAP_SCENARIO, type InformationGapDecision } from "@/core/speaking/information-gap";
import { useLearning } from "./learning-provider";
import { StatusAnnouncement } from "./status-announcement";

const turnLabels = ["A طرح سؤالًا", "B أجاب بمعلومة", "B طرح سؤالًا", "A أجاب بمعلومة"];
type Phase = "intro" | "role-a" | "handover-a" | "role-b" | "handover-b" | "exchange" | "saved";

export function InformationGapLab({ lessonId }: { lessonId: string }) {
  const { update } = useLearning();
  const [phase, setPhase] = useState<Phase>("intro");
  const [partnerConfirmed, setPartnerConfirmed] = useState(false);
  const [turns, setTurns] = useState<boolean[]>([false,false,false,false]);
  const [decision, setDecision] = useState<InformationGapDecision | null>(null);
  const [checked, setChecked] = useState(false);
  const startedAt = useRef(0);
  const correct = decision ? evaluateInformationGap(decision) : false;
  const saveReady = canCompleteInformationGap({ partnerConfirmed, completedTurns:turns.filter(Boolean).length, decision });

  function save() {
    if (!saveReady || phase === "saved") return;
    const now = new Date();
    update((state) => ({ ...state, speakingAttempts:[...state.speakingAttempts,{id:`info-gap-${crypto.randomUUID()}`,taskId:`information-gap:${lessonId}`,durationSeconds:Math.max(1,Math.round((Date.now()-startedAt.current)/1000)),selfScore:3,reflection:`Kurs Beta · ${turns.filter(Boolean).length} turns · partner confirmed`,createdAt:now.toISOString()}],studyHistory:[...state.studyHistory,{date:now.toISOString().slice(0,10),minutes:5,evidenceCount:1}] }));
    setPhase("saved");
  }

  function reset() { setPhase("intro");setPartnerConfirmed(false);setTurns([false,false,false,false]);setDecision(null);setChecked(false);startedAt.current=Date.now(); }
  const role = phase === "role-a" ? INFORMATION_GAP_SCENARIO.roleA : INFORMATION_GAP_SCENARIO.roleB;

  return <section className="information-gap-lab" data-info-gap-policy={INFORMATION_GAP_POLICY}>
    <header><span><UsersRound size={21}/></span><div><small lang="de" dir="ltr">Informationslücke · zwei Personen</small><h2>مهمة معلومات ناقصة حقيقية على جهاز واحد</h2><p>كل شخص يرى معلومات لا يراها الآخر. مرّر الجهاز بعد إخفاء البطاقة، وتحدثا بالألمانية للوصول إلى قرار مشترك.</p></div></header>
    {phase === "intro" && <div className="info-gap-intro"><label><input type="checkbox" checked={partnerConfirmed} onChange={(event)=>setPartnerConfirmed(event.target.checked)}/><span>يوجد معي شخص ثانٍ الآن، ولن نعرض بطاقتي الدور معًا.</span></label><button className="primary-button" disabled={!partnerConfirmed} onClick={()=>{startedAt.current=Date.now();setPhase("role-a")}}><Eye size={16}/> افتح بطاقة الشخص A فقط</button><p>إذا كنت وحدك يمكنك قراءة البطاقتين كتدريب أدوار، لكن لا تحفظها كدليل ثنائي الطرف.</p></div>}
    {(phase === "role-a" || phase === "role-b") && <div className="private-role-card"><small lang="de" dir="ltr">{role.titleDe}</small><h3>معلوماتك الخاصة</h3><ul lang="de" dir="ltr">{role.factsDe.map((fact)=><li key={fact}>{fact}</li>)}</ul><h3>اسأل دون قراءة المعلومات حرفيًا</h3><ul lang="de" dir="ltr">{role.questionsDe.map((question)=><li key={question}>{question}</li>)}</ul><button className="primary-button" onClick={()=>setPhase(phase==="role-a"?"handover-a":"handover-b")}><EyeOff size={16}/> أخفِ البطاقة قبل تمرير الجهاز</button></div>}
    {(phase === "handover-a" || phase === "handover-b") && <div className="info-gap-handover"><Hand size={30}/><h3>البطاقة مخفية الآن</h3><p>مرّر الجهاز من دون كشف معلومات الدور السابق.</p><button className="primary-button" onClick={()=>setPhase(phase==="handover-a"?"role-b":"exchange")}>{phase==="handover-a"?"استلم الشخص B وافتح بطاقته":"ابدآ التبادل دون البطاقتين"}</button></div>}
    {phase === "exchange" && <div className="info-gap-exchange"><h3>تحدثا والبطاقتان مخفيتان</h3><div>{turnLabels.map((label,index)=><label key={label}><input type="checkbox" checked={turns[index]} onChange={(event)=>setTurns((current)=>current.map((value,item)=>item===index?event.target.checked:value))}/><span>{label}</span></label>)}</div><fieldset><legend>Welcher Kurs passt?</legend><button type="button" className={decision==="alpha"?"active":""} onClick={()=>{setDecision("alpha");setChecked(false)}}>Kurs Alpha</button><button type="button" className={decision==="beta"?"active":""} onClick={()=>{setDecision("beta");setChecked(false)}}>Kurs Beta</button></fieldset><button className="secondary-button" disabled={!decision||turns.filter(Boolean).length<4} onClick={()=>setChecked(true)}>قرار مشترك: تحقّق</button>{checked&&<StatusAnnouncement message={correct?"يطابق القرار المعلومات المتبادلة: السبت، 95 يورو، ومواد إلكترونية.":"القرار لا يطابق القيود الثلاثة. اسألا مجددًا دون فتح البطاقتين معًا."} channel="information-gap-result" className={correct?"compact":"compact warning"}/>}<button className="primary-button" disabled={!saveReady||!checked} onClick={save}><Check size={16}/> احفظ دليل التبادل الثنائي</button></div>}
    {phase === "saved" && <StatusAnnouncement message="حُفظ تبادل ثنائي من أربع نقلات وقرار مشترك. لم يدّع التطبيق وجود شريك آلي أو تقييم اللغة." channel="information-gap-saved" icon={<Check size={17}/>}/>} 
    {phase !== "intro" && phase !== "saved" && <button className="info-gap-reset" onClick={reset}><RotateCcw size={14}/> ابدأ من جديد واحجب البطاقتين</button>}
  </section>;
}
