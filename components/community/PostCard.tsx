"use client";

interface Category {
  labelEn: string;
  labelKo: string;
  color: string;
  bg: string;
  border: string;
}

export interface PostCardProps {
  href: string;
  title: string;
  preview: string;
  timeAgo: string;
  category: Category;
  isPinned?: boolean;
  isHot?: boolean;
  authorName: string;
  authorBadge: string;
  rankColor: string;
  upvotes: number;
  comments: number;
  views: number;
  isKo: boolean;
  imageUrl?: string | null;
}

export default function PostCard({
  href, title, preview, timeAgo, category,
  isPinned, isHot, authorName, authorBadge,
  rankColor, upvotes, comments, views, isKo, imageUrl,
}: PostCardProps) {
  return (
    <a
      href={href}
      className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-emerald-200 hover:shadow-sm transition-all duration-150 relative overflow-hidden no-underline"
    >
      {isPinned && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />
      )}

      <div className="flex gap-3">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isPinned && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  📌 {isKo ? "고정" : "PINNED"}
                </span>
              )}
              {isHot && (
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                  🔥 {isKo ? "인기" : "HOT"}
                </span>
              )}
              <span
                className="text-xs font-semibold rounded px-2 py-0.5"
                style={{ color: category.color, backgroundColor: category.bg, border: `1px solid ${category.border}` }}
              >
                {isKo ? category.labelKo : category.labelEn}
              </span>
            </div>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>

          <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2">
            {title}
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed mb-3.5 line-clamp-2">
            {preview}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 rounded-full bg-gray-100 inline-flex items-center justify-center text-xs shrink-0"
                style={{ border: `1.5px solid ${rankColor}` }}
              >
                {authorBadge}
              </span>
              <span className="text-xs font-medium text-gray-700">{authorName}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-xs text-gray-400">▲ {upvotes}</span>
              <span className="text-xs text-gray-400">💬 {comments}</span>
              <span className="text-xs text-gray-400">👁 {views.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {imageUrl && (
          <div className="shrink-0 self-start mt-1">
            <img
              src={imageUrl}
              alt=""
              className="w-20 h-16 object-cover rounded-lg border border-gray-100"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>
    </a>
  );
}
