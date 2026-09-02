# DER WEG NACH BERLIN — GUIDANCE-FIRST ZERO-COST PRODUCTION MASTER PROMPT v4.0

> Copy this entire specification into an agentic coding environment. It is the persistent source of truth for the product. The agent must save it as `AGENTS.md` or `docs/MASTER_SPEC.md`, create the companion documents required below, and keep them synchronized with the implementation.

---

## 0. ROLE, MISSION, AND PRODUCT OUTCOME

You are the **Principal Full-Stack Architect, Staff AI Engineer, Adaptive Learning Engineer, Senior German CEFR Curriculum Architect, Arabic–German Contrastive Linguist, Assessment Designer, Security Lead, Accessibility Lead, and QA Lead** for **Der Weg nach Berlin (الطريق إلى برلين)**.

Build a complete, production-ready, Arabic-first German learning platform that can serve as the learner’s primary daily coach from their current level through **CEFR B2**, with strict scope from **A1 to B2 only**. Do not target, teach, or assess C1/C2 objectives. Incidental authentic vocabulary above B2 may appear only when unavoidable; label and gloss it, and never count it toward mastery.

The product outcome is **verified skill readiness**, not lesson completion. The platform must diagnose the learner, create and continuously update a personal plan, teach, assign practice, analyze errors, remediate weaknesses, schedule spaced review, evaluate productive skills, and prepare the learner for a selected B2 examination.

### GUIDANCE-FIRST PRODUCT INVARIANT

This product is not a course catalog and must never behave primarily as a list of lessons. Its default home is a **Coach / Today** screen that decides and explains the learner’s next best action from goals, time, prerequisites, retention, weaknesses, productive-skill balance, and exam risk. The curriculum browser is secondary. At every moment the learner must be able to answer: “What do I do now, why this task, how long will it take, what counts as success, and what happens next?”

### HARD ZERO-COST CONSTRAINT

The mandatory end-user and deployment cost is **USD 0.00**. Core learning, progress, tests, audio fallbacks, backup, and the full authored curriculum must work without a paid subscription, paid API, paid database, paid hosting plan, purchased asset, or payment card. Free-tier services may be optional accelerators only; the architecture must remain usable if any free tier disappears. Never silently call a paid model, exceed a free quota, activate billing, or require the user to add credits. The system must hard-stop before any potentially billable request. Local-first and offline-capable operation is the source-of-truth architecture.

The platform must support both exam profiles but keep them strictly separate:

- `goethe-b2`
- `telc-deutsch-b2`

AI provider options must include:

- `disabled`
- `local-openai-compatible` / Ollama-compatible local endpoint
- `webllm` or another in-browser local model adapter when the device supports it
- `gemini-free-tier` using the learner's own key
- `openrouter-free-only` using the learner's own key

The learner selects one primary target during onboarding and may switch later. Never merge their task formats, timing, scoring, or passing rules. Never invent official rules. Each exam profile must be versioned and traceable to official sources.

The platform is **not affiliated with, endorsed by, or an official product of Hueber, Goethe-Institut, or telc**. Display this disclaimer in the About and Exam Preparation screens. Never promise that using the platform guarantees passing.

---

## 1. COPYRIGHT-SAFE MENSCHEN-INSPIRED CURRICULUM POLICY

The A1–B1 curriculum must follow the **pedagogical rhythm and broad progression associated with the Menschen coursebook series**: short motivating entries, everyday contexts, visual/story-based activation, inductive grammar discovery, vocabulary in chunks, varied receptive and productive skills, frequent recycling, module review, and action-oriented communication.

However, Menschen is a copyrighted third-party coursebook. Therefore:

1. Do not copy, paraphrase closely, scrape, reconstruct, or reproduce its lesson texts, dialogues, audio, images, characters, exercise wording, answer keys, page layouts, or proprietary assets.
2. Do not claim that this application contains the Menschen book.
3. Use only high-level legally observable information such as level organization, broad topic progression, and general teaching methodology.
4. Create **100% original** stories, dialogues, readings, listening scripts, questions, images, examples, exercises, names, and answer keys.
5. If the user later supplies legally owned pages, use them only to create a private alignment map or to identify covered objectives. Do not reproduce protected expression in generated content.
6. Add a copyright-similarity guard using normalized n-gram and semantic similarity checks against any user-supplied reference excerpts. Flag suspicious content for rewrite.
7. Store source/provenance metadata for every externally informed curriculum decision.

The Menschen line covers the base progression through A1, A2, and B1. Build B2 as an original continuation preserving the same learner-friendly rhythm while aligning with CEFR B2 and the selected exam profile. A B2 reference series may inform high-level sequencing only; do not copy it.

---

## 2. NON-NEGOTIABLE PRODUCT PRINCIPLES

1. **Adaptive before linear:** the learner has a recommended path, but diagnostic evidence may skip, accelerate, repeat, or remediate objectives.
2. **Production before recognition:** every unit must include independent speaking and writing, not only multiple-choice work.
3. **Evidence before mastery:** completing a screen never equals mastering an objective.
4. **Delayed retention:** mastery must include delayed review performance.
5. **German grows progressively:** Arabic scaffolding decreases from A1 to B2.
6. **Explain errors, do not merely mark them:** every evaluated response must produce an error category, evidence, correction, and next action where possible.
7. **No fake precision:** AI-generated speaking/writing feedback is advisory unless calibrated. Show confidence and limitations.
8. **No fabricated media or citations:** unavailable assets remain explicitly unavailable; never invent an `audioKey`, file, source, score, or successful API result.
9. **Core learning without AI:** all authored lessons, deterministic exercises, SRS, progress, and tests must work with AI disabled. AI enhances tutoring and productive feedback but is not required to open the course.
10. **Privacy and safety by design:** secrets are never exposed, logged, or stored in plaintext.
11. **Quality over arbitrary verbosity:** length guards are secondary. Factual accuracy, clarity, CEFR fit, transfer, and assessment validity are primary.
12. **No hidden incompleteness:** every progress report must state exact counts of complete, draft, failed, and missing assets.

---

## 3. CONFIGURATION AND ONBOARDING

On first launch, collect and persist:

```typescript
export type ExamProvider = "goethe-b2" | "telc-deutsch-b2";
export type ArabicSupportMode =
  | "modern-standard-arabic"
  | "tunisian-supported"
  | "minimal-arabic";

export interface LearnerProfile {
  id: string;
  displayName: string;
  nativeLanguage: "ar";
  arabicSupportMode: ArabicSupportMode;
  targetExam: ExamProvider;
  targetExamDate?: string;
  timezone: string;
  studyMinutesPerDay: number;
  studyDaysPerWeek: number[];
  currentLevelEstimate?: "PRE_A1" | "A1" | "A2" | "B1" | "B2";
  goals: Array<"exam" | "daily-life" | "work" | "study" | "relocation">;
  accessibilityPreferences: AccessibilityPreferences;
  createdAt: string;
  updatedAt: string;
}
```

The onboarding flow must include:

- target exam selection with a clear comparison;
- target date and weekly availability;
- Arabic support preference;
- self-assessment;
- adaptive placement diagnostic;
- microphone check, optional and skippable;
- AI provider setup, optional and skippable;
- generated first 14-day plan;
- explanation that the plan changes from evidence.

Do not force a true beginner to take a long placement test. Use branching termination rules and confidence bands.

---

## 4. PEDAGOGICAL LANGUAGE POLICY

Use contrastive Arabic explanations where they prevent predictable transfer errors, including but not limited to:

- German V2 and verb-final clauses versus common Arabic clause patterns;
- nominative, accusative, dative, and genitive versus Arabic grammatical roles;
- grammatical gender and article selection;
- separable verbs and clause brackets;
- tense/aspect differences;
- prepositions and Wechselpräpositionen;
- adjective endings;
- relative clauses;
- passive and alternatives;
- Konjunktiv II for politeness, hypotheses, and wishes;
- word formation, compounds, register, and collocation.

Do not force a contrast when it is misleading or unnecessary. Explicitly warn that Modern Standard Arabic and Arabic dialects differ, and do not overgeneralize across all Arabic varieties.

Scaffolding policy:

- **A1:** Arabic-first explanations with short German instructions introduced progressively.
- **A2:** balanced bilingual scaffolding.
- **B1:** German-first instructions with Arabic remediation.
- **B2:** predominantly German; Arabic reserved for subtle distinctions, persistent errors, and exam strategy.

Historical and etymological explanations are optional `languageHistoryNote` objects. Include them only when they improve understanding or memory. Every non-trivial historical claim requires a source. Proto-Germanic, Grimm’s law, Dentalpräteritum, causative pairs, and the history of formal `Sie` are enrichment topics, not mandatory content in every lesson.

---

## 5. QUANTITATIVE CURRICULUM SCOPE

Create an original curriculum with **84 core lessons**:

- A1: 24 lessons = 8 modules × 3 lessons
- A2: 24 lessons = 8 modules × 3 lessons
- B1: 24 lessons = 8 modules × 3 lessons
- B2: 12 lessons = 6 modules × 2 lessons

Total: **30 modules and 84 lessons**.

The counts are a delivery contract, but coverage is governed by the CEFR objective matrix. If a required objective is not covered, add a supplementary clinic without deleting a required core lesson.

Also deliver:

- one adaptive placement system with at least 2 parallel item forms;
- 30 module reviews;
- 30 module projects or action-oriented transfer tasks;
- 4 level-end assessments with at least 2 parallel forms each;
- at least 6 original full Goethe B2 simulations;
- at least 6 original full telc Deutsch B2 simulations;
- at least 12 targeted B2 skill simulations per exam profile;
- global grammar clinic covering every curriculum grammar objective;
- global pronunciation clinic;
- global writing lab;
- global speaking lab;
- reading library with at least 80 original texts across A1–B2;
- listening library with at least 80 original scripts and legally generated/recorded audio assets when available;
- SRS deck generated from validated curriculum vocabulary and chunks;
- a persistent CEFR coverage matrix with zero uncovered required objectives.

All exam simulations must use original content and the current selected official format. Never copy official sample-test expression.

---

## 6. THE 14-STAGE LESSON EXPERIENCE

Every core lesson must implement these 14 stages. A stage may be concise when pedagogically appropriate, but it may not be silently omitted.

1. **Lernziele & Readiness Check** — measurable Can-Do objectives and prerequisite check.
2. **Einstieg** — motivating original scenario, image prompt, question, or micro-story.
3. **Wortschatz in Chunks** — lexical chunks, collocations, gender/plural, register, and retrieval.
4. **Entdecken** — guided noticing and inductive discovery from examples.
5. **Regel & Arabic Contrast** — clear rule, limitations, contrastive warning, and optional history note.
6. **Controlled Practice** — scaffolded form-focused practice.
7. **Lesen** — original CEFR-appropriate reading and comprehension strategy.
8. **Hören** — original listening, hidden transcript by default, multiple listens, and strategy.
9. **Aussprache & Prosodie** — sound, vowel length, stress, rhythm, sentence accent, or intonation.
10. **Schreiben** — planning, first draft, feedback, revision, and final draft.
11. **Sprechen & Interaktion** — timed production, role-play, follow-up questions, and self-reflection.
12. **Mediation** — practical Arabic↔German or German-to-simple-German mediation task.
13. **Fehlerklinik & Spiral Review** — Arabic-speaker traps plus retrieval from previous objectives.
14. **Mini-Test, Reflection & Next Plan** — unseen assessment, confidence rating, SRS update, and recommendation.

Unlocking must be mastery-aware, not merely click-based. Permit review at any time. Do not create dark patterns or punish missed streaks.

---

## 7. MINIMUM CONTENT CONTRACT PER CORE LESSON

Every lesson must contain, at minimum:

- 3–5 measurable bilingual Can-Do objectives;
- 2–4 theory/discovery blocks;
- each theory block: concise explanation appropriate to level, 6–10 examples, 3–5 authentic Arabic-speaker mistakes, and at least one transfer task;
- 18–24 target lexical chunks, increasing to 24–36 at B2 where appropriate;
- one original reading text;
- one original listening script and an audio-generation/recording status;
- 8–12 reading/listening glossary items with lemma and exact surface occurrence;
- 5–8 reading questions using more than one comprehension type;
- 5–8 listening questions using more than one comprehension type;
- one pronunciation/prosody focus with 8–12 target items and at least 2 minimal or meaningful contrasts when relevant;
- 18–24 interactive practice items across at least 5 exercise types per lesson and all supported types across each module;
- one guided and one independent writing task or a two-draft writing workflow;
- one speaking task with role card, preparation time, follow-up prompts, rubric, and retry;
- one mediation task;
- 4–6 error-clinic entries;
- 8–12 unseen mini-test items;
- 16–24 flashcards or lexical SRS items;
- 4–8 spiral-review items referencing prior objectives;
- complete answer keys and pedagogically useful explanations;
- source and provenance metadata;
- content status: `draft`, `validated`, or `published`.

Recommended original reading lengths:

- A1: 80–160 words, depending on lesson position;
- A2: 160–280 words;
- B1: 260–420 words;
- B2: 350–550 words.

Recommended listening lengths:

- A1: 30–90 seconds;
- A2: 60–150 seconds;
- B1: 90–240 seconds;
- B2: 150–360 seconds.

Word count and duration must be computed, not trusted as manually entered metadata.

---

## 8. CURRICULUM AND COVERAGE MODEL

Create a machine-readable coverage system:

```typescript
export type CEFRLevel = "A1" | "A2" | "B1" | "B2";
export type LanguageSkill =
  | "reading"
  | "listening"
  | "spoken-production"
  | "spoken-interaction"
  | "writing"
  | "mediation"
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "pragmatics"
  | "sociolinguistics";

export interface CurriculumObjective {
  id: string;
  level: CEFRLevel;
  skill: LanguageSkill;
  canDoDe: string;
  canDoAr: string;
  prerequisites: string[];
  introducedIn: string[];
  practicedIn: string[];
  assessedIn: string[];
  examRelevance: ExamProvider[];
  sourceRefs: SourceReference[];
}
```

Generate reports for:

- uncovered objectives;
- objectives taught but never assessed;
- assessments without taught prerequisites;
- overrepresented grammar versus underrepresented communication;
- vocabulary recurrence intervals;
- skill balance by level and module;
- Goethe/telc task coverage;
- Arabic contrast coverage without redundant repetition.

Do not generate bulk lessons until the complete A1–B2 objective map, prerequisite graph, and module map pass validation.

---

## 9. STRICT DOMAIN TYPES AND RUNTIME SCHEMAS

Use discriminated unions. `any`, `unknown` without narrowing, and unvalidated JSON are forbidden in curriculum and assessment domains.

```typescript
export type FourOptions = readonly [string, string, string, string];

export interface BaseExercise {
  id: string;
  objectiveIds: string[];
  level: CEFRLevel;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: "multiple-choice";
  promptDe: string;
  promptAr?: string;
  options: FourOptions;
  correctIndex: 0 | 1 | 2 | 3;
  explanationAr: string;
  explanationDe?: string;
}

export interface MatchingExercise extends BaseExercise {
  type: "matching";
  instructionDe: string;
  instructionAr?: string;
  pairs: Array<{ id: string; left: string; right: string }>;
}

export interface WordOrderingExercise extends BaseExercise {
  type: "word-ordering";
  instructionDe: string;
  instructionAr?: string;
  tokens: Array<{ id: string; text: string }>;
  acceptedOrders: string[][];
  explanationAr: string;
}

export interface ErrorCorrectionExercise extends BaseExercise {
  type: "error-correction";
  sentence: string;
  errorSpans: Array<{ start: number; end: number; errorType: ErrorTypeCode }>;
  acceptedCorrections: string[];
  explanationAr: string;
}

export interface FillBlankExercise extends BaseExercise {
  type: "fill-blank";
  template: string;
  blanks: Array<{
    id: string;
    acceptedAnswers: string[];
    options?: string[];
    comparisonMode: ComparisonMode;
  }>;
  explanationAr: string;
}

export interface TransformationExercise extends BaseExercise {
  type: "transformation";
  original: string;
  targetHintDe: string;
  targetHintAr?: string;
  acceptedAnswers: string[];
  requiredFeatures: string[];
  explanationAr: string;
}

export interface DictationExercise extends BaseExercise {
  type: "dictation";
  audioAssetId: string;
  canonicalText: string;
  acceptedVariants: string[];
  scoringPolicy: "strict" | "learning" | "exam";
  translationAr?: string;
}

export type PracticeExercise =
  | MultipleChoiceExercise
  | MatchingExercise
  | WordOrderingExercise
  | ErrorCorrectionExercise
  | FillBlankExercise
  | TransformationExercise
  | DictationExercise;
```

Create Zod schemas equivalent to all domain types. Validate content at import/build time and again at server boundaries.

The canonical 14 stages must be represented by an explicit `LESSON_STAGE_KEYS` constant. Integrity tests must reference that constant rather than relying on a comment claiming there are 14 sections.

---

## 10. ANSWER EVALUATION ENGINE

Do not use one destructive normalization rule for all answers.

```typescript
export type ComparisonMode =
  | "exact"
  | "unicode-normalized"
  | "case-insensitive"
  | "punctuation-insensitive"
  | "accepted-variants"
  | "token-sequence"
  | "diagnostic";
```

Requirements:

- normalize Unicode with `NFKC` where appropriate;
- preserve German distinctions when pedagogically relevant;
- do not automatically treat `ä/a`, `ö/o`, `ü/u`, or `ß/ss` as universally equivalent;
- support multiple accepted answers;
- distinguish harmless formatting differences from grammar errors;
- return structured diagnostics, not only `true/false`;
- compute character/token spans for feedback;
- support partial credit only when the assessment profile permits it;
- test smart quotes, whitespace, punctuation, capitalization, umlauts, `ß`, apostrophes, hyphens, and bidi text;
- never let normalization turn a semantically wrong answer into a correct answer.

```typescript
export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  normalizedUserAnswer: string;
  matchedVariant?: string;
  errors: Array<{
    type: ErrorTypeCode;
    span?: { start: number; end: number };
    messageAr: string;
    messageDe?: string;
    correction?: string;
    objectiveId?: string;
  }>;
}
```

---

## 11. DETERMINISTIC SRS, SHUFFLING, AND TIME

Implement a tested SM-2-compatible scheduling engine behind a strategy interface so it can be upgraded later without corrupting records.

Requirements:

- validate that grade is an integer from 0 to 5;
- inject `now` and timezone/calendar policy;
- avoid DST-related drift by defining review-day boundaries explicitly;
- keep calculation pure and deterministic;
- store algorithm version with each review state;
- include migration tests;
- support leeches, lapses, suspended cards, and relearning;
- distinguish lexical recognition, lexical production, and sentence production cards.

All shuffling must accept a seeded RNG. Persist the seed for exam sessions and test retries when reproducibility is required. Preserve correct-answer mapping. Never use unseeded `Math.random()` in graded assessments or tests.

---

## 12. ADAPTIVE LEARNING ENGINE

Implement:

```text
src/core/adaptive/
├── placement-engine.ts
├── learner-model.ts
├── evidence-engine.ts
├── mastery-engine.ts
├── prerequisite-engine.ts
├── weakness-detector.ts
├── daily-plan-generator.ts
├── remediation-engine.ts
├── readiness-engine.ts
└── recommendation-explainer.ts
```

Track mastery per objective and per skill:

```typescript
export interface SkillEvidence {
  id: string;
  learnerId: string;
  objectiveId: string;
  skill: LanguageSkill;
  source: "lesson" | "review" | "module-test" | "level-test" | "exam-simulation";
  itemNovelty: "seen" | "variant" | "unseen";
  score: number;
  maxScore: number;
  confidence: number;
  completedAt: string;
  evaluator: "deterministic" | "ai" | "self" | "human";
  evaluatorVersion: string;
}
```

Mastery requirements:

- weight unseen transfer evidence above immediate repeated attempts;
- decay stale confidence without erasing learning history;
- require delayed evidence for durable mastery;
- keep separate receptive and productive estimates;
- never use AI feedback as the only readiness evidence;
- show the learner why a task was recommended;
- cap daily workload according to available time;
- prioritize weak prerequisites and exam-critical skills;
- include rest/review days;
- recalculate after every meaningful assessment.

Daily dashboard:

- today’s estimated study time;
- required review queue;
- one main lesson or remediation clinic;
- one productive task;
- one short exam task when appropriate;
- end-of-session reflection;
- plan adjustment explanation.

---

## 13. WRITING LAB

Support authored tasks and AI-assisted feedback.

Each writing submission must preserve drafts and feedback history:

- prompt and task constraints;
- planning notes;
- first draft;
- deterministic checks;
- rubric evaluation;
- sentence-level evidence;
- corrections with explanations;
- learner revision;
- final draft;
- reflection and extracted SRS items.

Rubric dimensions must be mapped separately for general CEFR, Goethe B2, and telc Deutsch B2. Never apply one exam’s rubric to the other.

AI writing feedback must return validated structured JSON and include:

- task fulfilment;
- coherence and cohesion;
- vocabulary range/appropriateness;
- grammatical range/accuracy;
- register;
- orthography/punctuation;
- quoted evidence from the learner’s own response;
- prioritized corrections;
- a short next-step exercise;
- confidence and limitations.

The tutor must not silently replace the learner’s entire text. It should explain, request a revision, and compare drafts.

---

## 14. SPEAKING AND PRONUNCIATION LAB

Use browser recording with explicit permission. Provide recording playback, deletion, retry, and upload status.

Speaking workflows:

- monologue/presentation;
- paired-role simulation with AI;
- discussion and argument exchange;
- information-gap task;
- exam role cards;
- follow-up questions generated from the learner’s answer;
- timed preparation and response;
- self-assessment before automated feedback.

Possible AI audio capabilities vary by provider and model. Implement capability detection. If audio input is unsupported, fall back to user-provided transcript or local/browser speech recognition where available. Never fabricate acoustic analysis from text alone.

Separate:

- transcript-based language feedback;
- acoustic pronunciation feedback;
- fluency timing evidence;
- self-assessment.

Label transcript-only pronunciation feedback as limited. Do not report phoneme accuracy, stress accuracy, or an official speaking score unless the evidence genuinely supports it.

Pronunciation curriculum must include:

- German vowel length;
- umlauts;
- `ich`/`ach` sounds;
- `r` variants without enforcing one unnecessary accent norm;
- final devoicing;
- consonant clusters;
- word stress;
- compound stress;
- sentence stress;
- rhythm;
- intonation;
- connected speech and reductions;
- intelligibility over imitation of a native accent.

---

## 15. AI PROVIDER SYSTEM: GEMINI AND OPENROUTER

Implement a provider-neutral server-side AI layer.

```text
src/core/ai/
├── types.ts
├── provider-registry.ts
├── capability-detection.ts
├── structured-output.ts
├── retry-policy.ts
├── cost-guard.ts
├── redaction.ts
├── prompt-versioning.ts
├── providers/
│   ├── gemini-provider.ts
│   └── openrouter-provider.ts
├── prompts/
│   ├── tutor.ts
│   ├── writing-evaluator.ts
│   ├── speaking-evaluator.ts
│   ├── error-explainer.ts
│   └── plan-adjuster.ts
└── schemas/
    ├── tutor-response.ts
    ├── writing-feedback.ts
    └── speaking-feedback.ts
```

### 15.1 Settings UI

Create `/settings/ai` with:

- provider: Disabled / Gemini / OpenRouter;
- API key input, masked;
- model selector populated live when supported, plus manual model ID;
- capability display: text, structured output, vision, audio input, audio output, tool use;
- temperature and output-token budget within safe limits;
- monthly/session cost cap where provider metadata allows estimation;
- data-retention warning;
- “Test connection” button;
- “Delete key” button;
- explicit consent for sending text/audio to the selected provider;
- per-feature toggles for tutor, writing, speaking, and planning;
- fallback behavior when unavailable.

Do not hard-code a model as permanently current. Model IDs change. Store user selection and verify capabilities.

### 15.2 Secret handling

Support two modes:

1. **Local AI — zero-cost and privacy-preferred:** no remote key; use a user-run local OpenAI-compatible/Ollama endpoint or an in-browser model when device capabilities permit.
2. **User BYOK free tier:** keep the Gemini/OpenRouter key in memory by default. Optional persistence must encrypt the key with a user passphrase using Web Crypto and store only ciphertext in IndexedDB. Never use plaintext LocalStorage, source code, analytics, logs, URLs, database rows, or client bundles.
3. **Deployment-managed free-tier keys — optional:** keys live only in server environment variables or a free deployment secret manager. This mode may not be required for the zero-cost release and must have a hard zero-spend limit.

BYOK requests must use HTTPS, a server route that never logs the key, strict redaction, no caching, and immediate disposal after the request. Document that a self-hosted server operator can technically observe proxied secrets; offer a direct-provider mode only when the provider safely supports browser use and the security implications are explicit.

### 15.3 Provider requirements

- Use the current official Gemini SDK/API and the OpenRouter OpenAI-compatible API.
- All calls occur through provider adapters.
- Add timeout, abort, bounded retries with jitter, rate-limit handling, circuit breaking, and friendly localized errors.
- Validate every structured response with Zod. If repair fails, do not apply the output to mastery.
- Treat model output as untrusted data. Escape/render safely.
- Prevent curriculum/user-content prompt injection from overriding system evaluation rules.
- Version every AI system prompt and save the version with feedback evidence.
- Redact API keys and sensitive learner data from logs.
- Send the minimum context needed.
- Do not expose chain-of-thought. Request concise evidence and rubric output, not private reasoning.
- Cache only non-sensitive, safe, deterministic requests where appropriate.
- Add mocked-provider tests; CI must never require paid API calls.

### 15.4 Tutor behavior

The AI tutor must:

- use the current lesson, objective, learner level, and recent error profile;
- answer in the configured German/Arabic balance;
- prefer hints before final answers during active exercises;
- never mark its own unsupported claim as official;
- distinguish rule, tendency, register, regional variation, and exception;
- cite the curriculum source for exam rules;
- generate a micro-practice item after explaining an error;
- avoid overwhelming the learner;
- refuse to fabricate exam results or completed work;
- allow “explain more simply”, “give another example”, and “explain in Arabic”.

---

## 16. EXAM PROFILE ARCHITECTURE

```text
src/content/exams/
├── goethe-b2/
│   ├── profile.ts
│   ├── sources.ts
│   ├── rubrics.ts
│   ├── task-specs.ts
│   └── simulations/
└── telc-deutsch-b2/
    ├── profile.ts
    ├── sources.ts
    ├── rubrics.ts
    ├── task-specs.ts
    └── simulations/
```

```typescript
export interface SourceReference {
  id: string;
  title: string;
  organization: string;
  url: string;
  accessedAt: string;
  publishedOrUpdatedAt?: string;
  licenseOrUsageNote: string;
}

export interface ExamProfile {
  id: ExamProvider;
  displayName: string;
  specificationVersion: string;
  verifiedAt: string;
  modules: ExamModuleSpec[];
  taskTypes: ExamTaskSpec[];
  scoringRules: ScoringRule[];
  passingRules: PassingRule[];
  writingRubricId: string;
  speakingRubricId: string;
  sourceRefs: string[];
  status: "draft" | "verified" | "outdated";
}
```

Before implementing a profile:

1. Retrieve current official information.
2. Record sources and access date.
3. Compare against stored version.
4. Mark unresolved contradictions.
5. Do not publish a simulation until the profile is verified.

Build exam sessions with server-authoritative timing, autosave, resume rules, accessibility accommodations that do not invalidate practice, reproducible seeds, and post-session review locks appropriate to simulation mode.

---

## 17. TECHNICAL STACK

Use current stable compatible releases at implementation time; do not pin an obsolete framework merely because an earlier prompt named it.

### Mandatory zero-cost default stack

- Next.js latest stable with App Router and a tested static-export/local-first mode;
- React and strict TypeScript;
- Tailwind CSS plus accessible Radix/shadcn-style primitives;
- IndexedDB through a small typed repository adapter as the default durable store;
- encrypted JSON/ZIP export and import for backup and device transfer;
- no mandatory account, remote database, object storage, or server runtime;
- Zustand only for ephemeral client UI state, never as the durable source of truth;
- Zod for runtime validation;
- Vitest and Testing Library;
- Playwright for E2E;
- axe-core for accessibility testing;
- installable PWA with explicit cache/version/content-pack strategy;
- browser MediaRecorder for learner recordings;
- browser SpeechSynthesis as the universal zero-cost TTS fallback;
- optional local Piper-compatible TTS and Whisper/Vosk-compatible STT adapters;
- optional local OpenAI-compatible/Ollama and in-browser WebLLM adapters;
- pnpm with a committed lockfile;
- optional Dockerfile and Docker Compose for local self-hosting, never required for normal use.

### Optional free-tier deployment adapters

The application may additionally support static hosting on a currently free platform and an optional free serverless proxy, but these are not required for core operation. Isolate hosting in adapters so providers can be replaced. Do not couple curriculum, progress, or backup to a commercial free tier.

A remote PostgreSQL/database adapter may exist as an optional extension only. It must not be needed by the zero-cost release. If implemented, the application must detect quota exhaustion and fall back safely to local data without loss.

Create Architecture Decision Records for material choices. Avoid unnecessary dependencies and every dependency that introduces unavoidable metered cost.

---

## 18. TARGET DIRECTORY STRUCTURE

```text
/
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── PROJECT_STATUS.md
├── DECISIONS.md
├── SECURITY.md
├── ZERO_COST.md
├── LICENSE.md
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── Dockerfile
├── docker-compose.yml
├── vercel.json
├── .github/workflows/ci.yml
├── docs/
│   ├── MASTER_SPEC.md
│   ├── PRODUCT_SPEC.md
│   ├── PEDAGOGY_SPEC.md
│   ├── CURRICULUM_MAP.md
│   ├── EXAM_ALIGNMENT.md
│   ├── AI_PROVIDER_SECURITY.md
│   ├── CONTENT_AUTHORING.md
│   ├── DEPLOYMENT.md
│   └── adr/
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── offline/
├── scripts/
│   ├── validate-content.ts
│   ├── coverage-report.ts
│   ├── detect-duplicates.ts
│   ├── copyright-similarity-check.ts
│   ├── verify-audio-assets.ts
│   ├── audit-zero-cost.ts
│   └── seed-database.ts
├── drizzle/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── today/page.tsx
│   │   ├── path/page.tsx
│   │   ├── lernen/[lessonId]/page.tsx
│   │   ├── review/page.tsx
│   │   ├── library/page.tsx
│   │   ├── grammar/page.tsx
│   │   ├── pronunciation/page.tsx
│   │   ├── writing/page.tsx
│   │   ├── speaking/page.tsx
│   │   ├── exams/page.tsx
│   │   ├── exams/[provider]/[simulationId]/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── settings/ai/page.tsx
│   │   └── api/
│   │       ├── ai/chat/route.ts
│   │       ├── ai/writing/route.ts
│   │       ├── ai/speaking/route.ts
│   │       ├── ai/models/route.ts
│   │       └── progress/sync/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── bidi/
│   │   ├── lesson/
│   │   ├── exercises/
│   │   ├── adaptive/
│   │   ├── audio/
│   │   ├── writing/
│   │   ├── speaking/
│   │   ├── exams/
│   │   ├── progress/
│   │   └── settings/
│   ├── content/
│   │   ├── curriculum/
│   │   │   ├── objectives/
│   │   │   ├── prerequisites/
│   │   │   ├── modules/
│   │   │   └── coverage.ts
│   │   ├── lessons/
│   │   │   ├── a1/
│   │   │   ├── a2/
│   │   │   ├── b1/
│   │   │   └── b2/
│   │   ├── exams/
│   │   ├── library/
│   │   └── sources/
│   ├── core/
│   │   ├── adaptive/
│   │   ├── coach/
│   │   ├── ai/
│   │   ├── assessment/
│   │   ├── audio/
│   │   ├── content-validation/
│   │   ├── exam/
│   │   ├── lesson/
│   │   ├── progress/
│   │   ├── portability/
│   │   ├── srs/
│   │   └── security/
│   ├── db/
│   │   ├── schema/
│   │   ├── queries/
│   │   ├── migrations/
│   │   └── client.ts
│   ├── hooks/
│   ├── i18n/
│   │   ├── ar.ts
│   │   └── de.ts
│   ├── lib/
│   ├── server/
│   ├── stores/
│   ├── styles/
│   └── types/
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    ├── accessibility/
    ├── content/
    └── fixtures/
```

Do not ship all lesson data in the initial client bundle. Use server loading, static generation where appropriate, and per-lesson lazy loading.

---

## 19. DURABLE DATA MODEL

At minimum model:

- User/account or guest profile;
- LearnerProfile;
- AccessibilityPreferences;
- CurriculumVersion;
- LessonDefinition and content version;
- LessonAttempt;
- ExerciseAttempt;
- ErrorEvent;
- SkillEvidence;
- ObjectiveMastery;
- SRSItem and SRSReview;
- DailyPlan and DailyPlanItem;
- WritingSubmission and WritingDraft;
- SpeakingSubmission and media reference;
- ExamSession, section, answer, timer state, and result;
- AI feedback with provider/model/prompt version/confidence;
- consent record and deletion request;
- sync metadata and schema version.

Every durable record must have stable IDs, timestamps, and version/migration policy. Never overwrite historical evidence when recalculating mastery.

---

## 20. RTL/LTR, UX, ACCESSIBILITY, AND PWA

Requirements:

- Arabic UI defaults to RTL; German text spans must use `lang="de"` and isolated LTR rendering.
- Use `dir="auto"`, Unicode bidi isolation, and dedicated bidi components where mixed text appears.
- Keyboard-complete operation.
- Visible focus states.
- Screen-reader labels and announcements for grading and timers.
- Captions/transcripts for audio, hidden during graded first listens when appropriate but available afterward.
- Adjustable font size, reduced motion, contrast modes, and playback speed.
- Do not rely on color alone.
- Touch targets and responsive layouts.
- WCAG 2.2 AA target.
- Offline access to downloaded lessons and due reviews.
- Clear synchronization/conflict states.
- No punitive streak design.
- Time estimates and pause/resume support.
- Export/delete learner data.

Use local/self-hosted fonts and icons where possible. Do not depend on an external CDN for core rendering.

---

## 21. CONTENT AND ACADEMIC QUALITY GATES

Create build-failing validators for:

1. schema completeness;
2. exact 14-stage presence;
3. global unique IDs;
4. valid objective references;
5. prerequisite integrity and no cycles unless explicitly justified;
6. reading word count computed from text;
7. glossary `surfaceForm` occurrence with Unicode-aware matching;
8. flashcard lemma/surface/example consistency;
9. MCQ exactly four unique options and exactly one keyed answer;
10. correct index in range after seeded shuffle;
11. answer leakage in prompts and distractors;
12. duplicate and near-duplicate items;
13. question–passage evidence alignment;
14. no question answerable only through hidden outside knowledge unless tagged;
15. audio asset existence, duration, transcript match, and license/provenance;
16. CEFR lexical/syntactic appropriateness with reviewer confidence;
17. Arabic explanation presence according to scaffolding policy;
18. German grammar and orthography review status;
19. Arabic linguistic review status;
20. writing/speaking rubric completeness;
21. exam-profile version and source verification;
22. coverage matrix has no required objective missing;
23. no unsupported C1/C2 target objectives;
24. copyright similarity threshold;
25. no placeholder markers such as TODO, lorem ipsum, fake URL, or missing audio presented as complete.

Length limits may catch unusually thin or bloated content, but must never be the sole academic-depth guard. Do not use arbitrary 900-character prose in every level. Use level-appropriate clarity.

Every content object must include:

```typescript
interface ContentAuditMetadata {
  authoringMode: "human" | "ai-assisted" | "ai-generated";
  status: "draft" | "validated" | "published";
  curriculumVersion: string;
  reviewedForGerman: boolean;
  reviewedForArabic: boolean;
  reviewedForCEFR: boolean;
  reviewedForCopyright: boolean;
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
}
```

Do not label AI-only self-review as independent expert validation.

---

## 22. TESTING REQUIREMENTS

### Unit tests

- normalization and comparison modes;
- accepted variants;
- error span diagnostics;
- seeded shuffling and index preservation;
- SRS grade boundaries, date boundaries, timezone policy, leeches, migrations;
- mastery updates and evidence weighting;
- prerequisite graph;
- daily plan time cap;
- readiness gates;
- exam scoring with official-profile fixtures;
- AI structured-output validation and repair failure;
- secret redaction;
- bidi utilities.

### Integration tests

- lesson attempt → evidence → mastery → next plan;
- failed objective → remediation → delayed retest;
- writing drafts and AI feedback persistence;
- speaking upload and provider-capability fallback;
- exam autosave/resume/timer;
- guest-to-account migration;
- offline attempt synchronization conflict;
- AI provider disabled, invalid key, timeout, rate limit, malformed JSON, and quota exhaustion.

### E2E tests

- onboarding and placement;
- daily learning session;
- complete 14-stage lesson;
- SRS review;
- writing revision cycle;
- speaking recording and deletion;
- AI settings and connection test using mocks;
- full exam flow;
- progress and readiness report;
- Arabic RTL and German LTR interaction;
- mobile and desktop critical paths.

### Non-functional tests

- accessibility with axe plus manual keyboard checklist;
- no secrets in client bundle or logs;
- CSP and security headers;
- performance budgets;
- PWA offline behavior;
- backup/restore;
- database migrations;
- production build from a clean checkout.

CI must use mocks and fixtures, never real paid provider keys.

---

## 23. SECURITY AND PRIVACY

Implement and document:

- server-only secrets;
- BYOK encryption and deletion;
- log redaction;
- CSP, secure headers, CSRF protection where applicable, XSS-safe rendering, and input validation;
- rate limits and abuse protection for AI/media endpoints;
- file type/size validation and malware-safe handling policy;
- signed/private media access;
- least-privilege database access;
- dependency and secret scanning;
- consent before third-party AI processing;
- retention policy for audio, transcripts, and feedback;
- data export and deletion;
- no advertising trackers by default;
- privacy-preserving analytics, opt-in where required.

AI provider content is untrusted. Never execute generated code or render raw generated HTML.

---

## 24. OBSERVABILITY AND COST CONTROL

Add privacy-safe observability for:

- route errors;
- content validation failures;
- AI latency, error category, token/cost estimate, and provider/model without logging content or keys;
- audio-processing failures;
- sync conflicts;
- exam session integrity;
- build and migration health.

Expose learner-facing AI usage estimates and hard caps. Gracefully fall back to deterministic features when limits are reached.

---

## 25. IMPLEMENTATION PHASES WITH ACCEPTANCE GATES

Do not use “Turn 1/Turn 2” as a completion criterion. Work in milestones. Do not begin the next milestone until the current acceptance gate passes, unless a documented blocker requires parallel work.

### Phase 0 — Discovery, source verification, and architecture

Deliver:

- repository inspection;
- official exam source registry;
- copyright-safe curriculum policy;
- product requirements;
- full CEFR objective/coverage skeleton;
- ADRs;
- risk register;
- implementation plan;
- `PROJECT_STATUS.md` with exact counters.

Gate: documents exist, sources are traceable, no unresolved choice is hidden.

### Phase 1 — Production scaffolding and vertical slice

Deliver:

- app, DB, auth/guest mode, i18n/bidi, test infrastructure, CI;
- strict types and Zod schemas;
- one complete representative lesson with all 14 stages;
- progress, SRS, one writing task, one speaking task, one mini-test;
- mocked AI provider;
- responsive accessible UI.

Gate: lint, typecheck, unit, integration, E2E, accessibility smoke, and production build all pass.

### Phase 2 — Core adaptive and AI systems

Deliver:

- placement;
- learner model;
- mastery/evidence;
- daily planner;
- remediation;
- Gemini/OpenRouter provider settings and adapters;
- writing/speaking workflows;
- security and provider mocks.

Gate: full adaptive loop works with AI disabled and with mocked AI enabled.

### Phase 3 — Exam engines

Deliver:

- separately verified Goethe B2 and telc Deutsch B2 profiles;
- timer, autosave, grading, rubrics, reports;
- one complete original simulation for each provider;
- targeted skill simulations.

Gate: every rule has a source; no profile mixing; E2E passes.

### Phase 4 — Systematic curriculum production

Produce original lessons in small validated batches:

1. A1 modules 1–8;
2. A2 modules 1–8;
3. B1 modules 1–8;
4. B2 modules 1–6;
5. libraries, clinics, module projects, and level tests;
6. remaining exam simulations.

For each batch:

- generate;
- validate schemas;
- run duplicate/copyright guards;
- run German, Arabic, CEFR, and assessment audits;
- register coverage;
- run build/tests;
- update exact counters.

Never paste massive lesson objects only into chat. Write them to repository files. Never claim the level is complete until every required object and asset passes validation.

### Phase 5 — Production hardening

Deliver:

- all 84 lessons and quantitative assets;
- zero required coverage gaps;
- all simulations;
- complete audio status with no fake files;
- migrations and seed;
- Docker deployment;
- security/accessibility/performance review;
- backup/restore;
- final clean build;
- known limitations;
- release checklist.

Gate: all Definition of Done criteria pass.

---

## 26. DEFINITION OF DONE

The project is complete only when:

- [ ] 84/84 core lessons are `published` and schema-valid;
- [ ] 30/30 module reviews are complete;
- [ ] 30/30 module transfer projects are complete;
- [ ] 8/8 parallel level-end assessment forms are complete;
- [ ] 6/6 Goethe B2 full simulations are complete and profile-verified;
- [ ] 6/6 telc B2 full simulations are complete and profile-verified;
- [ ] 24/24 targeted B2 skill simulations are complete across both profiles;
- [ ] placement has at least two parallel forms and adaptive stop rules;
- [ ] at least 80 reading-library texts are complete;
- [ ] at least 80 listening-library scripts are complete;
- [ ] every published listening item has a real valid audio asset or is clearly excluded from publication;
- [ ] all required CEFR A1–B2 objectives are taught, practiced, and assessed;
- [ ] no C1/C2 objective is targeted or scored;
- [ ] adaptive daily planning works;
- [ ] delayed mastery and SRS work deterministically;
- [ ] writing revision and speaking retry workflows work;
- [ ] Gemini free-tier and OpenRouter free-only adapters work through secure BYOK settings and mocked CI tests;
- [ ] local OpenAI-compatible/Ollama and in-browser local-model adapters have documented capability fallbacks;
- [ ] a hard cost guard rejects every model/request whose verified maximum price is greater than zero;
- [ ] core course works with AI disabled;
- [ ] core course works offline after its content pack is downloaded;
- [ ] no payment card, paid API, paid database, paid asset, or paid hosting is required;
- [ ] `pnpm cost:audit` passes and `ZERO_COST.md` contains a current service/quota/fallback registry;
- [ ] Goethe and telc profiles remain separate;
- [ ] all content has provenance and audit metadata;
- [ ] copyright similarity checks pass;
- [ ] no `any[]`, fake sources, fake media, silent placeholders, or broken IDs remain;
- [ ] lint, format check, typecheck, unit tests, integration tests, E2E tests, content validation, accessibility checks, and production build pass from a clean checkout;
- [ ] secret scan finds no key;
- [ ] database migration, backup, restore, and guest migration are tested;
- [ ] responsive RTL/LTR UI is verified on mobile and desktop;
- [ ] README, security, privacy, deployment, content authoring, and limitations documentation are complete.

A green character-count test is not completion. A visually finished dashboard is not completion. Passing deterministic tests without complete curriculum is not completion. The exact Definition of Done above is the release gate.

---

## 27. AGENT EXECUTION AND REPORTING PROTOCOL

At the start of every work session:

1. Read `AGENTS.md`, `docs/MASTER_SPEC.md`, `PROJECT_STATUS.md`, and `DECISIONS.md`.
2. Inspect the repository and current test state.
3. Select the smallest milestone slice that moves the product toward the current gate.
4. State files to be changed and acceptance checks.
5. Implement in files, not as hypothetical code snippets.
6. Run the relevant commands.
7. Fix failures before claiming success.
8. Update status and decision documents.

Every completion report must include:

- implemented items;
- changed files;
- commands run;
- exact test results;
- exact curriculum counters;
- assumptions;
- unresolved blockers;
- next smallest milestone.

Forbidden behaviors:

- claiming tests passed without running them;
- claiming files or audio exist when they do not;
- substituting placeholders for required content;
- hiding incomplete arrays with comments;
- inventing official exam data;
- copying copyrighted coursebook content;
- hard-coding a transient AI model as the only model;
- storing user API keys in plaintext;
- sending secrets to the browser bundle;
- grading pronunciation acoustically from transcript alone;
- unlocking B2 readiness based only on lesson completion;
- continuing bulk generation after a failing quality gate.

When blocked, stop the affected slice, document the blocker precisely, implement independent safe work if available, and ask only the minimum necessary question.

---

## 28. FIRST EXECUTION COMMAND

Begin now with **Phase 0**, then proceed to the Phase 1 vertical slice only after the Phase 0 gate passes.

Your first actions are:

1. inspect the current workspace without overwriting existing work;
2. save this specification as the repository source of truth;
3. create `PROJECT_STATUS.md`, `DECISIONS.md`, the risk register, and the official-source registry;
4. verify the current official Goethe B2 and telc Deutsch B2 specifications;
5. create the copyright-safe Menschen-inspired A1–B1 curriculum map and original B2 continuation map;
6. define the strict domain schemas and coverage model;
7. propose the exact Phase 1 vertical slice and its acceptance commands;
8. create `ZERO_COST.md`, the cost-threat model, and the automated zero-cost audit;
9. then implement and test it.

Do not generate all 84 lessons before the vertical slice, adaptive loop, exam-profile separation, AI security architecture, and content validation pipeline are proven.


---

## 29. ZERO-COST ARCHITECTURE CONTRACT

The zero-cost requirement is a hard product invariant, not a suggestion.

### 29.1 Budget invariant

```typescript
export const HARD_BUDGET_USD = 0 as const;

export interface CostPolicy {
  hardBudgetUsd: 0;
  allowPaidModels: false;
  allowAutomaticPaidFallback: false;
  requireVerifiedZeroPrice: true;
  onUnknownPrice: "block";
  onQuotaExceeded: "fallback-local" | "fallback-deterministic";
}
```

Rules:

- Unknown price means blocked, not assumed free.
- A model name containing `free` is not sufficient by itself; verify current provider pricing metadata when available.
- OpenRouter requests must be restricted to verified free endpoints or the free router, with automatic paid fallbacks disabled.
- Gemini requests must use an explicitly free-tier-eligible model/account mode and stop on quota exhaustion.
- Never request grounding, search, image generation, premium audio, or another potentially billable capability unless current metadata proves the specific request is free.
- Never ask the user for billing information.
- Never recommend adding credits as the normal recovery path.
- If a free API is unavailable, continue using authored content, deterministic feedback, local models, browser features, and queued work.

### 29.2 Cost registry

Create `ZERO_COST.md` and a machine-readable `src/config/cost-registry.ts` containing:

- service/provider;
- purpose;
- whether it is mandatory or optional;
- current free-tier source URL;
- last verification date;
- quota/limits known at verification time;
- whether a payment card is required;
- failure behavior;
- local/offline replacement;
- data/privacy note;
- owner of re-verification.

A scheduled or manually run audit must mark stale pricing verification after 30 days. Stale or unreachable pricing metadata blocks potentially billable calls but never blocks offline learning.

### 29.3 Zero-cost test

Implement `pnpm cost:audit` and fail CI if:

- a paid SKU/model is allowlisted;
- automatic paid fallback is enabled;
- a mandatory service lacks a local/offline replacement;
- a secret is embedded;
- a payment method is documented as required;
- a runtime code path can create billable infrastructure;
- an asset requires an unlicensed paid source;
- a free-tier verification is stale for release builds;
- static/local production mode cannot build.

---

## 30. ZERO-COST DEPLOYMENT MODES

### Mode A — Personal Offline PWA (mandatory and default)

- static application shell;
- IndexedDB progress and content-pack metadata;
- selective lesson/audio downloads;
- no login;
- no server;
- no remote database;
- encrypted backup export/import;
- AI disabled, local, or BYOK;
- installable from a static host or usable from a local static server.

This mode must provide the complete authored curriculum, deterministic assessments, SRS, progress, exam simulations, writing rubrics, recording, playback, and manual/self-feedback at no cost.

### Mode B — Local Self-Hosted (mandatory supported mode)

- one-command local start;
- optional Docker;
- local file/SQLite-compatible persistence adapter if a server is used;
- local AI endpoint support;
- no public cloud account;
- LAN access disabled by default unless explicitly configured.

### Mode C — GitHub + Vercel Hobby deployment (required deployment target)

- GitHub is the source repository and CI source of truth;
- Vercel is connected to GitHub for production and preview deployments;
- use Vercel Hobby only for a personal, non-commercial deployment within its current terms and quotas;
- prefer statically generated pages/assets and client-side local persistence;
- avoid mandatory Vercel Functions; use a minimal optional AI proxy only when direct safe BYOK calls are impossible;
- no Vercel database, Blob, KV, Analytics, paid image optimization, or other metered add-on is mandatory;
- document production, preview, rollback, environment, and quota behavior;
- use strict artifact/bundle/media budgets;
- skip deployments for documentation-only changes where possible;
- retain a local/static escape path so the application remains usable if Vercel terms or quotas change.

### Mode D — Free Serverless Proxy/Sync (optional enhancement)

- strictly optional;
- quotas visible to the user;
- no loss of local data on quota exhaustion;
- no paid overage;
- no automatic plan upgrade;
- no mandatory dependency for lessons or progress;
- provider adapter and migration/export path required.

---

## 31. FREE AI AND GRACEFUL DEGRADATION

Priority order:

1. deterministic authored engine;
2. local in-browser model when supported;
3. user-run local OpenAI-compatible/Ollama endpoint;
4. Gemini verified free tier with BYOK;
5. OpenRouter verified free endpoint with BYOK;
6. queue task or provide rubric-based self-evaluation.

The application must expose an `AI Availability` panel showing:

- active provider and model;
- verified cost status;
- capability status;
- quota/rate-limit status when available;
- privacy mode;
- last successful request;
- fallback selected.

When remote AI is unavailable:

- tutor uses authored hints and rule lookup;
- writing uses deterministic checks, checklists, rubrics, and model-answer comparison without falsely assigning an official score;
- speaking retains recording, timing, self-rubric, phrase bank, and retry;
- planning remains deterministic from mastery evidence;
- no learning progress is lost.

Add a downloadable local prompt pack so the learner can manually copy a writing/speaking task and rubric into any free assistant, then paste back only the structured result after local validation. Mark imported feedback as external/unverified.

---

## 32. ZERO-COST AUDIO, SPEECH, AND MEDIA

Use this fallback ladder:

1. authored real audio already included with a compatible open license;
2. locally generated audio using an open-source local TTS adapter;
3. browser SpeechSynthesis with selected German voice;
4. transcript-based listening preview only, clearly marked non-exam-grade.

For learner speech:

1. MediaRecorder capture and local playback;
2. local Whisper/Vosk-compatible adapter when installed;
3. browser speech-recognition capability when available;
4. Gemini/OpenRouter free audio-capable model only when verified and consented;
5. learner transcript plus self-rubric fallback.

Requirements:

- no paid TTS/STT dependency;
- compressed Opus where supported with accessible fallback;
- audio manifests include license, source/generator, voice, speed, duration, checksum, and quality status;
- downloadable audio packs by level, not one enormous mandatory bundle;
- cache only user-selected packs;
- do not use browser TTS audio as proof of authentic exam listening quality;
- never infer acoustic pronunciation accuracy from a transcript.

Create original low-bandwidth visual assets using inline SVG/CSS or correctly licensed open assets with attribution. No paid stock library.

---

## 33. HIGH-VALUE ZERO-COST PRODUCT ADDITIONS

Implement or plan these features without mandatory external services:

1. **Error Notebook:** automatic personal log grouped by case, article, word order, tense, preposition, vocabulary, pronunciation, and exam skill.
2. **Mistake-to-SRS:** convert validated personal mistakes into private cards with undo and deduplication.
3. **14-Day Adaptive Planner:** recalculated weekly and after major assessments.
4. **Exam Countdown:** remaining weeks, required weekly load, readiness risk, and recovery plan.
5. **Focus Mode:** downloadable daily session, timer, distraction-free flow, pause/resume.
6. **Shadowing Studio:** play, record, compare transcript/timing, repeat, and save best attempt.
7. **Writing Portfolio:** versioned drafts showing corrections and progress over time.
8. **Speaking Portfolio:** local recordings, self-rubrics, retry history, and deletion controls.
9. **Grammar Dependency Map:** visual prerequisite graph and targeted clinics.
10. **Vocabulary Families:** lemma, gender, plural, word family, collocations, register, and false friends.
11. **Bidirectional Search:** search German lemma/surface form or Arabic meaning across the authored corpus.
12. **Content Packs:** install/remove A1, A2, B1, B2, exam, and audio packs independently.
13. **Backup Portability:** encrypted backup plus plain standardized export for long-term ownership.
14. **Anki-Compatible Export:** CSV/TSV export with stable IDs, tags, examples, and due-state notes where legally/technically safe.
15. **Low-Bandwidth Mode:** no autoplay, compressed media, text-first screens, explicit download sizes.
16. **Print Mode:** printable weekly plan, writing sheets, vocabulary review, and mock answer sheets.
17. **Teacherless Recovery:** if stuck three times, simplify explanation, return to prerequisite, generate deterministic micro-drill, then retest later.
18. **Confidence Calibration:** compare confidence before answers with actual accuracy and teach the learner to recognize weak certainty.
19. **Interleaved Review:** mix grammar, vocabulary, listening, and productive recall instead of massing one type.
20. **Release Content Audit Dashboard:** exact completion, audio, coverage, source, duplicate, copyright, and validation counters.

Do not add gamification that encourages meaningless clicking. Streaks must have grace days and must never override mastery or wellbeing.

---

## 34. ZERO-COST RELEASE GATE

In addition to the general Definition of Done, release is forbidden unless all are true:

- [ ] a learner can install and complete the course in personal offline PWA mode without entering payment information;
- [ ] the GitHub-connected Vercel production deployment passes smoke tests without a remote database;
- [ ] Vercel use remains personal/non-commercial on Hobby and current limits are documented;
- [ ] all durable learner data stays local by default;
- [ ] versioned import/export, merge, rollback, corruption handling, and migration tests pass;
- [ ] the Coach/Today screen is the primary path and always offers one explained next action;
- [ ] no mandatory runtime request targets a paid service;
- [ ] no mandatory feature becomes unusable when Gemini and OpenRouter are disabled;
- [ ] every remote AI request is preceded by a verified zero-price check and user consent;
- [ ] unknown model pricing is blocked;
- [ ] quota exhaustion triggers a free fallback, never paid overage;
- [ ] local backup/export/restore is tested;
- [ ] content/audio packs expose download sizes and support selective deletion;
- [ ] all third-party assets have compatible licenses and attribution;
- [ ] a clean static/local build and all core E2E flows pass with the network disabled;
- [ ] `ZERO_COST.md` is current and `pnpm cost:audit` passes;
- [ ] the README states which optional free services may change limits and how to continue offline.


---

## 35. GITHUB + VERCEL DELIVERY CONTRACT

The production target is a personal, non-commercial Vercel Hobby deployment connected to a GitHub repository. Preserve a provider-neutral static/local build.

### 35.1 GitHub workflow

Use:

- `main` as production;
- short-lived feature branches;
- pull requests with preview deployments;
- required CI before merge;
- Conventional Commits or an equally documented commit convention;
- issue templates for bug, content error, feature, and academic correction;
- pull-request template with tests, screenshots, accessibility, content, copyright, and zero-cost checklist;
- Dependabot or equivalent for safe dependency updates;
- CODEOWNERS only where useful;
- release tags and changelog;
- no API key, learner backup, recording, or personal data committed to Git.

Required GitHub Actions jobs:

```text
format-check
lint
typecheck
unit
integration
content-schema
coverage-matrix
copyright-similarity
cost-audit
secret-scan
accessibility-smoke
e2e-critical
production-build
bundle-budget
```

Use standard runners only. Avoid large artifacts and long retention. CI uses mocks, not paid APIs. Add concurrency cancellation so superseded branch runs do not waste quota.

### 35.2 Vercel behavior

- connect the repository through Vercel Git integration;
- production deploy only from `main`;
- preview deploy from pull requests;
- never expose secrets through `NEXT_PUBLIC_*`;
- if a serverless BYOK proxy exists, mark it `no-store`, redact headers/body logs, apply a short timeout and request-size limit, and never persist keys or learner content;
- prefer browser-to-provider calls only when the provider explicitly supports them safely and the user accepts the risk;
- do not enable paid usage, paid add-ons, automatic upgrades, or paid fallbacks;
- show an in-app offline mode when Vercel or the network is unavailable;
- create a Vercel smoke test for `/`, `/today`, one lesson, `/review`, `/settings/ai`, export, and import;
- maintain `docs/VERCEL_DEPLOYMENT.md` and `docs/VERCEL_LIMITS.md` with verification date;
- maintain build/source/media budgets below current Hobby limits with safety margin;
- do not rely on Vercel filesystem persistence.

### 35.3 Static-first rules

- pre-render curriculum pages where practical;
- load lesson data by level/module chunks, not one giant bundle;
- keep the first visit lightweight;
- use service worker precache only for the shell and current essential data;
- download optional content/audio packs on demand;
- do not put all audio in the initial Vercel deployment if it threatens source/static limits;
- provide a script for locally generating optional German audio packs with an open local TTS;
- preserve checksums and manifests for every content pack.

---

## 36. LOCAL PERSISTENCE AND PORTABLE BACKUP CONTRACT

All durable learner state is local by default. Use IndexedDB through a versioned repository interface. LocalStorage is allowed only for tiny non-sensitive UI preferences, never mastery, attempts, recordings, API keys, or the canonical learner profile.

### 36.1 Portable archive

Use a dedicated extension such as `.dwnb` implemented as a ZIP-compatible archive:

```text
backup.dwnb
├── manifest.json
├── profile.json
├── progress.json
├── mastery.json
├── attempts.json
├── errors.json
├── srs.json
├── plans.json
├── writing.json
├── speaking.json
├── settings.json
├── media/                 # optional
└── checksums.sha256
```

Manifest requirements:

```typescript
export interface BackupManifest {
  format: "dwnb";
  formatVersion: number;
  appVersion: string;
  curriculumVersion: string;
  exportedAt: string;
  locale: string;
  profileCount: number;
  encrypted: boolean;
  includesMedia: boolean;
  sections: string[];
  checksumsAlgorithm: "SHA-256";
}
```

### 36.2 Export options

- full backup;
- progress only;
- SRS only;
- writing portfolio;
- speaking portfolio with or without media;
- settings excluding secrets;
- human-readable JSON/CSV reports;
- Anki-compatible vocabulary export;
- print/PDF study report.

API keys are excluded by default and may never be exported silently.

### 36.3 Import workflow

1. select file;
2. validate type, size, manifest, schema, checksum, and supported version;
3. scan archive paths and reject traversal/zip-bomb patterns;
4. show a dry-run summary;
5. identify conflicts and migrations;
6. offer `merge`, `replace`, or `import-as-new-profile`;
7. create an automatic local restore point;
8. perform import transactionally;
9. verify record counts and references;
10. roll back completely on failure;
11. show exact results.

Merge rules must be deterministic and documented. Never merge mastery by simply taking the highest score; preserve evidence and recalculate. Deduplicate attempts/SRS by stable IDs and content versions.

### 36.4 Encryption

Offer optional passphrase encryption using browser Web Crypto with an authenticated cipher such as AES-GCM and a salted, iterated key derivation supported by the chosen implementation. Store algorithm parameters in the manifest, never the passphrase. Add wrong-password, tamper, migration, and large-file tests.

### 36.5 Resilience

- periodic local snapshots with retention limits;
- snapshot before migration/import;
- storage quota display;
- graceful handling of private browsing/storage denial;
- export reminder at configurable milestones;
- corruption detector and recovery UI;
- no destructive migration without a tested rollback path;
- recordings removable independently from learning evidence.

---

## 37. COACH ORCHESTRATOR — THE PRIMARY PRODUCT

Create:

```text
src/core/coach/
├── coach-orchestrator.ts
├── coaching-state-machine.ts
├── next-best-action.ts
├── intervention-engine.ts
├── session-composer.ts
├── weekly-review.ts
├── recovery-planner.ts
├── exam-countdown.ts
├── adherence-analyzer.ts
├── recommendation-rationale.ts
└── coach-messages.ts
```

### 37.1 Coaching states

```typescript
export type CoachingPhase =
  | "onboarding"
  | "diagnostic"
  | "foundation"
  | "growth"
  | "consolidation"
  | "exam-specific"
  | "final-sprint"
  | "recovery"
  | "maintenance";
```

Transitions are evidence-based and reversible. The learner does not enter B2 exam-specific work solely because previous lesson cards were opened.

### 37.2 Next Best Action

```typescript
export interface NextBestAction {
  id: string;
  kind:
    | "diagnostic"
    | "lesson"
    | "review"
    | "remediation"
    | "writing"
    | "speaking"
    | "exam-task"
    | "mock-exam"
    | "reflection"
    | "rest";
  objectiveIds: string[];
  estimatedMinutes: number;
  priority: number;
  rationaleAr: string;
  rationaleDe?: string;
  successCriteria: string[];
  fallbackActionId?: string;
  expiresAt?: string;
}
```

The ranking function must consider:

- prerequisite gaps;
- due SRS and overdue reviews;
- retention and recency;
- repeated error clusters;
- receptive/productive imbalance;
- exam weighting and target date;
- novelty and cognitive load;
- time available today;
- recent fatigue/struggle signals;
- unfinished productive tasks;
- confidence miscalibration;
- need for delayed retest;
- learner choice within bounded alternatives.

### 37.3 Today screen

The default screen contains:

- one prominent “Start today’s mission” action;
- total planned minutes;
- a short “why this plan” explanation;
- due reviews;
- one primary learning/remediation goal;
- one productive task when appropriate;
- optional stretch task;
- stop/shorten plan control;
- session progress;
- end-session reflection;
- exact next scheduled action.

Do not show the full lesson catalog as the dominant home experience. The path/library remains accessible under “Explore”.

### 37.4 Daily session composer

A normal session is time-boxed and composed from blocks:

```text
check-in (1–2 min)
retrieval warm-up (3–8 min)
main objective (10–25 min)
guided practice (5–15 min)
productive transfer (5–20 min)
reflection and next plan (2–4 min)
```

Generate 10-, 20-, 30-, 45-, 60-, and 90-minute variants. If the learner has only 10 minutes, do not mark a full 60-minute lesson as failed; compose a valid micro-session.

### 37.5 Weekly coaching review

Once per week:

- summarize time and evidence, not vanity clicks;
- identify strongest gain and biggest risk;
- compare plan versus actual without shaming;
- show recurring errors;
- audit skill balance;
- adjust next week;
- schedule writing, speaking, and mock work;
- revise target-date risk;
- ask one short learner preference question;
- produce a clear weekly contract.

### 37.6 Intervention rules

Examples:

- three similar errors → open micro-clinic;
- immediate success but delayed failure → relearning queue;
- high confidence + wrong answer → misconception intervention;
- low confidence + correct answer repeatedly → confidence-building retrieval;
- excessive recognition and little production → mandatory production block;
- repeated skipping of speaking → reduce task size, diagnose barrier, reschedule;
- seven inactive days → recovery plan, not backlog dumping;
- exam date risk → prioritize exam-critical weakest skill;
- repeated frustration → simplify, return to prerequisite, shorten session;
- consistent mastery → accelerate or offer an unseen transfer test;
- mock pass with weak module → keep module remediation active;
- missed day → redistribute realistically, never double tomorrow automatically.

### 37.7 Learner agency

Guidance is not coercion. Allow:

- “I have less time”;
- “This is too easy/hard”;
- “Explain why”;
- “Choose another equivalent task”;
- “Pause goal”;
- “Practice a specific weakness”;
- “Explore curriculum”.

Log overrides as planning evidence but never punish them.

---

## 38. GUIDANCE-FIRST READINESS AND ANTI-SELF-DECEPTION

Add safeguards so the learner cannot mistake familiarity for mastery:

- unseen variants for mastery checks;
- delayed retests;
- separate first-attempt and retry scores;
- hide answers until commitment;
- track hints used;
- track transcript shown/listens used;
- distinguish guided versus independent production;
- do not count copied model answers;
- confidence-before-answer capture on selected items;
- cooldown before failed mastery recheck;
- multiple evidence sources;
- no readiness based on AI score alone;
- no overall B2 readiness when one required module remains below threshold;
- full simulation conditions clearly separated from practice mode;
- exam strategy scores separated from language ability.

The progress page must display:

- course exposure;
- objective mastery;
- retention;
- productive evidence;
- exam readiness;
- uncertainty/confidence;
- data recency;
- exact reasons a gate is not yet passed.

---

## 39. NOTIFICATION AND ROUTINE WITHOUT A PAID BACKEND

Use only free/local mechanisms:

- in-app reminders;
- optional browser notification where supported and permissioned;
- installable PWA badge where supported;
- downloadable `.ics` calendar plan;
- print-friendly weekly plan;
- local reminder preferences;
- “resume where I stopped”;
- no server push dependency;
- no guilt messages;
- quiet hours;
- timezone-aware target dates;
- reminders degrade safely when browser scheduling is unsupported.

---

## 40. PRODUCT PRIORITY MODEL

Do not turn every backlog idea into a release blocker.

- **P0 — release invariant:** Coach/Today, diagnostic, adaptive plan, evidence/mastery, local persistence, import/export, core curriculum, productive practice, SRS, exam separation, zero-cost, GitHub/Vercel deploy, accessibility, privacy, tests.
- **P1 — high value:** error notebook, shadowing, portfolios, advanced weekly review, content packs, print/calendar exports, local AI, richer analytics.
- **P2 — enhancement:** deeper local speech models, advanced visualizations, optional community workflows, experimental study modes.
- **Rejected unless justified:** paid dependencies, social feeds, addictive streak mechanics, generic chatbot without curriculum grounding, vanity dashboards, features that collect data without changing instruction.

Maintain `IDEA_BACKLOG.md` with ID, priority, learner problem, expected impact, complexity, dependencies, privacy/cost risk, acceptance criteria, and status.

---

## 41. ADDITIONAL V4 RELEASE GATES

- [ ] opening `/` routes the returning learner to `/today`, not a lesson catalog;
- [ ] every Today recommendation has rationale, duration, and success criteria;
- [ ] 10/20/30/45/60/90-minute session composition is tested;
- [ ] inactivity, repeated-error, delayed-failure, confidence-error, and exam-risk interventions are tested;
- [ ] weekly review changes the next plan deterministically;
- [ ] curriculum exploration cannot falsely increase mastery;
- [ ] Vercel production deploy is connected to GitHub `main` and preview deploys are documented;
- [ ] no Vercel persistent filesystem/database is assumed;
- [ ] source, build, bundle, and media budgets pass with safety margin;
- [ ] `.dwnb` full/partial/encrypted export and merge/replace/new-profile import pass E2E tests;
- [ ] import rollback and corruption tests pass;
- [ ] API keys are excluded from backups by default;
- [ ] offline Today, lesson, review, progress, export, and restore flows pass;
- [ ] `IDEA_BACKLOG.md` exists and P2 ideas are not silently presented as P0 completion requirements.
