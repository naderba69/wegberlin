// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  APP_CAN_AUTHENTICATE_REVIEWER,
  buildExternalEvaluationVerificationRow,
  describeExternalEvaluationVerdict,
  EXTERNAL_EVALUATION_CHECKS,
  EXTERNAL_EVALUATION_MAX_AGE_DAYS,
  EXTERNAL_EVALUATION_SELF_TEXT_OVERLAP,
  EXTERNAL_EVALUATION_TRUST,
  EXTERNAL_EVALUATION_VERIFICATION_POLICY,
  externalEvaluationAudit,
  verifyExternalEvaluation,
} from "@/core/assessment/external-evaluation-verification";

const learnerText =
  "Ich habe mich um einen Platz im Deutschkurs beworben und möchte erklären, warum ich diesen Kurs besuchen will und wie ich meinen Alltag mit der Arbeit und dem Lernen organisieren kann.";
const cleanReply =
  "Der Text ist verständlich, aber die Sätze sind teils zu lang. Achte auf die Verbstellung im Nebensatz und trenne die Gedanken. Im zweiten Absatz fehlt ein Bezug zur Frage nach dem Zeitplan.";
const now = new Date("2026-09-26T12:00:00.000Z");
const packetText =
  "EGAL: حزمة طلب مراجعة خارجية. criteria: Aufgabe erfüllen, Kohärenz, Wortschatz. learner text: " + learnerText;

function verify(overrides: Partial<Parameters<typeof verifyExternalEvaluation>[0]> = {}) {
  return verifyExternalEvaluation({
    raw: cleanReply,
    learnerText,
    reviewerLabel: "أ. كريم (مدرّس ألمانية)",
    receivedAt: "2026-09-20T09:00:00.000Z",
    packetText,
    now,
    ...overrides,
  });
}

describe("external evaluation verification — 8 checks, two tiers", () => {
  it("declares exactly eight checks: three blocking and five claim-rejecting", () => {
    expect(EXTERNAL_EVALUATION_CHECKS).toHaveLength(8);
    expect(EXTERNAL_EVALUATION_CHECKS.filter((check) => check.tier === "blocking")).toHaveLength(3);
    expect(EXTERNAL_EVALUATION_CHECKS.filter((check) => check.tier === "rejects-claim")).toHaveLength(5);
    expect(EXTERNAL_EVALUATION_CHECKS.map((check) => check.id)).toContain("learner-self-overlap");
    expect(EXTERNAL_EVALUATION_CHECKS.map((check) => check.id)).toContain("stale-over-180-days");
  });

  it("stores a clean reviewer reply as usable unverified evidence with the literal trust label", () => {
    const verdict = verify();
    expect(verdict.verdict).toBe("usable");
    expect(verdict.trust).toBe(EXTERNAL_EVALUATION_TRUST);
    expect(verdict.trust).toBe("self-reported-unverified-evidence");
    expect(verdict.appCanAuthenticateReviewer).toBe(APP_CAN_AUTHENTICATE_REVIEWER);
    expect(verdict.appCanAuthenticateReviewer).toBe(false);
    expect(verdict.usableAsUnverifiedEvidence).toBe(true);
    expect(verdict.blockingChecks).toEqual([]);
    expect(verdict.rejectedClaimChecks).toEqual([]);
    expect(describeExternalEvaluationVerdict(verdict)).toContain("غير موثوق");
  });

  it("blocks the paste when the text is empty, unreadable, or the learner's own words", () => {
    expect(verify({ raw: "   " }).verdict).toBe("blocked");
    expect(verify({ raw: "   " }).blockingChecks).toEqual(["empty-paste"]);
    expect(verify({ raw: "!!! 12 ??? ..." }).blockingChecks).toEqual(["unreadable-paste"]);
    const selfPasted = verify({ raw: learnerText, reviewerLabel: "أ. كريم" });
    expect(selfPasted.verdict).toBe("blocked");
    expect(selfPasted.blockingChecks).toEqual(["learner-self-overlap"]);
    expect(selfPasted.usableAsUnverifiedEvidence).toBe(false);
    expect(EXTERNAL_EVALUATION_SELF_TEXT_OVERLAP).toBe(0.8);
  });

  it("keeps a genuine comment but rejects the official-result claim attached to it", () => {
    const verdict = verify({ raw: `${cleanReply} Ergebnis: 87 von 100 Punkten, damit bestanden.` });
    expect(verdict.verdict).toBe("stored-with-rejected-claim");
    expect(verdict.rejectedClaimChecks).toContain("official-result-claim");
    expect(verdict.usableAsUnverifiedEvidence).toBe(true);
    expect(describeExternalEvaluationVerdict(verdict)).toContain("رُفض الادعاء");
  });

  it("keeps the note but rejects a certificate or level claim", () => {
    const verdict = verify({ raw: `${cleanReply} Ich stelle dir das Zertifikat für Niveau B2 aus.` });
    expect(verdict.verdict).toBe("stored-with-rejected-claim");
    expect(verdict.rejectedClaimChecks).toContain("certificate-or-level-claim");
  });

  it("keeps the note but marks the packet echo, the unnamed reviewer, and stale replies", () => {
    // صدى الحزمة: لصقٌ يعيد نصّ الطلب نفسه (بلا نصّ المتعلّم) — يُرفض الادعاء ولا تُمنع الملاحظة.
    const packetEcho = "EGAL: حزمة طلب مراجعة خارجية. criteria: Aufgabe erfüllen, Kohärenz, Wortschatz.";
    const echoed = verify({ raw: packetEcho });
    expect(echoed.verdict).toBe("stored-with-rejected-claim");
    expect(echoed.rejectedClaimChecks).toContain("packet-echo");
    expect(echoed.blockingChecks).toEqual([]);
    const unnamed = verify({ reviewerLabel: "   " });
    expect(unnamed.verdict).toBe("stored-with-rejected-claim");
    expect(unnamed.rejectedClaimChecks).toContain("unnamed-reviewer");
    const stale = verify({ receivedAt: "2025-11-01T09:00:00.000Z" });
    expect(stale.rejectedClaimChecks).toContain("stale-over-180-days");
    expect(EXTERNAL_EVALUATION_MAX_AGE_DAYS).toBe(180);
  });

  it("stores a persistent verification row per paste and audits blocked attempts without a note", () => {
    const verdict = verify({ raw: "??? 12" });
    const row = buildExternalEvaluationVerificationRow({
      verification: verdict,
      id: "external-verification:1",
      submissionId: "writing-1",
      taskId: "write-1",
      level: "B2",
      createdAt: "2026-09-26T12:00:00.000Z",
    });
    expect(row.policyVersion).toBe(EXTERNAL_EVALUATION_VERIFICATION_POLICY);
    expect(row.verdict).toBe("blocked");
    expect(row.noteId).toBeUndefined();
    expect(row.trust).toBe("self-reported-unverified-evidence");
    expect(row.appCanAuthenticateReviewer).toBe(false);
    const audit = externalEvaluationAudit({
      notes: [{ verification: { verdict: "usable" } as const }],
      verifications: [
        row,
        buildExternalEvaluationVerificationRow({
          verification: verify({ raw: `${cleanReply} Note 1` }),
          id: "external-verification:2",
          submissionId: "writing-1",
          taskId: "write-1",
          level: "B2",
          noteId: "external-evaluator:1",
          createdAt: "2026-09-26T12:05:00.000Z",
        }),
      ],
    });
    expect(audit.checks).toBe(8);
    expect(audit.blockingChecks).toBe(3);
    expect(audit.claimChecks).toBe(5);
    expect(audit.blockedPastes).toBe(1);
    expect(audit.storedWithRejectedClaim).toBe(1);
    expect(audit.storedNotes).toBe(1);
  });
});

describe("external evaluation verification — probe cases", () => {
  it("measures 1 usable, 4 stored with a rejected claim, and 3 blocked", () => {
    const cases = [
      verify(),
      verify({ raw: `${cleanReply} Ergebnis: 87 von 100 Punkten.` }),
      verify({ raw: `${cleanReply} Ich stelle dir das Zertifikat für Niveau B2 aus.` }),
      verify({ reviewerLabel: "" }),
      verify({ receivedAt: "2025-01-05T09:00:00.000Z" }),
      verify({ raw: "   " }),
      verify({ raw: "!!! 12 ??? ..." }),
      verify({ raw: learnerText }),
    ];
    const tally = {
      usable: cases.filter((row) => row.verdict === "usable").length,
      storedWithRejectedClaim: cases.filter((row) => row.verdict === "stored-with-rejected-claim").length,
      blocked: cases.filter((row) => row.verdict === "blocked").length,
    };
    expect(tally).toEqual({ usable: 1, storedWithRejectedClaim: 4, blocked: 3 });
    expect(cases.every((row) => row.appCanAuthenticateReviewer === false)).toBe(true);
  });
});
