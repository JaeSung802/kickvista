import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { getRank } from "@/lib/ranks";

export async function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: {
      default: isKo ? "킥비스타 – 축구 인텔리전스 허브" : "KickVista – Football Intelligence Hub",
      template: isKo ? "%s | 킥비스타" : "%s | KickVista",
    },
    description: isKo
      ? "라이브 스코어, 순위표, AI 경기 분석 — 모든 주요 리그를 한 곳에서"
      : "Live scores, standings & AI match analysis for Premier League, La Liga, Bundesliga, Serie A, and more.",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  // Fetch authenticated user — returns null when Supabase is not configured
  const supabaseUser = await getServerUser();
  let navUser: {
    nickname: string;
    points: number;
    rankBadge: string;
    avatarUrl?: string;
  } | null = null;

  if (supabaseUser) {
    const profile = await getServerProfile(supabaseUser.id);
    if (profile) {
      const rank = getRank(profile.total_points);
      navUser = {
        nickname: profile.nickname,
        points: profile.total_points,
        rankBadge: rank.badge,
        avatarUrl: profile.avatar_url ?? undefined,
      };
    }
  }

  return (
    <>
      <Navbar locale={locale as Locale} user={navUser} />
      <div style={{ background: "#0d1117", minHeight: "100vh" }}>
        {children}
      </div>
      <Footer locale={locale as Locale} />
    </>
  );
}
