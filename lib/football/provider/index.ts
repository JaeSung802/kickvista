import { MockFootballProvider } from "./mock";
import { RealFootballProvider } from "./real";
import type { IFootballProvider } from "./types";

export function createFootballProvider(): IFootballProvider {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const host = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";
  const mockMode = process.env.FOOTBALL_MOCK_MODE === "true" || !apiKey;

  if (mockMode) {
    console.log("[football-provider] Using mock provider");
    return new MockFootballProvider();
  }

  console.log("[football-provider] Using real API provider");
  return new RealFootballProvider(apiKey!, host);
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
export { MockFootballProvider } from "./mock";
export { RealFootballProvider } from "./real";
