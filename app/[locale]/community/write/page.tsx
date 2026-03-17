import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getServerUser, getServerProfile } from "@/lib/auth";
import WritePostForm from "@/components/community/WritePostForm";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const isKo = locale === "ko";
  return {
    title: isKo ? "글쓰기 · KickVista" : "Write Post · KickVista",
    description: isKo
      ? "KickVista 커뮤니티에 글을 작성하세요"
      : "Share your football thoughts with the KickVista community",
  };
}

export default async function WritePostPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ team?: string; league?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) notFound();
  const loc      = locale as Locale;
  const isKo     = loc === "ko";
  const teamSlug   = sp.team   ?? null;
  const leagueSlug = sp.league ?? null;

  const user    = await getServerUser();
  const profile = user ? await getServerProfile(user.id) : null;

  const nickname = profile?.nickname ?? user?.email?.split("@")[0] ?? "fan";
  const badge    = "🥉"; // default badge; real rank system can enrich later

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>

      {/* Page header */}
      <div
        style={{
          borderBottom: "1px solid #21262d",
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
        }}
        className="py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 14 }}>
            <a href={`/${loc}/community`} style={{ color: "#8b949e", textDecoration: "none" }}>
              {isKo ? "커뮤니티" : "Community"}
            </a>
            <span style={{ color: "#30363d" }}>›</span>
            <span style={{ color: "#e6edf3" }}>
              {isKo ? "글쓰기" : "Write Post"}
            </span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 24, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
            <h1 style={{ color: "#e6edf3", fontSize: 24, fontWeight: 900, margin: 0 }}>
              {isKo ? "글쓰기" : "Write a Post"}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          /* Not logged in — show gated message */
          <div
            style={{
              maxWidth: 480, margin: "0 auto",
              backgroundColor: "#161b22", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 14, padding: "40px 32px", textAlign: "center",
              background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34,197,94,0.06) 0%, #161b22 70%)",
            }}
          >
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>⚽</span>
            <h2 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 800, margin: "0 0 10px" }}>
              {isKo ? "로그인이 필요합니다" : "Sign in to write a post"}
            </h2>
            <p style={{ color: "#8b949e", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              {isKo
                ? "KickVista 커뮤니티에 게시글을 작성하려면 로그인하세요."
                : "Join the KickVista community to share your football analysis, opinions, and news."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`/${loc}/auth/login`}
                style={{
                  display: "inline-block", padding: "10px 24px",
                  backgroundColor: "#22c55e", color: "#0d1117",
                  fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none",
                }}
              >
                {isKo ? "로그인" : "Sign In"}
              </a>
              <a
                href={`/${loc}/auth/signup`}
                style={{
                  display: "inline-block", padding: "10px 24px",
                  backgroundColor: "transparent", color: "#8b949e",
                  fontSize: 14, fontWeight: 600, borderRadius: 8, textDecoration: "none",
                  border: "1px solid #30363d",
                }}
              >
                {isKo ? "회원가입" : "Create Account"}
              </a>
            </div>
          </div>
        ) : (
          /* Logged in — show write form */
          <WritePostForm
            locale={loc}
            userNickname={nickname}
            userBadge={badge}
            teamSlug={teamSlug}
            leagueSlug={leagueSlug}
            backHref={teamSlug ? `/${loc}/team/${teamSlug}/community` : undefined}
          />
        )}
      </div>
    </main>
  );
}
