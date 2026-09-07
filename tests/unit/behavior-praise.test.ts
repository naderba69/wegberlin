import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BEHAVIOR_PRAISE_VERSION,
  GENERIC_PRAISE_RE,
  allBehaviorPraise,
  examPraise,
  isGenericPraise,
  moduleReviewPraise,
  praiseText,
  reviewPraise,
  speakingPraise,
  todayPraise,
  writingPraise,
} from "@/core/coaching/behavior-praise";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const target = join(dir, name);
    if (statSync(target).isDirectory()) return walk(target);
    return /\.tsx?$/u.test(target) ? [target] : [];
  });

describe("P0-267: unified behavior-specific praise, never generic praise", () => {
  it("names a measured behavior in every dictionary entry and never a generic adjective", () => {
    const entries = allBehaviorPraise();
    expect(entries.length).toBeGreaterThanOrEqual(7);
    const ids = new Set(entries.map((entry) => entry.id));
    expect(ids.size).toBe(entries.length);
    for (const entry of entries) {
      expect(entry.behavior.length, entry.id).toBeGreaterThan(10);
      expect(entry.ar.length, entry.id).toBeLessThan(220);
      // المدح العام ممنوع في كل مدخل، لأنه لا يسمي فعلًا يمكن إعادته.
      expect(isGenericPraise(entry.ar), `${entry.id}: ${entry.ar}`).toBe(false);
      // كل مدخل يقيس شيئًا: رقم أو مدة أو فاصل أو نسخة.
      expect(/\d/u.test(entry.ar), `${entry.id}: لا رقم مقيس في النص`).toBe(true);
    }
  });

  it("detects the generic phrases it bans, and only those", () => {
    for (const text of ["أحسنت", "عمل جيد", "أداء رائع", "ما شاء الله", "استمر هكذا", "ممتازة"]) {
      expect(isGenericPraise(text), text).toBe(true);
    }
    for (const text of [
      "أنهيت 4 من 4 كتل اليوم بميزانية 45 دقيقة كما رتّبتها الخطة",
      "أعدت كتابة النص بعد الملاحظات (النسخة 3)، فاجتاز الآن 4 من 5 محاور",
      "استرجعت هذه البطاقة بعد فاصل 6 يوم عند موعدها",
    ]) {
      expect(isGenericPraise(text), text).toBe(false);
    }
    expect(BEHAVIOR_PRAISE_VERSION).toBe("behavior-praise-v1");
  });

  it("praises today only when every planned block is actually completed", () => {
    expect(todayPraise({ completedBlocks: 4, plannedBlocks: 4, minutes: 45 })?.id).toBe("today-mission-complete");
    expect(todayPraise({ completedBlocks: 3, plannedBlocks: 4, minutes: 30 })).toBeNull();
    expect(todayPraise({ completedBlocks: 0, plannedBlocks: 0, minutes: 0 })).toBeNull();
    expect(todayPraise({ completedBlocks: 4, plannedBlocks: 4, minutes: 45 })?.ar).toContain("45");
  });

  it("praises the delayed retrieval, and praises honesty when the grade is low", () => {
    expect(reviewPraise({ grade: 5, intervalDays: 6 })?.id).toBe("review-retrieved-after-delay");
    expect(reviewPraise({ grade: 4, intervalDays: 2 })?.id).toBe("review-retrieved-after-delay");
    // التقييم الصادق سلوك مقيس أيضًا: لا يجوز تعويض النسيان بمدح عام أو بصمت.
    expect(reviewPraise({ grade: 1, intervalDays: 1 })?.id).toBe("review-graded-honestly");
    expect(reviewPraise({ grade: 3, intervalDays: 1 })?.id).toBe("review-graded-honestly");
    // نجاح بلا تأجيل (فاصل يوم واحد) ليس الاسترجاع المؤجل المقصود.
    expect(reviewPraise({ grade: 5, intervalDays: 1 })).toBeNull();
    expect(praiseText(null)).toBe("");
  });

  it("praises the exam only for a complete answer set, and adds the time when it beat the plan", () => {
    expect(examPraise({ answered: 20, total: 20 })?.id).toBe("exam-answered-all");
    expect(examPraise({ answered: 20, total: 20, minutesSpent: 32, plannedMinutes: 40 })?.id).toBe("exam-answered-all-in-time");
    expect(examPraise({ answered: 20, total: 20, minutesSpent: 52, plannedMinutes: 40 })?.id).toBe("exam-answered-all");
    expect(examPraise({ answered: 18, total: 20 })).toBeNull();
    expect(examPraise({ answered: 0, total: 0 })).toBeNull();
  });

  it("praises the revision and the re-recording, not the first draft or the first take", () => {
    expect(writingPraise({ revised: true, version: 3, axesPassed: 4, axesTotal: 5 })?.id).toBe("writing-revised-after-feedback");
    expect(writingPraise({ revised: false, version: 1, axesPassed: 3, axesTotal: 5 })).toBeNull();
    expect(writingPraise({ revised: true, version: 1, axesPassed: 3, axesTotal: 5 })).toBeNull();
    expect(speakingPraise({ attempts: 3 })?.id).toBe("speaking-re-recorded-after-listening");
    expect(speakingPraise({ attempts: 1 })).toBeNull();
    expect(moduleReviewPraise({ score: 9, total: 10, lessons: 8 })?.id).toBe("module-review-completed-mixed");
    expect(moduleReviewPraise({ score: 9, total: 0, lessons: 8 })).toBeNull();
  });

  it("keeps every rendered praise deterministic and free of generic wording", () => {
    const rendered = [
      todayPraise({ completedBlocks: 4, plannedBlocks: 4, minutes: 45 }),
      reviewPraise({ grade: 5, intervalDays: 6 }),
      reviewPraise({ grade: 1, intervalDays: 1 }),
      examPraise({ answered: 20, total: 20, minutesSpent: 32, plannedMinutes: 40 }),
      writingPraise({ revised: true, version: 3, axesPassed: 4, axesTotal: 5 }),
      speakingPraise({ attempts: 3 }),
      moduleReviewPraise({ score: 9, total: 10, lessons: 8 }),
    ];
    for (const praise of rendered) {
      expect(praise).not.toBeNull();
      expect(isGenericPraise(praiseText(praise))).toBe(false);
    }
    expect(todayPraise({ completedBlocks: 2, plannedBlocks: 4, minutes: 20 })?.ar).toBe(
      todayPraise({ completedBlocks: 2, plannedBlocks: 4, minutes: 20 })?.ar,
    );
  });

  it("bans generic praise in every rendered UI surface (source scan, not a sample)", () => {
    // المسح على نصوص الواجهة كلها لا على عيّنة: `src/app/module/**` مستثنى لأنه
    // صفحات بيانات لا نسخ واجهة، وملف القاموس نفسه مستثنى لأنه يحمل القائمة.
    const files = [...walk("src/app"), ...walk("src/components")].filter(
      (file) => !file.includes("/src/app/module/") && !file.includes("src/app/globals.css"),
    );
    expect(files.length).toBeGreaterThan(40);
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      GENERIC_PRAISE_RE.lastIndex = 0;
      const hits = [...new Set([...text.matchAll(GENERIC_PRAISE_RE)].map((match) => match[0]))];
      if (hits.length) offenders.push(`${file}: ${hits.join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });
});
