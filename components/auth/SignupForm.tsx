"use client";

import { useState } from "react";

const labels = {
  en: {
    title: "Create your account",
    subtitle: "Join thousands of football fans on KickVista",
    nicknameLabel: "Nickname", nicknamePlaceholder: "e.g. footballfan_2026",
    nicknameHint: "This is how others will see you. 3–20 characters.",
    emailLabel: "Email address", emailPlaceholder: "you@example.com",
    passwordLabel: "Password", passwordPlaceholder: "At least 8 characters",
    confirmPasswordLabel: "Confirm Password", confirmPasswordPlaceholder: "Re-enter your password",
    favoriteLeagueLabel: "Favourite League (optional)", leaguePlaceholder: "Select your favourite league",
    orSignUpWith: "or sign up with",
    googleSignUp: "Sign up with Google", kakaoSignUp: "Sign up with Kakao",
    agreeTerms: "I agree to the", termsLink: "Terms of Service", and: "and", privacyLink: "Privacy Policy",
    agreeMarketing: "Receive updates on live scores, AI predictions and community highlights (optional)",
    createAccount: "Create Account",
    alreadyAccount: "Already have an account?", signInLink: "Sign in",
    passwordStrength: "Password strength", weak: "Weak", fair: "Fair", strong: "Strong",
  },
  ko: {
    title: "계정 만들기",
    subtitle: "수천 명의 축구 팬들과 함께 킥비스타를 즐기세요",
    nicknameLabel: "닉네임", nicknamePlaceholder: "예: 축구왕_2026",
    nicknameHint: "다른 유저들에게 보여지는 이름입니다. 3~20자.",
    emailLabel: "이메일 주소", emailPlaceholder: "example@email.com",
    passwordLabel: "비밀번호", passwordPlaceholder: "8자 이상",
    confirmPasswordLabel: "비밀번호 확인", confirmPasswordPlaceholder: "비밀번호를 다시 입력하세요",
    favoriteLeagueLabel: "좋아하는 리그 (선택)", leaguePlaceholder: "좋아하는 리그를 선택하세요",
    orSignUpWith: "또는 소셜 계정으로 가입하기",
    googleSignUp: "Google로 가입하기", kakaoSignUp: "카카오로 가입하기",
    agreeTerms: "에 동의합니다", termsLink: "이용약관", and: "및", privacyLink: "개인정보처리방침",
    agreeMarketing: "라이브 스코어, AI 예측, 커뮤니티 하이라이트 수신 동의 (선택)",
    createAccount: "계정 만들기",
    alreadyAccount: "이미 계정이 있으신가요?", signInLink: "로그인",
    passwordStrength: "비밀번호 강도", weak: "약함", fair: "보통", strong: "강함",
  },
};

const LEAGUES = [
  { value: "premier-league", en: "Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿", ko: "프리미어리그 🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { value: "la-liga",        en: "La Liga 🇪🇸",           ko: "라리가 🇪🇸" },
  { value: "bundesliga",     en: "Bundesliga 🇩🇪",        ko: "분데스리가 🇩🇪" },
  { value: "serie-a",        en: "Serie A 🇮🇹",           ko: "세리에 A 🇮🇹" },
  { value: "ligue-1",        en: "Ligue 1 🇫🇷",           ko: "리그 1 🇫🇷" },
  { value: "champions-league", en: "Champions League ⭐",  ko: "UEFA 챔피언스리그 ⭐" },
];

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
  1: { bars: 1, color: "bg-red-400",   textColor: "text-red-500",   labelKey: "weak"   as const },
  2: { bars: 2, color: "bg-amber-400", textColor: "text-amber-500", labelKey: "fair"   as const },
  3: { bars: 4, color: "bg-emerald-500", textColor: "text-emerald-600", labelKey: "strong" as const },
};

export default function SignupForm({ locale }: { locale: "ko" | "en" }) {
  const t = labels[locale];
  const isKo = locale === "ko";
  const [password, setPassword] = useState("");

  const strength = getPasswordStrength(password);
  const meta = strength > 0 ? STRENGTH_META[strength as 1 | 2 | 3] : null;

  return (
    <main className="bg-gray-50 min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-120 flex flex-col gap-6">

        {/* Logo */}
        <div className="text-center">
          <a href={`/${locale}`} className="inline-flex items-center gap-2 mb-2 no-underline">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
              <defs>
                <linearGradient id="sf-sym" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#022C22"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15.5" fill="url(#sf-sym)"/>
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

          {/* Social */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => alert("Coming soon")}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.8 13.3l7.9 6.1C12.6 13 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 37.3 46.6 31.4 46.6 24.5z"/>
                <path fill="#FBBC05" d="M10.7 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.3-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.7l-7.5-5.8C30.3 38.4 27.3 39.5 24 39.5c-6.1 0-11.3-4.1-13.2-9.7l-7.8 6C6.6 43.3 14.7 48 24 48z"/>
              </svg>
              {t.googleSignUp}
            </button>
            <button
              type="button"
              onClick={() => alert("Coming soon")}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#FEE500", color: "#3c1e1e" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3c1e1e">
                <path d="M12 3C6.48 3 2 6.69 2 11.23c0 2.94 1.79 5.53 4.5 7.07l-1.14 4.2c-.1.37.3.67.64.47L11 20.15c.33.04.66.06 1 .06 5.52 0 10-3.69 10-8.23C22 6.69 17.52 3 12 3z"/>
              </svg>
              {t.kakaoSignUp}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">{t.orSignUpWith}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>

            {/* Nickname */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.nicknameLabel}</label>
              <input
                type="text"
                placeholder={t.nicknamePlaceholder}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
              <span className="text-[11px] text-gray-400">{t.nicknameHint}</span>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.emailLabel}</label>
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* Password + strength meter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
              {password.length > 0 && meta && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-400">{t.passwordStrength}</span>
                    <span className={`text-[11px] font-semibold ${meta.textColor}`}>{t[meta.labelKey as "weak" | "fair" | "strong"]}</span>
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

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.confirmPasswordLabel}</label>
              <input
                type="password"
                placeholder={t.confirmPasswordPlaceholder}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors"
              />
            </div>

            {/* Favourite league */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">{t.favoriteLeagueLabel}</label>
              <select className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors cursor-pointer">
                <option value="">{t.leaguePlaceholder}</option>
                {LEAGUES.map((l) => (
                  <option key={l.value} value={l.value}>{isKo ? l.ko : l.en}</option>
                ))}
              </select>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-0.5 shrink-0 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer leading-relaxed">
                  {isKo ? (
                    <>
                      <a href={`/${locale}/terms`} className="text-emerald-600 hover:underline">{t.termsLink}</a>
                      {" "}{t.and}{" "}
                      <a href={`/${locale}/privacy`} className="text-emerald-600 hover:underline">{t.privacyLink}</a>
                      {t.agreeTerms}
                    </>
                  ) : (
                    <>
                      {t.agreeTerms}{" "}
                      <a href={`/${locale}/terms`} className="text-emerald-600 hover:underline">{t.termsLink}</a>
                      {" "}{t.and}{" "}
                      <a href={`/${locale}/privacy`} className="text-emerald-600 hover:underline">{t.privacyLink}</a>
                    </>
                  )}
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="marketing"
                  className="mt-0.5 shrink-0 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="marketing" className="text-sm text-gray-500 cursor-pointer leading-relaxed">
                  {t.agreeMarketing}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {t.createAccount}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center">
            {t.alreadyAccount}{" "}
            <a
              href={`/${locale}/auth/login`}
              className="text-emerald-600 font-semibold hover:text-emerald-700 no-underline"
            >
              {t.signInLink}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
