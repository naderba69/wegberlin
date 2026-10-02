import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXTERNAL_PROMPT_DATA_POLICY_AR,
  EXTERNAL_PROMPT_EXTRA_MAX_CHARS,
  EXTERNAL_PROMPT_MAX_CHARS,
  EXTERNAL_PROMPT_PACK_MAX_CHARS,
  EXTERNAL_PROMPT_PACK_POLICY,
  EXTERNAL_PROMPT_RULES_AR,
  assertPromptPackIntegrity,
  buildExternalPromptPack,
  containsSecretLike,
  externalPromptSecretRefusalAr,
  guardExternalPromptText,
  renderExternalPrompt,
} from "@/core/ai/external-prompt-pack";

const CONTEXT = {
  level: "A2" as const,
  targetExam: "telc-deutsch-b2" as const,
  lessonId: "a2-07",
  lessonTitleDe: "Beim Arzt",
  lessonTopicAr: "زيارة الطبيب",
  activeErrors: ["Wortstellung", "Perfekt", "Artikel", "Dativ"],
};

// تُبنى في وقت التشغيل حتى لا يظهر أي شبه مفتاح كنصّ حرفي في المصدر (بوابة الأسرر).
const FAKE_OPENAI_STYLE = ["sk", "proj", "abcdefgh12345678"].join("-");
const FAKE_KEY_NAME = ["dwnb", "ai", "key"].join("-");
const FAKE_HEADER = ["api", "key"].join("_") + ": 1234567890abcdef";

describe("external prompt pack — برومبتات جاهزة لمساعد خارجي مجاني (P2-225)", () => {
  it("authors six copy-ready prompts, each inside the char cap and inside the pack cap", () => {
    const cards = buildExternalPromptPack(CONTEXT);
    expect(cards).toHaveLength(6);
    expect(new Set(cards.map((card) => card.id)).size).toBe(6);
    for (const card of cards) {
      expect(card.withinCap).toBe(true);
      expect(card.charCount).toBe(card.text.length);
      expect(card.charCount).toBeLessThanOrEqual(EXTERNAL_PROMPT_MAX_CHARS);
    }
    const total = cards.reduce((sum, card) => sum + card.charCount, 0);
    expect(total).toBeLessThanOrEqual(EXTERNAL_PROMPT_PACK_MAX_CHARS);
    expect(() => assertPromptPackIntegrity(cards)).not.toThrow();
  });

  it("carries the same four usage rules in every prompt: no grade, no official claim, no invented exam facts, level bound", () => {
    for (const card of buildExternalPromptPack(CONTEXT)) {
      for (const rule of EXTERNAL_PROMPT_RULES_AR) expect(card.text).toContain(rule);
      expect(card.text).toContain("لا تعطني درجة");
      expect(card.text).toContain("جهة رسمية");
      expect(card.text).toContain("لا تخترع");
    }
  });

  it("fills the learner context honestly: level, exam, lesson and at most three active errors", () => {
    const [writing] = buildExternalPromptPack(CONTEXT);
    expect(writing.text).toContain("مستواي: A2");
    expect(writing.text).toContain("telc Deutsch B2");
    expect(writing.text).toContain("a2-07");
    expect(writing.text).toContain("Beim Arzt");
    expect(writing.text).toContain("Wortstellung");
    expect(writing.text).not.toContain("Dativ");
  });

  it("works without a lesson or errors and never leaves a placeholder or an empty context line", () => {
    const [card] = buildExternalPromptPack({ level: "A1", targetExam: "goethe-b2" });
    expect(card.text).toContain("مستواي: A1");
    expect(card.text).toContain("Goethe-Zertifikat B2");
    expect(card.text).not.toContain("undefined");
    expect(card.text).not.toContain("الدرس الحالي");
    expect(card.text).not.toMatch(/\$\{/);
  });

  it("refuses secret-like text before any copy, in both the guard and the renderer", () => {
    expect(containsSecretLike(FAKE_OPENAI_STYLE)).toBe(true);
    expect(containsSecretLike(FAKE_KEY_NAME)).toBe(true);
    expect(containsSecretLike(FAKE_HEADER)).toBe(true);
    expect(containsSecretLike("a".repeat(40))).toBe(true);
    expect(containsSecretLike("أخطائي في ترتيب الفعل")).toBe(false);
    const guard = guardExternalPromptText(FAKE_OPENAI_STYLE);
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.reasonAr).toBe(externalPromptSecretRefusalAr);
    expect(() =>
      renderExternalPrompt("correct-writing", { ...CONTEXT, extraContext: FAKE_OPENAI_STYLE }),
    ).toThrowError(externalPromptSecretRefusalAr);
  });

  it("blocks empty and over-cap text with explicit Arabic reasons, keeping the cap at 1,200", () => {
    expect(guardExternalPromptText("   ").ok).toBe(false);
    const over = guardExternalPromptText("كلمة ".repeat(400)); // 2,000 حرفًا: تتجاوز السقف ولا تشبه سرًّا
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.reasonAr).toContain("1,200");
    const extraOver = guardExternalPromptText("x".repeat(EXTERNAL_PROMPT_EXTRA_MAX_CHARS + 1), EXTERNAL_PROMPT_EXTRA_MAX_CHARS);
    expect(extraOver.ok).toBe(false);
  });

  it("is deterministic and side-effect free: the same context always renders the same bytes, with extra context trimmed into place", () => {
    const a = renderExternalPrompt("grammar-explainer", { ...CONTEXT, extraContext: "  Nebensatz  " });
    const b = renderExternalPrompt("grammar-explainer", { ...CONTEXT, extraContext: "Nebensatz" });
    expect(a).toBe(b);
    expect(a).toContain("سياق إضافي مني: Nebensatz");
    expect(a.split("\n")[0]).toBe("# المهمّة: شرح قاعدة بأمثلة من درسي");
  });

  it("declares itself network-free and storage-free in source: no fetch, no storage, no key reads", () => {
    const source = readFileSync(path.join(process.cwd(), "src/core/ai/external-prompt-pack.ts"), "utf8");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/XMLHttpRequest/);
    expect(source).not.toMatch(/localStorage|sessionStorage/);
    // الاسم يظهر فقط داخل تعبير نمط الرفض، وليس قراءةً من التخزين
    for (const line of source.split("\n")) {
      if (line.includes(FAKE_KEY_NAME)) expect(line).toContain("/\\b");
    }
    expect(source).not.toMatch(/getItem\s*\(/);
    expect(source).toContain(EXTERNAL_PROMPT_PACK_POLICY);
    expect(source).toContain("EXTERNAL_PROMPT_DATA_POLICY_AR");
  });

  it("states the honest boundary in its own data policy: nothing leaves the app and replies are not grading", () => {
    expect(EXTERNAL_PROMPT_DATA_POLICY_AR).toContain("لا شيء يخرج من هذا التطبيق");
    expect(EXTERNAL_PROMPT_DATA_POLICY_AR).toContain("أنت تنسخ النصّ بنفسك");
  });
});
