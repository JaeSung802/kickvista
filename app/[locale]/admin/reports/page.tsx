import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { updateReportStatus } from "@/lib/community/reportActions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "신고 관리 · KickVista" : "Report Review · KickVista",
  };
}

type ReportStatusFilter = "all" | "open" | "reviewed" | "dismissed" | "actioned";
type ReportTypeFilter   = "all" | "post" | "comment";

interface ReportRow {
  id: string;
  type: "post" | "comment";
  reason: string;
  details: string | null;
  status: string;
  reporterName: string;
  targetId: string;
  targetPreview: string;
  createdAt: string;
  reviewedAt: string | null;
}

const PAGE_SIZE = 30;

const REASON_LABELS: Record<string, { en: string; ko: string }> = {
  spam:           { en: "Spam",           ko: "스팸" },
  harassment:     { en: "Harassment",     ko: "괴롭힘" },
  misinformation: { en: "Misinformation", ko: "허위 정보" },
  hate_speech:    { en: "Hate Speech",    ko: "혐오 발언" },
  illegal:        { en: "Illegal",        ko: "불법 콘텐츠" },
  other:          { en: "Other",          ko: "기타" },
};

export default async function AdminReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    type?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  const {
    status = "all",
    type   = "all",
    page   = "1",
  } = await searchParams;

  const currentPage    = Math.max(1, parseInt(page, 10) || 1);
  const offset         = (currentPage - 1) * PAGE_SIZE;
  const statusFilter   = status as ReportStatusFilter;
  const typeFilter     = type   as ReportTypeFilter;

  let reports: ReportRow[] = [];
  let total = 0;
  let openCount = 0;

  try {
    const supabase = await createClient();

    // ── fetch post reports ─────────────────────────────────────────
    const fetchPostReports = async (): Promise<ReportRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from("community_post_reports")
        .select(
          `id, reason, details, status, created_at, reviewed_at,
           reporter:profiles!reporter_id(nickname),
           post:community_posts!post_id(id, title)`
        );
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[] ?? []).map((r: any) => {
        const reporter = Array.isArray(r.reporter) ? r.reporter[0] : r.reporter;
        const post     = Array.isArray(r.post)     ? r.post[0]     : r.post;
        return {
          id:            r.id,
          type:          "post" as const,
          reason:        r.reason,
          details:       r.details ?? null,
          status:        r.status,
          reporterName:  reporter?.nickname ?? "—",
          targetId:      post?.id ?? "",
          targetPreview: post?.title ?? "—",
          createdAt:     r.created_at,
          reviewedAt:    r.reviewed_at ?? null,
        };
      });
    };

    // ── fetch comment reports ──────────────────────────────────────
    const fetchCommentReports = async (): Promise<ReportRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .from("community_comment_reports")
        .select(
          `id, reason, details, status, created_at, reviewed_at,
           reporter:profiles!reporter_id(nickname),
           comment:community_comments!comment_id(id, content, post_id)`
        );
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data } = await q;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[] ?? []).map((r: any) => {
        const reporter = Array.isArray(r.reporter) ? r.reporter[0] : r.reporter;
        const comment  = Array.isArray(r.comment)  ? r.comment[0]  : r.comment;
        return {
          id:            r.id,
          type:          "comment" as const,
          reason:        r.reason,
          details:       r.details ?? null,
          status:        r.status,
          reporterName:  reporter?.nickname ?? "—",
          targetId:      comment?.post_id ?? "",
          targetPreview: (comment?.content as string ?? "").slice(0, 80),
          createdAt:     r.created_at,
          reviewedAt:    r.reviewed_at ?? null,
        };
      });
    };

    // ── merge, filter by type, sort ────────────────────────────────
    const [postReports, commentReports] = await Promise.all([
      typeFilter !== "comment" ? fetchPostReports()    : Promise.resolve([]),
      typeFilter !== "post"    ? fetchCommentReports() : Promise.resolve([]),
    ]);

    const merged = [...postReports, ...commentReports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    total      = merged.length;
    openCount  = merged.filter((r) => r.status === "open").length;
    reports    = merged.slice(offset, offset + PAGE_SIZE);
  } catch {
    // Show empty state
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const baseUrl    = `/${loc}/admin/reports`;

  // ── status badge ────────────────────────────────────────────────
  function statusBadge(s: string) {
    const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
      open:      { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "rgba(239,68,68,0.25)",   label: isKo ? "미검토" : "Open" },
      reviewed:  { bg: "rgba(59,130,246,0.12)",   color: "#3b82f6", border: "rgba(59,130,246,0.25)",  label: isKo ? "검토됨" : "Reviewed" },
      dismissed: { bg: "rgba(139,148,158,0.12)", color: "#8b949e", border: "rgba(139,148,158,0.2)",  label: isKo ? "기각" : "Dismissed" },
      actioned:  { bg: "rgba(34,197,94,0.12)",   color: "#22c55e", border: "rgba(34,197,94,0.25)",   label: isKo ? "조치됨" : "Actioned" },
    };
    const c = cfg[s] ?? cfg.open;
    return (
      <span
        style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px",
          borderRadius: 20, whiteSpace: "nowrap",
          backgroundColor: c.bg, color: c.color,
          border: `1px solid ${c.border}`,
        }}
      >
        {c.label}
      </span>
    );
  }

  function typeBadge(t: "post" | "comment") {
    return (
      <span
        style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px",
          borderRadius: 20, whiteSpace: "nowrap",
          backgroundColor: t === "post" ? "rgba(59,130,246,0.1)" : "rgba(245,158,11,0.1)",
          color: t === "post" ? "#3b82f6" : "#f59e0b",
          border: `1px solid ${t === "post" ? "rgba(59,130,246,0.25)" : "rgba(245,158,11,0.25)"}`,
        }}
      >
        {t === "post" ? (isKo ? "게시글" : "Post") : (isKo ? "댓글" : "Comment")}
      </span>
    );
  }

  const statusOptions: { value: ReportStatusFilter; label: string }[] = [
    { value: "all",       label: isKo ? "전체" : "All" },
    { value: "open",      label: isKo ? "미검토" : "Open" },
    { value: "reviewed",  label: isKo ? "검토됨" : "Reviewed" },
    { value: "dismissed", label: isKo ? "기각" : "Dismissed" },
    { value: "actioned",  label: isKo ? "조치됨" : "Actioned" },
  ];

  const typeOptions: { value: ReportTypeFilter; label: string }[] = [
    { value: "all",     label: isKo ? "전체 유형" : "All Types" },
    { value: "post",    label: isKo ? "게시글" : "Posts" },
    { value: "comment", label: isKo ? "댓글" : "Comments" },
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: "#ef4444", flexShrink: 0 }} />
            <h1 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 900, margin: 0 }}>
              {isKo ? "신고 관리" : "Report Review"}
            </h1>
            <span style={{ color: "#8b949e", fontSize: 13, marginLeft: 4 }}>
              ({total.toLocaleString()})
            </span>
            {openCount > 0 && (
              <span
                style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 20, marginLeft: 4,
                  backgroundColor: "rgba(239,68,68,0.12)",
                  color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                {openCount} {isKo ? "미검토" : "open"}
              </span>
            )}
          </div>
          <p style={{ color: "#8b949e", fontSize: 13, margin: "0 0 16px 13px" }}>
            {isKo ? "커뮤니티 신고 내역을 검토하고 조치하세요" : "Review and action community reports"}
          </p>

          {/* Filters */}
          <form
            method="GET"
            action={baseUrl}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
          >
            <select
              name="status"
              defaultValue={statusFilter}
              style={{
                background: "#161b22", border: "1px solid #30363d",
                borderRadius: 7, color: "#e6edf3", fontSize: 13,
                padding: "7px 12px", cursor: "pointer",
              }}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={typeFilter}
              style={{
                background: "#161b22", border: "1px solid #30363d",
                borderRadius: 7, color: "#e6edf3", fontSize: 13,
                padding: "7px 12px", cursor: "pointer",
              }}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                background: "#22c55e", color: "#0d1117", border: "none",
                borderRadius: 7, padding: "7px 16px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              {isKo ? "필터" : "Filter"}
            </button>
            {(statusFilter !== "all" || typeFilter !== "all") && (
              <a href={baseUrl} style={{ color: "#8b949e", fontSize: 13, textDecoration: "none" }}>
                {isKo ? "초기화" : "Reset"}
              </a>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {reports.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8b949e", padding: "60px 0", fontSize: 14 }}>
            {isKo ? "신고 내역이 없습니다." : "No reports found."}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#161b22", border: "1px solid #30363d",
              borderRadius: 10, overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 70px 2fr 90px 90px 80px 220px",
                gap: 8, padding: "10px 16px",
                borderBottom: "1px solid #21262d",
                fontSize: 11, fontWeight: 700, color: "#484f58",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}
            >
              <span>{isKo ? "유형" : "Type"}</span>
              <span>{isKo ? "사유" : "Reason"}</span>
              <span>{isKo ? "대상 콘텐츠" : "Content"}</span>
              <span>{isKo ? "신고자" : "Reporter"}</span>
              <span>{isKo ? "상태" : "Status"}</span>
              <span>{isKo ? "날짜" : "Date"}</span>
              <span>{isKo ? "액션" : "Actions"}</span>
            </div>

            {/* Rows */}
            {reports.map((r) => {
              const markReviewed  = updateReportStatus.bind(null, r.id, r.type, "reviewed");
              const markDismissed = updateReportStatus.bind(null, r.id, r.type, "dismissed");
              const markActioned  = updateReportStatus.bind(null, r.id, r.type, "actioned");
              const markOpen      = updateReportStatus.bind(null, r.id, r.type, "open");

              const reasonLabel =
                REASON_LABELS[r.reason]?.[isKo ? "ko" : "en"] ?? r.reason;

              return (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 70px 2fr 90px 90px 80px 220px",
                    gap: 8, padding: "12px 16px",
                    borderBottom: "1px solid #21262d",
                    alignItems: "start",
                    backgroundColor: r.status === "open" ? "rgba(239,68,68,0.02)" : "transparent",
                  }}
                >
                  {/* Type */}
                  <div style={{ paddingTop: 2 }}>{typeBadge(r.type)}</div>

                  {/* Reason */}
                  <div style={{ color: "#c9d1d9", fontSize: 12, paddingTop: 3 }}>
                    {reasonLabel}
                  </div>

                  {/* Target content */}
                  <div>
                    {r.targetId ? (
                      <a
                        href={`/${loc}/community/post/${r.targetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#3b82f6", fontSize: 12, textDecoration: "none",
                          display: "block", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                      >
                        {r.targetPreview || "—"}
                      </a>
                    ) : (
                      <span style={{ color: "#8b949e", fontSize: 12 }}>{r.targetPreview || "—"}</span>
                    )}
                    {r.details && (
                      <p
                        style={{
                          color: "#8b949e", fontSize: 11, margin: "3px 0 0",
                          fontStyle: "italic",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        &ldquo;{r.details}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Reporter */}
                  <div style={{ color: "#8b949e", fontSize: 12, paddingTop: 3 }}>
                    {r.reporterName}
                  </div>

                  {/* Status */}
                  <div style={{ paddingTop: 2 }}>{statusBadge(r.status)}</div>

                  {/* Date */}
                  <div style={{ color: "#484f58", fontSize: 11, paddingTop: 3 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                    {r.reviewedAt && (
                      <div style={{ marginTop: 2 }}>
                        ✓ {new Date(r.reviewedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {r.status !== "reviewed" && (
                      <form action={markReviewed}>
                        <button
                          type="submit"
                          style={{
                            background: "rgba(59,130,246,0.1)", color: "#3b82f6",
                            border: "1px solid rgba(59,130,246,0.25)", borderRadius: 5,
                            padding: "4px 8px", fontSize: 11, fontWeight: 600,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {isKo ? "검토됨" : "Reviewed"}
                        </button>
                      </form>
                    )}
                    {r.status !== "actioned" && (
                      <form action={markActioned}>
                        <button
                          type="submit"
                          style={{
                            background: "rgba(34,197,94,0.1)", color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.25)", borderRadius: 5,
                            padding: "4px 8px", fontSize: 11, fontWeight: 600,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {isKo ? "조치됨" : "Actioned"}
                        </button>
                      </form>
                    )}
                    {r.status !== "dismissed" && (
                      <form action={markDismissed}>
                        <button
                          type="submit"
                          style={{
                            background: "rgba(139,148,158,0.08)", color: "#8b949e",
                            border: "1px solid rgba(139,148,158,0.2)", borderRadius: 5,
                            padding: "4px 8px", fontSize: 11, fontWeight: 600,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {isKo ? "기각" : "Dismiss"}
                        </button>
                      </form>
                    )}
                    {r.status !== "open" && (
                      <form action={markOpen}>
                        <button
                          type="submit"
                          style={{
                            background: "rgba(239,68,68,0.08)", color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5,
                            padding: "4px 8px", fontSize: 11, fontWeight: 600,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          {isKo ? "재개" : "Reopen"}
                        </button>
                      </form>
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
              display: "flex", justifyContent: "center",
              gap: 8, marginTop: 24, flexWrap: "wrap",
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`${baseUrl}?status=${statusFilter}&type=${typeFilter}&page=${p}`}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34, borderRadius: 7, fontSize: 13,
                  fontWeight: p === currentPage ? 700 : 400,
                  backgroundColor: p === currentPage ? "#22c55e" : "#161b22",
                  color: p === currentPage ? "#0d1117" : "#8b949e",
                  border: "1px solid #30363d", textDecoration: "none",
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
