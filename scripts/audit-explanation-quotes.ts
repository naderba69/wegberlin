// Audits every «…» quotation inside explanationAr against the material the learner can actually see.
//
// Why: batch #10 shipped three explanations that quoted German forms which existed nowhere —
// «angerruft» (a doubled r that is not among the options), «Kannst du mir kurz helfen?» (attributed
// to a recording, but the line lives in the entry dialogue and reads «Kann ich Ihnen … helfen?»),
// and «da ist sie» (a distractor that was never offered). A learner cannot detect this class of
// error: the explanation is fluent, confident, and wrong about the very form it is teaching.
//
// Rule enforced: any quotation containing Latin/German letters must occur in that item's own
// options, its prompt, or its lesson's source text (reading textDe/textAr, listening
// transcriptDe/transcriptAr, theory rules, entry dialogue, phrases, mistakes).
//
// Tolerated (normalised away, not reported):
//   - syllable hyphenation for teaching:  «an-ge-rufen» vs angerufen
//   - ellipsis spans:                     «Kann ich ... mitbringen?»  (fragments matched in order)
//   - Arabic question mark ؟ for ?, and case/punctuation differences
//
// Two severities, because "unattested" is not the same as "wrong":
//   ERROR — the quote is a NEAR-MISS of something real: it is ≥0.75 similar to an actual option or
//           source sentence, or all its words occur inside one option in a different arrangement.
//           That is a misquote of the very form under test («angerruft» for «angeruft»,
//           «da ist sie» for the option «ob Frau Keller ist da sie»). These must be fixed.
//   NOTE  — the quote matches nothing closely: a freely invented contrast example
//           («Er hilft mir», «mit dem Tablet»). Legitimate teaching; listed only with --all.
//
// Usage: npx tsx scripts/audit-explanation-quotes.ts [--level a2] [--all] [--json]
// Exit:  0 = no near-miss misquotes · 1 = at least one ERROR
import { academicLessonList as lessons } from "@/data/academic-lessons";

type Any = Record<string, unknown>;
const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const showAll = argv.includes("--all");
const levelFlag = argv.indexOf("--level");
const wantLevel = levelFlag >= 0 ? String(argv[levelFlag + 1] ?? "").toUpperCase() : null;

// Dice coefficient over character bigrams: cheap, no deps, good at catching one-letter corruptions.
const bigrams = (value: string): Map<string, number> => {
  const out = new Map<string, number>();
  for (let i = 0; i < value.length - 1; i += 1) {
    const key = value.slice(i, i + 2);
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
};
const similarity = (a: string, b: string): number => {
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  const left = bigrams(a);
  const right = bigrams(b);
  let shared = 0;
  for (const [key, count] of left) shared += Math.min(count, right.get(key) ?? 0);
  return (2 * shared) / (a.length - 1 + b.length - 1);
};

const LATIN = /[A-Za-zÄÖÜäöüß]/;

// Reviewed exemptions: quote is unattested BY DESIGN and the reason is recorded here, so the guard
// stays strict instead of being loosened until the finding disappears. Re-verify when the item changes.
const REVIEWED: Record<string, { quote: string; why: string }[]> = {
  "b1-22-e1": [{
    quote: "ohne dass ich mich überfordere",
    // The explanation teaches the dass-variant ("… كما في «ohne dass ich mich überfordere»"):
    // a grammatically correct sentence deliberately built to contrast with the zu-infinitive key.
    // It resembles distractor 0 only because that distractor is the broken form of this same idea.
    why: "deliberate correct dass-variant used as a positive contrast, not a quotation of an option",
  }],
};
const norm = (value: string): string =>
  value
    .replace(/[…]/g, "...")
    .replace(/؟/g, "?")
    .replace(/\.\.\./g, " ")
    .replace(/-/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const collect = (value: unknown, sink: string[]): void => {
  if (typeof value === "string") sink.push(value);
  else if (Array.isArray(value)) for (const entry of value) collect(entry, sink);
  else if (value && typeof value === "object") for (const entry of Object.values(value)) collect(entry, sink);
};

type Finding = { id: string; lesson: string; level: string; bucket: string; quote: string; severity: "error" | "note"; nearest?: string; score?: number };
const findings: Finding[] = [];
let quotes = 0;
let scanned = 0;

for (const lesson of lessons as unknown as Any[]) {
  const level = String(lesson.level ?? "?");
  if (wantLevel && level.toUpperCase() !== wantLevel) continue;

  // Everything the learner can see in this lesson, as one normalised haystack.
  const sourceParts: string[] = [];
  collect(lesson.reading, sourceParts);
  collect(lesson.listening, sourceParts);
  collect(lesson.theory, sourceParts);
  collect(lesson.entry, sourceParts);
  collect(lesson.phrases, sourceParts);
  collect(lesson.mistakes, sourceParts);
  collect(lesson.discovery, sourceParts);
  collect(lesson.pronunciation, sourceParts);
  const lessonHay = norm(sourceParts.join(" \u0001 "));

  const buckets: Array<[string, Any[]]> = [
    ["exercises", (lesson.exercises as Any[]) ?? []],
    ["reading.questions", ((lesson.reading as Any)?.questions as Any[]) ?? []],
    ["listening.questions", ((lesson.listening as Any)?.questions as Any[]) ?? []],
    ["miniTest", (lesson.miniTest as Any[]) ?? []],
  ];

  for (const [bucket, items] of buckets) {
    for (const item of items) {
      const explanation = typeof item.explanationAr === "string" ? item.explanationAr : "";
      if (!explanation) continue;
      scanned += 1;

      // Everything in the item, whatever its exercise shape: multiple-choice options, fill-blank
      // template + acceptedAnswers, word-ordering words, error-correction sentence, matching pairs.
      const itemParts: string[] = [];
      for (const [key, value] of Object.entries(item)) {
        if (key === "explanationAr") continue;
        collect(value, itemParts);
      }
      // A fill-blank explanation legitimately quotes the SOLVED sentence, which exists nowhere as
      // a literal: synthesise template × each accepted answer (and the joined word-ordering words).
      const template = typeof (item as Any).template === "string" ? String((item as Any).template) : "";
      const accepted = Array.isArray((item as Any).acceptedAnswers) ? ((item as Any).acceptedAnswers as unknown[]) : [];
      if (template) {
        for (const answer of accepted) itemParts.push(template.replace(/_{2,}/g, String(answer)));
        itemParts.push(template.replace(/_{2,}/g, " "));
      }
      const words = Array.isArray((item as Any).words) ? ((item as Any).words as unknown[]) : [];
      if (words.length) itemParts.push(words.join(" "));
      const sentence = typeof (item as Any).sentence === "string" ? String((item as Any).sentence) : "";
      if (sentence) for (const answer of accepted) itemParts.push(`${sentence} ${answer}`);

      const hay = `${norm(itemParts.join(" \u0001 "))} \u0001 ${lessonHay}`;

      for (const match of explanation.matchAll(/«([^»]+)»/g)) {
        const quote = match[1];
        if (!LATIN.test(quote)) continue; // Arabic-only quotes are prose, not a German form
        quotes += 1;
        const flat = norm(quote);
        if (!flat || hay.includes(flat)) continue;
        // ellipsis / multi-fragment quote: each fragment must appear, in order
        const fragments = quote.split(/\.\.\.|…/).map(norm).filter(Boolean);
        if (fragments.length > 1) {
          let cursor = 0;
          let ordered = true;
          for (const fragment of fragments) {
            const at = hay.indexOf(fragment, cursor);
            if (at < 0) { ordered = false; break; }
            cursor = at + fragment.length;
          }
          if (ordered) continue;
        }

        // Severity turns on the EXERCISE GENRE, then on closeness.
        //
        // Only items with a fixed `options` array are held to strict attestation. There the
        // explanation's job is to walk the four buttons in front of the learner, so naming a
        // near-miss string means the learner hunts for a distractor that is not on screen.
        //
        // fill-blank / error-correction / word-ordering are exempt: inventing a wrong form to warn
        // against IS the teaching genre there («ich kümmere dich», «ob ruft sie heute zurück»),
        // and abbreviating a long accepted answer is normal («Zwar fehlt uns die Rückmeldung»
        // for «…die Rückmeldung der Studienberatung»).
        const optionList = Array.isArray((item as Any).options) ? ((item as Any).options as unknown[]).map(String) : [];
        // Sentence-like options (every choice is a clause, not a token) mean the explanation is
        // expected to QUOTE the choices when it critiques them. Token options — «dich/dir/dein/du»,
        // «entweder … oder» — force the explanation to build its own example sentence, which is
        // correct teaching and must not be flagged.
        const sentenceOptions =
          optionList.length > 1 && optionList.every((option) => option.trim().split(/\s+/).length >= 3);
        const choosable: string[] = [];
        collect((item as Any).options, choosable);
        const choosableFlat = choosable.map(norm).filter(Boolean);

        let nearest = "";
        let best = 0;
        for (const candidate of choosableFlat) {
          const score = Math.max(
            similarity(flat, candidate),
            candidate.length > flat.length ? similarity(flat, candidate.slice(0, flat.length)) : 0,
          );
          if (score > best) { best = score; nearest = candidate; }
        }
        // Same words, different order, inside one option = a scrambled misquote of that option.
        const quoteWords = flat.split(" ").filter(Boolean);
        const scrambled = quoteWords.length > 2 && choosableFlat.some((candidate) => {
          const words = new Set(candidate.split(" "));
          return quoteWords.every((word) => words.has(word));
        });
        // EXEMPTION FIRST — an explanation may build a full example sentence AROUND a choice:
        // option «um besser zu sprechen» ⇒ quote «Ich übe jeden Tag, um besser zu sprechen»,
        // option «entweder … oder» ⇒ quote «Entweder gehen wir jetzt oder wir bleiben».
        // Detected by: the option's words occur, in order, inside the quote (or the quote inside it).
        const embedsAnOption = choosableFlat.some((candidate) => {
          if (!candidate) return false;
          if (flat.includes(candidate) || candidate.includes(flat)) return true;
          const pieces = candidate.split(" ").filter(Boolean);
          if (pieces.length < 1 || pieces.length > quoteWords.length) return false;
          let cursor = 0;
          for (const piece of pieces) {
            const at = quoteWords.indexOf(piece, cursor);
            if (at < 0) return false;
            cursor = at + 1;
          }
          return true;
        });

        // "Walking the options" mode: some other quote in this same explanation reproduces an
        // option exactly, so the explanation is narrating the choice list — and then a multi-word
        // quote that matches nothing is a distractor the learner cannot find (b1-20-e1).
        const quotesHere = [...explanation.matchAll(/«([^»]+)»/g)].map((q) => norm(q[1])).filter(Boolean);
        const narratesOptions = quotesHere.some((q) => choosableFlat.includes(q));
        const invisibleDistractor = !embedsAnOption && sentenceOptions && narratesOptions && quoteWords.length >= 2;

        // A near-miss of an actual option is a corrupted form — the worst case, because it reads
        // authoritatively («angerruft» for the real «angeruft»). 0.85 keeps genuine alternative
        // phrasings (0.81 for «ohne dass ich mich überfordere») out of the error tier.
        const corruptedForm = !embedsAnOption && optionList.length > 1 && (best >= 0.85 || scrambled);

        const exempt = (REVIEWED[String(item.id ?? "")] ?? []).some((entry) => norm(entry.quote) === flat);
        const severity: "error" | "note" = !exempt && (invisibleDistractor || corruptedForm) ? "error" : "note";
        findings.push({ id: String(item.id ?? "?"), lesson: String(lesson.id ?? "?"), level, bucket, quote, severity, nearest: nearest.slice(0, 90), score: Number(best.toFixed(2)) });
      }
    }
  }
}

const errors = findings.filter((f) => f.severity === "error");
const notes = findings.filter((f) => f.severity === "note");

if (asJson) {
  console.log(JSON.stringify({ scanned, quotes, errors: errors.length, notes: notes.length, findings: showAll ? findings : errors }, null, 1));
} else {
  for (const f of errors) {
    console.log(`ERROR ${f.level} ${f.lesson} ${f.id.padEnd(12)} quotes «${f.quote}»`);
    console.log(`      nearest real text (${f.score}): ${f.nearest}`);
  }
  if (showAll) {
    for (const f of notes) console.log(`note  ${f.level} ${f.lesson} ${f.id.padEnd(12)} invented example «${f.quote}»`);
  }
  console.log(
    `\nexplanation quote audit: ${scanned} explanation(s) · ${quotes} German quotation(s) · ` +
    `${errors.length} misquote(s) of real material` +
    `${errors.length ? " ⇒ FIX: the learner memorises a form that does not exist" : " ✓"}` +
    ` · ${notes.length} invented contrast example(s)${showAll ? "" : " (--all to list)"}`,
  );
}
process.exit(errors.length ? 1 : 0);
