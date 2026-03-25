"use client";

interface LoginButtonProps {
  locale: "ko" | "en";
  className?: string;
}

export default function LoginButton({ locale, className = "" }: LoginButtonProps) {
  const label = locale === "ko" ? "로그인" : "Sign In";
  const href = `/${locale}/auth/login`;

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors no-underline ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      {label}
    </a>
  );
}
