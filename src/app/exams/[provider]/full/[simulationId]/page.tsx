import { notFound } from "next/navigation";
import { FullExamSimulationView } from "@/components/full-exam-simulation";
import { fullExamSimulationById, fullExamSimulations } from "@/data/full-exam-simulations";

export function generateStaticParams() {
  return fullExamSimulations.map((simulation) => ({ provider: simulation.provider, simulationId: simulation.id }));
}

export default async function FullExamPage({ params }: { params: Promise<{ provider: string; simulationId: string }> }) {
  const { provider, simulationId } = await params;
  const simulation = fullExamSimulationById[simulationId];
  if (!simulation || simulation.provider !== provider) notFound();
  return <FullExamSimulationView simulation={simulation} />;
}
