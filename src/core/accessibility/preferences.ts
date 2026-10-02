import type { AccessibilityPreferences } from "@/types/learning";

export const ACCESSIBILITY_PREFERENCES_POLICY = "accessibility-preferences-v1" as const;

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  policyVersion: ACCESSIBILITY_PREFERENCES_POLICY,
  fontScale: "default",
  highContrast: false,
  reducedMotion: false,
};

export function accessibilityPreferencesAreDefault(preferences: AccessibilityPreferences): boolean {
  return preferences.fontScale === DEFAULT_ACCESSIBILITY_PREFERENCES.fontScale
    && preferences.highContrast === DEFAULT_ACCESSIBILITY_PREFERENCES.highContrast
    && preferences.reducedMotion === DEFAULT_ACCESSIBILITY_PREFERENCES.reducedMotion;
}
