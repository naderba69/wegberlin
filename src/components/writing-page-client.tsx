"use client";
import { useSearchParams } from "next/navigation";
import { WritingLab } from "./writing-lab";
export function WritingPageClient(){const params=useSearchParams();return <WritingLab lessonId={params.get("lesson")??undefined}/>}
