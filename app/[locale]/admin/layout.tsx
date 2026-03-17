import { redirect, notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getServerUser } from "@/lib/auth";
import { getServerRole, canModerate, isAdmin } from "@/lib/admin/roles";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  // Gate 1: must be authenticated
  const user = await getServerUser();
  if (!user) redirect(`/${loc}/auth/login`);

  // Gate 2: must be at least moderator
  const role = await getServerRole();
  if (!canModerate(role)) redirect(`/${loc}`);

  const adminRole = isAdmin(role);

  const navItems = [
    {
      href: `/${loc}/admin`,
      label: isKo ? "대시보드" : "Dashboard",
    },
    {
      href: `/${loc}/admin/posts`,
      label: isKo ? "게시글" : "Posts",
    },
    {
      href: `/${loc}/admin/comments`,
      label: isKo ? "댓글" : "Comments",
    },
    {
      href: `/${loc}/admin/reports`,
      label: isKo ? "신고" : "Reports",
    },
    ...(adminRole
      ? [
          {
            href: `/${loc}/admin/users`,
            label: isKo ? "사용자" : "Users",
          },
        ]
      : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117" }}>
      <AdminNav items={navItems} role={role ?? "user"} isKo={isKo} />
      {children}
    </div>
  );
}
