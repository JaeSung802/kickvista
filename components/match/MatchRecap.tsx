import Image from "next/image";
import type { MatchAnalysis } from "@/lib/ai-analysis";
import type { FixturePlayerStats } from "@/lib/football/types";
import type { Locale } from "@/lib/i18n";

interface RecapLike {
  mom: {
    name: string;
    reason: string;
    reasonKo: string;
  };
  highlights: Array<{
    icon: string;
    text: string;
    textKo: string;
  }>;
  narrative: Array<{
    en: string;
    ko: string;
  }>;
}

interface MatchRecapProps {
  locale:    Locale;
  dbRecap:   MatchAnalysis | null;
  recap:     RecapLike | null;
  momPlayer: FixturePlayerStats | null;
}

export default function MatchRecap({
  locale,
  dbRecap,
  recap,
  momPlayer,
}: MatchRecapProps) {
  const isKo = locale === "ko";

  return (
    <div className="flex flex-col gap-6">

      {/* AI badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
        <span className="text-base shrink-0">🤖</span>
        <p className="text-xs font-medium text-blue-700">
          {isKo
            ? "AI가 분석한 경기 요약입니다. 통계 데이터를 바탕으로 자동 생성됩니다."
            : "AI-analysed match summary, auto-generated from match statistics."}
        </p>
      </div>

      {/* MOM Card */}
      <div className="bg-linear-to-br from-emerald-600 to-emerald-900 rounded-2xl p-5 text-white">
        <p className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-3">
          {isKo ? "🏅 오늘의 선수 (MOM)" : "🏅 Man of the Match"}
        </p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {momPlayer ? (
              <div className="w-16 h-16 rounded-2xl bg-white/20 overflow-hidden border-2 border-white/30">
                <Image
                  src={`https://media.api-sports.io/football/players/${momPlayer.playerId}.png`}
                  alt={momPlayer.playerName}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">⭐</div>
            )}
            {momPlayer && (
              <span className="absolute -bottom-1.5 -right-1.5 bg-white text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow">
                {(momPlayer.rating ?? 0).toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black leading-tight truncate">
              {momPlayer ? momPlayer.playerName : (recap?.mom.name ?? "–")}
            </p>
            {momPlayer ? (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {momPlayer.goals > 0 && (
                  <span className="flex items-center gap-1 text-sm text-emerald-100">⚽ {momPlayer.goals}{isKo ? "골" : "G"}</span>
                )}
                {momPlayer.assists > 0 && (
                  <span className="flex items-center gap-1 text-sm text-emerald-100">🎯 {momPlayer.assists}{isKo ? "어시스트" : "A"}</span>
                )}
                {momPlayer.shotsTotal > 0 && (
                  <span className="flex items-center gap-1 text-sm text-emerald-100">🎯 {momPlayer.shotsOnTarget}/{momPlayer.shotsTotal} {isKo ? "유효슈팅" : "SOT"}</span>
                )}
                <span className="text-sm text-amber-200">{momPlayer.minutesPlayed}{isKo ? "분 출전" : "min"}</span>
              </div>
            ) : recap ? (
              <p className="text-emerald-100 text-sm mt-1 leading-relaxed">
                {isKo ? recap.mom.reasonKo : recap.mom.reason}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      {(dbRecap?.tips && dbRecap.tips.length > 0) ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {isKo ? "핵심 하이라이트" : "Key Highlights"}
          </p>
          <div className="flex flex-wrap gap-2">
            {dbRecap.tips.map((tip, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 500, color: "#a78bfa", backgroundColor: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 5, padding: "4px 10px" }}>
                {isKo ? tip.labelKo : tip.label}
              </span>
            ))}
          </div>
        </div>
      ) : recap?.highlights && recap.highlights.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {isKo ? "핵심 하이라이트" : "Key Highlights"}
          </p>
          <div className="flex flex-col gap-3">
            {recap.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{h.icon}</span>
                <p className="text-sm text-gray-700 leading-relaxed">{isKo ? h.textKo : h.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Match Narrative */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
          {isKo ? "경기 흐름 분석" : "Match Narrative"}
        </p>
        {dbRecap ? (
          <p className="text-sm text-gray-700 leading-relaxed">{dbRecap.insight}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recap?.narrative.map((para, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {isKo ? para.ko : para.en}
              </p>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5">
          <span>🤖</span>
          {isKo
            ? "이 리캡은 KickVista AI가 경기 데이터를 분석하여 자동 생성했습니다."
            : "This recap was auto-generated by KickVista AI based on match data."}
        </p>
      </div>
    </div>
  );
}
