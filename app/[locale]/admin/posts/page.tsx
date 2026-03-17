import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import {
  deletePostAsAdmin,
  hidePostAsAdmin,
  restorePostAsAdmin,
} from "@/lib/admin/actions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "게시글 관리 · KickVista" : "Post Moderation · KickVista",
  };
}

type PostStatus = "all" | "visible" | "hidden" | "deleted";

interface AdminPost {
  id: string;
  title: string;
  category: string;
  authorName: string;
  likeCount: number;
  commentCount: number;
  isHidden: boolean;
  deletedAt: string | null;
  deleteReason: string | null;
  createdAt: string;
}

const PAGE_SIZE = 30;

export default async function AdminPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  const { q = "", status = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const statusFilter = status as PostStatus;

  let posts: AdminPost[] = [];
  let total = 0;

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("community_posts")
      .select(
        `id, title, category, like_count, comment_count,
         is_hidden, deleted_at, delete_reason, created_at,
         author:profiles!author_id(nickname)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (q.trim()) {
      query = query.ilike("title", `%${q.trim()}%`);
    }

    if (statusFilter === "visible") {
      query = query.eq("is_hidden", false).is("deleted_at", null);
    } else if (statusFilter === "hidden") {
      query = query.eq("is_hidden", true).is("deleted_at", null);
    } else if (statusFilter === "deleted") {
      query = query.not("deleted_at", "is", null);
    }

    query = query.range(offset, offset + PAGE_SIZE - 1);
    const { data, count } = await query;

    total = count ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posts = (data as any[] ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      authorName:
        Array.isArray(row.author)
          ? row.author[0]?.nickname ?? "—"
          : row.author?.nickname ?? "—",
      likeCount: row.like_count ?? 0,
      commentCount: row.comment_count ?? 0,
      isHidden: row.is_hidden ?? false,
      deletedAt: row.deleted_at ?? null,
      deleteReason: row.delete_reason ?? null,
      createdAt: row.created_at,
    }));
  } catch {
    // Show empty state on error
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const baseUrl = `/${loc}/admin/posts`;

  function statusBadge(post: AdminPost) {
    if (post.deletedAt) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            backgroundColor: "rgba(239,68,68,0.12)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {isKo ? "삭제됨" : "Deleted"}
        </span>
      );
    }
    if (post.isHidden) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            backgroundColor: "rgba(245,158,11,0.12)",
            color: "#f59e0b",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          {isKo ? "숨김" : "Hidden"}
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          backgroundColor: "rgba(34,197,94,0.12)",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        {isKo ? "공개" : "Visible"}
      </span>
    );
  }

  const statusOptions: { value: PostStatus; label: string }[] = [
    { value: "all", label: isKo ? "전체" : "All" },
    { value: "visible", label: isKo ? "공개" : "Visible" },
    { value: "hidden", label: isKo ? "숨김" : "Hidden" },
    { value: "deleted", label: isKo ? "삭제됨" : "Deleted" },
  ];

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #21262d",
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          padding: "28px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
            <h1 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 900, margin: 0 }}>
              {isKo ? "게시글 관리" : "Post Moderation"}
            </h1>
            <span style={{ color: "#8b949e", fontSize: 13, marginLeft: 4 }}>
              ({total.toLocaleString()})
            </span>
          </div>

          {/* Filters */}
          <form
            method="GET"
            action={baseUrl}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
          >
            <input
              name="q"
              defaultValue={q}
              placeholder={isKo ? "제목 검색..." : "Search by title..."}
              style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 7,
                color: "#e6edf3",
                fontSize: 13,
                padding: "7px 12px",
                width: 240,
                outline: "none",
              }}
            />
            <select
              name="status"
              defaultValue={statusFilter}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 7,
                color: "#e6edf3",
                fontSize: 13,
                padding: "7px 12px",
                cursor: "pointer",
              }}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                background: "#22c55e",
                color: "#0d1117",
                border: "none",
                borderRadius: 7,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isKo ? "검색" : "Search"}
            </button>
            {(q || statusFilter !== "all") && (
              <a
                href={baseUrl}
                style={{ color: "#8b949e", fontSize: 13, textDecoration: "none" }}
              >
                {isKo ? "초기화" : "Reset"}
              </a>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {posts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#8b949e",
              padding: "60px 0",
              fontSize: 14,
            }}
          >
            {isKo ? "게시글이 없습니다." : "No posts found."}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 90px 80px 80px 120px 210px",
                gap: 8,
                padding: "10px 16px",
                borderBottom: "1px solid #21262d",
                fontSize: 11,
                fontWeight: 700,
                color: "#484f58",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>{isKo ? "제목" : "Title"}</span>
              <span>{isKo ? "작성자" : "Author"}</span>
              <span>{isKo ? "카테고리" : "Category"}</span>
              <span>👍 {isKo ? "좋아요" : "Likes"}</span>
              <span>💬 {isKo ? "댓글" : "Comments"}</span>
              <span>{isKo ? "상태" : "Status"}</span>
              <span>{isKo ? "액션" : "Actions"}</span>
            </div>

            {/* Rows */}
            {posts.map((post) => {
              const deleteAction = deletePostAsAdmin.bind(null, post.id);
              const hideAction = hidePostAsAdmin.bind(null, post.id);
              const restoreAction = restorePostAsAdmin.bind(null, post.id);
              const isModerated = post.deletedAt !== null || post.isHidden;

              return (
                <div
                  key={post.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 90px 80px 80px 120px 210px",
                    gap: 8,
                    padding: "12px 16px",
                    borderBottom: "1px solid #21262d",
                    alignItems: "start",
                    opacity: post.deletedAt ? 0.55 : 1,
                  }}
                >
                  {/* Title */}
                  <div>
                    <a
                      href={`/${loc}/community/post/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#e6edf3",
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.title}
                    </a>
                    {post.deleteReason && (
                      <span style={{ color: "#8b949e", fontSize: 11 }}>
                        {isKo ? "사유: " : "Reason: "}
                        {post.deleteReason}
                      </span>
                    )}
                    <div style={{ color: "#484f58", fontSize: 11, marginTop: 2 }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Author */}
                  <div style={{ color: "#8b949e", fontSize: 12, paddingTop: 2 }}>
                    {post.authorName}
                  </div>

                  {/* Category */}
                  <div style={{ paddingTop: 2 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#8b949e",
                        backgroundColor: "#0d1117",
                        border: "1px solid #30363d",
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      {post.category}
                    </span>
                  </div>

                  {/* Likes */}
                  <div style={{ color: "#8b949e", fontSize: 13, paddingTop: 2 }}>
                    {post.likeCount}
                  </div>

                  {/* Comments */}
                  <div style={{ color: "#8b949e", fontSize: 13, paddingTop: 2 }}>
                    {post.commentCount}
                  </div>

                  {/* Status */}
                  <div style={{ paddingTop: 2 }}>{statusBadge(post)}</div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {isModerated ? (
                      /* Restore */
                      <form action={restoreAction}>
                        <button
                          type="submit"
                          style={{
                            width: "100%",
                            background: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.25)",
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {isKo ? "복원" : "Restore"}
                        </button>
                      </form>
                    ) : (
                      <>
                        {/* Hide with optional reason */}
                        <form action={hideAction} style={{ display: "flex", gap: 4 }}>
                          <input
                            name="reason"
                            placeholder={isKo ? "사유 (선택)" : "Reason (opt.)"}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              background: "#0d1117",
                              border: "1px solid #30363d",
                              borderRadius: 5,
                              color: "#e6edf3",
                              fontSize: 11,
                              padding: "4px 7px",
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245,158,11,0.25)",
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isKo ? "숨김" : "Hide"}
                          </button>
                        </form>

                        {/* Delete with optional reason */}
                        <form action={deleteAction} style={{ display: "flex", gap: 4 }}>
                          <input
                            name="reason"
                            placeholder={isKo ? "사유 (선택)" : "Reason (opt.)"}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              background: "#0d1117",
                              border: "1px solid #30363d",
                              borderRadius: 5,
                              color: "#e6edf3",
                              fontSize: 11,
                              padding: "4px 7px",
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.25)",
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isKo ? "삭제" : "Delete"}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`${baseUrl}?q=${q}&status=${statusFilter}&page=${p}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: p === currentPage ? 700 : 400,
                  backgroundColor:
                    p === currentPage ? "#22c55e" : "#161b22",
                  color: p === currentPage ? "#0d1117" : "#8b949e",
                  border: "1px solid #30363d",
                  textDecoration: "none",
                }}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
