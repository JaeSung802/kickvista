import type { Locale } from "@/lib/i18n";

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  "yellow-card": "🟨",
  "red-card": "🟥",
  substitution: "🔄",
};

interface TickerEvent {
  team: "home" | "away";
  player: string;
  assist?: string;
  type: string;
  minute: number;
}

interface MatchTickerProps {
  events: TickerEvent[];
  isFinished: boolean;
  locale: Locale;
  tickerTitle: string;
  assistLabel: string;
}

export default function MatchTicker({
  events,
  isFinished,
  locale,
  tickerTitle,
  assistLabel,
}: MatchTickerProps) {
  return (
    <section>
      <h3 style={{ color: "#111827", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
        {tickerTitle}
      </h3>
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {events.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: 13, padding: "24px 20px", margin: 0, textAlign: "center" }}>
            {isFinished
              ? (locale === "ko" ? "경기 이벤트 데이터가 없습니다." : "No match events available.")
              : (locale === "ko" ? "경기 시작 후 이벤트가 표시됩니다." : "Events will appear once the match kicks off.")}
          </p>
        ) : null}
        {events.map((event, idx) => {
          const isHome = event.team === "home";
          return (
            <div
              key={idx}
              style={{ display: "flex", alignItems: "center", padding: "12px 20px", borderBottom: idx < events.length - 1 ? "1px solid #f3f4f6" : "none", gap: 12, flexDirection: isHome ? ("row" as const) : ("row-reverse" as const) }}
            >
              <div style={{ flex: 1, textAlign: isHome ? ("left" as const) : ("right" as const) }}>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>{event.player}</span>
                {event.assist && event.type === "goal" && (
                  <span style={{ color: "#6b7280", fontSize: 11, display: "block" }}>
                    {assistLabel}: {event.assist}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1" style={{ minWidth: 64 }}>
                <span style={{ fontSize: 18 }}>{EVENT_ICONS[event.type]}</span>
                <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, backgroundColor: "#f9fafb", borderRadius: 4, padding: "1px 7px", border: "1px solid #e5e7eb" }}>
                  {event.minute}&apos;
                </span>
              </div>
              <div style={{ flex: 1 }} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
