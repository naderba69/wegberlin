import type { MotivationPreferences } from "@/types/learning";

export const GAMIFICATION_VISIBILITY_POLICY = "gamification-visibility-v1" as const;

export const DEFAULT_MOTIVATION_PREFERENCES: MotivationPreferences = {
  policyVersion: GAMIFICATION_VISIBILITY_POLICY,
  gamificationVisible: true,
};

export function motivationPreferencesAreDefault(preferences: MotivationPreferences) {
  return preferences.policyVersion === GAMIFICATION_VISIBILITY_POLICY && preferences.gamificationVisible;
}

export function functionalMessageWithOptionalPraise(gamificationVisible: boolean, functionalAr: string, praiseAr: string) {
  return gamificationVisible ? `${praiseAr} ${functionalAr}` : functionalAr;
}
