"use client";

import Link from "next/link";
import { FilePenLine, Printer, ShieldCheck } from "lucide-react";
import { academicLessons } from "@/data/academic-lessons";
import { buildWritingPortfolio } from "@/core/writing/portfolio";
import { useLearning } from "./learning-provider";
import { WritingVersionDiff } from "./writing-version-diff";
import { WritingVocabularyExtractor } from "./writing-vocabulary-extractor";
import { StyleAlternativePractice } from "./style-alternative-practice";

function writingTaskLabel(taskId: string) {
  const lesson = academicLessons[taskId];
  if (lesson) return `${lesson.level} · ${lesson.titleAr}`;
  if (taskId.includes("goethe")) return "مهمة كتابة Goethe";
  if (taskId.includes("telc")) return "مهمة كتابة telc";
  return "مهمة كتابة شخصية";
}

const statusLabel = {
  draft: "مسودة",
  submitted: "مراجعة أولى",
  revised: "نسخة منقحة",
} as const;

export function WritingPortfolio() {
  const { state } = useLearning();
  const portfolio = buildWritingPortfolio(state.writingSubmissions);
  return (
    <div className="wide-page writing-portfolio-page" data-writing-portfolio-policy={portfolio.policyVersion}>
      <header className="page-heading">
        <div>
          <span className="eyebrow"><FilePenLine size={15} /> ملف أعمال محلي</span>
          <h1>تطور كتابتك <em>نسخة بعد نسخة</em></h1>
          <p>يجمع أحدث نسخة لكل مهمة مع الفروق ومؤشرات الأنماط المحلية. لا توجد درجة رسمية ولا ادعاء باكتشاف كل خطأ.</p>
        </div>
        <button className="print-button" type="button" onClick={() => window.print()}><Printer size={15} /> اطبع التقرير</button>
      </header>

      <section className="portfolio-summary">
        <article><small>المهام</small><strong>{portfolio.summary.taskCount}</strong></article>
        <article><small>النسخ</small><strong>{portfolio.summary.versionCount}</strong></article>
        <article><small>كلمات أحدث النسخ</small><strong>{portfolio.summary.words}</strong></article>
        <article><small>أنماط محلية / 100 كلمة</small><strong>{portfolio.summary.detectedPatternsPer100Words ?? "—"}</strong></article>
      </section>
      <p className="portfolio-rate-boundary"><ShieldCheck size={16} /> المعدل يحسب فقط الأنماط الحتمية المحدودة التي يستطيع المشروع إثباتها في أحدث نسخة، مثل تصريفات مؤلفة بعينها وبداية الجملة. لا يساوي جميع الأخطاء ولا يقارن المتعلم بآخرين.</p>

      {portfolio.entries.length ? (
        <div className="portfolio-entries">
          {portfolio.entries.map((entry) => (
            <article key={entry.taskId}>
              <header>
                <div>
                  <small>{writingTaskLabel(entry.taskId)}</small>
                  <strong>النسخة {entry.latest.version} · {statusLabel[entry.latest.status]}</strong>
                </div>
                <span>{entry.latest.wordCount} كلمة · {entry.detectedPatternCount} نمط محلي</span>
              </header>
              <blockquote lang="de" dir="ltr">{entry.latest.text}</blockquote>
              <WritingVocabularyExtractor submission={entry.latest} />
              {/(?:b1|b2|goethe|telc)/i.test(entry.taskId) && <StyleAlternativePractice text={entry.latest.text} />}
              {entry.source && <WritingVersionDiff before={entry.source.text} after={entry.latest.text} />}
              <footer>
                {entry.detectedPatterns.length
                  ? entry.detectedPatterns.map((pattern) => <span key={`${pattern.patternId}:${pattern.sourceExcerpt}`}>{pattern.explanationAr}</span>)
                  : <span>لم تطابق النسخة الأنماط المحلية المحدودة؛ هذا لا يثبت خلوها من الأخطاء.</span>}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <section className="portfolio-empty">
          <p>لا توجد كتابة محفوظة بعد. ابدأ بمهمة موجهة ثم عد لرؤية النسخ والفروق.</p>
          <Link href="/writing">ابدأ مهمة كتابة</Link>
        </section>
      )}
    </div>
  );
}
