"use client";

import { use, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const labels = {
  ko: {
    title: "비밀번호를 잊으셨나요?",
    subtitle: "가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.",
    emailLabel: "이메일 주소",
    emailPlaceholder: "example@email.com",
    submit: "재설정 메일 보내기",
    backToLogin: "로그인 페이지로 돌아가기",
    successTitle: "이메일을 확인해주세요!",
    successBody: "비밀번호 재설정 링크를 보냈습니다:",
    successNote: "메일함의 링크를 클릭하면 새 비밀번호를 설정할 수 있습니다.",
  },
  en: {
    title: "Forgot your password?",
    subtitle: "Enter your email and we'll send you a reset link.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submit: "Send reset link",
    backToLogin: "Back to login",
    successTitle: "Check your inbox!",
    successBody: "We sent a password reset link to:",
    successNote: "Click the link in the email to set a new password.",
  },
};

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = use(params);
  const locale = (rawLocale === "en" ? "en" : "ko") as "ko" | "en";
  const t = labels[locale];

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  const supabase = createClient();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/api/auth/callback?next=/${locale}/auth/update-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccessEmail(email);
    }
  }

  // Success screen
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
            <a href={`/${locale}/auth/login`} className="text-sm text-red-500 font-semibold hover:text-red-600 no-underline">
              {t.backToLogin}
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
                <linearGradient id="fp-grad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#022C22"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15.5" fill="url(#fp-grad)"/>
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
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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

        <p className="text-sm text-gray-500 text-center">
          <a href={`/${locale}/auth/login`} className="text-red-500 font-semibold hover:text-red-600 no-underline">
            ← {t.backToLogin}
          </a>
        </p>
      </div>
    </main>
  );
}
