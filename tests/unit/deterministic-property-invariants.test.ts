// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PROPERTY_HARNESS_POLICY, runDeterministicProperty } from "../helpers/deterministic-property";
import { compareAccepted, normalizeGermanText } from "@/core/lesson/evaluate";
import { GERMAN_CHARACTERS, insertGermanCharacter } from "@/core/accessibility/german-character-input";
import { defaultState } from "@/core/portability/db";
import { mergeLearningStates } from "@/core/portability/merge";
import { learningStateSchema } from "@/core/portability/schema";
import { collocationNetworks } from "@/data/collocation-networks";
import { createCollocationNetworkAttempt, evaluateCollocationChoice } from "@/core/vocabulary/collocation-network";
import { branchNode, branchingConversationScenarios } from "@/data/branching-conversations";
import { chooseConversationBranch, createBranchingConversationAttempt, type BranchingTurn } from "@/core/speaking/branching-conversation";
import type { ExerciseAttempt, LearningState } from "@/types/learning";

const words = ["Straße", "Größe", "Mädchen", "Übung", "Termin", "Verantwortung", "überprüfen", "Kaffee", "Wohnung", "Entscheidung"] as const;
const lessonIds = ["a1-01", "a1-02", "a1-24", "a2-01", "a2-24", "b1-01", "b1-24", "b2-01", "b2-12"] as const;
const sorted = <T extends string>(values: Iterable<T>) => [...values].sort();

function randomSubset<T>(values: readonly T[], mask: number) { return values.filter((_, index) => Boolean(mask & (1 << index))); }
function attempt(id: string, lessonId: string, correct: boolean): ExerciseAttempt { return { id, lessonId, exerciseId:`exercise-${id}`,answer:"x",correct,createdAt:"2026-09-12T10:00:00.000Z" }; }

describe("P2 deterministic generative property invariants", () => {
  it("replays a seed exactly and reports a shrunk counterexample", () => {
    expect(PROPERTY_HARNESS_POLICY).toBe("deterministic-generative-properties-v1");
    const first:number[]=[];const second:number[]=[];
    for(const target of[first,second])runDeterministicProperty({name:"replay",runs:50,seed:0x5eed2026,generate:({integer})=>integer(-1000,1000),assert:value=>{target.push(value)}});
    expect(second).toEqual(first);
    expect(()=>runDeterministicProperty({name:"shrink-demo",runs:1,seed:17,generate:({integer})=>integer(1,20),assert:value=>expect(value).toBeLessThan(0),shrink:value=>value===0?[]:[Math.floor(value/2)]})).toThrow(/seed=17 run=0; counterexample=0/);
  });

  it("keeps German normalization idempotent across 2,000 generated Unicode and punctuation variants", () => {
    runDeterministicProperty({name:"normalization-idempotence",runs:2000,seed:0x101,generate:({pick,integer})=>`${" ".repeat(integer(0,3))}${pick(words)}${pick(["",".","!","?","„",":"])}${" ".repeat(integer(0,3))}`,assert:value=>expect(normalizeGermanText(normalizeGermanText(value))).toBe(normalizeGermanText(value))});
  });

  it("preserves accepted-answer equivalence under documented case, spacing, and punctuation while keeping ß-to-SS expansion strict", () => {
    const caseStableWords=words.filter(word=>!word.includes("ß"));
    runDeterministicProperty({name:"accepted-equivalence",runs:1200,seed:0x102,generate:({pick,integer})=>{const base=`Ich lerne ${pick(caseStableWords)}`;const transformed=`${" ".repeat(integer(0,2))}${integer(0,1)?base.toLocaleUpperCase("de-DE"):base}${pick(["",".","!","?"])}${" ".repeat(integer(0,2))}`;return{base,transformed}},assert:({base,transformed})=>expect(compareAccepted(transformed,[base])).toBe(true)});
    expect(compareAccepted("ICH LERNE STRASSE",["Ich lerne Straße"])).toBe(false);
  });

  it("inserts every German special character with bounded selection and exact cursor invariants", () => {
    runDeterministicProperty({name:"german-character-splice",runs:1800,seed:0x103,generate:({pick,integer})=>{const value=`${pick(words)} ${pick(words)}`,start=integer(-5,value.length+5),end=integer(-5,value.length+8);return{value,start,end,character:pick(GERMAN_CHARACTERS)}},assert:({value,start,end,character})=>{const safeStart=Math.max(0,Math.min(value.length,start));const safeEnd=Math.max(safeStart,Math.min(value.length,end));const result=insertGermanCharacter(value,start,end,character);expect(result.value).toBe(`${value.slice(0,safeStart)}${character}${value.slice(safeEnd)}`);expect(result.selectionStart).toBe(safeStart+character.length);expect(result.selectionEnd).toBe(result.selectionStart)}});
  });

  it("preserves union, uniqueness, maximum progress, and maximum due count over 1,000 randomized state merges", () => {
    runDeterministicProperty({name:"merge-union-max",runs:1000,seed:0x104,generate:({integer})=>{const leftIds=randomSubset(lessonIds,integer(0,511)),rightIds=randomSubset(lessonIds,integer(0,511));const leftProgress=Object.fromEntries(leftIds.map(id=>[id,integer(0,13)])),rightProgress=Object.fromEntries(rightIds.map(id=>[id,integer(0,13)]));const leftAttempts=leftIds.map((id,index)=>attempt(`l-${index}-${id}`,id,index%2===0)),rightAttempts=rightIds.map((id,index)=>attempt(`r-${index}-${id}`,id,index%2!==0));return{left:{...defaultState,completedLessonIds:leftIds,lessonProgress:leftProgress,exerciseAttempts:leftAttempts,dueReviews:integer(0,50),updatedAt:"2026-09-12T09:00:00.000Z"}as LearningState,right:{...defaultState,completedLessonIds:rightIds,lessonProgress:rightProgress,exerciseAttempts:rightAttempts,dueReviews:integer(0,50),updatedAt:"2026-09-12T10:00:00.000Z"}as LearningState}},assert:({left,right})=>{const merged=mergeLearningStates(left,right);expect(sorted(merged.completedLessonIds)).toEqual(sorted(new Set([...left.completedLessonIds,...right.completedLessonIds])));expect(new Set(merged.exerciseAttempts.map(item=>item.id)).size).toBe(merged.exerciseAttempts.length);expect(merged.dueReviews).toBe(Math.max(left.dueReviews,right.dueReviews));for(const id of new Set([...Object.keys(left.lessonProgress),...Object.keys(right.lessonProgress)]))expect(merged.lessonProgress[id]).toBe(Math.max(left.lessonProgress[id]??0,right.lessonProgress[id]??0))}});
  });

  it("keeps merge append-only evidence idempotent by stable ID across 600 generated duplicate inputs", () => {
    runDeterministicProperty({name:"merge-idempotent-evidence",runs:600,seed:0x105,generate:({integer,pick})=>{const ids=randomSubset(lessonIds,integer(0,511));const exerciseAttempts=ids.map((lessonId,index)=>attempt(`stable-${index}`,lessonId,pick([true,false])));return{...defaultState,completedLessonIds:ids,exerciseAttempts,updatedAt:"2026-09-12T10:00:00.000Z"}as LearningState},assert:value=>{const merged=mergeLearningStates(value,value);expect(sorted(merged.completedLessonIds)).toEqual(sorted(value.completedLessonIds));expect(merged.exerciseAttempts).toEqual(value.exerciseAttempts);expect(new Set(merged.exerciseAttempts.map(item=>item.id)).size).toBe(value.exerciseAttempts.length)}});
  });

  it("derives all randomized collocation result counts from authored IDs and remains strict-schema portable", () => {
    runDeterministicProperty({name:"collocation-derived-count",runs:800,seed:0x106,generate:({pick})=>{const network=pick(collocationNetworks),results=network.nodes.map(target=>evaluateCollocationChoice(network,target.id,pick(network.nodes).id));return{network,results}},assert:({network,results})=>{const value=createCollocationNetworkAttempt({network,mode:"challenge",visitedNodeIds:network.nodes.map(node=>node.id),results,id:`property-${network.id}-${results.map(x=>x.selectedNodeId).join("-")}`});expect(value.correctCount).toBe(results.filter(result=>result.targetNodeId===result.selectedNodeId).length);expect(learningStateSchema.safeParse({...defaultState,collocationNetworkAttempts:[value]}).success).toBe(true)}});
  });

  it("walks 800 random authored conversation branches to a terminal without inventing outcomes or answer text", () => {
    runDeterministicProperty({name:"branch-terminal-provenance",runs:800,seed:0x107,generate:({pick})=>{const scenario=pick(branchingConversationScenarios);let nodeId=scenario.openingNodeId;const turns:BranchingTurn[]=[];while(!branchNode(scenario,nodeId).outcome){const node=branchNode(scenario,nodeId),choice=pick(node.choices!);const selected=chooseConversationBranch(scenario,nodeId,choice.id);turns.push(selected.turn);nodeId=selected.nextNodeId}return{scenario,turns}},assert:({scenario,turns})=>{const value=createBranchingConversationAttempt({scenario,mode:"guided",turns,supportOpenCount:0,id:`property-${scenario.id}-${turns.map(turn=>turn.choiceId).join("-")}`});expect(["goal-reached","partial","restart-recommended"]).toContain(value.outcome);expect(value.choiceIds).toHaveLength(value.completedTurns);expect(value).not.toHaveProperty("responseDe");expect(learningStateSchema.safeParse({...defaultState,branchingConversationAttempts:[value]}).success).toBe(true)}});
  });
});
