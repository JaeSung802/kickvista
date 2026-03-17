"use client";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
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
      {/* Error icon */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          backgroundColor: "rgba(239,68,68,0.12)",
          border: "1.5px solid rgba(239,68,68,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: 24,
        }}
      >
        ⚠️
      </div>

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

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: "transparent",
            color: "#22c55e",
            border: "1.5px solid #22c55e",
            fontWeight: 600,
            fontSize: 14,
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
