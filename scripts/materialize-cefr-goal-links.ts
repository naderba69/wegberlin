/**
 * مُثبِّت صلات الأهداف (P2-96، ADR-093).
 *
 * يمسح أهداف الدروس المنشورة (96 درسًا) ويستدلّ على صلة كل هدفٍ من جرد المستويات
 * بكلمة مفتاحية معلنة، مقيَّدةً بالمستوى: هدف A1 لا يُغطّى بدروس B2. المخرَج ملف
 * مؤلَّف مجمَّد `src/data/cefr-goal-links.ts` يحمل **الدليل** لكل صلة (الدرس + فهرس
 * الهدف داخل الدرس + الكلمة المطابقة)، حتى تكون التغطية قابلة للتدقيق لا مجرد دعوى.
 *
 * التشغيل: npx tsx scripts/materialize-cefr-goal-links.ts
 */
import { writeFileSync } from "node:fs";
import { academicLessonList } from "@/data/academic-lessons";
import { cefrGoalInventory } from "@/core/content-validation/cefr-goal-inventory";

export type GoalLink = {
  goalId: string;
  level: string;
  lessonId: string;
  objectiveIndex: number;
  matchedKeyword: string;
  matchedIn: "de" | "ar";
};

export function deriveGoalLinks(): GoalLink[] {
  const links: GoalLink[] = [];
  for (const goal of cefrGoalInventory) {
    for (const lesson of academicLessonList) {
      if (lesson.level !== goal.level) continue;
      lesson.objectives.forEach((objective, objectiveIndex) => {
        const haystacks: Array<{ text: string; field: "de" | "ar" }> = [
          { text: objective.de, field: "de" },
          { text: objective.ar, field: "ar" },
        ];
        for (const haystack of haystacks) {
          const keywords = haystack.field === "de" ? goal.keywordsDe : goal.keywordsAr;
          for (const keyword of keywords) {
            if (haystack.text.includes(keyword)) {
              links.push({
                goalId: goal.goalId,
                level: goal.level,
                lessonId: lesson.id,
                objectiveIndex,
                matchedKeyword: keyword,
                matchedIn: haystack.field,
              });
              return; // هدف واحد ← صلة واحدة لكل درس تكفي، مع أول دليل
            }
          }
        }
      });
    }
  }
  return links;
}

function render(links: GoalLink[]): string {
  const byGoal = new Map<string, GoalLink[]>();
  for (const link of links) {
    const list = byGoal.get(link.goalId) ?? [];
    list.push(link);
    byGoal.set(link.goalId, list);
  }
  const rows = [...byGoal.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([goalId, list]) => {
      const evidence = list
        .sort((a, b) => a.lessonId.localeCompare(b.lessonId))
        .map((link) =>
          `    { lessonId: "${link.lessonId}", objectiveIndex: ${link.objectiveIndex}, matchedKeyword: ${JSON.stringify(link.matchedKeyword)}, matchedIn: "${link.matchedIn}" },`,
        )
        .join("\n");
      return `  "${goalId}": [\n${evidence}\n  ],`;
    })
    .join("\n");
  return `/**
 * AUTO-GENERATED — لا تُحرَّر يدويًّا.
 * المولّد: scripts/materialize-cefr-goal-links.ts (P2-96، ADR-093).
 * المصدر: أهداف دروس src/data/lessons-*.ts مقابل جرد الأهداف غير الرسمي.
 * كل صلة تحمل دليلها النصّي (الدرس + فهرس الهدف + الكلمة المطابقة + الحقل).
 * التغطية مقيَّدة بالمستوى: هدف A1 لا تُغطّيه دروس B2.
 */

export type CefrGoalLinkEvidence = {
  lessonId: string;
  objectiveIndex: number;
  matchedKeyword: string;
  matchedIn: "de" | "ar";
};

export const cefrGoalLinks: Readonly<Record<string, readonly CefrGoalLinkEvidence[]>> = {
${rows}
};
`;
}

if (process.argv[1]?.endsWith("materialize-cefr-goal-links.ts")) {
  const links = deriveGoalLinks();
  const coveredGoalIds = new Set(links.map((link) => link.goalId));
  const gaps = cefrGoalInventory.filter((goal) => !coveredGoalIds.has(goal.goalId)).map((goal) => goal.goalId);
  writeFileSync("src/data/cefr-goal-links.ts", render(links), "utf8");
  console.log(`goal links: ${links.length} evidence rows · goals covered: ${coveredGoalIds.size}/${cefrGoalInventory.length}`);
  console.log(`gaps (no level-scoped evidence): ${gaps.length}${gaps.length ? " → " + gaps.join(", ") : ""}`);
}
