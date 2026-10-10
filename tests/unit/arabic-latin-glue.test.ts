import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * تدقيق 2026-10-10: بقايا لصق بين كلمة عربية وكلمة ألمانية في حقول الشرح والمتن
 * (مثل «ومuss» و«المatura» و«للIndikativ») لم تُكتشف لأن المدقّق يبحث عن كلمات عربية صافية.
 * هذا الاختبار يمنع عودتها في بيانات المحتوى: لا يُسمح بحرف عربي مُلتصق بأول حرف لاتيني.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|json)$/.test(name)) out.push(path);
  }
  return out;
}

// حرف الجر أو الواو أو «ال» ملتصقًا بكلمة لاتينية (بعد بداية الكلمة)، أو كلمة عربية مُلتصقة بكلمة لاتينية.
const PREFIX_GLUE = /(?<![\u0600-\u06FF\w])[\u0648\u0628\u0644\u0643\u0641](?=[A-Z][A-Za-z]{1,})/gu;
const ARABIC_LATIN_RUN = /[\u0621-\u063A\u0641-\u064A]{2,}[A-Za-z]{2,}/gu;

// كلمة عربية من حرفين فأكثر مُلتصقة برقم («الغرفة203»)؛ التدقيق سجّل 81 حالة قبل إصلاح e889b88.
const ARABIC_DIGIT_GLUE = /[\u0621-\u063A\u0641-\u064A]{2,}[0-9]|[0-9][\u0621-\u063A\u0641-\u064A]{2,}/gu;

describe("Arabic/Latin glue in content data", () => {
  const files = walk(join(process.cwd(), "src", "data"));

  it("scans a non-trivial corpus", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has no Arabic word glued to a digit", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      ARABIC_DIGIT_GLUE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ARABIC_DIGIT_GLUE.exec(text))) hits.push(`${file.split("src/data/")[1]}: ${match[0]}`);
    }
    expect(hits).toEqual([]);
  });

  it("has no Arabic letter glued to a Latin word", () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const pattern of [PREFIX_GLUE, ARABIC_LATIN_RUN]) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text))) {
          hits.push(`${file.split("src/data/")[1]}: ${match[0]}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
