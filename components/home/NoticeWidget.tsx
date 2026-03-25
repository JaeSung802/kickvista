import type { Locale } from "@/lib/i18n";
import { listNotices } from "@/lib/community/actions";

interface NoticeWidgetProps {
  locale: Locale;
}

// Returns true if a date string is within the last 48 hours
function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

export default async function NoticeWidget({ locale }: NoticeWidgetProps) {
  const notices = await listNotices(3);
  const isKo = locale === "ko";

  const t = {
    heading:  isKo ? "공지사항" : "Notice",
    readMore: isKo ? "전체 보기" : "View All",
    newLabel: isKo ? "새글" : "New",
    empty:    isKo ? "공지사항이 없습니다." : "No announcements yet.",
  };

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <span className="text-base">📢</span>
          <h3 className="text-sm font-bold text-emerald-900">{t.heading}</h3>
        </div>
        <a
          href={`/${locale}/notice`}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          {t.readMore} →
        </a>
      </div>

      {/* Notice rows */}
      <div className="divide-y divide-emerald-100">
        {notices.length === 0 ? (
          <p className="px-5 py-4 text-sm text-emerald-700">{t.empty}</p>
        ) : (
          notices.map((notice) => (
            <a
              key={notice.id}
              href={`/${locale}/community/post/${notice.id}`}
              className="flex items-center gap-2.5 px-5 py-3 hover:bg-emerald-50 transition-colors"
            >
              {/* Pin indicator */}
              {notice.isPinned && (
                <span className="text-xs shrink-0" title={isKo ? "고정" : "Pinned"}>
                  📌
                </span>
              )}

              {/* New badge */}
              {isNew(notice.createdAt) && (
                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  {t.newLabel}
                </span>
              )}

              {/* Title */}
              <span className="flex-1 text-sm font-medium text-emerald-800 line-clamp-1 min-w-0">
                {notice.title}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
