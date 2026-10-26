/**
 * Match page core data (events, lineups, team statistics) parsed from the
 * API-Football /fixtures?id= response — the same response the page already
 * fetches, so no extra request is made.
 *
 * Only values present in the response are kept. A section the response does
 * not carry is `null` (shown as "not provided"); nothing is filled in.
 */

export type CoreEventKind =
  | "goal" | "own-goal" | "penalty-goal" | "missed-penalty"
  | "yellow-card" | "second-yellow" | "red-card"
  | "substitution" | "var" | "other";

export interface CoreEvent {
  elapsed: number;
  extra: number | null;
  side: "home" | "away" | null;
  kind: CoreEventKind;
  /** Provider's own type / detail text, shown for "var" and "other". */
  typeRaw: string;
  detailRaw: string;
  player: string | null;
  /** Goals: the assisting player. Unused for substitutions (see playerIn / playerOut). */
  assist: string | null;
  /** Substitutions: set only when the direction could be read from the lineups. */
  playerIn: string | null;
  playerOut: string | null;
}

export interface CoreLineupPlayer {
  id: number | null;
  name: string;
  number: number | null;
  pos: string | null;
}

export interface CoreLineup {
  formation: string | null;
  coach: string | null;
  startXI: CoreLineupPlayer[];
  substitutes: CoreLineupPlayer[];
}

export interface CoreStatRow {
  type: string;
  home: number | string | null;
  away: number | string | null;
}

export interface MatchCore {
  events: CoreEvent[] | null;
  lineups: { home: CoreLineup | null; away: CoreLineup | null } | null;
  statistics: CoreStatRow[] | null;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function eventKind(type: string, detail: string): CoreEventKind {
  const t = type.toLowerCase(), d = detail.toLowerCase();
  if (t === "goal") {
    if (d === "normal goal") return "goal";
    if (d === "own goal") return "own-goal";
    if (d === "penalty") return "penalty-goal";
    if (d === "missed penalty") return "missed-penalty";
    return "other";
  }
  if (t === "card") {
    if (d === "yellow card") return "yellow-card";
    if (d === "second yellow card") return "second-yellow";
    if (d === "red card") return "red-card";
    return "other";
  }
  if (t === "subst") return "substitution";
  if (t === "var") return "var";
  return "other";
}

function parsePlayer(v: unknown): CoreLineupPlayer | null {
  const p = obj(obj(v)?.player);
  const name = str(p?.name);
  if (!p || !name) return null;
  return { id: num(p.id), name, number: num(p.number), pos: str(p.pos) };
}

function parseLineup(v: unknown): CoreLineup | null {
  const l = obj(v);
  if (!l) return null;
  const startXI = Array.isArray(l.startXI) ? l.startXI.map(parsePlayer).filter((x): x is CoreLineupPlayer => !!x) : [];
  const substitutes = Array.isArray(l.substitutes) ? l.substitutes.map(parsePlayer).filter((x): x is CoreLineupPlayer => !!x) : [];
  if (!startXI.length) return null;
  return { formation: str(l.formation), coach: str(obj(l.coach)?.name), startXI, substitutes };
}

function statValue(v: unknown): number | string | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

export function parseMatchCore(raw: unknown, homeId: number, awayId: number): MatchCore {
  const r = obj(raw) ?? {};
  const sideOf = (team: unknown): "home" | "away" | null => {
    const id = num(obj(team)?.id);
    return id === homeId ? "home" : id === awayId ? "away" : null;
  };

  // Lineups
  let lineups: MatchCore["lineups"] = null;
  const startIds: Record<"home" | "away", Set<number>> = { home: new Set(), away: new Set() };
  if (Array.isArray(r.lineups) && r.lineups.length) {
    const bySide: { home: CoreLineup | null; away: CoreLineup | null } = { home: null, away: null };
    for (const item of r.lineups) {
      const side = sideOf(obj(item)?.team);
      const lineup = parseLineup(item);
      if (side && lineup && !bySide[side]) {
        bySide[side] = lineup;
        for (const p of lineup.startXI) if (p.id !== null) startIds[side].add(p.id);
      }
    }
    if (bySide.home || bySide.away) lineups = bySide;
  }

  // Events, ordered by minute (+ added time); the response order is not chronological.
  let events: MatchCore["events"] = null;
  if (Array.isArray(r.events)) {
    const parsed: (CoreEvent & { _pid: number | null; _aid: number | null; _i: number })[] = [];
    r.events.forEach((v, i) => {
      const e = obj(v);
      const time = obj(e?.time);
      const elapsed = num(time?.elapsed);
      if (!e || elapsed === null) return;
      const typeRaw = str(e.type) ?? "";
      const detailRaw = str(e.detail) ?? "";
      const player = obj(e.player), assist = obj(e.assist);
      parsed.push({
        elapsed, extra: num(time?.extra), side: sideOf(e.team), kind: eventKind(typeRaw, detailRaw), typeRaw, detailRaw,
        player: str(player?.name), assist: str(assist?.name), playerIn: null, playerOut: null,
        _pid: num(player?.id), _aid: num(assist?.id), _i: i,
      });
    });
    parsed.sort((a, b) => a.elapsed - b.elapsed || (a.extra ?? 0) - (b.extra ?? 0) || a._i - b._i);
    // Substitution direction from who is on the pitch (starting XI, then earlier substitutions).
    const onPitch = { home: new Set(startIds.home), away: new Set(startIds.away) };
    for (const e of parsed) {
      if (e.kind !== "substitution" || !e.side || !lineups?.[e.side]) continue;
      const on = onPitch[e.side];
      const pOn = e._pid !== null && on.has(e._pid), aOn = e._aid !== null && on.has(e._aid);
      if (pOn && !aOn && e._aid !== null) { e.playerOut = e.player; e.playerIn = e.assist; on.delete(e._pid!); on.add(e._aid); }
      else if (aOn && !pOn && e._pid !== null) { e.playerOut = e.assist; e.playerIn = e.player; on.delete(e._aid!); on.add(e._pid); }
    }
    events = parsed.map((e) => ({
      elapsed: e.elapsed, extra: e.extra, side: e.side, kind: e.kind, typeRaw: e.typeRaw, detailRaw: e.detailRaw,
      player: e.player, assist: e.assist, playerIn: e.playerIn, playerOut: e.playerOut,
    }));
  }

  // Team statistics: rows in the home team's order, matched by type.
  let statistics: MatchCore["statistics"] = null;
  if (Array.isArray(r.statistics) && r.statistics.length) {
    const lists: Record<"home" | "away", Map<string, number | string | null>> = { home: new Map(), away: new Map() };
    const order: string[] = [];
    for (const item of r.statistics) {
      const side = sideOf(obj(item)?.team);
      const rows = obj(item)?.statistics;
      if (!side || !Array.isArray(rows)) continue;
      for (const row of rows) {
        const type = str(obj(row)?.type);
        if (!type) continue;
        if (!order.includes(type)) order.push(type);
        lists[side].set(type, statValue(obj(row)?.value));
      }
    }
    const built = order.map((type) => ({ type, home: lists.home.get(type) ?? null, away: lists.away.get(type) ?? null }));
    if (built.some((row) => row.home !== null || row.away !== null)) statistics = built;
  }

  return { events, lineups, statistics };
}

/** "63%" → 63, "2.44" → 2.44, 8 → 8; anything else → null (no comparison bar). */
export function statNumber(v: number | string | null): number | null {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  const m = /^(-?\d+(?:\.\d+)?)%?$/.exec(v);
  return m ? Number(m[1]) : null;
}
