"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, LibraryBig, ChevronLeft, Clock3, Compass, FlaskConical, GraduationCap, LockKeyhole, LogOut, RotateCcw, Search, Settings, Sparkles } from "lucide-react";
import { Brand } from "./brand";
import { useLearning } from "./learning-provider";
import { continuousFocusSession, isContinuousSessionFocusActive } from "@/core/exams/continuous-session";
import { AccessibleDialog } from "./accessible-dialog";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, ready } = useLearning();
  const [exitOpen, setExitOpen] = useState(false);
  const initials = state.profile?.name.trim().slice(0, 1) || "م";
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

  function leaveFocusTemporarily() {
    setExitOpen(false);
    router.push("/exams");
  }

  return (
    <div className={focusSession ? "app-frame exam-focus-frame" : "app-frame"} data-learning-ready={ready} data-exam-focus={focusSession ? "true" : "false"}>
      <a className="skip-link" href="#main-content">تجاوز التنقل إلى المحتوى</a>
      {!focusSession && <aside className="side-nav">
        <Brand />
        <nav aria-label="التنقل الرئيسي">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={active ? "nav-item active" : "nav-item"}><Icon size={19} /><span>{label}</span>{active && <i />}</Link>;
          })}
        </nav>
        <div className="side-coach-card">
          <span className="coach-orb"><BookOpen size={18} /></span>
          <div><strong>مرشدك حاضر</strong><p>خطة اليوم تتكيّف مع أدائك ووقتك.</p></div>
          <ChevronLeft size={17} />
        </div>
      </aside>}

      <div className="main-column">
        {focusSession ? <header className="exam-focus-topbar">
          <div><span><LockKeyhole size={18} /></span><p><small>وضع التركيز · بروفة متصلة</small><strong>المساعدات والتصحيح مخفيان والساعة مستمرة</strong></p></div>
          <div><Link href={focusDashboard}><Clock3 size={15} /> لوحة البروفة</Link><button onClick={() => setExitOpen(true)}><LogOut size={15} /> مغادرة مؤقتة</button></div>
        </header> : <header className="topbar">
          <div className="mobile-brand"><Brand compact /></div>
          <div className="topbar-copy"><small>مسارك الشخصي إلى B2</small><strong>{state.profile ? `مرحبًا، ${state.profile.name}` : "ابدأ بخطوة واضحة"}</strong></div>
          <div className="topbar-actions">
            <Link href="/search" className="topbar-search" aria-label="فتح البحث الألماني العربي"><Search size={17} /></Link>
            <span className="level-pill">{state.profile?.currentLevel ?? "A1"}</span>
            <span className="avatar" aria-label="ملف المتعلم">{initials}</span>
          </div>
        </header>}
        {!focusSession && activeSession && <aside className="active-rehearsal-reminder" aria-label="بروفة امتحان نشطة"><Clock3 size={17} /><p><strong>لديك بروفة متصلة نشطة.</strong><span>الموعد النهائي لم يتوقف عند مغادرة صفحة الامتحان.</span></p><Link href={activeDashboard}>استئناف البروفة</Link></aside>}
        <main id="main-content" className="page-content" tabIndex={-1}>{children}</main>
      </div>

      {!focusSession && <nav className="bottom-nav" aria-label="التنقل على الهاتف">
        {nav.filter((item) => ["/today", "/path", "/review", "/progress"].includes(item.href)).map(({ href, short, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={active ? "active" : ""}><Icon size={20} /><span>{short}</span></Link>;
        })}
      </nav>}

      {focusSession && exitOpen && <AccessibleDialog labelledBy="focus-exit-title" describedBy="focus-exit-description" onClose={() => setExitOpen(false)}>
        <span><LogOut size={24} /></span>
        <h2 id="focus-exit-title">هل تريد مغادرة وضع التركيز مؤقتًا؟</h2>
        <p id="focus-exit-description">ستبقى الإجابات والمسودات محفوظة محليًا، لكن الساعة المركزية ستستمر ولن يضاف أي وقت. هذا تنبيه داخل التطبيق، وليس قفل متصفح أو مراقبة رسمية.</p>
        <div><button className="secondary-button" onClick={() => setExitOpen(false)}>ابقَ في البروفة</button><button className="danger-button" onClick={leaveFocusTemporarily}>غادر والساعة تستمر</button></div>
      </AccessibleDialog>}
    </div>
  );
}
