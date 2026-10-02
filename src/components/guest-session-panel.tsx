"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, TimerReset, UserRoundCheck, UserRoundPlus } from "lucide-react";
import { useLearning } from "@/components/learning-provider";
import {
  GUEST_DEFAULT_NAME_AR,
  GUEST_SESSION_POLICY,
  clampGuestMinutes,
  createGuestSession,
  describeGuestSession,
  guestSessionExpired,
  promoteGuestSession,
  type GuestPromotionPlan,
  type GuestSessionRecord,
} from "@/core/state/guest-session";

const MINUTE_CHOICES = [15, 30, 60, 120] as const;

export function GuestSessionPanel() {
  const { state, addProfile, profiles, activeProfileId } = useLearning();
  const [minutes, setMinutes] = useState<number>(30);
  const [session, setSession] = useState<GuestSessionRecord | null>(null);
  const [guestState, setGuestState] = useState<ReturnType<typeof createGuestSession>["state"] | null>(null);
  const [permanentName, setPermanentName] = useState("");
  const [plan, setPlan] = useState<GuestPromotionPlan | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const boundaryLine = useMemo(
    () => "صفر أدلّة موروثة من ملفك · لا بوابة · لا إتقان · لا شبكة",
    [],
  );

  function draftName(): string {
    return permanentName.trim() || `${GUEST_DEFAULT_NAME_AR}-${new Date().toISOString().slice(5, 10)}`;
  }

  function start() {
    setError(null);
    setStatus(null);
    setPlan(null);
    try {
      const created = createGuestSession({ minutes: clampGuestMinutes(minutes), activeState: state });
      setSession(created.session);
      setGuestState(created.state);
      setPermanentName("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذّر بدء جلسة الضيف.");
    }
  }

  async function promote() {
    if (!session || !guestState) return;
    setError(null);
    try {
      const result = promoteGuestSession({
        session,
        guestState,
        displayName: draftName(),
        activeState: state,
      });
      await addProfile(result.state);
      setPlan(result.plan);
      setSession(result.session);
      setStatus(
        `ملف دائم محلي: «${result.session.displayNameAr}» · ${result.plan.classifiedFieldCount} حقلًا مصنَّفًا · أدلّة ${result.plan.evidenceFieldsBefore} قبل=بعد · ملفك السابق لم يُمسّ.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذّر التحويل إلى ملف دائم.");
    }
  }

  async function createFreshPermanent() {
    setError(null);
    setStatus(null);
    try {
      const created = createGuestSession({ minutes: clampGuestMinutes(minutes), activeState: state });
      const promoted = promoteGuestSession({
        session: created.session,
        guestState: created.state,
        displayName: draftName(),
        activeState: state,
      });
      await addProfile(promoted.state);
      setPlan(promoted.plan);
      setSession(promoted.session);
      setStatus(
        `ملف دائم جديد من الصفر: «${promoted.session.displayNameAr}» · بلا أي دليل موروث · يظهر الآن في «الملفات المحلية».`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذّر إنشاء ملف دائم.");
    }
  }

  const expired = session && session.status === "temporary" ? guestSessionExpired(session) : false;

  return (
    <section className="settings-card guest-session-panel" data-guest-policy={GUEST_SESSION_POLICY}>
      <div className="settings-title">
        <span>
          <UserRoundPlus size={20} />
        </span>
        <div>
          <h2>جلسة ضيف مؤقتة</h2>
          <p>
            لمن يريد تجربة خطوة واحدة على هذا الجهاز دون أن يرى ملفك: الجلسة تبدأ من الصفر، ولا تُحتسب في أي بوابة،
            ثم تُحوَّل إلى ملف محلي دائم باسم صريح.
          </p>
        </div>
      </div>

      <p data-guest-boundary="true">{boundaryLine}</p>

      {!session && (
        <div className="guest-session-start">
          <label>
            مدة الجلسة
            <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}>
              {MINUTE_CHOICES.map((choice) => (
                <option key={choice} value={choice}>
                  {choice} دقيقة
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="primary-button" onClick={start} data-guest-start="true">
            <UserRoundPlus size={16} /> ابدأ جلسة ضيف
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void createFreshPermanent()}
            data-guest-fresh="true"
          >
            ملف دائم جديد من الصفر
          </button>
        </div>
      )}

      {session && (
        <div className="guest-session-live">
          <p data-guest-session={session.status}>
            <strong>{session.displayNameAr}</strong> ·{" "}
            <span data-guest-expiry={session.expiresAt.slice(0, 16)}>{session.expiresAt.slice(0, 16)}</span>
            {session.status === "promoted" ? " · ملف دائم" : expired ? " · انتهى الوقت" : " · مؤقتة"}
          </p>
          <p data-guest-summary="true">{describeGuestSession(session)}</p>
          {session.status === "temporary" && (
            <div className="guest-session-promote">
              <label>
                اسم الملف الدائم
                <input
                  type="text"
                  value={permanentName}
                  onChange={(event) => setPermanentName(event.target.value)}
                  placeholder="مثال: سارة"
                  aria-label="اسم الملف الدائم"
                />
              </label>
              <button type="button" className="primary-button" onClick={() => void promote()} data-guest-promote="true">
                <UserRoundCheck size={16} /> حوّل إلى ملف دائم
              </button>
              <button type="button" className="secondary-button" onClick={start} data-guest-restart="true">
                <TimerReset size={16} /> جلسة جديدة من الصفر
              </button>
            </div>
          )}
        </div>
      )}

      {plan && (
        <p data-guest-plan={plan.classifiedFieldCount}>
          <ShieldCheck size={15} aria-hidden="true" /> {plan.classifiedFieldCount} حقلًا مصنَّفًا · أدلّة الجلسة{" "}
          {plan.evidenceFieldsBefore === plan.evidenceFieldsAfter ? "قبل=بعد" : "تغيّرت (مرفوضة)"} ·{" "}
          {plan.progressKeptPristine} حقل تقدّم بقي كما هو حتى التحويل الصريح.
        </p>
      )}

      {session && (
        <p data-guest-active-profile={activeProfileId}>
          ملفك النشط «{state.profile?.name ?? "—"}» لم يُمسّ · الملفات المحلية الآن {profiles.length}.
        </p>
      )}

      {status && (
        <p role="status" data-guest-status="true">
          {status}
        </p>
      )}
      {error && (
        <p role="status" data-guest-error="true">
          {error}
        </p>
      )}
    </section>
  );
}
