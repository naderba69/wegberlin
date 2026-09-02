"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, Lightbulb, Send, Settings, ShieldAlert, Sparkles, UserRound } from "lucide-react";
import { askTutor, isTutorConsentRequired, type TutorAnswer, type TutorContext } from "@/core/ai/client";
import { academicLessons } from "@/data/academic-lessons";
import { useLearning } from "./learning-provider";
import { AccessibleDialog } from "./accessible-dialog";

type Message = { role: "user"; text: string } | { role: "assistant"; text?: string; answer?: TutorAnswer };
const providerLabel = { disabled: "المرشد المحلي المدمج", gemini: "Gemini", openrouter: "OpenRouter Free-only", local: "Ollama المحلي" };

export function TutorView() {
  const { state, update } = useLearning();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "أنا مرشد الدرس. سأبدأ بتلميح، ثم شرح مرتبط بهدفك، وأنهي بتمرين صغير." }]);
  const [busy, setBusy] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const provider = state.aiSettings.provider;
  const lesson = academicLessons[state.currentLessonId];
  const activeErrors = state.errors.filter((error) => !error.resolved).slice(0, 3);
  const context: TutorContext = {
    lessonId: lesson?.id,
    level: lesson?.level,
    objectiveAr: lesson?.objectives[0]?.ar,
    objectiveDe: lesson?.objectives[0]?.de,
    errorSummaries: activeErrors.map((error) => ({ id: error.id, wrong: error.wrong, correct: error.correct, explanationAr: error.explanationAr })),
  };

  async function runSend(question: string, consentGranted: boolean) {
    setInput("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setBusy(true);
    try {
      const key = sessionStorage.getItem("dwnb-ai-key") ?? "";
      const answer = await askTutor({ provider, model: state.aiSettings.model, key }, question, { context, consentGranted });
      setMessages((current) => [...current, { role: "assistant", answer }]);
      const createdAt = new Date().toISOString();
      update((current) => ({
        ...current,
        tutorInteractions: [...current.tutorInteractions, {
          id: `tutor-${crypto.randomUUID()}`,
          question,
          answer: { hintAr: answer.hintAr, explanationAr: answer.explanationAr, examplesDe: answer.examplesDe, microExerciseAr: answer.microExerciseAr },
          provider: answer.provider,
          model: answer.model,
          promptVersion: answer.promptVersion,
          lessonId: lesson?.id,
          errorIds: activeErrors.map((error) => error.id),
          consent: isTutorConsentRequired(provider) ? "explicit" : "not-required",
          createdAt,
        }],
      }));
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error instanceof Error ? error.message : "حدث خطأ غير معروف." }]);
    } finally {
      setBusy(false);
    }
  }

  function send() {
    const question = input.trim();
    if (!question || busy) return;
    if (isTutorConsentRequired(provider)) {
      setPendingQuestion(question);
      return;
    }
    void runSend(question, false);
  }

  function confirmSend() {
    if (!pendingQuestion) return;
    const question = pendingQuestion;
    setPendingQuestion(null);
    void runSend(question, true);
  }

  return <div className="tutor-page">
    <header className="page-heading"><div><span className="eyebrow"><Bot size={15} /> مرشد مرتبط بالمنهج</span><h1>اسأل لتفهم، <em>لا لتنسخ الحل.</em></h1><p>كل جواب منظم: تلميح أولًا، ثم شرح وأمثلة وتمرين جديد. لا يُرسل شيء إلى مزود شبكي دون موافقة صريحة لكل سؤال.</p></div><div className="provider-badge"><span className={provider === "disabled" ? "offline" : "online"} /><div><strong>{providerLabel[provider]}</strong><small>{state.tutorInteractions.length} تفاعل محفوظ محليًا</small></div></div></header>

    <section className="tutor-context-strip" aria-label="سياق المرشد الحالي">
      <div><small>الدرس الحالي</small><strong>{lesson ? `${lesson.level} · ${lesson.titleAr}` : "لا يوجد درس محدد"}</strong></div>
      <div><small>الهدف الذي سيقيد الجواب</small><strong>{lesson?.objectives[0]?.ar ?? "شرح موثوق من المكتبة المحلية فقط"}</strong></div>
      <div><small>أخطاء نشطة مرفقة</small><strong>{activeErrors.length}/3</strong></div>
    </section>

    <div className="chat-shell"><div className="chat-stream" aria-live="polite" aria-relevant="additions">{messages.map((message, index) => <article key={index} className={message.role}><span>{message.role === "assistant" ? <Sparkles size={17} /> : <UserRound size={17} />}</span>{message.role === "assistant" && message.answer ? <div className="structured-tutor-answer"><section><small><Lightbulb size={13} /> التلميح أولًا</small><p>{message.answer.hintAr}</p></section><section><small><CheckCircle2 size={13} /> الشرح</small><p>{message.answer.explanationAr}</p></section><section><small>أمثلة ألمانية</small>{message.answer.examplesDe.map((example) => <code key={example} lang="de" dir="ltr">{example}</code>)}</section><section className="tutor-micro-exercise"><small>جرّب الآن</small><p>{message.answer.microExerciseAr}</p></section><footer>{providerLabel[message.answer.provider]} · {message.answer.model} · {message.answer.promptVersion}</footer></div> : <p>{message.text}</p>}</article>)}{busy && <article className="assistant"><span><Sparkles size={17} /></span><p>أتحقق من الجواب المنظم ضمن هدف الدرس…</p></article>}</div>
      <div className="suggestion-chips"><button onClick={() => setInput("ما الفرق بين Ich heiße و Ich bin؟")}>Ich heiße أم Ich bin؟</button><button onClick={() => setInput("لماذا يأتي الفعل في النهاية بعد weil؟")}>مكان الفعل بعد weil</button><button onClick={() => setInput("اشرح Dativ مع mit")}>Dativ مع mit</button></div>
      <div className="chat-input"><textarea aria-label="سؤال المرشد" maxLength={2000} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="اكتب سؤالك بالعربية أو الألمانية…" /><button aria-label="إرسال السؤال" onClick={send} disabled={!input.trim() || busy}><Send size={18} /></button></div>
      <footer><ShieldAlert size={15} /><span>{provider === "disabled" ? "لا يغادر السؤال جهازك، ولا تحتاج إلى مفتاح أو اتصال." : "قبل كل إرسال ستشاهد السؤال والوجهة وتوافق عليهما. لا ترسل بيانات شخصية."}</span><Link href="/settings"><Settings size={14} /> الإعدادات</Link></footer>
    </div>

    {pendingQuestion && <AccessibleDialog labelledBy="tutor-consent-title" describedBy="tutor-consent-description" className="tutor-consent-dialog" onClose={() => setPendingQuestion(null)}><span><ShieldAlert size={24} /></span><h2 id="tutor-consent-title">موافقة مطلوبة قبل إرسال النص</h2><p id="tutor-consent-description">سيُرسل السؤال التالي مع هدف الدرس الحالي وما يصل إلى ثلاثة أخطاء نشطة إلى <b>{providerLabel[provider]}</b>. لن يُرسل التسجيل الصوتي أو مفتاحك داخل المحتوى، لكن المزود يستقبل النص وفق شروطه.</p><blockquote>{pendingQuestion}</blockquote><div><button className="secondary-button" onClick={() => setPendingQuestion(null)}>إلغاء الإرسال</button><button className="primary-button" onClick={confirmSend}>أوافق وأرسل مرة واحدة</button></div></AccessibleDialog>}
  </div>;
}
