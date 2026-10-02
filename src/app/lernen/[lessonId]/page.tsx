import { notFound } from "next/navigation";
import { LessonRunner } from "@/components/lesson-runner";
import { curriculum, lessonById } from "@/data/curriculum";
import { academicLessons } from "@/data/academic-lessons";

export function generateStaticParams() {
  return curriculum.filter((lesson) => lesson.status === "published").map((lesson) => ({ lessonId: lesson.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lessonMeta = lessonById(lessonId);
  const lesson = academicLessons[lessonId];
  if (!lessonMeta || lessonMeta.status !== "published" || !lesson) notFound();
  const publishedInLevel = curriculum.filter((item) => item.level === lesson.level && item.status === "published");
  const currentIndex = publishedInLevel.findIndex((item) => item.id === lessonId);
  const nextLessonId = currentIndex >= 0 ? publishedInLevel[currentIndex + 1]?.id : undefined;
  return <LessonRunner lesson={lesson} nextLessonId={nextLessonId} />;
}
