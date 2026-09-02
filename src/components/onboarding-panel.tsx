"use client";

import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Check, Clock3, GraduationCap, Headphones, Home, Mic2, Plane, Route, ShieldCheck, SkipForward } from "lucide-react";
import { useLearning } from "./learning-provider";
import type { ArabicSupportMode, DeviceCapabilityStatus, DeviceReadiness, ExamProvider, LearnerGoal, LearnerProfile } from "@/types/learning";

const goalOptions: Array<{ id: LearnerGoal; label: string; detail: string; icon: typeof GraduationCap }> = [
  { id: "exam", label: "النجاح في B2", detail: "أولوية لصيغة الامتحان وإدارة الوقت", icon: GraduationCap },
  { id: "work", label: "العمل", detail: "مراسلات واجتماعات ومواقف مهنية", icon: BriefcaseBusiness },
  { id: "study", label: "الدراسة", detail: "محاضرات وعروض وكتابة أكاديمية عملية", icon: GraduationCap },
  { id: "daily-life", label: "الحياة اليومية", detail: "السكن والخدمات والمواعيد والتواصل", icon: Home },
  { id: "settlement", label: "الاستقرار والسفر", detail: "إدارة وتنقل واندماج دون استشارة قانونية", icon: Plane },
];

const readinessLabels: Record<DeviceCapabilityStatus, string> = {
  unchecked: "لم يُفحص",
  ready: "جاهز",
  unavailable: "غير متاح",
  "permission-denied": "الإذن مرفوض",
  skipped: "تم التخطي",
};

export function OnboardingPanel() {
  const { update } = useLearning();
  const [name, setName] = useState("");
  const [exam, setExam] = useState<ExamProvider>("goethe-b2");
  const [minutes, setMinutes] = useState<LearnerProfile["dailyMinutes"]>(45);
  const [targetDate, setTargetDate] = useState("");
  const [arabicSupport, setArabicSupport] = useState<ArabicSupportMode>("modern-standard-arabic");
  const [goals, setGoals] = useState<LearnerGoal[]>(["exam"]);
  const [deviceReadiness, setDeviceReadiness] = useState<DeviceReadiness>({ audio: "unchecked", microphone: "unchecked" });
  const [checkingDevices, setCheckingDevices] = useState(false);
  const [deviceMessage, setDeviceMessage] = useState("الفحص اختياري ويمكن تخطيه دون منع إنشاء الخطة.");

  function toggleGoal(goal: LearnerGoal) {
    setGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]);
  }

  async function checkDevices() {
    setCheckingDevices(true);
    const audio: DeviceCapabilityStatus = document.createElement("audio").canPlayType("audio/mpeg") ? "ready" : "unavailable";
    let microphone: DeviceCapabilityStatus = "unavailable";
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        microphone = "ready";
      }
    } catch (error) {
      microphone = error instanceof DOMException && error.name === "NotAllowedError" ? "permission-denied" : "unavailable";
    }
    const checkedAt = new Date().toISOString();
    setDeviceReadiness({ audio, microphone, checkedAt });
    setDeviceMessage(microphone === "ready"
      ? "ملفات MP3 والميكروفون متاحان. هذا فحص قدرة تقنية، وليس تقييمًا لجودة السماعات أو التسجيل."
      : "يمكن متابعة الدراسة والاستماع حتى دون الميكروفون؛ ستبقى مهام التسجيل اختيارية إلى أن يتاح الإذن.");
    setCheckingDevices(false);
  }

  function skipDeviceCheck() {
    setDeviceReadiness({ audio: "skipped", microphone: "skipped", checkedAt: new Date().toISOString() });
    setDeviceMessage("تم تخطي فحص الجهاز. يمكنك منح إذن الميكروفون لاحقًا عند فتح مهمة تسجيل دون فقدان التقدم.");
  }

  function start() {
    if (!name.trim() || goals.length === 0) return;
    update((state) => ({ ...state, profile: {
      name: name.trim(), targetExam: exam, targetDate: targetDate || undefined,
      dailyMinutes: minutes, arabicSupport, currentLevel: "A1", goals, deviceReadiness,
      createdAt: new Date().toISOString(),
    }}));
  }

  return (
    <section className="onboarding-card">
      <div className="onboarding-copy">
        <span className="eyebrow"><Route size={15} /> نقطة البداية</span>
        <h1>لن نعطيك قائمة دروس.<br/><em>سنرسم لك الطريق.</em></h1>
        <p>أخبرنا بهدفك ووقتك. سنبدأ بتشخيص قصير، ثم نبني مهمة يومية قابلة للقياس تتغير مع تقدمك.</p>
        <div className="trust-row"><span><ShieldCheck size={16}/> حفظ محلي</span><span><Clock3 size={16}/> خطة حسب وقتك</span><span><CalendarDays size={16}/> هدف امتحاني</span></div>
      </div>
      <div className="onboarding-form">
        <label>كيف نناديك؟<input value={name} onChange={(event) => setName(event.target.value)} placeholder="اكتب اسمك" autoFocus /></label>
        <label>الامتحان المستهدف<select value={exam} onChange={(event) => setExam(event.target.value as ExamProvider)}><option value="goethe-b2">Goethe-Zertifikat B2</option><option value="telc-deutsch-b2">telc Deutsch B2</option></select></label>
        <div className="form-row">
          <label>وقت الدراسة<select value={minutes} onChange={(event) => setMinutes(Number(event.target.value) as LearnerProfile["dailyMinutes"])}>{[10,20,30,45,60,90].map((value) => <option key={value} value={value}>{value} دقيقة</option>)}</select></label>
          <label>تاريخ الهدف<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
        </div>
        <label>الدعم العربي<select value={arabicSupport} onChange={(event) => setArabicSupport(event.target.value as ArabicSupportMode)}><option value="modern-standard-arabic">العربية الفصحى</option><option value="tunisian-supported">فصحى مع دعم تونسي</option><option value="minimal-arabic">عربي عند الحاجة فقط</option></select></label>

        <fieldset className="onboarding-goals">
          <legend>لماذا تتعلم الألمانية؟ <small>اختر هدفًا واحدًا على الأقل</small></legend>
          <div>{goalOptions.map((goal) => {
            const Icon = goal.icon;
            const selected = goals.includes(goal.id);
            return <button type="button" key={goal.id} aria-pressed={selected} className={selected ? "selected" : ""} onClick={() => toggleGoal(goal.id)}><Icon size={16}/><span><strong>{goal.label}</strong><small>{goal.detail}</small></span>{selected && <Check size={15}/>}</button>;
          })}</div>
          {goals.length === 0 && <p role="alert">اختر هدفًا واحدًا حتى يعرف المدرب سياق مهام الإنتاج.</p>}
        </fieldset>

        <section className="device-readiness" aria-label="فحص الصوت والميكروفون">
          <header><div><Headphones size={17}/><span><strong>جاهزية الصوت والتسجيل</strong><small>فحص اختياري قبل بدء الطريق</small></span></div><div><b>الصوت: {readinessLabels[deviceReadiness.audio]}</b><b>الميكروفون: {readinessLabels[deviceReadiness.microphone]}</b></div></header>
          <audio controls preload="metadata" src="/audio/library/lib-l-a1-01.mp3" aria-label="عينة فحص الصوت الألماني" />
          <div className="device-check-actions"><button type="button" onClick={() => void checkDevices()} disabled={checkingDevices}><Mic2 size={15}/>{checkingDevices ? "جارٍ الفحص…" : "افحص الجهاز"}</button><button type="button" onClick={skipDeviceCheck}><SkipForward size={15}/> تخطَّ الفحص</button></div>
          <p>{deviceMessage}</p>
        </section>

        <button className="primary-button" onClick={start} disabled={!name.trim() || goals.length === 0}>أنشئ خطتي الأولى <ArrowLeft size={18}/></button>
        <small>لا نحتاج حسابًا. تُحفظ أهدافك ونتيجة فحص الجهاز محليًا، ويمكنك تصديرها أو حذفها متى شئت.</small>
      </div>
    </section>
  );
}
