# Academic Content Zod Validation Report

Generated: 2026-09-04  
Version: `academic-governance-v1`  
Content SHA-256: `429a49cc3e1e5a7a93a1d3f7dea2075f83715d9bcbaab735d846b8e744e7571a`

## Result

`PASS` — 5912 top-level runtime academic objects passed 12 strict Zod schema families, including every nested lesson stage, question, exercise, library item, diagnostic item, exam task, profile, source, dashboard, and derived review card.

| Root collection | Objects | Validation |
|---|---:|---|
| lessons | 84 | Zod strict + nested objects |
| lessonMetadata | 84 | Zod strict + nested objects |
| readingLibrary | 80 | Zod strict + nested objects |
| listeningLibrary | 80 | Zod strict + nested objects |
| diagnosticQuestions | 32 | Zod strict + nested objects |
| examTasks | 150 | Zod strict + nested objects |
| fullExamDashboards | 12 | Zod strict + nested objects |
| examProfiles | 2 | Zod strict + nested objects |
| examSources | 5 | Zod strict + nested objects |
| reviewCards | 2016 | Zod strict + nested objects |
| nounGrammarEntries | 664 | Zod strict + nested objects |
| anchorNouns | 336 | Zod strict + nested objects |
| inventoryNouns | 328 | Zod strict + nested objects |
| measuredNounTargets | 460 | Zod strict + nested objects |
| unjustifiedInventoryNouns | 0 | Zod strict + nested objects |
| nounTargetsWithoutMorphology | 0 | Zod strict + nested objects |
| readingQuestions | 252 | Zod strict + nested objects |
| authoredReadingEvidence | 252 | Zod strict + nested objects |
| inferenceReadingEvidence | 23 | Zod strict + nested objects |
| readingQuestionsWithoutEvidence | 0 | Zod strict + nested objects |
| unverifiedReadingEvidence | 0 | Zod strict + nested objects |
| listeningQuestions | 252 | Zod strict + nested objects |
| authoredListeningEvidence | 252 | Zod strict + nested objects |
| inferenceListeningEvidence | 27 | Zod strict + nested objects |
| listeningQuestionsWithoutEvidence | 0 | Zod strict + nested objects |
| unverifiedListeningEvidence | 0 | Zod strict + nested objects |
| verbPrepositionFrames | 262 | Zod strict + nested objects |
| derivedVerbFrames | 118 | Zod strict + nested objects |
| measuredValencyTargets | 141 | Zod strict + nested objects |
| unjustifiedDerivedFrames | 0 | Zod strict + nested objects |
| **Total top-level objects** | **5912** | **0 schema failures** |

## Cross-reference gates

- published lesson metadata → academic lesson object;
- diagnostic listening item → real listening-library item;
- exam task/profile/dashboard → known official source IDs;
- matching item → option ID;
- listening item → clip ID;
- choice/listening correct index → available option;
- full dashboard → published provider-owned task ID;
- unique IDs within every root collection.

The committed report is checked during `prebuild`; content drift without regenerated reports fails the build.
