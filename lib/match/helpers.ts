import type { Locale } from "@/lib/i18n";

export function normaliseEvent(
  e: unknown,
  homeId: number
): { minute: number; type: string; team: "home" | "away"; player: string; assist: string | undefined } | null {
  if (!e || typeof e !== "object") return null;
  const ev = e as Record<string, unknown>;

  const minute: number =
    typeof ev.minute === "number"
      ? ev.minute
      : ((ev.time as Record<string, unknown> | undefined)?.elapsed as number | undefined) ?? 0;

  const rawType = String(ev.type ?? "").toLowerCase();
  const detail  = String(ev.detail ?? "").toLowerCase();
  let type: string;
  if (rawType === "goal")         type = "goal";
  else if (rawType === "card")    type = detail.includes("red") ? "red-card" : "yellow-card";
  else if (rawType === "subst")   type = "substitution";
  else                             type = rawType;

  let team: "home" | "away";
  if (typeof ev.team === "string") {
    team = ev.team === "home" ? "home" : "away";
  } else {
    const teamId = (ev.team as Record<string, unknown> | undefined)?.id as number | undefined;
    team = teamId === homeId ? "home" : "away";
  }

  const player: string =
    typeof ev.player === "string"
      ? ev.player
      : typeof ev.playerName === "string"
      ? ev.playerName
      : (ev.player as Record<string, unknown> | undefined)?.name as string | undefined
      ?? "Unknown";

  const rawAssist = ev.assist ?? ev.assistName;
  const assist: string | undefined =
    typeof rawAssist === "string"
      ? rawAssist || undefined
      : (rawAssist as Record<string, unknown> | undefined)?.name as string | undefined || undefined;

  return { minute, type, team, player, assist };
}

export const STAT_LABEL_MAP: Record<string, { en: string; ko: string }> = {
  "ball possession":    { en: "Possession",       ko: "점유율"      },
  "shots on goal":      { en: "Shots on Target",   ko: "유효슈팅"    },
  "total shots":        { en: "Shots",             ko: "슈팅"        },
  "corner kicks":       { en: "Corners",           ko: "코너킥"      },
  "total passes":       { en: "Passes",            ko: "패스"        },
  "passes %":           { en: "Pass Accuracy",     ko: "패스 성공률" },
  "yellow cards":       { en: "Yellow Cards",      ko: "경고"        },
  "red cards":          { en: "Red Cards",         ko: "퇴장"        },
  "fouls":              { en: "Fouls",             ko: "반칙"        },
  "offsides":           { en: "Offsides",          ko: "오프사이드"  },
};

export function flattenApiStats(
  raw: unknown,
  homeId: number
): Array<{ label: string; labelKo: string; home: string | number; away: string | number }> {
  if (!Array.isArray(raw)) return [];
  const isApiFormat = (raw[0] as Record<string, unknown> | undefined)?.statistics !== undefined;
  if (!isApiFormat) return [];

  const homeTeamEntry = raw.find((entry) => {
    const t = (entry as Record<string, unknown>).team as Record<string, unknown> | undefined;
    return t?.id === homeId;
  }) as Record<string, unknown> | undefined;
  const awayTeamEntry = raw.find((entry) => {
    const t = (entry as Record<string, unknown>).team as Record<string, unknown> | undefined;
    return t?.id !== homeId;
  }) as Record<string, unknown> | undefined;

  if (!homeTeamEntry || !awayTeamEntry) return [];

  const homeStats = homeTeamEntry.statistics as Array<{ type: string; value: unknown }> ?? [];
  const awayStats = awayTeamEntry.statistics as Array<{ type: string; value: unknown }> ?? [];

  return homeStats
    .map((hs) => {
      const as_ = awayStats.find((a) => a.type === hs.type);
      const key = hs.type.toLowerCase();
      const meta = STAT_LABEL_MAP[key];
      if (!meta) return null;
      return {
        label:   meta.en,
        labelKo: meta.ko,
        home: hs.value ?? 0,
        away: as_?.value ?? 0,
      } as { label: string; labelKo: string; home: string | number; away: string | number };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}

export function formatMatchTime(dateStr: string, locale: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleString(locale === "ko" ? "ko-KR" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
}
