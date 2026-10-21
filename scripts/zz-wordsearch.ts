import { academicLessonList as lessons } from "../src/data/academic-lessons";
const strings = (v: unknown, out: string[] = []): string[] => { if (typeof v === "string") out.push(v); else if (Array.isArray(v)) v.forEach((x) => strings(x, out)); else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out)); return out; };
const probes: Record<string, RegExp> = {
  alle: /\b(alle|allen|alles|aller|allem)\b/i, jeder: /\b(jede|jeder|jedes|jeden|jedem)\b/i, Lieblings: /\bLieblings\w+/,
  tot: /\b(tot|tote|toten|toter)\b/i, Gruss: /\b(Gruß|Grüße|Grüßen)\b/, meist: /\b(meist|meistens|meiste|meisten)\b/i,
  Bogen: /\w*bogen\b/i, Geburts: /\bGeburts\w+/, dar: /\bdar(stellen|gestellt|stellt|aus|auf|an|über|um|in|unter)\b/i, einzel: /\b(einzeln|einzelne\w*)\b/i,
};
const levelOf = (id: string) => id.slice(0, 2).toUpperCase();
for (const [k, re] of Object.entries(probes)) {
  const hits: string[] = [];
  for (const l of lessons) {
    const de = strings({ ...l }).filter((s) => !/[\u0600-\u06FF]/.test(s));
    const h = de.find((s) => re.test(s));
    if (h) hits.push(`${l.id}: ${h.match(re)![0]} | ${h.slice(Math.max(0, h.search(re) - 30), h.search(re) + 40)}`);
  }
  const byLevel = ["A1", "A2", "B1", "B2"].map((lv) => `${lv}=${hits.filter((h) => levelOf(h) === lv).length}`).join(" ");
  console.log(k, byLevel); hits.slice(0, 3).forEach((h) => console.log("   ", h));
}
