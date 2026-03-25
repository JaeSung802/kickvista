import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { listNotices } from "@/lib/community/actions";
import { getServerRole, isAdmin } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "공지사항 · KickVista" : "Notice · KickVista",
    description: isKo
      ? "KickVista 공식 공지사항을 확인하세요."
      : "Stay up to date with official KickVista announcements.",
  };
}

// Returns true if a date string is within the last 48 hours
function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

function formatDate(dateStr: string, locale: Locale): string {
  return new Date(dateStr).toLocaleDateString(
    locale === "ko" ? "ko-KR" : "en-GB",
    { year: "numeric", month: "2-digit", day: "2-digit" }
  );
}

export default async function NoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  const [noticesR, roleR] = await Promise.allSettled([listNotices(50), getServerRole()]);
  const notices = noticesR.status === "fulfilled" ? noticesR.value : [];
  const role    = roleR.status    === "fulfilled" ? roleR.value    : null;

  const adminUser = isAdmin(role);

  const t = {
    heading:    isKo ? "공지사항" : "Notice",
    no:         isKo ? "번호" : "No.",
    title:      isKo ? "제목" : "Title",
    date:       isKo ? "작성일" : "Date",
    views:      isKo ? "조회" : "Views",
    pinned:     isKo ? "고정" : "Pinned",
    newLabel:   isKo ? "새글" : "New",
    empty:      isKo ? "등록된 공지사항이 없습니다." : "No announcements yet.",
    writeBtn:   isKo ? "공지 작성" : "Write Notice",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 rounded-full bg-emerald-600 shrink-0" />
            <h1 className="text-xl font-bold text-gray-900">{t.heading}</h1>
          </div>

          {/* Admin-only write button */}
          {adminUser && (
            <a
              href={`/${loc}/community/write?category=notice`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.writeBtn}
            </a>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {notices.length === 0 ? (
            <div className="py-20 text-center">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-gray-400 text-sm">{t.empty}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 text-left font-semibold text-gray-500 w-16 hidden sm:table-cell">
                    {t.no}
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-gray-500">
                    {t.title}
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-500 w-20 hidden sm:table-cell">
                    {t.views}
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-500 w-36 hidden sm:table-cell">
                    {t.date}
                  </th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice, idx) => (
                  <tr
                    key={notice.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    {/* Row number — pinned rows show pin icon */}
                    <td className="py-3 px-4 text-gray-400 text-center hidden sm:table-cell">
                      {notice.isPinned ? (
                        <span title={t.pinned} className="text-emerald-600">📌</span>
                      ) : (
                        <span className="tabular-nums">{notices.length - idx}</span>
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4">
                      <a
                        href={`/${loc}/community/post/${notice.id}`}
                        className="flex items-center gap-2 text-gray-900 hover:text-emerald-700 font-medium transition-colors"
                      >
                        {isNew(notice.createdAt) && (
                          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">
                            {t.newLabel}
                          </span>
                        )}
                        <span className="line-clamp-1">{notice.title}</span>
                      </a>
                      {/* Date + views — shown below title on mobile */}
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden">
                        {formatDate(notice.createdAt, loc)} · 👁 {notice.viewCount.toLocaleString()}
                      </p>
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 text-right text-gray-400 tabular-nums text-sm hidden sm:table-cell">
                      👁 {notice.viewCount.toLocaleString()}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-right text-gray-400 tabular-nums hidden sm:table-cell">
                      {formatDate(notice.createdAt, loc)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}
