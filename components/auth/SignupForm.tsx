"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const labels = {
  en: {
    title: "Get started with KickVista",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    nicknameLabel: "Nickname",
    nicknamePlaceholder: "e.g. footballfan_2026",
    nicknameHint: "This is how others will see you. 3–20 characters.",
    createAccount: "Create Account",
    alreadyAccount: "Already have an account?",
    signInLink: "Sign in",
    passwordStrength: "Password strength",
    weak: "Weak", fair: "Fair", strong: "Strong",
    errorNickname: "Nickname must be 3–20 characters.",
    errorPasswordShort: "Password must be at least 8 characters.",
    successTitle: "Check your inbox!",
    successBody: "We sent a confirmation link to",
    successNote: "Click the link in the email to complete your registration.",
    backToLogin: "Back to login",
  },
  ko: {
    title: "KickVista 시작하기",
    emailLabel: "이메일 주소",
    emailPlaceholder: "example@email.com",
    passwordLabel: "비밀번호",
    passwordPlaceholder: "8자 이상 입력하세요",
    nicknameLabel: "닉네임",
    nicknamePlaceholder: "예: 축구왕_2026",
    nicknameHint: "사이트 내에서 활동할 이름입니다. 3~20자.",
    createAccount: "가입하기",
    alreadyAccount: "이미 회원이신가요?",
    signInLink: "로그인하기",
    passwordStrength: "비밀번호 강도",
    weak: "약함", fair: "보통", strong: "강함",
    errorNickname: "닉네임은 3~20자여야 합니다.",
    errorPasswordShort: "비밀번호는 8자 이상이어야 합니다.",
    successTitle: "인증 메일이 발송되었습니다.",
    successBody: "아래 주소로 인증 링크를 보냈습니다:",
    successNote: "메일함의 링크를 클릭하여 가입을 완료해주세요.",
    backToLogin: "로그인 화면으로",
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

export default function SignupForm({ locale }: { locale: "ko" | "en" }) {
  const t = labels[locale];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const supabase = createClient();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const strength = getPasswordStrength(password);
  const meta = strength > 0 ? STRENGTH_META[strength as 1 | 2 | 3] : null;

  async function handleEmailSignUp(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (nickname.trim().length < 3 || nickname.trim().length > 20) {
      setError(t.errorNickname);
      return;
    }
    if (password.length < 8) {
      setError(t.errorPasswordShort);
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback?next=/${locale}`,
        data: {
          nickname: nickname.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccessEmail(email);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (successEmail) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-bold text-gray-900">{t.successTitle}</h1>
              <p className="text-sm text-gray-500">
                {t.successBody}<br />
                <span className="font-semibold text-gray-700">{successEmail}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{t.successNote}</p>
            </div>
            <a
              href={`/${locale}/auth/login`}
              className="text-sm text-red-500 font-semibold hover:text-red-600 no-underline"
            >
              {t.backToLogin}
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ── Signup form ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Title */}
        <div className="text-center">
          <a href={`/${locale}`} className="inline-flex items-center gap-2 mb-4 no-underline">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
              <defs>
                <linearGradient id="sf-grad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#022C22"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15.5" fill="url(#sf-grad)"/>
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
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-5">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleEmailSignUp}>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
              />
            </div>

            {/* Password */}
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
                      <div
                        key={b}
                        className={`flex-1 h-1 rounded-full transition-colors ${b <= meta.bars ? meta.color : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nickname */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.nicknameLabel}</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.nicknamePlaceholder}
                required
                minLength={3}
                maxLength={20}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
              />
              <span className="text-[11px] text-gray-400">{t.nicknameHint}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 mt-1"
              style={{ backgroundColor: loading ? "#f87171" : "#ef4444" }}
            >
              {loading ? "…" : t.createAccount}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-sm text-gray-500 text-center">
          {t.alreadyAccount}{" "}
          <a
            href={`/${locale}/auth/login`}
            className="text-red-500 font-semibold hover:text-red-600 no-underline"
          >
            {t.signInLink}
          </a>
        </p>
      </div>
    </main>
  );
}
