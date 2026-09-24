import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { scanSecretText, SECRET_AUDIT_VERSION } from "../src/core/security/secret-scanner-runtime.mjs";

const args = new Set(process.argv.slice(2));
const rootArgIndex = process.argv.indexOf("--repo");
const root = path.resolve(rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : process.cwd());
const scanWorkingTree = args.has("--working-tree") || !args.has("--history");
const scanHistory = args.has("--history");
const requireHistory = args.has("--require-history");
const excludedDirectories = new Set([".git", ".next", "node_modules", "test-results", "playwright-report", "coverage", "dist", "build", "out", ".cache"]);
const excludedExtensions = new Set([".mp3", ".wav", ".ogg", ".opus", ".flac", ".aac", ".m4a", ".aiff", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".zip", ".dwnb", ".woff", ".woff2"]);

function git(commandArgs, allowFailure = false) {
  const result = spawnSync("git", ["-C", root, ...commandArgs], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0 && !allowFailure) throw new Error(result.stderr.trim() || `git ${commandArgs.join(" ")} failed`);
  return result;
}

function hasGitHistory() {
  return git(["rev-parse", "--is-inside-work-tree"], true).stdout.trim() === "true";
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

async function workingTreeFiles(gitAvailable) {
  if (!gitAvailable) return walk(root);
  const tracked = git(["ls-files", "-z"]).stdout.split("\0").filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"]).stdout.split("\0").filter(Boolean);
  return [...new Set([...tracked, ...untracked])].map((file) => path.join(root, file));
}

async function scanWorking(gitAvailable) {
  const findings = [];
  let scannedFiles = 0;
  let skippedBinary = 0;
  for (const file of await workingTreeFiles(gitAvailable)) {
    const extension = path.extname(file).toLocaleLowerCase("en");
    if (excludedExtensions.has(extension)) { skippedBinary += 1; continue; }
    const metadata = await stat(file);
    if (metadata.size > 16 * 1024 * 1024) { skippedBinary += 1; continue; }
    const bytes = await readFile(file);
    if (bytes.subarray(0, Math.min(bytes.length, 8192)).includes(0)) { skippedBinary += 1; continue; }
    scannedFiles += 1;
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    findings.push(...scanSecretText(bytes.toString("utf8"), relative));
  }
  return { findings, scannedFiles, skippedBinary };
}

function scanGitHistory() {
  const result = git([
    "log", "--all", "--no-renames", "--no-ext-diff", "--format=@@COMMIT:%H", "-p", "--", ".",
    ":(exclude)public/audio/**", ":(exclude)reports/academic-content-audit.json",
  ]);
  const findings = [];
  let commit = "unknown";
  let currentPath = "<patch>";
  let patchLines = 0;
  for (const line of result.stdout.split(/\r?\n/)) {
    if (line.startsWith("@@COMMIT:")) { commit = line.slice(9); continue; }
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/);
      currentPath = match?.[2] ?? "<patch>";
      continue;
    }
    if ((!line.startsWith("+") && !line.startsWith("-")) || line.startsWith("+++") || line.startsWith("---")) continue;
    patchLines += 1;
    const lineFindings = scanSecretText(line.slice(1), `${commit}:${currentPath}`);
    findings.push(...lineFindings.map((finding) => ({ ...finding, line: patchLines })));
  }
  return { findings, patchLines, commitCount: git(["rev-list", "--all", "--count"]).stdout.trim() };
}

const gitAvailable = hasGitHistory();
if (gitAvailable && git(["ls-files", "--error-unmatch", "public/vendor/webgpu/transformers.web.min.js"], true).status === 0) throw new Error("Materialized Transformers plaintext must remain Git-ignored; commit only the checksum-pinned packed payload.");
if (requireHistory && !gitAvailable) throw new Error("Secret history audit requires a real Git worktree with fetched history.");
const allFindings = [];
let workingSummary = { scannedFiles: 0, skippedBinary: 0 };
let historySummary = { patchLines: 0, commitCount: "0" };

if (scanWorkingTree) {
  const result = await scanWorking(gitAvailable);
  allFindings.push(...result.findings);
  workingSummary = result;
}
if (scanHistory && gitAvailable) {
  const result = scanGitHistory();
  allFindings.push(...result.findings);
  historySummary = result;
}

console.log(`Secret audit ${SECRET_AUDIT_VERSION}:`);
if (scanWorkingTree) console.log(`- working tree: ${workingSummary.scannedFiles} text files scanned; ${workingSummary.skippedBinary} binary/oversize files skipped`);
if (scanHistory) console.log(gitAvailable ? `- Git history: ${historySummary.commitCount} commits / ${historySummary.patchLines} changed text lines scanned` : "- Git history: unavailable in this workspace (CI uses --require-history)");
if (allFindings.length) {
  console.error(`- findings: ${allFindings.length}`);
  for (const finding of allFindings.slice(0, 100)) console.error(`  ${finding.ruleId} ${finding.path}:${finding.line}:${finding.column} ${finding.fingerprint}`);
  throw new Error("Potential secret material detected. Values were redacted; remove them and rotate any real credential.");
}
console.log("- findings: 0");
console.log("Boundary: pattern scanning reduces accidental credential commits; it does not prove that arbitrary high-entropy data is harmless or replace provider-side revocation.");
