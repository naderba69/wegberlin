"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarClock, Clock3, Pin, RotateCcw, ShieldCheck, Sparkles, Sunrise, Sunset, Trash2 } from "lucide-react";
import type { MissionBlock, StudyRoutineModeSettings } from "@/types/learning";
import { buildExamCountdown, buildExtraThirtyMinutesWhatIf, buildFiveMinuteQuickPractice, clearPinnedLearningTask, levelEndBackupReminder, pinLearningTask, setStudyRoutineMode } from "@/core/coach/daily-focus-tools";
import { useLearning } from "./learning-provider";

const modes:Array<{id:StudyRoutineModeSettings["mode"];title:string;de:string;detail:string}>=[
 {id:"auto",title:"تلقائي",de:"Automatisch",detail:"اتبع توصية المدرب الحالية."},
 {id:"morning-quick",title:"صباح سريع",de:"Schneller Morgen",detail:"ابدأ بممارسة أضعف هدف لخمس دقائق."},
 {id:"evening-calm-review",title:"مساء هادئ",de:"Ruhiger Abend",detail:"مراجعة استرجاع بلا إضافة حمل جديد."},
];
export function DailyFocusTools({mission}:{mission:MissionBlock[]}){
 const{state,update}=useLearning();const eligible=mission.filter((block)=>block.href&&!['check-in','reflection'].includes(block.kind));const[selectedId,setSelectedId]=useState(eligible[0]?.id??"");const selected=eligible.find((block)=>block.id===selectedId)??eligible[0];const quick=buildFiveMinuteQuickPractice(state);const countdown=buildExamCountdown(state);const whatIf=buildExtraThirtyMinutesWhatIf(state);const backup=levelEndBackupReminder(state);const routine=state.studyRoutineMode.mode;
 function chooseMode(mode:StudyRoutineModeSettings["mode"]){update((current)=>setStudyRoutineMode(current,mode))}
 function pin(){if(selected)update((current)=>pinLearningTask(current,selected))}
 return <section className="daily-focus-tools" data-focus-tools-policy="guidance-focus-tools-v1">
  <header><Sparkles size={20}/><div><small lang="de" dir="ltr">Mein Tagesmodus</small><h2>اختر مدخل اليوم دون إلغاء توصية المدرب</h2><p>الاختيار يغير نقطة الدخول فقط؛ التوصية الرئيسية والأدلة والبوابات تبقى ظاهرة.</p></div></header>
  <div className="routine-mode-grid" data-routine-mode-policy="learner-selected-morning-evening-mode-v1">{modes.map((mode)=><button type="button" key={mode.id} className={routine===mode.id?"active":""} aria-pressed={routine===mode.id} onClick={()=>chooseMode(mode.id)}>{mode.id==="morning-quick"?<Sunrise size={16}/>:mode.id==="evening-calm-review"?<Sunset size={16}/>:<RotateCcw size={16}/>}<span><b>{mode.title}</b><small lang="de" dir="ltr">{mode.de}</small><em>{mode.detail}</em></span></button>)}</div>
  {routine!=="auto"&&<aside className="routine-mode-action"><div>{routine==="morning-quick"?<Sunrise size={17}/>:<Sunset size={17}/>}<p><strong>{routine==="morning-quick"?"مدخل الصباح جاهز":"مدخل المساء جاهز"}</strong>{routine==="morning-quick"?"خمس دقائق على أضعف هدف الآن، بلا فتح جلسة طويلة.":"مراجعة هادئة فقط؛ لا نضيف درسًا أو دين وقت."}</p></div><Link href={routine==="morning-quick"?quick.href:"/review"}>{routine==="morning-quick"?"ابدأ خمس دقائق":"ابدأ مراجعة المساء"}</Link></aside>}
  <div className="focus-tool-grid">
   <article className="quick-practice-card" data-quick-practice-policy={quick.policyVersion}><header><Clock3 size={17}/><div><small>أضعف دليل حالي</small><strong>{quick.titleAr}</strong><span lang="de" dir="ltr">{quick.titleDe}</span></div><b>5 د</b></header><p>{quick.reasonAr}</p><ol>{quick.steps.map((step)=><li key={step.minute+step.labelAr}><b>{step.minute}د</b>{step.labelAr}</li>)}</ol><Link href={quick.href}>ابدأ Quick Practice</Link></article>
   <article className="pinned-task-card" data-pinned-task-policy="learner-pinned-task-v1"><header><Pin size={17}/><div><small>مهمة مثبتة يدويًا</small><strong>{state.pinnedLearningTask?.titleAr??"لا توجد مهمة مثبتة"}</strong>{state.pinnedLearningTask&&<span lang="de" dir="ltr">{state.pinnedLearningTask.titleDe}</span>}</div></header>{state.pinnedLearningTask?<><p>{state.pinnedLearningTask.objective}</p><div><Link href={state.pinnedLearningTask.href}>افتح المثبتة</Link><button type="button" onClick={()=>update(clearPinnedLearningTask)}><Trash2 size={14}/> أزل التثبيت</button></div></>:<><label>اختر من خطة اليوم<select value={selected?.id??""} onChange={(event)=>setSelectedId(event.target.value)}>{eligible.map((block)=><option key={block.id} value={block.id}>{block.titleAr}</option>)}</select></label><button type="button" disabled={!selected} onClick={pin}><Bookmark size={14}/> ثبّت المهمة</button></>}<footer>التثبيت لا يستبدل توصية المدرب ولا يكمل المهمة.</footer></article>
   <article className="countdown-card" data-exam-countdown-policy={countdown.policyVersion}><header><CalendarClock size={17}/><div><small>{countdown.daysRemaining===null?"بدون تاريخ":`${countdown.daysRemaining} يومًا متبقيًا`}</small><strong>{countdown.titleAr}</strong></div></header><p>{countdown.actionAr}</p>{countdown.targetDate&&<span>التاريخ المستهدف: {countdown.targetDate}</span>}<footer>12/8/4/1 أسابيع للتخطيط فقط؛ لا يوجد احتمال نجاح أو حكم رسمي.</footer></article>
   <article className="what-if-card" data-extra-time-policy={whatIf.policyVersion}><header><Clock3 size={17}/><div><small>ماذا لو؟ محلي الحساب</small><strong>30 دقيقة إضافية أسبوعيًا</strong></div></header><p>{whatIf.messageAr}</p>{whatIf.status==="calculated"&&<div><span><b>{whatIf.baselineWeeks}</b> أساس</span><span><b>{whatIf.extraWeeks}</b> مع الإضافة</span><span><b>{whatIf.weeksDifference}</b> فرق أسابيع</span></div>}<footer>لا يغير خطتك تلقائيًا ولا يتنبأ بتاريخ نجاح.</footer></article>
  </div>
  {backup.show&&<aside className="level-backup-reminder" data-level-backup-policy={backup.policyVersion}><ShieldCheck size={18}/><p><strong>نسخة احتياطية بعد {backup.level}</strong>{backup.reasonAr}</p><Link href="/settings">صدّر DWNB الآن</Link></aside>}
 </section>;
}
