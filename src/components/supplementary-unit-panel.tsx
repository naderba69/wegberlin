"use client";

import { useMemo } from "react";
import { Layers, TriangleAlert } from "lucide-react";
import {
  SUPPLEMENTARY_UNIT_BOUNDARY_AR,
  SUPPLEMENTARY_UNIT_POLICY,
  buildGoalCoverage,
  coverageAfterPlan,
  goalCoverageSummary,
  planSupplementaryUnits,
} from "@/core/content-validation/supplementary-units";
import { CEFR_GOAL_CLAIM_BOUNDARY_AR } from "@/core/content-validation/cefr-goal-inventory";

/**
 * P2-96 — لوحة «الفجوات والوحدات المكمّلة».
 *
 * للقراءة فقط: تقرأ الجرد المؤلَّف وصلاته المؤلَّفة وتحسب الفجوات، وتعرض خطة الوحدات
 * المكمّلة. لا تكتب في الحالة ولا تنسج محتوى، ولا ترفع أي رقم قبل أن يُكتب الدرس.
 */
export function SupplementaryUnitPanel() {
  const coverage = useMemo(() => buildGoalCoverage(), []);
  const proposals = useMemo(() => planSupplementaryUnits(coverage), [coverage]);
  const summary = useMemo(() => goalCoverageSummary(coverage), [coverage]);
  const afterPlan = useMemo(() => coverageAfterPlan(coverage, proposals), [coverage, proposals]);
  const gapRows = coverage.filter((row) => row.status === "gap");

  return (
    <section
      className="mastery-derivation-card"
      data-supplementary-policy={SUPPLEMENTARY_UNIT_POLICY}
      data-supplementary-goals={summary.goals}
      data-supplementary-covered={summary.covered}
      data-supplementary-gaps={summary.gaps}
      data-supplementary-units={proposals.length}
    >
      <header className="settings-title">
        <span><Layers size={20} /></span>
        <div>
          <h2>هدف غير مغطّى؟ وحدة مكمّلة — لا حشو</h2>
          <p data-supplementary-claim-boundary>{CEFR_GOAL_CLAIM_BOUNDARY_AR}</p>
        </div>
      </header>

      <p>
        من <b>{summary.goals}</b> هدفًا داخليًّا: <b>{summary.covered}</b> مغطّى بدليلٍ في المستوى نفسه ·{" "}
        <b>{summary.gaps}</b> فجوة · صلات مدعومة بالدليل: <b>{summary.evidenceRows}</b>. والتغطية{" "}
        <b>مقيَّدة بالمستوى</b>: هدف A1 لا يُغطّيه درس B2.
      </p>

      <ul data-supplementary-levels>
        {summary.byLevel.map((row) => (
          <li key={row.level} data-supplementary-level={row.level}>
            {row.level}: مغطّى <b>{row.covered}</b>/{row.total} · فجوات <b>{row.gaps}</b>
          </li>
        ))}
      </ul>

      <p data-supplementary-after-plan>
        بعد التخطيط: مغطّى <b>{afterPlan.coveredBefore}</b> (لم يتغيّر) · فجوات <b>{afterPlan.gapsAfterPlanAreStillGaps}</b> (لم تنقص) · أهداف خطّطنا لسدّها:{" "}
        <b>{afterPlan.goalsPlannedForClosure}</b> في <b>{afterPlan.units}</b> وحدة — <b>التخطيط ليس سدًّا</b>.
      </p>

      {gapRows.length > 0 ? (
        <details data-supplementary-gaps-list>
          <summary><TriangleAlert aria-hidden="true" size={15} /> الفجوات المعلنة ({gapRows.length})</summary>
          <div className="content-note-list">
            {gapRows.map((row) => {
              const unit = proposals.find((proposal) => proposal.closesGoalIds.includes(row.goalId));
              return (
                <article key={row.goalId} data-supplementary-gap={row.goalId} data-supplementary-gap-level={row.level}>
                  <span>{row.level}</span>
                  <div>
                    <b dir="auto">{row.canDoAr}</b>
                    <p dir="auto">{row.canDoDe}</p>
                    <p data-supplementary-gap-unit>{unit ? `${unit.unitId} · ${unit.titleAr}` : "بلا وحدة (يُرفض)"}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </details>
      ) : (
        <p data-supplementary-no-gaps>لا فجوة معلنة الآن: كل هدف في الجرد له دليل في مستواه.</p>
      )}

      {proposals.length > 0 && (
        <details data-supplementary-plan>
          <summary>خطة الوحدات المكمّلة ({proposals.length})</summary>
          <div className="content-note-list">
            {proposals.map((proposal) => (
              <article key={proposal.unitId} data-supplementary-unit={proposal.unitId} data-supplementary-unit-status={proposal.status}>
                <span>{proposal.level}</span>
                <div>
                  <b dir="auto">{proposal.titleAr}</b>
                  <p dir="auto">{proposal.titleDe}</p>
                  <p>
                    يسدّ: <b>{proposal.closesGoalIds.join(" · ")}</b> · المراحل المطلوبة: <b>{proposal.stageCount}</b> · بنود: قراءة{" "}
                    {proposal.itemBudget.readingQuestions} · استماع {proposal.itemBudget.listeningQuestions} · تمارين {proposal.itemBudget.exercises} ·
                    اختبار {proposal.itemBudget.miniTest} — <b>الحالة: {proposal.status}</b> (لا محتوى منسوج).
                  </p>
                </div>
              </article>
            ))}
          </div>
        </details>
      )}

      <p data-supplementary-honest-note>{SUPPLEMENTARY_UNIT_BOUNDARY_AR}</p>
    </section>
  );
}
