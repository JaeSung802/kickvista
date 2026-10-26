import type { Metadata } from "next";
import Link from "next/link";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";

// Transfer news is not connected to a real data source yet. The page used to
// render hard-coded sample transfers (with news outlets as sources); it now
// shows a "coming soon" notice instead, also for direct visits to the URL.

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return buildMetadata({
    locale: locale as Locale,
    title: locale === "ko" ? "이적 소식 — 준비 중" : "Transfer News — Coming soon",
    description: locale === "ko"
      ? "KickVista 이적 소식 페이지를 준비하고 있습니다."
      : "KickVista transfer news is being prepared.",
    path: "/transfers",
    noIndex: true,
  });
}

export default async function TransfersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isKo = locale === "ko";

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          data-transfers-state="coming-soon"
          className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm"
        >
          <span className="text-4xl" aria-hidden="true">🔄</span>
          <h1 className="text-xl font-black text-gray-900">{isKo ? "이적 소식" : "Transfer News"}</h1>
          <p className="text-sm font-semibold text-gray-700">
            {isKo ? "이적 소식 페이지를 준비하고 있습니다." : "We're preparing the transfer news page."}
          </p>
          <p className="max-w-md text-[13px] leading-relaxed text-gray-500">
            {isKo
              ? "확인된 이적 정보를 제공할 수 있게 되면 이 페이지에서 안내해 드리겠습니다."
              : "Confirmed transfer information will appear here once it is available."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <Link href={`/${locale}`} className="text-emerald-600 hover:text-emerald-700">
              {isKo ? "← 홈으로" : "← Home"}
            </Link>
            <Link href={`/${locale}/community`} className="text-emerald-600 hover:text-emerald-700">
              {isKo ? "커뮤니티 보기" : "Go to community"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
