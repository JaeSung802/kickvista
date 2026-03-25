/**
 * CommunityPreviewSection — Server Component
 *
 * Displays the top hot posts from the real community database.
 * Accepts PostListItem[] pre-fetched by the page (no internal fetch).
 * Clean row-list style — similar to Naver Sports community preview.
 */

import type { Locale } from "@/lib/i18n";
import type { PostListItem } from "@/lib/community/actions";
import type { PostCategory } from "@/lib/community/types";
import { SectionHeader } from "./HomePageContent";

interface CommunityPreviewSectionProps {
  posts: PostListItem[];
  locale: Locale;
}

// ─── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<PostCategory, { labelKo: string; labelEn: string; color: string; bg: string }> = {
  "match-discussion": { labelKo: "경기 토론",   labelEn: "Match",    color: "#059669", bg: "#ecfdf5" },
  "transfer-news":    { labelKo: "이적 뉴스",   labelEn: "Transfer", color: "#d97706", bg: "#fffbeb" },
  "tactics":          { labelKo: "전술 분석",   labelEn: "Tactics",  color: "#7c3aed", bg: "#f5f3ff" },
  "highlights":       { labelKo: "하이라이트",  labelEn: "Clips",    color: "#dc2626", bg: "#fef2f2" },
  "predictions":      { labelKo: "예측",        labelEn: "Predict",  color: "#0891b2", bg: "#ecfeff" },
  "general":          { labelKo: "일반",        labelEn: "General",  color: "#6b7280", bg: "#f9fafb" },
  "notice":           { labelKo: "공지사항",    labelEn: "Notice",   color: "#059669", bg: "#ecfdf5" },
};

function CategoryBadge({ category, locale }: { category: PostCategory; locale: Locale }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className="inline-block text-xs font-semibold rounded px-1.5 py-0.5 shrink-0"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {locale === "ko" ? meta.labelKo : meta.labelEn}
    </span>
  );
}

// ─── Post row ─────────────────────────────────────────────────────────────────

function PostRow({ post, locale }: { post: PostListItem; locale: Locale }) {
  const isKo = locale === "ko";

  return (
    <a
      href={`/${locale}/community/post/${post.id}`}
      className="flex items-start gap-3 py-3.5 px-4 hover:bg-gray-50 transition-colors group"
    >
      {/* Hot rank badge */}
      {post.isHot && (
        <span className="shrink-0 text-xs font-bold text-red-500 mt-0.5">🔥</span>
      )}

      {/* Category */}
      <CategoryBadge category={post.category} locale={locale} />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
          {post.title}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{post.authorBadge} {post.authorName}</span>
          <span>💬 {post.commentCount}</span>
          <span>👁 {post.viewCount.toLocaleString()}</span>
          <span className="ml-auto">{post.timeAgo}</span>
        </div>
      </div>
    </a>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function CommunityPreviewSection({ posts, locale }: CommunityPreviewSectionProps) {
  const isKo = locale === "ko";

  return (
    <div>
      <SectionHeader
        title={isKo ? "커뮤니티 인기 글" : "Hot Community Posts"}
        href={`/${locale}/community`}
        linkLabel={isKo ? "커뮤니티 더보기" : "View community"}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {posts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {isKo ? "아직 게시글이 없습니다" : "No posts yet — be the first!"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <PostRow key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="px-4 py-3.5 border-t border-gray-100 bg-gray-50">
          <a
            href={`/${locale}/community`}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            {isKo ? "전체 커뮤니티 보기 →" : "Browse all discussions →"}
          </a>
          <a
            href={`/${locale}/community/write`}
            className="float-right text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isKo ? "✏️ 글쓰기" : "✏️ New post"}
          </a>
        </div>
      </div>
    </div>
  );
}
