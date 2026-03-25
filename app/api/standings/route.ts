// app/api/standings/route.ts

import { fetchAPI } from "@/lib/api";
import { currentFootballSeason } from "@/lib/football/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("league") ?? "39";
  const seasonParam = searchParams.get("season");
  const season = seasonParam ? parseInt(seasonParam, 10) : currentFootballSeason();
  const apiPath = `/standings?league=${leagueId}&season=${season}`;

  try {
    const data = await fetchAPI(apiPath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseArr = (data as any)?.response;

    return Response.json(responseArr ?? []);
  } catch (error) {
    console.error("[standings] error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
