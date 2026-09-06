import { describe, expect, it } from "vitest";
import {
  isSkippedPath,
  redact,
  scanText,
  scanTree,
  SECRET_RULES,
} from "../../scripts/secret-scan.mjs";

/**
 * قيم الاختبار تُبنى بالوصل لا كتابةً: لو كُتبت حرفيًا لصار ملف الاختبار نفسه
 * بلاغًا في فحص الشجرة، ولاحتاج استثناءً يُضعف البوابة.
 */
const TAIL = "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8";
const fake = (prefix: string) => [prefix, TAIL].join("");

const SECURITY_FIXTURES: Array<{ rule: string; line: string }> = [
  { rule: "openrouter-key", line: `const key = "${fake("sk-or-v1-")}";` },
  { rule: "openai-key", line: `const key = "${fake("sk-")}";` },
  { rule: "anthropic-key", line: `const key = "${fake("sk-ant-")}";` },
  { rule: "github-token", line: `token: "${fake("ghp_")}",` },
  { rule: "aws-access-key", line: `AWS_ACCESS_KEY_ID=${JSON.stringify(["AKIA", "ABCDEFGHIJKLMNOP"].join(""))}` },
  { rule: "slack-token", line: `slack = "${fake("xoxb-")}"` },
  { rule: "google-api-key", line: `mapsKey = ${JSON.stringify(["AIza", "SyD-abcdefghijklmnopqrstuvwxyz12345"].join(""))}` },
  { rule: "private-key-block", line: ["-----BEGIN RSA", "PRIVATE KEY-----"].join(" ") },
  { rule: "generic-secret-assignment", line: `password: "${fake("pw-")}"` },
];

describe("P0-304: automated secret scan", () => {
  it("names a rule for every high-signal credential shape this project can leak", () => {
    // المفتاح الذي يقبله التطبيق (OpenRouter) واجهةٌ أساسية، والبقية أشكال عامة.
    expect(SECRET_RULES.map((rule) => rule.id)).toEqual([
      "openrouter-key",
      "openai-key",
      "anthropic-key",
      "github-token",
      "aws-access-key",
      "slack-token",
      "google-api-key",
      "private-key-block",
      "generic-secret-assignment",
    ]);
  });

  it("detects each rule and reports the file, line and a redacted value", () => {
    for (const fixture of SECURITY_FIXTURES) {
      const findings = scanText(fixture.line, "src/config.ts");
      expect(findings.map((finding) => finding.rule), fixture.rule).toContain(fixture.rule);
      const finding = findings.find((item) => item.rule === fixture.rule);
      expect(finding?.path).toBe("src/config.ts");
      expect(finding?.line).toBe(1);
      // البلاغ لا يعيد السر كاملًا: لا يُنشر ما يُكتشف.
      expect(finding?.evidence, fixture.rule).not.toContain(fixture.line);
    }
  });

  it("does not cry wolf on documentation placeholders, short ids or ordinary code", () => {
    const clean = [
      "const AI_KEY_STORAGE = \"dwnb-ai-key\";",
      "sessionStorage.setItem(\"dwnb-ai-key\", value);",
      "// مثال توثيقي: sk-or-v1-EXAMPLEEXAMPLEEXAMPLE",
      "password: \"your-password-here\"",
      "const OPENROUTER_MODEL = \"openrouter/free\";",
    ];
    for (const line of clean) expect(scanText(line, "src/app/page.tsx"), line).toEqual([]);
  });

  it("redacts without erasing the ability to recognise the finding", () => {
    const redacted = redact(fake("sk-or-v1-"));
    expect(redacted).not.toContain("A1b2C3d4E5f6");
    expect(redacted).toMatch(/^sk-o…/); // أول أربعة أحرف تبقى للتعرّف على النوع
    expect(redact("short")).toBe("*****");
  });

  it("skips dependency, build and binary paths", () => {
    for (const candidate of ["node_modules/x/index.js", ".next/static/chunk.js", "public/audio/a1-01.mp3", "build/out.png"]) {
      expect(isSkippedPath(candidate)).toBe(true);
    }
    for (const candidate of ["src/app/page.tsx", "scripts/secret-scan.mjs", "public/sw.js"]) {
      expect(isSkippedPath(candidate)).toBe(false);
    }
  });

  it("honours a documented allowlist without silently disabling a whole file", () => {
    const line = `const key = "${fake("sk-or-v1-")}";`;
    const allowed = new Set(["docs/example.md::openrouter-key"]);
    expect(scanText(line, "docs/example.md", allowed)).toEqual([]);
    // نفس السطر في ملف آخر ما زال بلاغًا: الاستثناء بمسار + قاعدة، لا بالملف ولا بالقيمة.
    expect(scanText(line, "src/config.ts", allowed).map((finding) => finding.rule)).toContain("openrouter-key");
  });

  it("leaves the committed working tree clean", () => {
    const result = scanTree(process.cwd());
    expect(result.scanned).toBeGreaterThan(300);
    expect(result.findings).toEqual([]);
  });
});
