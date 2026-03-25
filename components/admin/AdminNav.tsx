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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 flex-wrap py-2.5">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="text-sm font-bold text-gray-800">
              {isKo ? "관리자 패널" : "Admin Panel"}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                role === "admin"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-blue-700 bg-blue-50 border-blue-200"
              }`}
            >
              {role === "admin"
                ? isKo ? "관리자" : "ADMIN"
                : isKo ? "모더레이터" : "MOD"}
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex gap-1">
            {items.map((item) => {
              const active =
                item.href === pathname ||
                (pathname.startsWith(item.href + "/") &&
                  item.href !== pathname.replace(/\/[^/]+$/, ""));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border-b-2 ${
                    active
                      ? "text-gray-900 bg-gray-100 border-emerald-600"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent"
                  }`}
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
