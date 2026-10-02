import { describe, expect, it } from "vitest";
import {
  buildDiagnosticProductiveSample,
  canSubmitDiagnosticProductiveSample,
  DIAGNOSTIC_PRODUCTIVE_BOUNDARY,
  DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION,
} from "@/core/diagnostic/productive-sample";
import { learningStateSchema } from "@/core/portability/schema";
import { defaultState } from "@/core/portability/db";
import { namespaceImportedProfile } from "@/core/portability/merge";

describe("P0 diagnostic productive sample without fabricated grading",()=>{
  it("stores a short writing sample and self-assessment without a language score",()=>{
    const sample=buildDiagnosticProductiveSample({writingText:"  Ich lerne Deutsch.  ",selfAssessment:"independent",submittedAt:"2026-09-05T10:00:00Z"});
    expect(sample).toMatchObject({policyVersion:DIAGNOSTIC_PRODUCTIVE_SAMPLE_VERSION,promptId:"diagnostic-self-introduction-v1",mode:"writing",writingText:"Ich lerne Deutsch.",writingWordCount:3,selfAssessment:"independent",evaluationBoundary:DIAGNOSTIC_PRODUCTIVE_BOUNDARY});
    expect(sample).not.toHaveProperty("score");
    expect(sample).not.toHaveProperty("estimatedLevel");
  });

  it("supports local speaking or mixed evidence using duration rather than pronunciation claims",()=>{
    const speaking=buildDiagnosticProductiveSample({writingText:"",speakingMediaId:"diag-audio",speakingDurationSeconds:18,selfAssessment:"with-help"});
    const mixed=buildDiagnosticProductiveSample({writingText:"Ich heiße Lina.",speakingMediaId:"diag-mixed",speakingDurationSeconds:21,selfAssessment:"independent"});
    expect(speaking).toMatchObject({mode:"speaking",speakingMediaId:"diag-audio",speakingDurationSeconds:18});
    expect(mixed).toMatchObject({mode:"writing-and-speaking",writingWordCount:3,speakingDurationSeconds:21});
  });

  it("allows an honest not-yet record without lowering receptive evidence",()=>{
    const sample=buildDiagnosticProductiveSample({writingText:"",selfAssessment:"not-yet"});
    expect(sample).toMatchObject({mode:"not-yet",writingWordCount:0,selfAssessment:"not-yet"});
    expect(canSubmitDiagnosticProductiveSample({writingText:"",selfAssessment:"not-yet"})).toBe(true);
  });

  it("rejects empty claimed production and contradictory not-yet content",()=>{
    expect(canSubmitDiagnosticProductiveSample({writingText:"Ich",selfAssessment:"with-help"})).toBe(false);
    expect(canSubmitDiagnosticProductiveSample({writingText:"Ich lerne Deutsch",selfAssessment:"not-yet"})).toBe(false);
    expect(()=>buildDiagnosticProductiveSample({writingText:"",selfAssessment:"independent"})).toThrow(/ثلاث كلمات/);
  });

  it("round-trips through schema v3 and namespaces diagnostic audio on isolated import",()=>{
    const sample=buildDiagnosticProductiveSample({writingText:"Ich lerne Deutsch.",speakingMediaId:"diag-media",speakingDurationSeconds:20,selfAssessment:"independent"});
    const state={...defaultState,diagnosticResult:{estimatedLevel:"A1" as const,score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},productiveSample:sample,completedAt:sample.submittedAt}};
    expect(learningStateSchema.safeParse(state).success).toBe(true);
    const isolated=namespaceImportedProfile(state,[{id:"diag-media",blob:new Blob(["voice"]) }],"profile-z");
    expect(isolated.state.diagnosticResult?.productiveSample?.speakingMediaId).toBe("profile-z:diag-media");
    expect(isolated.media[0].id).toBe("profile-z:diag-media");
  });
});
