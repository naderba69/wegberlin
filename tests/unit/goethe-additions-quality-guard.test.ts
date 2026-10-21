import { describe, expect, it } from "vitest";
import { academicLessonList } from "@/data/academic-lessons";

// ADR-143 / v252: permanent quality guard for every lesson that received a Goethe vocabulary package
// (ADR-139 A1, ADR-141 A2, ADR-142 B1). The owner asked that every addition is processed and audited;
// these checks turn the mechanical part of that audit into a gate, so a future addition that breaks
// one of them fails `npm run check` instead of reaching the learner.
// ADR-144 / v253: the guard first covered the 53 lessons that received words (every A1 and A2 lesson plus
// b1-08/10/12/20/23); it now covers all 96 lessons, after the remaining 19 B1 and 24 B2 lessons were audited.
// It also forbids unfinished card examples ending in "…" and French/Swiss guillemets in German examples.
const packaged = academicLessonList;
const arabic = /[\u0600-\u06FF]/u;
const latin = /[A-Za-zÄÖÜäöüß]/u;
// Glosses are split on " / " (two meanings or a feminine form) and on a trailing note in parentheses.
const glossParts = (gloss: string) => [gloss, ...gloss.split(" / ").map((part) => part.trim())];
const frontParts = (front: string) => [front, ...front.split(" / ").map((part) => part.trim())];
const stripArticle = (word: string) => word.replace(/^(der|die|das|ein|eine) /u, "");

const problems: string[] = [];
const flag = (ok: boolean, message: string) => { if (!ok) problems.push(message); };

describe("Vocabulary quality guard for every lesson (ADR-143, widened by ADR-144)", () => {
  it("covers all 96 lessons, 69 of them with a Goethe matching e8", () => {
    expect(packaged.length).toBe(96);
    expect(packaged.filter((lesson) => lesson.exercises.some((exercise) => exercise.id === `${lesson.id}-e8` && exercise.type === "matching")).length).toBe(69);
  });

  it("gives every card a full example sentence and no repeated front inside a lesson", () => {
    for (const lesson of packaged) {
      const fronts = new Set<string>();
      for (const card of lesson.flashcards) {
        const example = card.exampleDe.trim();
        // A letter closing ("Mit freundlichen Grüßen, Sami") correctly has no final punctuation.
        if (/^Mit freundlichen Grüßen, \p{Lu}\p{Ll}+$/u.test(example)) continue;
        flag(/^[\p{Lu}\d„"]/u.test(example), `${card.id}: example starts like a sentence: ${example}`);
        flag(/[.!?]["“]?$/u.test(example), `${card.id}: example ends like a full sentence, not with "…": ${example}`);
        flag(!/[«»]/u.test(example), `${card.id}: German quotation marks „…“, not «…»: ${example}`);
        flag(!fronts.has(card.frontDe), `${card.id}: duplicate front ${card.frontDe}`);
        fronts.add(card.frontDe);
      }
    }
  });

  it("keeps the card meaning identical to the meaning taught on the vocabulary stage", () => {
    for (const lesson of packaged) {
      const taught = new Map(lesson.phrases.map((phrase) => [phrase.de, phrase.ar]));
      for (const card of lesson.flashcards) {
        const phraseGloss = taught.get(card.frontDe);
        if (phraseGloss !== undefined) flag(card.backAr === phraseGloss, `${card.id}: ${card.frontDe} card ${card.backAr} ≠ phrase ${phraseGloss}`);
      }
    }
  });

  it("matches every word in the matching exercise with the meaning the lesson taught", () => {
    for (const lesson of packaged) {
      const exercise = lesson.exercises.find((item) => item.id === `${lesson.id}-e8`);
      if (!exercise || exercise.type !== "matching") continue;
      const sources = [
        ...lesson.phrases.map((phrase) => ({ de: phrase.de, ar: phrase.ar })),
        ...lesson.flashcards.map((card) => ({ de: card.frontDe, ar: card.backAr })),
      ];
      for (const pair of exercise.pairs) {
        const allowed = new Set<string>();
        for (const source of sources) {
          const fronts = frontParts(source.de);
          const listed = source.de.split(/,\s*/u).map((part) => part.trim());
          const hit = fronts.includes(pair.left) || listed.includes(pair.left) || fronts.map(stripArticle).includes(stripArticle(pair.left));
          if (!hit) continue;
          for (const part of glossParts(source.ar)) allowed.add(part);
          for (const part of source.ar.split(/،\s*/u)) allowed.add(part.trim());
        }
        flag(allowed.size > 0, `${exercise.id}: ${pair.left} is taught in the lesson`);
        flag(allowed.has(pair.right), `${exercise.id}: ${pair.left} → ${pair.right} (taught: ${[...allowed].join(" | ")})`);
      }
    }
  });

  it("mirrors German ! and ? in the Arabic meaning and never glues Arabic to a Latin letter", () => {
    for (const lesson of packaged) {
      const items = [
        ...lesson.phrases.map((phrase, index) => ({ id: `${lesson.id}-phrase-${index + 1}`, de: phrase.de, ar: phrase.ar })),
        ...lesson.flashcards.map((card) => ({ id: card.id, de: card.frontDe, ar: card.backAr })),
      ];
      for (const item of items) {
        if (item.de.trim().endsWith("!")) flag(item.ar.includes("!"), `${item.id}: ! missing: ${item.de} → ${item.ar}`);
        if (item.de.trim().endsWith("?")) flag(/[؟?]/u.test(item.ar), `${item.id}: ? missing: ${item.de} → ${item.ar}`);
        const chars = [...item.ar];
        for (let i = 1; i < chars.length; i += 1) {
          const glued = (arabic.test(chars[i - 1]!) && latin.test(chars[i]!)) || (latin.test(chars[i - 1]!) && arabic.test(chars[i]!));
          flag(!glued, `${item.id}: Arabic glued to Latin in ${item.ar}`);
        }
      }
    }
  });

  it("reports no problem", () => {
    expect(problems).toEqual([]);
  });
});
