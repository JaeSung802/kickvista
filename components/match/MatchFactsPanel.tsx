import type { Locale } from "@/lib/i18n";

interface MatchFactsPanelProps {
  locale: Locale;
  leagueSlug: string;
  round: string;
  formattedDate: string;
  venue?: string;
  isInactive: boolean;
  isCancelled: boolean;
}

export default function MatchFactsPanel({
  locale,
  leagueSlug,
  round,
  formattedDate,
  venue,
  isInactive,
  isCancelled,
}: MatchFactsPanelProps) {
  const isKo = locale === "ko";

  return (
    <>
      {/* Match info card */}
      <section>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px" }}>
          <h3 style={{ color: "#111827", fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>
            {isKo ? "경기 정보" : "Match Info"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                label: isKo ? "대회" : "Competition",
                value: leagueSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              },
              { label: isKo ? "라운드" : "Round", value: round },
              {
                label: isKo ? "날짜" : "Date",
                value: formattedDate,
              },
              { label: isKo ? "경기장" : "Venue", value: venue ?? "–" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#9ca3af", fontSize: 12, minWidth: 60, paddingTop: 1 }}>{label}</span>
                <span style={{ color: "#374151", fontSize: 13, flex: 1 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PST/CANC notice */}
      {isInactive && (
        <section>
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
            <span style={{ fontSize: 44 }}>📅</span>
            <p style={{ color: "#92400e", fontSize: 16, fontWeight: 700, margin: 0 }}>
              {isCancelled
                ? (locale === "ko" ? "이 경기는 취소되었습니다" : "This match has been cancelled")
                : (locale === "ko" ? "이 경기는 연기되었습니다" : "This match has been postponed")}
            </p>
            <p style={{ color: "#b45309", fontSize: 13, margin: 0, maxWidth: 400, lineHeight: 1.7 }}>
              {isCancelled
                ? (locale === "ko"
                    ? "경기가 취소되어 더 이상 진행되지 않습니다."
                    : "This fixture has been cancelled and will not take place.")
                : (locale === "ko"
                    ? "이 경기는 일정에 따라 연기되었습니다. 새로운 일정이 확정되면 업데이트됩니다."
                    : "This match has been postponed. The page will be updated once a new date is confirmed.")}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
