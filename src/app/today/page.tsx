"use client";
import { CoachDashboard } from "@/components/coach-dashboard";
import { OnboardingPanel } from "@/components/onboarding-panel";
import { useLearning } from "@/components/learning-provider";

export default function TodayPage() {
  const { state, ready } = useLearning();
  if (!ready) return <div className="loading-state"><span/><p>نحضّر طريقك…</p></div>;
  return state.profile ? <CoachDashboard /> : <OnboardingPanel />;
}
