import { Fragment } from "react";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";
import { getServerUser } from "@/lib/auth";
import AdBanner from "@/components/ads/AdBanner";
import AdInContent from "@/components/ads/AdInContent";
import PostActions from "@/components/community/PostActions";
import PostOwnerMenu from "@/components/community/PostOwnerMenu";
import PostViewTracker from "@/components/community/PostViewTracker";
import { getServerRole, isAdmin } from "@/lib/admin/roles";
import CommentSection from "@/components/community/CommentSection";
import { getPost, listPosts, listComments } from "@/lib/community/actions";
import { isNewsBotPost, splitNewsSource, isStaleNewsPost } from "@/lib/community/newsbot";
import type { PostCategory } from "@/lib/community/types";
import type { Metadata } from "next";

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  PostCategory,
  { labelEn: string; labelKo: string; color: string; bg: string }
> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",  color: "#059669", bg: "rgba(34,197,94,0.1)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트", color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",       color: "#06b6d4", bg: "rgba(6,182,212,0.1)"   },
  "general":          { labelEn: "General",          labelKo: "일반",       color: "#8b949e", bg: "rgba(139,148,158,0.1)" },
  "notice":           { labelEn: "Notice",           labelKo: "공지사항",   color: "#059669", bg: "rgba(22,163,74,0.08)"  },
  "worldcup-2026":    { labelEn: "2026 World Cup",   labelKo: "2026 월드컵", color: "#dc2626", bg: "rgba(220,38,38,0.08)"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "ko" ? "ko-KR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );
}

/** Registration date of a post on KickVista, always in KST (not the source article's date). */
function formatRegisteredDateKST(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "ko" ? "ko-KR" : "en-GB",
    { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }
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

  const [userR, postR] = await Promise.allSettled([getServerUser(), getPost(id)]);
  const user = userR.status === "fulfilled" ? userR.value : null;
  const post = postR.status === "fulfilled" ? postR.value : null;
  if (!post) notFound();
  const isLoggedIn = !!user;
  // Edit / delete: the author only, and notices also need the admin role
  // (the server actions and RLS check the same again).
  const isAuthor = !!user && user.id === post.authorId && !post.isRemoved;
  const canManage = isAuthor && (post.category !== "notice" || isAdmin(await getServerRole()));

  const [commentsR, relatedR] = await Promise.allSettled([
    listComments(id),
    listPosts({ category: post.category, limit: 3, excludeId: id }),
  ]);
  const initialComments = commentsR.status === "fulfilled" ? commentsR.value : [];
  const relatedPosts    = relatedR.status  === "fulfilled" ? relatedR.value.posts : [];

  const catMeta  = CATEGORY_META[post.category] ?? CATEGORY_META["general"];
  const catLabel = isKo ? catMeta.labelKo : catMeta.labelEn;
  // News-bot post: label, registration date, 30-day notice and a clickable source
  // link (display only — the stored title and body are not changed).
  const isBot   = isNewsBotPost(post);
  const news    = isBot ? splitNewsSource(post.content) : null;
  const isStale = isBot && isStaleNewsPost(post.createdAt);
  const paragraphs = (news ? news.body : post.content).split("\n\n").filter(Boolean);
  // Notices read as one announcement: no ads between their paragraphs
  // (the banner after the content and the site-wide ads stay).
  const showInContentAds = post.category !== "notice";

  return (
    <>
    <style>{`.kv-related-post:hover { border-color: rgba(34,197,94,0.2) !important; background-color: #ecfdf5 !important; }`}</style>
    <main className="min-h-screen">
      <PostViewTracker key={post.id} postId={post.id} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexWrap: "wrap" }}>
          <a href={`/${loc}/community`} style={{ color: "#6b7280", textDecoration: "none" }}>
            {isKo ? "커뮤니티" : "Community"}
          </a>
          <span style={{ color: "#d1d5db" }}>›</span>
          <a
            href={`/${loc}/community?category=${post.category}`}
            style={{ color: catMeta.color, textDecoration: "none" }}
          >
            {catLabel}
          </a>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span
            style={{
              color: "#374151", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240,
            }}
          >
            {post.title}
          </span>
        </nav>

        {/* Post article */}
        <article
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Category colour accent */}
          <div style={{ height: 3, backgroundColor: catMeta.color }} />

          <div style={{ padding: "24px 28px" }}>
            {/* Category + badges (+ author menu) */}
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
              {canManage && (
                <div style={{ marginLeft: "auto" }}>
                  <PostOwnerMenu postId={post.id} category={post.category} locale={loc} />
                </div>
              )}
            </div>

            {/* Title */}
            <h1 style={{ color: "#111827", fontSize: 22, fontWeight: 800, margin: "0 0 20px", lineHeight: 1.4 }}>
              {post.title}
            </h1>

            {/* Author + stats */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 12,
                paddingTop: 16, borderTop: "1px solid #f3f4f6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    backgroundColor: "#f9fafb",
                    border: `2px solid ${post.rankColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}
                >
                  {post.authorBadge}
                </div>
                <div>
                  <div style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>{post.authorName}</div>
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
                <span style={{ color: "#6b7280", fontSize: 12 }}>{formatDate(post.createdAt, loc)}</span>
                <span style={{ color: "#6b7280", fontSize: 12 }}>👁 {post.viewCount.toLocaleString()}</span>
                <span style={{ color: "#6b7280", fontSize: 12 }}>💬 {post.commentCount}</span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          {post.imageUrl && (
            <div style={{ padding: "0 28px 4px" }}>
              <img
                src={post.imageUrl}
                alt={post.title}
                style={{
                  width: "100%", maxHeight: 360, objectFit: "cover",
                  borderRadius: 10, border: "1px solid #f3f4f6",
                }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Post body */}
          <div style={{ padding: "0 28px 28px", borderTop: "1px solid #f3f4f6" }}>
            <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {isBot && (
                <div
                  data-newsbot-label=""
                  style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 14px",
                    borderRadius: 10, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4338ca", backgroundColor: "#eef2ff",
                      border: "1px solid #c7d2fe", borderRadius: 4, padding: "2px 8px" }}>
                      {isKo ? "자동 수집 · AI 생성 요약" : "Auto-collected · AI-generated summary"}
                    </span>
                    <span data-newsbot-registered={post.createdAt} style={{ fontSize: 12, color: "#64748b" }}>
                      {isKo ? "게시물 등록일 " : "Posted on KickVista "}{formatRegisteredDateKST(post.createdAt, loc)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                    {isKo
                      ? "기사를 바탕으로 자동 생성된 요약이라 원문과 다를 수 있습니다. 등록일은 원문 기사의 발행일이 아닙니다."
                      : "This summary was generated automatically from a news article and may differ from it. The date above is when it was posted here, not when the article was published."}
                  </p>
                  {isStale && (
                    <p data-newsbot-stale="" role="note" style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#b45309", lineHeight: 1.6 }}>
                      {isKo
                        ? "등록된 지 30일 이상 지난 게시물입니다. 현재 상황은 원문과 최신 보도를 확인해 주세요."
                        : "This post was published more than 30 days ago. Please check the original article and the latest reports for the current situation."}
                    </p>
                  )}
                </div>
              )}
              {paragraphs.map((para, idx) => (
                <Fragment key={idx}>
                  <p style={{ color: "#374151", fontSize: 15, lineHeight: 1.85, margin: 0 }}>
                    {para}
                  </p>
                  {/* In-content ad after paragraph 1 — only if article is long enough */}
                  {showInContentAds && idx === 0 && paragraphs.length > 2 && (
                    <AdInContent
                      slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "2222222222"}
                    />
                  )}
                  {/* In-content ad after paragraph 3 */}
                  {showInContentAds && idx === 2 && paragraphs.length > 4 && (
                    <AdInContent
                      slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT ?? "2222222222"}
                    />
                  )}
                </Fragment>
              ))}
              {news && (
                <div data-newsbot-source={news.source.kind} style={{ fontSize: 14 }}>
                  {news.source.kind === "ok" ? (
                    <a
                      href={news.source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      style={{ color: "#059669", fontWeight: 700, textDecoration: "underline" }}
                    >
                      {isKo ? "기사 원문 보기" : "Read the original article"} ↗
                    </a>
                  ) : (
                    <span style={{ color: "#6b7280" }}>
                      {isKo ? "원문 링크를 확인할 수 없습니다." : "The original article link is not available."}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div
              style={{
                padding: "14px 28px", borderTop: "1px solid #f3f4f6",
                display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
              }}
            >
              <span style={{ color: "#6b7280", fontSize: 12, marginRight: 4 }}>
                {isKo ? "태그:" : "Tags:"}
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11, fontWeight: 600, color: "#6b7280",
                    backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
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
            <h2 style={{ color: "#111827", fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>
              {isKo ? "관련 게시글" : "Related Posts"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {relatedPosts.map((rp) => {
                const rpCat = CATEGORY_META[rp.category] ?? CATEGORY_META["general"];
                return (
                  <a
                    key={rp.id}
                    href={`/${loc}/community/post/${rp.id}`}
                    className="kv-related-post"
                    style={{
                      display: "block", backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb", borderRadius: 10,
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
                      <span style={{ color: "#6b7280", fontSize: 11 }}>👁 {rp.viewCount.toLocaleString()}</span>
                      <span style={{ color: "#6b7280", fontSize: 11 }}>💬 {rp.commentCount}</span>
                    </div>
                    <div style={{ color: "#111827", fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>
                      {rp.title}
                    </div>
                    <div
                      style={{
                        color: "#6b7280", fontSize: 12, lineHeight: 1.5,
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
          currentUserId={user?.id ?? null}
        />

        {/* Back link */}
        <a
          href={`/${loc}/community`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "#6b7280", fontSize: 13, textDecoration: "none",
          }}
        >
          ← {isKo ? "커뮤니티로 돌아가기" : "Back to Community"}
        </a>
      </div>
    </main>
    </>
  );
}
