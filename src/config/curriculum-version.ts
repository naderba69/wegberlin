import { GENERATED_CURRICULUM_VERSION_REGISTRY } from "./curriculum-version.generated";

export const CURRENT_APP_VERSION = GENERATED_CURRICULUM_VERSION_REGISTRY.appVersion;
export const CURRENT_CURRICULUM_VERSION = GENERATED_CURRICULUM_VERSION_REGISTRY.currentCurriculumVersion;
export const CURRICULUM_VERSION_POLICY = GENERATED_CURRICULUM_VERSION_REGISTRY.policyVersion;

export const curriculumVersionRegistry = GENERATED_CURRICULUM_VERSION_REGISTRY;

export function migrateCurriculumVersion(value: unknown) {
  if (value === undefined || value === null || value === "") return CURRENT_CURRICULUM_VERSION;
  if (value !== CURRENT_CURRICULUM_VERSION) throw new Error(`Unsupported curriculum version: ${String(value)}`);
  return value;
}
