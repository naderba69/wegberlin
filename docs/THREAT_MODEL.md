# Threat model — local-first learning data

Policy: `local-first-threat-model-v1`  
Date: 2026-09-10 · Africa/Tunis

## Assets

LearningState, free writing, typed speaking transcripts, local audio Blobs, DWNB archives, restore points, API keys in sessionStorage, and Offline caches.

## Trust boundaries and controls

| Boundary | Threat | Control | Residual boundary |
|---|---|---|---|
| Browser → Gemini/OpenRouter/Ollama | sending more than the approved text | one-send consent, minimized provider-specific payloads, strict response schemas | the selected provider receives the explicitly approved text and may retain it under its own policy |
| UI → logs/errors | token in an error object, URL, or header | `adversarial-sensitive-field-redaction-v1` recursively removes sensitive keys, bearer values, known token forms, and query credentials; adversarial tests cover nesting, arrays, cycles, and URLs | do not treat redaction as permission to log learner answers |
| IndexedDB → JSON/DWNB | accidental secret inclusion | API key exists only in sessionStorage; raw export declares `includesSessionStorage:false`; DWNB manifest declares `includesSecrets:false` | raw exports include learner text and Base64 media by explicit action |
| Import archive → IndexedDB | path traversal, zip bomb, corruption, partial mutation | bounded size/entry count, safe paths, SHA-256, strict Zod, PBKDF2/AES-GCM, atomic multi-store commit and restore point | a valid archive can intentionally replace data only after preview/confirmation |
| Profile → media | cross-profile audio reference | profile-prefixed media IDs and atomic import namespace | users sharing one browser account can access the browser profile |
| Offline cache → old curriculum | partial promotion or poisoned checkpoint | same-origin safe paths, checksum checkpoint, staging cache, atomic promotion | curriculum rollback remains separate from learner-data restore |
| Source/ZIP → public Git | PAT or secret committed | working-tree and full-history secret audit, pre-commit hook, safe AskPass Termux upload | user must still protect the PAT outside the project |

## Explicit non-controls

There is no browser lockdown, remote invigilation, account isolation, cloud backup, automatic pronunciation score, phoneme alignment, or guarantee against a compromised browser/OS. Optional local Whisper STT performs expected-word matching only and never uploads audio. CSP reduces network destinations but does not replace device security.

## Verification

`tests/unit/threat-model-redaction.test.ts` uses adversarial nested structures, headers, query strings, arrays, cycles, Gemini/OpenRouter/GitHub token shapes, and confirms that ordinary German/Arabic learning content remains intact. Secret audits remain independent defense in depth.
