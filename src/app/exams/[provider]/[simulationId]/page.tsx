import { notFound } from "next/navigation";
import { TargetedExamSimulationView } from "@/components/targeted-exam-simulation";
import { TargetedListeningSimulationView } from "@/components/targeted-listening-simulation";
import { TargetedWritingSimulationView } from "@/components/targeted-writing-simulation";
import { TargetedChoiceSimulationView } from "@/components/targeted-choice-simulation";
import { TargetedSpeakingSimulationView } from "@/components/targeted-speaking-simulation";
import { ContinuousExamTaskGuard } from "@/components/continuous-exam-session";
import {
  allPublishedExamTasks,
  publishedTargetedExamSimulationById,
} from "@/data/exam-simulation-registry";

export function generateStaticParams() {
  return allPublishedExamTasks.map((simulation) => ({
    provider: simulation.provider,
    simulationId: simulation.id,
  }));
}

export default async function TargetedExamPage({
  params,
}: {
  params: Promise<{ provider: string; simulationId: string }>;
}) {
  const { provider, simulationId } = await params;
  const simulation = publishedTargetedExamSimulationById[simulationId];
  if (!simulation || simulation.provider !== provider) notFound();
  const runner = simulation.kind === "matching"
    ? <TargetedExamSimulationView simulation={simulation} />
    : simulation.kind === "listening"
      ? <TargetedListeningSimulationView simulation={simulation} />
      : simulation.kind === "writing"
        ? <TargetedWritingSimulationView simulation={simulation} />
        : simulation.kind === "choice"
          ? <TargetedChoiceSimulationView simulation={simulation} />
          : <TargetedSpeakingSimulationView simulation={simulation} />;
  return <ContinuousExamTaskGuard task={simulation}>{runner}</ContinuousExamTaskGuard>;
}
