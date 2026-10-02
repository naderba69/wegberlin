import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EXAM_PARTNER_ALIGNMENT_BASIS,
  EXAM_PARTNER_BOUNDARY_AR,
  EXAM_PARTNER_EVIDENCE_BOUNDARY,
  EXAM_PARTNER_MAX_TURNS,
  EXAM_PARTNER_PACES,
  EXAM_PARTNER_PERSONA_COUNT,
  EXAM_PARTNER_PERSONAS,
  EXAM_PARTNER_POLICY_VERSION,
  EXAM_PARTNER_SCENARIO_COUNT,
  EXAM_PARTNER_SCENARIOS,
  EXAM_PARTNER_TURN_TOTAL,
  assertExamPartnerIntegrity,
  buildExamPartnerSession,
  examPartnerPaceFor,
  examPartnerPersonaById,
} from "@/core/speaking/exam-partner-simulation";

const core = readFileSync("src/core/speaking/exam-partner-simulation.ts", "utf8");
const panel = readFileSync("src/components/exam-partner-panel.tsx", "utf8");
const hub = readFileSync("src/components/exam-hub.tsx", "utf8");

describe("P2-165 exam partner simulation — بسرعات وشخصيات مختلفة", () => {
  it("authors three scenarios times four personas with at least four turns each", () => {
    expect(EXAM_PARTNER_SCENARIO_COUNT).toBe(3);
    expect(EXAM_PARTNER_PERSONA_COUNT).toBe(4);
    expect(assertExamPartnerIntegrity()).toBe(true);
    expect(EXAM_PARTNER_TURN_TOTAL).toBe(48);
    for (const scenario of EXAM_PARTNER_SCENARIOS) {
      for (const persona of EXAM_PARTNER_PERSONAS) {
        expect(scenario.turns[persona.id].length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("keeps every partner line pure German with an explicit learner turn and goal in Arabic", () => {
    for (const scenario of EXAM_PARTNER_SCENARIOS) {
      for (const turns of Object.values(scenario.turns)) {
        for (const turn of turns) {
          expect(turn.partnerLineDe).not.toMatch(/[\u0600-\u06FF]/u);
          expect(turn.partnerLineDe.split(/\s+/).length).toBeGreaterThanOrEqual(6);
          expect(turn.yourTurnAr).toContain("دورك");
          expect(turn.goalAr.length).toBeGreaterThan(3);
        }
      }
    }
  });

  it("declares exactly three paces with the documented rates and honest labels", () => {
    expect(EXAM_PARTNER_PACES.map((pace) => [pace.id, pace.rate])).toEqual([
      ["slow", 0.8],
      ["steady", 1.0],
      ["fast", 1.15],
    ]);
    expect(EXAM_PARTNER_PERSONAS.map((persona) => persona.defaultPace)).toEqual(["steady", "fast", "slow", "steady"]);
    for (const pace of EXAM_PARTNER_PACES) expect(pace.labelAr).toMatch(/\d\.\d{2}×/);
  });

  it("gives every persona its own pace by default and lets the learner override it explicitly", () => {
    const fast = examPartnerPaceFor("fast-contrarian");
    expect(fast.id).toBe("fast");
    expect(fast.rate).toBe(1.15);
    const overridden = examPartnerPaceFor("fast-contrarian", "slow");
    expect(overridden.id).toBe("slow");
    expect(overridden.rate).toBe(0.8);
    expect(() => examPartnerPaceFor("nobody")).toThrow(/شخصية غير معروفة/);
  });

  it("builds a session that records persona, rate, override flag and the unofficial alignment basis", () => {
    const session = buildExamPartnerSession("car-free-sundays", "slow-supportive", "steady");
    expect(session.policyVersion).toBe(EXAM_PARTNER_POLICY_VERSION);
    expect(session.scenario.id).toBe("car-free-sundays");
    expect(session.scenario.practiceFocus).toBe("telc-deutsch-b2");
    expect(session.persona.id).toBe("slow-supportive");
    expect(session.pace.rate).toBe(1.0);
    expect(session.paceOverridden).toBe(true);
    expect(session.alignmentBasis).toBe(EXAM_PARTNER_ALIGNMENT_BASIS);
    expect(session.boundaryAr).toBe(EXAM_PARTNER_BOUNDARY_AR);
    expect(session.turns.length).toBeLessThanOrEqual(EXAM_PARTNER_MAX_TURNS);
    const auto = buildExamPartnerSession("car-free-sundays", "slow-supportive");
    expect(auto.paceOverridden).toBe(false);
    expect(auto.pace.id).toBe("slow");
  });

  it("caps the turn list, refuses unknown inputs and never guesses silently", () => {
    expect(buildExamPartnerSession("school-phone-ban", "steady-constructive").turns).toHaveLength(4);
    expect(buildExamPartnerSession("school-phone-ban", "steady-constructive", undefined, 2).turns).toHaveLength(2);
    expect(buildExamPartnerSession("school-phone-ban", "steady-constructive", undefined, 99).turns).toHaveLength(4);
    expect(() => buildExamPartnerSession("nope", "steady-constructive")).toThrow(/سيناريو شريك غير معروف/);
    expect(() => buildExamPartnerSession("school-phone-ban", "nope")).toThrow(/شخصية غير معروفة/);
    expect(() => buildExamPartnerSession("school-phone-ban", "steady-constructive", undefined, 0)).toThrow(/سقف الجمل/);
  });

  it("keeps the three declared practice foci and states the unofficial basis on each scenario", () => {
    expect(EXAM_PARTNER_SCENARIOS.map((scenario) => scenario.practiceFocus)).toEqual([
      "goethe-b2",
      "telc-deutsch-b2",
      "discussion-generic",
    ]);
    for (const scenario of EXAM_PARTNER_SCENARIOS) expect(scenario.alignmentBasis).toBe("unofficial-paraphrase-of-own-discussion-goal");
    expect(core).toContain("لا يُنسب أي نص إلى مهمة رسمية");
  });

  it("claims nothing about real partners, speech recognition, scoring or level gates", () => {
    expect(EXAM_PARTNER_EVIDENCE_BOUNDARY).toContain("no-stt");
    expect(EXAM_PARTNER_EVIDENCE_BOUNDARY).toContain("no-scoring");
    expect(EXAM_PARTNER_BOUNDARY_AR).toContain("لا يفهم كلامك");
    expect(EXAM_PARTNER_BOUNDARY_AR).toContain("ليس شريك الامتحان الرسمي");
    expect(core).not.toMatch(/\.mastery\b|masteryDelta|masteryEvidence|completedLessonIds|examSessions|dueReviews|mastery:/);
    expect(core).not.toMatch(/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator\./);
    expect(panel).not.toMatch(/\bfetch\(|indexedDB/);
  });

  it("plays partner lines only through the learner's own browser voice and keeps the transcript optional", () => {
    expect(panel).toContain("applySpeechPreferences");
    expect(panel).toContain('utterance.lang = "de-DE"');
    expect(panel).toContain("utterance.rate = session.pace.rate");
    expect(panel).toContain('window.speechSynthesis?.cancel()');
    expect(panel).toContain("speechSynthesis");
    expect(panel).toContain("صوت الجهاز الألماني غير متاح هنا");
  });

  it("renders the promised markers, the role cue and the honest boundaries in the panel", () => {
    for (const marker of [
      "data-exam-partner-policy",
      "data-exam-partner-scenario",
      "data-exam-partner-persona",
      "data-exam-partner-pace",
      "data-exam-partner-rate",
      "data-exam-partner-turn-count",
      "data-exam-partner-personas",
      "data-exam-partner-your-turn",
      "data-exam-partner-play",
      "data-exam-partner-next",
      "data-exam-partner-reset",
      "data-exam-partner-no-effect",
      "data-exam-partner-honest-note",
      "data-exam-partner-status",
    ])
      expect(panel).toContain(marker);
    expect(panel).toContain("لا يسمعك ولا يفهمك ولا يردّ على ما تقول");
    expect(panel).toContain("EXAM_PARTNER_BOUNDARY_AR");
    expect(hub).toContain("<ExamPartnerPanel />");
    expect(hub.indexOf("<ExamPartnerPanel />")).toBeLessThan(hub.indexOf('<section className="exam-gate">'));
  });

  it("uses the existing persona data only — no invented speeds, no hidden defaults", () => {
    const persona = examPartnerPersonaById("clarifying-detailer");
    expect(persona?.defaultPace).toBe("steady");
    expect(persona?.characterAr).toContain("المثال");
    expect(core).not.toMatch(/Math\.random|new Date\(/);
    expect(EXAM_PARTNER_SCENARIOS[0].turns["clarifying-detailer"][0].partnerLineDe).toBe("Was genau stört dich am Handy im Unterricht?");
  });
});
