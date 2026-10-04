// TEMPORARY (removed in the next commit): re-reads the telc mock archive on a runner with open network access and tests the
// 7 pinned facts of `telc-b2-mock-2019-current-link` (src/config/exam-format-evidence.json) against the archive's PDF text layer.
// `npm run exam:formats:live` skips PDFs ("need a PDF/table converter"), and this session's sandbox cannot reach telc.net.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const note = (title, message) =>
  console.log(`::notice title=${title}::${String(message).replace(/%/g, "%25").replace(/\r?\n/g, " ").slice(0, 3200)}`);

const evidence = JSON.parse(readFileSync("src/config/exam-format-evidence.json", "utf8"));
const source = evidence.sources.find((entry) => entry.id === "telc-b2-mock-2019-current-link");
const facts = evidence.facts.filter((fact) => fact.sourceId === source.id);

const response = await fetch(source.url, {
  headers: { "user-agent": "Der-Weg-nach-Berlin-source-audit/1.0" },
  redirect: "follow",
  signal: AbortSignal.timeout(120_000),
});
const bytes = Buffer.from(await response.arrayBuffer());
note(
  "telc zip",
  `HTTP ${response.status} · ${bytes.length} bytes · sha256 ${createHash("sha256").update(bytes).digest("hex").slice(0, 16)} · content-type ${response.headers.get("content-type")} · last-modified ${response.headers.get("last-modified")} · etag ${response.headers.get("etag")}`,
);
if (!response.ok) process.exit(0);

const work = "/tmp/telc-qa";
mkdirSync(work, { recursive: true });
writeFileSync(path.join(work, "telc.zip"), bytes);
execFileSync("unzip", ["-o", "-q", path.join(work, "telc.zip"), "-d", path.join(work, "unz")]);
const entries = execFileSync("unzip", ["-Z1", path.join(work, "telc.zip")], { encoding: "utf8" }).split("\n").filter(Boolean);
note("telc zip entries", `${entries.length} entries: ${entries.slice(0, 40).join(" | ")}`);

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((item) => (item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)]));
const pdfs = walk(path.join(work, "unz")).filter((file) => file.toLowerCase().endsWith(".pdf"));
note("telc pdfs", pdfs.map((file) => `${path.basename(file)} (${readFileSync(file).length} bytes, sha256 ${createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12)})`).join(" | "));

const markers = [
  ["edition marker 2019", /© telc gGmbH, Frankfurt a\. M\., telc Deutsch B2, 2019/iu],
  ["pass rule sentence", /Um die Prüfung zu bestehen, müssen die Teilnehmerinnen und Teilnehmer sowohl in der Schriftlichen als auch in der Mündlichen Prüfung jeweils 60 % der möglichen Höchstpunktzahl erreichen/iu],
  ["Übungstest 1", /telc Deutsch B2, Übungstest 1/iu],
];
const modes = [["default", []], ["layout", ["-layout"]], ["raw", ["-raw"]]];
const lines = [];
for (const file of pdfs) {
  for (const [modeName, flags] of modes) {
    let text = "";
    try {
      text = execFileSync("pdftotext", [...flags, file, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).replace(/\s+/g, " ");
    } catch (error) {
      lines.push(`${path.basename(file)}/${modeName}: pdftotext failed (${String(error.message).slice(0, 80)})`);
      continue;
    }
    const hitFacts = facts.filter((fact) => new RegExp(fact.checkPattern, "ius").test(text));
    const hitMarkers = markers.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
    if (hitFacts.length > 0 || hitMarkers.length > 0 || file.includes("uebungstest_1")) {
      lines.push(`${path.basename(file)}/${modeName}: facts ${hitFacts.length}/${facts.length} [${hitFacts.map((fact) => fact.id.replace("telc-b2-", "")).join(", ")}] · markers [${hitMarkers.join(", ")}] · ${text.length} chars`);
    }
  }
}
note("telc pinned facts vs archive text", lines.length ? lines.join(" || ") : "no PDF in the archive matched any pinned fact or marker");

// The 7th pinned fact (Sprachbausteine weight) depends on how the extractor orders table cells: show the raw window per mode.
const sprachFact = facts.find((fact) => fact.id === "telc-b2-sprachbausteine-weight-10");
note("pinned pattern of the 7th fact", sprachFact.checkPattern);
for (const file of pdfs) {
  note("pdf sha256 (full)", createHash("sha256").update(readFileSync(file)).digest("hex"));
  for (const [modeName, flags] of modes) {
    const text = execFileSync("pdftotext", [...flags, file, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).replace(/\s+/g, " ");
    const hits = [...text.matchAll(/21–30/g)].map((match) => match.index);
    const windows = hits.slice(0, 2).map((index) => `«${text.slice(Math.max(0, index - 90), index + 170)}»`);
    note(`window around 21–30 (${modeName})`, windows.length ? windows.join(" ··· ") : "no occurrence of 21–30");
  }
}
