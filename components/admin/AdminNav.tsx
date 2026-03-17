"use client";

import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface AdminNavProps {
  items: NavItem[];
  role: string;
  isKo: boolean;
}

export default function AdminNav({ items, role, isKo }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <div
      style={{
        background: "#161b22",
        borderBottom: "1px solid #30363d",
        padding: "0",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🛡️</span>
            <span
              style={{ fontSize: 14, fontWeight: 700, color: "#e6edf3" }}
            >
              {isKo ? "관리자 패널" : "Admin Panel"}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                backgroundColor:
                  role === "admin"
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(59,130,246,0.15)",
                color: role === "admin" ? "#22c55e" : "#3b82f6",
                border: `1px solid ${role === "admin" ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"}`,
                letterSpacing: "0.05em",
              }}
            >
              {role === "admin"
                ? isKo
                  ? "관리자"
                  : "ADMIN"
                : isKo
                ? "모더레이터"
                : "MOD"}
            </span>
          </div>

          {/* Nav items */}
          <nav style={{ display: "flex", gap: 2 }}>
            {items.map((item) => {
              // Exact match for dashboard, prefix match for sub-pages
              const active =
                item.href === pathname ||
                (pathname.startsWith(item.href + "/") &&
                  item.href !== pathname.replace(/\/[^/]+$/, ""));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    color: active ? "#e6edf3" : "#8b949e",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    padding: "6px 12px",
                    borderRadius: 6,
                    backgroundColor: active
                      ? "rgba(255,255,255,0.06)"
                      : "transparent",
                    borderBottom: active
                      ? "2px solid #22c55e"
                      : "2px solid transparent",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
