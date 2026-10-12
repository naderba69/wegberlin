"use client";

import { useMemo } from "react";
import { Brain } from "lucide-react";
import { useLearning } from "./learning-provider";
import { academicLessonList } from "@/data/academic-lessons";
import {
  KNOWLEDGE_TRACING_MIN_OBSERVATIONS,
  KNOWLEDGE_TRACING_POLICY,
  buildKnowledgeTracingReport,
} from "@/core/evidence/knowledge-tracing";

const MAX_ROWS = 8;

/**
 * لوحة تتبّع المعرفة على `/progress` (P2-349).
 * تقدير محلي من محاولات التمرين فقط، يظهر بعد حدٍّ أدنى من المحاولات لكل درس.
 * ليس توقّعًا لنتيجة امتحان ولا مستوى CEFR؛ الأضعف يظهر أولًا.
 */
export function KnowledgeTracingPanel() {
  const { state } = useLearning();
  const report = useMemo(() => buildKnowledgeTracingReport(state), [state]);
  const titles = useMemo(() => new Map(academicLessonList.map((lesson) => [lesson.id, lesson.titleAr])), []);

  const withEstimate = report.estimates
    .filter((item) => item.status === "estimate")
    .sort((left, right) => (left.pKnownPercent ?? 0) - (right.pKnownPercent ?? 0));

  return (
    <section className="knowledge-tracing-card" data-knowledge-tracing-policy={KNOWLEDGE_TRACING_POLICY}>
      <header>
        <Brain size={18} />
        <div>
          <small>تتبّع المعرفة المحلي</small>
          <h2>تقدير من تمارينك، لا توقّع للامتحان.</h2>
        </div>
        <strong>{report.lessonsWithEstimate} درس</strong>
      </header>
      <p>{report.boundary}</p>
      {withEstimate.length === 0 ? (
        <p data-knowledge-tracing-empty="true">
          لا يظهر تقدير لأي درس بعد. يحتاج كل درس إلى {KNOWLEDGE_TRACING_MIN_OBSERVATIONS} محاولات تمرين على الأقل. حاليًا عند {report.lessonsInsufficient} درس/دروس بيانات غير كافية.
        </p>
      ) : (
        <ol className="knowledge-tracing-list">
          {withEstimate.slice(0, MAX_ROWS).map((item) => (
            <li key={item.lessonId} data-knowledge-tracing-lesson={item.lessonId}>
              <span>{titles.get(item.lessonId) ?? item.lessonId}</span>
              <b>{item.pKnownPercent}%</b>
              <small>{item.correct} صحيحة من {item.observations} محاولة</small>
            </li>
          ))}
        </ol>
      )}
      <footer>المعاملات ثابتة بسياسة `{KNOWLEDGE_TRACING_POLICY}` ولم تُعاير على بياناتك، ولا تُرسل إلى أي خادم.</footer>
    </section>
  );
}
