"use client";

import { useState, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PointShop from "@/components/profile/PointShop";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        checked ? "bg-emerald-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  ko: {
    pageTitle:           "설정",
    pageDesc:            "계정 및 앱 설정을 관리하세요",
    account:             "계정 설정",
    nickname:            "닉네임",
    email:               "이메일",
    profileImage:        "프로필 이미지 URL",
    saveAccount:         "저장",
    saving:              "저장 중...",
    saved:               "저장됨",
    notifications:       "알림 설정",
    matchAlerts:         "경기 알림",
    matchAlertsDesc:     "경기 시작 전 푸시 알림",
    communityReplies:    "커뮤니티 댓글",
    communityRepliesDesc:"내 게시글에 댓글이 달릴 때 알림",
    language:            "언어 설정",
    langKo:              "한국어",
    langEn:              "English",
    signOut:             "로그아웃",
    loginRequired:       "로그인이 필요합니다",
    loginBtn:            "로그인",
  },
  en: {
    pageTitle:           "Settings",
    pageDesc:            "Manage your account and app preferences",
    account:             "Account Settings",
    nickname:            "Username",
    email:               "Email",
    profileImage:        "Profile Image URL",
    saveAccount:         "Save",
    saving:              "Saving...",
    saved:               "Saved",
    notifications:       "Notification Preferences",
    matchAlerts:         "Match Alerts",
    matchAlertsDesc:     "Push notifications before matches start",
    communityReplies:    "Community Replies",
    communityRepliesDesc:"Notify when someone replies to my post",
    language:            "Language Settings",
    langKo:              "한국어",
    langEn:              "English",
    signOut:             "Sign Out",
    loginRequired:       "Please sign in to access settings",
    loginBtn:            "Sign In",
  },
} as const;

// ─── Profile type ─────────────────────────────────────────────────────────────

interface UserData {
  nickname:  string;
  email:     string;
  avatarUrl: string;
  totalPoints:       number;
  avatarBorderColor: string | null;
  titleBadge:        string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const pathname = usePathname();
  const router   = useRouter();
  const [, startTransition] = useTransition();

  const locale = (pathname.startsWith("/en") ? "en" : "ko") as "ko" | "en";
  const t = labels[locale];

  // ── Auth / profile state ─────────────────────────────────────────────────
  const [loaded,   setLoaded]   = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) { setLoaded(true); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname, avatar_url, total_points, avatar_border_color, title_badge")
          .eq("id", user.id)
          .single();

        if (!cancelled) {
          const p = profile as {
            nickname?: string;
            avatar_url?: string;
            total_points?: number;
            avatar_border_color?: string | null;
            title_badge?: string;
          } | null;
          setUserData({
            nickname:          p?.nickname           ?? "",
            email:             user.email            ?? "",
            avatarUrl:         p?.avatar_url          ?? "",
            totalPoints:       p?.total_points        ?? 0,
            avatarBorderColor: p?.avatar_border_color ?? null,
            titleBadge:        p?.title_badge          ?? "Rookie",
          });
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Account form state ───────────────────────────────────────────────────
  const [nickname,   setNickname]   = useState("");
  const [avatarUrl,  setAvatarUrl]  = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Sync local form state when userData loads
  useEffect(() => {
    if (userData) {
      setNickname(userData.nickname);
      setAvatarUrl(userData.avatarUrl);
    }
  }, [userData]);

  // ── Notification state (UI only) ─────────────────────────────────────────
  const [matchAlerts,      setMatchAlerts]      = useState(true);
  const [communityReplies, setCommunityReplies] = useState(true);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSaveAccount(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ nickname: nickname.trim(), avatar_url: avatarUrl.trim() || null })
        .eq("id", user.id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }

  function handleLanguageSwitch(lang: "ko" | "en") {
    if (lang === locale) return;
    startTransition(() => {
      const newPath = pathname.replace(/^\/(ko|en)/, `/${lang}`);
      router.push(newPath);
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────

  if (!userData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <UserIcon className="text-emerald-600 w-7 h-7" />
          </div>
          <p className="text-sm text-gray-600">{t.loginRequired}</p>
          <a
            href={`/${locale}/auth/login`}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            {t.loginBtn}
          </a>
        </div>
      </main>
    );
  }

  // ── Main settings UI ─────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
            <SettingsIcon className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{t.pageTitle}</h1>
            <p className="text-sm text-gray-500">{t.pageDesc}</p>
          </div>
        </div>

        {/* ── Account Settings ───────────────────────────────────────────── */}
        <SectionCard icon={<UserIcon />} title={t.account}>
          <form onSubmit={handleSaveAccount} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.nickname}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.email}
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.profileImage}
              </label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {nickname[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saveStatus === "saving"}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60"
              >
                {saveStatus === "saving"
                  ? t.saving
                  : saveStatus === "saved"
                  ? `✓ ${t.saved}`
                  : t.saveAccount}
              </button>
            </div>

          </form>
        </SectionCard>

        {/* ── Notification Preferences ───────────────────────────────────── */}
        <SectionCard icon={<BellIcon />} title={t.notifications}>
          <div className="flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.matchAlerts}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.matchAlertsDesc}</p>
              </div>
              <Toggle checked={matchAlerts} onChange={setMatchAlerts} />
            </div>

            <div className="h-px bg-gray-100" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.communityReplies}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.communityRepliesDesc}</p>
              </div>
              <Toggle checked={communityReplies} onChange={setCommunityReplies} />
            </div>

          </div>
        </SectionCard>

        {/* ── Point Shop ─────────────────────────────────────────────────── */}
        {userData && (
          <div id="point-shop" style={{ scrollMarginTop: 80 }}>
          <SectionCard
            icon={<span style={{ fontSize: 16 }}>🪙</span>}
            title={locale === "ko" ? "포인트 상점" : "Point Shop"}
          >
            <PointShop
              locale={locale}
              profile={{
                total_points:       userData.totalPoints,
                avatar_border_color: userData.avatarBorderColor,
                title_badge:        userData.titleBadge,
              }}
            />
          </SectionCard>
          </div>
        )}

        {/* ── Language Settings ──────────────────────────────────────────── */}
        <SectionCard icon={<GlobeIcon />} title={t.language}>
          <div className="flex gap-3">
            {(["ko", "en"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageSwitch(lang)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                  locale === lang
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {lang === "ko" ? `🇰🇷 ${t.langKo}` : `🇺🇸 ${t.langEn}`}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Sign Out ───────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <button
            onClick={handleSignOut}
            className="px-6 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 active:scale-95 transition-all"
          >
            {t.signOut}
          </button>
        </div>

      </div>
    </main>
  );
}
