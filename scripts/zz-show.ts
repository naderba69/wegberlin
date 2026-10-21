import { academicLessonList as lessons } from "../src/data/academic-lessons";
for (const id of process.argv.slice(2)) { const l = lessons.find((x) => x.id === id)!; console.log("==", id, l.titleAr ?? "", "\nDE:", l.reading.textDe, "\nAR:", l.reading.textAr, "\nQ:", JSON.stringify(l.reading.questions.map((q: any) => q.promptDe ?? q.promptAr)), "\nGLOSS:", l.reading.glossary.length); }
