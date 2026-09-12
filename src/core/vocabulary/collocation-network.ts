import type { CollocationNetwork } from "@/data/collocation-networks";
import { COLLOCATION_NETWORK_BOUNDARY, COLLOCATION_NETWORK_POLICY } from "@/data/collocation-networks";
import type { CollocationNetworkAttempt } from "@/types/learning";

export type CollocationPracticeMode = "guided" | "challenge";
export type CollocationChoiceResult = { targetNodeId: string; selectedNodeId: string; correct: boolean };

export function evaluateCollocationChoice(network: CollocationNetwork, targetNodeId: string, selectedNodeId: string): CollocationChoiceResult {
  const ids = new Set(network.nodes.map((node) => node.id));
  if (!ids.has(targetNodeId) || !ids.has(selectedNodeId)) throw new Error("Collocation choice must belong to the current network.");
  return { targetNodeId, selectedNodeId, correct: targetNodeId === selectedNodeId };
}

export function createCollocationNetworkAttempt(input: {
  network: CollocationNetwork;
  mode: CollocationPracticeMode;
  visitedNodeIds: string[];
  results: CollocationChoiceResult[];
  now?: Date;
  id?: string;
}): CollocationNetworkAttempt {
  const authoredIds = input.network.nodes.map((node) => node.id);
  if (new Set(input.visitedNodeIds).size !== authoredIds.length || authoredIds.some((id) => !input.visitedNodeIds.includes(id))) throw new Error("Every collocation branch must be explored before a completed attempt.");
  if (input.results.length !== authoredIds.length || new Set(input.results.map((result) => result.targetNodeId)).size !== authoredIds.length) throw new Error("A completed collocation attempt needs one result for every context.");
  for (const result of input.results) {
    const derived = evaluateCollocationChoice(input.network, result.targetNodeId, result.selectedNodeId);
    if (derived.correct !== result.correct) throw new Error("Collocation correctness does not match the authored context target.");
  }
  return {
    id: input.id ?? `collocation-attempt-${crypto.randomUUID()}`,
    policyVersion: COLLOCATION_NETWORK_POLICY,
    networkId: input.network.id,
    level: input.network.level,
    mode: input.mode,
    visitedNodeIds: [...new Set(input.visitedNodeIds)],
    targetNodeIds: input.results.map((result) => result.targetNodeId),
    selectedNodeIds: input.results.map((result) => result.selectedNodeId),
    correctCount: input.results.filter((result) => result.correct).length,
    total: 3,
    engine: "deterministic-context-match",
    evidenceBoundary: COLLOCATION_NETWORK_BOUNDARY,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}
