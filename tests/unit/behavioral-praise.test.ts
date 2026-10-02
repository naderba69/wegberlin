// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BEHAVIORAL_PRAISE_VERSION, behavioralPraise, behavioralPraiseMessages } from "@/core/coach/behavioral-praise";

const requiredEvents = [
  "session-complete",
  "warmup-complete",
  "review-initial",
  "review-delayed-success",
  "review-delayed-repair",
  "writing-revision",
  "speaking-self-review",
  "exam-submission",
  "grace-return",
] as const;
const surfaceFiles = [
  "src/components/coach-dashboard.tsx",
  "src/app/review/page.tsx",
  "src/components/writing-lab.tsx",
  "src/components/speaking-lab.tsx",
  "src/components/targeted-choice-simulation.tsx",
  "src/components/targeted-writing-simulation.tsx",
  "src/components/continuous-exam-session.tsx",
];

describe("P0 unified behavioral praise",()=>{
  it("owns one versioned dictionary for every required learning behavior",()=>{
    expect(BEHAVIORAL_PRAISE_VERSION).toBe("behavioral-praise-v1");
    expect(Object.keys(behavioralPraiseMessages).sort()).toEqual([...requiredEvents].sort());
    for(const event of requiredEvents)expect(behavioralPraise(event)).toBe(behavioralPraiseMessages[event]);
  });

  it("names observable behavior and bans generic applause",()=>{
    const forbidden=/أحسنت|رائع|ممتاز|برافو/u;
    const behavior=/أكملت|استرجعت|حاولت|قيّمت|غيّرت|استمعت|حددت|ثبّت|عدت/u;
    for(const [event,message] of Object.entries(behavioralPraiseMessages)){
      expect(message,event).not.toMatch(forbidden);
      expect(message,event).toMatch(behavior);
      expect(message.length,event).toBeGreaterThan(45);
    }
  });

  it("is used by Today, review, writing, speaking, and exam surfaces without generic praise",()=>{
    const sources=Object.fromEntries(surfaceFiles.map((file)=>[file,readFileSync(file,"utf8")]));
    expect(sources["src/components/coach-dashboard.tsx"]).toContain('behavioralPraise("session-complete")');
    expect(sources["src/app/review/page.tsx"]).toContain('behavioralPraise("review-delayed-success")');
    expect(sources["src/components/writing-lab.tsx"]).toContain('behavioralPraise("writing-revision")');
    expect(sources["src/components/speaking-lab.tsx"]).toContain('behavioralPraise("speaking-self-review")');
    expect(sources["src/components/continuous-exam-session.tsx"]).toContain('behavioralPraise("exam-submission")');
    for(const [file,source] of Object.entries(sources))expect(source,file).not.toMatch(/أحسنت|رائع|ممتاز|برافو/u);
  });
});
