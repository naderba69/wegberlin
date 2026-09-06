#!/usr/bin/env node
/**
 * P0-304: فحص أسرار آلي (شجرة العمل + تاريخ Git + قبل الالتزام).
 *
 * المستودع عام، والتطبيق يقبل مفتاح OpenRouter من المستخدم ويحفظه في
 * `sessionStorage` فقط. الخطر العملي ليس في الكود بل في أن ينزلق مفتاح حقيقي إلى
 * ملف أو إلى التاريخ. هذا الفحص يمنع ذلك آليًا بدل الاعتماد على الانتباه.
 *
 * الاستخدام:
 *   node scripts/secret-scan.mjs                 # الشجرة (المسار الافتراضي)
 *   node scripts/secret-scan.mjs --staged        # محتوى الفهرس (خطاف pre-commit)
 *   node scripts/secret-scan.mjs --history       # كل الالتزامات في التاريخ
 *   node scripts/secret-scan.mjs --tree --history --json
 *
 * الحدود المُعلنة: مطابقة نمطية عالية الإشارة + استثناءات موثّقة في
 * `scripts/secret-scan-allowlist.json`. لا يدّعي كشف كل سر ممكن، ولا يفحص
 * محتوىً مشفّرًا أو ملفات ثنائية، وفي CI ذي نسخة ضحلة (fetch-depth: 1) يغطي
 * الشجرة وحدها ويُعلن ذلك صراحة.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const SECRET_RULES = [
  { id: "openrouter-key", label: "مفتاح OpenRouter", pattern: /sk-or-v1-[A-Za-z0-9]{24,}/g },
  { id: "openai-key", label: "مفتاح OpenAI", pattern: /sk-(?!or-v1-|ant-)[A-Za-z0-9]{32,}/g },
  { id: "anthropic-key", label: "مفتاح Anthropic", pattern: /sk-ant-[A-Za-z0-9_-]{24,}/g },
  { id: "github-token", label: "رمز GitHub", pattern: /gh[pousr]_[A-Za-z0-9]{30,}/g },
  { id: "aws-access-key", label: "مفتاح وصول AWS", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: "slack-token", label: "رمز Slack", pattern: /xox[baprs]-[A-Za-z0-9-]{12,}/g },
  { id: "google-api-key", label: "مفتاح Google API", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: "private-key-block", label: "مفتاح خاص (PEM)", pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
  {
    id: "generic-secret-assignment",
    label: "إسناد سرّ عام",
    pattern: /(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|secret[_-]?key|client[_-]?secret|password|passwd|passwort)\s*[:=]\s*["']([^"'\s]{16,})["']/g,
  },
];

/** قيم تبدو كأسرار ولكنها حشو توثيقي أو عناصر نائبة. */
const PLACEHOLDER_RE =
  /^(?:example|placeholder|sample|dummy|test|testing|your|mine|todo|changeme|redacted|xxx+|\*+|\.{3}|<[^>]*>|\$\{[^}]*\}|[a-z]+-[a-z]+-[a-z]+)$|example|placeholder|dummy|redacted|your-|ihre-|dein|beispiel/i;

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "coverage", "test-results", "playwright-report", ".vercel", "out", "build",
]);
const SKIP_EXT = new Set([
  ".zip", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".ico", ".mp3", ".wav", ".ogg", ".m4a", ".opus", ".flac",
  ".woff", ".woff2", ".ttf", ".eot", ".dwnb", ".pdf", ".br", ".map", ".svgz", ".vsix",
]);
const MAX_FILE_BYTES = 1024 * 1024;

export function loadAllowlist(root) {
  const file = path.join(root, "scripts", "secret-scan-allowlist.json");
  if (!existsSync(file)) return new Set();
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return new Set((parsed.entries ?? []).map((entry) => `${entry.path}::${entry.rule}`));
}

export function isSkippedPath(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.some((part) => SKIP_DIRS.has(part))) return true;
  const ext = path.extname(relativePath).toLowerCase();
  return SKIP_EXT.has(ext);
}

/** يفحص نصًّا واحدًا ويعيد المواضع المطابقة (بعد استبعاد العناصر النائبة). */
export function scanText(text, relativePath, allowlist = new Set()) {
  const findings = [];
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    for (const rule of SECRET_RULES) {
      if (allowlist.has(`${relativePath}::${rule.id}`)) continue;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`);
      let match;
      while ((match = regex.exec(line)) !== null) {
        const value = match[0];
        if (rule.id === "generic-secret-assignment") {
          const captured = match[1] ?? "";
          if (PLACEHOLDER_RE.test(captured)) continue;
        } else if (PLACEHOLDER_RE.test(value)) {
          continue;
        }
        findings.push({
          path: relativePath,
          line: index + 1,
          rule: rule.id,
          label: rule.label,
          evidence: redact(value),
        });
        if (match.index === regex.lastIndex) regex.lastIndex += 1;
      }
    }
  });
  return findings;
}

/** يُخفي معظم السلسلة ويُبقي أول 4 أحرف وآخر 4 للتعرّف عليها دون نشرها. */
export function redact(value) {
  const flat = value.replace(/\s+/g, " ").slice(0, 120);
  if (flat.length <= 10) return "*".repeat(flat.length);
  return `${flat.slice(0, 4)}…${flat.slice(-4)} (${flat.length} حرفًا)`;
}

const git = (args, root) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });

function isGitRepo(root) {
  try {
    git(["rev-parse", "--is-inside-work-tree"], root);
    return true;
  } catch {
    return false;
  }
}

function scanContent(content, relativePath, allowlist) {
  if (content.length > MAX_FILE_BYTES) return [];
  if (content.slice(0, 8192).includes("\0")) return []; // محتوى ثنائي
  return scanText(content, relativePath, allowlist);
}

export function scanTree(root, allowlist) {
  if (!isGitRepo(root)) return { findings: [], scanned: 0, note: "not a git repository" };
  const files = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"], root)
    .split("\0")
    .filter(Boolean)
    .filter((file) => !isSkippedPath(file));
  const findings = [];
  let scanned = 0;
  for (const file of files) {
    const absolute = path.join(root, file);
    if (!existsSync(absolute)) continue;
    try {
      if (statSync(absolute).size > MAX_FILE_BYTES) continue;
    } catch {
      continue;
    }
    const content = readFileSync(absolute, "utf8");
    scanned += 1;
    findings.push(...scanContent(content, file, allowlist));
  }
  return { findings, scanned, note: "" };
}

/** يفحص **محتوى الفهرس** لا نسخة القرص: ما سيُلتزم فعلًا. */
export function scanStaged(root, allowlist) {
  if (!isGitRepo(root)) return { findings: [], scanned: 0, note: "not a git repository" };
  const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACM", "-z"], root)
    .split("\0")
    .filter(Boolean)
    .filter((file) => !isSkippedPath(file));
  const findings = [];
  let scanned = 0;
  for (const file of staged) {
    let content;
    try {
      content = git(["show", `:${file}`], root);
    } catch {
      continue;
    }
    scanned += 1;
    findings.push(...scanContent(content, file, allowlist));
  }
  return { findings, scanned, note: "" };
}

export function scanHistory(root, allowlist, { maxFiles = 40000, allowFetch = true } = {}) {
  if (!isGitRepo(root)) return { findings: [], scanned: 0, commits: 0, shallow: false, note: "not a git repository" };
  let shallow = existsSync(path.join(root, ".git", "shallow"));
  // CI يسحب نسخة ضحلة (fetch-depth: 1) فلا يرى التاريخ. نُكمله إن أمكن بدل أن
  // نُعلن السلامة على تاريخ لم يُفحص. الفشل (بلا شبكة) يُبلَّغ صراحة ولا يُخفى.
  if (shallow && allowFetch) {
    try {
      git(["fetch", "--unshallow", "origin"], root);
      shallow = existsSync(path.join(root, ".git", "shallow"));
    } catch {
      /* يُترك shallow كما هو ويُبلَّغ أدناه */
    }
  }
  if (shallow) {
    return {
      findings: [],
      scanned: 0,
      commits: 0,
      shallow,
      note: "نسخة ضحلة (fetch-depth: 1): التاريخ غير مكتمل، فلم يُفحص — الشجرة وحدها فُحصت",
    };
  }
  let commits = [];
  try {
    commits = git(["rev-list", "--all"], root).split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    commits = [];
  }
  const seen = new Set();
  const findings = [];
  let scanned = 0;
  for (const commit of commits) {
    if (scanned >= maxFiles) break;
    let files = [];
    try {
      files = git(["ls-tree", "-r", "--name-only", commit], root).split("\n").map((line) => line.trim()).filter(Boolean);
    } catch {
      continue;
    }
    for (const file of files) {
      if (scanned >= maxFiles) break;
      if (isSkippedPath(file)) continue;
      const key = `${file}::${commit}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let content;
      try {
        content = git(["show", `${commit}:${file}`], root);
      } catch {
        continue;
      }
      scanned += 1;
      for (const finding of scanContent(content, file, allowlist)) {
        findings.push({ ...finding, commit: commit.slice(0, 8) });
      }
    }
  }
  // نفس السر في نفس الملف عبر التزامات مختلفة = بلاغ واحد بالتزام الأقدم.
  const unique = new Map();
  for (const finding of findings) {
    const key = `${finding.path}::${finding.rule}::${finding.line}::${finding.evidence}`;
    if (!unique.has(key)) unique.set(key, finding);
  }
  return { findings: [...unique.values()], scanned, commits: commits.length, shallow, note: "" };
}

function report(results, { json }) {
  const all = results.flatMap((result) => result.findings);
  if (json) {
    console.log(JSON.stringify({ ok: all.length === 0, results, findings: all }, null, 2));
    return all.length === 0;
  }
  for (const result of results) {
    const state = result.findings.length === 0 ? "سليم" : `${result.findings.length} بلاغًا`;
    console.log(`- ${result.mode}: ${state} (فُحص ${result.scanned} ملفًا${result.commits ? ` عبر ${result.commits} التزامًا` : ""}${result.note ? ` · ${result.note}` : ""})`);
  }
  if (all.length > 0) {
    console.log("\nبلاغات الأسرار:");
    for (const finding of all) {
      const where = finding.commit ? `${finding.path}:${finding.line} @${finding.commit}` : `${finding.path}:${finding.line}`;
      console.log(`  ${where} — ${finding.label} [${finding.rule}] ${finding.evidence}`);
    }
    console.log("\nإن كان البلاغ قيمة تجريبية مقصودة، أضف استثناءً موثّقًا بسببه في scripts/secret-scan-allowlist.json.");
  }
  return all.length === 0;
}

function main() {
  const argv = process.argv.slice(2);
  const root = process.cwd();
  const modes = new Set(argv.filter((arg) => ["--tree", "--staged", "--history"].includes(arg)));
  if (modes.size === 0) modes.add("--tree");
  const allowlist = loadAllowlist(root);
  const results = [];
  if (modes.has("--staged")) results.push({ mode: "staged", ...scanStaged(root, allowlist) });
  if (modes.has("--tree")) results.push({ mode: "tree", ...scanTree(root, allowlist) });
  if (modes.has("--history")) results.push({ mode: "history", ...scanHistory(root, allowlist, { allowFetch: !argv.includes("--no-fetch") }) });
  const ok = report(results, { json: argv.includes("--json") });
  if (!ok && !argv.includes("--warn")) process.exitCode = 1;
}

if (process.argv[1] && /secret-scan\.mjs$/.test(process.argv[1])) main();
