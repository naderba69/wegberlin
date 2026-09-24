import type { Metadata } from "next";
import { DictationLab } from "@/components/dictation-lab";

export const metadata: Metadata = { title: "مختبر الإملاء المتكيف" };

export default function DictationPage() {
  return <DictationLab/>;
}
