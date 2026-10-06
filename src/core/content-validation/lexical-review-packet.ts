import type { NounGrammarEntry, VerbPrepositionFrame } from "@/types/lexical-grammar";
import type { buildLexicalTargetGapAudit } from "./lexical-target-gap";

type LexicalTargetAudit = ReturnType<typeof buildLexicalTargetGapAudit>;
type ReviewArtifact = { path: string; content: string };
type EvidenceSource = { path: string; stage: string; surface: string; strength: "target" | "context" | "registry" };

const REVIEW_COLUMNS = ["reviewDecision", "reviewerName", "reviewerQualification", "reviewDate", "reviewerNote"] as const;

function csvCell(value: unknown) {
  const normalized = String(value ?? "").replace(/[\r\n\t]+/g, " ");
  const formulaSafe = /^[\u0000-\u0020]*[=+\-@]/u.test(normalized) ? `'${normalized}` : normalized;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

function csv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

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
    "anchorId", "level", "lessonId", "lemma", "article", "gender", "nominative", "accusative", "dative", "genitive",
    "plural", "dativePlural", "sourceVersion", "targetOrRegistryReferences", "contextReferences", ...REVIEW_COLUMNS,
  ];
  const nounRows = nounEntries.map((entry) => {
    const sources = sourcesForAnchor(audit.nounRows, entry.id);
    return appendBlankReviewColumns([
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
| \`noun-anchors.csv\` | ${nounRows.length} | مراجعة سجلات الاسم المؤلفة: أداة التعريف/الجنس، التصريف، الجمع، وسياق الاستخدام الظاهر. |
| \`verb-frames.csv\` | ${frameRows.length} | مراجعة إطار الفعل/حرف الجر والحالة المكتوبة والمثال. عمود الإشارات الآلية قرينة جرد فقط، لا تصديق للحالة. |
| \`unresolved-candidates.csv\` | ${nounCandidates.length + frameCandidates.length} (${nounCandidates.length} اسم + ${frameCandidates.length} إطار) | حسم المرشحات غير المغطاة: هل تحتاج إلى سجل مؤلف أم هي إشارة سياقية/استخراج خاطئ؟ |
| \`structural-exclusions.csv\` | ${exclusionRows.length} | مراجعة الاستبعادات البنيوية المؤلفة وأسبابها وسياق الإشارة. تبقى جميعها pending حتى يوقّع مراجع مستقل. |

مصادر السياق مسارات ونصوص قصيرة مختارة آليًا من السجل؛ افتح الدرس/المصدر كاملًا عند المراجعة. لا تستخدم المطابقة الآلية بديلًا عن الحكم اللغوي، ولا تخترع صيغة أو حالة غير مثبتة. ملف الإطارات يعرض جميع المراجع المؤلفة الـ134؛ ولا يغيّر معيار P0-99 الأصلي: مراجعة جودة الإطارات الـ126 وقرار مستقل للاستبعادات الثمانية وفق P0_AUDIT.md.

## بروتوكول التوقيع

- أعمدة \`reviewDecision\`, \`reviewerName\`, \`reviewerQualification\`, \`reviewDate\`, و\`reviewerNote\` فارغة عمدًا ومحمية باختبارات؛ لا يملؤها مولّد أو نموذج.
- لا تعدّل الملفات المولدة في هذا المجلد بوصفها توقيعًا. انسخ ورقة العمل لاستقبال ملاحظات المراجع، ثم تُنقل القرارات المسمّاة والمؤرخة إلى سجل المراجعة المعتمد بعد مراجعة المالك.
- يجب أن يراجع شخص مستقل مؤهل في الألمانية البيانات والسياق، ويسجل اسمه وصفته/مؤهله وتاريخ المراجعة. فسّر أي تعديل أو استبعاد في الملاحظة.
- لا يغلق وجود هذه الحزمة P0-98 أو P0-99. يظلان جزئيين حتى تُستكمل المراجعة المستقلة وتُسجّل قراراتها صراحةً في السجل الحاكم.

## حدود البيانات

الملفات تشمل حقولًا آلية ومرشحات لتوجيه المراجع فقط. لا يوجد فيها قرار مراجعة بشري مُسبق، ولا نتيجة صفية/لغوية مُقاسة، ولا ضمان أن كل إشارة سياقية فُسرت تلقائيًا على نحو صحيح.
`;

  return [
    { path: "reports/lexical-review-packet/README.md", content: readme },
    { path: "reports/lexical-review-packet/noun-anchors.csv", content: csv(nounHeaders, nounRows) },
    { path: "reports/lexical-review-packet/verb-frames.csv", content: csv(frameHeaders, frameRows) },
    { path: "reports/lexical-review-packet/unresolved-candidates.csv", content: csv(candidateHeaders, [...nounCandidates, ...frameCandidates]) },
    { path: "reports/lexical-review-packet/structural-exclusions.csv", content: csv(exclusionHeaders, exclusionRows) },
  ];
}
