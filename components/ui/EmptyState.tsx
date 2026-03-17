"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: "48px 24px",
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
      }}
    >
      <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>{icon}</span>

      <h3
        style={{
          color: "#e6edf3",
          fontSize: 18,
          fontWeight: 600,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#8b949e",
          fontSize: 14,
          margin: "0 0 24px",
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {actionLabel && actionHref && (
        <a
          href={actionHref}
          style={{
            display: "inline-block",
            backgroundColor: "#22c55e",
            color: "#0d1117",
            fontWeight: 600,
            fontSize: 14,
            padding: "10px 24px",
            borderRadius: 8,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
