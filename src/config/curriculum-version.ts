export const CURRENT_APP_VERSION = "0.1.0" as const;
export const CURRENT_CURRICULUM_VERSION = "dwnb-a1-b2-2026.09-v1" as const;
export const CURRICULUM_VERSION_POLICY = "independent-curriculum-version-v1" as const;

export const curriculumVersionRegistry = {
  policyVersion: CURRICULUM_VERSION_POLICY,
  currentCurriculumVersion: CURRENT_CURRICULUM_VERSION,
  appVersion: CURRENT_APP_VERSION,
  scope: "A1-B2-only",
  publishedAt: "2026-09-09",
  priorUnversionedState: "migrate-to-current-on-validated-load",
  evidenceBoundary: "curriculum-identity-separate-from-app-build-and-no-cefr-or-review-claim",
} as const;

export function migrateCurriculumVersion(value: unknown) {
  if (value === undefined || value === null || value === "") return CURRENT_CURRICULUM_VERSION;
  if (value !== CURRENT_CURRICULUM_VERSION) throw new Error(`Unsupported curriculum version: ${String(value)}`);
  return value;
}
