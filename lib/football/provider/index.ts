import { RealFootballProvider } from "./real";
import { MockFootballProvider } from "./mock";
import type { IFootballProvider } from "./types";

export function createFootballProvider(): IFootballProvider {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const host = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";

  // FOOTBALL_MOCK_MODE=true → use in-memory mock data (instant, no API calls).
  // Recommended for local development to avoid overseas API latency.
  if (!apiKey || process.env.FOOTBALL_MOCK_MODE === "true") {
    return new MockFootballProvider();
  }

  return new RealFootballProvider(apiKey, host);
}

// Singleton - created once per server context
let _provider: IFootballProvider | null = null;

export function getFootballProvider(): IFootballProvider {
  if (!_provider) {
    _provider = createFootballProvider();
  }
  return _provider;
}

export type { IFootballProvider } from "./types";
export { RealFootballProvider } from "./real";
