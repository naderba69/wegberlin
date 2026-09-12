"use client";

import { useId, useState } from "react";
import { Check, Ear, Info, RefreshCcw, Volume2, X } from "lucide-react";
import type { FullLesson } from "@/types/lesson-content";
import type { PronunciationContrastAttempt } from "@/types/learning";
import { ARTICULATION_CONTRAST_POLICY, getArticulationGuide, type ArticulationZone, type PronunciationContrastPair } from "@/core/pronunciation/articulation";

const zonePoint: Record<ArticulationZone, { x: number; y: number }> = {
  lips: { x: 221, y: 104 },
  "lip-teeth": { x: 210, y: 94 },
  ridge: { x: 176, y: 67 },
  palate: { x: 141, y: 62 },
  "vowel-space": { x: 137, y: 94 },
  throat: { x: 77, y: 116 },
  rhythm: { x: 112, y: 137 },
};

function ArticulationDiagram({ zone, titleAr, altAr }: { zone: ArticulationZone; titleAr: string; altAr: string }) {
  const id = useId().replace(/:/g, "");
  const active = zonePoint[zone];
  return <svg className="articulation-diagram" viewBox="0 0 270 180" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>{titleAr}</title><desc id={`${id}-desc`}>{altAr}</desc>
    <defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z"/></marker></defs>
    <path className="head-outline" d="M36 26 C78 8 155 12 197 36 C216 47 230 65 232 82 C234 94 229 103 218 109 C204 117 193 129 185 145 C175 164 151 171 119 166 C78 160 49 142 38 112 C29 88 25 50 36 26Z"/>
    <path className="nasal" d="M91 51 C125 39 162 42 193 58"/>
    <path className="palate" d="M96 74 C128 57 166 56 197 73"/>
    <path className="tongue" d="M91 124 C111 101 139 91 174 99 C185 102 193 108 200 115 C170 119 145 129 119 137 C105 140 95 135 91 124Z"/>
    <path className="teeth" d="M198 76 L210 84 L199 91 M199 92 L211 99 L199 105"/>
    <path className="lips" d="M211 89 Q230 96 211 105 Q225 97 211 89Z"/>
    <path className="airflow" d="M72 120 C105 117 132 106 160 98 C182 92 202 95 221 98" markerEnd={`url(#${id}-arrow)`}/>
    {zone === "rhythm" && <path className="rhythm-wave" d="M63 145 Q76 125 89 145 T115 145 T141 145 T167 145"/>}
    <circle className="active-zone-halo" cx={active.x} cy={active.y} r="17"/><circle className="active-zone" cx={active.x} cy={active.y} r="6"/>
    <text x="16" y="174">vereinfachte Lernskizze · رسم تعليمي مبسط</text>
  </svg>;
}

function pairKindLabel(pair: PronunciationContrastPair) {
  return pair.kind === "minimal-pair" ? "Minimalpaar · زوج أدنى"
    : pair.kind === "meaningful-prosody-contrast" ? "Bedeutung durch Melodie · فرق معنى بالنغمة"
      : "Lautkontrast · فرق صوتي ذو معنى";
}

export function PronunciationArticulationLab({ lesson, attempts, onSpeak, onAttempt }: {
  lesson: FullLesson;
  attempts: PronunciationContrastAttempt[];
  onSpeak: (text: string, rate?: number) => void;
  onAttempt: (pairId: string, targetSide: "left" | "right", selectedSide: "left" | "right") => void;
}) {
  const guide = getArticulationGuide(lesson);
  const lessonAttempts = attempts.filter((attempt) => attempt.lessonId === lesson.id);
  const [challenge, setChallenge] = useState<{ pairId: string; targetSide: "left" | "right" } | null>(null);
  const [result, setResult] = useState<{ pairId: string; correct: boolean } | null>(null);

  function startChallenge(pair: PronunciationContrastPair) {
    const pairAttempts = lessonAttempts.filter((attempt) => attempt.pairId === pair.id);
    const targetSide: "left" | "right" = pairAttempts.some((attempt) => attempt.targetSide === "left") ? "right" : "left";
    setChallenge({ pairId: pair.id, targetSide });
    setResult(null);
    onSpeak(pair[targetSide].de, .72);
  }

  function answerChallenge(pair: PronunciationContrastPair, selectedSide: "left" | "right") {
    if (!challenge || challenge.pairId !== pair.id) return;
    const correct = challenge.targetSide === selectedSide;
    onAttempt(pair.id, challenge.targetSide, selectedSide);
    setResult({ pairId: pair.id, correct });
  }

  return <section className="pronunciation-lab" data-pronunciation-policy={ARTICULATION_CONTRAST_POLICY}>
    <div className="articulation-guide">
      <div><small lang="de" dir="ltr">{guide.titleDe}</small><h3>{guide.titleAr}</h3><p>الرسم يشرح اتجاه الحركة فقط؛ ليس تصويرًا طبيًا ولا تحليلًا لتسجيلك.</p></div>
      <div className="articulation-layout">
        <ArticulationDiagram zone={guide.zone} titleAr={guide.titleAr} altAr={guide.diagramAltAr}/>
        <dl>
          <div><dt>الشفتان والفم</dt><dd>{guide.mouthAr}</dd></div>
          <div><dt>اللسان</dt><dd>{guide.tongueAr}</dd></div>
          <div><dt>الهواء/الصوت</dt><dd>{guide.airflowAr}</dd></div>
        </dl>
      </div>
    </div>

    <div className="minimal-pair-heading"><div><small lang="de" dir="ltr">Hören und unterscheiden</small><h3>ميّز الفرق قبل التقليد</h3></div><span><Ear size={16}/> {lessonAttempts.length}/4 عينات محفوظة محليًا</span></div>
    <div className="minimal-pair-grid">
      {guide.pairs.map((pair) => {
        const active = challenge?.pairId === pair.id;
        const pairResult = result?.pairId === pair.id ? result : null;
        return <article key={pair.id} data-minimal-pair={pair.id}>
          <header><span>{pairKindLabel(pair)}</span><code dir="ltr" data-bidi-scope="technical">{pair.target}</code></header>
          <div className="minimal-pair-words">
            {(["left", "right"] as const).map((side) => <button key={side} onClick={() => onSpeak(pair[side].de, .72)}><Volume2 size={15}/><span><b lang="de" dir="ltr">{pair[side].de}</b><code dir="ltr" data-bidi-scope="technical">{pair[side].ipa}</code><small>{pair[side].ar}</small></span></button>)}
          </div>
          <p>{pair.noteAr}</p>
          {!active ? <button className="contrast-start" onClick={() => startChallenge(pair)}><Ear size={15}/> Hörprobe starten · ابدأ عينة مخفية</button> : <div className="contrast-challenge">
            <div><b lang="de" dir="ltr">Welches Wort haben Sie gehört?</b><small>أي كلمة شغّلها الصوت الاصطناعي؟</small><button aria-label="إعادة عينة الزوج" onClick={() => onSpeak(pair[challenge.targetSide].de, .72)}><RefreshCcw size={14}/> إعادة</button></div>
            <div>{(["left", "right"] as const).map((side) => <button key={side} disabled={Boolean(pairResult)} onClick={() => answerChallenge(pair, side)}><b lang="de" dir="ltr">{pair[side].de}</b><small>{pair[side].ar}</small></button>)}</div>
            {pairResult && <aside className={pairResult.correct ? "correct" : "retry"}>{pairResult.correct ? <Check size={15}/> : <X size={15}/>}<span>{pairResult.correct ? "طابقت الكلمة التي شغّلها TTS. جرّب الآن تقليدها بنفسك." : "هذه ليست الكلمة المشغّلة. أعد السماع وراقب الموضع المرسوم."}</span></aside>}
          </div>}
        </article>;
      })}
    </div>
    <div className="pronunciation-boundary"><Info size={16}/><p>النتيجة تقيس مطابقة اختيارك لعينة Browser TTS الاصطناعية فقط. لا تستمع المنصة إلى نطقك، ولا تمنح درجة نطق أو طلاقة أو CEFR، ولا تغيّر إتقان الدرس.</p></div>
  </section>;
}
