import { academicLessonList } from "@/data/academic-lessons";
import type { FullLesson } from "@/types/lesson-content";

/**
 * اتّساق رسم «ch» مع النطق المكتوب في بطاقات النطق.
 *
 * وجدتُ بالتدقيق اليدوي أخطاء حقيقية في محتوى النطق (مثال: `doch` مكتوبة [dɔç] والصحيح
 * [dɔx]، و`braucht` مكتوبة [bʁaʊ̯çt] والصحيح [bʁaʊ̯xt]، و`auch` مكتوبة [ɔɪ̯ç] والصحيح
 * [aʊ̯x]، ومعها شرح يقول إن «sch» في Bescheid تُنطق [ç] وهي [ʃ]). هذا الفاحص يقرأ
 * الكلمة الألمانية والتفريغ الصوتي معًا ويطبّق القاعدة الألمانية نفسها:
 * بعد حركة أمامية (i e ä ö ü ei eu äu) يُلفظ ch بصوت [ç]، وبعد حركة خلفية (a o u au) بصوت [x].
 */
export const PRONUNCIATION_CONSISTENCY_POLICY = "ch-grapheme-ipa-consistency-v1" as const;
export const PRONUNCIATION_CONSISTENCY_BOUNDARY = "grapheme-to-transcription-spot-check-no-acoustic-verification-of-tabulated-ipa" as const;

export type PronunciationIssue = {
  lessonId: string;
  itemDe: string;
  word: string;
  ipa: string;
  kind: "ch-front-but-x" | "ch-back-but-coronal" | "sch-without-es" | "note-claims-wrong-ch";
  expectedAr: string;
  detailAr: string;
};

export type PronunciationConsistencyAudit = {
  policyVersion: typeof PRONUNCIATION_CONSISTENCY_POLICY;
  boundary: typeof PRONUNCIATION_CONSISTENCY_BOUNDARY;
  ok: boolean;
  lessons: number;
  items: number;
  alignedItems: number;
  skippedItems: number;
  issues: PronunciationIssue[];
};

const FRONT = /(i|e|ä|ö|ü|ei|eu|äu|y)$/;
const BACK = /(a|o|u|au)$/;

function germanWords(text: string): string[] {
  return text
    .replace(/[„“"«»().,!?:;–—]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-zÄÖÜäöüß]/g, ""))
    .filter(Boolean);
}

function ipaTokens(ipa: string): string[] {
  return ipa.replace(/^\[/, "").replace(/\]$/, "").split(/\s+/).filter(Boolean);
}

function lowercase(word: string): string {
  return word.toLocaleLowerCase("de-DE");
}

export function checkLessonPronunciation(lesson: FullLesson): { issues: PronunciationIssue[]; items: number; aligned: number; skipped: number } {
  const pronunciation = lesson.pronunciation as { items?: Array<{ de?: string; ipa?: string; ar?: string }> } | undefined;
  const items = pronunciation?.items ?? [];
  const issues: PronunciationIssue[] = [];
  let aligned = 0;
  let skipped = 0;

  for (const item of items) {
    const de = String(item.de ?? "");
    const ipa = String(item.ipa ?? "");
    const note = String(item.ar ?? "");
    if (!de || !ipa) continue;
    const words = germanWords(de);
    const tokens = ipaTokens(ipa);
    if (words.length !== tokens.length) {
      skipped += 1;
      if (/\[ç\]/.test(note) && !/ç/.test(ipa)) {
        issues.push({
          lessonId: lesson.id, itemDe: de, word: words.join(" "), ipa,
          kind: "note-claims-wrong-ch",
          expectedAr: "الشرح يذكر [ç] والتفريغ لا يحتوي عليه",
          detailAr: "راجع الشرح العربي: يدّعي صوتًا غير موجود في التفريغ الصوتي بجانبه.",
        });
      }
      continue;
    }
    aligned += 1;
    words.forEach((word, index) => {
      const token = tokens[index];
      const lower = lowercase(word);
      if (token.includes("…")) return;
      if (/sch/.test(lower) && !/chen$/.test(lower)) {
        if (!/ʃ/.test(token)) {
          issues.push({
            lessonId: lesson.id, itemDe: de, word, ipa: token,
            kind: "sch-without-es",
            expectedAr: "«sch» تُلفظ [ʃ]",
            detailAr: `الكلمة تحتوي رسم «sch» لكن التفريغ «${token}» بلا [ʃ].`,
          });
        }
        return;
      }
      const chIndex = lower.indexOf("ch");
      if (chIndex === -1) return;
      const before = lower.slice(0, chIndex);
      const endsFront = FRONT.test(before);
      // الحركة الأمامية تُفحص أولًا: «euch» تنتهي بـ«u» رسمًا لكن حركتها أمامية [ɔʏ̯]
      const endsBack = !endsFront && /(a|o|u|au)$/.test(before);
      const afterConsonant = !endsFront && !endsBack && /(s|l|n|r)$/.test(before);
      if (afterConsonant) {
        if (/(x)/.test(token) && !/ks/.test(token)) {
          issues.push({
            lessonId: lesson.id, itemDe: de, word, ipa: token,
            kind: "ch-front-but-x",
            expectedAr: `بعد صامت («${before}») يُلفظ ch صوت [ç]`,
            detailAr: `التفريغ «${token}» يستعمل [x].`,
          });
        }
        return;
      }
      const hasCoronal = /ç/.test(token);
      const hasAch = /x/.test(token) && !/ks/.test(token);
      if (endsFront && hasAch) {
        issues.push({
          lessonId: lesson.id, itemDe: de, word, ipa: token,
          kind: "ch-front-but-x",
          expectedAr: `بعد حركة أمامية («${before || "-"}») يُلفظ ch صوت [ç]`,
          detailAr: `التفريغ «${token}» يستعمل [x].`,
        });
      }
      if (endsBack && hasCoronal) {
        issues.push({
          lessonId: lesson.id, itemDe: de, word, ipa: token,
          kind: "ch-back-but-coronal",
          expectedAr: `بعد حركة خلفية («${before}») يُلفظ ch صوت [x]`,
          detailAr: `التفريغ «${token}» يستعمل [ç].`,
        });
      }
      if (endsBack && /\[ç\]/.test(note) && !/x/.test(note)) {
        issues.push({
          lessonId: lesson.id, itemDe: de, word, ipa: token,
          kind: "note-claims-wrong-ch",
          expectedAr: "الشرح يذكر [ç] والكلمة خلفية الحركة",
          detailAr: "صحّح الشرح ليذكر [x] (ach-Laut).",
        });
      }
    });
  }
  return { issues, items: items.length, aligned, skipped };
}

export function buildPronunciationConsistencyAudit(lessons: readonly FullLesson[] = academicLessonList as unknown as FullLesson[]): PronunciationConsistencyAudit {
  const issues: PronunciationIssue[] = [];
  let items = 0;
  let alignedItems = 0;
  let skippedItems = 0;
  for (const lesson of lessons) {
    const result = checkLessonPronunciation(lesson);
    items += result.items;
    alignedItems += result.aligned;
    skippedItems += result.skipped;
    issues.push(...result.issues);
  }
  return {
    policyVersion: PRONUNCIATION_CONSISTENCY_POLICY,
    boundary: PRONUNCIATION_CONSISTENCY_BOUNDARY,
    ok: issues.length === 0,
    lessons: lessons.length,
    items,
    alignedItems,
    skippedItems,
    issues,
  };
}
