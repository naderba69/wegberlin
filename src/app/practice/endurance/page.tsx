import { Suspense } from "react";
import { EnduranceLab } from "@/components/endurance-lab";

export default function EndurancePage() {
  return <Suspense fallback={<div className="loading-state"><p>نحضّر المدخل المتدرج…</p></div>}><EnduranceLab /></Suspense>;
}
