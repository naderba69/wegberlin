import { Lightbulb, ShieldAlert } from "lucide-react";
import {
  analyzeGermanGrammarSignals,
  GERMAN_GRAMMAR_SIGNALS_POLICY,
  gradeableFindings,
} from "@/core/writing/german-grammar-signals";

/**
 * Shows the expanded local checker: what it decided, what it refused to decide,
 * and how much of the text it could settle. It deliberately renders no score,
 * no percentage, and no "errors found" headline number — a pattern list is a
 * first pass, not a verdict.
 */
export function WritingGrammarSignalsPanel({ text }: { text: string }) {
  const report = analyzeGermanGrammarSignals({ text });
  // `gradeableFindings` is the single definition of what may be presented as a
  // finding; the UI must not grow its own copy of that rule.
  const proven = gradeableFindings(report);
  const probable = report.findings.filter((finding) => !proven.includes(finding));
  return (
    <section className="writing-grammar-signals" data-writing-grammar-signals={GERMAN_GRAMMAR_SIGNALS_POLICY}>
      <header>
        <h3>الفحص المحلي الموسّع</h3>
        <p>
          يعمل بلا شبكة وبلا مفتاح: {report.coverage.sentences} جملة، حُسمت {report.coverage.settledSentences} منها بأنماط
          مؤكدة، ومعجم أسماء المنهج {report.coverage.lexiconNouns} مدخلًا وأفعال بحروف جر {report.coverage.verbFrames}.
        </p>
      </header>
      {proven.length > 0 && (
        <ul className="writing-grammar-signals-findings">
          {proven.map((finding) => (
            <li key={finding.key}>
              <strong>{finding.signalId}</strong>
              <blockquote lang="de" dir="ltr">{finding.excerpt}</blockquote>
              {finding.suggestionDe ? (
                <p className="writing-grammar-signals-fix"><Lightbulb size={13} aria-hidden="true" /> <code dir="ltr" data-bidi-scope="technical" lang="de">{finding.suggestionDe}</code></p>
              ) : (
                <p className="writing-grammar-signals-fix"><Lightbulb size={13} aria-hidden="true" /> لا يقترح الفحص صيغة جاهزة هنا؛ رتّب الجملة بنفسك حسب القاعدة.</p>
              )}
              <p>{finding.explanationAr}</p>
            </li>
          ))}
        </ul>
      )}
      {probable.length > 0 && (
        <ul className="writing-grammar-signals-probable">
          {probable.map((finding) => (
            <li key={finding.key}>
              <strong>يحتاج تأكيدك</strong>
              <blockquote lang="de" dir="ltr">{finding.excerpt}</blockquote>
              <p>{finding.explanationAr}</p>
            </li>
          ))}
        </ul>
      )}
      {report.unresolved.length > 0 && (
        <details className="writing-grammar-signals-unresolved" open>
          <summary>ما عجز الفحص المحلي عن حسمه ({report.unresolved.length})</summary>
          <ul>
            {report.unresolved.slice(0, 6).map((entry) => (
              <li key={entry.key}>
                <blockquote lang="de" dir="ltr">{entry.excerpt}</blockquote>
                <p>{entry.reasonAr}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      <footer className="writing-grammar-signals-boundary">
        <ShieldAlert size={15} aria-hidden="true" />
        <p>
          الأنماط مكتوبة في هذا التطبيق وليست موثّقة بشريًا مقابل مرجع نحوي رسمي؛ لا يمكن اعتبار النص خاليًا من الأخطاء
          لأن الفحص لم يجد نمطًا معروفًا. النقاط أعلاه تُعرض للمراجعة الذاتية، وزرّ استشارة Gemini اختياري لها فقط.
        </p>
      </footer>
    </section>
  );
}
