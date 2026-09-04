import { describe,expect,it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";
import { curriculum } from "@/data/curriculum";
import { LESSON_STAGE_KEYS } from "@/types/lesson-content";
import { compareAccepted,evaluateExercise,normalizeGermanText } from "@/core/lesson/evaluate";
import { buildLessonSrsCards,lessonInteractiveItemCount } from "@/core/srs/lesson-cards";

describe("published academic lesson integrity",()=>{
  it("registers every published lesson exactly once",()=>{
    const published=curriculum.filter((lesson)=>lesson.status==="published");
    expect(academicLessonList).toHaveLength(84);
    expect(published.map((lesson)=>lesson.id)).toEqual(academicLessonList.map((lesson)=>lesson.id));
  });
  it("uses the canonical 14-stage flow",()=>expect(LESSON_STAGE_KEYS).toHaveLength(14));
  it("has globally unique content ids",()=>{
    const ids=academicLessonList.flatMap((lesson)=>[
      lesson.id,...lesson.theory.map((x)=>x.id),...lesson.exercises.map((x)=>x.id),
      ...lesson.reading.questions.map((x)=>x.id),...lesson.listening.questions.map((x)=>x.id),
      ...lesson.miniTest.map((x)=>x.id),...lesson.flashcards.map((x)=>x.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("keeps every glossary surface form in its reading",()=>{
    for(const lesson of academicLessonList){for(const item of lesson.reading.glossary){expect(lesson.reading.textDe.toLocaleLowerCase("de-DE")).toContain(item.surfaceForm.toLocaleLowerCase("de-DE"));}}
  });
  it("contains substantial multi-skill content",()=>{
    for(const lesson of academicLessonList){expect(lesson.objectives.length).toBeGreaterThanOrEqual(4);expect(lesson.phrases.length).toBeGreaterThanOrEqual(12);expect(lesson.exercises.length).toBeGreaterThanOrEqual(7);expect(new Set(lesson.exercises.map((x)=>x.type)).size).toBeGreaterThanOrEqual(5);expect(lesson.mistakes.length).toBeGreaterThanOrEqual(4);expect(lesson.miniTest.length).toBeGreaterThanOrEqual(5);expect(lesson.flashcards.length).toBeGreaterThanOrEqual(10);}
  });
  it("publishes explicit memory tricks for every rule, pronunciation focus, and common error",()=>{
    for(const lesson of academicLessonList){
      expect(lesson.theory.length).toBeGreaterThan(0);
      for(const block of lesson.theory) expect(block.trickAr.trim().length).toBeGreaterThanOrEqual(12);
      expect(lesson.pronunciation.trickAr.trim().length).toBeGreaterThanOrEqual(12);
      for(const mistake of lesson.mistakes) expect(mistake.trickAr.trim().length).toBeGreaterThanOrEqual(5);
    }
  });
  it("validates every MCQ answer index and unique option set",()=>{
    const questions=academicLessonList.flatMap((lesson)=>[...lesson.reading.questions,...lesson.listening.questions,...lesson.miniTest]);
    for(const question of questions){expect(question.options).toHaveLength(4);expect(new Set(question.options).size).toBe(4);expect(question.correctIndex).toBeGreaterThanOrEqual(0);expect(question.correctIndex).toBeLessThan(4);}
  });
  it("guarantees a visible task surface for every controlled exercise",()=>{for(const lesson of academicLessonList){for(const exercise of lesson.exercises){expect(exercise.promptAr.trim().length,exercise.id).toBeGreaterThanOrEqual(4);if(exercise.type==="multiple-choice"){expect(exercise.options.every((option)=>option.trim().length>0),exercise.id).toBe(true)}else if(exercise.type==="fill-blank"){expect(exercise.template,exercise.id).toContain("___");expect(exercise.acceptedAnswers.every((answer)=>answer.trim().length>0),exercise.id).toBe(true)}else if(exercise.type==="word-ordering"){expect(exercise.words.length,exercise.id).toBeGreaterThanOrEqual(2)}else if(exercise.type==="error-correction"){expect(exercise.sentence.trim().length,exercise.id).toBeGreaterThanOrEqual(4)}else{expect(exercise.pairs.length,exercise.id).toBeGreaterThanOrEqual(2)}}}});
  it("builds a balanced 48-item A1 level bank",()=>{
    const a1=academicLessonList.filter((lesson)=>lesson.level==="A1");
    const bank=a1.flatMap((lesson)=>lesson.miniTest.slice(0,2));
    expect(a1).toHaveLength(24);
    expect(bank).toHaveLength(48);
    for(let moduleNumber=1;moduleNumber<=8;moduleNumber+=1) expect(a1.filter((lesson)=>lesson.module===moduleNumber).flatMap((lesson)=>lesson.miniTest.slice(0,2))).toHaveLength(6);
  });
  it("builds a balanced 48-item A2 level bank",()=>{
    const a2=academicLessonList.filter((lesson)=>lesson.level==="A2");
    const bank=a2.flatMap((lesson)=>lesson.miniTest.slice(0,2));
    expect(a2).toHaveLength(24);
    expect(bank).toHaveLength(48);
    for(let moduleNumber=1;moduleNumber<=8;moduleNumber+=1) expect(a2.filter((lesson)=>lesson.module===moduleNumber).flatMap((lesson)=>lesson.miniTest.slice(0,2))).toHaveLength(6);
  });
  it("builds a balanced 48-item B1 level bank",()=>{
    const b1=academicLessonList.filter((lesson)=>lesson.level==="B1");
    const bank=b1.flatMap((lesson)=>lesson.miniTest.slice(0,2));
    expect(b1).toHaveLength(24);
    expect(bank).toHaveLength(48);
    for(let moduleNumber=1;moduleNumber<=8;moduleNumber+=1) expect(b1.filter((lesson)=>lesson.module===moduleNumber).flatMap((lesson)=>lesson.miniTest.slice(0,2))).toHaveLength(6);
  });
  it("builds a balanced 48-item B2 final bank",()=>{
    const b2=academicLessonList.filter((lesson)=>lesson.level==="B2");
    const bank=b2.flatMap((lesson)=>lesson.miniTest.slice(0,4));
    expect(b2).toHaveLength(12);
    expect(bank).toHaveLength(48);
    for(let moduleNumber=1;moduleNumber<=6;moduleNumber+=1) expect(b2.filter((lesson)=>lesson.module===moduleNumber).flatMap((lesson)=>lesson.miniTest.slice(0,4))).toHaveLength(8);
  });
  it("delivers 18 interactive items and 16–24 deduplicated SRS cards per published lesson",()=>{
    for(const lesson of academicLessonList){expect(lessonInteractiveItemCount(lesson)).toBeGreaterThanOrEqual(18);expect(buildLessonSrsCards(lesson).length).toBeGreaterThanOrEqual(16);expect(buildLessonSrsCards(lesson).length).toBeLessThanOrEqual(24);}
  });
});

describe("exercise evaluation",()=>{
  it("normalizes punctuation without losing umlauts",()=>{expect(normalizeGermanText("  Wie heißt du? ")).toBe("wie heißt du");expect(normalizeGermanText("heißt")).not.toBe(normalizeGermanText("heisst"));});
  it("accepts explicit orthographic variants only",()=>{expect(compareAccepted("Wie heißt du?",["Wie heißt du"])).toBe(true);expect(compareAccepted("heisst",["heißt"])).toBe(false);});
  it("evaluates matching maps",()=>{const exercise=academicLessonList[0].exercises.find((item)=>item.type==="matching");expect(exercise&&evaluateExercise(exercise,Object.fromEntries(exercise.pairs.map((pair)=>[pair.left,pair.right])))).toBe(true);});
});
