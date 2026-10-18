import Link from "next/link";
import { Footprints } from "lucide-react";
import { LESSON_PREREQUISITE_POLICY, resolveLessonPrerequisites } from "@/core/lesson/lesson-prerequisites";

/** ADR-124: «على ماذا يبني الدرس؟» — روابط مؤلفة إلى كتل شرح سابقة بعينها، للرجوع إليها لا لقفل شيء. */
export function LessonPrerequisitePanel({ lessonId }: { lessonId: string }) {
  const links = resolveLessonPrerequisites(lessonId);
  if (!links.length) return null;
  return (
    <section className="lesson-prerequisite-panel" data-lesson-prerequisite-policy={LESSON_PREREQUISITE_POLICY} aria-labelledby={`prerequisites-${lessonId}`}>
      <header>
        <span><Footprints size={18} aria-hidden="true" /></span>
        <h2 id={`prerequisites-${lessonId}`}>يبني هذا الدرس على</h2>
      </header>
      <ul>
        {links.map((link) => (
          <li key={link.theoryId}>
            <Link href={`/lernen/${link.lessonId}`}>
              <strong>{link.theoryTitleAr}</strong>
              <small><span lang="de" dir="ltr">{link.theoryTitleDe}</span> · {link.lessonTitleAr}</small>
            </Link>
            <p>{link.reasonAr}</p>
          </li>
        ))}
      </ul>
      <footer>إن بدا الشرح السابق غريبًا فراجعه أولًا. هذا ربط تعليمي، لا شرط إتقان ولا قفل.</footer>
    </section>
  );
}
