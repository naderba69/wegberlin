"use client";
import { useSearchParams } from "next/navigation";
import { MediationLab } from "./mediation-lab";
export function MediationPageClient(){const params=useSearchParams();return <MediationLab lessonId={params.get("lesson")??undefined}/>}
