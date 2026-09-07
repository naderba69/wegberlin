import { describe, expect, it } from "vitest";
import {
  BIDI_POLICY_VERSION,
  classifyLatinRun,
  isGermanRun,
  isolateSegments,
  latinRunCount,
  splitMixedRuns,
} from "@/core/a11y/bidi";
import { academicLessonList } from "@/data/academic-lessons";

const arabicWithTerms = "تروي ما حدث أمس باستعمال Perfekt، وتختار haben أو sein.";

describe("P0-254: systematic bidi isolation for every mixed fragment", () => {
  it("splits an Arabic sentence into its Latin runs without losing a character", () => {
    const runs = splitMixedRuns(arabicWithTerms);
    expect(runs.filter((run) => run.latin).map((run) => run.text)).toEqual(["Perfekt", "haben", "sein"]);
    // إعادة تجميع الـRuns تعيد النص الأصلي حرفيًا: لا فقدان ولا تعديل على المحتوى.
    expect(runs.map((run) => run.text).join("")).toBe(arabicWithTerms);
    expect(latinRunCount(arabicWithTerms)).toBe(3);
  });

  it("marks German terms with lang=de and isolates technical terms without claiming German", () => {
    const segments = isolateSegments(arabicWithTerms);
    for (const segment of segments.filter((item) => item.isolate)) {
      expect(segment.german, segment.text).toBe(true);
    }
    const technical = isolateSegments("تقدمك في IndexedDB. مفتاح AI يبقى في Session Storage");
    for (const segment of technical.filter((item) => item.isolate)) {
      expect(segment.german, segment.text).toBe(false);
    }
  });

  it("classifies the German signals: stopwords, umlauts, and multi-word phrases", () => {
    expect(isGermanRun("Perfekt")).toBe(true);
    expect(isGermanRun("Dativ")).toBe(true);
    expect(isGermanRun("Partizip II")).toBe(true);
    expect(isGermanRun("weil das Verb am Ende steht")).toBe(true);
    expect(isGermanRun("schöne Grüße")).toBe(true);
    expect(isGermanRun("IndexedDB")).toBe(false);
    // الإنجليزية إنجليزية: لا تُوسم ألمانية فيُقرأها قارئ الشاشة بصوت ألماني.
    expect(classifyLatinRun("Terms and Conditions for Exam Administration")).toBe("en");
    expect(classifyLatinRun("official examination overview")).toBe("en");
    expect(classifyLatinRun("Goethe-Zertifikat B2 Modellsatz Erwachsene")).toBe("de");
    // الكلمات الألمانية التي تشبه الإنجليزية (`die These`, `er will`) لا تُخطَف.
    expect(classifyLatinRun("begrenzte These formulieren")).toBe("de");
    expect(isolateSegments("بنية الوحدات: exam modules overview").filter((s) => s.isolate)[0]?.lang).toBe("en");
    // الأرقام جزء من الرمز: `MP3` رمز تقني واحد، وليس `MP` مبتورة تُوسم ألمانية.
    expect(splitMixedRuns("صوت MP3 الإضافي").filter((run) => run.latin).map((run) => run.text)).toEqual(["MP3"]);
    expect(isGermanRun("MP3")).toBe(false);
    expect(isGermanRun("SM-2")).toBe(false);
    // مبنى Build/Bundle وبصمات المفاتيح: عشوائية لا ألمانية.
    expect(isGermanRun("cFTtHe")).toBe(false);
    // معرّف بناء كامل لا يُبتور إلى `Build ZJp2` تُصنَّف ألمانية.
    expect(isGermanRun("Build ZJp2_7oMTn-H0kta_PwRT")).toBe(false);
    expect(isGermanRun("TTpllUBzKUBFE")).toBe(false);
    // …لكن الأسماء الألمانية المركّبة تبقى ألمانية ولا يبتلعها كاشف العشوائية.
    expect(isGermanRun("Goethe-Institut")).toBe(true);
    expect(isGermanRun("Goethe-Zertifikat B2")).toBe(true);
    expect(isGermanRun("Modellsatz Erwachsene")).toBe(true);
    expect(isGermanRun("Lesen")).toBe(true);
    expect(isGermanRun("Goethe")).toBe(false);
    expect(isGermanRun("Shadowing")).toBe(false);
  });

  it("leaves purely Arabic text untouched", () => {
    const text = "اقرأ النص ثم أجب عن السؤال.";
    expect(isolateSegments(text)).toEqual([{ text, isolate: false, german: false, lang: null }]);
  });

  it("covers every mixed fragment in the authored lesson content", () => {
    // التدقيق المنهجي: لا عينات. كل نص عربي مؤلف يحوي Runs لاتينية يُخطَّط لعزلها كلها.
    let mixed = 0;
    let runs = 0;
    for (const lesson of academicLessonList) {
      const strings = [
        ...lesson.objectives.map((item) => item.ar),
        ...lesson.theory.flatMap((block) => [block.explanationAr, block.contrastAr, block.trickAr]),
        ...lesson.mistakes.flatMap((item) => [item.whyAr, item.trickAr]),
        ...lesson.exercises.flatMap((item) => [item.promptAr, item.explanationAr]),
        ...lesson.discovery.questionsAr,
        ...lesson.entry.dialogue.map((line) => line.ar),
      ];
      for (const text of strings) {
        const count = latinRunCount(text);
        if (count === 0) continue;
        mixed += 1;
        runs += count;
        const isolated = isolateSegments(text).filter((segment) => segment.isolate).length;
        expect(isolated, `${lesson.id}: ${text.slice(0, 40)}`).toBe(count);
        expect(isolateSegments(text).map((segment) => segment.text).join("")).toBe(text);
      }
    }
    expect(mixed).toBeGreaterThan(400);
    expect(runs).toBeGreaterThan(600);
    expect(BIDI_POLICY_VERSION).toBe("bidi-isolation-v1");
  });
});
