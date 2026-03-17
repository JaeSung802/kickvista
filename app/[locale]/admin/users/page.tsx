import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/auth";
import { getServerRole, isAdmin } from "@/lib/admin/roles";
import { updateUserRole, toggleUserBan } from "@/lib/admin/actions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "사용자 관리 · KickVista" : "User Management · KickVista",
  };
}

interface AdminUser {
  id: string;
  nickname: string;
  role: string;
  isBanned: boolean;
  totalPoints: number;
  createdAt: string;
}

const PAGE_SIZE = 40;

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  // Extra guard: users page is admin-only
  const currentUser = await getServerUser();
  if (!currentUser) redirect(`/${loc}/auth/login`);

  const role = await getServerRole();
  if (!isAdmin(role)) redirect(`/${loc}/admin`);

  const { q = "", role: roleFilter = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let users: AdminUser[] = [];
  let total = 0;

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("profiles")
      .select("id, nickname, role, is_banned, total_points, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (q.trim()) {
      query = query.ilike("nickname", `%${q.trim()}%`);
    }
    if (roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    query = query.range(offset, offset + PAGE_SIZE - 1);
    const { data, count } = await query;

    total = count ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users = (data as any[] ?? []).map((row: any) => ({
      id: row.id,
      nickname: row.nickname ?? "—",
      role: row.role ?? "user",
      isBanned: row.is_banned ?? false,
      totalPoints: row.total_points ?? 0,
      createdAt: row.created_at,
    }));
  } catch {
    // Show empty state
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const baseUrl = `/${loc}/admin/users`;

  const roleOptions = [
    { value: "all", label: isKo ? "전체 역할" : "All Roles" },
    { value: "user", label: isKo ? "일반 사용자" : "User" },
    { value: "moderator", label: isKo ? "모더레이터" : "Moderator" },
    { value: "admin", label: isKo ? "관리자" : "Admin" },
  ];

  function roleBadge(userRole: string) {
    const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
      admin: {
        bg: "rgba(34,197,94,0.12)",
        color: "#22c55e",
        border: "rgba(34,197,94,0.25)",
        label: isKo ? "관리자" : "Admin",
      },
      moderator: {
        bg: "rgba(59,130,246,0.12)",
        color: "#3b82f6",
        border: "rgba(59,130,246,0.25)",
        label: isKo ? "모더레이터" : "Mod",
      },
      user: {
        bg: "rgba(139,148,158,0.12)",
        color: "#8b949e",
        border: "rgba(139,148,158,0.2)",
        label: isKo ? "사용자" : "User",
      },
    };
    const s = styles[userRole] ?? styles.user;
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          backgroundColor: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
          whiteSpace: "nowrap",
        }}
      >
        {s.label}
      </span>
    );
  }

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
              {isKo ? "사용자 관리" : "User Management"}
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
              placeholder={isKo ? "닉네임 검색..." : "Search by nickname..."}
              style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 7,
                color: "#e6edf3",
                fontSize: 13,
                padding: "7px 12px",
                width: 220,
                outline: "none",
              }}
            />
            <select
              name="role"
              defaultValue={roleFilter}
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
              {roleOptions.map((o) => (
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
            {(q || roleFilter !== "all") && (
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
        {users.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#8b949e",
              padding: "60px 0",
              fontSize: 14,
            }}
          >
            {isKo ? "사용자가 없습니다." : "No users found."}
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
                gridTemplateColumns: "1.5fr 110px 90px 80px 90px 280px",
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
              <span>{isKo ? "닉네임" : "Nickname"}</span>
              <span>{isKo ? "역할" : "Role"}</span>
              <span>{isKo ? "차단 여부" : "Ban"}</span>
              <span>{isKo ? "포인트" : "Points"}</span>
              <span>{isKo ? "가입일" : "Joined"}</span>
              <span>{isKo ? "관리" : "Manage"}</span>
            </div>

            {/* Rows */}
            {users.map((u) => {
              const updateRoleAction = updateUserRole.bind(null, u.id);
              const toggleBanAction = toggleUserBan.bind(null, u.id, u.isBanned);
              const isSelf = u.id === currentUser.id;

              return (
                <div
                  key={u.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 110px 90px 80px 90px 280px",
                    gap: 8,
                    padding: "12px 16px",
                    borderBottom: "1px solid #21262d",
                    alignItems: "center",
                    opacity: u.isBanned ? 0.6 : 1,
                  }}
                >
                  {/* Nickname */}
                  <div>
                    <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                      {u.nickname}
                    </span>
                    {isSelf && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#22c55e",
                          marginLeft: 6,
                          backgroundColor: "rgba(34,197,94,0.1)",
                          padding: "1px 5px",
                          borderRadius: 4,
                        }}
                      >
                        {isKo ? "나" : "You"}
                      </span>
                    )}
                  </div>

                  {/* Role badge */}
                  <div>{roleBadge(u.role)}</div>

                  {/* Ban status */}
                  <div>
                    {u.isBanned ? (
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
                        {isKo ? "차단됨" : "Banned"}
                      </span>
                    ) : (
                      <span style={{ color: "#484f58", fontSize: 12 }}>—</span>
                    )}
                  </div>

                  {/* Points */}
                  <div style={{ color: "#8b949e", fontSize: 13 }}>
                    {u.totalPoints.toLocaleString()}
                  </div>

                  {/* Joined */}
                  <div style={{ color: "#484f58", fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions (disabled for self) */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {isSelf ? (
                      <span style={{ color: "#484f58", fontSize: 12 }}>
                        {isKo ? "본인 계정" : "Your account"}
                      </span>
                    ) : (
                      <>
                        {/* Role selector */}
                        <form action={updateRoleAction} style={{ display: "flex", gap: 4 }}>
                          <select
                            name="role"
                            defaultValue={u.role}
                            style={{
                              background: "#0d1117",
                              border: "1px solid #30363d",
                              borderRadius: 5,
                              color: "#e6edf3",
                              fontSize: 12,
                              padding: "4px 8px",
                              cursor: "pointer",
                            }}
                          >
                            <option value="user">{isKo ? "사용자" : "User"}</option>
                            <option value="moderator">{isKo ? "모더레이터" : "Moderator"}</option>
                            <option value="admin">{isKo ? "관리자" : "Admin"}</option>
                          </select>
                          <button
                            type="submit"
                            style={{
                              background: "rgba(59,130,246,0.1)",
                              color: "#3b82f6",
                              border: "1px solid rgba(59,130,246,0.25)",
                              borderRadius: 5,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isKo ? "저장" : "Save"}
                          </button>
                        </form>

                        {/* Ban toggle */}
                        <form action={toggleBanAction}>
                          <button
                            type="submit"
                            style={{
                              background: u.isBanned
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(239,68,68,0.1)",
                              color: u.isBanned ? "#22c55e" : "#ef4444",
                              border: `1px solid ${u.isBanned ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                              borderRadius: 5,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {u.isBanned
                              ? isKo ? "차단 해제" : "Unban"
                              : isKo ? "차단" : "Ban"}
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
                href={`${baseUrl}?q=${q}&role=${roleFilter}&page=${p}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: p === currentPage ? 700 : 400,
                  backgroundColor: p === currentPage ? "#22c55e" : "#161b22",
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
