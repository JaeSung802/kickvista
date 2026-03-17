interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const spinnerSize = { sm: 20, md: 32, lg: 48 };
const borderWidth = { sm: 2, md: 3, lg: 4 };
const fontSize = { sm: 12, md: 14, lg: 16 };

export default function LoadingState({ message, size = "md" }: LoadingStateProps) {
  const s = spinnerSize[size];
  const bw = borderWidth[size];
  const fs = fontSize[size];

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      style={{ padding: size === "lg" ? 48 : size === "md" ? 32 : 20 }}
    >
      {/* Spinner — animation defined in globals.css as .kv-spinner */}
      <div
        className="kv-spinner"
        style={{ width: s, height: s, borderWidth: bw }}
      />

      {message && (
        <p style={{ color: "#8b949e", fontSize: fs, margin: 0, textAlign: "center" }}>
          {message}
        </p>
      )}
    </div>
  );
}
