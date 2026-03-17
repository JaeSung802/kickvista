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
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 18px",
        borderRadius: 8,
        border: "1.5px solid #30363d",
        backgroundColor: "transparent",
        color: "#e6edf3",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#22c55e";
        e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#30363d";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Login icon */}
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
      {label}
    </a>
  );
}
