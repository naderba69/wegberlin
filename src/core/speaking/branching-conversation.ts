import type { BranchChoice, BranchOutcome, BranchingConversationScenario } from "@/data/branching-conversations";
import { BRANCHING_CONVERSATION_BOUNDARY, BRANCHING_CONVERSATION_POLICY, branchNode } from "@/data/branching-conversations";
import type { BranchingConversationAttempt } from "@/types/learning";

export type BranchingConversationMode = "guided" | "challenge";

export type BranchingTurn = {
  nodeId: string;
  choiceId: string;
  quality: BranchChoice["quality"];
  nextNodeId: string;
};

export type BranchingConversationValidation = {
  reachableNodeIds: string[];
  terminalOutcomes: BranchOutcome[];
  maximumDecisionDepth: number;
  issues: string[];
};

export function validateBranchingScenario(scenario: BranchingConversationScenario): BranchingConversationValidation {
  const issues: string[] = [];
  const byId = new Map(scenario.nodes.map((node) => [node.id, node]));
  if (byId.size !== scenario.nodes.length) issues.push("Node IDs must be unique.");
  if (!byId.has(scenario.openingNodeId)) issues.push("Opening node is missing.");
  const reachable = new Set<string>();
  const outcomes = new Set<BranchOutcome>();
  let maximumDecisionDepth = 0;
  const visiting = new Set<string>();

  function visit(nodeId: string, depth: number) {
    const node = byId.get(nodeId);
    if (!node) { issues.push(`Missing next node ${nodeId}.`); return; }
    maximumDecisionDepth = Math.max(maximumDecisionDepth, depth);
    if (visiting.has(nodeId)) { issues.push(`Cycle detected at ${nodeId}.`); return; }
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);
    if (node.outcome) {
      outcomes.add(node.outcome);
      if (node.choices?.length) issues.push(`Terminal node ${nodeId} must not have choices.`);
      if (!node.outcomeTitleDe || !node.outcomeTitleAr || !node.outcomeSummaryAr || !node.transferPromptDe) issues.push(`Terminal node ${nodeId} has incomplete transfer guidance.`);
      return;
    }
    if (!node.choices || node.choices.length < 2 || node.choices.length > 3) issues.push(`Decision node ${nodeId} needs two or three choices.`);
    visiting.add(nodeId);
    for (const choice of node.choices ?? []) {
      if (!choice.responseDe.trim() || !choice.intentionAr.trim() || !choice.feedbackAr.trim() || !choice.repairTipAr.trim()) issues.push(`Choice ${choice.id} has incomplete guidance.`);
      visit(choice.nextNodeId, depth + 1);
    }
    visiting.delete(nodeId);
  }

  visit(scenario.openingNodeId, 0);
  for (const node of scenario.nodes) if (!reachable.has(node.id)) issues.push(`Unreachable node ${node.id}.`);
  for (const expected of ["goal-reached", "partial", "restart-recommended"] as const) if (!outcomes.has(expected)) issues.push(`Missing terminal outcome ${expected}.`);
  if (maximumDecisionDepth < 2 || maximumDecisionDepth > 3) issues.push("Scenario decision depth must stay between two and three turns.");
  return { reachableNodeIds: [...reachable], terminalOutcomes: [...outcomes], maximumDecisionDepth, issues };
}

export function chooseConversationBranch(scenario: BranchingConversationScenario, currentNodeId: string, choiceId: string): { choice: BranchChoice; turn: BranchingTurn; nextNodeId: string } {
  const node = branchNode(scenario, currentNodeId);
  if (node.outcome || !node.choices) throw new Error("A terminal conversation node cannot accept another choice.");
  const choice = node.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error("The selected response does not belong to the current conversation turn.");
  branchNode(scenario, choice.nextNodeId);
  return { choice, nextNodeId: choice.nextNodeId, turn: { nodeId: currentNodeId, choiceId: choice.id, quality: choice.quality, nextNodeId: choice.nextNodeId } };
}

export function createBranchingConversationAttempt(input: {
  scenario: BranchingConversationScenario;
  mode: BranchingConversationMode;
  turns: BranchingTurn[];
  supportOpenCount: number;
  now?: Date;
  id?: string;
}): BranchingConversationAttempt {
  if (!input.turns.length || input.turns.length > 3) throw new Error("A completed branching conversation needs one to three decisions.");
  if (!Number.isInteger(input.supportOpenCount) || input.supportOpenCount < 0 || input.supportOpenCount > 12) throw new Error("Support count is outside the bounded conversation contract.");
  let expectedNodeId = input.scenario.openingNodeId;
  for (const turn of input.turns) {
    if (turn.nodeId !== expectedNodeId) throw new Error("Conversation turn chain is not continuous.");
    const selected = chooseConversationBranch(input.scenario, turn.nodeId, turn.choiceId);
    if (selected.turn.quality !== turn.quality || selected.nextNodeId !== turn.nextNodeId) throw new Error("Conversation turn provenance does not match the authored branch.");
    expectedNodeId = turn.nextNodeId;
  }
  const terminal = branchNode(input.scenario, expectedNodeId);
  if (!terminal.outcome) throw new Error("Conversation attempt must finish on an authored terminal outcome.");
  return {
    id: input.id ?? `branching-conversation-${crypto.randomUUID()}`,
    policyVersion: BRANCHING_CONVERSATION_POLICY,
    scenarioId: input.scenario.id,
    level: input.scenario.level,
    mode: input.mode,
    choiceIds: input.turns.map((turn) => turn.choiceId),
    outcome: terminal.outcome,
    completedTurns: input.turns.length,
    supportOpenCount: input.supportOpenCount,
    engine: "deterministic-local-tree",
    evidenceBoundary: BRANCHING_CONVERSATION_BOUNDARY,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}
