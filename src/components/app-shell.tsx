"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, LibraryBig, ChevronLeft, Clock3, Compass, FlaskConical, GraduationCap, LayoutGrid, LockKeyhole, LogOut, RotateCcw, Search, Settings, Sparkles, X } from "lucide-react";
import { Brand } from "./brand";
import { useLearning } from "./learning-provider";
import { continuousFocusSession, isContinuousSessionFocusActive } from "@/core/exams/continuous-session";
import { AccessibleDialog } from "./accessible-dialog";
import { isQuietHoursActive, shouldSuppressInAppReminder } from "@/core/coach/learning-agreement";
import { getCoachTarget } from "@/core/coach/coach";
import { globalStudyShortcut, GLOBAL_STUDY_SHORTCUT_POLICY_VERSION } from "@/core/accessibility/global-shortcuts";
import { ExamPrintTools } from "./exam-print-tools";
import { GermanCopyEnhancer } from "./german-copy-enhancer";
import { GermanCharacterDock } from "./german-character-dock";
import { ReviewReminderCoordinator } from "./review-reminder-coordinator";

const nav = [
  { href: "/today", label: "مهمتي اليوم", short: "اليوم", icon: Sparkles },
  { href: "/path", label: "مسار التعلّم", short: "المسار", icon: Compass },
  { href: "/review", label: "المراجعة الذكية", short: "مراجعة", icon: RotateCcw },
  { href: "/practice", label: "مختبرات المهارة", short: "تدريب", icon: FlaskConical },
  { href: "/library", label: "المكتبة الموسعة", short: "مكتبة", icon: LibraryBig },
  { href: "/search", label: "البحث الألماني–العربي", short: "بحث", icon: Search },
  { href: "/exams", label: "مركز الامتحان", short: "امتحان", icon: GraduationCap },
  { href: "/progress", label: "تقدّمي", short: "التقدم", icon: ChartNoAxesCombined },
  { href: "/settings", label: "الإعدادات", short: "الإعدادات", icon: Settings },
];
const learningNav=nav.filter((item)=>["/today","/path","/review","/practice","/progress"].includes(item.href));
const resourceNav=nav.filter((item)=>["/library","/search","/exams","/settings"].includes(item.href));
const mobilePrimary=nav.filter((item)=>["/today","/path","/review","/progress"].includes(item.href));

function routeContext(pathname:string){
  if(pathname.startsWith("/lernen/"))return{kicker:"جلسة موجهة",title:"الدرس الحالي"};
  if(pathname.startsWith("/assessment/"))return{kicker:"بوابة المستوى",title:"تقييم داخلي"};
  if(pathname.startsWith("/writing"))return{kicker:"إنتاج موجه",title:"مختبر الكتابة"};
  if(pathname.startsWith("/speaking"))return{kicker:"إنتاج موجه",title:"تدريب التحدث"};
  if(pathname.startsWith("/mediation"))return{kicker:"إنتاج موجه",title:"تدريب الوساطة"};
  if(pathname.startsWith("/errors"))return{kicker:"علاج شخصي",title:"دفتر الأخطاء"};
  if(pathname.startsWith("/shadowing"))return{kicker:"استماع ونطق",title:"مختبر التقليد"};
  const item=nav.find((candidate)=>pathname===candidate.href||pathname.startsWith(`${candidate.href}/`));
  return{kicker:"Der Weg nach Berlin",title:item?.label??"مسارك الشخصي إلى B2"};
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, ready, update } = useLearning();
  const [exitOpen, setExitOpen] = useState(false);
  const [mobileNavOpen,setMobileNavOpen]=useState(false);
  const pageContext=routeContext(pathname);
  const mobileMoreActive=!mobilePrimary.some((item)=>pathname===item.href||pathname.startsWith(`${item.href}/`));
  const initials = state.profile?.name.trim().slice(0, 1) || "م";
  const accessibility = state.accessibilityPreferences;
  const quietHoursActive = ready && isQuietHoursActive(state.quietHours, new Date());
  const suppressCoachNudge = ready && shouldSuppressInAppReminder(state.quietHours, "study-nudge", new Date());
  const activeSession = ready ? Object.values(state.examSessions).find((session) => isContinuousSessionFocusActive(session)) : undefined;
  const focusSession = ready ? continuousFocusSession(state, pathname) : undefined;
  const focusDashboard = focusSession ? `/exams/${focusSession.provider}/full/${focusSession.simulationId}` : "";
  const activeDashboard = activeSession ? `/exams/${activeSession.provider}/full/${activeSession.simulationId}` : "";

  useEffect(() => {
    if (!activeSession) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [activeSession]);

  useEffect(()=>{if(activeSession)return;const handle=(event:KeyboardEvent)=>{const action=globalStudyShortcut(event);if(!action)return;event.preventDefault();if(action==="next-task"){router.push(getCoachTarget(state).href);return}const audios=[...document.querySelectorAll<HTMLAudioElement>("audio")];const audio=audios.find((item)=>item.offsetParent!==null)??audios[0];if(audio){audio.currentTime=0;void audio.play().catch(()=>undefined)}};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle)},[activeSession,router,state]);

  function leaveFocusTemporarily() {
    setExitOpen(false);
    router.push("/exams");
  }

  function setFontScale(fontScale: "compact" | "default" | "large") {
    update((current) => ({
      ...current,
      accessibilityPreferences: { ...current.accessibilityPreferences, fontScale },
    }));
  }

  return (
    <div
      className={focusSession ? "app-frame exam-focus-frame" : "app-frame"}
      data-learning-ready={ready}
      data-exam-focus={focusSession ? "true" : "false"}
      data-global-shortcuts={GLOBAL_STUDY_SHORTCUT_POLICY_VERSION}
      data-navigation-policy="professional-guidance-navigation-v1"
      data-accessibility-policy={accessibility.policyVersion}
      data-font-scale={accessibility.fontScale}
      data-high-contrast={accessibility.highContrast ? "true" : "false"}
      data-reduced-motion={accessibility.reducedMotion ? "true" : "false"}
      data-gamification-visible={state.motivationPreferences.gamificationVisible ? "true" : "false"}
      data-low-data-mode={state.dataUsagePreferences.lowDataMode ? "true" : "false"}
      data-quiet-hours-active={quietHoursActive ? "true" : "false"}
    >
      <a className="skip-link" href="#main-content">تجاوز التنقل إلى المحتوى</a>
      {!focusSession && <aside className="side-nav">
        <Brand />
        <nav aria-label="التنقل الرئيسي">
          <span className="nav-section-label">التعلّم اليومي</span>
          {learningNav.map(({ href, label, icon: Icon }) => {const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={active?"nav-item active":"nav-item"}><Icon size={19}/><span>{label}</span>{active&&<i/>}</Link>})}
          <span className="nav-section-label tools">المصادر والأدوات</span>
          {resourceNav.map(({ href, label, icon: Icon }) => {const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={active?"nav-item active":"nav-item"}><Icon size={19}/><span>{label}</span>{active&&<i/>}</Link>})}
        </nav>
        {!suppressCoachNudge && <div className="side-coach-card">
          <span className="coach-orb"><BookOpen size={18} /></span>
          <div><strong>مرشدك حاضر</strong><p>خطة اليوم تتكيّف مع أدائك ووقتك.</p><small><kbd dir="ltr" data-bidi-scope="technical">Alt+N</kbd> المهمة التالية · <kbd dir="ltr" data-bidi-scope="technical">Alt+R</kbd> إعادة الصوت</small></div>
          <ChevronLeft size={17} />
        </div>}
      </aside>}

      <div className="main-column">
        {focusSession ? <header className="exam-focus-topbar">
          <div><span><LockKeyhole size={18} /></span><p><small>وضع التركيز · بروفة متصلة</small><strong>المساعدات والتصحيح مخفيان والساعة مستمرة</strong></p></div>
          <div><Link href={focusDashboard}><Clock3 size={15} /> لوحة البروفة</Link><button onClick={() => setExitOpen(true)}><LogOut size={15} /> مغادرة مؤقتة</button></div>
        </header> : <header className="topbar">
          <div className="mobile-brand"><Brand compact /></div>
          <div className="topbar-copy"><small>{pageContext.kicker}</small><strong>{pageContext.title}</strong>{state.profile&&<span>مرحبًا، {state.profile.name}</span>}</div>
          <div className="topbar-actions">
            <div className="reading-size-quick-control" role="group" aria-label="تغيير حجم النص">
              <button type="button" aria-pressed={accessibility.fontScale === "compact"} onClick={() => setFontScale("compact")} title="خط أصغر">أصغر</button>
              <button type="button" aria-pressed={accessibility.fontScale === "default"} onClick={() => setFontScale("default")} title="خط مريح">مريح</button>
              <button type="button" aria-pressed={accessibility.fontScale === "large"} onClick={() => setFontScale("large")} title="خط أكبر">أكبر</button>
            </div>
            <Link href="/search" className="topbar-search" aria-label="فتح البحث الألماني العربي"><Search size={17} /></Link>
            <span className="level-pill">{state.profile?.currentLevel ?? "A1"}</span>
            <span className="avatar" aria-label="ملف المتعلم">{initials}</span>
          </div>
        </header>}
        {!focusSession&&<ReviewReminderCoordinator/>}
        {!focusSession && activeSession && <aside className="active-rehearsal-reminder" aria-label="بروفة امتحان نشطة"><Clock3 size={17} /><p><strong>لديك بروفة متصلة نشطة.</strong><span>الموعد النهائي لم يتوقف عند مغادرة صفحة الامتحان.</span></p><Link href={activeDashboard}>استئناف البروفة</Link></aside>}
        <main id="main-content" className="page-content" tabIndex={-1}>{children}{pathname.startsWith("/exams")&&!focusSession&&<ExamPrintTools path={pathname}/>}<GermanCopyEnhancer scopeKey={pathname}/><GermanCharacterDock/></main>
      </div>

      {!focusSession && <nav className="bottom-nav" aria-label="التنقل على الهاتف">
        {mobilePrimary.map(({href,short,icon:Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={active?"active":""}><Icon size={20}/><span>{short}</span></Link>})}
        <button type="button" className={mobileMoreActive?"active":""} aria-current={mobileMoreActive?"page":undefined} aria-expanded={mobileNavOpen} aria-controls="mobile-navigation-sheet" onClick={()=>setMobileNavOpen(true)}><LayoutGrid size={20}/><span>المزيد</span></button>
      </nav>}

      {!focusSession&&mobileNavOpen&&<AccessibleDialog labelledBy="mobile-navigation-title" describedBy="mobile-navigation-description" className="mobile-navigation-sheet" onClose={()=>setMobileNavOpen(false)}><header><div><small>تنقل سريع</small><h2 id="mobile-navigation-title">كل أقسام المنصة</h2><p id="mobile-navigation-description">اختر وجهتك؛ تقدمك محفوظ محليًا ولن تتغير المهمة بمجرد التصفح.</p></div><button type="button" data-autofocus onClick={()=>setMobileNavOpen(false)} aria-label="إغلاق قائمة الأقسام"><X size={20}/></button></header><nav id="mobile-navigation-sheet" aria-label="كل أقسام المنصة">{nav.map(({href,label,icon:Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} onClick={()=>setMobileNavOpen(false)} className={active?"active":""}><span><Icon size={20}/></span><strong>{label}</strong>{active&&<small>أنت هنا</small>}</Link>})}</nav><footer><b>نصيحة</b><span>ابدأ دائمًا من «مهمتي اليوم» عندما تريد متابعة الدراسة.</span></footer></AccessibleDialog>}

      {focusSession && exitOpen && <AccessibleDialog labelledBy="focus-exit-title" describedBy="focus-exit-description" onClose={() => setExitOpen(false)}>
        <span><LogOut size={24} /></span>
        <h2 id="focus-exit-title">هل تريد مغادرة وضع التركيز مؤقتًا؟</h2>
        <p id="focus-exit-description">ستبقى الإجابات والمسودات محفوظة محليًا، لكن الساعة المركزية ستستمر ولن يضاف أي وقت. هذا تنبيه داخل التطبيق، وليس قفل متصفح أو مراقبة رسمية.</p>
        <div><button className="secondary-button" onClick={() => setExitOpen(false)}>ابقَ في البروفة</button><button className="danger-button" onClick={leaveFocusTemporarily}>غادر والساعة تستمر</button></div>
      </AccessibleDialog>}
    </div>
  );
}
