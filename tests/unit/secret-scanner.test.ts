import { describe, expect, it } from "vitest";
import { redactSecret, scanSecretText, SECRET_AUDIT_VERSION } from "@/core/security/secret-scanner";
import { scanSecretText as scanRuntimeSecretText } from "@/core/security/secret-scanner-runtime.mjs";

const githubToken = ["ghp", "_", "a".repeat(36)].join("");
const googleKey = ["AI", "za", "B".repeat(35)].join("");
const awsKey = ["AK", "IA", "A".repeat(16)].join("");
const openAiStyle = ["s", "k-", "b".repeat(32)].join("");
const privateKeyHeader = ["-----BEGIN ", "PRIVATE KEY-----"].join("");

describe("P0 secret scanner",()=>{
  it("detects representative provider credentials without storing raw values in findings",()=>{
    const findings=scanSecretText([githubToken,googleKey,awsKey,openAiStyle].join("\n"),"fixture.env");
    expect(new Set(findings.map((finding)=>finding.ruleId))).toEqual(new Set(["github-token","google-api-key","aws-access-key","openai-style-key"]));
    expect(scanRuntimeSecretText([githubToken,googleKey,awsKey,openAiStyle].join("\n"),"fixture.env")).toEqual(findings);
    expect(JSON.stringify(findings)).not.toContain(githubToken);
    expect(findings.every((finding)=>finding.path==="fixture.env"&&finding.line>0&&finding.column>0)).toBe(true);
  });

  it("detects private-key headers and long bearer credentials",()=>{
    const bearer=["Bearer ","c".repeat(40)].join("");
    const findings=scanSecretText(`${privateKeyHeader}\n${bearer}`);
    expect(findings.map((finding)=>finding.ruleId)).toEqual(["private-key","authorization-bearer"]);
  });

  it("does not flag short documented placeholders, the known historical fixture, or ordinary model IDs",()=>{
    const historicalFixture=["sk-or-v1-","EXAMPLE".repeat(3)].join("");
    const text=["ghp_XXXXضع_التوكن_هنا","TOKEN=YOUR_TOKEN_HERE",historicalFixture,"openrouter/free","gemini-2.5-flash","sessionStorage[dwnb-ai-key]"].join("\n");
    expect(scanSecretText(text,"docs/example.md")).toEqual([]);
    expect(scanRuntimeSecretText(text,"docs/example.md")).toEqual([]);
    expect(scanSecretText(["sk-or-v1-","A".repeat(40)].join(""))).toHaveLength(1);
  });

  it("redacts the middle and exposes only bounded fingerprint metadata",()=>{
    const redacted=redactSecret(githubToken);
    expect(redacted).toMatch(/^ghp_…aaaa\[40\]$/);
    expect(redacted).not.toContain("a".repeat(12));
  });

  it("keeps a stable audit version for CI and hook contracts",()=>{
    expect(SECRET_AUDIT_VERSION).toBe("secret-audit-v1");
  });
});
