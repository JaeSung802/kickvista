import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/auth";
import { getServerRole, isAdmin } from "@/lib/admin/roles";
import { updateUserRole, toggleUserBan, resendVerificationEmail } from "@/lib/admin/actions";
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
  email: string;
  emailVerified: boolean;
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
  searchParams: Promise<{ q?: string; role?: string; verified?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  const currentUser = await getServerUser();
  if (!currentUser) redirect(`/${loc}/auth/login`);

  const role = await getServerRole();
  if (!isAdmin(role)) redirect(`/${loc}/admin`);

  const { q = "", role: roleFilter = "all", verified: verifiedFilter = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let users: AdminUser[] = [];
  let total = 0;

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("profiles")
      .select("id, nickname, role, is_banned, total_points, created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (q.trim()) {
      query = query.ilike("nickname", `%${q.trim()}%`);
    }
    if (roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    // Verification filter: fetch auth users and filter by email_confirmed_at
    if (verifiedFilter !== "all") {
      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const filteredIds = authUsers
        .filter((u) =>
          verifiedFilter === "confirmed" ? !!u.email_confirmed_at : !u.email_confirmed_at
        )
        .map((u) => u.id);
      query = query.in("id", filteredIds.length > 0 ? filteredIds : ["__none__"]);
    }

    query = query.range(offset, offset + PAGE_SIZE - 1);
    const { data, count } = await query;

    total = count ?? 0;

    // Batch-fetch auth data for this page's users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileRows = (data as any[]) ?? [];
    const authResults = await Promise.all(
      profileRows.map((p) => adminClient.auth.admin.getUserById(p.id))
    );
    const authMap = new Map(
      authResults
        .filter(({ data: { user } }) => user !== null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(({ data: { user } }: any) => [
          user.id,
          { email: user.email ?? "—", emailVerified: !!user.email_confirmed_at },
        ])
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users = profileRows.map((row: any) => ({
      id: row.id,
      nickname: row.nickname ?? "—",
      email: authMap.get(row.id)?.email ?? "—",
      emailVerified: authMap.get(row.id)?.emailVerified ?? false,
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
    { value: "all",       label: isKo ? "전체 역할"    : "All Roles"  },
    { value: "user",      label: isKo ? "일반 사용자"  : "User"       },
    { value: "moderator", label: isKo ? "모더레이터"   : "Moderator"  },
    { value: "admin",     label: isKo ? "관리자"       : "Admin"      },
  ];

  const verifiedOptions = [
    { value: "all",        label: isKo ? "전체"      : "All"          },
    { value: "confirmed",  label: isKo ? "인증 완료" : "Verified"     },
    { value: "unconfirmed",label: isKo ? "미인증"    : "Unverified"   },
  ];

  function roleBadge(userRole: string) {
    const styles: Record<string, { bg: string; color: string; border: string; label: string }> = {
      admin: {
        bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)",
        label: isKo ? "관리자" : "Admin",
      },
      moderator: {
        bg: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "rgba(59,130,246,0.25)",
        label: isKo ? "모더레이터" : "Mod",
      },
      user: {
        bg: "rgba(139,148,158,0.12)", color: "#6b7280", border: "rgba(139,148,158,0.2)",
        label: isKo ? "사용자" : "User",
      },
    };
    const s = styles[userRole] ?? styles.user;
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
        backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
        {s.label}
      </span>
    );
  }

  function verifiedBadge(verified: boolean) {
    return verified ? (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
        backgroundColor: "rgba(34,197,94,0.1)", color: "#059669",
        border: "1px solid rgba(34,197,94,0.25)", whiteSpace: "nowrap" }}>
        {isKo ? "인증됨" : "Verified"}
      </span>
    ) : (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
        backgroundColor: "rgba(156,163,175,0.12)", color: "#9ca3af",
        border: "1px solid rgba(156,163,175,0.25)", whiteSpace: "nowrap" }}>
        {isKo ? "미인증" : "Unverified"}
      </span>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#ffffff", padding: "28px 0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: "#ef4444", flexShrink: 0 }} />
            <h1 style={{ color: "#111827", fontSize: 20, fontWeight: 900, margin: 0 }}>
              {isKo ? "사용자 관리" : "User Management"}
            </h1>
            <span style={{ color: "#6b7280", fontSize: 13, marginLeft: 4 }}>
              ({total.toLocaleString()})
            </span>
          </div>

          {/* Filters */}
          <form method="GET" action={baseUrl}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input name="q" defaultValue={q}
              placeholder={isKo ? "닉네임 검색..." : "Search by nickname..."}
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 7,
                color: "#111827", fontSize: 13, padding: "7px 12px", width: 200, outline: "none" }} />
            <select name="role" defaultValue={roleFilter}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7,
                color: "#111827", fontSize: 13, padding: "7px 12px", cursor: "pointer" }}>
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select name="verified" defaultValue={verifiedFilter}
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7,
                color: "#111827", fontSize: 13, padding: "7px 12px", cursor: "pointer" }}>
              {verifiedOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button type="submit"
              style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 7,
                padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {isKo ? "검색" : "Search"}
            </button>
            {(q || roleFilter !== "all" || verifiedFilter !== "all") && (
              <a href={baseUrl} style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>
                {isKo ? "초기화" : "Reset"}
              </a>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {users.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280", padding: "60px 0", fontSize: 14 }}>
            {isKo ? "사용자가 없습니다." : "No users found."}
          </div>
        ) : (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb",
            borderRadius: 10, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{ display: "grid",
              gridTemplateColumns: "1.2fr 1.4fr 120px 90px 80px 90px 260px",
              gap: 8, padding: "10px 16px", borderBottom: "1px solid #f3f4f6",
              fontSize: 11, fontWeight: 700, color: "#6b7280",
              letterSpacing: "0.06em", textTransform: "uppercase" }}>
              <span>{isKo ? "닉네임" : "Nickname"}</span>
              <span>{isKo ? "이메일" : "Email"}</span>
              <span>{isKo ? "인증 상태" : "Verified"}</span>
              <span>{isKo ? "역할" : "Role"}</span>
              <span>{isKo ? "차단" : "Ban"}</span>
              <span>{isKo ? "가입일" : "Joined"}</span>
              <span>{isKo ? "관리" : "Manage"}</span>
            </div>

            {/* Rows */}
            {users.map((u) => {
              const updateRoleAction = updateUserRole.bind(null, u.id);
              const toggleBanAction = toggleUserBan.bind(null, u.id, u.isBanned);
              const resendAction = resendVerificationEmail.bind(null, u.id);
              const isSelf = u.id === currentUser.id;

              return (
                <div key={u.id} style={{ display: "grid",
                  gridTemplateColumns: "1.2fr 1.4fr 120px 90px 80px 90px 260px",
                  gap: 8, padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
                  alignItems: "center", opacity: u.isBanned ? 0.6 : 1 }}>

                  {/* Nickname */}
                  <div>
                    <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>
                      {u.nickname}
                    </span>
                    {isSelf && (
                      <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 6,
                        backgroundColor: "rgba(239,68,68,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                        {isKo ? "나" : "You"}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div style={{ color: "#6b7280", fontSize: 12, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </div>

                  {/* Verification badge */}
                  <div>{verifiedBadge(u.emailVerified)}</div>

                  {/* Role badge */}
                  <div>{roleBadge(u.role)}</div>

                  {/* Ban status */}
                  <div>
                    {u.isBanned ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px",
                        borderRadius: 20, backgroundColor: "rgba(239,68,68,0.12)",
                        color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                        {isKo ? "차단됨" : "Banned"}
                      </span>
                    ) : (
                      <span style={{ color: "#6b7280", fontSize: 12 }}>—</span>
                    )}
                  </div>

                  {/* Joined */}
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {isSelf ? (
                      <span style={{ color: "#6b7280", fontSize: 12 }}>
                        {isKo ? "본인 계정" : "Your account"}
                      </span>
                    ) : (
                      <>
                        {/* Resend verification email (only for unverified) */}
                        {!u.emailVerified && (
                          <form action={resendAction}>
                            <button type="submit"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444",
                                border: "1px solid rgba(239,68,68,0.25)", borderRadius: 5,
                                padding: "4px 8px", fontSize: 11, fontWeight: 600,
                                cursor: "pointer", whiteSpace: "nowrap" }}>
                              {isKo ? "인증 메일 재발송" : "Resend"}
                            </button>
                          </form>
                        )}

                        {/* Role selector */}
                        <form action={updateRoleAction} style={{ display: "flex", gap: 4 }}>
                          <select name="role" defaultValue={u.role}
                            style={{ background: "#f9fafb", border: "1px solid #e5e7eb",
                              borderRadius: 5, color: "#111827", fontSize: 12,
                              padding: "4px 8px", cursor: "pointer" }}>
                            <option value="user">{isKo ? "사용자" : "User"}</option>
                            <option value="moderator">{isKo ? "모더레이터" : "Moderator"}</option>
                            <option value="admin">{isKo ? "관리자" : "Admin"}</option>
                          </select>
                          <button type="submit"
                            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6",
                              border: "1px solid rgba(59,130,246,0.25)", borderRadius: 5,
                              padding: "4px 8px", fontSize: 11, fontWeight: 600,
                              cursor: "pointer", whiteSpace: "nowrap" }}>
                            {isKo ? "저장" : "Save"}
                          </button>
                        </form>

                        {/* Ban toggle */}
                        <form action={toggleBanAction}>
                          <button type="submit"
                            style={{ background: u.isBanned ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                              color: u.isBanned ? "#059669" : "#ef4444",
                              border: `1px solid ${u.isBanned ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                              borderRadius: 5, padding: "4px 8px", fontSize: 11,
                              fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {u.isBanned ? (isKo ? "차단 해제" : "Unban") : (isKo ? "차단" : "Ban")}
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
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a key={p}
                href={`${baseUrl}?q=${q}&role=${roleFilter}&verified=${verifiedFilter}&page=${p}`}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 34, height: 34, borderRadius: 7, fontSize: 13,
                  fontWeight: p === currentPage ? 700 : 400,
                  backgroundColor: p === currentPage ? "#ef4444" : "#ffffff",
                  color: p === currentPage ? "#ffffff" : "#6b7280",
                  border: "1px solid #e5e7eb", textDecoration: "none" }}>
                {p}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
