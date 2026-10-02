// YAML plain scalars cannot contain ": " — a step whose `run:` line embeds an unquoted colon-space fails at
// workflow parse time, which GitHub reports as a 0-second run with no jobs and no log to read. Unit tests
// never see it. This guard scans every committed workflow copy with Node built-ins only (no YAML dep).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const roots = process.argv.slice(2);
if (roots.length === 0) roots.push(".github/workflows", "deployment");

const stripQuoted = (value) => value.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'[^']*'/g, "''");

const issues = [];
const checked = [];
for (const root of roots) {
  let names = [];
  try { names = readdirSync(root).filter((name) => /\.(ya?ml)$/.test(name)); } catch { continue; }
  for (const name of names) {
    const file = join(root, name);
    checked.push(file);
    const lines = readFileSync(file, "utf8").split("\n");
    let blockScalar = false;
    let blockIndent = -1;
    lines.forEach((line, index) => {
      const scalar = line.match(/^(\s*)(?:-\s+)?(run|if|env|name|description):\s*([|>][-+]?\d*)\s*$/);
      if (scalar) { blockScalar = true; blockIndent = scalar[1].length; return; }
      if (blockScalar) {
        const indent = line.trim().length === 0 ? Infinity : line.match(/^\s*/)[0].length;
        if (indent > blockIndent) return;
        blockScalar = false; blockIndent = -1;
      }
      const plain = line.match(/^(\s*)(?:-\s+)?(run|if|name|description):\s+(\S.*)$/);
      if (!plain) return;
      const value = plain[3].replace(/\s+$/, "");
      if (/^["'].*["']$/.test(value)) return;
      const bare = stripQuoted(value);
      if (bare.includes(": ") || bare.endsWith(":")) issues.push(`${file}:${index + 1} plain scalar holds an unquoted ": " -> ${value.slice(0, 90)}`);
    });
  }
}

if (issues.length) {
  console.error(`Workflow YAML guard failed (${checked.length} files checked):\n${issues.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Workflow YAML guard passed: ${checked.length} files, 0 plain-scalar colon hazards.`);
}
