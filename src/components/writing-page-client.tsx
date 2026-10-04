"use client";
import { useSearchParams } from "next/navigation";
import { useLearning } from "./learning-provider";
import { WritingLab } from "./writing-lab";
import { WeeklyWritingCyclePanel } from "./weekly-writing-cycle-panel";
export function WritingPageClient(){const params=useSearchParams();const {ready,activeProfileId}=useLearning();if(!ready)return <div className="loading-state"><p>نحمّل المهمة والأدلة المحلية…</p></div>;return <><WeeklyWritingCyclePanel/><WritingLab key={`${activeProfileId}:${params.get("task")??params.get("lesson")??"default"}`} lessonId={params.get("lesson")??undefined} independentTaskId={params.get("task")??undefined}/></>}
