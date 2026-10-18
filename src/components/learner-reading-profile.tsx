import { ScanText } from "lucide-react";
import type { ExerciseAttempt, ReviewEvent } from "@/types/learning";
import { curriculumLexicalContext } from "@/core/german/curriculum-lexical-context";
import { LEARNER_LEXICAL_KNOWLEDGE_POLICY, LEARNER_WORD_STATUSES, profileReadingForLearner, type LearnerReadingWord, type LearnerWordStatus, type ReadingLexiconSeed } from "@/core/evidence/learner-lexical-knowledge";

const MAX_LISTED = 10;

const statusLabels: Record<LearnerWordStatus, string> = {
  struggling: "تعثّرت فيها في آخر محاولة",
  new: "لم تمرّ في دروس أكملتها",
  "taught-only": "مرّت في دروسك دون محاولة استرجاع",
  practised: "نجحت فيها داخل الدرس فقط",
  retrieved: "استرجعتها بعد فاصل زمني",
};

function WordChips({ words, label, status }: { words: LearnerReadingWord[]; label: string; status: LearnerWordStatus }) {
  if (!words.length) return null;
  const shown = words.slice(0, MAX_LISTED);
  return <div className="learner-reading-words" data-word-status={status}>
    <strong>{label}</strong>
    <ul>{shown.map((word) => <li key={word.word} lang="de" dir="ltr">{word.surface}</li>)}</ul>
    {words.length > shown.length && <small>عدد الكلمات الأخرى بالحالة نفسها: {words.length - shown.length}</small>}
  </div>;
}

/**
 * Pre-reading view of the text through this learner's own evidence (ADR-132, م17): which content
 * words they retrieved after a gap, practised only in lessons, failed last time, only met, or never
 * met in a completed lesson. It shows German words without meanings, so it is orientation, not
 * translation support, and opening it records nothing.
 */
export function LearnerReadingProfile({ seed, reviewEvents, exerciseAttempts, completedLessonIds }: { seed: ReadingLexiconSeed; reviewEvents: ReviewEvent[]; exerciseAttempts: ExerciseAttempt[]; completedLessonIds: string[] }) {
  const profile = profileReadingForLearner(seed, { reviewEvents, exerciseAttempts, completedLessonIds }, curriculumLexicalContext());
  if (!profile.contentWords) return null;
  const struggling = profile.words.filter((word) => word.status === "struggling");
  const unseen = profile.words.filter((word) => word.status === "new");
  return <aside className="learner-reading-profile" data-learner-lexical-policy={LEARNER_LEXICAL_KNOWLEDGE_POLICY} aria-labelledby={`learner-reading-profile-${seed.lessonId}`}>
    <header>
      <span><ScanText size={18} /></span>
      <div>
        <h3 id={`learner-reading-profile-${seed.lessonId}`}>كلمات هذا النص كما تظهر في محاولاتك</h3>
        <p>{profile.contentWords} كلمة محتوى، بلا أسماء الأشخاص والأماكن. الحالة مأخوذة من مراجعاتك وأجوبتك الصحيحة المحفوظة على هذا الجهاز؛ هذا تتبّع للأدلة، وليس اختبار مفردات.</p>
      </div>
    </header>
    <ul className="learner-reading-counts">
      {LEARNER_WORD_STATUSES.map((status) => <li key={status} data-word-status={status}><b>{profile.counts[status]}</b><span>{statusLabels[status]}</span></li>)}
    </ul>
    {!profile.hasWordEvidence && <p className="learner-reading-note">لا توجد بعد مراجعة أو إجابة صحيحة تخص كلمات هذا النص، لذلك تعتمد الأرقام على الدروس التي أكملتها فقط.</p>}
    <WordChips words={struggling} status="struggling" label="راجع هذه أولًا؛ آخر محاولة لك فيها لم تنجح:" />
    <WordChips words={unseen} status="new" label="جديدة عليك؛ حاول استنتاجها من الجملة قبل فتح المساعدة:" />
    <p className="learner-reading-note">الخطأ في تمرين لا يُنسب إلى كلمة بعينها، لأن الجواب الخاطئ لا يحدد أي كلمة لم تعرفها.</p>
  </aside>;
}
