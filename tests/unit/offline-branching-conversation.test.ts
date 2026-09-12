// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRANCHING_CONVERSATION_BOUNDARY, BRANCHING_CONVERSATION_POLICY, branchNode, branchingConversationScenarios, branchingScenariosForLevel } from "@/data/branching-conversations";
import { chooseConversationBranch, createBranchingConversationAttempt, validateBranchingScenario } from "@/core/speaking/branching-conversation";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";

const levels = ["A1", "A2", "B1", "B2"] as const;

describe("P2 deterministic offline branching conversations", () => {
  it("provides two original no-AI scenarios for every A1-B2 level", () => {
    expect(branchingConversationScenarios).toHaveLength(8);
    for (const level of levels) expect(branchingScenariosForLevel(level)).toHaveLength(2);
    expect(branchingConversationScenarios.every((scenario) => scenario.policyVersion === BRANCHING_CONVERSATION_POLICY && scenario.source === "original-authored-branching-dialogue" && scenario.engine === "deterministic-local-tree" && scenario.aiRequired === false)).toBe(true);
    expect(JSON.stringify(branchingConversationScenarios)).not.toMatch(/https?:\/\/|apiKey|provider|promptVersion/);
  });

  it("validates every authored tree as reachable, acyclic, bounded, and outcome-complete", () => {
    for (const scenario of branchingConversationScenarios) {
      const result = validateBranchingScenario(scenario);
      expect(result.issues, scenario.id).toEqual([]);
      expect(result.reachableNodeIds).toHaveLength(scenario.nodes.length);
      expect(new Set(result.terminalOutcomes)).toEqual(new Set(["goal-reached", "partial", "restart-recommended"]));
      expect(result.maximumDecisionDepth).toBe(2);
      expect(scenario.nodes.filter((node) => !node.outcome).every((node) => node.choices && node.choices.length >= 2)).toBe(true);
    }
  });

  it("routes the same partner question to genuinely different consequences", () => {
    const scenario = branchingConversationScenarios[0];
    const opening = branchNode(scenario, scenario.openingNodeId);
    const direct = chooseConversationBranch(scenario, opening.id, opening.choices![0].id);
    const repair = chooseConversationBranch(scenario, opening.id, opening.choices![1].id);
    const offGoal = chooseConversationBranch(scenario, opening.id, opening.choices![2].id);
    expect(new Set([direct.nextNodeId, repair.nextNodeId, offGoal.nextNodeId]).size).toBe(3);
    expect(direct.choice.quality).toBe("effective");
    expect(repair.choice.quality).toBe("repairable");
    expect(offGoal.choice.quality).toBe("misaligned");
    expect(branchNode(scenario, offGoal.nextNodeId).outcome).toBe("restart-recommended");
  });

  it("creates a goal attempt only after a continuous authored branch reaches a terminal", () => {
    const scenario = branchingConversationScenarios.find((candidate) => candidate.id === "branch-b2-flexwork")!;
    const first = chooseConversationBranch(scenario, scenario.openingNodeId, branchNode(scenario, scenario.openingNodeId).choices![0].id);
    const second = chooseConversationBranch(scenario, first.nextNodeId, branchNode(scenario, first.nextNodeId).choices![0].id);
    const attempt = createBranchingConversationAttempt({ scenario, mode: "challenge", turns: [first.turn, second.turn], supportOpenCount: 1, now: new Date("2026-09-11T20:00:00Z"), id: "branch-attempt-1" });
    expect(attempt).toMatchObject({ policyVersion: BRANCHING_CONVERSATION_POLICY, level: "B2", mode: "challenge", outcome: "goal-reached", completedTurns: 2, supportOpenCount: 1, engine: "deterministic-local-tree", evidenceBoundary: BRANCHING_CONVERSATION_BOUNDARY });
    expect(attempt.choiceIds).toEqual([first.choice.id, second.choice.id]);
    expect(attempt).not.toHaveProperty("responseDe");
    expect(attempt).not.toHaveProperty("freeText");
  });

  it("rejects a forged or unfinished path instead of inventing an outcome", () => {
    const scenario = branchingConversationScenarios[0];
    const first = chooseConversationBranch(scenario, scenario.openingNodeId, branchNode(scenario, scenario.openingNodeId).choices![0].id);
    expect(() => createBranchingConversationAttempt({ scenario, mode: "guided", turns: [first.turn], supportOpenCount: 0 })).toThrow("terminal");
    expect(() => createBranchingConversationAttempt({ scenario, mode: "guided", turns: [{ ...first.turn, quality: "misaligned" }], supportOpenCount: 0 })).toThrow("provenance");
    expect(() => chooseConversationBranch(scenario, scenario.openingNodeId, "choice-from-another-turn")).toThrow("does not belong");
  });

  it("keeps strict portable summaries mergeable without answer text or mastery", () => {
    const scenario = branchingConversationScenarios[0];
    const offGoal = chooseConversationBranch(scenario, scenario.openingNodeId, branchNode(scenario, scenario.openingNodeId).choices![2].id);
    const first = createBranchingConversationAttempt({ scenario, mode: "guided", turns: [offGoal.turn], supportOpenCount: 1, id: "b1" });
    const second = { ...first, id: "b2", mode: "challenge" as const, supportOpenCount: 0 };
    expect(learningStateSchema.safeParse({ ...defaultState, branchingConversationAttempts: [first] }).success).toBe(true);
    expect(learningStateSchema.safeParse({ ...defaultState, branchingConversationAttempts: [{ ...first, answerText: "secret" }] }).success).toBe(false);
    expect(learningStateSchema.safeParse({ ...defaultState, branchingConversationAttempts: [{ ...first, completedTurns: 2 }] }).success).toBe(false);
    const merged = mergeLearningStates({ ...defaultState, branchingConversationAttempts: [first] }, { ...defaultState, branchingConversationAttempts: [second] });
    expect(merged.branchingConversationAttempts).toHaveLength(2);
    expect(merged.mastery).toEqual(defaultState.mastery);
  });

  it("renders goal-first guided and challenge modes with explicit simulation boundaries", () => {
    const source = readFileSync("src/components/branching-conversation-lab.tsx", "utf8");
    for (const marker of ["Kommunikatives Ziel", "Wie reagieren Sie?", "موجّه", "تحدٍ", "ماذا حدث؟", "Transfer ohne Auswahl", "ليست محادثة حية", "لا شخص حقيقي", "data-branching-conversation-policy"]) expect(source).toContain(marker);
    expect(source).toContain("لا نص حر، لا شبكة، لا AI، لا شريك حي، ولا mastery");
    expect(source).not.toMatch(/fetch\(|WebSocket|MediaRecorder|pronunciationScore|fluencyScore/);
    expect(source).not.toContain("% scenarios.length");
    expect(source).toContain("إنهاء والعودة إلى المختبرات");
  });
});
