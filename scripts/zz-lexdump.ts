import { writeFileSync } from "node:fs";
import * as gap from "../src/core/content-validation/lexical-target-gap";
const fn = Object.entries(gap).find(([k, v]) => typeof v === "function" && /audit|build|report/i.test(k));
const r: any = (fn![1] as any)();
const nouns = (r.nounRows ?? r.nouns ?? []).map((x: any) => `${x.lessonId}|${x.normalizedLemma}|${x.status}|${x.role}`);
const verbs = (r.verbFrameRows ?? r.verbRows ?? r.frames ?? []).map((x: any) => `${x.lessonId}|${x.normalizedVerb}|${x.preposition}|${x.status}`);
writeFileSync(process.argv[2], JSON.stringify({ fn: fn![0], nouns, verbs }, null, 0));
console.log(fn![0], nouns.length, verbs.length, nouns.filter((x: string) => x.includes("pending")).length);
