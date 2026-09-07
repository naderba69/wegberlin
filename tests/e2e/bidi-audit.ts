import { GERMAN_STOPWORD_RE, ENGLISH_MARKER_RE, LATIN_WORD_RE, OPAQUE_TOKEN_RE, TECHNICAL_TERMS, UMLAUT_RE } from "@/core/a11y/bidi";

/**
 * P0-254: مدقق DOM لكل جزء مختلط لغويًا.
 *
 * القاعدة (وهي نفسها قاعدة `src/core/a11y/bidi.ts`، من مصدر واحد):
 * 1. كل Runs لاتيني يُصنَّف ألمانيًا يجب أن يكون أقرب وسم `lang` له `de`،
 *    واتجاهه المحسوب `ltr` — وإلا فقارئ الشاشة يقرأه بصوت عربي أو يُصفه RTL.
 * 2. ما لا يُصنَّف ألمانيًا (مصطلح تقني) ليس مخالفة، لكن عزله الاتجاهي مطلوب
 *    إن وُجد في جملة عربية؛ وهذا ما يفعله `BidiText` عند التطبيق.
 *
 * تُمرَّر الأنماط كنصوص لأن `page.evaluate` لا ينقل كائنات RegExp بين السياقات
 * بصورة موثوقة، وإعادة بنائها من `.source` تبقي المصدر واحدًا.
 */
export const bidiAuditPatterns = {
  latinSource: LATIN_WORD_RE.source,
  umlautSource: UMLAUT_RE.source,
  stopSource: GERMAN_STOPWORD_RE.source,
  opaqueSource: OPAQUE_TOKEN_RE.source,
  englishSource: ENGLISH_MARKER_RE.source,
  englishFlags: "iu",
  flags: "u",
  technical: [...TECHNICAL_TERMS],
};

export type BidiViolation = {
  route: string;
  tag: string;
  text: string;
  kind: "missing-lang" | "wrong-direction";
};

export type BidiAuditReport = {
  route: string;
  scanned: number;
  violations: Array<Omit<BidiViolation, "route">>;
};

export const bidiAuditInPage = (patterns: typeof bidiAuditPatterns) => {
  const latinRe = new RegExp(patterns.latinSource, patterns.flags + "g");
  const umlautRe = new RegExp(patterns.umlautSource, patterns.flags);
  const stopRe = new RegExp(patterns.stopSource, patterns.flags);
  const opaqueRe = new RegExp(patterns.opaqueSource, patterns.flags);
  const englishRe = new RegExp(patterns.englishSource, patterns.englishFlags);
  const technical = new Set(patterns.technical);
  const violations: Array<{ tag: string; text: string; kind: "missing-lang" | "wrong-direction" }> = [];
  let scanned = 0;

  /** نفس ترتيب `classifyLatinRun` في `src/core/a11y/bidi.ts`: مصدر واحد. */
  const classify = (text: string): "de" | "en" | "other" => {
    const tokens = text.split(/\s+/u).map((token) => token.replace(/[^\p{L}\d-]/gu, "")).filter(Boolean);
    if (tokens.length === 0) return "other";
    if (tokens.every((token) => technical.has(token))) return "other";
    if (opaqueRe.test(text.trim())) return "other";
    if (tokens.some((token) => opaqueRe.test(token))) return "other";
    const germanSignal = umlautRe.test(text) || stopRe.test(text);
    if (!germanSignal && englishRe.test(text)) return "en";
    if (tokens.length >= 3) return "de";
    if (germanSignal) return "de";
    return /^\p{Lu}/u.test(text) ? "de" : "other";
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node.textContent ?? "").trim();
    if (text.length < 2) continue;
    const runs = text.match(latinRe);
    if (!runs) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (parent.closest("[aria-hidden='true']")) continue;
    if (["SCRIPT", "STYLE", "CODE", "NOSCRIPT", "OPTION"].includes(parent.tagName)) continue;
    if (getComputedStyle(parent).display === "none" || getComputedStyle(parent).visibility === "hidden") continue;

    for (const run of runs) {
      // الحروف اللاتينية وحدها (لا الحروف الألمانية) هي ما يحدد "Run" ذا معنى:
      // حرف واحد مثل `A` في شارة المستوى، أو رقم، ليس نصًا ألمانيًا يجب وسمه.
      if (run.replace(/[^\p{L}]/gu, "").length < 2) continue;
      const language = classify(run);
      if (language === "other") continue;
      scanned += 1;
      const marked = parent.closest("[lang]");
      const lang = marked?.getAttribute("lang") ?? null;
      if (lang !== language) {
        violations.push({ tag: parent.tagName, text: `${language}·${run.slice(0, 70)}`, kind: "missing-lang" });
      } else if (getComputedStyle(parent).direction !== "ltr") {
        violations.push({ tag: parent.tagName, text: run.slice(0, 80), kind: "wrong-direction" });
      }
    }
  }
  return { scanned, violations };
};
