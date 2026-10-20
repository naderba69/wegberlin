// @vitest-environment node
import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";

// ADR-149 / v258: guard for the audit of lesson entry, header, discovery and pronunciation in all 96 lessons.
// - German-only fields (objectives.de, dialogue.de, discovery examples, pronunciation focus and items) use „…“, never «…».
// - A pronunciation gloss mirrors an open German frame: when the German item contains "…", the Arabic gloss does too,
//   so the learner sees that the phrase continues (no truncated one-word glosses such as «إضافة» for „DARÜBER HINAUS …“).
// - Every gloss is Arabic (or a number) and never just repeats the German.
// - A character the Arabic scene names must speak in the dialogue (catches «أمين» written for the speaker Amir).
// - A German focus line has no comma before „und“, and a focus that names the ich-/Ach-Laut has an item with [ç]/[x].
type Item = { de: string; ipa: string; ar: string };
type Shape = {
  id: string;
  objectives: Array<{ de: string; ar: string }>;
  entry: { sceneAr: string; dialogue: Array<{ speaker: string; de: string; ar: string }> };
  discovery: { examples: string[] };
  pronunciation: { focus?: string; items: Item[] };
};

const wrongQuotes = /[«»]/u;
const arabicOrDigit = /[\u0600-\u06FF\d]/u;
const arabicNames: Record<string, string> = {
  Ben: "بن", Mara: "مارا", Leila: "ليلى", Sara: "سارة", "Herr Aziz": "عزيز", Nora: "نورا", Omar: "عمر", Salma: "سلمى",
  Lea: "ليا|ليّا", Sami: "سامي", Mariam: "مريم", Nadia: "نادية|ناديا", Samir: "سمير", Mila: "ميلا", Karim: "كريم",
  Adam: "آدم", Jonas: "يوناس", Amina: "أمينة", Alex: "أليكس", Thomas: "توماس", Amir: "أمير", Amin: "أمين", Yesra: "يسرا",
  Amal: "أمل", Mouna: "منى", Rami: "رامي", Adel: "عادل", Tim: "تيم", Anna: "آنا", Lisa: "ليزا", Leo: "ليو", Mira: "ميرا",
  Ali: "علي", Amna: "آمنة",
};
const nameIn = (pattern: string, text: string) => new RegExp(`(?<![\\u0600-\\u06FF])(?:${pattern})(?![\\u0600-\\u06FF])`, "u").test(text);

export function lessonShapeProblems(lesson: Shape): string[] {
  const problems: string[] = [];
  const id = lesson.id;
  const germanFields: Array<[string, string]> = [
    ...lesson.objectives.map((o, i) => [`objectives[${i}].de`, o.de] as [string, string]),
    ...lesson.entry.dialogue.map((d, i) => [`dialogue[${i}].de`, d.de] as [string, string]),
    ...lesson.discovery.examples.map((e, i) => [`examples[${i}]`, e] as [string, string]),
    ["pronunciation.focus", lesson.pronunciation.focus ?? ""],
    ...lesson.pronunciation.items.map((it, i) => [`items[${i}].de`, it.de] as [string, string]),
  ];
  for (const [field, text] of germanFields) if (wrongQuotes.test(text)) problems.push(`${id}: ${field} uses «…» in German`);
  lesson.pronunciation.items.forEach((item, i) => {
    if (!arabicOrDigit.test(item.ar) || item.ar.trim() === item.de.trim()) problems.push(`${id}: items[${i}].ar is not an Arabic gloss`);
    if (item.de.includes("…") && !item.ar.includes("…")) problems.push(`${id}: items[${i}].ar drops the open frame "…" of „${item.de}“`);
  });
  const speakers = new Set(lesson.entry.dialogue.map((d) => d.speaker));
  for (const [latin, pattern] of Object.entries(arabicNames)) {
    if (nameIn(pattern, lesson.entry.sceneAr) && !speakers.has(latin)) problems.push(`${id}: scene names «${pattern}» but ${latin} does not speak`);
  }
  const focus = lesson.pronunciation.focus ?? "";
  if (/,\s+und\s/u.test(focus)) problems.push(`${id}: focus has a comma before „und“`);
  const ipa = lesson.pronunciation.items.map((it) => it.ipa).join(" ");
  if (/\bich-Laut/iu.test(focus) && !ipa.includes("ç")) problems.push(`${id}: focus names the ich-Laut but no item has [ç]`);
  if (/\bAch-Laut/iu.test(focus) && !/x/u.test(ipa)) problems.push(`${id}: focus names the Ach-Laut but no item has [x]`);
  return problems;
}

const lessons = academicLessonList as unknown as Shape[];

describe("entry, discovery and pronunciation (ADR-149)", () => {
  it("covers the audited inventory", () => {
    expect(lessons).toHaveLength(96);
  });

  it("keeps every lesson free of the audited error classes", () => {
    expect(lessons.flatMap(lessonShapeProblems)).toEqual([]);
  });

  it("detects planted errors of each class", () => {
    const base = structuredClone(lessons.find((l) => l.id === "b2-23")!);
    expect(lessonShapeProblems(base)).toEqual([]);
    const planted = (mutate: (l: Shape) => void) => { const copy = structuredClone(base); mutate(copy); return lessonShapeProblems(copy); };
    expect(planted((l) => { l.discovery.examples[0] = "«Erlass» ist der Kopf."; })).toEqual([expect.stringContaining("examples[0] uses «…»")]);
    expect(planted((l) => { l.entry.dialogue[0]!.de = "Der Kern ist «Erlass»."; })).toEqual([expect.stringContaining("dialogue[0].de uses «…»")]);
    expect(planted((l) => { l.pronunciation.items[0] = { de: "DARÜBER HINAUS …", ipa: "[daˈʁyːbɐ hɪˈnaʊ̯s …]", ar: "إضافة" }; })).toEqual([expect.stringContaining("drops the open frame")]);
    expect(planted((l) => { l.pronunciation.items[0]!.ar = l.pronunciation.items[0]!.de; })).toEqual([expect.stringContaining("is not an Arabic gloss")]);
    expect(planted((l) => { l.entry.sceneAr = l.entry.sceneAr.replace("أمير", "أمين"); })).toEqual([expect.stringContaining("Amin does not speak")]);
    expect(planted((l) => { l.pronunciation.focus = "Hauptakzent, Fugenlaute, und Pausen"; })).toEqual([expect.stringContaining("comma before")]);
    expect(planted((l) => { l.pronunciation.focus = "Akzent und Ach-Laut"; l.pronunciation.items = l.pronunciation.items.map((it) => ({ ...it, ipa: it.ipa.replace(/x/gu, "ç") })); })).toEqual([expect.stringContaining("no item has [x]")]);
  });
});
