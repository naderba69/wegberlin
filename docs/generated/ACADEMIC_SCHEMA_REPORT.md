# Academic Content Zod Validation Report

Generated: 2026-09-05  
Version: `academic-governance-v1`  
Content SHA-256: `8ff50e524d4dffb6f8d321742d850196c2019fa92327237d1156c12d2ad2e640`

## Result

`PASS` — 3750 top-level runtime academic objects passed 16 strict Zod schema families, including every nested lesson stage, question, exercise, library item, diagnostic item, exam task, profile, source, dashboard, derived review card, lexical grammar record, conditional Tunisian-support note, adaptive dictation, branching conversation, and collocation network.

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
| nounGrammarEntries | 1044 | Zod strict + nested objects |
| verbPrepositionFrames | 104 | Zod strict + nested objects |
| tunisianSupportNotes | 17 | Zod strict + nested objects |
| dictationItems | 16 | Zod strict + nested objects |
| branchingConversationScenarios | 8 | Zod strict + nested objects |
| collocationNetworks | 16 | Zod strict + nested objects |
| **Total top-level objects** | **3750** | **0 schema failures** |

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
