"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const labels = {
  ko: {
    title: "새 비밀번호 설정",
    subtitle: "사용할 새 비밀번호를 입력해주세요.",
    passwordLabel: "새 비밀번호",
    passwordPlaceholder: "8자 이상 입력하세요",
    confirmLabel: "비밀번호 확인",
    confirmPlaceholder: "비밀번호를 다시 입력하세요",
    submit: "비밀번호 변경",
    passwordStrength: "비밀번호 강도",
    weak: "약함", fair: "보통", strong: "강함",
    errorShort: "비밀번호는 8자 이상이어야 합니다.",
    errorMatch: "비밀번호가 일치하지 않습니다.",
    errorSession: "세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.",
    successTitle: "비밀번호가 변경되었습니다!",
    successNote: "새 비밀번호로 로그인해주세요.",
    toLogin: "로그인하기",
    backToReset: "비밀번호 재설정 페이지로",
  },
  en: {
    title: "Set new password",
    subtitle: "Enter the new password you'd like to use.",
    passwordLabel: "New password",
    passwordPlaceholder: "At least 8 characters",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Re-enter your new password",
    submit: "Update password",
    passwordStrength: "Password strength",
    weak: "Weak", fair: "Fair", strong: "Strong",
    errorShort: "Password must be at least 8 characters.",
    errorMatch: "Passwords do not match.",
    errorSession: "Session expired. Please request a new password reset link.",
    successTitle: "Password updated!",
    successNote: "You can now sign in with your new password.",
    toLogin: "Sign in",
    backToReset: "Request new reset link",
  },
};

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  return 3;
}

const STRENGTH_META = {
  1: { bars: 1, color: "bg-red-400",     textColor: "text-red-500",     labelKey: "weak"   as const },
  2: { bars: 2, color: "bg-amber-400",   textColor: "text-amber-500",   labelKey: "fair"   as const },
  3: { bars: 4, color: "bg-emerald-500", textColor: "text-emerald-600", labelKey: "strong" as const },
};

export default function UpdatePasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = (params.locale === "en" ? "en" : "ko") as "ko" | "en";
  const t = labels[locale];

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const strength = getPasswordStrength(password);
  const meta = strength > 0 ? STRENGTH_META[strength as 1 | 2 | 3] : null;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t.errorShort);
      return;
    }
    if (password !== confirm) {
      setError(t.errorMatch);
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      // Session expired or invalid recovery link
      const isSessionError =
        updateError.message.toLowerCase().includes("session") ||
        updateError.message.toLowerCase().includes("expired") ||
        updateError.status === 403;
      setError(isSessionError ? t.errorSession : updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  // Success screen
  if (success) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-bold text-gray-900">{t.successTitle}</h1>
              <p className="text-xs text-gray-400">{t.successNote}</p>
            </div>
            <a href={`/${locale}/auth/login`} className="text-sm text-red-500 font-semibold hover:text-red-600 no-underline">
              {t.toLogin} →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Logo + Title */}
        <div className="text-center">
          <a href={`/${locale}`} className="inline-flex items-center gap-2 mb-4 no-underline">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
              <defs>
                <linearGradient id="up-grad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#022C22"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15.5" fill="url(#up-grad)"/>
              <polygon points="16,9 22.66,13.84 20.11,21.66 11.89,21.66 9.34,13.84"
                       fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2"/>
              <circle cx="16"    cy="9"     r="1.4" fill="#F59E0B"/>
              <circle cx="22.66" cy="13.84" r="1.4" fill="#F59E0B"/>
              <circle cx="20.11" cy="21.66" r="1.4" fill="#F59E0B"/>
              <circle cx="11.89" cy="21.66" r="1.4" fill="#F59E0B"/>
              <circle cx="9.34"  cy="13.84" r="1.4" fill="#F59E0B"/>
            </svg>
            <span className="text-xl font-black" style={{ letterSpacing: "-0.025em" }}>
              <span style={{ color: "#022C22" }}>Kick</span><span style={{ color: "#10B981" }}>Vista</span>
            </span>
          </a>
          <h1 className="text-2xl font-extrabold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
              {error}
              {error === t.errorSession && (
                <span> <a href={`/${locale}/auth/forgot-password`} className="font-semibold underline">{t.backToReset}</a></span>
              )}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
              />
              {password.length > 0 && meta && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-400">{t.passwordStrength}</span>
                    <span className={`text-[11px] font-semibold ${meta.textColor}`}>{t[meta.labelKey]}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((b) => (
                      <div key={b}
                        className={`flex-1 h-1 rounded-full transition-colors ${b <= meta.bars ? meta.color : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.confirmLabel}</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t.confirmPlaceholder}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
              style={{ backgroundColor: loading ? "#f87171" : "#ef4444" }}
            >
              {loading ? "…" : t.submit}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
