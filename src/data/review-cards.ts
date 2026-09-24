import { academicLessonList } from "./academic-lessons";
import { buildLessonSrsCards } from "@/core/srs/lesson-cards";

export const reviewCards = academicLessonList.flatMap(buildLessonSrsCards);
