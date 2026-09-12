import type { Metadata } from "next";
import { BranchingConversationLab } from "@/components/branching-conversation-lab";

export const metadata: Metadata = { title: "مسارات المحادثة المتفرعة" };

export default function ConversationPathsPage() {
  return <BranchingConversationLab/>;
}
