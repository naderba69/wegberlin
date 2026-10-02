"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BotOff, CheckCircle2, ChevronLeft, CircleHelp, GitBranch, Headphones, Lightbulb, MessageCircleMore, RefreshCcw, Route, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import type { CEFRLevel } from "@/types/learning";
import { BRANCHING_CONVERSATION_BOUNDARY, BRANCHING_CONVERSATION_POLICY, branchNode, branchingScenariosForLevel, type BranchChoice } from "@/data/branching-conversations";
import { chooseConversationBranch, createBranchingConversationAttempt, type BranchingConversationMode, type BranchingTurn } from "@/core/speaking/branching-conversation";
import { applySpeechPreferences } from "@/core/audio/speech-preferences";
import { useLearning } from "./learning-provider";

const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2"];
const qualityLabels: Record<BranchChoice["quality"], { title: string; detail: string }> = {
  effective: { title: "يخدم الهدف الآن", detail: "نقل المعلومة المطلوبة وفتح الخطوة التالية." },
  repairable: { title: "مفهوم لكنه ناقص", detail: "يمكن إصلاحه بإضافة معلومة أو إجراء محدد." },
  misaligned: { title: "لا يخدم هدف الموقف", detail: "الرد قد يكون جملة ممكنة، لكنه لا يجيب عن هذه اللحظة." },
};
const outcomeLabels = {
  "goal-reached": { ar: "تحقق الهدف التواصلي", icon: CheckCircle2 },
  partial: { ar: "تحقق جزء من الهدف", icon: Route },
  "restart-recommended": { ar: "الأفضل إعادة المسار", icon: RefreshCcw },
} as const;

export function BranchingConversationLab() {
  const { state, update } = useLearning();
  const router=useRouter();
  const [level, setLevel] = useState<CEFRLevel>(() => state.profile?.currentLevel ?? "A1");
  const scenarios = useMemo(() => branchingScenariosForLevel(level), [level]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = scenarios[scenarioIndex] ?? scenarios[0];
  const [mode, setMode] = useState<BranchingConversationMode>("guided");
  const [nodeId, setNodeId] = useState(scenario.openingNodeId);
  const [turns, setTurns] = useState<BranchingTurn[]>([]);
  const [lastChoice, setLastChoice] = useState<BranchChoice | null>(null);
  const [supportedNodes, setSupportedNodes] = useState<Set<string>>(new Set());
  const [speechStatus, setSpeechStatus] = useState("");
  const resultRef = useRef<HTMLHeadingElement>(null);
  const currentNode = branchNode(scenario, nodeId);
  const attempts = state.branchingConversationAttempts.filter((attempt) => attempt.scenarioId === scenario.id);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => { if (currentNode.outcome) resultRef.current?.focus(); }, [currentNode.outcome]);

  function reset(nextLevel = level, nextScenarioIndex = scenarioIndex, nextMode = mode) {
    window.speechSynthesis?.cancel();
    const nextScenario = branchingScenariosForLevel(nextLevel)[nextScenarioIndex] ?? branchingScenariosForLevel(nextLevel)[0];
    setLevel(nextLevel);
    setScenarioIndex(nextScenarioIndex);
    setMode(nextMode);
    setNodeId(nextScenario.openingNodeId);
    setTurns([]);
    setLastChoice(null);
    setSupportedNodes(new Set());
    setSpeechStatus("");
  }

  function advanceScenario(){
    if(scenarioIndex<scenarios.length-1){reset(level,scenarioIndex+1,mode);return}
    const nextLevel=levels[levels.indexOf(level)+1];
    if(nextLevel){reset(nextLevel,0,mode);return}
    router.push("/practice");
  }
  const advanceScenarioLabel=scenarioIndex<scenarios.length-1?"السيناريو التالي":level!=="B2"?`ابدأ ${levels[levels.indexOf(level)+1]}`:"إنهاء والعودة إلى المختبرات";

  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setSpeechStatus("صوت المتصفح الألماني غير متاح على هذا الجهاز."); return; }
    window.speechSynthesis.cancel();
    const utterance = applySpeechPreferences(new SpeechSynthesisUtterance(text), state.speechPreferences, window.speechSynthesis.getVoices());
    utterance.lang = "de-DE";
    utterance.rate = level === "A1" ? 0.78 : level === "A2" ? 0.84 : 0.9;
    utterance.onstart = () => setSpeechStatus("يتم تشغيل دور الشريك الاصطناعي…");
    utterance.onend = () => setSpeechStatus("انتهى التشغيل. اختر الرد الذي يحقق هدف هذه اللحظة.");
    utterance.onerror = () => setSpeechStatus("تعذر تشغيل صوت الجهاز؛ النص الألماني باقٍ ظاهرًا.");
    window.speechSynthesis.speak(utterance);
  }

  function showSupport() {
    setSupportedNodes((current) => {
      if (current.has(nodeId)) return current;
      return new Set([...current, nodeId]);
    });
  }

  function choose(choiceId: string) {
    const selected = chooseConversationBranch(scenario, nodeId, choiceId);
    const nextTurns = [...turns, selected.turn];
    const nextNode = branchNode(scenario, selected.nextNodeId);
    setTurns(nextTurns);
    setLastChoice(selected.choice);
    setNodeId(selected.nextNodeId);
    setSpeechStatus("");
    if (nextNode.outcome) {
      const attempt = createBranchingConversationAttempt({ scenario, mode, turns: nextTurns, supportOpenCount: supportedNodes.size });
      update((current) => ({ ...current, branchingConversationAttempts: [...current.branchingConversationAttempts, attempt] }));
    }
  }

  return <div className="wide-page branching-page" data-branching-conversation-policy={BRANCHING_CONVERSATION_POLICY} data-evidence-boundary={BRANCHING_CONVERSATION_BOUNDARY}>
    <header className="branching-hero">
      <div>
        <span className="eyebrow"><GitBranch size={15}/> محادثة متفرعة دون AI</span>
        <h1><span lang="de" dir="ltr">Gesprächswege</span><em>تدرّب على القرار، لا حفظ الحوار</em></h1>
        <p>كل رد يغيّر رد الشريك والخطوة التالية. افهم هدف اللحظة، اختر، اقرأ الأثر، ثم أصلح المسار أو أكمله.</p>
      </div>
      <aside><BotOff size={23}/><div><strong>8 سيناريوهات أصلية</strong><small>شجرتان لكل مستوى · تعملان بمحرك محلي حتمي</small></div><div><strong>ليست محادثة حية</strong><small>لا شخص حقيقي ولا AI يتظاهر بفهم كلامك</small></div></aside>
    </header>

    <section className="branching-setup" aria-labelledby="branching-setup-title">
      <header><div><small lang="de" dir="ltr">Niveau und Lernmodus</small><h2 id="branching-setup-title">اضبط الحمل قبل بدء الموقف</h2></div><span>{state.branchingConversationAttempts.length} محاولات محفوظة</span></header>
      <div className="branching-levels" role="group" aria-label="مستوى سيناريو المحادثة">{levels.map((candidate) => <button key={candidate} type="button" className={candidate === level ? "active" : ""} aria-pressed={candidate === level} onClick={() => reset(candidate, 0, mode)}><b>{candidate}</b><small>{candidate === "A1" ? "طلب وتعريف" : candidate === "A2" ? "موعد ومشكلة" : candidate === "B1" ? "تعاون وتغذية راجعة" : "تفاوض وحجة"}</small></button>)}</div>
      <div className="branching-modes" role="group" aria-label="طريقة عرض دعم المحادثة">
        <button type="button" className={mode === "guided" ? "active" : ""} aria-pressed={mode === "guided"} onClick={() => reset(level, scenarioIndex, "guided")}><Lightbulb size={17}/><span><b>موجّه</b><small>ترى مقصد كل رد بالعربية قبل الاختيار</small></span></button>
        <button type="button" className={mode === "challenge" ? "active" : ""} aria-pressed={mode === "challenge"} onClick={() => reset(level, scenarioIndex, "challenge")}><Sparkles size={17}/><span><b>تحدٍ</b><small>تختار من الألمانية أولًا ثم ترى التفسير</small></span></button>
      </div>
    </section>

    <nav className="branching-scenario-tabs" aria-label={`سيناريوهات ${level}`}>{scenarios.map((candidate, index) => <button key={candidate.id} type="button" aria-current={index === scenarioIndex ? "page" : undefined} className={index === scenarioIndex ? "active" : ""} onClick={() => reset(level, index, mode)}><span>{index + 1}</span><div><small lang="de" dir="ltr">{candidate.titleDe}</small><strong>{candidate.titleAr}</strong></div><ChevronLeft size={17}/></button>)}</nav>

    <section className="branching-workspace">
      <aside className="branching-mission">
        <header><span><Route size={20}/></span><div><small lang="de" dir="ltr">Ihre Rolle</small><strong>{scenario.learnerRoleAr}</strong><p lang="de" dir="ltr">{scenario.learnerRoleDe}</p></div></header>
        <article><small lang="de" dir="ltr">Kommunikatives Ziel</small><h2>{scenario.goalAr}</h2><p lang="de" dir="ltr">{scenario.goalDe}</p></article>
        <p>{scenario.contextAr}</p>
        <ol aria-label="تقدم أدوار المحادثة"><li className={turns.length >= 1 ? "done" : "active"}><span>{turns.length >= 1 ? <CheckCircle2 size={13}/> : 1}</span><small>افهم الرد الأول</small></li><li className={turns.length >= 2 ? "done" : turns.length === 1 ? "active" : "locked"}><span>{turns.length >= 2 ? <CheckCircle2 size={13}/> : 2}</span><small>أكمل أو أصلح</small></li><li className={currentNode.outcome ? "done" : "locked"}><span>{currentNode.outcome ? <CheckCircle2 size={13}/> : 3}</span><small>انقل المهارة</small></li></ol>
        <footer><ShieldCheck size={15}/> الاختيار المنظم تدريب تواصلي، لا درجة كلام أو CEFR.</footer>
      </aside>

      <section className="branching-stage">
        <header><div><small>{level} · {mode === "guided" ? "وضع موجّه" : "وضع تحدٍ"}</small><h2>{scenario.titleAr}</h2></div><span>الدور {Math.min(turns.length + 1, 2)} من 2</span></header>

        {turns.length > 0 && <section className="branching-transcript" aria-label="المحادثة حتى الآن">{turns.map((turn, index) => {
          const pastNode = branchNode(scenario, turn.nodeId);
          const choice = pastNode.choices?.find((candidate) => candidate.id === turn.choiceId);
          if (!choice) return null;
          return <div key={choice.id}><article className="partner"><small lang="de" dir="ltr">{pastNode.speakerDe}</small><p lang="de" dir="ltr">{pastNode.utteranceDe}</p></article><article className="learner"><small>أنت</small><p lang="de" dir="ltr">{choice.responseDe}</p><span>{index + 1}</span></article></div>;
        })}</section>}

        {lastChoice && !currentNode.outcome && <aside className={`branching-feedback ${lastChoice.quality}`} role="status"><span>{lastChoice.quality === "effective" ? <CheckCircle2 size={19}/> : <Lightbulb size={19}/>}</span><div><small>{qualityLabels[lastChoice.quality].title}</small><strong>{lastChoice.feedbackAr}</strong><p><b>الإصلاح:</b> {lastChoice.repairTipAr}</p></div></aside>}

        {!currentNode.outcome ? <section className="branching-current-turn" aria-labelledby="branching-current-speaker">
          <div className="branching-partner-bubble"><header><span><MessageCircleMore size={19}/></span><div><small lang="de" dir="ltr">Gesprächspartner</small><strong id="branching-current-speaker" lang="de" dir="ltr">{currentNode.speakerDe}</strong></div><button type="button" onClick={() => speak(currentNode.utteranceDe)} aria-label="استمع إلى دور الشريك الاصطناعي"><Volume2 size={17}/><span lang="de" dir="ltr">Anhören</span></button></header><p lang="de" dir="ltr">{currentNode.utteranceDe}</p></div>
          <p className="branching-speech-status" role="status">{speechStatus || "يمكنك قراءة الدور أو تشغيل TTS اصطناعي من جهازك. ليس صوت شخص حي أو امتحان."}</p>
          <div className="branching-support-row"><button type="button" aria-expanded={supportedNodes.has(nodeId)} onClick={showSupport}><CircleHelp size={16}/> ما الذي أحتاج إلى نقله الآن؟</button>{supportedNodes.has(nodeId) && <p>{currentNode.supportAr}</p>}</div>
          <fieldset className="branching-choices"><legend><span lang="de" dir="ltr">Wie reagieren Sie?</span><small>اختر الرد الذي يخدم هدف هذه اللحظة</small></legend>{currentNode.choices?.map((choice, index) => <button key={choice.id} type="button" onClick={() => choose(choice.id)}><span>{String.fromCharCode(65 + index)}</span><div><strong lang="de" dir="ltr">{choice.responseDe}</strong>{mode === "guided" && <small>{choice.intentionAr}</small>}</div><ArrowLeft size={17}/></button>)}</fieldset>
        </section> : <section className={`branching-outcome ${currentNode.outcome}`} aria-labelledby="branching-outcome-title">
          {(() => { const display = outcomeLabels[currentNode.outcome!]; const Icon = display.icon; return <><header><span><Icon size={24}/></span><div><small lang="de" dir="ltr">{currentNode.outcomeTitleDe}</small><h2 id="branching-outcome-title" ref={resultRef} tabIndex={-1}>{display.ar}</h2><strong>{currentNode.outcomeTitleAr}</strong></div></header><p lang="de" dir="ltr">{currentNode.utteranceDe}</p><article><small>ماذا حدث؟</small><p>{currentNode.outcomeSummaryAr}</p></article><article className="transfer"><small lang="de" dir="ltr">Transfer ohne Auswahl</small><strong>انقل المهارة خارج الشجرة</strong><p lang="de" dir="ltr">{currentNode.transferPromptDe}</p></article><footer><button type="button" className="secondary-button" onClick={() => reset(level, scenarioIndex, mode)}><RefreshCcw size={16}/> أعد السيناريو</button><button type="button" className="primary-button" onClick={advanceScenario}>{advanceScenarioLabel} <ArrowLeft size={16}/></button></footer></>; })()}
        </section>}
      </section>

      <aside className="branching-evidence">
        <section><Headphones size={18}/><div><strong>ماذا يتغير مع اختيارك؟</strong><p>رد الشريك والعاقبة التالية فقط؛ لا يولّد النظام نصًا ولا يحلل صوتًا.</p></div></section>
        <section><GitBranch size={18}/><div><strong>{attempts.length} محاولات لهذا السيناريو</strong><p>{attempts.some((attempt) => attempt.outcome === "goal-reached") ? "وصلت إلى الهدف سابقًا؛ جرّب فرعًا آخر لفهم أثر القرار." : "لا نجاح أو عقوبة مخفية؛ النتيجة تصف هذا المسار فقط."}</p></div></section>
        <footer>نحفظ معرفات الخيارات والنتيجة وعدد فتحات الدعم فقط. لا نص حر، لا شبكة، لا AI، لا شريك حي، ولا mastery.</footer>
      </aside>
    </section>
  </div>;
}
