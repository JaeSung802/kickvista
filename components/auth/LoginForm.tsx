"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureMyProfile } from "@/lib/auth-actions";

export type LoginNotice = "link_invalid" | "server_error";

const labels = {
  en: {
    title: "Welcome back",
    subtitle: "Sign in to your KickVista account",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    orContinueWith: "or continue with",
    googleSignIn: "Continue with Google",
    kakaoSignIn: "Continue with Kakao",
    noAccount: "Don't have an account?",
    signUpLink: "Create account",
    terms: "By signing in, you agree to our",
    termsLink: "Terms of Service",
    and: "and",
    privacyLink: "Privacy Policy",
    errors: {
      invalid_credentials: "Invalid email or password.",
      email_not_confirmed: "Your email isn't confirmed yet. Open the confirmation link we sent you, then sign in.",
      user_banned: "This account can't sign in right now.",
      rate_limited: "Too many attempts. Please wait a moment and try again.",
      session_not_saved: "You were signed in, but this browser didn't keep the session. Allow cookies for this site and try again.",
      failed: "Sign-in failed. Please try again in a moment.",
    },
    notices: {
      link_invalid: "The confirmation link couldn't be completed in this browser. Your email may already be confirmed — try signing in with your email and password.",
      server_error: "Something went wrong while confirming. Try signing in with your email and password.",
    } satisfies Record<LoginNotice, string>,
  },
  ko: {
    title: "다시 오셨군요",
    subtitle: "킥비스타 계정으로 로그인하세요",
    emailLabel: "이메일 주소",
    emailPlaceholder: "example@email.com",
    passwordLabel: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    forgotPassword: "비밀번호를 잊으셨나요?",
    signIn: "로그인",
    orContinueWith: "또는 소셜 계정으로 계속하기",
    googleSignIn: "Google로 계속하기",
    kakaoSignIn: "카카오로 계속하기",
    noAccount: "계정이 없으신가요?",
    signUpLink: "회원가입",
    terms: "로그인 시",
    termsLink: "이용약관",
    and: "및",
    privacyLink: "개인정보처리방침",
    errors: {
      invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
      email_not_confirmed: "이메일 인증이 아직 완료되지 않았습니다. 받은 메일의 인증 링크를 연 뒤 로그인해 주세요.",
      user_banned: "이 계정은 현재 로그인할 수 없습니다.",
      rate_limited: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
      session_not_saved: "로그인은 되었지만 이 브라우저에 로그인 상태가 저장되지 않았습니다. 이 사이트의 쿠키를 허용한 뒤 다시 시도해 주세요.",
      failed: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
    notices: {
      link_invalid: "이 브라우저에서 인증 링크를 처리하지 못했습니다. 이메일 인증은 이미 완료되었을 수 있으니 이메일과 비밀번호로 로그인해 보세요.",
      server_error: "인증 처리 중 문제가 발생했습니다. 이메일과 비밀번호로 로그인해 보세요.",
    } satisfies Record<LoginNotice, string>,
  },
};

type LoginError = keyof (typeof labels)["ko"]["errors"];

/** Supabase Auth error → message key (the raw message is never shown). */
function loginErrorKey(err: { code?: string; status?: number }): LoginError {
  if (err.code === "invalid_credentials") return "invalid_credentials";
  if (err.code === "email_not_confirmed") return "email_not_confirmed";
  if (err.code === "user_banned") return "user_banned";
  if (err.code === "over_request_rate_limit" || err.status === 429) return "rate_limited";
  return "failed";
}

export default function LoginForm({ locale, notice }: { locale: "ko" | "en"; notice?: LoginNotice | null }) {
  const t = labels[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const supabase = createClient();

  async function handleEmailSignIn(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);

    const fail = (key: LoginError) => {
      setError(t.errors[key]);
      setLoading(false);
      busyRef.current = false;
    };

    let signInError: { code?: string; status?: number } | null = null;
    try {
      ({ error: signInError } = await supabase.auth.signInWithPassword({ email, password }));
    } catch {
      return fail("failed");
    }
    if (signInError) return fail(loginErrorKey(signInError));

    // The server must see the new session (cookies) before we leave this page;
    // this also creates a missing profile row.
    let profile: Awaited<ReturnType<typeof ensureMyProfile>> | "unreachable";
    try {
      profile = await ensureMyProfile();
    } catch {
      profile = "unreachable";
    }
    if (profile === "unauthenticated") {
      await supabase.auth.signOut().catch(() => {});
      return fail("session_not_saved");
    }
    window.location.href = `/${locale}`;
  }

  return (
    <main className="bg-gray-50 min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-110 flex flex-col gap-6">

        {/* Logo */}
        <div className="text-center">
          <a
            href={`/${locale}`}
            className="inline-flex items-center gap-2 mb-2 no-underline"
          >
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
              <defs>
                <linearGradient id="lf-sym" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#022C22"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15.5" fill="url(#lf-sym)"/>
              <polygon points="16,9 22.66,13.84 20.11,21.66 11.89,21.66 9.34,13.84"
                       fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2"/>
              <line x1="16"    y1="9"     x2="16"   y2="1.5"  stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="22.66" y1="13.84" x2="30"   y2="11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="20.11" y1="21.66" x2="24.5" y2="28"   stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="11.89" y1="21.66" x2="7.5"  y2="28"   stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <line x1="9.34"  y1="13.84" x2="2"    y2="11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8"/>
              <circle cx="16"    cy="9"     r="1.4" fill="#F59E0B"/>
              <circle cx="22.66" cy="13.84" r="1.4" fill="#F59E0B"/>
              <circle cx="20.11" cy="21.66" r="1.4" fill="#F59E0B"/>
              <circle cx="11.89" cy="21.66" r="1.4" fill="#F59E0B"/>
              <circle cx="9.34"  cy="13.84" r="1.4" fill="#F59E0B"/>
            </svg>
            <span className="text-[22px] font-black" style={{ letterSpacing: "-0.025em" }}>
              <span style={{ color: "#022C22" }}>Kick</span><span style={{ color: "#10B981" }}>Vista</span>
            </span>
          </a>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-2 mb-1">{t.title}</h1>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col gap-5 shadow-xl">

          {/* Notice from the confirmation-link callback */}
          {notice && !error && (
            <div role="status" className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700">
              {t.notices[notice]}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email form */}
          <form className="flex flex-col gap-4" onSubmit={handleEmailSignIn}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">{t.passwordLabel}</label>
                <a
                  href={`/${locale}/auth/forgot-password`}
                  className="text-xs text-emerald-600 hover:text-emerald-700 no-underline"
                >
                  {t.forgotPassword}
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "…" : t.signIn}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center">
            {t.noAccount}{" "}
            <a
              href={`/${locale}/auth/signup`}
              className="text-emerald-600 font-semibold hover:text-emerald-700 no-underline"
            >
              {t.signUpLink}
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          {t.terms}{" "}
          <a href={`/${locale}/terms`} className="text-gray-500 hover:underline">{t.termsLink}</a>{" "}
          {t.and}{" "}
          <a href={`/${locale}/privacy`} className="text-gray-500 hover:underline">{t.privacyLink}</a>
          {locale === "ko" ? "에 동의하게 됩니다." : "."}
        </p>
      </div>
    </main>
  );
}
