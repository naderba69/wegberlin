export const SECRET_AUDIT_VERSION = "secret-audit-v1" as const;

export type SecretFinding = {
  ruleId: string;
  path: string;
  line: number;
  column: number;
  fingerprint: string;
};

type SecretRule = { id: string; pattern: RegExp };

const KNOWN_NON_SECRET_FIXTURES = new Set(["sk-or-v1-EXAMPLEEXAMPLEEXAMPLE"]);

const privateKeyPattern = new RegExp(["-----BEGIN ", "(?:RSA |EC |DSA |OPENSSH )?", "PRIVATE KEY-----"].join(""), "g");

const rules: SecretRule[] = [
  { id: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,255}\b/g },
  { id: "google-api-key", pattern: /\bAIza[0-9A-Za-z_-]{30,100}\b/g },
  { id: "aws-access-key", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: "openai-style-key", pattern: /\bsk-[A-Za-z0-9][A-Za-z0-9_-]{19,200}\b/g },
  { id: "stripe-live-key", pattern: /\b(?:sk|rk)_live_[0-9A-Za-z]{16,200}\b/g },
  { id: "slack-token", pattern: /\bxox[baprs]-[0-9A-Za-z-]{20,250}\b/g },
  { id: "huggingface-token", pattern: /\bhf_[A-Za-z0-9]{30,200}\b/g },
  { id: "authorization-bearer", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{24,500}\b/g },
  { id: "private-key", pattern: privateKeyPattern },
];

export function redactSecret(value: string) {
  const compact = value.replace(/\s+/g, " ");
  if (compact.length <= 10) return `[redacted:${compact.length}]`;
  return `${compact.slice(0, 4)}…${compact.slice(-4)}[${compact.length}]`;
}

export function scanSecretText(text: string, path = "<text>"): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = text.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      for (let match = rule.pattern.exec(line); match; match = rule.pattern.exec(line)) {
        if (KNOWN_NON_SECRET_FIXTURES.has(match[0])) continue;
        findings.push({
          ruleId: rule.id,
          path,
          line: lineIndex + 1,
          column: match.index + 1,
          fingerprint: redactSecret(match[0]),
        });
        if (match[0].length === 0) rule.pattern.lastIndex += 1;
      }
    }
  }
  return findings;
}
