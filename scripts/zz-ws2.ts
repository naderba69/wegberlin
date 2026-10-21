import { academicLessonList as lessons } from "../src/data/academic-lessons";
const strings = (v: unknown, out: string[] = []): string[] => { if (typeof v === "string") out.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, out)); else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out)); return out; };
const re = new RegExp(process.argv[2], "u");
for (const l of lessons) for (const s of strings(l)) { const m = s.match(re); if (m && !/[\u0600-\u06FF]/.test(s)) console.log(l.id, "|", s.slice(Math.max(0, m.index! - 50), m.index! + 60)); }
