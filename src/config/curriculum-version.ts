import { GENERATED_CURRICULUM_VERSION_REGISTRY } from "./curriculum-version.generated";

export const CURRENT_APP_VERSION = GENERATED_CURRICULUM_VERSION_REGISTRY.appVersion;
export const CURRENT_CURRICULUM_VERSION = GENERATED_CURRICULUM_VERSION_REGISTRY.currentCurriculumVersion;
export const SUPPORTED_CURRICULUM_VERSIONS = GENERATED_CURRICULUM_VERSION_REGISTRY.supportedCurriculumVersions;
export type SupportedCurriculumVersion = typeof SUPPORTED_CURRICULUM_VERSIONS[number];
export const CURRICULUM_VERSION_POLICY = GENERATED_CURRICULUM_VERSION_REGISTRY.policyVersion;

export const curriculumVersionRegistry = GENERATED_CURRICULUM_VERSION_REGISTRY;

export function migrateCurriculumVersion(value: unknown) {
  if (value === undefined || value === null || value === "") return CURRENT_CURRICULUM_VERSION;
  if (typeof value!=="string" || !SUPPORTED_CURRICULUM_VERSIONS.includes(value as SupportedCurriculumVersion)) throw new Error(`Unsupported curriculum version: ${String(value)}`);
  return value as SupportedCurriculumVersion;
}
