/**
 * P0-254: تدقيق منهجي لكل جزء مختلط لغويًا (عربي/ألماني)، لا عينات.
 *
 * المشكلة: الواجهة عربية بـ`<html lang="ar" dir="rtl">`، وداخلها مئات الأجزاء
 * الألمانية — كلمات وجمل وخيارات — إضافة إلى مصطلحات ألمانية **مدمجة داخل جمل
 * عربية مؤلفة** (`Perfekt`، `Dativ`، `Partizip II`). بدون وسْم لغوي يقرأ قارئ
 * الشاشة الألمانية بصوت عربي، وبدون عزل اتجاهي (Bidi isolation) تختلط علامات
 * الترقيم والأرقام المحايدة بين Runs متعاكسة الاتجاه.
 *
 * الحدود المُعلنة: هذا تصنيف إرشاقي (heuristic) لا معجم ألماني. الكلمات
 * الاستفهامية والأدوات والكلمات التي تحمل حروفًا ألمانية (ä/ö/ü/ß) تُصنَّف
 * ألمانية يقينًا، والكلمة المفردة الكبيرة غير الموجودة في قائمة المصطلحات
 * التقنية تُصنَّف ألمانية لأن محتوى المشروع كذلك فعليًا (`dass`, `Dativ`,
 * `Partizip`). أسماء التقنيات والعلامات والصفات الإنجليزية تُعزل اتجاهيًا
 * بلا وسْم لغوي، حتى لا ننسبها إلى الألمانية زورًا.
 */

export const BIDI_POLICY_VERSION = "bidi-isolation-v1" as const;

/** كلمة لاتينية (ألمانية أو إنجليزية أو مصطلح). */
export const LATIN_WORD_RE = /[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß'’\-]*(?:\s+[A-Za-zÄÖÜäöüß'’\-]+)*/gu;
export const UMLAUT_RE = /[äöüßÄÖÜ]/u;
export const GERMAN_STOPWORD_RE = /\b(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|und|oder|aber|denn|ich|du|er|sie|es|wir|ihr|mir|dir|sich|ist|sind|bin|bist|war|waren|hat|haben|habe|hatte|hatten|werden|wird|wurde|kann|können|könnte|muss|müssen|soll|sollte|will|wollen|nicht|kein|keine|mit|von|zu|zum|zur|für|auf|in|im|am|an|aus|bei|nach|vor|über|unter|durch|um|wie|was|wo|wer|wann|warum|weil|dass|ob|wenn|als|obwohl|indem|dadurch|deshalb|trotzdem|danach|gern|sehr|gut|heiße|heißen|kommen|wohnen|sprechen|lesen|schreiben|lernen|machen|gehen|deutsch|Deutsch|bitte|danke|tschüss|hallo|guten|Person|Verb|Satz|Wort|Frage|Antwort|sein|seine|seit|bis|noch|schon|dann|also|nur|man|wenn|weil|da|so|ja|nein|zwei|drei|alle|etwas|mehr|immer|heute|morgen|gestern)\b/u;

/** مصطلحات تقنية وأسماء علامات وخصائص: تُعزل اتجاهيًا بلا وسْم `lang="de"`. */
export const TECHNICAL_TERMS = new Set([
  "AI", "API", "CEFR", "Chrome", "Chromium", "DWNB", "DW", "Gemini", "GitHub", "Goethe", "Hueber",
  "IndexedDB", "JSON", "MP3", "Ollama", "OpenRouter", "PDF", "Pixel", "SHA", "SM", "TTS", "URL",
  "USB", "Vercel", "Wi-Fi", "ZIP", "Shadowing", "Berlin", "Deutschland", "Telc", "telc", "B2", "A1", "A2", "B1",
  // مصطلحات تقنية شائعة في نصوص الواجهة العربية: تُعزل اتجاهيًا بلا وسْم لغوي.
  "Session", "Storage", "Browser", "Cache", "Offline", "Pack", "Tier", "Free", "Playwright", "Vitest",
  "Axe", "Zod", "Next", "React", "TypeScript", "Android", "Linux", "Server", "Proxy", "Kernel", "Backup",
]);

export type MixedRun = { text: string; latin: boolean };
export type IsolatedSegment = { text: string; isolate: boolean; german: boolean };

/** يقسّم النص إلى Runs متتالية: لاتينية (قد تكون ألمانية) وما عداها. */
export function splitMixedRuns(text: string): MixedRun[] {
  const runs: MixedRun[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LATIN_WORD_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) runs.push({ text: text.slice(lastIndex, start), latin: false });
    runs.push({ text: match[0], latin: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) runs.push({ text: text.slice(lastIndex), latin: false });
  return runs;
}

/** هل هذا الـRun اللاتيني ألماني؟ (إرشاقي — انظر حدود الملف) */
export function isGermanRun(run: string): boolean {
  const tokens = run.split(/\s+/u).map((token) => token.replace(/[^\p{L}\d-]/gu, "")).filter(Boolean);
  if (tokens.length === 0) return false;
  if (tokens.every((token) => TECHNICAL_TERMS.has(token))) return false;
  if (tokens.length >= 3) return true;
  if (UMLAUT_RE.test(run)) return true;
  if (GERMAN_STOPWORD_RE.test(run)) return true;
  // كلمة مفردة كبيرة الحرف الأول ليست مصطلحًا تقنيًا: في هذا المحتوى ألمانية غالبًا
  // (Perfekt, Dativ, Partizip, Kasus). تُعزل وتُوسم ألمانية.
  return /^\p{Lu}/u.test(run);
}

/** خطة العرض: أي جزء يُعزل اتجاهيًا، وأي جزء يأخذ `lang="de"`. */
export function isolateSegments(text: string): IsolatedSegment[] {
  return splitMixedRuns(text).map((run) => ({
    text: run.text,
    isolate: run.latin,
    german: run.latin && isGermanRun(run.text),
  }));
}

/** عدد الأجزاء اللاتينية التي تحتاج عزلًا: مقياس للمدقق. */
export function latinRunCount(text: string) {
  return splitMixedRuns(text).filter((run) => run.latin).length;
}
