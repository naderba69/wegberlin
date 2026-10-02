import { Suspense } from "react";
import { MediationPageClient } from "@/components/mediation-page-client";
export default function MediationPage(){return <Suspense fallback={<div className="loading-state"><span/><p>نحضّر مهمة الوساطة…</p></div>}><MediationPageClient/></Suspense>}
