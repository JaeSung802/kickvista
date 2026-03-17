"use client";

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

const input: React.CSSProperties = {
  width: "100%", padding: "11px 14px", backgroundColor: "#0d1117",
  border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};

export default function SignupForm({ locale }: { locale: "ko" | "en" }) {
  const t = labels[locale];
  const isKo = locale === "ko";

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <a href={`/${locale}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>⚽</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#e6edf3" }}>Kick<span style={{ color: "#22c55e" }}>Vista</span></span>
          </a>
          <h1 style={{ color: "#e6edf3", fontSize: 24, fontWeight: 800, margin: "8px 0 4px" }}>{t.title}</h1>
          <p style={{ color: "#8b949e", fontSize: 14, margin: 0 }}>{t.subtitle}</p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 16, padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Social */}
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => alert("Coming soon")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", backgroundColor: "#ffffff", color: "#1a1a1a", fontSize: 14, fontWeight: 600, borderRadius: 10, border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.8 13.3l7.9 6.1C12.6 13 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 37.3 46.6 31.4 46.6 24.5z"/>
                <path fill="#FBBC05" d="M10.7 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.3-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.7l-7.5-5.8C30.3 38.4 27.3 39.5 24 39.5c-6.1 0-11.3-4.1-13.2-9.7l-7.8 6C6.6 43.3 14.7 48 24 48z"/>
              </svg>
              {t.googleSignUp}
            </button>
            <button type="button" onClick={() => alert("Coming soon")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", backgroundColor: "#FEE500", color: "#3c1e1e", fontSize: 14, fontWeight: 600, borderRadius: 10, border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#3c1e1e"><path d="M12 3C6.48 3 2 6.69 2 11.23c0 2.94 1.79 5.53 4.5 7.07l-1.14 4.2c-.1.37.3.67.64.47L11 20.15c.33.04.66.06 1 .06 5.52 0 10-3.69 10-8.23C22 6.69 17.52 3 12 3z"/></svg>
              {t.kakaoSignUp}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: 1, backgroundColor: "#30363d" }} />
            <span style={{ color: "#484f58", fontSize: 12 }}>{t.orSignUpWith}</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#30363d" }} />
          </div>

          <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={(e) => e.preventDefault()}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.nicknameLabel}</label>
              <input type="text" placeholder={t.nicknamePlaceholder} style={input} />
              <span style={{ color: "#484f58", fontSize: 11 }}>{t.nicknameHint}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.emailLabel}</label>
              <input type="email" placeholder={t.emailPlaceholder} style={input} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.passwordLabel}</label>
              <input type="password" placeholder={t.passwordPlaceholder} style={input} />
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ color: "#484f58", fontSize: 11 }}>{t.passwordStrength}</span>
                  <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>{t.fair}</span>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1,2,3,4].map(b => <div key={b} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: b <= 2 ? "#f59e0b" : "#21262d" }} />)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.confirmPasswordLabel}</label>
              <input type="password" placeholder={t.confirmPasswordPlaceholder} style={input} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{t.favoriteLeagueLabel}</label>
              <select style={{ ...input, cursor: "pointer" }}>
                <option value="">{t.leaguePlaceholder}</option>
                {LEAGUES.map(l => <option key={l.value} value={l.value}>{isKo ? l.ko : l.en}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" required style={{ accentColor: "#22c55e", width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }} />
                <label htmlFor="terms" style={{ color: "#8b949e", fontSize: 13, cursor: "pointer", lineHeight: 1.5 }}>
                  {isKo ? <><a href={`/${locale}/terms`} style={{ color: "#22c55e" }}>{t.termsLink}</a> {t.and} <a href={`/${locale}/privacy`} style={{ color: "#22c55e" }}>{t.privacyLink}</a>{t.agreeTerms}</> : <>{t.agreeTerms} <a href={`/${locale}/terms`} style={{ color: "#22c55e" }}>{t.termsLink}</a> {t.and} <a href={`/${locale}/privacy`} style={{ color: "#22c55e" }}>{t.privacyLink}</a></>}
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="marketing" style={{ accentColor: "#22c55e", width: 16, height: 16, marginTop: 2, cursor: "pointer", flexShrink: 0 }} />
                <label htmlFor="marketing" style={{ color: "#8b949e", fontSize: 13, cursor: "pointer", lineHeight: 1.5 }}>{t.agreeMarketing}</label>
              </div>
            </div>
            <button type="submit" style={{ width: "100%", padding: "12px", backgroundColor: "#22c55e", color: "#0d1117", fontSize: 15, fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer" }}>
              {t.createAccount}
            </button>
          </form>

          <p style={{ color: "#8b949e", fontSize: 13, textAlign: "center", margin: 0 }}>
            {t.alreadyAccount}{" "}
            <a href={`/${locale}/auth/login`} style={{ color: "#22c55e", fontWeight: 600, textDecoration: "none" }}>{t.signInLink}</a>
          </p>
        </div>
      </div>
    </main>
  );
}
