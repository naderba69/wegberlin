import { BookOpenCheck, Landmark, ShieldAlert, UsersRound } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import { buildLessonClaimBoundary, CLAIM_BOUNDARY_POLICY } from "@/core/governance/claim-boundary";

const icon={"language-rule":BookOpenCheck,"common-practice":UsersRound,"official-requirement":Landmark};

export function ClaimBoundaryPanel({lesson}:{lesson:FullLesson}){
  const boundary=buildLessonClaimBoundary(lesson);
  return <section className="claim-boundary-panel" data-claim-boundary-policy={CLAIM_BOUNDARY_POLICY}>
    <header><span><ShieldAlert size={19}/></span><div><small lang="de" dir="ltr">Was ist eine Regel — und was nicht?</small><h2>افصل اللغة والعرف عن القانون</h2><p>ثلاثة أنواع لا يجوز خلطها. التصنيف إرشاد تعليمي وليس استشارة قانونية.</p></div></header>
    <div>{boundary.cards.map((card)=>{const Icon=icon[card.kind];return <article key={card.kind} data-claim-kind={card.kind}><span><Icon size={18}/></span><div><b lang="de" dir="ltr">{card.labelDe}</b><strong>{card.labelAr}</strong><p>{card.statementAr}</p><small>{card.kind==="language-rule"?"المصدر: كتلة القاعدة المؤلفة داخل هذا الدرس؛ المراجعة اللغوية البشرية النهائية ما زالت مستقلة.":card.kind==="common-practice"?"الحالة: ممارسة سياقية قابلة للاختلاف، لا مصدر قانوني مطلوب لأنها ليست ادعاءً رسميًا.":"الحالة: لا يوجد ادعاء رسمي هنا، لذلك لا نعرض مصدرًا أو موعدًا مختلقًا."}</small></div></article>})}</div>
    {boundary.officialVerificationRequired&&<aside><ShieldAlert size={16}/><p><b>تحقق خارجي مطلوب للحالة الحقيقية:</b> استعمل موقع الجهة المختصة وتاريخها، ولا تعتمد على الحوار التدريبي لإثبات مهلة أو وثيقة أو حق.</p></aside>}
  </section>;
}
