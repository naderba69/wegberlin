import { Suspense } from "react";
import { WritingPageClient } from "@/components/writing-page-client";
export default function WritingPage(){return <Suspense fallback={<div className="loading-state"><span/><p>نحضّر مهمة الكتابة…</p></div>}><WritingPageClient/></Suspense>}
