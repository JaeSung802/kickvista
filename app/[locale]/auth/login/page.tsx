import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import LoginForm, { type LoginNotice } from "@/components/auth/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  return buildMetadata({
    locale: loc,
    title: loc === "ko" ? "로그인" : "Sign In",
    description:
      loc === "ko"
        ? "킥비스타에 로그인하여 AI 분석, 커뮤니티, 출석 체크를 이용하세요."
        : "Sign in to KickVista to access AI analysis, community, and daily attendance.",
    path: "/auth/login",
    noIndex: true,
  });
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  // Only known codes are shown; anything else (older links carried Supabase's
  // message) is treated as a link that could not be completed.
  const raw = (await searchParams).error;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const notice: LoginNotice | null = !code ? null : code === "server_error" ? "server_error" : "link_invalid";
  return <LoginForm locale={locale as Locale} notice={notice} />;
}
