import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import SignupForm from "@/components/auth/SignupForm";

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
    title: loc === "ko" ? "회원가입" : "Create Account",
    description:
      loc === "ko"
        ? "킥비스타에 가입하고 AI 경기 분석, 커뮤니티, 출석 체크를 무료로 이용하세요."
        : "Join KickVista for free to access AI match analysis, community discussions, and daily attendance rewards.",
    path: "/auth/signup",
    noIndex: true,
  });
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <SignupForm locale={locale as Locale} />;
}
