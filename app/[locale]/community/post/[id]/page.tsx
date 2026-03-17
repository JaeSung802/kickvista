import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { getServerUser } from "@/lib/auth";
import AdBanner from "@/components/ads/AdBanner";
import AdInContent from "@/components/ads/AdInContent";
import PostActions from "@/components/community/PostActions";
import CommentSection from "@/components/community/CommentSection";
import { getPost, listPosts, listComments } from "@/lib/community/actions";
import type { PostCategory } from "@/lib/community/types";
import type { Metadata } from "next";

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  PostCategory,
  { labelEn: string; labelKo: string; color: string; bg: string }
> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",  color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트", color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",       color: "#06b6d4", bg: "rgba(6,182,212,0.1)"   },
  "general":          { labelEn: "General",          labelKo: "일반",       color: "#8b949e", bg: "rgba(139,148,158,0.1)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "ko" ? "ko-KR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) return {};
  const loc  = locale as Locale;
  const post = await getPost(id);
  if (!post) return {};
  return buildMetadata({
    locale: loc,
    title: post.title,
    description: post.content.slice(0, 160).replace(/\n+/g, " "),
    path: `/community/post/${id}`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc  = locale as Locale;
  const isKo = loc === "ko";

  const [user, post] = await Promise.all([getServerUser(), getPost(id)]);
  if (!post) notFound();
  const isLoggedIn = !!user;

  const [initialComments, relatedResult] = await Promise.all([
    listComments(id),
    listPosts({ category: post.category, limit: 3, excludeId: id }),
  ]);
  const relatedPosts = relatedResult.posts;

  const catMeta  = CATEGORY_META[post.category];
  const catLabel = isKo ? catMeta.labelKo : catMeta.labelEn;
  const paragraphs = post.content.split("\n\n").filter(Boolean);

  return (
    <>
    <style>{`.kv-related-post:hover { border-color: rgba(34,197,94,0.2) !important; background-color: #1c2128 !important; }`}</style>
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexWrap: "wrap" }}>
          <a href={`/${loc}/community`} style={{ color: "#8b949e", textDecoration: "none" }}>
            {isKo ? "커뮤니티" : "Community"}
          </a>
          <span style={{ color: "#30363d" }}>›</span>
          <a
            href={`/${loc}/community?category=${post.category}`}
            style={{ color: catMeta.color, textDecoration: "none" }}
          >
            {catLabel}
          </a>
          <span style={{ color: "#30363d" }}>›</span>
          <span
            style={{
              color: "#c9d1d9", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240,
            }}
          >
            {post.title}
          </span>
        </nav>

        {/* Post article */}
        <article
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Category colour accent */}
          <div style={{ height: 3, backgroundColor: catMeta.color }} />

          <div style={{ padding: "24px 28px" }}>
            {/* Category + badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11, fontWeight: 600, color: catMeta.color,
                  backgroundColor: catMeta.bg, border: `1px solid ${catMeta.color}40`,
                  borderRadius: 5, padding: "3px 10px",
                }}
              >
                {catLabel}
              </span>
              {post.isPinned && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b",
                  backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 4, padding: "2px 8px" }}>
                  📌 {isKo ? "고정" : "PINNED"}
                </span>
              )}
              {post.isHot && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444",
                  backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 4, padding: "2px 8px" }}>
                  🔥 {isKo ? "인기" : "HOT"}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ color: "#e6edf3", fontSize: 22, fontWeight: 800, margin: "0 0 20px", lineHeight: 1.4 }}>
              {post.title}
            </h1>

            {/* Author + stats */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
                paddingTop: 16, borderTop: "1px solid #21262d",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    backgroundColor: "#0d1117",
                    border: `2px solid ${post.rankColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}
                >
                  {post.authorBadge}
                </div>
                <div>
                  <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>{post.authorName}</div>
                  <div
                    style={{
                      fontSize: 10, fontWeight: 700, color: post.rankColor,
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}
                  >
                    {post.rankTier}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ color: "#8b949e", fontSize: 12 }}>{formatDate(post.createdAt, loc)}</span>
                <span style={{ color: "#8b949e", fontSize: 12 }}>👁 {post.viewCount.toLocaleString()}</span>
                <span style={{ color: "#8b949e", fontSize: 12 }}>💬 {post.commentCount}</span>
              </div>
            </div>
          </div>

          {/* Post body */}
          <div style={{ padding: "0 28px 28px", borderTop: "1px solid #21262d" }}>
            <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {paragraphs.map((para, idx) => (
                <>
                  <p key={idx} style={{ color: "#c9d1d9", fontSize: 15, lineHeight: 1.85, margin: 0 }}>
                    {para}
                  </p>
                  {/* In-content ad after paragraph 1 — only if article is long enough */}
                  {idx === 0 && paragraphs.length > 2 && (
                    <AdInContent
                      key="ad-after-p1"
                      slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "2222222222"}
                    />
                  )}
                  {/* In-content ad after paragraph 3 */}
                  {idx === 2 && paragraphs.length > 4 && (
                    <AdInContent
                      key="ad-after-p3"
                      slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "2222222222"}
                    />
                  )}
                </>
              ))}
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div
              style={{
                padding: "14px 28px", borderTop: "1px solid #21262d",
                display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
              }}
            >
              <span style={{ color: "#8b949e", fontSize: 12, marginRight: 4 }}>
                {isKo ? "태그:" : "Tags:"}
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11, fontWeight: 600, color: "#8b949e",
                    backgroundColor: "#0d1117", border: "1px solid #30363d",
                    borderRadius: 5, padding: "3px 10px",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post-end banner — after content, before actions */}
          <div style={{ padding: "0 28px 20px" }}>
            <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? "0000000000"} />
          </div>

          {/* PostActions — interactive like / bookmark / share / report */}
          <PostActions
            postId={post.id}
            likeCount={post.likeCount}
            isLikedByUser={post.isLikedByUser}
            isLoggedIn={isLoggedIn}
            locale={loc}
          />
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h2 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>
              {isKo ? "관련 게시글" : "Related Posts"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {relatedPosts.map((rp) => {
                const rpCat = CATEGORY_META[rp.category];
                return (
                  <a
                    key={rp.id}
                    href={`/${loc}/community/post/${rp.id}`}
                    className="kv-related-post"
                    style={{
                      display: "block", backgroundColor: "#161b22",
                      border: "1px solid #30363d", borderRadius: 10,
                      padding: "14px 18px", textDecoration: "none",
                      transition: "border-color 0.15s, background-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 600, color: rpCat.color,
                          backgroundColor: rpCat.bg, border: `1px solid ${rpCat.color}40`,
                          borderRadius: 4, padding: "2px 8px",
                        }}
                      >
                        {isKo ? rpCat.labelKo : rpCat.labelEn}
                      </span>
                      <span style={{ color: "#8b949e", fontSize: 11 }}>👁 {rp.viewCount.toLocaleString()}</span>
                      <span style={{ color: "#8b949e", fontSize: 11 }}>💬 {rp.commentCount}</span>
                    </div>
                    <div style={{ color: "#e6edf3", fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>
                      {rp.title}
                    </div>
                    <div
                      style={{
                        color: "#8b949e", fontSize: 12, lineHeight: 1.5,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                      }}
                    >
                      {rp.preview}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Comments — full interactive section */}
        <CommentSection
          postId={post.id}
          commentCount={post.commentCount}
          locale={loc}
          isLoggedIn={isLoggedIn}
          userBadge={isLoggedIn ? "🥉" : undefined}
          initialComments={initialComments}
        />

        {/* Back link */}
        <a
          href={`/${loc}/community`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "#8b949e", fontSize: 13, textDecoration: "none",
          }}
        >
          ← {isKo ? "커뮤니티로 돌아가기" : "Back to Community"}
        </a>
      </div>
    </main>
    </>
  );
}
