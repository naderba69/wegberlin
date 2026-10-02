import { Info, Keyboard, ShieldCheck } from "lucide-react";
import {
  defaultPhonemeReferenceLexicon,
  lookupPhonemeReference,
  type PhonemeReferenceLexicon,
} from "@/core/german/phoneme-reference";
import { GERMAN_SPELLING_HINT_POLICY_VERSION } from "@/core/german/spelling-phoneme-hints";
import { PHONEME_ENGINE_STATUS_LINE_AR, phonemeReadinessFlags } from "@/core/german/phoneme-policy";

/**
 * Shows what is *known* about a word's sounds before the learner records again:
 * the human-authored IPA when the curriculum has one, plus spelling-to-sound
 * hints. It has no access to audio, so it cannot and does not evaluate speech.
 */
export function PhonemeWordReference({
  word,
  lexicon = defaultPhonemeReferenceLexicon,
}: {
  word: string;
  lexicon?: PhonemeReferenceLexicon;
}) {
  const reference = lookupPhonemeReference(word, lexicon);
  const authored = reference.state === "authored-reference" ? reference.entry : null;
  const missingReason = reference.state === "no-authored-reference" ? reference.reasonAr : null;
  return (
    <div
      className="phoneme-word-reference"
      data-phoneme-reference={reference.policyVersion}
      data-phoneme-readiness={phonemeReadinessFlags.phonemeAssessment ? "open" : "closed"}
    >
      <header>
        <h5><Info size={14} aria-hidden="true" /> المرجع الصوتي للكلمة</h5>
        <small>شرح للكتابة الصوتية فقط، ولا يقيس نطقك.</small>
      </header>
      {authored ? (
        <p className="phoneme-reference-authored">
          <code dir="ltr" data-bidi-scope="technical" lang="de">{authored.ipa}</code>
          <span className="phoneme-reference-chips" lang="de" dir="ltr">
            {authored.phonemes.map((phoneme, index) => (
              <bdi key={`${phoneme}-${index}`} dir="ltr" data-bidi-scope="technical">{phoneme}</bdi>
            ))}
          </span>
          <small>IPA مؤلَّف بشريًا وموجود في المنهج ({authored.source}).</small>
        </p>
      ) : (
        <p className="phoneme-reference-missing">
          <ShieldCheck size={13} aria-hidden="true" /> {missingReason}
        </p>
      )}
      {reference.hints.length > 0 && (
        <ul className="phoneme-spelling-hints" data-spelling-hints={GERMAN_SPELLING_HINT_POLICY_VERSION}>
          {reference.hints.map((hintEntry) => (
            <li key={hintEntry.id}>
              <code dir="ltr" data-bidi-scope="technical" lang="de">{hintEntry.letters}</code>
              <bdi dir="ltr" data-bidi-scope="technical">{`[${hintEntry.ipa.join(" ")}]`}</bdi>
              <Keyboard size={12} aria-hidden="true" className="hint-icon" />
              <span>{hintEntry.guidanceAr}</span>
            </li>
          ))}
        </ul>
      )}
      <footer>{PHONEME_ENGINE_STATUS_LINE_AR}</footer>
    </div>
  );
}
