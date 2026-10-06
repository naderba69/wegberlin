import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";
import type { buildLexicalTargetGapAudit } from "./lexical-target-gap";
import { serializeCsv } from "./safe-csv";

type LexicalTargetAudit = ReturnType<typeof buildLexicalTargetGapAudit>;
type ReviewArtifact = { path: string; content: string };
type EvidenceSource = { path: string; stage: string; surface: string; strength: "target" | "context" | "registry" };

const REVIEW_COLUMNS = ["reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"] as const;

function shortText(value: string, max = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function reviewEvidence(sources: EvidenceSource[], strengths: EvidenceSource["strength"][], limit: number) {
  const seen = new Set<string>();
  return sources
    .filter((source) => strengths.includes(source.strength))
    .sort((left, right) => {
      const rank = { target: 0, registry: 1, context: 2 };
      return rank[left.strength] - rank[right.strength] || left.path.localeCompare(right.path);
    })
    .filter((source) => {
      const key = `${source.strength}\u0000${source.path}\u0000${source.surface}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((source) => `[${source.strength}/${source.stage}] ${source.path}: ${shortText(source.surface)}`)
    .join(" || ");
}

function sourcesForAnchor<T extends { anchorIds: string[]; sources: EvidenceSource[] }>(rows: T[], anchorId: string) {
  return rows.filter((row) => row.anchorIds.includes(anchorId)).flatMap((row) => row.sources);
}

function levelFromLessonId(lessonId: string) {
  return lessonId.slice(0, 2).toLocaleUpperCase("en-US");
}

export const ORIGINAL_P098_NOUN_TARGET_COUNT = 1297;
export const ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT = 89;
const ORIGINAL_P098_NOUN_SCOPE = "P0-98-original-1297-noun-target";

export function assertOriginalP098NounReviewScope(nounEntries: readonly NounGrammarEntry[], pendingCandidateCount: number) {
  if (nounEntries.length !== ORIGINAL_P098_NOUN_TARGET_COUNT || pendingCandidateCount !== ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT) {
    throw new Error(`Original P0-98 noun scope drifted (expected ${ORIGINAL_P098_NOUN_TARGET_COUNT} anchors / ${ORIGINAL_P098_PENDING_NOUN_CANDIDATE_COUNT} pending candidates; found ${nounEntries.length} / ${pendingCandidateCount}). Review the historical scope before regenerating the packet.`);
  }
}

export const ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL = { A1: 25, A2: 30, B1: 31, B2: 40 } as const;
const ORIGINAL_P099_QUALITY_SCOPE = "P0-99-original-126-quality-target";

function isOriginalP099QualityTarget(entry: VerbPrepositionFrame) {
  const level = levelFromLessonId(entry.lessonId);
  if (level !== "B2") return Object.hasOwn(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL, level);
  const lessonNumber = Number(entry.lessonId.split("-")[1]);
  return Number.isInteger(lessonNumber) && lessonNumber >= 1 && lessonNumber <= 20;
}

export function frameTargetsByLevel(entries: readonly VerbPrepositionFrame[]) {
  const counts: Record<keyof typeof ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL, number> = { A1: 0, A2: 0, B1: 0, B2: 0 };
  for (const entry of entries) {
    if (!isOriginalP099QualityTarget(entry)) continue;
    const level = levelFromLessonId(entry.lessonId) as keyof typeof ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL;
    counts[level] += 1;
  }
  return counts;
}

export function assertOriginalP099QualityTargetDistribution(entries: readonly VerbPrepositionFrame[]) {
  const actual = frameTargetsByLevel(entries);
  const levels = Object.keys(ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL) as (keyof typeof ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL)[];
  const expectedTotal = levels.reduce((total, level) => total + ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL[level], 0);
  const actualTotal = levels.reduce((total, level) => total + actual[level], 0);
  const expectedDistribution = levels.map((level) => ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL[level]).join("/");
  const actualDistribution = levels.map((level) => actual[level]).join("/");
  if (expectedTotal !== 126 || actualTotal !== 126 || levels.some((level) => actual[level] !== ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL[level])) {
    throw new Error(`Original P0-99 quality scope drifted (expected 126 / ${expectedDistribution}; found ${actualTotal} / ${actualDistribution}). Review the historical scope before regenerating the packet.`);
  }
  return actual;
}

function appendBlankReviewColumns(row: unknown[]) {
  return [...row, ...REVIEW_COLUMNS.map(() => "")];
}

/**
 * Builds a deterministic, unsigned packet for an independent German reviewer.
 * Nothing in this output records a review decision or changes audit status.
 */
export function buildLexicalReviewPacketArtifacts(input: {
  audit: LexicalTargetAudit;
  nounEntries: readonly NounGrammarEntry[];
  verbFrames: readonly VerbPrepositionFrame[];
  contentHash: string;
}): ReviewArtifact[] {
  const { audit, nounEntries, verbFrames, contentHash } = input;

  const nounHeaders = [
    "reviewScope", "anchorId", "level", "lessonId", "lemma", "article", "gender", "nominative", "accusative", "dative", "genitive",
    "plural", "dativePlural", "sourceVersion", "targetOrRegistryReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];
  const nounRows = nounEntries.map((entry) => {
    const sources = sourcesForAnchor(audit.nounRows, entry.id);
    return appendBlankReviewColumns([
      ORIGINAL_P098_NOUN_SCOPE,
      entry.id,
      levelFromLessonId(entry.lessonId),
      entry.lessonId,
      entry.lemma,
      entry.article,
      entry.gender,
      entry.caseForms.nominative,
      entry.caseForms.accusative,
      entry.caseForms.dative,
      entry.caseForms.genitive ?? "",
      entry.plural.form ?? "",
      entry.plural.dativeForm ?? "",
      entry.sourceVersion,
      reviewEvidence(sources, ["target", "registry"], 6),
      reviewEvidence(sources, ["context"], 3),
    ]);
  });

  const frameHeaders = [
    "anchorId", "level", "lessonId", "infinitive", "preposition", "authoredGovernedCase", "chunkDe", "exampleDe",
    "sourceVersion", "machineObservedCaseSignalsNotValidation", "targetOrRegistryReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];
  const frameRows = verbFrames.map((entry) => {
    const matchingAuditRows = audit.verbFrameRows.filter((row) => row.anchorIds.includes(entry.id));
    const sources = matchingAuditRows.flatMap((row) => row.sources);
    const observedCases = [...new Set(matchingAuditRows.flatMap((row) => row.observedCases))].sort().join("; ");
    return appendBlankReviewColumns([
      entry.id,
      levelFromLessonId(entry.lessonId),
      entry.lessonId,
      entry.infinitive,
      entry.preposition,
      entry.governedCase,
      entry.chunkDe,
      entry.exampleDe,
      entry.sourceVersion,
      observedCases,
      reviewEvidence(sources, ["target", "registry"], 6),
      reviewEvidence(sources, ["context"], 3),
    ]);
  });
  const originalQualityTargetIds = new Set(verbFrames.filter(isOriginalP099QualityTarget).map((entry) => entry.id));
  const qualityTargetCountsByLevel = frameTargetsByLevel(verbFrames);
  const qualityTargetDistribution = [
    qualityTargetCountsByLevel.A1,
    qualityTargetCountsByLevel.A2,
    qualityTargetCountsByLevel.B1,
    qualityTargetCountsByLevel.B2,
  ].join("/");
  const originalQualityTargetDistribution = [
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.A1,
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.A2,
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.B1,
    ORIGINAL_P099_QUALITY_TARGETS_BY_LEVEL.B2,
  ].join("/");
  const qualityFrameHeaders = ["reviewScope", ...frameHeaders];
  const qualityLevelOrder = new Map(["A1", "A2", "B1", "B2"].map((level, index) => [level, index]));
  const qualityFrameRows = frameRows
    .filter((row) => originalQualityTargetIds.has(String(row[0])))
    .sort((left, right) => {
      const levelDifference = (qualityLevelOrder.get(String(left[1])) ?? Number.MAX_SAFE_INTEGER)
        - (qualityLevelOrder.get(String(right[1])) ?? Number.MAX_SAFE_INTEGER);
      const lessonDifference = Number(String(left[2]).split("-")[1]) - Number(String(right[2]).split("-")[1]);
      return levelDifference || lessonDifference || String(left[0]).localeCompare(String(right[0]), "en-US");
    })
    .map((row) => [ORIGINAL_P099_QUALITY_SCOPE, ...row]);

  const nounCandidates = audit.nounRows
    .filter((row) => row.status === "pending-human")
    .map((row) => appendBlankReviewColumns([
      row.id,
      "noun",
      row.level,
      row.lessonId,
      row.lemmaCandidate,
      row.status,
      row.role,
      "",
      reviewEvidence(row.sources, ["target"], 8),
      reviewEvidence(row.sources, ["context"], 3),
    ]));
  const frameCandidates = audit.verbFrameRows
    .filter((row) => row.status === "pending-human")
    .map((row) => appendBlankReviewColumns([
      row.id,
      "verb-preposition-frame",
      row.level,
      row.lessonId,
      `${row.infinitiveCandidate} + ${row.preposition}`,
      row.status,
      row.role,
      row.observedCases.join("; "),
      reviewEvidence(row.sources, ["target"], 8),
      reviewEvidence(row.sources, ["context"], 3),
    ]));
  const candidateHeaders = [
    "candidateId", "candidateType", "level", "lessonId", "candidate", "automatedInventoryStatus", "automatedRole",
    "machineObservedCaseSignalsNotValidation", "targetReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];

  const exclusionHeaders = [
    "decisionId", "lessonId", "detectedInfinitive", "detectedPreposition", "authoredReason", "authoredExplanationAr",
    "reviewStatus", "policyVersion", "detectorEvidence", ...REVIEW_COLUMNS,
  ];
  const exclusionRows = audit.exclusionDecisions.map((decision) => {
    const evidence = audit.verbFrameRows.find((row) => row.exclusionDecision?.id === decision.id)?.sources ?? [];
    return appendBlankReviewColumns([
      decision.id,
      decision.lessonId,
      decision.normalizedVerb,
      decision.preposition,
      decision.reason,
      decision.explanationAr,
      decision.reviewStatus,
      decision.policyVersion,
      reviewEvidence(evidence, ["target", "context"], 5),
    ]);
  });

  const readme = `# حزمة تجهيز المراجعة الألمانية المستقلة — P0-98 / P0-99

هذه حزمة مُولَّدة من السجلات المؤلفة الحالية لتسهيل مراجعة بشرية ألمانية مستقلة. **ليست مراجعة، ولا توقيعًا، ولا دليل اعتماد.** بصمة المحتوى التي بُنيت عليها: \`${contentHash}\`.

## نطاق الصفوف

| الملف | الصفوف (من دون الرأس) | الغرض |
|---|---:|---|
| \`noun-anchors.csv\` | ${nounRows.length} | ورقة عمل P0-98 للنطاق الأصلي: سجلات الاسم المؤلفة الـ1,297؛ راجع أداة التعريف/الجنس، التصريف، الجمع، والسياق الظاهر. |
| \`verb-frames.csv\` | ${frameRows.length} | جرد مرجعي كامل للإطارات المؤلفة الحالية؛ لا يعني أن كل صف هدف مراجعة أو أنه روجع. |
| \`frame-quality-targets.csv\` | ${qualityFrameRows.length} | ورقة العمل الحصرية لنطاق P0-99 الأصلي: التوزيع المتوقع A1/A2/B1/B2 = ${originalQualityTargetDistribution}، والتوزيع الموجود في هذه الورقة = ${qualityTargetDistribution}. |
| \`unresolved-candidates.csv\` | ${nounCandidates.length + frameCandidates.length} (${nounCandidates.length} اسم + ${frameCandidates.length} إطار) | فرز المرشحات آليًا كإشارات غير محسومة؛ أسماء P0-98 الـ89 منفصلة عن سجلات النطاق الـ1,297، ولا تمثل حالة القرار الآلي نتيجة بشرية. |
| \`structural-exclusions.csv\` | ${exclusionRows.length} | المرحلة الأولى لـP0-99: مراجعة الاستبعادات البنيوية المؤلفة وأسبابها وسياق الإشارة. تبقى جميعها pending حتى يوقّع مراجع مستقل. |

افتح الدرس/المصدر كاملًا عند المراجعة؛ مقتطفات السياق آلية ولا تحل محل الحكم اللغوي. في P0-98، راجع سجلات الاسم الـ1,297 في \`noun-anchors.csv\` وفرز مرشحات الاسم الـ89 المنفصلة في \`unresolved-candidates.csv\`؛ حالة الفرز الآلية ليست قرارًا بشريًا. ترتيب P0-99 ثابت: دليل مراجعة مسمّى للاستبعادات الثمانية أولًا، ثم مراجعة جودة صفوف \`frame-quality-targets.csv\` وعددها 126. يتبع هذا النطاق الأصلي (A1 25 + A2 30 + B1 31 + B2 دروس 01–20 عددها 40). ملف \`verb-frames.csv\` يسرد جميع المراجع المؤلفة الـ134؛ الإطارات الثمانية في B2-21…B2-24 مراجع سياقية خارج هدف الجودة الأصلي، ولا تجعل 134 عددًا للإطارات المطلوب مراجعتها. لا تسجل قرارًا قبل مراجعة بشرية فعلية وفق P0_AUDIT.md. يحرس \`content:audit\` نطاق P0-98 (1,297 سجلًا و89 مرشح اسم) وتوزيع P0-99، ويوقف إعادة التوليد عند الانحراف؛ هذا فحص نطاق آلي لا مراجعة بشرية.

## بروتوكول التوقيع

- أعمدة \`reviewDecision\`, \`reviewerName\`, \`reviewerQualification\`, \`reviewDate\`, و\`reviewerNote\` فارغة عمدًا ومحمية باختبارات؛ لا يملؤها مولّد أو نموذج.
- لا تعدّل الملفات المولدة في هذا المجلد بوصفها توقيعًا. انسخ ورقة العمل لاستقبال ملاحظات المراجع، ثم تُنقل القرارات المسمّاة والمؤرخة إلى سجل المراجعة المعتمد بعد مراجعة المالك.
- يرفض \`npm run content:audit:write\` إعادة كتابة CSV إذا امتلأ أي حقل قرار/هوية/صفة/تاريخ/ملاحظة أو تعذّر تحليل الملف؛ انسخ المدخلات الموقعة واحفظها في السجل المعتمد. هذا الحارس يمنع فقد البيانات فقط ولا يثبت مراجعة.
- يجب أن يراجع شخص مستقل مؤهل في الألمانية البيانات والسياق، ويسجل اسمه وصفته/مؤهله وتاريخ المراجعة. فسّر أي تعديل أو استبعاد في الملاحظة.
- لا يغلق وجود هذه الحزمة P0-98 أو P0-99. يظلان جزئيين حتى تُستكمل المراجعة المستقلة وتُسجّل قراراتها صراحةً في السجل الحاكم.

## حدود البيانات

الملفات تشمل حقولًا آلية ومرشحات لتوجيه المراجع فقط. لا يوجد فيها قرار مراجعة بشري مُسبق، ولا نتيجة صفية/لغوية مُقاسة، ولا ضمان أن كل إشارة سياقية فُسرت تلقائيًا على نحو صحيح.
`;

  return [
    { path: "reports/lexical-review-packet/README.md", content: readme },
    { path: "reports/lexical-review-packet/noun-anchors.csv", content: serializeCsv(nounHeaders, nounRows) },
    { path: "reports/lexical-review-packet/verb-frames.csv", content: serializeCsv(frameHeaders, frameRows) },
    { path: "reports/lexical-review-packet/frame-quality-targets.csv", content: serializeCsv(qualityFrameHeaders, qualityFrameRows) },
    { path: "reports/lexical-review-packet/unresolved-candidates.csv", content: serializeCsv(candidateHeaders, [...nounCandidates, ...frameCandidates]) },
    { path: "reports/lexical-review-packet/structural-exclusions.csv", content: serializeCsv(exclusionHeaders, exclusionRows) },
  ];
}
