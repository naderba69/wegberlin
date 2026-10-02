"use client";

import { EyeOff, RotateCcw, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { DEFAULT_MOTIVATION_PREFERENCES, GAMIFICATION_VISIBILITY_POLICY, motivationPreferencesAreDefault } from "@/core/coach/motivation-preferences";
import { useLearning } from "./learning-provider";

export function MotivationPreferencesControl(){
  const{state,update}=useLearning();
  const preferences=state.motivationPreferences;
  function setVisible(gamificationVisible:boolean){update((current)=>({...current,motivationPreferences:{policyVersion:GAMIFICATION_VISIBILITY_POLICY,gamificationVisible}}))}
  function reset(){update((current)=>({...current,motivationPreferences:DEFAULT_MOTIVATION_PREFERENCES}))}
  return <section className="settings-card motivation-preferences-card" data-motivation-policy={GAMIFICATION_VISIBILITY_POLICY}>
    <div className="settings-title"><span>{preferences.gamificationVisible?<Sparkles size={20}/>:<EyeOff size={20}/>}</span><div><h2>أسلوب التحفيز</h2><p>اختر واجهة تحفيزية أو هادئة دون تغيير أي دليل تعلم.</p></div></div>
    <div className="motivation-mode-choice" role="group" aria-label="إظهار أو إخفاء عناصر Gamification">
      <button className={preferences.gamificationVisible?"active":""} aria-pressed={preferences.gamificationVisible} onClick={()=>setVisible(true)}><Trophy size={18}/><span><b>واجهة تحفيزية</b><small>إنجازات دليلية وسلسلة ومدح سلوكي.</small></span></button>
      <button className={!preferences.gamificationVisible?"active quiet":"quiet"} aria-pressed={!preferences.gamificationVisible} onClick={()=>setVisible(false)}><EyeOff size={18}/><span><b>واجهة هادئة بالكامل</b><small>تخفي الإنجازات والسلسلة والمدح والزخارف التحفيزية.</small></span></button>
    </div>
    <div className="motivation-preview" data-preview-mode={preferences.gamificationVisible?"visible":"hidden"}>
      {preferences.gamificationVisible?<><span><Trophy size={17}/></span><div><strong>مثال إنجاز مشتق من دليل</strong><small>4/4 مراجعات مؤجلة ناجحة · دون نقاط إضافية</small></div></>:<><span><EyeOff size={17}/></span><div><strong>الوضع الهادئ مفعل</strong><small>تبقى المهمة، الشروط، النتائج والتنبيهات الوظيفية فقط.</small></div></>}
    </div>
    <div className="privacy-note"><ShieldCheck size={17}/><p>الإخفاء فوري ومحلي ولا يحذف الأدلة ولا يخفض الإتقان أو الاستمرارية الفعلية. لا عقوبة ولا Dark pattern لإعادة التشغيل.</p></div>
    <button className="secondary-button" disabled={motivationPreferencesAreDefault(preferences)} onClick={reset}><RotateCcw size={15}/> إعادة إظهار الوضع الافتراضي</button>
  </section>;
}
