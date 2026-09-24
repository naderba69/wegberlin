import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { distinctAcceptedForms } from "../src/core/content-validation/accepted-answer-hygiene";

/**
 * Removes accepted answers that normalize onto an earlier listed answer (`accepted-answer-hygiene-v1`).
 *
 * Safety: the removal is provably grade-neutral. `evaluateExercise` -> `compareAccepted` normalizes the
 * learner's input with `normalizeGermanText`, which already lowercases and strips punctuation, so a
 * dropped variant could never be matched separately from the variant it duplicates. The first listed
 * form is always kept, and it is the one `locateErrorSpan` and `answerShape` read (`acceptedAnswers[0]`),
 * so error spans and answer shapes are unchanged too.
 *
 * usage: npx tsx scripts/purge-noop-accepted-variants.ts [--write]
 */
const ARRAY = /acceptedAnswers:(\s*)\[([^\]]*)\]/gu;
const write = process.argv.includes("--write");

const files = (await readdir(join(process.cwd(), "src/data")))
  .filter((name) => /^lessons-.*\.ts$/u.test(name))
  .sort()
  .map((name) => join("src/data", name));
let arrays = 0;
let arraysShrunk = 0;
let entriesRemoved = 0;
const touched: string[] = [];

for (const file of files) {
  const path = join(process.cwd(), file);
  const text = await readFile(path, "utf8");
  const next = text.replace(ARRAY, (match, space: string, inner: string) => {
    arrays += 1;
    let values: string[];
    try {
      values = JSON.parse(`[${inner}]`) as string[];
    } catch {
      return match;
    }
    const kept = distinctAcceptedForms(values);
    if (kept.length === values.length) return match;
    if (!kept.length) throw new Error(`refused: ${file} would lose every accepted answer in ${match}`);
    arraysShrunk += 1;
    entriesRemoved += values.length - kept.length;
    if (!touched.includes(file)) touched.push(file);
    return `acceptedAnswers:${space}[${kept.map((value) => JSON.stringify(value)).join(", ")}]`;
  });
  if (next !== text && write) await writeFile(path, next, "utf8");
}

console.log(
  `${write ? "applied" : "dry-run"}: acceptedAnswers arrays ${arrays} · shrunk ${arraysShrunk} · no-op entries removed ${entriesRemoved} · files touched ${touched.length}`,
);
if (!write && arraysShrunk) console.log("re-run with --write to apply");
