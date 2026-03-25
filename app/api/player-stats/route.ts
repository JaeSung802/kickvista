import { currentFootballSeason } from "@/lib/football/constants";

/**
 * GET /api/player-stats?id={playerId}&season={year}
 *
 * Proxies to api-sports /players endpoint so the API key stays server-side.
 * Returns the first response entry (player + statistics array), or null.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id     = searchParams.get("id");
  const season = searchParams.get("season") ?? String(currentFootballSeason());

  if (!id) {
    return Response.json({ error: "Missing player id" }, { status: 400 });
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return Response.json(null); // graceful: client falls back to existing data
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/players?id=${id}&season=${season}`,
      {
        headers: { "x-apisports-key": apiKey },
        next: { revalidate: 3600 }, // cache for 1 hour
      },
    );

    if (!res.ok) {
      console.warn(`[player-stats] upstream ${res.status} for id=${id}`);
      return Response.json(null);
    }

    const json = await res.json();
    const entry = json.response?.[0] ?? null;
    return Response.json(entry);
  } catch (err) {
    console.error("[player-stats] error:", err);
    return Response.json(null);
  }
}
