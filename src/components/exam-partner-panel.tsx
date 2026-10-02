"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, Play, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import {
  EXAM_PARTNER_BOUNDARY_AR,
  EXAM_PARTNER_PACES,
  EXAM_PARTNER_PERSONAS,
  EXAM_PARTNER_POLICY_VERSION,
  EXAM_PARTNER_SCENARIOS,
  EXAM_PARTNER_TURN_TOTAL,
  buildExamPartnerSession,
  type ExamPartnerPaceId,
} from "@/core/speaking/exam-partner-simulation";
import { useLearning } from "./learning-provider";

export function ExamPartnerPanel() {
  const { state } = useLearning();
  const [scenarioId, setScenarioId] = useState(EXAM_PARTNER_SCENARIOS[0].id);
  const [personaId, setPersonaId] = useState(EXAM_PARTNER_PERSONAS[0].id);
  const [paceOverride, setPaceOverride] = useState<ExamPartnerPaceId | "auto">("auto");
  const [turnIndex, setTurnIndex] = useState(0);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const statusRef = useRef<HTMLParagraphElement | null>(null);

  const session = useMemo(
    () => buildExamPartnerSession(scenarioId, personaId, paceOverride === "auto" ? undefined : paceOverride),
    [scenarioId, personaId, paceOverride],
  );
  const turn = session.turns[Math.min(turnIndex, session.turns.length - 1)];

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak() {
    setTranscriptVisible(true);
    if (!("speechSynthesis" in window)) {
      setSpeechStatus("صوت الجهاز الألماني غير متاح هنا؛ اقرأ جملة الشريك بصوتك ثم أنجز دورك.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = applySpeechPreferences(
      new SpeechSynthesisUtterance(turn.partnerLineDe),
      state.speechPreferences,
      window.speechSynthesis.getVoices(),
    );
    utterance.lang = "de-DE";
    utterance.rate = session.pace.rate;
    utterance.onstart = () => setSpeechStatus(`الشريك المُحاكى يقرأ بسرعة ${session.pace.labelAr}.`);
    utterance.onend = () => setSpeechStatus("انتهى دور الشريك. أنجز دورك ثم انتقل إلى الجملة التالية.");
    utterance.onerror = () => setSpeechStatus("تعذر تشغيل صوت الجهاز؛ الجملة الألمانية باقية ظاهرة.");
    setSpeechStatus("يُشغَّل صوت الجهاز الألماني بمعدّل السرعة المختار…");
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section
      className="exam-partner-simulation"
      data-exam-partner-policy={EXAM_PARTNER_POLICY_VERSION}
      data-exam-partner-scenario={session.scenario.id}
      data-exam-partner-persona={session.persona.id}
      data-exam-partner-pace={session.pace.id}
      data-exam-partner-rate={session.pace.rate}
      data-exam-partner-pace-overridden={session.paceOverridden ? "true" : "false"}
      data-exam-partner-turn-count={session.turns.length}
      data-exam-partner-bank={EXAM_PARTNER_TURN_TOTAL}
    >
      <header>
        <UserRound size={18} />
        <div>
          <strong>محاكاة شريك الامتحان — بسرعات وشخصيات</strong>
          <small>
            {EXAM_PARTNER_SCENARIOS.length} سيناريوهات × {EXAM_PARTNER_PERSONAS.length} شخصيات · {EXAM_PARTNER_TURN_TOTAL} جملة مؤلَّفة ·
            سقف {session.turns.length} جمل للجلسة
          </small>
        </div>
      </header>

      <div className="exam-partner-picker" data-exam-partner-scenarios="true">
        {EXAM_PARTNER_SCENARIOS.map((scenario) => (
          <button key={scenario.id} type="button" className={scenario.id === scenarioId ? "active" : ""} onClick={() => { setScenarioId(scenario.id); setTurnIndex(0); setTranscriptVisible(false); setSpeechStatus(""); }}>
            {scenario.titleAr}
          </button>
        ))}
      </div>

      <article className="exam-partner-brief">
        <h3 lang="de" dir="ltr">{session.scenario.titleDe}</h3>
        <p>{session.scenario.situationAr}</p>
        <small>جهة التدريب المرتبطة: {session.scenario.practiceFocus} · نسبة النص: تدريبٌ محلي بغرضٍ شبيه — لا يُنسب إلى مهمة رسمية.</small>
      </article>

      <div className="exam-partner-personas" data-exam-partner-personas="true">
        {EXAM_PARTNER_PERSONAS.map((persona) => (
          <button
            key={persona.id}
            type="button"
            className={persona.id === personaId ? "active" : ""}
            data-exam-partner-persona-option={persona.id}
            onClick={() => { setPersonaId(persona.id); setTurnIndex(0); setTranscriptVisible(false); setSpeechStatus(""); }}
          >
            <strong>{persona.labelAr}</strong>
            <small>{persona.characterAr}</small>
          </button>
        ))}
      </div>

      <label className="exam-partner-pace">
        سرعة الشريك
        <select value={paceOverride} onChange={(event) => { setPaceOverride(event.target.value as ExamPartnerPaceId | "auto"); setTurnIndex(0); setTranscriptVisible(false); setSpeechStatus(""); }} data-exam-partner-pace-select="true">
          <option value="auto">سرعة الشخصية ({session.persona.defaultPace})</option>
          {EXAM_PARTNER_PACES.map((pace) => (
            <option key={pace.id} value={pace.id}>
              {pace.labelAr}
            </option>
          ))}
        </select>
        <small>{session.persona.voiceHintAr}</small>
      </label>

      <div className="exam-partner-turn" data-exam-partner-turn={turnIndex + 1}>
        <small>الجملة {turnIndex + 1} من {session.turns.length}</small>
        <p lang="de" dir="ltr" data-exam-partner-partner-line="true">
          {turn.partnerLineDe}
        </p>
        {transcriptVisible && (
          <p className="exam-partner-transcript" data-exam-partner-transcript="true">
            النص ظاهر الآن للمتابعة؛ جرّب مرةً أخرى بلا نص لتدريب الأذن.
          </p>
        )}
        <div className="exam-partner-your-turn" data-exam-partner-your-turn="true">
          <strong>{turn.yourTurnAr}</strong>
          <small>هدف هذه الجملة: {turn.goalAr}</small>
        </div>
        {speechStatus && (
          <p role="status" ref={statusRef} data-exam-partner-status="true">
            {speechStatus}
          </p>
        )}
      </div>

      <div className="exam-partner-actions">
        <button type="button" className="primary-button" onClick={speak} data-exam-partner-play="true">
          <Play size={15} /> اسمع الشريك
        </button>
        <button
          type="button"
          onClick={() => {
            window.speechSynthesis?.cancel();
            setTurnIndex((current) => Math.min(current + 1, session.turns.length - 1));
            setSpeechStatus("");
            setTranscriptVisible(false);
          }}
          disabled={turnIndex >= session.turns.length - 1}
          data-exam-partner-next="true"
        >
          الجملة التالية
        </button>
        <button
          type="button"
          onClick={() => {
            window.speechSynthesis?.cancel();
            setTurnIndex(0);
            setSpeechStatus("");
            setTranscriptVisible(false);
          }}
          data-exam-partner-reset="true"
        >
          <RotateCcw size={14} /> من البداية
        </button>
      </div>

      <p className="exam-partner-no-effect" data-exam-partner-no-effect="true">
        لا تُمنح هنا درجة نطقٍ أو محادثة، ولا يُقاس فهم الشريك لكلامك: الشريك لا يسمعك ولا يفهمك ولا يردّ على ما تقول.
      </p>
      <p className="exam-partner-honest-note" data-exam-partner-honest-note="true">
        {EXAM_PARTNER_BOUNDARY_AR}
      </p>
      <p className="exam-partner-source-note">
        <ShieldCheck size={14} /> الجمل المؤلَّفة داخل المشروع: تمرينٌ على أخذ الدور والرد المنظّم.
        <CircleAlert size={13} /> ليست محاكاةً لشريك الامتحان الرسمي ولا وعدًا بنتيجة.
      </p>
    </section>
  );
}
