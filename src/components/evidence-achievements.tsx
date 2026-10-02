import { Check, LockKeyhole, ShieldCheck, Trophy } from "lucide-react";
import type { LearningState } from "@/types/learning";
import { achievementSummary, EVIDENCE_ACHIEVEMENT_POLICY } from "@/core/coach/achievements";

export function EvidenceAchievements({state}:{state:LearningState}){
  const summary=achievementSummary(state);
  return <section className="evidence-achievements gamification-surface" data-achievement-policy={EVIDENCE_ACHIEVEMENT_POLICY}>
    <header><span><Trophy size={21}/></span><div><small lang="de" dir="ltr">Nachweise statt Klicks</small><h2>إنجازات مشتقة من أدلتك</h2><p>لا تُفتح بزيارة صفحة أو تكرار نقرة، ولا تضيف mastery أو شهادة.</p></div><strong>{summary.unlocked}/{summary.total}</strong></header>
    <div>{summary.achievements.map((achievement)=><article key={achievement.id} data-achievement={achievement.id} className={achievement.unlocked?"unlocked":"locked"}>
      <span>{achievement.unlocked?<Check size={16}/>:<LockKeyhole size={15}/>}</span>
      <div><small lang="de" dir="ltr">{achievement.titleDe}</small><h3>{achievement.titleAr}</h3><p>{achievement.descriptionAr}</p><div><i><b style={{width:`${achievement.progressPercent}%`}}/></i><strong>{achievement.current}/{achievement.target}</strong></div><footer><ShieldCheck size={13}/>{achievement.evidenceLabelAr} · تحفيز داخلي غير رسمي</footer></div>
    </article>)}</div>
    <p className="achievement-boundary">تُعاد الحسابات من الأدلة الأصلية في كل فتح؛ لا نخزن «شارة» منفصلة يمكن أن تبقى بعد حذف الدليل.</p>
  </section>;
}
