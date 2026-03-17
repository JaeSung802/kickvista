"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    rememberMe: "Remember me",
    terms: "By signing in, you agree to our",
    termsLink: "Terms of Service",
    and: "and",
    privacyLink: "Privacy Policy",
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
    rememberMe: "로그인 상태 유지",
    terms: "로그인 시",
    termsLink: "이용약관",
    and: "및",
    privacyLink: "개인정보처리방침",
  },
};

export default function LoginForm({ locale }: { locale: "ko" | "en" }) {
  const t = labels[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/api/auth/callback?next=/${locale}`,
      },
    });
    // Browser will redirect — no need to setLoading(false)
  }

  async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        locale === "ko"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : "Invalid email or password."
      );
      setLoading(false);
    } else {
      window.location.href = `/${locale}`;
    }
  }

  return (
    <main
      style={{
        background: "#0d1117",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <a
            href={`/${locale}`}
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}
          >
            <span style={{ fontSize: 28 }}>⚽</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#e6edf3" }}>
              Kick<span style={{ color: "#22c55e" }}>Vista</span>
            </span>
          </a>
          <h1 style={{ color: "#e6edf3", fontSize: 24, fontWeight: 800, margin: "8px 0 4px" }}>
            {t.title}
          </h1>
          <p style={{ color: "#8b949e", fontSize: 14, margin: 0 }}>{t.subtitle}</p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 16,
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#f85149",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* Social logins */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "12px", backgroundColor: "#ffffff", color: "#1a1a1a",
                fontSize: 14, fontWeight: 600, borderRadius: 10, border: "none",
                cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.8 13.3l7.9 6.1C12.6 13 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 37.3 46.6 31.4 46.6 24.5z"/>
                <path fill="#FBBC05" d="M10.7 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.3-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.7l-7.5-5.8C30.3 38.4 27.3 39.5 24 39.5c-6.1 0-11.3-4.1-13.2-9.7l-7.8 6C6.6 43.3 14.7 48 24 48z"/>
              </svg>
              {t.googleSignIn}
            </button>
            <button
              type="button"
              onClick={() => setError(locale === "ko" ? "카카오 로그인은 준비 중입니다." : "Kakao sign-in coming soon.")}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "12px", backgroundColor: "#FEE500", color: "#3c1e1e",
                fontSize: 14, fontWeight: 600, borderRadius: 10, border: "none", cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3c1e1e">
                <path d="M12 3C6.48 3 2 6.69 2 11.23c0 2.94 1.79 5.53 4.5 7.07l-1.14 4.2c-.1.37.3.67.64.47L11 20.15c.33.04.66.06 1 .06 5.52 0 10-3.69 10-8.23C22 6.69 17.52 3 12 3z"/>
              </svg>
              {t.kakaoSignIn}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: 1, backgroundColor: "#30363d" }} />
            <span style={{ color: "#484f58", fontSize: 12 }}>{t.orContinueWith}</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#30363d" }} />
          </div>

          <form
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            onSubmit={handleEmailSignIn}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                style={{
                  width: "100%", padding: "11px 14px", backgroundColor: "#0d1117",
                  border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#22c55e"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#30363d"; }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="flex items-center justify-between">
                <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.passwordLabel}</label>
                <a href={`/${locale}/auth/forgot-password`} style={{ color: "#22c55e", fontSize: 12, textDecoration: "none" }}>
                  {t.forgotPassword}
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                style={{
                  width: "100%", padding: "11px 14px", backgroundColor: "#0d1117",
                  border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#22c55e"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#30363d"; }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "12px", backgroundColor: "#22c55e", color: "#0d1117",
                fontSize: 15, fontWeight: 700, borderRadius: 10, border: "none",
                cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "…" : t.signIn}
            </button>
          </form>

          <p style={{ color: "#8b949e", fontSize: 13, textAlign: "center", margin: 0 }}>
            {t.noAccount}{" "}
            <a href={`/${locale}/auth/signup`} style={{ color: "#22c55e", fontWeight: 600, textDecoration: "none" }}>
              {t.signUpLink}
            </a>
          </p>
        </div>

        <p style={{ color: "#484f58", fontSize: 11, textAlign: "center", lineHeight: 1.6, margin: 0 }}>
          {t.terms}{" "}
          <a href={`/${locale}/terms`} style={{ color: "#8b949e" }}>{t.termsLink}</a>{" "}
          {t.and}{" "}
          <a href={`/${locale}/privacy`} style={{ color: "#8b949e" }}>{t.privacyLink}</a>
          {locale === "ko" ? "에 동의하게 됩니다." : "."}
        </p>
      </div>
    </main>
  );
}
