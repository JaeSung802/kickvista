// API-Football 이적 데이터 페칭 (서버 전용)
// https://v3.football.api-sports.io/transfers

const TOP_TEAMS = [541, 529, 50, 40, 42, 157, 85, 33];
// Real Madrid, Barcelona, Man City, Liverpool, Arsenal, Bayern, PSG, Man United

const TEAM_FLAG: Record<number, string> = {
  // England
  33: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 34: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 40: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 41: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  42: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 45: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 46: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 47: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  48: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 49: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 50: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 51: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  52: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 55: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 62: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 66: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  // Spain
  529: "🇪🇸", 530: "🇪🇸", 531: "🇪🇸", 532: "🇪🇸", 533: "🇪🇸",
  536: "🇪🇸", 538: "🇪🇸", 541: "🇪🇸", 543: "🇪🇸", 548: "🇪🇸",
  // Germany
  157: "🇩🇪", 159: "🇩🇪", 160: "🇩🇪", 161: "🇩🇪", 162: "🇩🇪",
  163: "🇩🇪", 165: "🇩🇪", 169: "🇩🇪", 173: "🇩🇪",
  // France
  77: "🇫🇷", 79: "🇫🇷", 80: "🇫🇷", 81: "🇫🇷", 82: "🇫🇷",
  83: "🇫🇷", 84: "🇫🇷", 85: "🇫🇷", 91: "🇫🇷", 93: "🇫🇷",
  // Italy
  487: "🇮🇹", 488: "🇮🇹", 489: "🇮🇹", 492: "🇮🇹", 494: "🇮🇹",
  496: "🇮🇹", 497: "🇮🇹", 499: "🇮🇹", 500: "🇮🇹", 505: "🇮🇹",
  // Portugal
  210: "🇵🇹", 212: "🇵🇹", 217: "🇵🇹", 228: "🇵🇹", 231: "🇵🇹",
  // Netherlands
  194: "🇳🇱", 197: "🇳🇱",
  // Turkey
  611: "🇹🇷", 645: "🇹🇷",
  // Saudi Arabia
  2282: "🇸🇦", 2283: "🇸🇦", 2284: "🇸🇦", 2285: "🇸🇦",
  // USA / MLS
  1610: "🇺🇸", 1605: "🇺🇸", 1606: "🇺🇸",
  // Brazil
  118: "🇧🇷", 119: "🇧🇷", 120: "🇧🇷",
  // Argentina
  435: "🇦🇷", 442: "🇦🇷",
  // Korea
  2359: "🇰🇷",
  // Japan
  308: "🇯🇵",
};

export interface APITransferItem {
  playerName: string;
  playerId: number;
  date: string;
  fee: string;
  fromTeam: string;
  fromFlag: string;
  toTeam: string;
  toFlag: string;
}

export async function fetchRecentTransfers(): Promise<APITransferItem[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return [];

  try {
    const responses = await Promise.allSettled(
      TOP_TEAMS.map((id) =>
        fetch(
          `https://v3.football.api-sports.io/transfers?team=${id}&season=2025`,
          {
            headers: { "x-apisports-key": key },
            next: { revalidate: 3600 },
          }
        ).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      )
    );

    const flat: APITransferItem[] = [];
    const seen = new Set<string>();

    for (const res of responses) {
      if (res.status !== "fulfilled") continue;
      for (const item of (res.value?.response ?? [])) {
        for (const t of (item.transfers ?? [])) {
          const dedupKey = `${item.player?.id}-${t.date}-${t.teams?.in?.id}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          const raw: string = t.type ?? "";
          const fee = raw === "N/A" || raw === "" ? "미공개" : raw;

          flat.push({
            playerName: item.player?.name ?? "Unknown",
            playerId: item.player?.id ?? 0,
            date: t.date ?? "",
            fee,
            fromTeam: t.teams?.out?.name ?? "",
            fromFlag: TEAM_FLAG[t.teams?.out?.id] ?? "🏳️",
            toTeam: t.teams?.in?.name ?? "",
            toFlag: TEAM_FLAG[t.teams?.in?.id] ?? "🏳️",
          });
        }
      }
    }

    return flat
      .filter((t) => !!t.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  } catch {
    return [];
  }
}
