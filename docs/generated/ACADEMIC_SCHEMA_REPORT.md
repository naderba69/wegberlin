# Academic Content Zod Validation Report

Definition date: 2026-09-05 (audit spec, not the run date; the content fingerprint below is authoritative)  
Version: `academic-governance-v1`  
Content SHA-256: `a4e0b0a20d8f58032b5b186a2eb4aa7c07bf9eed34d396ab2d350fdaabad59ec`

## Result

`PASS` — 4345 top-level runtime academic objects passed 16 strict Zod schema families, including every nested lesson stage, question, exercise, library item, diagnostic item, exam task, profile, source, dashboard, derived review card, lexical grammar record, conditional Tunisian-support note, adaptive dictation, branching conversation, and collocation network.

| Root collection | Objects | Validation |
|---|---:|---|
| lessons | 96 | Zod strict + nested objects |
| lessonMetadata | 96 | Zod strict + nested objects |
| readingLibrary | 80 | Zod strict + nested objects |
| listeningLibrary | 80 | Zod strict + nested objects |
| diagnosticQuestions | 32 | Zod strict + nested objects |
| examTasks | 150 | Zod strict + nested objects |
| fullExamDashboards | 12 | Zod strict + nested objects |
| examProfiles | 2 | Zod strict + nested objects |
| examSources | 5 | Zod strict + nested objects |
| reviewCards | 2304 | Zod strict + nested objects |
| nounGrammarEntries | 1297 | Zod strict + nested objects |
| verbPrepositionFrames | 134 | Zod strict + nested objects |
| tunisianSupportNotes | 17 | Zod strict + nested objects |
| dictationItems | 16 | Zod strict + nested objects |
| branchingConversationScenarios | 8 | Zod strict + nested objects |
| collocationNetworks | 16 | Zod strict + nested objects |
| **Total top-level objects** | **4345** | **0 schema failures** |

## Cross-reference gates

- published lesson metadata → academic lesson object;
- diagnostic listening item → real listening-library item;
- exam task/profile/dashboard → known official source IDs;
- matching item → option ID;
- listening item → clip ID;
- choice/listening correct index → available option;
- full dashboard → published provider-owned task ID;
- Tunisian-support note → published lesson and theory block;
- partial dictation template → complete canonical answer;
- branching choice → reachable local node and all three terminal outcomes;
- collocation node → stable parent-network ownership;
- unique IDs within every root collection.

The committed report is checked during `prebuild`; content drift without regenerated reports fails the build.
