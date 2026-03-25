// app/api/matches/route.ts

import { fetchAPI } from "@/lib/api";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const apiPath = `/fixtures?date=${today}`;

  try {
    const data = await fetchAPI(apiPath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseArr = (data as any)?.response;

    return Response.json(responseArr ?? []);
  } catch (error) {
    console.error("[matches] error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
