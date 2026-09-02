import { Suspense } from "react";
import { SpeakingPageClient } from "@/components/speaking-page-client";
export default function SpeakingPage(){return <Suspense fallback={<div className="loading-state"><span/><p>نحضّر مهمة المحادثة…</p></div>}><SpeakingPageClient/></Suspense>}
