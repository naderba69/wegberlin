"use client";
import { useSearchParams } from "next/navigation";
import { SpeakingLab } from "./speaking-lab";
export function SpeakingPageClient(){const params=useSearchParams();return <SpeakingLab lessonId={params.get("lesson")??undefined}/>}
