import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdAnchor from "@/components/ads/AdAnchor";
import SettlementModal from "@/components/notifications/SettlementModal";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { getServerUser, loadServerProfile, ensureProfile, type ProfileLoad } from "@/lib/auth";
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kickvista.com";
  return {
    title: {
      default: isKo ? "킥비스타 – 축구 인텔리전스 허브" : "KickVista – Football Intelligence Hub",
      template: isKo ? "%s | 킥비스타" : "%s | KickVista",
    },
    description: isKo
      ? "라이브 스코어, 순위표, AI 경기 분석 — 모든 주요 리그를 한 곳에서"
      : "Live scores, standings & AI match analysis for Premier League, La Liga, Bundesliga, Serie A, and more.",
    icons: {
      icon: "/icon.svg",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      siteName: "KickVista",
      images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${baseUrl}/og-default.png`],
    },
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

  // Run getDictionary and getServerUser in parallel — neither depends on the other
  const [, supabaseUser] = await Promise.all([
    getDictionary(locale as Locale),
    getServerUser(),
  ]);
  let navUser: {
    nickname: string;
    points: number | null;
    rankBadge: string;
    avatarUrl?: string;
    avatarBorderColor?: string;
    titleBadge?: string;
  } | null = null;

  if (supabaseUser) {
    // A signed-in user without a profile row (e.g. an e-mail sign-up whose
    // confirmation link was opened in another browser) gets one here instead
    // of being shown as signed out.
    let load: ProfileLoad = await loadServerProfile(supabaseUser.id);
    if (load.status === "missing" && (await ensureProfile(supabaseUser)) === "created") {
      load = await loadServerProfile(supabaseUser.id);
    }
    if (load.status === "ok") {
      const profile = load.profile;
      const rank = getRank(profile.total_points);
      navUser = {
        nickname: profile.nickname,
        points: profile.total_points,
        rankBadge: rank.badge,
        avatarUrl: profile.avatar_url ?? undefined,
        avatarBorderColor: profile.avatar_border_color ?? undefined,
        titleBadge: profile.title_badge ?? undefined,
      };
    } else {
      // Still signed in: show the account menu (sign-out works) without points.
      const meta = supabaseUser.user_metadata?.nickname;
      navUser = {
        nickname: typeof meta === "string" && meta.trim() ? meta.trim() : (supabaseUser.email?.split("@")[0] ?? "—"),
        points: null,
        rankBadge: getRank(0).badge,
      };
    }
  }

  return (
    <>
      <Navbar locale={locale as Locale} user={navUser} />
      {/*
       * No fixed bottom padding here: AdAnchor reserves its own measured height
       * after the footer, so it never covers the footer or the last content.
       */}
      <div className="bg-gray-50 min-h-screen">
        {children}
      </div>
      <Footer locale={locale as Locale} />
      {/* Settlement notification — renders null on server, checks for wins on client */}
      {supabaseUser && <SettlementModal locale={locale as Locale} />}
      {/* Mobile sticky anchor ad — reads NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR internally */}
      <AdAnchor />
    </>
  );
}
