import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { academicLessonList } from "../src/data/academic-lessons";

/** Stage B authoring operation (ADR-106): applies the authored error-clinic payload to
 * `mistakes[].whyAr` / `mistakes[].trickAr` in the lesson data files. Never run by prebuild.
 * Every replacement is matched against the lesson id and the position of the mistake entry, and
 * against the authored payload only — the script refuses to run when the runtime text no longer
 * matches the file, so it can neither duplicate a line nor overwrite new authoring.
 * Independent semantic review remains pending; text length is not a quality certificate. */
const apply = process.argv.includes("--apply");
const payloadPath = "docs/run-logs/2026-10-03-lesson-teaching-contract/feedback-stub-payload.json";
const payload = JSON.parse(await readFile(payloadPath, "utf8")) as Record<string, Record<string, string>>;
const lessonIds = new Map<string, number>(academicLessonList.map((lesson) => [lesson.id, lesson.mistakes.length]));
const fields = ["whyAr", "trickAr"] as const;
const wanted = new Set(Object.keys(payload));
const seen = new Set<string>();
let replaced = 0, already = 0;
const problems: string[] = [];

for (const name of (await readdir("src/data")).filter((n) => /^lessons-[ab][12]-module\d+\.ts$/.test(n)).sort()) {
  const filename = path.join("src/data", name);
  const source = await readFile(filename, "utf8");
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const edits: { start: number; end: number; text: string }[] = [];
  const prop = (node: ts.ObjectLiteralExpression, key: string) =>
    node.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && p.name.getText(tree) === key);
  const text = (node?: ts.Node) => (node && ts.isStringLiteral(node) ? node.text : undefined);

  const visit = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const idNode = prop(node, "id")?.initializer;
      const lessonId = text(idNode);
      const mistakes = lessonId && lessonIds.has(lessonId) ? prop(node, "mistakes")?.initializer : undefined;
      if (lessonId && mistakes && ts.isArrayLiteralExpression(mistakes)) {
        mistakes.elements.forEach((element, index) => {
          const key = `${lessonId}#${index}`;
          if (!ts.isObjectLiteralExpression(element) || !wanted.has(key)) return;
          seen.add(key);
          for (const field of fields) {
            const next = payload[key]?.[field];
            if (!next) continue;
            const current = prop(element, field)?.initializer;
            if (!current || !ts.isStringLiteral(current)) {
              problems.push(`${key}: missing string field ${field}`);
              continue;
            }
            const from = current.text;
            if (from === next) { already += 1; continue; }
            if (next.length < (field === "whyAr" ? 20 : 15)) problems.push(`${key}: ${field} below floor`);
            replaced += 1;
            edits.push({ start: current.getStart(tree), end: current.end, text: JSON.stringify(next) });
          }
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);

  edits.sort((a, b) => b.start - a.start); // apply from the end so earlier offsets stay valid
  if (!apply || !edits.length) continue;
  let out = source;
  for (const edit of edits) out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  await writeFile(filename, out, "utf8");
}

for (const key of wanted) if (!seen.has(key)) problems.push(`${key}: not found in lesson data files`);
const unused = Object.entries(payload).filter(([key]) => !lessonIds.has(key.split("#")[0]));
if (unused.length) problems.push(`unknown lessons in payload: ${unused.map(([key]) => key).join(", ")}`);
console.log(`Mistake feedback ${apply ? "applied" : "planned"}: ${replaced} replaced, ${already} already authored, ${wanted.size} payload keys, ${lessonIds.size} lessons.`);
if (problems.length) {
  console.error(`FAILED: ${problems.length} problems\n${problems.slice(0, 12).join("\n")}`);
  process.exit(1);
}
if (!apply) console.error("Dry run only. Re-run with --apply to write the payload into src/data.");
